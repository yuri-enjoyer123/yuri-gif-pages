import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildKomaruCommand,
  inferPagesBaseUrl,
  YURI_TRIGGER,
} from "../src/command.mjs";
import {
  isAllowedGif,
  renderGifPage,
  renderHomePage,
} from "../src/page.mjs";
import { generateSite } from "../src/generator.mjs";

const validKiss = {
  action: "kiss",
  pairing: "ff",
  anime: "Example Anime",
  url: "https://cdn.gifukai.com/kiss/example.gif",
  filename: "example.gif",
  content_type: "image/gif",
  size_bytes: 123456,
};

test("trigger accepts default action, explicit actions, and optional mentions", () => {
  const cases = [
    ["!yuri", undefined, undefined],
    ["!yuri <@123456789>", undefined, "<@123456789>"],
    ["!yuri kiss", "kiss", undefined],
    ["!yuri bite <@123456789>", "bite", "<@123456789>"],
    ["!yuri hug <@!123456789>", "hug", "<@!123456789>"],
  ];

  for (const [input, expectedAction, expectedTarget] of cases) {
    const match = YURI_TRIGGER.exec(input);
    assert.ok(match, `${input} should match`);
    assert.equal(match[1], expectedAction);
    assert.equal(match[2], expectedTarget);
  }
});

test("trigger rejects unsupported actions and arbitrary search text", () => {
  assert.equal(YURI_TRIGGER.test("!yuri slap"), false);
  assert.equal(YURI_TRIGGER.test("!yuri hug Sandrobina"), false);
  assert.equal(YURI_TRIGGER.test("!yuri bite not-a-mention"), false);
});

test("infers the correct GitHub project Pages URL", () => {
  assert.equal(
    inferPagesBaseUrl({ GITHUB_REPOSITORY: "alice/yuri-gif-pages" }),
    "https://alice.github.io/yuri-gif-pages",
  );
});

test("infers the correct GitHub account Pages URL", () => {
  assert.equal(
    inferPagesBaseUrl({ GITHUB_REPOSITORY: "alice/alice.github.io" }),
    "https://alice.github.io",
  );
});

test("builds one short Komaru definition that points at the page pool", () => {
  const command = buildKomaruCommand("https://alice.github.io/yuri-gif-pages/");

  assert.match(command, /^<@1379413888126160946>\nname "Yuri"/);
  assert.match(command, /scratch pole \{match \[1\]\} kiss/);
  assert.match(command, /scratch pole \{match \[2\]\} everyone/);
  assert.match(
    command,
    /https:\/\/alice\.github\.io\/yuri-gif-pages\/\{remember \[0\]\}\/\{random \{1, 40\}\}\//,
  );
  assert.doesNotMatch(command, /ponder/i);
  assert.ok(command.length < 2000, `command is ${command.length} characters`);
});

test("rejects unsafe base URLs in generated command definitions", () => {
  assert.throws(() => buildKomaruCommand("http://alice.github.io/yuri-gif-pages"));
  assert.throws(() => buildKomaruCommand("https://alice.github.io/path?q=bad"));
});

test("accepts a matching girl x girl Gifukai GIF", () => {
  assert.equal(isAllowedGif(validKiss, "kiss"), true);
});

test("rejects wrong pairing, host, action, and media type", () => {
  assert.equal(isAllowedGif({ ...validKiss, pairing: "fm" }, "kiss"), false);
  assert.equal(
    isAllowedGif({ ...validKiss, url: "https://example.com/kiss/example.gif" }, "kiss"),
    false,
  );
  assert.equal(isAllowedGif(validKiss, "hug"), false);
  assert.equal(isAllowedGif({ ...validKiss, content_type: "image/png" }, "kiss"), false);
});

