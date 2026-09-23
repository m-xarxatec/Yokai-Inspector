import { existsSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const imageRoot = join(projectRoot, "public", "img");
const manifestPath = join(projectRoot, "scripts", "optimized-images.json");
const minimumBytes = 200_000;
const recordCurrent = process.argv.includes("--record-current");
const previousManifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
const nextManifest = {};

function fileHash(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command}: ${result.stderr.trim()}`);
  return result.stdout;
}

function imageFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === "originales") return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return imageFiles(path);
    return entry.isFile() && entry.name.endsWith(".webp") ? [path] : [];
  });
}

function maximumDimension(path) {
  const asset = relative(imageRoot, path).split(sep).join("/");
  if (/^animaciones\/yokai[1-4](?:_enojado)?\.webp$/.test(asset)) return 256;
  if (asset.startsWith("baseCharacters/")) return 1600;
  if (asset.startsWith("backgrounds/")) return 2048;
  if (asset.startsWith("documentos/")) return 2200;
  return 1600;
}

let originalTotal = 0;
let optimizedTotal = 0;
let changed = 0;

for (const path of imageFiles(imageRoot).sort()) {
  const originalBytes = statSync(path).size;
  originalTotal += originalBytes;
  const asset = relative(imageRoot, path).split(sep).join("/");
  const currentHash = fileHash(path);
  if (recordCurrent || previousManifest[asset] === currentHash) {
    nextManifest[asset] = currentHash;
    optimizedTotal += originalBytes;
    continue;
  }
  const maximum = maximumDimension(path);
  if (originalBytes < minimumBytes) {
    nextManifest[asset] = currentHash;
    optimizedTotal += originalBytes;
    continue;
  }

  const info = JSON.parse(run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", path]));
  const { width, height } = info.streams[0];
  const ratio = Math.min(1, maximum / Math.max(width, height));
  const outputWidth = Math.max(2, Math.round(width * ratio / 2) * 2);
  const outputHeight = Math.max(2, Math.round(height * ratio / 2) * 2);
  const temporary = join(dirname(path), "." + basename(path) + ".optimized.tmp.webp");

  try {
    run("ffmpeg", [
      "-y", "-v", "error", "-i", path,
      "-frames:v", "1",
      "-vf", `scale=${outputWidth}:${outputHeight}:flags=lanczos`,
      "-c:v", "libwebp", "-lossless", "0", "-compression_level", "5", "-q:v", "84",
      temporary,
    ]);
    const optimizedBytes = statSync(temporary).size;
    if (optimizedBytes <= originalBytes * 0.9) {
      renameSync(temporary, path);
      optimizedTotal += optimizedBytes;
      nextManifest[asset] = fileHash(path);
      changed += 1;
      console.log(`${relative(imageRoot, path)}: ${(originalBytes / 1024).toFixed(0)} → ${(optimizedBytes / 1024).toFixed(0)} KiB`);
    } else {
      optimizedTotal += originalBytes;
      nextManifest[asset] = currentHash;
    }
  } finally {
    rmSync(temporary, { force: true });
  }
}

writeFileSync(manifestPath, JSON.stringify(nextManifest, null, 2) + "\n");
console.log(`${changed} imágenes optimizadas; total ${(originalTotal / 1048576).toFixed(1)} → ${(optimizedTotal / 1048576).toFixed(1)} MiB`);
