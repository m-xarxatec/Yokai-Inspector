import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourcePublic = join(projectRoot, "public");
const outputDir = join(projectRoot, "release");
const goCommand = process.env.GO_BIN || "go";
const goCache = join(tmpdir(), "yokai-go-build-cache");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} terminó con código ${result.status}`);
}

if (!existsSync(sourcePublic)) throw new Error("No existe la carpeta public/");
run("npm", ["run", "build"], { cwd: projectRoot });

const stagingDir = mkdtempSync(join(tmpdir(), "yokai-package-"));
try {
  cpSync(join(projectRoot, "server.go"), join(stagingDir, "server.go"));
  cpSync(sourcePublic, join(stagingDir, "public"), {
    recursive: true,
    filter: (path) => {
      const asset = relative(sourcePublic, path).split(sep).join("/");
      const originalYokai = /^img\/animaciones\/yokai[1-4](?:_enojado)?\.png$/.test(asset);
      return !asset.split("/").includes("originales")
        && !asset.endsWith(".map")
        && !originalYokai
        && asset !== "img/documentos/pasaporteAbierto2.png";
    },
  });

  mkdirSync(outputDir, { recursive: true });
  mkdirSync(goCache, { recursive: true });
  for (const [goos, filename] of [
    ["linux", "YokaiInspector-linux-amd64"],
    ["windows", "YokaiInspector-windows-amd64.exe"],
  ]) {
    const outputPath = join(outputDir, filename);
    console.log(`Generando ${basename(outputPath)}...`);
    run(goCommand, ["build", "-trimpath", "-ldflags=-s -w", "-o", outputPath, "server.go"], {
      cwd: stagingDir,
      env: { ...process.env, GOOS: goos, GOARCH: "amd64", CGO_ENABLED: "0", GO111MODULE: "off", GOCACHE: goCache },
    });
  }
  console.log(`Ejecutables disponibles en ${outputDir}`);
} finally {
  rmSync(stagingDir, { recursive: true, force: true });
}
