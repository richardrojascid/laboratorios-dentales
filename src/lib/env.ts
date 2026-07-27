import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

const root = process.cwd();
config({ path: resolve(root, ".env") });

const dbFile = resolve(root, "prisma", "dev.db").replace(/\\/g, "/");
const absoluteDbUrl = `file:${dbFile}`;

// Siempre usar ruta absoluta a prisma/dev.db (evita desfase CLI vs Next.js)
process.env.DATABASE_URL = absoluteDbUrl;

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "arcadalab-dev-secret-change-in-production";
}

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

export const defaultSettings = {
  id: "default",
  companyName: "ArcadaLab",
  logoPath: "/logo.svg",
};

export function databaseFileExists() {
  return existsSync(resolve(root, "prisma", "dev.db"));
}
