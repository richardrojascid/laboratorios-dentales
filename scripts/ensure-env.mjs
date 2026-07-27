import { copyFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = resolve(process.cwd());
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");
const dbPath = resolve(root, "prisma", "dev.db").replace(/\\/g, "/");
const databaseUrl = `file:${dbPath}`;

function upsertEnv() {
  if (!existsSync(envPath)) {
    if (!existsSync(examplePath)) {
      console.error("Falta .env.example. No se puede crear .env automáticamente.");
      process.exit(1);
    }
    copyFileSync(examplePath, envPath);
    console.log("Creado .env desde .env.example");
  }

  let content = readFileSync(envPath, "utf8");
  if (/^DATABASE_URL=/m.test(content)) {
    content = content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${databaseUrl}"`);
  } else {
    content = `DATABASE_URL="${databaseUrl}"\n` + content;
  }

  if (!/^NEXTAUTH_SECRET=/m.test(content)) {
    content += `\nNEXTAUTH_SECRET="arcadalab-dev-secret-change-in-production"`;
  }
  if (!/^NEXTAUTH_URL=/m.test(content)) {
    content += `\nNEXTAUTH_URL="http://localhost:3000"`;
  }

  writeFileSync(envPath, content.endsWith("\n") ? content : content + "\n");
  console.log(`DATABASE_URL configurado -> ${databaseUrl}`);
}

upsertEnv();
