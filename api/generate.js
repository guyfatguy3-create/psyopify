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
      response = await fetch(
        'https://api-inference.huggingface.co/models/Linaqruf/animagine-xl',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt + ', anime style, high quality, detailed',
          }),
        }
      );
    } else if (type === 'image-to-anime') {
      response = await fetch(
        'https://api-inference.huggingface.co/models/lllyasviel/sd-controlnet-canny',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
          },
          body: image,
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
      
      if (errorText.includes('loading')) {
        return new Response(JSON.stringify({ error: 'Model is loading, please try again in 20 seconds' }), {
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
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
