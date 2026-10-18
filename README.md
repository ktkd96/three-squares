# Three Squares

Three short reads a day. Then get up.

A small mobile web app (PWA) for the few minutes you're sitting down. It shows three curious, true, roughly two-minute pieces each day. There's no feed, no likes and no infinite scroll. When you've read all three, it tells you to get up and come back tomorrow.

**Live:** https://ktkd96.github.io/three-squares/

## Install on a phone

Open the link, then:
- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** ⋮ menu → Add to Home screen / Install app

## Publish changes

Hosted on GitHub Pages from the `main` branch. Commit and push, and the site updates within a minute or two:

```bash
git push
```

## Run it locally

```bash
python3 -m http.server 8765
```

Open http://localhost:8765. To try it on your phone, connect it to the same Wi-Fi and open `http://<your-mac's-ip>:8765`. In Safari, choose Share → Add to Home Screen.

(Offline support needs HTTPS on a real phone. Over plain HTTP on your local network the app still works, just not offline.)

## How it works

- `content.js` is the reading library. Each user starts at piece 1 on their first day and gets the next three each day after that, cycling back to the start when the library runs out. 21 pieces = 7 days.
- `app.js` shows today's three pieces, the reader, the "all done" screen, and the sit timer, which gently nudges you after 10 minutes.
- Reading progress is stored in the browser's `localStorage` on the device. There's no server or account.

## Add a piece

Add an object to the end of `window.PIECES` in `content.js`:

```js
{
  id: "unique-slug",
  kicker: "Science",
  title: "Headline",
  dek: "One-line teaser.",
  body: `Paragraphs separated by blank lines.`
}
```

Aim for 300–400 words. Keep the total a multiple of 3 so every day gets a full set.

## Picks: curating creators

The **Picks** tab recommends creators you've chosen by hand. The pipeline in `curate/` finds candidates, you review them, and only the ones you approve are published.

One-time setup:

```bash
cd curate && npm install
```

1. **Find candidates.** A starter pool of about 95 is already loaded (`node seed.mjs`). To find more on a topic with Claude and web search (needs an `ANTHROPIC_API_KEY`):

   ```bash
   node curate.mjs discover "woodworking" 25
   ```

2. **Check links.** Flags dead links and sites that block automated checks:

   ```bash
   node curate.mjs verify
   ```

3. **Review.** Open http://localhost:8770, then approve, reject or "maybe" each one, set its category, and write the note readers will see. Keyboard: `A` approve, `M` maybe, `R` reject, `J`/`K` next/previous, `O` open link.

   ```bash
   node curate.mjs review
   ```

4. **Publish.** Click **Publish approved** in the review screen (or run `node curate.mjs publish`). That writes `picks.js`. Commit and push to put it online.

Candidates and your decisions live in `curate/data/`, which is kept out of git, so rejected creators are never public. Only `picks.js` is published.
