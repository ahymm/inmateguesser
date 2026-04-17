// // const puppeteer = require("puppeteer-core");
// // const chromium = require("@sparticuz/chromium");
// // const cheerio = require("cheerio");
// // const express = require("express");

// // const app = express();
// // app.use(express.json());
// // app.use(express.static("."));

// // function shuffle(arr) {
// //   const copy = [...arr];
// //   for (let i = copy.length - 1; i > 0; i--) {
// //     const j = Math.floor(Math.random() * (i + 1));
// //     [copy[i], copy[j]] = [copy[j], copy[i]];
// //   }
// //   return copy;
// // }

// // function buildChoices(correctOffense) {
// //   const pool = [
// //     "BURGLARY", "FRAUD", "ROBBERY", "AGGRAVATED ASSAULT",
// //     "ARMED ROBBERY", "MURDER", "ATMPT MURDER", "ARSON", "KIDNAPPING"
// //   ].filter(x => x !== correctOffense);
// //   const wrong = shuffle(pool).slice(0, 3);
// //   return shuffle([correctOffense, ...wrong]);
// // }

// // app.post("/random-case", async (req, res) => {
// //   const { ageLow = 18, ageHigh = 90 } = req.body;
// //   let browser;

// //   try {
// //     browser = await puppeteer.launch({
// //       args: [
// //         ...chromium.args,
// //         "--no-sandbox",
// //         "--disable-setuid-sandbox",
// //         "--disable-dev-shm-usage",
// //         "--disable-gpu",
// //         "--single-process",
// //       ],
// //       defaultViewport: chromium.defaultViewport,
// //       executablePath: await chromium.executablePath(),
// //       headless: chromium.headless,
// //     });

// //     const page = await browser.newPage();

// //     await page.setUserAgent(
// //       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
// //       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
// //     );

// //     // ── STEP 1: Navigate to disclaimer page ──────────────────────────────────
// //     await page.goto(
// //       "https://services.gdc.ga.gov/GDC/OffenderQuery/jsp/OffQryForm.jsp",
// //       { waitUntil: "networkidle2", timeout: 30000 }
// //     );

// //     // ── STEP 2: Submit disclaimer form if present ─────────────────────────────
// //     const hasDisclaimer = await page.$('#submit2');
// //     if (hasDisclaimer) {
// //       console.log("Disclaimer form found — submitting...");
// //       await Promise.all([
// //         page.click('#submit2'),
// //         page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
// //       ]);
// //     }

// //     // ── STEP 3: Wait for search form and fill age range ───────────────────────
// //     await page.waitForSelector("#vAgeLow", { timeout: 20000 });

// //     await page.click("#vAgeLow", { clickCount: 3 });
// //     await page.type("#vAgeLow", String(ageLow));

// //     await page.waitForSelector("#vAgeHigh", { timeout: 10000 });
// //     await page.click("#vAgeHigh", { clickCount: 3 });
// //     await page.type("#vAgeHigh", String(ageHigh));

// //     await page.waitForSelector("#NextButton2", { timeout: 10000 });
// //     await Promise.all([
// //       page.click("#NextButton2"),
// //       page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
// //     ]);

// //     // ── STEP 4: Pick a random inmate ──────────────────────────────────────────
// //     await page.waitForSelector('input[name="btn1"]', { timeout: 20000 }).catch(() => {
// //       throw new Error("No results found for this age range.");
// //     });

// //     const buttons = await page.$$('input[name="btn1"]');
// //     if (!buttons.length) throw new Error("No inmate buttons found.");

// //     const randomIndex = Math.floor(Math.random() * buttons.length);
// //     console.log(`Found ${buttons.length} inmates. Selecting index: ${randomIndex}`);

// //     await Promise.all([
// //       buttons[randomIndex].click(),
// //       page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
// //     ]);

// //     // ── STEP 5: Parse profile ─────────────────────────────────────────────────
// //     await page.waitForSelector("h4", { timeout: 15000 }).catch(() => {
// //       throw new Error("Inmate profile did not load.");
// //     });

