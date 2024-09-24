require("dotenv").config();
import { TELEGRAM_TOKEN } from "./src/constants";
import { telegrafBot } from "./src/services/telegram";

if (!TELEGRAM_TOKEN) {
  throw new Error("`TELEGRAM_TOKEN` es necesario");
}

async function main() {
  await new Promise<void>((resolve) => telegrafBot.launch(() => resolve()));
  console.log("Bot running...");
}

main();

process.once("SIGINT", () => telegrafBot.stop("SIGINT"));

process.once("SIGTERM", () => telegrafBot.stop("SIGTERM"));
