import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import fs from 'fs';
import path from 'path';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    
    const { message } = await req.json(); // Frontend se customer ka message lena

    // 1. Local System se products.txt ka path nikalna aur read karna
    const filePath = path.join(process.cwd(), 'products.txt');
    
    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ reply: "Error: Local products.txt file not found in root directory." }), { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 2. File ko '----' ke basis par split karke saare products ki list banana
    const allProducts = fileContent.split('----');

    // 3. Mini Local Search Engine: User ke message ke keywords ke hisaab se products filter karna
    const keywords = message.toLowerCase().split(' ').filter((k: string) => k.length > 2);
    
    let matchedProducts = allProducts.filter(productBlock => {
      // Check agar product ke andar saare keywords maujood hain
      return keywords.every((kw: string) => productBlock.toLowerCase().includes(kw));
    }).slice(0, 4); // Top 4 matching products hi OpenAI ko bhejenge takki token limit cross na ho

    // Agar exact match na mile, toh partial match try karein
    if (matchedProducts.length === 0) {
      matchedProducts = allProducts.filter(productBlock => {
        return keywords.some((kw: string) => productBlock.toLowerCase().includes(kw));
      }).slice(0, 4);
    }

    // 4. System Prompt taiyar karna filtered products ke saath
    const systemInstruction = `
      You are the luxury ethnic wear assistant for Like A Diva (https://www.likeadiva.com/).
      
      Here is the raw data of relevant products found directly on our local system for the user's query:
      ===================================
      ${matchedProducts.join('\n----\n')}
      ===================================

      YOUR TASK:
      1. If relevant products are found in the data above, introduce them beautifully.
      2. For EVERY product you display, you MUST use this exact single-line format so the frontend can build product cards:
         PRODUCT_CARD|Name: [Product Name]|Price: ₹[Cost Price]|Image: [First URL from Image Paths]|Link: [Store URL]
      3. From 'Image Paths:', pick ONLY the very first URL link.
      4. If no relevant products are found in the local data above, politely tell the user that you couldn't find matching items right now and ask them to browse categories on our website.
    `;

    // 5. OpenAI call pure local context ke saath
    const response = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemInstruction,
      prompt: message,
    });

    return new Response(JSON.stringify({ reply: response.text }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ LOCAL OPENAI ERROR:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}