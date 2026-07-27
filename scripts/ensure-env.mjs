import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

const root = resolve(process.cwd());
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error("Falta .env.example. No se puede crear .env automáticamente.");
    process.exit(1);
  }
  copyFileSync(examplePath, envPath);
  console.log("Creado .env desde .env.example");
} else {
  console.log(".env ya existe");
}
