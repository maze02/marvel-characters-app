/**
 * Vercel Serverless Function - Comic Vine API Proxy
 *
 * This proxy solves CORS issues by making API requests server-side
 * where browser CORS restrictions don't apply.
 */
function decodeRepeatedly(value) {
  // Axios (and some clients) may double-encode query params.
  // Decode multiple times until it stabilizes or errors.
  let current = value;
  for (let i = 0; i < 5; i++) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

function getSingle(value) {
  return Array.isArray(value) ? value[0] : value;
}

module.exports = async (req, res) => {
  // Enable CORS for your frontend (not strictly needed for same-origin calls,
  // but helpful for debugging and future reuse).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const query = req.query || {};
    const url = getSingle(query.url);
    const endpoint = getSingle(query.endpoint);

    let targetUrl;

    // Backwards-compatible mode (older builds): /api/proxy?url=https%3A%2F%2Fcomicvine...
    if (url) {
      targetUrl = decodeRepeatedly(url);

      // Validate it's a Comic Vine URL (security)
      if (!targetUrl.startsWith("https://comicvine.gamespot.com/api/")) {
        return res.status(403).json({ error: "Invalid API endpoint" });
      }
    } else {
      // Secure mode (recommended): /api/proxy?endpoint=/characters/&filter=...&limit=...
      if (!endpoint) {
        return res
          .status(400)
          .json({ error: "Missing endpoint parameter (or legacy url parameter)" });
      }

      const apiKey = process.env.COMICVINE_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error:
            "Server not configured: missing COMICVINE_API_KEY. Add it in Vercel project env vars (Preview + Production).",
        });
      }

      const normalizedEndpoint = endpoint.startsWith("/")
        ? endpoint
        : `/${endpoint}`;

      const u = new URL(`https://comicvine.gamespot.com/api${normalizedEndpoint}`);

      // Copy all query params except our internal ones.
      for (const [key, value] of Object.entries(query)) {
        if (key === "endpoint" || key === "url") continue;
        const v = getSingle(value);
        if (v === undefined) continue;
        u.searchParams.set(key, String(v));
      }

      // Force required params server-side
      u.searchParams.set("api_key", apiKey);
      u.searchParams.set("format", "json");
      targetUrl = u.toString();
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Marvel-Characters-App/1.0",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Comic Vine API error: ${response.statusText}`,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return res.status(500).json({
      error: "Failed to fetch from Comic Vine API",
      message: error?.message ?? String(error),
    });
  }
};
