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
