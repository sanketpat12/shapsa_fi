import { Buffer } from 'node:buffer';

const NVIDIA_API_KEY = "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";

async function testVision() {
  // 1x1 black pixel base64
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  const payload = {
    // try different vision models if one fails
    model: "meta/llama-3.2-11b-vision-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What color is this exact image?" },
          { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } }
        ]
      }
    ],
    max_tokens: 50
  };

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      console.error("FAIL:", await res.text());
      return;
    }
    const data = await res.json();
    console.log("SUCCESS:", data.choices[0].message.content);
  } catch(e) {
    console.error("ERR:", e);
  }
}

testVision();
