import { Context, Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import validator from "validator";
import moment from "moment";
import { TELEGRAM_TOKEN } from "../../constants";
import { deleteUser, getUser, saveUser, Step } from "../../database";
import { getApplications, getApplicationStatus } from "../icetex";

const telegrafBot = new Telegraf(TELEGRAM_TOKEN);

telegrafBot.telegram.setMyCommands([
  {
    command: "iniciar",
    description: "Iniciar",
  },
  {
    command: "info",
    description: "Información de tu subscripción",
  },
  {
    command: "estado",
    description: "Obtener último estado",
  },
  {
    command: "salir",
    description: "Salir",
  },
]);

async function onStart(ctx: Context) {
  const chatId = Number(ctx.chat?.id);
  ctx.reply("Ingresa tu número de cédula:", { reply_markup: undefined });
  saveUser(chatId, { step: Step.identification }, false);
}

telegrafBot.start(onStart);

telegrafBot.command("iniciar", onStart);

telegrafBot.command("info", async (ctx) => {
  const chatId = ctx.chat.id;
  const user = await getUser(chatId);
  if (user && user.application) {
    await ctx.reply(`Está suscrito a la solicitud ${user.application}`);
  } else {
    await ctx.reply(
      "Aún no está suscrito a ninguna solicitud. Para suscribirse precione en /iniciar"
    );
  }
});

telegrafBot.command("estado", async (ctx) => {
  const chatId = ctx.chat.id;
  const user = await getUser(chatId);
  if (user && user.application) {
    const message = await ctx.reply("Cargando último estado...");
    const statusMessage = await getApplicationStatus(
      Number(user.identification),
      user.application
    );
    await ctx.reply(statusMessage, { parse_mode: "Markdown" });
    await ctx.deleteMessage(message.message_id);
  } else {
    await ctx.reply(
      "Aún no está suscrito a ninguna solicitud. Para suscribirse precione en /iniciar"
    );
  }
});

telegrafBot.command("salir", async (ctx) => {
  const chatId = ctx.chat.id;
  const user = await getUser(chatId);
  if (user && user.application) {
    await deleteUser(chatId);
    await ctx.reply("Se ha cancelado su suscripción");
  } else {
    await ctx.reply(
      "Aún no está suscrito a ninguna solicitud. Para suscribirse precione en /iniciar"
    );
  }
});

telegrafBot.on(message("text"), async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text.trim();
  const user = await getUser(chatId);
  if (user?.step === Step.identification) {
    if (!validator.isNumeric(text)) {
      await ctx.reply("Por favor ingrese solo números");
      return;
    }
    const identification = Number(text);
    await saveUser(chatId, { identification });
    const message = await ctx.reply("Obteniendo sus solicitudes vigentes...");
    let applications = user.applications;
    if (!applications) {
      applications = await getApplications(identification);
    }
    if (applications.length === 0) {
      await ctx.reply("No hay solicitudes registradas para: " + identification);
      return;
    }
    await saveUser(chatId, { applications });
    await ctx.deleteMessage(message.message_id);
    let applicationOptions = "Por favor, seleccione una solicitud:\n\n";
    applications.forEach((application) => {
      applicationOptions += `${application.id} - ${application.ies} - ${
        application.program
      } - ${moment(application.date, "DD/MM/Y hh:mm:ss a").format(
        "Y/MM/DD"
      )}\n\n`;
    });
    await ctx.reply(applicationOptions, {
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: applications.map((application) => [
          { text: String(application.id) },
        ]),
        one_time_keyboard: true,
        resize_keyboard: true,
      },
    });
    await saveUser(chatId, { step: Step.application });
  } else if (user?.step === Step.application) {
    if (!validator.isNumeric(text)) {
      await ctx.reply("Por favor ingrese solo números");
      return;
    }
    const application = Number(text);
    if (!user.applications?.find(({ id }) => id === application)) {
      await ctx.reply("Seleccione una solicitud valida");
      return;
    }
    await saveUser(chatId, { application, step: null });
    await ctx.reply(`Ahora está suscrito a la solicitud ${application}`);
    const message = await ctx.reply("Cargando último estado...");
    const statusMessage = await getApplicationStatus(
      Number(user?.identification),
      application
    );
    await ctx.reply(statusMessage, { parse_mode: "Markdown" });
    await ctx.deleteMessage(message.message_id);
  }
});

export { telegrafBot };
