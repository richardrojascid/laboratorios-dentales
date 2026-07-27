import { config } from "dotenv";
import { resolve } from "path";

// Asegura DATABASE_URL aunque Next aún no haya cargado .env en algún contexto
config({ path: resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "arcadalab-dev-secret-change-in-production";
}

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}
