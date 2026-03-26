/**
 * NVIDIA AI Service - google/gemma-3-27b-it
 * Shared utility for all AI features in the app
 */

const NVIDIA_API_URL = "/api/nvidia/v1/chat/completions";
const NVIDIA_API_KEY = "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";
const MODEL = "google/gemma-3-27b-it";

/**
 * Core function: calls NVIDIA API (non-streaming) and returns the response text.
 * @param {string} prompt - The user message
 * @param {string} systemPrompt - Optional system role message
 * @param {number} maxTokens - Max tokens to generate
 */
export async function callNvidiaAI(prompt, systemPrompt = "", maxTokens = 512) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "user", content: systemPrompt });
    messages.push({ role: "assistant", content: "Understood. I will follow those instructions." });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
      stream: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NVIDIA API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Streaming version: calls NVIDIA API with SSE streaming and yields chunks.
 * @param {Array} messages - Full message array [{role, content}]
 * @param {function} onChunk - Callback called with each text chunk
 * @param {number} maxTokens
 */
export async function callNvidiaAIStream(messages, onChunk, maxTokens = 600) {
  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("NVIDIA API Streaming Error:", response.status, errorText);
    throw new Error(`NVIDIA API error ${response.status}: ${errorText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const chunk = json.choices?.[0]?.delta?.content;
          if (chunk) onChunk(chunk);
        } catch {
          // Skip malformed chunks
        }
      }
    }
  }
}

/**
 * Generate a product description using AI.
 * @param {string} productName
 * @param {string} category
 * @returns {Promise<string>} Generated description
 */
export async function generateProductDescription(productName, category) {
  const prompt = `Write a compelling, concise product description (2-3 sentences, max 60 words) for a product called "${productName}" in the "${category}" category. Be specific, enthusiastic, and highlight key benefits. Do NOT include any title or label — just the description text itself.`;
  return await callNvidiaAI(prompt, "", 200);
}

/**
 * Analyze sell-wise demand for a list of products using AI.
 * @param {Array} products - Array of product objects
 * @returns {Promise<string>} AI analysis text
 */
export async function analyzeSellWiseDemand(products) {
  if (!products.length) return "No products to analyze.";
  const top5 = products.slice(0, 5).map(p => `- ${p.name} (${p.category}, ₹${p.price}, stock: ${p.stock})`).join("\n");
  const prompt = `You are a retail inventory AI. Here are my top products:\n${top5}\n\nGive a brief 3-point demand analysis and restocking recommendation (max 80 words total). Use bullet points. Be practical and direct.`;
  return await callNvidiaAI(prompt, "", 200);
}

/**
 * Analyze popular products for a specific area using AI.
 * @param {string} area - City name
 * @param {Array} products - Array of product objects
 * @returns {Promise<string>} AI analysis text
 */
export async function analyzePopularInArea(area, products) {
  if (!products.length) return "No products to analyze.";
  const productList = products.slice(0, 5).map(p => `- ${p.name} (${p.category})`).join("\n");
  const prompt = `You are a retail AI. These are my products:\n${productList}\n\nFor the city "${area}" in India, give 2-3 bullet points on which categories/products would likely be most popular and why. Max 70 words. Be specific to the city's demographics.`;
  return await callNvidiaAI(prompt, "", 200);
}
