import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  if (!state) {
    return (
      <div className="p-8 text-center">
        <p>Product not found.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 underline mt-4">Go back</button>
      </div>
    );
  }

  const { id, image, name, price, rating } = state;

  const handleAddToCart = () => {
    addToCart({ id, image, name, price, rating });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <img src={image} alt={name} className="w-full max-w-md object-cover rounded-xl shadow mb-6" />
      <h1 className="text-2xl font-bold mb-2">{name}</h1>
      <p className="text-xl text-blue-600 font-semibold mb-2">₹{price}</p>
      <p className="text-yellow-500 mb-4">⭐ {rating} / 5</p>
      <div className="flex gap-4">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
          Buy Now
        </button>
        <button
          onClick={handleAddToCart}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-300"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}