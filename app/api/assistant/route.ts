import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const filePath = path.join(process.cwd(), 'products.txt');
    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ reply: "Error: Local products.txt file not found." }), { status: 404 });
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const allProducts = fileContent.split('----');

    // ========================================================
    // 🌟 STEP 1: OPENAI SE SPELLING AUR KEYWORDS THEEK KARWANA
    // ========================================================
    const keywordCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are an eCommerce search optimizer. Extract 2-3 main clothing keywords from the user message. Correct any spelling mistakes (e.g., sharee -> saree, lehanga -> lehenga). Ignore stop words like "color", "show", "me", "want". Output ONLY the keywords separated by spaces. Example output: red saree' 
        },
        { role: 'user', content: message }
      ],
      temperature: 0, // 0 temperature taaki ye exact result de
    });

    const aiCleanedText = keywordCompletion.choices[0]?.message?.content || "";
    const keywords = aiCleanedText.toLowerCase().split(' ').filter(k => k.length > 2);

    console.log("Original Message:", message);
    console.log("AI Extracted Keywords:", keywords);

    // ========================================================
    // 🔍 STEP 2: LOCAL SEARCH (AI ke diye gaye clean keywords se)
    // ========================================================
    let matchedProducts = allProducts.filter(productBlock => {
      return keywords.every((kw: string) => productBlock.toLowerCase().includes(kw));
    }).slice(0, 20);

    if (matchedProducts.length === 0 && keywords.length > 0) {
      matchedProducts = allProducts.filter(productBlock => {
        return keywords.some((kw: string) => productBlock.toLowerCase().includes(kw));
      }).slice(0, 20);
    }

    // ========================================================
    // 🤖 STEP 3: FINAL OPENAI RESPONSE (Cards generate karne ke liye)
    // ========================================================
    const systemInstruction = `
      
      You are the luxury ethnic wear assistant for Like A Diva.
      
      Relevant products found in local system:
      ===================================
      ${matchedProducts.join('\n----\n')}
      ===================================

      YOUR TASK:
      1. Introduce the products nicely to the customer.
      2. For EVERY product you display, you MUST use this exact single-line format:
         PRODUCT_CARD|Name: [Product Name]|Price: ₹[Price]|Image: [First URL]|Link: [Store URL]|Code: [Product Code/SKU]|Desc: [Point 1] ~ [Point 2] ~ [Point 3] ~ [Point 4] ~ [Point 5]
      3. For the 'Desc' field, generate exactly 5 short bullet points (like Fabric, Work, or Occasion) based on the product data. Separate each point using a tilde (~).
         Example: Desc: Premium Silk Fabric ~ Intricate Zari Embroidery ~ Perfect for Weddings
      4. From 'Image Paths:', grab ONLY the very first URL link starting with http.
      5. Do not put any hyphens, asterisks, or numbers before the PRODUCT_CARD line.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: message }
      ],
    });

    const replyText = completion.choices[0]?.message?.content || "I couldn't find any products matching your query.";

    return new Response(JSON.stringify({ reply: replyText }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ PRODUCTION BACKEND ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}