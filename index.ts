require("dotenv").config();
import moment from "moment";
import { consola } from "consola";
import { TELEGRAM_TOKEN } from "./src/constants";
import { telegrafBot } from "./src/services/telegram";
import { getUsers, saveUser } from "./src/database";
import { getApplicationStatus } from "./src/services/icetex";

if (!TELEGRAM_TOKEN) {
  consola.error("`TELEGRAM_TOKEN` is required");
  throw new Error("`TELEGRAM_TOKEN` is required");
}

async function syncUsers() {
  consola.start("Syncing users...");
  try {
    const users = await getUsers();
    consola.info(`Fetched ${users.length} users`);
    await Promise.all(
      users.map(async (user) => {
        consola.info(`Processing user ${user.id}`);
        const { statusMessage, latestFetch, latestStatus } =
          await getApplicationStatus(
            Number(user.identification),
            Number(user.application)
          );
        if (user.latestStatus !== latestStatus) {
          consola.info(`Status update for user ${user.id}`);
          await telegrafBot.telegram.sendMessage(user.id, statusMessage, {
            parse_mode: "Markdown",
          });
          await saveUser(Number(user.id), {
            latestFetch,
            latestStatus,
          });
        } else {
          consola.info(`No status change for user ${user.id}`);
        }
      })
    );
    consola.success(`${users.length} users synced`);
  } catch (error) {
    consola.error("Error syncing users:", error);
  }
}

async function main() {
  consola.start("Launching bot...");
  try {
    await new Promise<void>((resolve) => telegrafBot.launch(() => resolve()));
    consola.success("Bot running...");
    syncUsers();
  } catch (error) {
    consola.error("Error starting bot:", error);
  }
}

main();

setInterval(syncUsers, moment.duration(50, "minutes").asMilliseconds());

process.once("SIGINT", () => {
  consola.info("Received SIGINT, stopping bot...");
  telegrafBot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  consola.info("Received SIGTERM, stopping bot...");
  telegrafBot.stop("SIGTERM");
});
