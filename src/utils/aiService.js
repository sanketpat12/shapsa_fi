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
export async function generateProductDescription(productName, category, base64Image = null) {
  if (base64Image) {
    const prompt = `Write a compelling, concise product description (2-3 sentences, max 60 words) for a product called "${productName}" in the "${category}" category. Describe its visual features based on the image provided. Be specific, enthusiastic, and highlight key benefits. Do NOT include any title or label — just the description text itself.`;
    return await analyzeImageWithAI(base64Image, prompt);
  } else {
    const prompt = `Write a compelling, concise product description (2-3 sentences, max 60 words) for a product called "${productName}" in the "${category}" category. Be specific, enthusiastic, and highlight key benefits. Do NOT include any title or label — just the description text itself.`;
    return await callNvidiaAI(prompt, "", 200);
  }
}

/**
 * Generate a product category and matching emoji using AI.
 * @param {string} productName
 * @param {string} description
 * @returns {Promise<{category: string, emoji: string}>} Generated category details
 */
export async function generateProductCategoryWithEmoji(productName, description) {
  const prompt = `You are a retail category generator. Given the product name "${productName}" and description "${description}", suggest the single most appropriate short category name (e.g. "Smartphones", "Skincare", "Beverages") and a single matching emoji. 
Return ONLY a valid JSON object in this exact format, with no markdown formatting or extra text:
{"category": "Category Name", "emoji": "📱"}`;
  
  try {
    let result = await callNvidiaAI(prompt, "", 100);
    result = result.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(result);
  } catch (err) {
    console.error("AI Category Error:", err);
    return { category: "Other", emoji: "📦" };
  }
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
 * @param {Array} popularProducts - Array of product objects
 * @returns {Promise<string>} AI analysis text
 */
export async function analyzePopularInArea(area, popularProducts) {
  const productList = popularProducts.slice(0, 10).map(p => `- ${p.name} (${p.category})`).join('\n');
  const prompt = `You are a retail AI. These are my products:\n${productList}\n\nFor the city "${area}" in India, give 2-3 bullet points on which categories/products would likely be most popular and why. Max 70 words. Be specific to the city's demographics.`;
  return await callNvidiaAI(prompt, "", 200);
}

/**
 * Analyze dead stock inventory using AI.
 * @param {Array} deadProducts - Array of product objects identified as dead stock
 * @returns {Promise<string>} AI analysis and liquidation recommendations
 */
export async function analyzeDeadStock(deadProducts) {
  if (!deadProducts || deadProducts.length === 0) return "No dead stock detected.";
  const productList = deadProducts.slice(0, 5).map(p => `- ${p.name} (${p.category}) - ${p.stock} units left`).join('\n');
  const prompt = `You are a retail inventory expert. I have the following "Dead Stock" items that haven't sold in months:\n${productList}\n\nProvide 2-3 brief, highly actionable strategic bullet points on how to liquidate this inventory (e.g., bundling, targeted flash sales, returning to vendor). Keep it under 60 words and be direct.`;
  return await callNvidiaAI(prompt, "", 200);
}

/**
 * Automatically dynamically detect which products are Dead Stock using AI.
 * @param {Array} inventory - Full array of products with their sales history
 * @returns {Promise<Array<string>>} - Array of product IDs determined to be dead stock
 */
export async function detectDeadStockIds(inventory) {
  if (!inventory || inventory.length === 0) return [];
  const simplified = inventory.map(p => ({
    id: p.id,
    salesCount: (p.salesHistory || []).reduce((a, b) => a + b, 0),
    stock: p.stock
  }));
  
  const prompt = `You are an AI retail data analyst. Look at this inventory:
${JSON.stringify(simplified)}

Your job is to identify which items are "Dead Stock" (items with very low logic sales vs stock, e.g. 0 to 2 total sales max). 
Return ONLY a strictly valid bare JSON array of strings representing the "id" properties of the dead items, like ["id1", "id2"]. 
Do NOT output anything else. No markdown, no intro text, just the raw array brackets.`;

  try {
    let result = await callNvidiaAI(prompt, "", 500);
    // clean up any markdown if the LLM leaked it
    result = result.replace(/```json/g, "").replace(/```/g, "").trim();
    const ids = JSON.parse(result);
    return Array.isArray(ids) ? ids : [];
  } catch (err) {
    console.error("AI Detection Error:", err);
    // fallback to math if AI completely fails JSON parsing
    return simplified.filter(p => p.salesCount <= 2).map(p => p.id);
  }
}

/**
 * True Vision Image Analysis using Llama 3.2 Vision Instruct
 * @param {string} base64Image - The raw base64 string of the image (without data:image/... prefix)
 * @param {string} prompt - Question to ask about the image
 * @returns {Promise<string>} AI description
 */
export async function analyzeImageWithAI(base64Image, prompt = "Describe the main subjects or items in this image in detail.") {
  const payload = {
    model: "meta/llama-3.2-11b-vision-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }
    ],
    max_tokens: 300,
    temperature: 0.3,
  };

  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Vision API Error:", err);
    throw new Error(`Vision API error ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Could not analyze image.";
}
