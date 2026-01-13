export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Missing REPLICATE_API_TOKEN in Vercel env vars" });
    }

    const body = req.body || {};
    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Create a prediction using version hash
    const createResp = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        input: {
          prompt: `${prompt}, anime style, dark cinematic lighting, highly detailed, japanese animation`,
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 80,
        },
      }),
    });

    const createText = await createResp.text();
    let createJson;
    try {
      createJson = JSON.parse(createText);
    } catch {
      return res.status(500).json({ error: "Replicate returned non-JSON", raw: createText.slice(0, 300) });
    }

    if (!createResp.ok) {
      return res.status(createResp.status).json({
        error: createJson?.detail || createJson?.error || "Replicate create prediction failed",
        raw: createJson,
      });
    }

    // Poll until done
    let prediction = createJson;
    const getUrl = prediction?.urls?.get;
    if (!getUrl) {
      return res.status(500).json({ error: "Replicate did not return a polling URL", raw: prediction });
    }

    const start = Date.now();
    const timeoutMs = 120000;

    while (
      prediction.status === "starting" ||
      prediction.status === "processing"
    ) {
      if (Date.now() - start > timeoutMs) {
        return res.status(504).json({ error: "Timed out waiting for Replicate", raw: prediction });
      }

      await new Promise((r) => setTimeout(r, 1200));

      const pollResp = await fetch(getUrl, {
        headers: { Authorization: `Token ${token}` },
      });

      const pollText = await pollResp.text();
      try {
        prediction = JSON.parse(pollText);
      } catch {
        return res.status(500).json({ error: "Replicate poll returned non-JSON", raw: pollText.slice(0, 300) });
      }

      if (!pollResp.ok) {
        return res.status(pollResp.status).json({ error: "Replicate poll failed", raw: prediction });
      }
    }

    if (prediction.status !== "succeeded") {
      return res.status(500).json({
        error: "Replicate prediction failed",
        status: prediction.status,
        raw: prediction,
      });
    }

    const out = prediction.output;
    const imageUrl = Array.isArray(out) ? out[0] : out;

    return res.status(200).json({ image: imageUrl });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
