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
  {
    name: 'Zixer Artificial Leather Mens Formal Shoes',
    imagePath: './src/assets/products/zixer.jpg',
    category: 'Formal Shoes',
    price: 999,
    description: ['Zixer', 'Artificial Leather', 'Men', 'Formal', 'Shoes', 'Office Shoes', 'High Top', 'Black'],
  },
  {
    name: 'Levis Jeans',
    imagePath: './src/assets/products/levis.jpg',
    category: 'Jeans',
    price: 1299,
    description: ['Levis', 'Jeans', 'Denim', 'Men', 'Blue', 'Casual Wear', 'Straight Fit'],
  },
  {
    name: 'Red Tape Sneakers',
    imagePath: './src/assets/products/redtape.jpg',
    category: 'Sneakers',
    price: 1999,
    description: ['Red Tape', 'Sneakers', 'Shoes', 'Men', 'Casual', 'White'],
  },
  {
    name: 'Nike Air Max',
    imagePath: './src/assets/products/nikeair.webp',
    category: 'Sneakers',
    price: 6000,
    description: ['Nike', 'Air Max', 'Sneakers', 'Men', 'Running Shoes', 'Sporty', 'Comfort', 'Olive', 'Beige'],
  },
  {
    name: 'Tommy Baggy Jeans',
    imagePath: './src/assets/products/tommy.jpg',
    category: 'Jeans',
    price: 2500,
    description: ['Tommy', 'Baggy Jeans', 'Denim', 'Relaxed Fit', 'Men', 'Streetwear', 'Black'],
  },
  {
    name: 'Rare Rabbit Striped Shirt',
    imagePath: './src/assets/products/rare.webp',
    category: 'Shirt',
    price: 1400,
    description: ['Rare Rabbit', 'Shirt', 'Striped', 'Blue', 'Cotton', 'Full Sleeves', 'Men', 'Vertical Strip', 'Blue and white'],
  },
  {
    name: 'Campus Sutra Striped Shirt',
    imagePath: './src/assets/products/campus.webp',
    category: 'Shirt',
    price: 899,
    description: ['Campus Sutra', 'Shirt', 'Unbalanced Stripes', 'Woven', 'Men', 'Casual', 'Gray and white', 'Short Sleeve'],
  },
  {
    name: 'Coastal Breeze Striped Shirt',
    imagePath: './src/assets/products/coastal.webp',
    category: 'Shirt',
    price: 899,
    description: ['Coastal Breeze', 'Shirt', 'Striped', 'Short Sleeve', 'Men', 'Summer Wear', 'Gray, white, sky-blue'],
  },
];

function findMatchingProducts(query, filters) {
  const { category, minPrice, maxPrice } = filters;

  const queryTokens = query.toLowerCase().split(/\s+/);

  return sampleProducts.filter((product) => {
    const nameDescMatch = queryTokens.some(token =>
      product.name.toLowerCase().includes(token) ||
      product.description.some((desc) => desc.toLowerCase().includes(token))
    );

    const categoryMatch = category
      ? product.category.toLowerCase() === category.toLowerCase()
      : true;

    const priceMatch =
      (!minPrice || product.price >= minPrice) &&
      (!maxPrice || product.price <= maxPrice);

    return nameDescMatch && categoryMatch && priceMatch;
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
    // Match all products that fit user's prompt and filters
    const matchedProducts = findMatchingProducts(prompt, filters);

    if (matchedProducts.length === 0) {
      return res.status(404).json({ error: 'No matching products found.' });
    }

    const generatedImages = [];

    // Generate an image for each matched product
    for (const product of matchedProducts) {
      const resolvedPath = path.resolve(product.imagePath);
      const mimeType = resolvedPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const imageData = fs.readFileSync(resolvedPath).toString('base64');

      const contents = [
        {
          text: `Create a fashion outfit image of a male model wearing the product: "${product.name}". 
          Also style the model based on this user request: "${prompt}". 
          Ensure the look is modern, appealing, and consistent with the user's intent.`,
        },
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
      if (imagePart) {
        generatedImages.push({
          ...product,
          generatedImage: `data:image/png;base64,${imagePart.inlineData.data}`,
        });
      }
    }

    res.json({ images: generatedImages });
  } catch (error) {
    console.error('Batch outfit generation error:', error);
    res.status(500).json({ error: 'Batch image generation failed.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
