import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const ROOT = root;
export const CONTENT_DIR = path.join(root, "content/essays");
export const DATA_DIR = path.join(root, "data");
export const PUBLIC_DIR = path.join(root, "public");
export const DOWNLOADS_DIR = path.join(PUBLIC_DIR, "downloads");
export const GENERATED_DIR = path.join(root, "generated");

export const PG_BASE = "https://paulgraham.com";
export const ARTICLES_URL = `${PG_BASE}/articles.html`;
