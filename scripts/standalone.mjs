import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
// Ajv recommends bundling standalone validators so their format helpers ship
// with the generated artifact: https://ajv.js.org/standalone.html
import { buildSync } from "esbuild";
import { fileURLToPath } from "node:url";
export function bundleStandalone(contents) {
  return buildSync({ stdin: { contents, resolveDir: fileURLToPath(new URL("../", import.meta.url)),
    sourcefile: "validators.cjs", loader: "js" }, bundle: true, platform: "browser", format: "cjs",
    write: false, legalComments: "inline" }).outputFiles[0].text;
}

export function createAjv(options = {}) {
  return addFormats(new Ajv2020({ strict: false, ...options }));
}
