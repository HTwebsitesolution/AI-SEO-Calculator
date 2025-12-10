import * as cheerio from "cheerio";

export function extractFAQ(html: string) {
  const $ = cheerio.load(html);
  const faqs: { question: string; answer: string }[] = [];
  $("h2, h3").each((_, el) => {
    const question = $(el).text().trim();
    let answer = "";
    let next = $(el).next();
    // Find the next non-empty paragraph or list
    while (next.length && (!/p|ul|ol/.test(next[0].tagName) || !next.text().trim())) {
      next = next.next();
    }
    if (next.length) answer = next.text().trim();
    if (question && answer) faqs.push({ question, answer });
  });
  return faqs;
}
