export const YURI_TRIGGER = /^!yuri(?: +(kiss|bite|hug))?(?: +(<@!?[0-9]+>))? *$/;

function normalizeBaseUrl(value) {
  const parsed = new URL(value);

  if (parsed.protocol !== "https:") {
    throw new Error("The Pages base URL must use HTTPS.");
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("The Pages base URL cannot contain credentials, a query, or a fragment.");
  }

  const pathname = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${pathname}`;
}

export function inferPagesBaseUrl(environment = process.env) {
  if (environment.PAGES_BASE_URL) {
    return normalizeBaseUrl(environment.PAGES_BASE_URL);
  }

  const repository = environment.GITHUB_REPOSITORY;

  if (!repository) {
    return "https://YOUR_GITHUB_NAME.github.io/yuri-gif-pages";
  }

  const parts = repository.split("/");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("GITHUB_REPOSITORY must use the owner/repository format.");
  }

  const [owner, repositoryName] = parts;
  const accountPagesRepository = `${owner}.github.io`;
  const projectPath =
    repositoryName.toLowerCase() === accountPagesRepository.toLowerCase()
      ? ""
      : `/${repositoryName}`;

  return normalizeBaseUrl(`https://${owner}.github.io${projectPath}`);
}

export function buildKomaruCommand(baseUrl) {
  const safeBaseUrl = normalizeBaseUrl(baseUrl);

  return `<@1379413888126160946>
name "Yuri"
description "Send a random girl x girl kiss, bite, or hug GIF"
when someone says /${YURI_TRIGGER.source}/
scratch pole {match [1]} kiss
|> trim
|> split on " "
|> first
|> save [0]
scratch pole {match [2]} everyone
|> trim
|> split on " "
|> first
|> save [1]
you reply "💞 {user} gave {remember [1]} a yuri **{remember [0]}**! ${safeBaseUrl}/{remember [0]}/{random {1, 40}}/?v={random {1, 999999999}}"
meta cooldown 5`;
}