// //     const html = await page.content();
// //     const $ = cheerio.load(html);

// //     const imgSrc = $('img[alt="Image of the offender"]').attr("src") || "";
// //     const image = imgSrc.startsWith("http")
// //       ? imgSrc
// //       : `https://services.gdc.ga.gov${imgSrc}`;

// //     const name = $("h4").first().text().trim().replace("NAME:", "").trim();

// //     function getValue(label) {
// //       const strong = $("strong.offender")
// //         .filter((i, el) => $(el).text().includes(label))
// //         .first();
// //       if (!strong.length) return "";
// //       return strong[0].nextSibling?.nodeValue?.trim() ||
// //         strong.parent().text()
// //           .replace(strong.text(), "")
// //           .split(/[A-Z]{3,}:/)[0]
// //           .replace(/\s+/g, " ")
// //           .trim();
// //     }

// //     const offense = getValue("MAJOR OFFENSE");

// //     const offenderData = {
// //       name,
// //       image,
// //       yob:         getValue("YOB"),
// //       race:        getValue("RACE"),
// //       gender:      getValue("GENDER"),
// //       height:      getValue("HEIGHT"),
// //       weight:      getValue("WEIGHT"),
// //       eyeColor:    getValue("EYE COLOR"),
// //       hairColor:   getValue("HAIR COLOR"),
// //       offense,
// //       institution: getValue("MOST RECENT INSTITUTION"),
// //       releaseDate: getValue("MAX POSSIBLE RELEASE DATE"),
// //       choices:     buildChoices(offense)
// //     };

// //     console.log("SUCCESS — Scraped:", offenderData.name, "|", offenderData.offense);
// //     res.json(offenderData);

// //   } catch (err) {
// //     console.error("Scrape error:", err.message);
// //     res.status(500).json({ error: "Scrape failed", detail: err.message });
// //   } finally {
// //     if (browser) await browser.close();
// //   }
// // });

