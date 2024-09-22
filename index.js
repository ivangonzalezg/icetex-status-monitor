require("dotenv").config();
const puppeteer = require("puppeteer");
const TelegramBot = require("node-telegram-bot-api");
const validator = require("validator");
const moment = require("moment");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ICETEX_URL =
  "https://www.icetex.gov.co/portalacces/tradicional/estado/cptCambiarEstado.asp?origen=portal";
const APPLICANT_ID_NUMBER = process.env.APPLICANT_ID_NUMBER;
const APPLICATION_ID = process.env.APPLICATION_ID;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

const sendNotification = async (message) => {
  await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: "Markdown" });
};

const delay = (time) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

const validateEnvVariables = () => {
  if (!TELEGRAM_TOKEN) {
    throw new Error("`TELEGRAM_TOKEN` is missing");
  }
  if (!TELEGRAM_CHAT_ID) {
    throw new Error("`TELEGRAM_CHAT_ID` is missing");
  } else if (!validator.isNumeric(TELEGRAM_CHAT_ID)) {
    throw new Error("`TELEGRAM_CHAT_ID` must be numeric");
  }
  if (!APPLICANT_ID_NUMBER) {
    throw new Error("`APPLICANT_ID_NUMBER` is missing");
  } else if (!validator.isNumeric(APPLICANT_ID_NUMBER)) {
    throw new Error("`APPLICANT_ID_NUMBER` must be numeric");
  }
  if (!APPLICATION_ID) {
    throw new Error("`APPLICATION_ID` is missing");
  } else if (!validator.isNumeric(APPLICATION_ID)) {
    throw new Error("`APPLICATION_ID` must be numeric");
  }
};

const checkApplicationStatus = async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_BIN,
    headless: true,
    defaultViewport: null,
    args: [
      "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36",
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--headless",
      "--disable-gpu",
    ],
  });
  const page = await browser.newPage();
  await page.goto(ICETEX_URL);

  try {
    await page.select('select[name="tipoid"]', "2");
  } catch (error) {
    throw new Error("Select element for `tipoid` not found");
  }

  try {
    await page.type('input[name="IdSolicitante"]', APPLICANT_ID_NUMBER);
  } catch (error) {
    throw new Error("Input element for `IdSolicitante` not found");
  }

  try {
    await page.click('input[name="Submit"]');
  } catch (error) {
    throw new Error("Submit button not found");
  }

  await delay(1000);

  try {
    const applicationSelector = `a[href*="idsolicitud=${APPLICATION_ID}"]`;
    await page.click(applicationSelector);
  } catch (error) {
    throw new Error("Application link not found");
  }

  await delay(1000);

  let firstName, lastName, institution, program;

  try {
    firstName = await page.$eval('input[name="nombres"]', (el) => el.value);
  } catch (error) {
    throw new Error("First name field not found");
  }

  try {
    lastName = await page.$eval('input[name="apellidos"]', (el) => el.value);
  } catch (error) {
    throw new Error("Last name field not found");
  }

  try {
    institution = await page.$eval(
      'input[name="institucion"]',
      (el) => el.value
    );
  } catch (error) {
    throw new Error("Institution field not found");
  }

  try {
    program = await page.$eval('input[name="programa"]', (el) => el.value);
  } catch (error) {
    throw new Error("Program field not found");
  }

  let latestStatus;

  try {
    latestStatus = await page.$$eval("table tbody tr", (rows) => {
      if (rows.length < 2) throw new Error("No status rows found");
      const lastRow = rows[rows.length - 2];
      const columns = lastRow.querySelectorAll("td");
      return {
        date: columns[0].innerText.trim(),
        status: columns[2].innerText.trim(),
      };
    });
  } catch (error) {
    throw new Error("Error extracting the latest status from the table");
  }

  await browser.close();

  const message = `
📋 *Información de la solicitud:*
- Nombre: ${firstName} ${lastName}
- IES: ${institution}
- Programa: ${program}

📅 *Último estado:*
- Fecha: ${latestStatus.date}
- Estado: ${latestStatus.status}
  `;

  return message;
};

let lastStatusMessage = null;

const main = async () => {
  try {
    validateEnvVariables();
    const newStatusMessage = await checkApplicationStatus();

    if (newStatusMessage !== lastStatusMessage) {
      lastStatusMessage = newStatusMessage;
      await sendNotification(newStatusMessage);
    }
  } catch (error) {
    console.error("Error:", error.message);
    try {
      await sendNotification(`Error occurred: ${error.message}`);
    } catch (err) {
      console.error("Failed to send error notification:", err.message);
    }
  }
};

main();

setInterval(main, moment.duration(6, "hours"));
