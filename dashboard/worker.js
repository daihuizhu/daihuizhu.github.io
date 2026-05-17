// ══════════════════════════════════════════════════════════════
//  INVESTING DASHBOARD — Cloudflare Worker
//  Deploy at: workers.cloudflare.com
//  Set environment variables:
//    OPENAI_API_KEY  = sk-...
//    ALLOWED_ORIGIN  = https://daihuizhu.github.io
// ══════════════════════════════════════════════════════════════

const ALLOWED_ORIGIN = typeof ALLOWED_ORIGIN_ENV !== "undefined"
  ? ALLOWED_ORIGIN_ENV
  : "https://daihuizhu.github.io";

// ── CORS headers ─────────────────────────────────────────────
function cors(origin) {
  return {
    "Access-Control-Allow-Origin":  origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function ok(data, origin) {
  return new Response(JSON.stringify(data), {
    headers: cors(origin),
  });
}

function err(msg, status = 400, origin) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: cors(origin),
  });
}

// ══════════════════════════════════════════════════════════════
//  ROUTER
// ══════════════════════════════════════════════════════════════
addEventListener("fetch", event => {
  event.respondWith(handle(event.request));
});

async function handle(req) {
  const origin = req.headers.get("Origin") || "";
  const url    = new URL(req.url);
  const path   = url.pathname;

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  try {
    // GET /options?ticker=NVDA&expiry=2024-01-19
    if (path === "/options") {
      return await handleOptions(url, origin);
    }

    // GET /maxpain?ticker=NVDA&expiry=2024-01-19
    if (path === "/maxpain") {
      return await handleMaxPain(url, origin);
    }

    // GET /quote?tickers=AAPL,NVDA,PLTR
    if (path === "/quote") {
      return await handleQuote(url, origin);
    }

    // GET /macro
    if (path === "/macro") {
      return await handleMacro(origin);
    }

    // GET /technicals?ticker=NVDA
    if (path === "/technicals") {
      return await handleTechnicals(url, origin);
    }

    // GET /news?tickers=PLTR,AAPL,TEM,VST,MEG
    if (path === "/news") {
      return await handleNews(url, origin);
    }

    // GET /avanza?query=mini+l+silver
    if (path === "/avanza") {
      return await handleAvanza(url, origin);
    }

    // POST /ai  { prompt, context }
    if (path === "/ai" && req.method === "POST") {
      return await handleAI(req, origin);
    }

    return err("Unknown route", 404, origin);
  } catch (e) {
    return err("Internal error: " + e.message, 500, origin);
  }
}

// ══════════════════════════════════════════════════════════════
//  OPTIONS CHAIN  — Yahoo Finance
// ══════════════════════════════════════════════════════════════
async function handleOptions(url, origin) {
  const ticker = (url.searchParams.get("ticker") || "NVDA").toUpperCase();
  const expiry = url.searchParams.get("expiry") || "";

  const baseUrl = expiry
    ? `https://query2.finance.yahoo.com/v7/finance/options/${ticker}?date=${toUnix(expiry)}`
    : `https://query2.finance.yahoo.com/v7/finance/options/${ticker}`;

  const res  = await fetch(baseUrl, { headers: yahooHeaders() });
  const data = await res.json();

  const chain = data?.optionChain?.result?.[0];
  if (!chain) return err("No options data for " + ticker, 404, origin);

  const expirations = chain.expirationDates || [];
  const calls = chain.options?.[0]?.calls || [];
  const puts  = chain.options?.[0]?.puts  || [];

  return ok({ ticker, expirations, calls, puts, currentPrice: chain.quote?.regularMarketPrice }, origin);
}

