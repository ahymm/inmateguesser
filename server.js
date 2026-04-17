const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const cheerio = require("cheerio");
const express = require("express");

const app = express();
app.use(express.json());
app.use(express.static("."));

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChoices(correctOffense) {
  const pool = [
    "BURGLARY",
    "FRAUD",
    "ROBBERY",
    "AGGRAVATED ASSAULT",
    "ARMED ROBBERY",
    "MURDER",
    "ATMPT MURDER",
    "ARSON",
    "KIDNAPPING"
  ].filter(x => x !== correctOffense);
  const wrong = shuffle(pool).slice(0, 3);
  return shuffle([correctOffense, ...wrong]);
}

app.post("/random-case", async (req, res) => {
  const { ageLow = 18, ageHigh = 90 } = req.body;
  let browser;

  try {
    // FIX 1: Add --no-sandbox and disable GPU for Render's Linux container
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",   // Prevents /dev/shm OOM crashes on Render
        "--disable-gpu",
        "--single-process",           // Important for Render's limited environment
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // FIX 2: Set a real user-agent to avoid bot detection / blank page responses
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // FIX 3: Use domcontentloaded instead of networkidle2 — more reliable on slow servers
    await page.goto(
      "https://services.gdc.ga.gov/GDC/OffenderQuery/jsp/OffQryForm.jsp",
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );

    // FIX 4: THE MAIN BUG — wait for the element to exist before clicking it
    await page.waitForSelector("#vAgeLow", { timeout: 15000 });

    await page.click("#vAgeLow", { clickCount: 3 });
    await page.type("#vAgeLow", String(ageLow));

    await page.waitForSelector("#vAgeHigh", { timeout: 10000 });
    await page.click("#vAgeHigh", { clickCount: 3 });
    await page.type("#vAgeHigh", String(ageHigh));

    // FIX 5: Wait for the submit button before clicking it
    await page.waitForSelector("#NextButton2", { timeout: 10000 });

    await Promise.all([
      page.click("#NextButton2"),
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
    ]);

    // FIX 6: Wait for results to load, with a helpful error if none found
    await page.waitForSelector('input[name="btn1"]', { timeout: 20000 }).catch(() => {
      throw new Error("No inmate results returned for that age range — the results page never loaded btn1 buttons.");
    });

    const buttons = await page.$$('input[name="btn1"]');
    if (!buttons.length) {
      throw new Error("Results page loaded but no inmate buttons found.");
    }

    const randomIndex = Math.floor(Math.random() * buttons.length);
    console.log(`Found ${buttons.length} inmates. Selecting index: ${randomIndex}`);

    await Promise.all([
      buttons[randomIndex].click(),
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
    ]);

    // FIX 7: Wait for profile content before parsing
    await page.waitForSelector("h4", { timeout: 15000 }).catch(() => {
      throw new Error("Inmate profile page did not load h4 element in time.");
    });

    const html = await page.content();
    const $ = cheerio.load(html);

    const imgSrc = $('img[alt="Image of the offender"]').attr("src") || "";
    const image = imgSrc.startsWith("http")
      ? imgSrc
      : `https://services.gdc.ga.gov${imgSrc}`;

    const nameRaw = $("h4").first().text().trim();
    const name = nameRaw.replace("NAME:", "").trim();

    function getValue(label) {
      const strong = $("strong.offender")
        .filter((i, el) => $(el).text().includes(label))
        .first();
      if (!strong.length) return "";
      return strong.parent().text()
        .replace(strong.text(), "")
        .replace(/\s+/g, " ")
        .trim();
    }

    const offense = getValue("MAJOR OFFENSE");

    const offenderData = {
      name,
      image,
      yob:         getValue("YOB"),
      race:        getValue("RACE"),
      gender:      getValue("GENDER"),
      height:      getValue("HEIGHT"),
      weight:      getValue("WEIGHT"),
      eyeColor:    getValue("EYE COLOR"),
      hairColor:   getValue("HAIR COLOR"),
      offense,
      institution: getValue("MOST RECENT INSTITUTION"),
      releaseDate: getValue("MAX POSSIBLE RELEASE DATE"),
      choices:     buildChoices(offense)
    };

    console.log("Scraped:", offenderData.name, "|", offenderData.offense);
    res.json(offenderData);

  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: "Scrape failed", detail: err.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
