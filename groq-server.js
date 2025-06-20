// groq-server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Utility: Match product by user query ---
const sampleProducts = [
  { name: 'Zixer Artificial Leather Mens Formal Shoes', imagePath: './src/assets/products/zixer.jpg', category: 'Formal Shoes', price: 999 },
  { name: 'Cotton t-shirt with pocket Black | Parfois', imagePath: './src/assets/products/parfois.jpg', category: 'T shirt', price: 599 },
  { name: 'Terry Mafia Black Oversize T-Shirt', imagePath: './src/assets/products/mafia.webp', category: 'T shirt', price: 999 },
  { name: 'H&M T-shirt', imagePath: './src/assets/products/h&m.jpeg', category: 'T shirt', price: 599 },
  { name: 'Levis Jeans', imagePath: './src/assets/products/levis.jpg', category: 'Jeans', price: 1299 },
  { name: 'Red Tape Sneakers', imagePath: './src/assets/products/redtape.jpg', category: 'Sneakers', price: 1999 },
  { name: 'Nike Air Max', imagePath: './src/assets/products/nikeair.webp', category: 'Sneakers', price: 6000 },
  { name: 'Tommy Baggy Jeans', imagePath: './src/assets/products/tommy.jpg', category: 'Jeans', price: 2500 },
  { name: 'Rare Rabbit Striped Shirt', imagePath: './src/assets/products/rare.webp', category: 'Shirt', price: 1400 },
  { name: 'Campus Sutra Striped Shirt', imagePath: './src/assets/products/campus.webp', category: 'Shirt', price: 899 },
  { name: 'Coastal Breeze Striped Shirt', imagePath: './src/assets/products/coastal.webp', category: 'Shirt', price: 899 },
];

function findMatchingProducts(query, filters) {
  const { category, minPrice, maxPrice } = filters;
  return sampleProducts.filter((product) => {
    const nameMatch = product.name.toLowerCase().includes(query.toLowerCase());
    const categoryMatch = category ? product.category.toLowerCase().includes(category.toLowerCase()) : true;
    const priceMatch = (!minPrice || product.price >= minPrice) && (!maxPrice || product.price <= maxPrice);
    return nameMatch || (categoryMatch && priceMatch);
  });
}

// --- Groq Endpoint ---
app.post('/api/groq', async (req, res) => {
  const { query } = req.body;
  try {
    const result = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful shopping assistant. A user will send a casual or typo-ridden search query (like "sneakrs under 5k", "jeens for 1500", "shirt", etc). Your task is to extract and return filters as a strict JSON object with this format: { "category": string or null, "minPrice": number or null, "maxPrice": number or null } Only include what the user meant, even if they used typos. DO NOT explain anything. Return only the JSON.`
        },
        { role: 'user', content: query },
      ],
      model: 'llama3-70b-8192',
    });
    const content = result.choices[0]?.message?.content;
    res.json(JSON.parse(content));
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ error: 'Groq API call failed.' });
  }
});

// --- Gemini Image Generation Endpoint ---
app.post('/api/generate-outfit', async (req, res) => {
  const { prompt, filters } = req.body;
  if (!prompt || !filters) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    const matchedProducts = findMatchingProducts(prompt, filters);

    // Prioritize based on name relevance score
    const scored = matchedProducts.map(p => ({
      ...p,
      score: p.name.toLowerCase().includes(prompt.toLowerCase()) ? 2
            : p.name.toLowerCase().split(' ').some(word => prompt.toLowerCase().includes(word)) ? 1
            : 0,
    }));
    
    // Sort by score descending, prefer sneakers first
    scored.sort((a, b) => {
      if (b.score === a.score) {
        // If score is equal, prefer 'Sneakers'
        if (b.category.toLowerCase().includes('sneaker')) return 1;
        if (a.category.toLowerCase().includes('sneaker')) return -1;
        return 0;
      }
      return b.score - a.score;
    });
    
    const relevantImage = scored[0];

    if (!relevantImage || !relevantImage.imagePath) {
      return res.status(404).json({ error: 'No suitable product image found.' });
    }

    const resolvedPath = path.resolve(relevantImage.imagePath);
    const mimeType = resolvedPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const imageData = fs.readFileSync(resolvedPath).toString('base64');

    const contents = [
      { text: `Generate a fashion outfit image with a model wearing this ${relevantImage.name} along with what user asked: ${prompt}` },
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents,
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });

    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (!imagePart) throw new Error('Image generation failed');

    res.json({ image: imagePart.inlineData.data });
  } catch (error) {
    console.error('Gemini generation error:', error);
    res.status(500).json({ error: 'Image generation failed.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
