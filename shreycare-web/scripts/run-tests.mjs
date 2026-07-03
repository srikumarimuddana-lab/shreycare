import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["lib", "app", "components"];
const tests = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      if (entry !== "node_modules" && entry !== ".next") {
        walk(path);
      }
      continue;
    }

    if (entry.endsWith(".test.ts")) {
      tests.push(relative(process.cwd(), path));
    }
  }
}

for (const root of roots) {
  try {
    walk(root);
  } catch {
    // Some roots may not exist in future smaller deployments.
  }
}

if (tests.length === 0) {
  console.log("No test files found.");
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", ...tests],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
