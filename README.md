# 🛍️ Fashion AI — Smart Fashion-Paired Search for E-Commerce

> Reimagining Customer Experience with Emerging Technologies — A Walmart Sparkathon Project

Fashion AI is an intelligent fashion search system for e-commerce platforms like Walmart. Instead of filtering by category, color, or price, users can type natural language queries like:


Fashion AI understands the context and style intent, recommends compatible products, and even generates AI-powered visuals showing how the product pairs with the outfit — bridging the gap between search and styling.

---

## 🌟 Key Features

- 🔍 **Natural Language Fashion Search**
- 👗 **AI-Powered Outfit Compatibility**
- 🖼️ **Smart Visual Previews (via Generative AI)**
- 📈 **Trend-Aware Recommendations**

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS, Framer Motion |
| Backend | Node.js |
| NLP | HuggingFace Transformers, spaCy |
| Compatibility Engine | Custom rule engine + ML |
| Image Generation | Google Gemini Vision API |
| Trend Tracking | Google Trends, Pinterest, Instagram scraping |

---

## 🚀 Getting Started

Follow these steps to run the project locally:

### 1. **Clone the repository**

git clone https://github.com/yogi03/fashion-ai.git
cd fashion-ai

### 2. **Install dependencies**
npm install
pip install -r requirements.txt

### 3. **Setup Environment Variable**
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

### 4. **Run the application**
Terminal 1: Start Backend Server
node ./api/groq-server.js

Terminal 2: Start Frontend Server
npm run dev
Now open your browser at http://localhost:5173

---

## 🔍 Sample Search Queries

- 🔍 **“Sneakers under ₹2,000 that go with a striped shirt”**
- 👗 **“Formal shoes to match a navy blue blazer”**
- 🖼️ **"Formal Shoes with coffee brown shirt and beige pants"**
- 📈 **"Striped shirt with brown straight fit lenin pant"**

---

## Future Roadmap

- 🧑‍💻 **Virtual Try-On (using Web AR)**
- 🧩 **Outfit Builder (full wardrobe pairing tool)**
- 🗣️ **Voice-Based Fashion Search**
- 👠 **Personal AI Stylist Bot (chat-based recommendations)**

---
