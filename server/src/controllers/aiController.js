/**
 * AI Controller for Smart Receipt OCR & Financial Intelligence using Google Gemini
 */

export async function scanReceipt(req, res, next) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Receipt image data is required.'
      });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      // Smart Fallback Demo Parser if GEMINI_API_KEY is not yet added in environment
      return res.json({
        success: true,
        data: {
          description: 'Restaurant & Dining Bill',
          amount: 680.00,
          category: 'Food',
          items: [
            { name: 'Veg Meal / Starter', price: 340.00 },
            { name: 'Beverages / Cold Drinks', price: 180.00 },
            { name: 'Taxes & Service', price: 160.00 }
          ],
          note: 'Smart preview mode (Add GEMINI_API_KEY in Render/server .env for live Gemini 1.5 Flash Vision)'
        }
      });
    }

    // Prompt for Gemini 1.5 Flash Vision
    const promptText = `
You are an expert AI Receipt and Invoice Parser for an expense management app.
Analyze this receipt or bill image carefully.
Extract the following details:
1. "description": Store name, restaurant name, or merchant name (concise text, e.g. "Dominos Pizza", "Starbucks", "D-Mart").
2. "amount": Final total bill amount as a clean number (e.g. 450.50). Do not include currency symbols.
3. "category": Choose the single most appropriate category strictly from: ["Food", "Travel", "Shopping", "Entertainment", "Utilities", "General"].
4. "items": Array of line items visible with "name" and "price" (number). If line items are blurry or not listed, return an empty array.

Return ONLY a valid JSON object matching this exact structure:
{
  "description": "Merchant Name",
  "amount": 0.00,
  "category": "Food",
  "items": [
    { "name": "Item Name", "price": 0.00 }
  ]
}
Do NOT wrap the output in markdown code blocks (\`\`\`json). Return raw JSON only.
`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini API Error:', errorText);
      return res.status(502).json({
        success: false,
        message: 'AI receipt scanner failed to process image with Gemini.'
      });
    }

    const result = await geminiRes.json();
    const rawContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    let parsedData;
    try {
      // Remove any unintentional backticks
      const sanitized = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(sanitized);
    } catch (parseErr) {
      console.warn('JSON parsing error on Gemini output:', rawContent);
      parsedData = {
        description: 'Scanned Receipt',
        amount: 0,
        category: 'General',
        items: []
      };
    }

    // Validate category
    const validCategories = ['Food', 'Travel', 'Shopping', 'Entertainment', 'Utilities', 'General'];
    if (!validCategories.includes(parsedData.category)) {
      parsedData.category = 'General';
    }

    res.json({
      success: true,
      data: {
        description: parsedData.description || 'Scanned Receipt',
        amount: parseFloat(parsedData.amount) || 0,
        category: parsedData.category,
        items: Array.isArray(parsedData.items) ? parsedData.items : []
      }
    });
  } catch (err) {
    next(err);
  }
}
