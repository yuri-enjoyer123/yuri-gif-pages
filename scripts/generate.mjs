import { fileURLToPath } from "node:url";

import { inferPagesBaseUrl } from "../src/command.mjs";
import { generateSite } from "../src/generator.mjs";

const outputDir = fileURLToPath(new URL("../public/", import.meta.url));
const baseUrl = inferPagesBaseUrl(process.env);

async function fetchGif(action) {
  const endpoint = `https://api.gifukai.com/v1/${action}?pairing=ff&nsfw=false`;
  const response = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      "user-agent": "yuri-gif-pages/1.0",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`${action} request returned HTTP ${response.status}`);
  }

  return response.json();
}

await generateSite({
  outputDir,
  baseUrl,
  fetchGif,
  logger: console,
});
