import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { defineConfig } from "prisma/config";

function readEnvVariable(name: string) {
  if (process.env[name]) {
    return process.env[name] as string;
  }

  const envPath = join(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    throw new Error(`Variável ${name} não encontrada e arquivo .env ausente.`);
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (key === name) {
      return rawValue.replace(/^"|"$/g, "");
    }
  }

  throw new Error(`Variável ${name} não encontrada no arquivo .env.`);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.mjs",
  },
  datasource: {
    url: readEnvVariable("DATABASE_URL"),
  },
});