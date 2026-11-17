import { join } from "node:path";

const git = (args) =>
  Bun.spawnSync(["git", ...args], { stdout: "pipe", stderr: "inherit" });

const stagedResult = git([
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMR",
  "-z",
]);

if (stagedResult.exitCode !== 0) {
  process.exit(stagedResult.exitCode);
}

const files = stagedResult.stdout
  .toString()
  .split("\0")
  .filter((file) => file.length > 0);

if (files.length === 0) process.exit(0);

const prettierResult = Bun.spawnSync(
  [
    "bunx",
    "--no-install",
    "prettier",
    "--write",
    "--ignore-unknown",
    ...files.map((file) => `../${file}`),
  ],
  { cwd: join(process.cwd(), "backend"), stdout: "inherit", stderr: "inherit" },
);

if (prettierResult.exitCode !== 0) {
  process.exit(prettierResult.exitCode);
}

const stageResult = git(["add", "--", ...files]);
process.exit(stageResult.exitCode);