// // const PORT = process.env.PORT || 3000;
// // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




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

    // ── STEP 1: Navigate to disclaimer page ──────────────────────────────────
    await page.goto(
      "https://services.gdc.ga.gov/GDC/OffenderQuery/jsp/OffQryForm.jsp",
      { waitUntil: "networkidle2", timeout: 30000 }
    );

    // ── STEP 2: Submit disclaimer form if present ─────────────────────────────
    const hasDisclaimer = await page.$('#submit2');
    if (hasDisclaimer) {
      console.log("Disclaimer form found — submitting...");
      await Promise.all([
        page.click('#submit2'),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
      ]);
    }

    // ── STEP 3: Wait for search form and fill age range ───────────────────────
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

    // ── STEP 4: Pick a random inmate ──────────────────────────────────────────
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

    // ── STEP 5: Parse profile ─────────────────────────────────────────────────
    await page.waitForSelector("h4", { timeout: 15000 }).catch(() => {
      throw new Error("Inmate profile did not load.");
    });

    const html = await page.content();
    const $ = cheerio.load(html);

    const imgSrc = $('img[alt="Image of the offender"]').attr("src") || "";
    const fullImgUrl = imgSrc.startsWith("http")
      ? imgSrc
      : `https://services.gdc.ga.gov${imgSrc}`;

    // ── STEP 6: Fetch image as base64 using same session ──────────────────────
    let imageBase64 = "";
    if (fullImgUrl) {
      try {
        const imgResponse = await page.goto(fullImgUrl, { waitUntil: "networkidle2", timeout: 10000 });
        const imgBuffer = await imgResponse.buffer();
        imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
        console.log("Image fetched successfully.");
      } catch (e) {
        console.error("Image fetch failed:", e.message);
      }
    }

    const name = $("h4").first().text().trim().replace("NAME:", "").trim();

    function getValue(label) {
      const strong = $("strong.offender")
        .filter((i, el) => $(el).text().includes(label))
        .first();
      if (!strong.length) return "";
      return strong[0].nextSibling?.nodeValue?.trim() ||
        strong.parent().text()
          .replace(strong.text(), "")
          .split(/[A-Z]{3,}:/)[0]
          .replace(/\s+/g, " ")
          .trim();
    }

    const offense = getValue("MAJOR OFFENSE");

    const offenderData = {
      name,
      image: imageBase64,
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

    console.log("SUCCESS — Scraped:", offenderData.name, "|", offenderData.offense);
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




















// const puppeteer = require("puppeteer-core");
// const chromium = require("@sparticuz/chromium");
// const cheerio = require("cheerio");
// const express = require("express");

// const app = express();
// app.use(express.json());
// app.use(express.static("."));

// // ── CACHE ─────────────────────────────────────────────────────────────────────
// const CACHE_SIZE = 5;       // kitne inmates ready rakhne hain
// const REFILL_AT  = 2;       // jab itne bachein toh refill shuru
// let cache = [];
// let isRefilling = false;
// let browser = null;

// // ── BROWSER ───────────────────────────────────────────────────────────────────
// async function getBrowser() {
//   if (browser && browser.isConnected()) return browser;
//   console.log("Launching browser...");
//   browser = await puppeteer.launch({
//     args: [
//       ...chromium.args,
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-gpu",
//       "--single-process",
//     ],
//     defaultViewport: chromium.defaultViewport,
//     executablePath: await chromium.executablePath(),
//     headless: chromium.headless,
//   });
//   browser.on("disconnected", () => {
//     console.log("Browser disconnected — will relaunch on next request.");
//     browser = null;
//   });
//   return browser;
// }

// // ── HELPERS ───────────────────────────────────────────────────────────────────
// function shuffle(arr) {
//   const copy = [...arr];
//   for (let i = copy.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [copy[i], copy[j]] = [copy[j], copy[i]];
//   }
//   return copy;
// }

// function buildChoices(correctOffense) {
//   const pool = [
//     "BURGLARY", "FRAUD", "ROBBERY", "AGGRAVATED ASSAULT",
//     "ARMED ROBBERY", "MURDER", "ATMPT MURDER", "ARSON", "KIDNAPPING"
//   ].filter(x => x !== correctOffense);
//   const wrong = shuffle(pool).slice(0, 3);
//   return shuffle([correctOffense, ...wrong]);
// }

// // ── SCRAPE ONE INMATE ─────────────────────────────────────────────────────────
// async function scrapeOne() {
//   const b = await getBrowser();
//   const page = await b.newPage();

//   // Block unnecessary assets for speed
//   await page.setRequestInterception(true);
//   page.on("request", (req) => {
//     const type = req.resourceType();
//     if (["stylesheet", "font", "media"].includes(type)) {
//       req.abort();
//     } else {
//       req.continue();
//     }
//   });

//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
//     "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
//   );

//   try {
//     await page.goto(
//       "https://services.gdc.ga.gov/GDC/OffenderQuery/jsp/OffQryForm.jsp",
//       { waitUntil: "networkidle2", timeout: 30000 }
//     );

//     const hasDisclaimer = await page.$('#submit2');
//     if (hasDisclaimer) {
//       await Promise.all([
//         page.click('#submit2'),
//         page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 })
//       ]);
//     }

//     await page.waitForSelector("#vAgeLow", { timeout: 20000 });
//     await page.click("#vAgeLow", { clickCount: 3 });
//     await page.type("#vAgeLow", "18");

//     await page.waitForSelector("#vAgeHigh", { timeout: 10000 });
//     await page.click("#vAgeHigh", { clickCount: 3 });
//     await page.type("#vAgeHigh", "90");

//     await page.waitForSelector("#NextButton2", { timeout: 10000 });
//     await Promise.all([
//       page.click("#NextButton2"),
//       page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
//     ]);

//     await page.waitForSelector('input[name="btn1"]', { timeout: 20000 });
//     const buttons = await page.$$('input[name="btn1"]');
//     if (!buttons.length) throw new Error("No inmates found.");

//     const randomIndex = Math.floor(Math.random() * buttons.length);
//     await Promise.all([
//       buttons[randomIndex].click(),
//       page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
//     ]);

//     await page.waitForSelector("h4", { timeout: 15000 });

//     const html = await page.content();
//     const $ = cheerio.load(html);

//     const imgSrc = $('img[alt="Image of the offender"]').attr("src") || "";
//     const fullImgUrl = imgSrc.startsWith("http")
//       ? imgSrc
//       : `https://services.gdc.ga.gov${imgSrc}`;

//     // Fetch image using same session
//     let imageBase64 = "";
//     if (fullImgUrl) {
//       try {
//         const imgPage = await b.newPage();
//         const imgResponse = await imgPage.goto(fullImgUrl, { timeout: 10000 });
//         const imgBuffer = await imgResponse.buffer();
//         imageBase64 = `data:image/jpeg;base64,${imgBuffer.toString("base64")}`;
//         await imgPage.close();
//       } catch (e) {
//         console.error("Image fetch failed:", e.message);
//       }
//     }

//     const name = $("h4").first().text().trim().replace("NAME:", "").trim();

//     function getValue(label) {
//       const strong = $("strong.offender")
//         .filter((i, el) => $(el).text().includes(label))
//         .first();
//       if (!strong.length) return "";
//       return strong[0].nextSibling?.nodeValue?.trim() ||
//         strong.parent().text()
//           .replace(strong.text(), "")
//           .split(/[A-Z]{3,}:/)[0]
//           .replace(/\s+/g, " ")
//           .trim();
//     }

//     const offense = getValue("MAJOR OFFENSE");

//     const offenderData = {
//       name,
//       image: imageBase64,
//       yob:         getValue("YOB"),
//       race:        getValue("RACE"),
//       gender:      getValue("GENDER"),
//       height:      getValue("HEIGHT"),
//       weight:      getValue("WEIGHT"),
//       eyeColor:    getValue("EYE COLOR"),
//       hairColor:   getValue("HAIR COLOR"),
//       offense,
//       institution: getValue("MOST RECENT INSTITUTION"),
//       releaseDate: getValue("MAX POSSIBLE RELEASE DATE"),
//       choices:     buildChoices(offense)
//     };

//     console.log("Scraped:", offenderData.name, "|", offenderData.offense);
//     return offenderData;

//   } finally {
//     await page.close();
//   }
// }

// // ── CACHE REFILL ──────────────────────────────────────────────────────────────
// async function refillCache() {
//   if (isRefilling) return;
//   isRefilling = true;
//   console.log(`Refilling cache... (current: ${cache.length})`);

//   while (cache.length < CACHE_SIZE) {
//     try {
//       const data = await scrapeOne();
//       cache.push(data);
//       console.log(`Cache size: ${cache.length}/${CACHE_SIZE}`);
//     } catch (err) {
//       console.error("Cache refill error:", err.message);
//       break;
//     }
//   }

//   isRefilling = false;
//   console.log("Cache refill done.");
// }

// // ── ROUTE ─────────────────────────────────────────────────────────────────────
// app.post("/random-case", async (req, res) => {
//   // If cache has items, serve instantly
//   if (cache.length > 0) {
//     const data = cache.shift();
//     console.log(`Served from cache. Cache remaining: ${cache.length}`);

//     // Refill in background if running low
//     if (cache.length <= REFILL_AT) {
//       refillCache();
//     }

//     return res.json(data);
//   }

//   // Cache empty — scrape on demand
//   console.log("Cache empty — scraping on demand...");
//   try {
//     const data = await scrapeOne();
//     refillCache(); // start refilling in background
//     res.json(data);
//   } catch (err) {
//     console.error("Scrape error:", err.message);
//     res.status(500).json({ error: "Scrape failed", detail: err.message });
//   }
// });

// // ── START ─────────────────────────────────────────────────────────────────────
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, async () => {
//   console.log(`Server running on port ${PORT}`);
//   // Pre-fill cache on startup
//   refillCache();
// });
