require("dotenv").config();
import { TELEGRAM_TOKEN } from "./src/constants";
import { telegrafBot } from "./src/services/telegram";
import { getUsers, saveUser } from "./src/database";
import { getApplicationStatus } from "./src/services/icetex";
import moment from "moment";

if (!TELEGRAM_TOKEN) {
  throw new Error("`TELEGRAM_TOKEN` es necesario");
}

async function syncUsers() {
  console.log("Syncing users...", moment().toISOString());
  const users = await getUsers();
  await Promise.all(
    users.map(async (user) => {
      const { statusMessage, latestFetch, latestStatus } =
        await getApplicationStatus(
          Number(user.identification),
          Number(user.application)
        );
      await telegrafBot.telegram.sendMessage(user.id, statusMessage, {
        parse_mode: "Markdown",
      });
      await saveUser(Number(user.id), {
        latestFetch,
        latestStatus,
      });
    })
  );
  console.log(`${users.length} users synced`, moment().toISOString());
}

async function main() {
  await new Promise<void>((resolve) => telegrafBot.launch(() => resolve()));
  console.log("Bot running...");
  syncUsers();
}

main();

setInterval(syncUsers, moment.duration(1, "hour").asMilliseconds());

process.once("SIGINT", () => telegrafBot.stop("SIGINT"));

process.once("SIGTERM", () => telegrafBot.stop("SIGTERM"));
