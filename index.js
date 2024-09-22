require("dotenv").config();
const puppeteer = require("puppeteer");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ICETEX_URL = process.env.ICETEX_URL;
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

const checkApplicationStatus = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(ICETEX_URL);

  await page.select('select[name="tipoid"]', "2");
  await page.type('input[name="IdSolicitante"]', APPLICANT_ID_NUMBER);
  await page.click('input[name="Submit"]');

  await delay(1000);

  const applicationSelector = `a[href*="idsolicitud=${APPLICATION_ID}"]`;
  await page.click(applicationSelector);

  await delay(1000);

  const firstName = await page.$eval('input[name="nombres"]', (el) => el.value);
  const lastName = await page.$eval(
    'input[name="apellidos"]',
    (el) => el.value
  );
  const institution = await page.$eval(
    'input[name="institucion"]',
    (el) => el.value
  );
  const program = await page.$eval('input[name="programa"]', (el) => el.value);

  const latestStatus = await page.$$eval("table tbody tr", (rows) => {
    const lastRow = rows[rows.length - 2];
    const columns = lastRow.querySelectorAll("td");
    return {
      date: columns[0].innerText.trim(),
      status: columns[2].innerText.trim(),
    };
  });

  await browser.close();

  const message = `
📋 *Application Information:*
- Name: ${firstName} ${lastName}
- Institution: ${institution}
- Program: ${program}

📅 *Latest Status:*
- Date: ${latestStatus.date}
- Status: ${latestStatus.status}
  `;

  return message;
};

let lastStatusMessage = null;

const main = async () => {
  try {
    const newStatusMessage = await checkApplicationStatus();

    if (newStatusMessage !== lastStatusMessage) {
      lastStatusMessage = newStatusMessage;
      await sendNotification(newStatusMessage);
    }
  } catch (error) {
    console.error("Error during scraping:", error);
  }
};

main();

setInterval(main, 60000);
