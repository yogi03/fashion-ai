import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCircle, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getFilteredQuery } from '../groqSearch';

import zixer from '../assets/products/zixer.jpg';
import levis from '../assets/products/levis.jpg';
import redtape from '../assets/products/redtape.jpg';
import nikeair from '../assets/products/nikeair.webp';
import tommy from '../assets/products/tommy.jpg';
import rare from '../assets/products/rare.webp';
import campus from '../assets/products/campus.webp';
import coastal from '../assets/products/coastal.webp';

const sampleProducts = [
  {
    id: 1,
    name: 'Zixer Artificial Leather Mens Formal Shoes || Office High Top Formal Shoes Men || Cozy Black Formal',
    category: 'Formal Shoes',
    description: ['Zixer', 'Artificial Leather', 'Men', 'Formal', 'Shoes', 'Office Shoes', 'High Top', 'Black'],
    price: 999,
    image: zixer,
    rating: 4.5,
  },
  {
    id: 2,
    name: 'Levis Jeans',
    category: 'Jeans',
    description: ['Levis', 'Jeans', 'Denim', 'Men', 'Blue', 'Casual Wear','Straight Fit'],
    price: 1299,
    image: levis,
    rating: 4.3,
  },
  {
    id: 3,
    name: 'Red Tape Sneakers',
    category: 'Sneakers',
    description: ['Red Tape', 'Sneakers', 'Shoes', 'Men', 'Casual', 'White'],
    price: 1999,
    image: redtape,
    rating: 4.6,
  },
  {
    id: 4,
    name: 'Nike Air Max',
    category: 'Sneakers',
    description: ['Nike', 'Air Max', 'Sneakers', 'Men', 'Running Shoes', 'Sporty', 'Comfort', 'Olive', 'Beige'],
    price: 6000,
    image: nikeair,
    rating: 4.0,
  },
  {
    id: 5,
    name: 'Tommy Baggy Jeans',
    category: 'Jeans',
    description: ['Tommy', 'Baggy Jeans', 'Denim', 'Relaxed Fit', 'Men', 'Streetwear', 'Black'],
    price: 2500,
    image: tommy,
    rating: 4.2,
  },
  {
    id: 6,
    name: 'Rare Rabbit Men Leeds Blue Cotton Fabric Full Sleeves Striped Shirt',
    category: 'Shirt',
    description: ['Rare Rabbit', 'Shirt', 'Striped', 'Blue', 'Cotton', 'Full Sleeves', 'Men', 'Vertical Strip', 'Blue and white'],
    price: 1400,
    image: rare,
    rating: 3.9,
  },
  {
    id: 7,
    name: 'Campus Sutra Men Unbalanced Striped Woven Shirt',
    category: 'Shirt',
    description: ['Campus Sutra', 'Shirt', 'Unbalanced Stripes', 'Woven', 'Men', 'Casual', 'Gray and white', 'Short Sleeve'],
    price: 899,
    image: campus,
    rating: 4.4,
  },
  {
    id: 8,
    name: 'Men Coastal Breeze Striped Short-Sleeve Shirt',
    category: 'Shirt',
    description: ['Coastal Breeze', 'Shirt', 'Striped', 'Short Sleeve', 'Men', 'Summer Wear', 'Gray, white, sky-blue'],
    price: 899,
    image: coastal,
    rating: 4.0,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(sampleProducts);

  useEffect(() => {
  const delayDebounce = setTimeout(async () => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(sampleProducts);
      return;
    }

    try {
      // 1. Get filters from backend using Groq
      const response = await fetch('http://localhost:5000/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.toLowerCase() }),
      });

      const filters = await response.json();
      const { category, minPrice, maxPrice } = filters;

      // 2. Filter locally based on Groq filters
      const matched = sampleProducts.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const categoryMatch = category
          ? product.category.toLowerCase().includes(category.toLowerCase())
          : true;
        const priceMatch =
          (!minPrice || product.price >= minPrice) &&
          (!maxPrice || product.price <= maxPrice);
        return nameMatch || (categoryMatch && priceMatch);
      });

      if (matched.length === 0) {
        setFilteredProducts([]);
        return;
      }

      // 3. Get imagePaths to send to Gemini API
      const imagePaths = matched.slice(0, 2).map((p) => p.imagePath);

      const geminiRes = await fetch('http://localhost:5000/api/generate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: searchQuery,
          filters: { category, minPrice, maxPrice },
        }),
      });

      const { images } = await geminiRes.json();

      // 4. Replace product image with generated outfit
      if(images && images.length>0){
        setFilteredProducts(images.map(img=>({
          ...img,
          image: img.generatedImage,
        })));
      }
    } catch (err) {
      console.error('Error processing query:', err);
      setFilteredProducts([]);
    }
  }, 600);

  return () => clearTimeout(delayDebounce);
}, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-blue-600">ShopNow</h1>

        {/* Search Bar */}
        <div className="relative w-full max-w-xs mx-4">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/cart')} className="relative">
            <ShoppingCart className="w-7 h-7 text-gray-700" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                {cartItems.length}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/profile')}>
            <UserCircle className="w-8 h-8 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Products List */}
      <main className="pt-20 p-4">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md"
                onClick={() => navigate(`/product/${product.id}`, { state: product })}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-80 object-top rounded-md mb-2"
                />
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-blue-600 font-medium">₹{product.price}</p>
                <p className="text-sm text-yellow-500">⭐ {product.rating}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-8">No products found.</p>
        )}
      </main>
    </div>
  );
}