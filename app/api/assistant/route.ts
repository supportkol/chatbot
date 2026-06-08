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
    }).slice(0, 100);

    if (matchedProducts.length === 0 && keywords.length > 0) {
      matchedProducts = allProducts.filter(productBlock => {
        return keywords.some((kw: string) => productBlock.toLowerCase().includes(kw));
      }).slice(0, 100);
    }

    // ========================================================
    // 🤖 STEP 3: FINAL OPENAI RESPONSE (Cards generate karne ke liye)
    // ========================================================
    const systemInstruction = `
      You are the luxury ethnic wear assistant for Like A Diva.
      
      Products:
      ${matchedProducts.join('\n----\n')}

      STRICT RULES:
      1. DO NOT output any introductory or concluding sentences. Give ONLY the product cards.
      2. Format strictly:
         PRODUCT_CARD|Name: [Name]|Price: ₹[Price]|Image: [FULL HTTP URL]|Link: [URL]|Code: [SKU]|Desc: [Point1] ~ [Point2] ~ [Point3] ~ [Point4] ~ [Point5]
      3. For the 'Image' field, you MUST extract the FULL absolute URL starting with "https://". DO NOT output just the image filename. If no http link is found, leave it empty.
      4. Make the 5 description points extremely short (2-3 words each).
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