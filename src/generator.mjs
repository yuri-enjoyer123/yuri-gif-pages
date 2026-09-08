import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { buildKomaruCommand } from "./command.mjs";
import { isAllowedGif, renderGifPage, renderHomePage } from "./page.mjs";

const DEFAULT_ACTIONS = ["kiss", "bite", "hug"];
const SILENT_LOGGER = { log() {}, warn() {} };

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

async function collectUniqueGifs({
  action,
  fetchGif,
  slotsPerAction,
  maxAttemptsPerAction,
  requestDelayMs,
  logger,
}) {
  const gifsByUrl = new Map();

  for (
    let attempt = 1;
    attempt <= maxAttemptsPerAction && gifsByUrl.size < slotsPerAction;
    attempt += 1
  ) {
    try {
      const payload = await fetchGif(action);

      if (isAllowedGif(payload, action)) {
        gifsByUrl.set(payload.url, payload);
      } else {
        logger.warn(`[${action}] Ignored an invalid or mismatched response.`);
      }
    } catch (error) {
      logger.warn(`[${action}] Attempt ${attempt} failed: ${error.message}`);
    }

    if (requestDelayMs > 0) {
      await sleep(requestDelayMs);
    }
  }

  const gifs = [...gifsByUrl.values()];

  if (gifs.length === 0) {
    throw new Error(`Gifukai returned no valid ff ${action} GIFs.`);
  }

  return gifs;
}

export async function generateSite({
  outputDir,
  baseUrl,
  fetchGif,
  actions = DEFAULT_ACTIONS,
  slotsPerAction = 40,
  maxAttemptsPerAction = 240,
  requestDelayMs = 150,
  logger = SILENT_LOGGER,
}) {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const command = buildKomaruCommand(baseUrl);
  const manifest = {
    generatedAt: new Date().toISOString(),
    slotsPerAction,
    totalSlots: slotsPerAction * actions.length,
    actions: {},
  };

  for (const action of actions) {
    logger.log(`Collecting ${action} GIFs...`);
    const uniqueGifs = await collectUniqueGifs({
      action,
      fetchGif,
      slotsPerAction,
      maxAttemptsPerAction,
      requestDelayMs,
      logger,
    });

    for (let index = 0; index < slotsPerAction; index += 1) {
      const slot = index + 1;
      const gif = uniqueGifs[index % uniqueGifs.length];
      const pagePath = join(outputDir, action, String(slot), "index.html");

      await writeText(
        pagePath,
        renderGifPage({
          action,
          gifUrl: gif.url,
          anime: gif.anime,
          slot,
        }),
      );
    }

    manifest.actions[action] = {
      slots: slotsPerAction,
      uniqueGifs: uniqueGifs.length,
    };

    logger.log(
      `[${action}] ${uniqueGifs.length} unique GIFs across ${slotsPerAction} slots.`,
    );
  }

  await writeText(join(outputDir, "index.html"), renderHomePage({ command }));
  await writeText(join(outputDir, "komaru-command.txt"), `${command}\n`);
  await writeText(join(outputDir, ".nojekyll"), "");
  await writeText(
    join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  logger.log(`Generated ${manifest.totalSlots} static GIF pages.`);
  return manifest;
}
