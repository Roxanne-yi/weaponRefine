/**
 * 从 Figma MCP asset URL 拉取切图到 public/figma-assets，避免链接过期。
 * 用法: node scripts/download-figma-assets.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/figma-assets");

/** 与 src/lib/figma-assets.ts 中全部 MCP URL 一致（去重由脚本处理） */
const URLS = [
  "https://www.figma.com/api/mcp/asset/a589d0a1-772f-480a-9f3f-9a0e848f5017",
  "https://www.figma.com/api/mcp/asset/d2783e50-b0f8-406c-b50b-fb6163001fe1",
  "https://www.figma.com/api/mcp/asset/044e464f-81ca-45df-bafd-7c7d4b6a4196",
  "https://www.figma.com/api/mcp/asset/53b58a61-06a4-40c0-83d2-cdd37bd4619c",
  "https://www.figma.com/api/mcp/asset/3b48c5be-064e-4427-b660-ee133a993cc3",
  "https://www.figma.com/api/mcp/asset/8a7930db-d407-4413-b60d-9423ce9115e4",
  "https://www.figma.com/api/mcp/asset/5b76d32e-93dc-463d-9345-835d49ec6792",
  "https://www.figma.com/api/mcp/asset/adebb334-3bdb-4e31-9fab-e2cf36460731",
  "https://www.figma.com/api/mcp/asset/65d9e58c-842b-4e45-bb4c-5205c9842019",
  "https://www.figma.com/api/mcp/asset/c6cba9e2-0a5f-40b4-ab9a-585148f1718a",
  "https://www.figma.com/api/mcp/asset/9bc45b51-9ba3-475b-b144-959b702c77d8",
  "https://www.figma.com/api/mcp/asset/8e7cc149-f060-4785-b538-f6d62a14f178",
  "https://www.figma.com/api/mcp/asset/562151bf-74d6-46c4-a34b-ea879ee1dd70",
  "https://www.figma.com/api/mcp/asset/ce8dbcba-0075-4d2b-99be-22e335631944",
  "https://www.figma.com/api/mcp/asset/4babd8a1-5261-46cf-a50b-99c0f3d2dc45",
  "https://www.figma.com/api/mcp/asset/828ea5cc-2ee3-4113-a962-8f7feb1676ee",
  "https://www.figma.com/api/mcp/asset/3a71bee2-e280-49f4-8d23-9c50a3f40b89",
  "https://www.figma.com/api/mcp/asset/16e383ec-e117-48d7-b29b-f704651ef037",
  "https://www.figma.com/api/mcp/asset/5b15e86f-1ccf-4c6d-9e4b-54b222ae77fb",
  "https://www.figma.com/api/mcp/asset/7cf5f6d9-2977-47be-9076-f9a31a19884c",
  "https://www.figma.com/api/mcp/asset/7d938d0d-87b0-46c7-8913-a506881047f8",
  "https://www.figma.com/api/mcp/asset/55a3b3b8-f59f-420c-8412-47e935dc4fe4",
  "https://www.figma.com/api/mcp/asset/a7dd976e-a25d-4c29-986b-5f5fee10045a",
  "https://www.figma.com/api/mcp/asset/14a6f881-fc3d-4f47-bb5d-6f1bb9c1756f",
  "https://www.figma.com/api/mcp/asset/71bfa9e4-2b47-4773-8173-c53268eb0cfd",
  "https://www.figma.com/api/mcp/asset/711188aa-bf11-4235-b0b3-e4aa7346828c",
  "https://www.figma.com/api/mcp/asset/adb81cfe-bfad-47eb-9290-b3e937482b2e",
  "https://www.figma.com/api/mcp/asset/3fe23214-3b0d-488d-9b20-1649a8108a8b",
  "https://www.figma.com/api/mcp/asset/1cec5225-6d9b-47f1-a2d3-e2b09c189ea2",
  "https://www.figma.com/api/mcp/asset/61999d1b-15cf-40ee-84e2-aeba45a4e13e",
  "https://www.figma.com/api/mcp/asset/45eb6a38-8458-4d82-bf6d-6527c256833c",
  "https://www.figma.com/api/mcp/asset/9baeab82-4a90-41dd-8b38-6152f2e18cca",
  "https://www.figma.com/api/mcp/asset/55caae55-2b97-4432-b38e-919fba3fd17e",
  "https://www.figma.com/api/mcp/asset/0aa1fa60-106e-40ec-b86a-f640f23458e6",
  "https://www.figma.com/api/mcp/asset/5c5d8483-0b66-4428-b7e5-7e826175a0b9",
  "https://www.figma.com/api/mcp/asset/cfce989a-83ef-43db-b0d8-4e422b5d08dc",
  "https://www.figma.com/api/mcp/asset/563fcf65-5edc-415d-9518-2e8bf42f5637",
  "https://www.figma.com/api/mcp/asset/82599e82-5260-406c-87b0-e700bc676227",
  "https://www.figma.com/api/mcp/asset/3d2e15a4-4f36-4ed3-942d-fc5b22e8c5d4",
  "https://www.figma.com/api/mcp/asset/3526a457-ae14-4692-aad9-ce4589c1ba16",
  "https://www.figma.com/api/mcp/asset/c895f51d-196e-4306-8d66-4992ac15b45a",
  "https://www.figma.com/api/mcp/asset/c7c91ea9-801c-467b-936c-0c9c7714c6f8",
  "https://www.figma.com/api/mcp/asset/058656d1-51b5-4e1c-aaad-e230e7b0d095",
  "https://www.figma.com/api/mcp/asset/87a80876-98e1-4d2a-991a-a3cad2423151",
  "https://www.figma.com/api/mcp/asset/dc195fa3-048c-474b-85f2-8c235fb342f5",
  "https://www.figma.com/api/mcp/asset/b072edd8-fc3e-4825-8775-569227a2e9bb",
  "https://www.figma.com/api/mcp/asset/7d7cbd8d-18d0-48f2-b84f-2237f7f82b79",
];

function extFromType(ct) {
  if (!ct) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("svg")) return "svg";
  return "bin";
}

function idFromUrl(url) {
  const m = url.match(/asset\/([a-f0-9-]+)/i);
  return m ? m[1] : null;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const unique = [...new Set(URLS)];
  const manifest = {};

  for (const url of unique) {
    const id = idFromUrl(url);
    if (!id) {
      console.warn("skip bad url", url);
      continue;
    }
    process.stdout.write(`fetch ${id} ... `);
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      console.log(`FAIL ${res.status}`);
      continue;
    }
    const ct = res.headers.get("content-type") || "";
    const ext = extFromType(ct);
    const buf = Buffer.from(await res.arrayBuffer());
    const file = `${id}.${ext}`;
    fs.writeFileSync(path.join(OUT, file), buf);
    manifest[id] = file;
    console.log(`ok ${file} (${buf.length} bytes)`);
  }

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  console.log(`\nDone. ${Object.keys(manifest).length} files -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
