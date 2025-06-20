import React from 'react';
import { useCart } from '../context/CartContext';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-6">Your Cart</h2>

      {cartItems.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-white p-4 rounded-xl shadow"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-16 object-cover rounded"
                />
                <div>
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-blue-600 font-medium">₹{item.price}</p>
                  <p className="text-sm text-yellow-500">⭐ {item.rating}</p>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 hover:text-red-700"
                title="Remove from cart"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ))}

          <div className="flex justify-between items-center mt-6 text-lg font-semibold">
            <span>Total:</span>
            <span>₹{totalPrice}</span>
          </div>

          <button
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700"
            onClick={() => alert('Proceeding to checkout...')}
          >
            Proceed to Checkout
          </button>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="mt-6 text-blue-500 hover:underline block"
      >
        ← Continue Shopping
      </button>
    </div>
  );
}
