import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
const root = "components/hubspot";
const files = [];
function visit(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) visit(file);
    else files.push(file);
  }
}
visit(root);
for (const file of files) {
  const source = readFileSync(file, "utf8");
  if (file.endsWith(".json")) JSON.parse(source);
  if (file.endsWith(".js")) {
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (result.status) throw new Error(result.stderr);
  }
  if (file.endsWith(".html")) {
    for (const match of source.matchAll(/get_asset_url\(['"]([^'"]+)['"]\)/g)) {
      if (!existsSync(resolve(dirname(file), match[1])))
        throw new Error(`Missing asset in ${file}: ${match[1]}`);
    }
  }
}
const theme = JSON.parse(readFileSync(join(root, "theme.json"), "utf8"));
if (!existsSync(resolve(root, theme.preview_path)))
  throw new Error("Theme preview template is missing");
console.log(`Checked ${files.length} component source files and local assets.`);