test("renders a static Open Graph GIF and escapes upstream text", () => {
  const html = renderGifPage({
    action: "kiss",
    gifUrl: validKiss.url,
    anime: "A <script>alert(1)</script>",
    slot: 1,
  });

  assert.match(html, /property="og:image"/);
  assert.match(html, /https:\/\/cdn\.gifukai\.com\/kiss\/example\.gif/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /A &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test("home page includes a copyable Komaru definition and action links", () => {
  const command = buildKomaruCommand("https://alice.github.io/yuri-gif-pages");
  const html = renderHomePage({ command });

  assert.match(html, /id="komaru-command"/);
  assert.match(html, /name &quot;Yuri&quot;/);
  assert.match(html, /href="\.\/kiss\/1\/"/);
  assert.match(html, /href="\.\/bite\/1\/"/);
  assert.match(html, /href="\.\/hug\/1\/"/);
});

test("site generation writes GIF pages, manifest, and the Komaru definition", async (t) => {
  const outputDir = await mkdtemp(join(tmpdir(), "yuri-site-"));
  t.after(() => rm(outputDir, { recursive: true, force: true }));

  const counters = new Map();
  const fetchGif = async (action) => {
    const index = counters.get(action) ?? 0;
    counters.set(action, index + 1);
    return {
      action,
      pairing: "ff",
      anime: `${action} anime ${index + 1}`,
      url: `https://cdn.gifukai.com/${action}/${index + 1}.gif`,
      filename: `${index + 1}.gif`,
      content_type: "image/gif",
      size_bytes: 123456,
    };
  };

  const manifest = await generateSite({
    outputDir,
    baseUrl: "https://alice.github.io/yuri-gif-pages",
    fetchGif,
    slotsPerAction: 2,
    maxAttemptsPerAction: 3,
    requestDelayMs: 0,
  });

  assert.equal(manifest.totalSlots, 6);
  assert.equal(manifest.actions.kiss.uniqueGifs, 2);
  assert.match(
    await readFile(join(outputDir, "kiss", "2", "index.html"), "utf8"),
    /https:\/\/cdn\.gifukai\.com\/kiss\/2\.gif/,
  );
  assert.match(
    await readFile(join(outputDir, "index.html"), "utf8"),
    /https:\/\/alice\.github\.io\/yuri-gif-pages/,
  );
  assert.match(
    await readFile(join(outputDir, "komaru-command.txt"), "utf8"),
    /name "Yuri"/,
  );
  assert.match(
    await readFile(join(outputDir, "manifest.json"), "utf8"),
    /"totalSlots": 6/,
  );
});

test("site generation repeats a valid GIF when an action has fewer unique results", async (t) => {
  const outputDir = await mkdtemp(join(tmpdir(), "yuri-site-repeat-"));
  t.after(() => rm(outputDir, { recursive: true, force: true }));

  const fetchGif = async (action) => ({
    action,
    pairing: "ff",
    anime: "Only one",
    url: `https://cdn.gifukai.com/${action}/only.gif`,
    filename: "only.gif",
    content_type: "image/gif",
    size_bytes: 123456,
  });

  const manifest = await generateSite({
    outputDir,
    baseUrl: "https://alice.github.io/yuri-gif-pages",
    fetchGif,
    actions: ["kiss"],
    slotsPerAction: 3,
    maxAttemptsPerAction: 2,
    requestDelayMs: 0,
  });

  assert.equal(manifest.totalSlots, 3);
  assert.equal(manifest.actions.kiss.uniqueGifs, 1);
  assert.match(
    await readFile(join(outputDir, "kiss", "3", "index.html"), "utf8"),
    /\/kiss\/only\.gif/,
  );
});

test("site generation fails instead of deploying an empty action", async (t) => {
  const outputDir = await mkdtemp(join(tmpdir(), "yuri-site-empty-"));
  t.after(() => rm(outputDir, { recursive: true, force: true }));

  await assert.rejects(
    generateSite({
      outputDir,
      baseUrl: "https://alice.github.io/yuri-gif-pages",
      fetchGif: async () => ({ error: "unavailable" }),
      actions: ["kiss"],
      slotsPerAction: 2,
      maxAttemptsPerAction: 2,
      requestDelayMs: 0,
    }),
    /no valid ff kiss GIFs/i,
  );
});
