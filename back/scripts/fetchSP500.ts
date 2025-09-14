import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";

async function fetchSP500() {
  const url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies";
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const tickers: string[] = [];

  // 위키 S&P500 테이블은 id="constituents" 로 지정되어 있음
  $("#constituents tbody tr").each((_, el) => {
    const symbol = $(el).find("td:nth-child(1)").text().trim();
    if (symbol) tickers.push(symbol.replace(".", "-")); // BRK.B -> BRK-B 변환
  });

  console.log(`📊 총 ${tickers.length}개 종목 수집 완료`);
  fs.writeFileSync("sp500.json", JSON.stringify(tickers, null, 2));
}

fetchSP500().catch(console.error);
