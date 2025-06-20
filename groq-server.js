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

/**
 * Route 1: Parse user query into structured filters using Groq
 */
app.post('/api/groq', async (req, res) => {
  const { query } = req.body;

  try {
    const result = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful shopping assistant.
          A user will send a casual or typo-ridden search query (like "sneakrs under 5k", "jeens for 1500", "shirt", etc).
          Your task is to extract and return filters as a strict JSON object with this format:
          {
            "category": string or null,
            "minPrice": number or null,
            "maxPrice": number or null
          }
          Only include what the user meant, even if they used uppercase, lowercase, camelcase, or typos.
          DO NOT explain anything. Return only the JSON.`,
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

/**
 * Route 2: Generate an outfit image using Gemini
 * Expects: { prompt: string, imagePaths: string[] }
 */
app.post('/api/generate-outfit', async (req, res) => {
  const { prompt, imagePaths } = req.body;

  if (!prompt || !imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    const contents = [
      { text: prompt },
      ...imagePaths
        .filter(Boolean) // ✅ skip null/undefined
        .map((imagePath) => {
          const resolvedPath = path.resolve(imagePath);
          const mimeType = resolvedPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
          const imageData = fs.readFileSync(resolvedPath).toString('base64');
        
          return {
            inlineData: {
              mimeType,
              data: imageData,
            },
          };
        }),
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-preview-image-generation',
      contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
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