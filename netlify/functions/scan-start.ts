import type { Handler } from "@netlify/functions";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const H_SCRIPT = [/intercom/i, /crisp/i, /tidio/i, /calendly/i, /tawk\.to/i];

export const handler: Handler = async (event) => {
  const { url } = JSON.parse(event.body || "{}" );
  if (!url) return { statusCode: 400, body: "Missing url" };

  // Fetch HTML (follow redirects)
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim();
  const metas = {
    description: $('meta[name="description"]').attr("content") || null,
    robots: $('meta[name="robots"]').attr("content") || null,
  };
  const h1 = $("h1").map((_,el)=>$(el).text().trim()).get();
  const h2 = $("h2").map((_,el)=>$(el).text().trim()).get();

  // Detect scripts/widgets
  const scripts = $("script[src]").map((_,el)=>$(el).attr("src")).get();
  const inline = $("script").map((_,el)=>$(el).html()||"").get();
  const allScripts = [...scripts, ...inline];
  const detected = H_SCRIPT
    .filter(r => allScripts.some(s => r.test(s)))
    .map(r => r.toString());

  // Simple signals
  const hasSitemap = $("a[href*='sitemap']").length>0 || /sitemap\.xml/.test(html);
  const hasSchema = /application\/ld\+json/.test(html);
  const contactDetect = $("a[href*='contact'], a[href*='book'], a[href*='call']").length>0;

  const dom_signals = { title, metas, h1, h2, hasSchema, hasSitemap, contactDetect, detected };

  // TODO: optional Lighthouse later (PageSpeed API or worker)
  return {
    statusCode: 200,
    body: JSON.stringify({ status:"done", dom_signals })
  };
};
