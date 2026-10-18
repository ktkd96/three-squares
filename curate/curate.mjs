// Curation pipeline for Three Squares "Picks".
//
//   node curate.mjs discover "<topic>" [count]   find candidate creators with Claude + web search
//   node curate.mjs verify                         check every candidate link still works
//   node curate.mjs review                         open the review screen at http://localhost:8770
//   node curate.mjs publish                        write approved picks to ../picks.js
//
// Data lives in curate/data/ (kept out of git): candidates.json, decisions.json.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(here, "data");
const CANDIDATES = path.join(DATA, "candidates.json");
const DECISIONS = path.join(DATA, "decisions.json");
const PICKS_JS = path.join(here, "..", "picks.js");
const MODEL = "claude-opus-5-5";

// ---------- storage ----------

function load(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
}

function save(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function slug(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").slice(0, 60);
}

function normUrl(u) {
  return u.trim().replace(/^http:/, "https:").replace(/\/+$/, "").toLowerCase();
}

// Adds new candidates, skipping any whose URL is already known. Returns how many were added.
export function addCandidates(list, source) {
  const all = load(CANDIDATES, []);
  const seen = new Set(all.map((c) => normUrl(c.url)));
  const ids = new Set(all.map((c) => c.id));
  let added = 0;
  for (const c of list) {
    if (!c.url || seen.has(normUrl(c.url))) continue;
    let id = slug(c.name) || "creator";
    while (ids.has(id)) id += "-2";
    all.push({ id, ...c, source, addedAt: new Date().toISOString(), linkStatus: "unchecked" });
    seen.add(normUrl(c.url));
    ids.add(id);
    added++;
  }
  save(CANDIDATES, all);
  return added;
}

// ---------- discover ----------

const Candidate = z.object({
  name: z.string(),
  platform: z.enum(["youtube", "newsletter", "blog", "podcast", "website", "other"]),
  url: z.string(),
  topic: z.string(),
  blurb: z.string(),
});
const CandidateList = z.object({ candidates: z.array(Candidate) });

const TASTE = `The app is "Three Squares": short, curious, true reading for idle moments.
The taste: smart but not academic, entertaining but not clickbait. Think explainers,
history, science, craft, design, food, language, odd corners of the world. Prefer
independent creators with a consistent track record over big media brands, and
avoid outrage, hustle culture, get-rich content and conspiracy channels.`;

async function discover(topic, count = 25) {
  if (!topic) throw new Error('Usage: node curate.mjs discover "<topic>" [count]');
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error("No API key found. Run: export ANTHROPIC_API_KEY=your-key  (get one at console.anthropic.com)");
  }
  const client = new Anthropic();
  const known = load(CANDIDATES, []).map((c) => c.name);

  // Step 1: research with web search.
  const messages = [{
    role: "user",
    content: `${TASTE}

Find ${count} content creators worth following on the topic: "${topic}".
They can be YouTube channels, newsletters, blogs, podcasts or websites.
Use web search to confirm each one is real and active (or has a strong archive), and to get
its exact official URL (for YouTube, the https://www.youtube.com/@handle URL).
Skip these, which are already on the list: ${known.join(", ") || "(none yet)"}.
For each, give: name, platform, URL, a short topic label, and one factual sentence on what they make.`,
  }];
  const tools = [{ type: "web_search_20260209", name: "web_search", max_uses: 15 }];

  let research;
  for (let i = 0; i < 5; i++) {
    research = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "high" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      tools,
      messages,
    });
    if (research.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: research.content });
  }
  if (research.stop_reason === "refusal") throw new Error("Research request was declined.");
  const notes = research.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");

  // Step 2: turn the research notes into clean JSON.
  const parsed = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: zodOutputFormat(CandidateList) },
    messages: [{
      role: "user",
      content: `Extract every creator from these research notes. Use only URLs that appear in the notes.\n\n${notes}`,
    }],
  });
  if (parsed.stop_reason === "refusal" || !parsed.parsed_output) throw new Error("Could not extract candidates.");

  const added = addCandidates(parsed.parsed_output.candidates, `discover: ${topic}`);
  console.log(`Found ${parsed.parsed_output.candidates.length}, added ${added} new candidates.`);
  console.log(`Run "node curate.mjs verify" to check the links.`);
}

