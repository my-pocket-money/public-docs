import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(repository, "compatibility/baselines.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function workflowMatrix() {
  const include = config.api_majors.map((entry) => ({
    api_major: entry.api_major,
    contract: entry.contract,
    baseline_kind: entry.baseline.kind,
    baseline_path: entry.baseline.path,
    baseline_ref: entry.baseline.ref,
  }));
  process.stdout.write(JSON.stringify({ include }));
}

function resetBaseline(rawMajor) {
  const apiMajor = Number(rawMajor);
  if (!Number.isInteger(apiMajor)) {
    fail("usage: pnpm baseline:reset <api-major>");
  }

  const entry = config.api_majors.find((candidate) => candidate.api_major === apiMajor);
  if (!entry) {
    fail(`API major ${apiMajor} is not configured`);
  }
  if (entry.baseline.kind !== "development") {
    fail(`API major ${apiMajor} has a released baseline and cannot be reset`);
  }

  const contract = resolve(repository, entry.contract);
  const baseline = resolve(repository, entry.baseline.path);
  mkdirSync(dirname(baseline), { recursive: true });
  copyFileSync(contract, baseline);
  console.log(`Reset API V${apiMajor} development baseline from ${entry.contract}`);
}

const [command, argument] = process.argv.slice(2);

switch (command) {
  case "matrix":
    workflowMatrix();
    break;
  case "reset":
    resetBaseline(argument);
    break;
  default:
    fail("usage: openapi-baseline.mjs <matrix|reset> [api-major]");
}
