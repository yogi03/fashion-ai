import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCircle, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getFilteredQuery } from '../groqSearch';

const sampleProducts = [
  {
    id: 1,
    name: 'Zixer Artificial Leather Mens Formal Shoes || Office High Top Formal Shoes Men || Cozy Black Formal',
    category: 'Formal Shoes',
    price: 999,
    image: "./src/assets/products/zixer.jpg",
    rating: 4.5,
  },
  {
    id: 2,
    name: 'Cotton t-shirt with pocket Black | Parfois',
    category: 'T shirt',
    price: 599,
    image: "./src/assets/products/parfois.jpg",
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Terry (280 GSM) Mafia Black Oversize T-Shirt For Men – ATOM',
    category: 'T shirt',
    price: 999,
    image: "./src/assets/products/mafia.webp",
    rating: 4.2,
  },
  {
    id: 4,
    name: 'H&M T-shirt',
    category: 'T shirt',
    price: 599,
    image: "./src/assets/products/h&m.jpeg",
    rating: 4.1,
  },
  {
    id: 5,
    name: 'Levis Jeans',
    category: 'Jeans',
    price: 1299,
    image: "./src/assets/products/levis.jpg",
    rating: 4.3,
  },
  {
    id: 6,
    name: 'Red Tape Sneakers',
    category: 'Sneakers',
    price: 1999,
    image: "./src/assets/products/redtape.jpg",
    rating: 4.6,
  },
  {
    id: 7,
    name: 'Nike Air Max',
    category: 'Sneakers',
    price: 6000,
    image: "./src/assets/products/nikeair.webp",
    rating: 4.0,
  },
  {
    id: 8,
    name: 'Tommy Baggy Jeans',
    category: 'Jeans',
    price: 2500,
    image: "./src/assets/products/tommy.jpg",
    rating: 4.2,
  },
  {
    id: 9,
    name: 'Rare Rabbit Men Leeds Blue Cotton Fabric Full Sleeves Striped Shirt',
    category: 'Shirt',
    price: 1400,
    image: "./src/assets/products/rare.webp",
    rating: 3.9,
  },
  {
    id: 10,
    name: 'Campus Sutra Men Unbalanced Striped Woven Shirt',
    category: 'Shirt',
    price: 899,
    image: "./src/assets/products/campus.webp",
    rating: 4.4,
  },
  {
    id: 11,
    name: 'Men Coastal Breeze Striped Short-Sleeve Shirt',
    category: 'Shirt',
    price: 899,
    image: "./src/assets/products/coastal.webp",
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
          imagePaths,
        }),
      });

      const { image: base64Image } = await geminiRes.json();

      // 4. Replace product image with generated outfit
      const replacedProducts = matched.map((product) => ({
        ...product,
        image: `data:image/png;base64,${base64Image}`,
      }));

      setFilteredProducts(replacedProducts);
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