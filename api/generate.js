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

    // Create prediction using Animagine XL 4.0
    const createResp = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "057e2276ac5dcd8d1575dc37b131f903df9c10c41aed53d47cd7d4f068c19fa5",
        input: {
          prompt: `masterpiece, best quality, ${prompt}`,
          negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, bad-hands-5, bad_prompt_version2",
          width: 1024,
          height: 1024,
          num_inference_steps: 28,
          guidance_scale: 7,
          num_outputs: 1,
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

      await new Promise((r) => setTimeout(r, 1500));

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
