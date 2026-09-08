const ACTIONS = new Set(["kiss", "bite", "hug"]);

const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

export function isAllowedGif(payload, requestedAction) {
  if (!payload || typeof payload !== "object") return false;
  if (!ACTIONS.has(requestedAction)) return false;
  if (payload.action !== requestedAction) return false;
  if (payload.pairing !== "ff") return false;
  if (payload.content_type !== "image/gif") return false;

  try {
    const gifUrl = new URL(payload.url);
    return (
      gifUrl.protocol === "https:" &&
      gifUrl.hostname === "cdn.gifukai.com" &&
      gifUrl.pathname.startsWith(`/${requestedAction}/`)
    );
  } catch {
    return false;
  }
}

export function renderGifPage({ action, gifUrl, anime, slot }) {
  if (!ACTIONS.has(action)) {
    throw new Error(`Unsupported action: ${action}`);
  }

  const title = `Yuri ${action} #${slot}`;
  const description = `Random girl × girl anime ${action} GIF from ${anime || "an unknown anime"}.`;
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeAnime = escapeHtml(anime || "Unknown anime");
  const safeGifUrl = escapeHtml(gifUrl);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ec4899">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:image" content="${safeGifUrl}">
  <meta property="og:image:secure_url" content="${safeGifUrl}">
  <meta property="og:image:type" content="image/gif">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${safeGifUrl}">
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      background:
        radial-gradient(circle at 15% 10%, rgba(236, 72, 153, 0.2), transparent 35%),
        radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.2), transparent 38%),
        #110817;
    }
    main { width: min(94vw, 760px); text-align: center; }
    figure {
      margin: 0;
      padding: clamp(0.7rem, 2vw, 1.1rem);
      border: 1px solid rgba(249, 168, 212, 0.22);
      border-radius: 1.5rem;
      background: rgba(28, 15, 35, 0.82);
      box-shadow: 0 1.5rem 5rem rgba(0, 0, 0, 0.42);
    }
    img { display: block; width: 100%; max-height: 72vh; object-fit: contain; border-radius: 1rem; }
    h1 { margin: 0 0 1rem; color: #f9a8d4; font-size: clamp(1.7rem, 5vw, 2.6rem); }
    figcaption { margin-top: 0.85rem; color: #ddd6fe; font-size: 1rem; }
  </style>
</head>
<body>
  <main>
    <h1>${safeTitle}</h1>
    <figure>
      <img src="${safeGifUrl}" alt="Anime girls performing a ${escapeHtml(action)} action">
      <figcaption>Source anime: ${safeAnime}</figcaption>
    </figure>
  </main>
</body>
</html>`;
}

export function renderHomePage({ command }) {
  const safeCommand = escapeHtml(command);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ec4899">
  <title>Yuri GIF Pool</title>
  <meta name="description" content="Static girl x girl GIF pages and a ready-to-copy Komaru command.">
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body {
      min-height: 100vh;
      margin: 0;
      padding: clamp(1.25rem, 4vw, 3rem);
      background:
        radial-gradient(circle at 12% 5%, rgba(236, 72, 153, 0.23), transparent 32rem),
        radial-gradient(circle at 92% 92%, rgba(124, 58, 237, 0.2), transparent 34rem),
        #100716;
      color: #fdf4ff;
    }
    main { width: min(100%, 920px); margin: 0 auto; }
    h1 { margin: 0; color: #f9a8d4; font-size: clamp(2rem, 7vw, 4.3rem); letter-spacing: -0.045em; }
    .intro { max-width: 64ch; color: #ddd6fe; font-size: 1.05rem; line-height: 1.65; }
    .actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem; margin: 2rem 0; }
    .action {
      display: block;
      padding: 1.15rem;
      border: 1px solid rgba(249, 168, 212, 0.24);
      border-radius: 1rem;
      background: rgba(32, 15, 39, 0.74);
      color: #fbcfe8;
      text-decoration: none;
      font-size: 1.1rem;
      font-weight: 750;
      text-align: center;
    }
    .action:hover, .action:focus-visible { border-color: #f472b6; background: rgba(70, 25, 65, 0.8); }
    .panel {
      padding: clamp(1rem, 3vw, 1.5rem);
      border: 1px solid rgba(196, 181, 253, 0.2);
      border-radius: 1.25rem;
      background: rgba(23, 12, 31, 0.86);
      box-shadow: 0 1.5rem 5rem rgba(0, 0, 0, 0.3);
    }
    .panel-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    h2 { margin: 0; font-size: 1.2rem; }
    button {
      min-height: 2.75rem;
      padding: 0.65rem 1rem;
      border: 0;
      border-radius: 0.75rem;
      background: #ec4899;
      color: white;
      font: inherit;
      font-weight: 760;
      cursor: pointer;
    }
    button:hover, button:focus-visible { background: #db2777; }
    pre {
      margin: 1rem 0 0;
      padding: 1rem;
      overflow-x: auto;
      border-radius: 0.85rem;
      background: #09050d;
      color: #f5d0fe;
      font: 0.9rem/1.55 ui-monospace, SFMono-Regular, Consolas, monospace;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .meta { margin-top: 1rem; color: #c4b5fd; }
    .meta a { color: #f9a8d4; }
    @media (max-width: 580px) {
      .actions { grid-template-columns: 1fr; }
      .panel-header { align-items: stretch; flex-direction: column; }
      button { width: 100%; }
    }
  </style>
</head>
<body>
  <main>
    <h1>Yuri GIF Pool</h1>
    <p class="intro">Open a sample GIF, then copy the generated Komaru definition. The command supports kiss, bite, and hug. Kiss is the default.</p>

    <nav class="actions" aria-label="Test GIF actions">
      <a class="action" href="./kiss/1/">Test kiss</a>
      <a class="action" href="./bite/1/">Test bite</a>
      <a class="action" href="./hug/1/">Test hug</a>
    </nav>

    <section class="panel" aria-labelledby="command-heading">
      <div class="panel-header">
        <h2 id="command-heading">Komaru command definition</h2>
        <button id="copy-command" type="button">Copy command</button>
      </div>
      <pre><code id="komaru-command">${safeCommand}</code></pre>
    </section>

    <p class="meta"><a href="./komaru-command.txt">Open plain-text command</a> · <a href="./manifest.json">View current pool counts</a></p>
  </main>
  <script>
    const copyButton = document.querySelector("#copy-command");
    const command = document.querySelector("#komaru-command");

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(command.textContent);
        copyButton.textContent = "Copied";
      } catch {
        copyButton.textContent = "Select and copy below";
      }
    });
  </script>
</body>
</html>`;
}
