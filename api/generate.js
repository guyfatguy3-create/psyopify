export const config = {
  runtime: 'edge',
  maxDuration: 60,
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

  if (!REPLICATE_API_TOKEN) {
    return new Response(JSON.stringify({ error: 'API token not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { type, prompt, image } = body;

    let response;

    if (type === 'text-to-image') {
      response = await fetch('https://api.replicate.com/v1/models/cjwbw/anything-v4.0/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt: prompt + ', anime style, masterpiece, best quality, detailed anime illustration, cinematic lighting',
            negative_prompt: 'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, blurry, realistic, 3d',
            width: 512,
            height: 512,
          },
        }),
      });
    } else if (type === 'image-to-anime') {
      response = await fetch('https://api.replicate.com/v1/models/cjwbw/animeganv2/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          input: {
            image: image,
          },
        }),
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If prediction completed immediately (with Prefer: wait)
    if (result.output) {
      const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return new Response(JSON.stringify({ image: imageUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If still processing, poll for result
    let prediction = result;
    let attempts = 0;
    const maxAttempts = 60;

    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
        },
      });
      
      prediction = await pollResponse.json();
      attempts++;
    }

    if (prediction.status === 'failed') {
      return new Response(JSON.stringify({ error: prediction.error || 'Generation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (prediction.status !== 'succeeded') {
      return new Response(JSON.stringify({ error: 'Generation timed out' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;

    return new Response(JSON.stringify({ image: imageUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