// ══════════════════════════════════════════════════════════════
//  MAX PAIN  — calculated from options chain
//  Max pain = strike where option sellers lose least
// ══════════════════════════════════════════════════════════════
async function handleMaxPain(url, origin) {
  const ticker = (url.searchParams.get("ticker") || "NVDA").toUpperCase();
  const expiry = url.searchParams.get("expiry") || "";

  const baseUrl = expiry
    ? `https://query2.finance.yahoo.com/v7/finance/options/${ticker}?date=${toUnix(expiry)}`
    : `https://query2.finance.yahoo.com/v7/finance/options/${ticker}`;

  const res  = await fetch(baseUrl, { headers: yahooHeaders() });
  const data = await res.json();

  const chain = data?.optionChain?.result?.[0];
  if (!chain) return err("No data", 404, origin);

  const currentPrice = chain.quote?.regularMarketPrice || 0;
  const calls = chain.options?.[0]?.calls || [];
  const puts  = chain.options?.[0]?.puts  || [];

  // Collect all strikes
  const strikes = [...new Set([
    ...calls.map(c => c.strike),
    ...puts.map(p => p.strike),
  ])].sort((a, b) => a - b);

  // Build OI map
  const callOI = {}, putOI = {};
  calls.forEach(c => callOI[c.strike] = c.openInterest || 0);
  puts.forEach(p  => putOI[p.strike]  = p.openInterest || 0);

  // For each candidate strike, compute total pain to option writers
  let maxPainStrike = strikes[0];
  let minPain = Infinity;
  const painByStrike = [];

  strikes.forEach(candidate => {
    let pain = 0;
    // Call writers lose when candidate > strike (calls in the money)
    strikes.forEach(s => {
      if (candidate > s) pain += (candidate - s) * (callOI[s] || 0);
      if (candidate < s) pain += (s - candidate) * (putOI[s]  || 0);
    });
    painByStrike.push({ strike: candidate, pain });
    if (pain < minPain) { minPain = pain; maxPainStrike = candidate; }
  });

  // Build distribution for chart (OI by strike)
  const distribution = strikes.map(s => ({
    strike:  s,
    callOI:  callOI[s] || 0,
    putOI:   putOI[s]  || 0,
    totalOI: (callOI[s] || 0) + (putOI[s] || 0),
  }));

  // Nearest expiry label
  const expiryLabel = chain.options?.[0]?.expirationDate
    ? new Date(chain.options[0].expirationDate * 1000).toISOString().split("T")[0]
    : "—";

  return ok({
    ticker,
    currentPrice,
    maxPain: maxPainStrike,
    expiryLabel,
    distribution,
    expirations: chain.expirationDates,
  }, origin);
}