// ---------- verify ----------

async function check(url) {
  const opts = {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
    headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15" },
  };
  try {
    const res = await fetch(url, opts);
    if (res.ok) return "ok";
    if (res.status === 404 || res.status === 410) return "dead";
    return "blocked"; // 403/429 etc: the site refuses bots, check it by hand
  } catch {
    return "unreachable";
  }
}

async function verify() {
  const all = load(CANDIDATES, []);
  const counts = {};
  for (let i = 0; i < all.length; i += 8) {
    await Promise.all(all.slice(i, i + 8).map(async (c) => {
      c.linkStatus = await check(c.url);
      c.checkedAt = new Date().toISOString();
      counts[c.linkStatus] = (counts[c.linkStatus] || 0) + 1;
      if (c.linkStatus !== "ok") console.log(`${c.linkStatus.padEnd(11)} ${c.name}  ${c.url}`);
    }));
  }
  save(CANDIDATES, all);
  console.log("\n" + Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join("  "));
}

// ---------- publish ----------

export function publish() {
  const all = load(CANDIDATES, []);
  const decisions = load(DECISIONS, {});
  const picks = all
    .filter((c) => decisions[c.id]?.status === "approved")
    .map((c) => ({
      id: c.id,
      name: c.name,
      platform: c.platform,
      url: c.url,
      category: decisions[c.id].category || c.topic || "Other",
      note: decisions[c.id].note || c.blurb,
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const out = `// Generated by curate/curate.mjs publish. Edit picks in the review screen, not here.\n` +
    `window.PICKS = ${JSON.stringify({ updated: new Date().toISOString().slice(0, 10), picks }, null, 2)};\n`;
  fs.writeFileSync(PICKS_JS, out);
  console.log(`Published ${picks.length} picks to picks.js`);
  return picks.length;
}

// ---------- review server ----------

function review(port = 8770) {
  const send = (res, status, body, type = "application/json") => {
    res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
    res.end(type === "application/json" ? JSON.stringify(body) : body);
  };
  const readBody = (req) => new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; if (data.length > 1e6) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); } });
  });

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
        return send(res, 200, fs.readFileSync(path.join(here, "review.html")), "text/html; charset=utf-8");
      }
      if (req.method === "GET" && req.url === "/api/state") {
        return send(res, 200, { candidates: load(CANDIDATES, []), decisions: load(DECISIONS, {}) });
      }
      if (req.method === "POST" && req.url === "/api/decision") {
        const { id, status, category, note } = await readBody(req);
        if (!load(CANDIDATES, []).some((c) => c.id === id)) return send(res, 404, { error: "unknown id" });
        if (!["approved", "maybe", "rejected", "pending"].includes(status)) return send(res, 400, { error: "bad status" });
        const decisions = load(DECISIONS, {});
        decisions[id] = {
          status,
          category: String(category || "").trim().slice(0, 40),
          note: String(note || "").trim().slice(0, 400),
          updatedAt: new Date().toISOString(),
        };
        save(DECISIONS, decisions);
        return send(res, 200, decisions[id]);
      }
      if (req.method === "POST" && req.url === "/api/publish") {
        return send(res, 200, { published: publish() });
      }
      send(res, 404, { error: "not found" });
    } catch (err) {
      send(res, 500, { error: err.message });
    }
  });

  // Local only: nobody else on the network can change your picks.
  server.listen(port, "127.0.0.1", () => {
    console.log(`Review screen: http://localhost:${port}  (Ctrl+C to stop)`);
  });
}

// ---------- CLI ----------

const [cmd, ...args] = process.argv.slice(2);
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  try {
    if (cmd === "discover") await discover(args[0], Number(args[1]) || 25);
    else if (cmd === "verify") await verify();
    else if (cmd === "review") review(Number(args[0]) || 8770);
    else if (cmd === "publish") publish();
    else console.log('Commands: discover "<topic>" [count] | verify | review | publish');
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) console.error("No valid API key. Set ANTHROPIC_API_KEY first.");
    else if (err instanceof Anthropic.RateLimitError) console.error("Rate limited. Try again in a minute.");
    else if (err instanceof Anthropic.APIError) console.error(`API error ${err.status}: ${err.message}`);
    else console.error(err.message);
    process.exitCode = 1;
  }
}
