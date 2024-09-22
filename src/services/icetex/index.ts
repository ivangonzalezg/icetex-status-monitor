import puppeteer, { Browser, Page } from "puppeteer";
import { ICETEX_URL } from "../../constants";
import { Application } from "../../database";

export const delay = (time = 2000) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

let browser: Browser | null = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
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
  }
  return browser;
}

async function getPage() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.goto(ICETEX_URL);
  return page;
}

export async function getApplications(
  identification: number
): Promise<Application[]> {
  const page = await getPage();
  try {
    await page.select('select[name="tipoid"]', "2");
  } catch (error) {
    throw new Error("Elemento de selección para `tipoid` no encontrado");
  }
  try {
    await page.type('input[name="IdSolicitante"]', String(identification));
  } catch (error) {
    throw new Error("Elemento de entrada para `IdSolicitante` no encontrado");
  }
  try {
    await page.click('input[name="Submit"]');
  } catch (error) {
    throw new Error("Botón de envío no encontrado");
  }
  await delay();
  let applications = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    return rows.slice(2).map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      return {
        id: Number(cells[0]?.textContent?.trim()),
        date: cells[1]?.textContent?.trim() || "",
        ies: cells[4]?.textContent?.trim() || "",
        program: cells[5]?.textContent?.trim() || "",
      };
    });
  });
  applications.filter((application) => !!application.id);
  await page.close();
  return applications;
}

export async function getApplicationStatus(
  identification: number,
  application: number
): Promise<string> {
  const page = await getPage();
  try {
    await page.select('select[name="tipoid"]', "2");
  } catch (error) {
    throw new Error("Elemento de selección para `tipoid` no encontrado");
  }
  try {
    await page.type('input[name="IdSolicitante"]', String(identification));
  } catch (error) {
    throw new Error("Elemento de entrada para `IdSolicitante` no encontrado");
  }
  try {
    await page.click('input[name="Submit"]');
  } catch (error) {
    throw new Error("Botón de envío no encontrado");
  }
  await delay();
  try {
    const applicationSelector = `a[href*="idsolicitud=${application}"]`;
    await page.click(applicationSelector);
  } catch (error) {
    throw new Error("Enlace a la solicitud no encontrado");
  }
  await delay();
  let firstName, lastName, institution, program;
  try {
    firstName = await page.$eval('input[name="nombres"]', (el) => el.value);
  } catch (error) {
    throw new Error("Campo de nombre no encontrado");
  }
  try {
    lastName = await page.$eval('input[name="apellidos"]', (el) => el.value);
  } catch (error) {
    throw new Error("Campo de apellido no encontrado");
  }
  try {
    institution = await page.$eval(
      'input[name="institucion"]',
      (el) => el.value
    );
  } catch (error) {
    throw new Error("Campo de institución no encontrado");
  }
  try {
    program = await page.$eval('input[name="programa"]', (el) => el.value);
  } catch (error) {
    throw new Error("Campo de programa no encontrado");
  }
  let latestStatus;
  try {
    latestStatus = await page.$$eval("table tbody tr", (rows) => {
      if (rows.length < 2) throw new Error("No se encontraron filas de estado");
      const lastRow = rows[rows.length - 2];
      const columns = lastRow.querySelectorAll("td");
      return {
        date: columns[0].innerText.trim(),
        status: columns[2].innerText.trim(),
      };
    });
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
  } catch (error) {
    throw new Error("Error extrayendo el último estado de la tabla");
  }
}