// ══════════════════════════════════════════════════════════════
//  STOCK QUOTES
// ══════════════════════════════════════════════════════════════
async function handleQuote(url, origin) {
  const tickers = (url.searchParams.get("tickers") || "AAPL").toUpperCase();
  const res  = await fetch(
    `https://query2.finance.yahoo.com/v8/finance/spark?symbols=${tickers}&range=1d&interval=5m`,
    { headers: yahooHeaders() }
  );
  const data = await res.json();

  // Also get fundamentals
  const syms   = tickers.split(",");
  const qRes   = await fetch(
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${tickers}`,
    { headers: yahooHeaders() }
  );
  const qData  = await qRes.json();
  const quotes = (qData?.quoteResponse?.result || []).reduce((acc, q) => {
    acc[q.symbol] = {
      price:         q.regularMarketPrice,
      change:        q.regularMarketChange,
      changePct:     q.regularMarketChangePercent,
      volume:        q.regularMarketVolume,
      marketCap:     q.marketCap,
      pe:            q.trailingPE,
      fiftyTwoHigh:  q.fiftyTwoWeekHigh,
      fiftyTwoLow:   q.fiftyTwoWeekLow,
      name:          q.shortName,
    };
    return acc;
  }, {});

  return ok({ quotes }, origin);
}

// ══════════════════════════════════════════════════════════════
//  MACRO — Gold, Silver, Oil, VIX, Bonds, FX, CPI placeholder
// ══════════════════════════════════════════════════════════════
async function handleMacro(origin) {
  const symbols = [
    "GC=F",    // Gold futures
    "SI=F",    // Silver futures
    "CL=F",    // Crude Oil WTI
    "BZ=F",    // Brent Crude
    "^VIX",    // VIX
    "^TNX",    // US 10Y Treasury yield
    "^TYX",    // US 30Y Treasury yield
    "USDSEK=X",
    "USDCNY=X",
    "USDJPY=X",
    "EURUSD=X",
    "SLV",     // Silver ETF
    "GLD",     // Gold ETF
    "DX-Y.NYB",// DXY Dollar Index
  ].join(",");

  const res  = await fetch(
    `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`,
    { headers: yahooHeaders() }
  );
  const data = await res.json();
  const raw  = data?.quoteResponse?.result || [];

  const macro = raw.map(q => ({
    symbol:    q.symbol,
    name:      q.shortName || q.longName || q.symbol,
    price:     q.regularMarketPrice,
    change:    q.regularMarketChange,
    changePct: q.regularMarketChangePercent,
    currency:  q.currency,
  }));

  return ok({ macro, updated: new Date().toISOString() }, origin);
}

// ══════════════════════════════════════════════════════════════
//  TECHNICALS — MA20, MA50, RSI14 from daily history
// ══════════════════════════════════════════════════════════════
async function handleTechnicals(url, origin) {
  const ticker = (url.searchParams.get("ticker") || "NVDA").toUpperCase();

  const res  = await fetch(
    `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?range=3mo&interval=1d`,
    { headers: yahooHeaders() }
  );
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return err("No data for " + ticker, 404, origin);

  const closes    = result.indicators?.quote?.[0]?.close || [];
  const timestamps= result.timestamp || [];
  const currentPrice = closes[closes.length - 1];

  // MA
  const ma20  = sma(closes, 20);
  const ma50  = sma(closes, 50);
  const rsi14 = rsi(closes, 14);

  // MA20 cross signal
  const len    = closes.length;
  const ma20Prev = sma(closes.slice(0, -1), 20);
  const ma50Prev = sma(closes.slice(0, -1), 50);
  let crossSignal = "none";
  if (ma20Prev < ma50Prev && ma20 > ma50) crossSignal = "golden_cross";
  if (ma20Prev > ma50Prev && ma20 < ma50) crossSignal = "death_cross";

  return ok({
    ticker,
    currentPrice,
    ma20:   round2(ma20),
    ma50:   round2(ma50),
    rsi14:  round2(rsi14),
    crossSignal,
    rsiAlert:     rsi14 < 30,
    ma20Above50:  ma20 > ma50,
    // Last 60 days for sparkline
    history: closes.slice(-60).map((c, i) => ({
      date:  new Date(timestamps[timestamps.length - 60 + i] * 1000).toISOString().split("T")[0],
      close: round2(c),
    })),
  }, origin);
}

// ── Math helpers ─────────────────────────────────────────────
function sma(arr, period) {
  const slice = arr.filter(v => v != null).slice(-period);
  if (slice.length < period) return null;
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(closes, period = 14) {
  const valid = closes.filter(v => v != null);
  if (valid.length < period + 1) return null;
  const slice = valid.slice(-(period + 1));
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff > 0) gains  += diff;
    else          losses -= diff;
  }
  const avgG = gains  / period;
  const avgL = losses / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function round2(v) { return v != null ? Math.round(v * 100) / 100 : null; }

// ══════════════════════════════════════════════════════════════
//  NEWS — Yahoo Finance RSS + SEC EDGAR RSS
// ══════════════════════════════════════════════════════════════
async function handleNews(url, origin) {
  const tickers = (url.searchParams.get("tickers") || "AAPL").toUpperCase().split(",");

  const feeds = await Promise.allSettled(
    tickers.map(t => fetchYahooRSS(t))
  );

  const items = feeds
    .flatMap((r, i) => r.status === "fulfilled" ? r.value : [])
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 30);

  return ok({ items }, origin);
}

async function fetchYahooRSS(ticker) {
  const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${ticker}&region=US&lang=en-US`;
  const res  = await fetch(url);
  const text = await res.text();

  // Simple XML parse
  const items = [];
  const rx    = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = rx.exec(text)) !== null) {
    const block   = m[1];
    const title   = strip(block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || block.match(/<title>(.*?)<\/title>/)?.[1] || "");
    const link    = strip(block.match(/<link>(.*?)<\/link>/)?.[1] || "");
    const pubDate = strip(block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "");
    const desc    = strip(block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || "");
    if (title) items.push({ ticker, title, link, pubDate, desc: desc.slice(0, 160) });
  }
  return items.slice(0, 8);
}

