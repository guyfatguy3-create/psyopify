export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const HF_TOKEN = process.env.HF_TOKEN;

  if (!HF_TOKEN) {
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
      // Using FLUX model which is reliable and high quality
      response = await fetch(
        'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt + ', anime art style, japanese anime, detailed illustration, high quality',
          }),
        }
      );
    } else if (type === 'image-to-anime') {
      // For image transformation - using same model with anime prompt
      response = await fetch(
        'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-dev',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: 'anime style portrait, japanese animation, detailed, cinematic lighting, high quality',
          }),
        }
      );
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      
      if (errorText.includes('loading') || errorText.includes('currently loading')) {
        return new Response(JSON.stringify({ error: 'Model is warming up. Please wait 30 seconds and try again.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return new Response(JSON.stringify({ image: `data:image/png;base64,${base64}` }), {
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
