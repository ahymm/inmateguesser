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
    "BURGLARY", "FRAUD", "ROBBERY", "AGGRAVATED ASSAULT",
    "ARMED ROBBERY", "MURDER", "ATMPT MURDER", "ARSON", "KIDNAPPING"
  ].filter(x => x !== correctOffense);
  const wrong = shuffle(pool).slice(0, 3);
  return shuffle([correctOffense, ...wrong]);
}

app.post("/random-case", async (req, res) => {
  const { ageLow = 18, ageHigh = 90 } = req.body;
  let browser;

  try {
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // ── STEP 1: Go to the search form ────────────────────────────────────────
    await page.goto(
      "https://services.gdc.ga.gov/GDC/OffenderQuery/jsp/OffQryForm.jsp",
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );

    const url1   = page.url();
    const title1 = await page.title();
    console.log("After goto — URL:", url1);
    console.log("After goto — Title:", title1);

    // ── STEP 2: Handle disclaimer page if present ─────────────────────────────
    const disclaimerSelectors = [
      'input[value="I Agree"]',
      'input[value="Agree"]',
      'input[value="Accept"]',
      'input[value="Continue"]',
    ];

    let clickedDisclaimer = false;
    for (const sel of disclaimerSelectors) {
      try {
        const el = await page.$(sel);
        if (el) {
          console.log("Disclaimer found, clicking:", sel);
          await Promise.all([
            el.click(),
            page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 })
          ]);
          clickedDisclaimer = true;
          break;
        }
      } catch (_) {}
    }

    if (!clickedDisclaimer) {
      console.log("No disclaimer found — proceeding.");
    }

    const url2   = page.url();
    const title2 = await page.title();
    console.log("Post-disclaimer — URL:", url2);
    console.log("Post-disclaimer — Title:", title2);

    // ── STEP 3: If still not on form page, navigate directly ─────────────────
    if (!url2.includes("OffQryForm")) {
      console.log("Not on form page, navigating directly...");
      await page.goto(
        "https://services.gdc.ga.gov/GDC/OffenderQuery/jsp/OffQryForm.jsp",
        { waitUntil: "domcontentloaded", timeout: 30000 }
      );
      console.log("Re-navigate URL:", page.url());
    }

    // DEBUG: dump HTML snippet so we can see what's on the page
    const debugHtml = await page.content();
    console.log("Page HTML (first 2000 chars):\n", debugHtml.substring(0, 2000));

    // ── STEP 4: Fill the search form ─────────────────────────────────────────
    await page.waitForSelector("#vAgeLow", { timeout: 20000 });

    await page.click("#vAgeLow", { clickCount: 3 });
    await page.type("#vAgeLow", String(ageLow));

    await page.waitForSelector("#vAgeHigh", { timeout: 10000 });
    await page.click("#vAgeHigh", { clickCount: 3 });
    await page.type("#vAgeHigh", String(ageHigh));

    await page.waitForSelector("#NextButton2", { timeout: 10000 });
    await Promise.all([
      page.click("#NextButton2"),
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
    ]);

    // ── STEP 5: Pick a random inmate ─────────────────────────────────────────
    await page.waitForSelector('input[name="btn1"]', { timeout: 20000 }).catch(() => {
      throw new Error("No results found for this age range.");
    });

    const buttons = await page.$$('input[name="btn1"]');
    if (!buttons.length) throw new Error("No inmate buttons found.");

    const randomIndex = Math.floor(Math.random() * buttons.length);
    console.log(`Found ${buttons.length} inmates. Selecting index: ${randomIndex}`);

    await Promise.all([
      buttons[randomIndex].click(),
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
    ]);

    // ── STEP 6: Parse profile ─────────────────────────────────────────────────
    await page.waitForSelector("h4", { timeout: 15000 }).catch(() => {
      throw new Error("Inmate profile did not load.");
    });

    const html = await page.content();
    const $    = cheerio.load(html);

    const imgSrc = $('img[alt="Image of the offender"]').attr("src") || "";
    const image  = imgSrc.startsWith("http")
      ? imgSrc
      : `https://services.gdc.ga.gov${imgSrc}`;

    const name = $("h4").first().text().trim().replace("NAME:", "").trim();

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
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
