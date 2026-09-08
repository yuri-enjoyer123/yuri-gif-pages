# Yuri GIF Pages for Komaru

This repository generates 120 static Discord-preview pages from Gifukai:

- 40 girl × girl kiss pages
- 40 girl × girl bite pages
- 40 girl × girl hug pages
- One ready-to-copy Komaru command

The command defaults to `kiss` and accepts an optional Discord mention.

## Deploy

1. Put every file in this folder into a public GitHub repository named `yuri-gif-pages`.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open **Actions → Build and deploy Yuri GIF pages → Run workflow**.
5. Wait for the green check.
6. Open `https://YOUR_GITHUB_NAME.github.io/yuri-gif-pages/`.
7. Use the **Copy command** button on the page. The displayed command already contains the correct GitHub Pages URL.

The pool refreshes every day at approximately 03:17 UTC. You can also refresh it from the Actions tab.

## Test messages

```text
!yuri
!yuri @User
!yuri kiss
!yuri hug @User
!yuri bite @User
```

## Local checks

Requires Node.js 22 or newer.

```bash
npm test
npm run build
```

`npm run build` contacts Gifukai and writes the generated site to `public/`.

## Notes

- The Komaru definition uses no `ponder` blocks.
- It stays below Discord's 2,000-character message limit.
- `manifest.json` reports the number of unique GIFs collected for each action.
- If Gifukai supplies fewer than 40 unique GIFs for an action, that action's 40 page slots reuse valid results.
- A failed build cannot reach the deployment step, so it does not replace a successful Pages artifact.