function strip(s) { return (s || "").replace(/<[^>]+>/g, "").trim(); }

// ══════════════════════════════════════════════════════════════
//  AVANZA ETP — search leveraged products
// ══════════════════════════════════════════════════════════════
async function handleAvanza(url, origin) {
  const query = url.searchParams.get("query") || "mini l silver";

  const res = await fetch(
    `https://www.avanza.se/ab/sok/inline?query=${encodeURIComponent(query)}&suggestLimit=20`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept":     "application/json",
        "Referer":    "https://www.avanza.se",
      }
    }
  );
  const data = await res.json();

  // Avanza returns hits array with type, name, id, lastPrice etc.
  const hits = (data?.hits || []).map(h => ({
    id:          h.id,
    name:        h.name,
    type:        h.instrumentType,
    lastPrice:   h.lastPrice,
    changePercent: h.changePercent,
    currency:    h.currency,
    url:         `https://www.avanza.se/mini-futures/om-mini-future.html/${h.id}/${h.urlSlug || ""}`,
  })).filter(h => ["MINI_FUTURE","WARRANT","CERTIFICATE","EXCHANGE_TRADED_FUND"].includes(h.type));

  return ok({ query, hits }, origin);
}

// ══════════════════════════════════════════════════════════════
//  AI ANALYSIS — OpenAI GPT-4o
// ══════════════════════════════════════════════════════════════
async function handleAI(req, origin) {
  const body = await req.json();
  const { prompt, context, type } = body;

  // type: "sentiment" | "review" | "plan"
  const systemPrompts = {
    sentiment: `You are a professional equity analyst. Analyze the market sentiment and key risks for the given stocks. 
Be concise, specific, and actionable. Format: 
1. Overall Sentiment (Bullish/Bearish/Neutral with 1-2 sentences)
2. Key Risk Factors (bullet points)
3. Opportunities (bullet points)
4. Suggested Actions (bullet points)
Keep total response under 350 words.`,

    review: `You are a trading coach analyzing a trader's daily P&L and positions.
Review the performance objectively. Format:
1. Session Summary (1-2 sentences)
2. What Worked (bullet points)
3. What Needs Improvement (bullet points)
4. Key Lessons (bullet points)
5. Tomorrow's Focus (bullet points)
Keep total response under 300 words. Be direct and honest.`,

    plan: `You are a trading strategist. Based on the current holdings, technicals, and macro environment provided,
suggest a daily trading plan. Format:
1. Market Context (2-3 sentences)
2. Priority Watchlist (ranked by opportunity)
3. Entry Scenarios (specific price levels if possible)
4. Risk Management Notes
Keep total response under 300 words.`,
  };

  const systemMsg = systemPrompts[type] || systemPrompts.sentiment;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      model:       "gpt-4o",
      max_tokens:  600,
      temperature: 0.7,
      messages: [
        { role: "system",  content: systemMsg },
        { role: "user",    content: `${prompt}\n\nContext:\n${JSON.stringify(context, null, 2)}` },
      ],
    }),
  });

  const data = await res.json();
  if (data.error) return err(data.error.message, 500, origin);

  return ok({
    text:   data.choices?.[0]?.message?.content || "",
    tokens: data.usage?.total_tokens,
  }, origin);
}

// ── Yahoo Finance headers ────────────────────────────────────
function yahooHeaders() {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept":     "application/json",
    "Referer":    "https://finance.yahoo.com",
  };
}

function toUnix(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}
