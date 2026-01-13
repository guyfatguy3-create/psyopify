export const config = { runtime: "nodejs", maxDuration: 60 };

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
    const type = body.type || "text-to-image";
    const rawPrompt = (body.prompt || "").trim();
    const image = body.image || null;

    // IMAGE TO ANIME
    if (type === "image-to-anime") {
      if (!image) {
        return res.status(400).json({ error: "Missing image" });
      }

      // Use AnimeGANv2 for image-to-anime
      const createResp = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "a3e049f3ad0fe0d28ad24fa30aac2e5da595dd3f266899510c2691b16fd135b7",
          input: {
            image: image,
            model: "Hayao",
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
          error: createJson?.detail || createJson?.error || "Replicate failed",
          raw: createJson,
        });
      }

      // Poll for result
      let prediction = createJson;
      const getUrl = prediction?.urls?.get;
      if (!getUrl) {
        return res.status(500).json({ error: "No polling URL", raw: prediction });
      }

      const start = Date.now();
      while (prediction.status === "starting" || prediction.status === "processing") {
        if (Date.now() - start > 60000) {
          return res.status(504).json({ error: "Timeout" });
        }
        await new Promise((r) => setTimeout(r, 1000));
        const pollResp = await fetch(getUrl, {
          headers: { Authorization: `Token ${token}` },
        });
        prediction = await pollResp.json();
      }

      if (prediction.status !== "succeeded") {
        return res.status(500).json({ error: "Failed", raw: prediction });
      }

      return res.status(200).json({ image: prediction.output });
    }

    // TEXT TO ANIME
    if (!rawPrompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const prompt = convertToTags(rawPrompt);

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
          negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name",
          width: 512,
          height: 512,
          num_inference_steps: 20,
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
        error: createJson?.detail || createJson?.error || "Replicate failed",
        raw: createJson,
      });
    }

    let prediction = createJson;
    const getUrl = prediction?.urls?.get;
    if (!getUrl) {
      return res.status(500).json({ error: "No polling URL", raw: prediction });
    }

    const start = Date.now();
    while (prediction.status === "starting" || prediction.status === "processing") {
      if (Date.now() - start > 60000) {
        return res.status(504).json({ error: "Timeout" });
      }
      await new Promise((r) => setTimeout(r, 1000));
      const pollResp = await fetch(getUrl, {
        headers: { Authorization: `Token ${token}` },
      });
      prediction = await pollResp.json();
    }

    if (prediction.status !== "succeeded") {
      return res.status(500).json({ error: "Failed", raw: prediction });
    }

    const out = prediction.output;
    const imageUrl = Array.isArray(out) ? out[0] : out;

    return res.status(200).json({ image: imageUrl });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
