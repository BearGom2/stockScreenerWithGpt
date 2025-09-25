import yahooFinance from "yahoo-finance2";
import fs from "fs";
import path from "path";
const __dirname = path.dirname("./sectors.json");

const sp500Tickers: string[] = JSON.parse(
  fs.readFileSync("../sp500.json", "utf-8")
);

async function extractSectors() {
  const sectorSet = new Set<string>();

  for (let i = 0; i < sp500Tickers.length; i++) {
    const symbol = sp500Tickers[i];
    try {
      const quote = await yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile"],
      });
      const sector = quote.assetProfile?.industry;
      if (sector) {
        sectorSet.add(sector);
      }
      console.log(`${symbol}: ${sector}`);
    } catch (err) {
      console.error(`❌ ${symbol} 실패`, err);
    }
  }

  const sectors = [...sectorSet];
  console.log("📌 최종 섹터 리스트:", sectors);

  fs.writeFileSync(
    path.join(__dirname, "sectors.json"),
    JSON.stringify(sectors, null, 2),
    "utf-8"
  );
}

extractSectors();
