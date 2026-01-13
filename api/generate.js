export const config = { runtime: "nodejs", maxDuration: 60 };

// Convert natural language to Danbooru-style tags
function convertToTags(prompt) {
  let tags = [];
  const p = prompt.toLowerCase();
  
  if (p.includes('girl') || p.includes('woman') || p.includes('female')) {
    tags.push('1girl', 'solo');
  } else if (p.includes('boy') || p.includes('man') || p.includes('male')) {
    tags.push('1boy', 'solo');
  }
  
  if (p.includes('black') || p.includes('dark skin') || p.includes('dark-skin') || p.includes('african')) {
    tags.push('dark skin', 'dark-skinned female');
  } else if (p.includes('tan') || p.includes('tanned')) {
    tags.push('tan', 'tanned');
  }
  
  if (p.includes('fat') || p.includes('chubby') || p.includes('thick') || p.includes('bbw') || p.includes('plump')) {
    tags.push('chubby', 'plump', 'thick thighs', 'wide hips', 'curvy');
  } else if (p.includes('muscular') || p.includes('buff')) {
    tags.push('muscular', 'abs', 'toned');
  } else if (p.includes('slim') || p.includes('thin') || p.includes('petite')) {
    tags.push('slim', 'petite');
  }
  
  if (p.includes('sexy') || p.includes('hot') || p.includes('attractive')) {
    tags.push('sexy', 'alluring');
  }
  if (p.includes('cute') || p.includes('kawaii')) {
    tags.push('cute', 'kawaii');
  }
  
  if (p.includes('blonde') || p.includes('blond')) tags.push('blonde hair');
  else if (p.includes('black hair')) tags.push('black hair');
  else if (p.includes('white hair')) tags.push('white hair');
  else if (p.includes('red hair')) tags.push('red hair');
  else if (p.includes('blue hair')) tags.push('blue hair');
  else if (p.includes('pink hair')) tags.push('pink hair');
  else if (p.includes('purple hair')) tags.push('purple hair');
  else if (p.includes('brown hair')) tags.push('brown hair');
  else if (p.includes('green hair')) tags.push('green hair');
  
  if (p.includes('long hair')) tags.push('long hair');
  else if (p.includes('short hair')) tags.push('short hair');
  
  if (p.includes('blue eyes')) tags.push('blue eyes');
  else if (p.includes('red eyes')) tags.push('red eyes');
  else if (p.includes('green eyes')) tags.push('green eyes');
  else if (p.includes('brown eyes')) tags.push('brown eyes');
  else if (p.includes('golden eyes')) tags.push('golden eyes');
  
  if (p.includes('flying')) tags.push('flying', 'floating', 'sky', 'clouds');
  if (p.includes('sitting')) tags.push('sitting');
  if (p.includes('standing')) tags.push('standing');
  if (p.includes('fighting') || p.includes('battle')) tags.push('fighting stance', 'action');
  if (p.includes('smiling') || p.includes('smile')) tags.push('smile');
  
  if (p.includes('beach')) tags.push('beach', 'ocean', 'summer');
  if (p.includes('forest')) tags.push('forest', 'nature');
  if (p.includes('city')) tags.push('city', 'cityscape');
  if (p.includes('night')) tags.push('night', 'night sky');
  if (p.includes('rain')) tags.push('rain');
  
  if (p.includes('cat')) tags.push('cat', 'animal focus');
  if (p.includes('dog')) tags.push('dog', 'animal focus');
  
  if (p.includes('cyberpunk')) tags.push('cyberpunk', 'neon');
  if (p.includes('fantasy')) tags.push('fantasy', 'magic');
  if (p.includes('demon')) tags.push('demon girl', 'horns');
  if (p.includes('angel')) tags.push('angel', 'wings', 'halo');
  
  if (tags.length === 0) {
    return 'masterpiece, best quality, ' + prompt;
  }
  
  tags.unshift('masterpiece', 'best quality', 'high score', 'great score');
  return tags.join(', ');
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Missing REPLICATE_API_TOKEN" });
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

      const createResp = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "7d44f1878a07e7b5a32af9727c1f6120cac04203d48f3f7b0432e28fa8e5c6b6",
          input: {
            image: image,
            model: "Hayao",
          },
        }),
      });

      const createJson = await createResp.json();
      
      if (!createResp.ok) {
        return res.status(createResp.status).json({ error: createJson?.detail || createJson?.error || "Failed", raw: createJson });
      }

      let prediction = createJson;
      const getUrl = prediction?.urls?.get;
      if (!getUrl) {
        return res.status(500).json({ error: "No polling URL", raw: prediction });
      }

      const start = Date.now();
      while (prediction.status === "starting" || prediction.status === "processing") {
        if (Date.now() - start > 60000) return res.status(504).json({ error: "Timeout" });
        await new Promise(r => setTimeout(r, 1000));
        const pollResp = await fetch(getUrl, { headers: { Authorization: `Token ${token}` } });
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
          negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, worst quality, low quality, low score, bad score, average score, signature, watermark, username, blurry",
          width: 832,
          height: 1216,
          num_inference_steps: 25,
          guidance_scale: 6,
          num_outputs: 1,
        },
      }),
    });

    const createJson = await createResp.json();

    if (!createResp.ok) {
      return res.status(createResp.status).json({ error: createJson?.detail || createJson?.error || "Failed" });
    }

    let prediction = createJson;
    const getUrl = prediction?.urls?.get;
    if (!getUrl) {
      return res.status(500).json({ error: "No polling URL" });
    }

    const start = Date.now();
    while (prediction.status === "starting" || prediction.status === "processing") {
      if (Date.now() - start > 60000) return res.status(504).json({ error: "Timeout" });
      await new Promise(r => setTimeout(r, 1000));
      const pollResp = await fetch(getUrl, { headers: { Authorization: `Token ${token}` } });
      prediction = await pollResp.json();
    }

    if (prediction.status !== "succeeded") {
      return res.status(500).json({ error: "Failed" });
    }

    const out = prediction.output;
    const imageUrl = Array.isArray(out) ? out[0] : out;

    return res.status(200).json({ image: imageUrl });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
