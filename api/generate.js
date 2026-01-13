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

    let prediction;

    if (type === 'text-to-image') {
      // Using Anything V3 anime model
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'f410ed4c6a0c3bf8b76747860b01a52c9b784a6d9e6a85c3a76f062fb8c2986c',
          input: {
            prompt: prompt + ', anime style, masterpiece, best quality, detailed anime illustration, cinematic lighting',
            negative_prompt: 'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, blurry, realistic, 3d',
            width: 512,
            height: 512,
            num_outputs: 1,
          },
        }),
      });

      prediction = await response.json();
    } else if (type === 'image-to-anime') {
      // Using AnimeGAN for image to anime conversion
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: '4e6bcdb0882e9c0f678e644a08bbf3dcec631f57666d67a9845e5e8cd27eb92b',
          input: {
            image: image,
          },
        }),
      });

      prediction = await response.json();
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (prediction.error) {
      return new Response(JSON.stringify({ error: prediction.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Poll for result
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60;

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        },
      });
      
      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === 'failed') {
      return new Response(JSON.stringify({ error: result.error || 'Generation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (result.status !== 'succeeded') {
      return new Response(JSON.stringify({ error: 'Generation timed out' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;

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
