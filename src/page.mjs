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
      <img src="${safeGifUrl}" alt="Yuri ${escapeHtml(action)}">
      <figcaption>Source: ${safeAnime}</figcaption>
    </figure>
  </main>
</body>
</html>`;
}

export function renderHomePage({ command }) {
  const safeCommand = escapeHtml(command);

  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta name="description" content="" />
  <meta charset="utf-8">
  <title>Yuri</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="author" content="">
  <link rel="stylesheet" href="css/style.css">
  <script src="http://code.jquery.com/jquery-latest.min.js"></script>
</head>

<body>
  
<div class="container">
  
</div>

<script>
</script>

</body>
</html>`;
}
