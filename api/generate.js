export const config = { runtime: "nodejs" };

// Convert natural language to Danbooru-style tags
function convertToTags(prompt) {
  let tags = [];
  const p = prompt.toLowerCase();
  
  // Gender
  if (p.includes('girl') || p.includes('woman') || p.includes('female')) {
    tags.push('1girl', 'solo');
  } else if (p.includes('boy') || p.includes('man') || p.includes('male')) {
    tags.push('1boy', 'solo');
  }
  
  // Skin tone
  if (p.includes('black') || p.includes('dark skin') || p.includes('dark-skin')) {
    tags.push('dark skin', 'dark-skinned female');
  } else if (p.includes('tan') || p.includes('tanned')) {
    tags.push('tan', 'tanned');
  }
  
  // Body type
  if (p.includes('fat') || p.includes('chubby') || p.includes('thick')) {
    tags.push('chubby', 'plump', 'thick thighs', 'wide hips');
  } else if (p.includes('muscular') || p.includes('buff')) {
    tags.push('muscular', 'abs', 'toned');
  } else if (p.includes('slim') || p.includes('thin') || p.includes('petite')) {
    tags.push('slim', 'petite');
  }
  
  // Sexy/attractive
  if (p.includes('sexy') || p.includes('hot') || p.includes('attractive')) {
    tags.push('sexy', 'seductive smile', 'alluring');
  }
  if (p.includes('cute') || p.includes('kawaii')) {
    tags.push('cute', 'kawaii');
  }
  
  // Hair colors
  if (p.includes('blonde') || p.includes('blond')) tags.push('blonde hair');
  else if (p.includes('black hair')) tags.push('black hair');
  else if (p.includes('white hair')) tags.push('white hair');
  else if (p.includes('red hair')) tags.push('red hair');
  else if (p.includes('blue hair')) tags.push('blue hair');
  else if (p.includes('pink hair')) tags.push('pink hair');
  else if (p.includes('purple hair')) tags.push('purple hair');
  else if (p.includes('brown hair')) tags.push('brown hair');
  else if (p.includes('green hair')) tags.push('green hair');
  
  // Hair length
  if (p.includes('long hair')) tags.push('long hair');
  else if (p.includes('short hair')) tags.push('short hair');
  else if (p.includes('medium hair')) tags.push('medium hair');
  
  // Eye colors
  if (p.includes('blue eyes')) tags.push('blue eyes');
  else if (p.includes('red eyes')) tags.push('red eyes');
  else if (p.includes('green eyes')) tags.push('green eyes');
  else if (p.includes('brown eyes')) tags.push('brown eyes');
  else if (p.includes('golden eyes') || p.includes('gold eyes')) tags.push('golden eyes');
  else if (p.includes('purple eyes')) tags.push('purple eyes');
  
  // Actions/poses
  if (p.includes('flying')) tags.push('flying', 'floating', 'sky', 'clouds', 'wind');
  if (p.includes('sitting')) tags.push('sitting');
  if (p.includes('standing')) tags.push('standing');
  if (p.includes('running')) tags.push('running');
  if (p.includes('fighting') || p.includes('battle')) tags.push('fighting stance', 'action', 'dynamic pose');
  if (p.includes('sleeping') || p.includes('asleep')) tags.push('sleeping', 'closed eyes');
  if (p.includes('crying')) tags.push('crying', 'tears');
  if (p.includes('smiling') || p.includes('smile')) tags.push('smile', 'happy');
  if (p.includes('angry') || p.includes('mad')) tags.push('angry', 'frown');
  
  // Settings/backgrounds
  if (p.includes('beach') || p.includes('ocean')) tags.push('beach', 'ocean', 'sand', 'summer');
  if (p.includes('forest') || p.includes('woods')) tags.push('forest', 'trees', 'nature');
  if (p.includes('city') || p.includes('urban')) tags.push('city', 'cityscape', 'urban');
  if (p.includes('night')) tags.push('night', 'night sky', 'moon');
  if (p.includes('rain')) tags.push('rain', 'wet', 'water drops');
  if (p.includes('snow') || p.includes('winter')) tags.push('snow', 'winter', 'cold');
  if (p.includes('school')) tags.push('school', 'classroom', 'school uniform');
  if (p.includes('space') || p.includes('galaxy')) tags.push('space', 'stars', 'galaxy');
  
  // Clothing
  if (p.includes('dress')) tags.push('dress');
  if (p.includes('bikini') || p.includes('swimsuit')) tags.push('bikini', 'swimsuit');
  if (p.includes('uniform')) tags.push('uniform');
  if (p.includes('armor')) tags.push('armor', 'knight');
  if (p.includes('kimono')) tags.push('kimono', 'japanese clothes');
  if (p.includes('hoodie')) tags.push('hoodie');
  if (p.includes('jacket')) tags.push('jacket');
  
  // Styles
  if (p.includes('cyberpunk')) tags.push('cyberpunk', 'neon lights', 'futuristic');
  if (p.includes('fantasy')) tags.push('fantasy', 'magic', 'magical');
  if (p.includes('mecha') || p.includes('robot')) tags.push('mecha', 'robot', 'mechanical');
  if (p.includes('demon')) tags.push('demon girl', 'horns', 'demon');
  if (p.includes('angel')) tags.push('angel', 'wings', 'halo', 'white wings');
  if (p.includes('vampire')) tags.push('vampire', 'fangs', 'red eyes');
  if (p.includes('witch')) tags.push('witch', 'witch hat', 'magic');
  if (p.includes('ninja')) tags.push('ninja', 'mask');
  if (p.includes('samurai')) tags.push('samurai', 'katana', 'armor');
  if (p.includes('warrior')) tags.push('warrior', 'weapon', 'armor');
  
  // If no tags found, use the original prompt as-is
  if (tags.length === 0) {
    return prompt;
  }
  
  // Add quality tags
  tags.unshift('masterpiece', 'best quality', 'high quality', 'detailed');
  
  return tags.join(', ');
}

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
    const rawPrompt = (body.prompt || "").trim();

    if (!rawPrompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    // Convert natural language to tags
    const prompt = convertToTags(rawPrompt);

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
          prompt: prompt,
          negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, bad-hands-5, nsfw, nude, naked",
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
