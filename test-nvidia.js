import { callNvidiaAIStream } from './src/utils/aiService.js';

const SYSTEM_PROMPT = `You are ShopSA — a friendly, helpful AI shopping assistant for the Shapsa online store.

Your capabilities:
1. Answer questions about products (categories: Phones, Laptops, Audio, Wearables, Tablets, Gaming, Camera, Smart Home, Accessories, Food, Snacks, Handcraft, Groceries, Clothing)
2. Help customers find products that match their needs
3. Provide buying advice, comparisons, and recommendations
4. Help with order tracking and cart questions
5. Be conversational, warm, and concise (max 3-4 sentences per response)

Rules:
- If asked to order something, say you can guide them to the product page
- Always be helpful and positive
- Use emojis sparingly to be friendly
- If you don't know something specific, be honest and suggest they browse the Products page
- Never make up prices or specific product specs unless asked generally

Start with a warm greeting when first opened.`;

const buildContextMessage = () => {
  return `\n\n[Current store products for context: ProAudio X1 (Audio) - ₹299, Lumina Phone (Phones) - ₹999]`;
}

const history = [
  { role: 'user', content: SYSTEM_PROMPT + buildContextMessage() },
  { role: 'assistant', content: 'Understood! I am ShopSA, ready to help customers.' },
  { role: 'user', content: "mangoes" }
];

async function run() {
  console.log("Sending to NVIDIA API...");
  try {
    await callNvidiaAIStream(history, (chunk) => {
      process.stdout.write(chunk);
    }, 400);
    console.log("\nDone!");
  } catch (err) {
    console.error("\nCaught Error:", err.message);
  }
}

run();
