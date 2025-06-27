import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, provider, signInWithPopup, signOut } from "../firebase";
import { FiArrowLeft } from 'react-icons/fi';

export default function Profile() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      {/* Back Arrow Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-gray-600 hover:text-black text-3xl"
        title="Go back"
      >
        <FiArrowLeft />
      </button>

      {user ? (
        <div className="bg-white p-6 rounded-xl shadow space-y-4 text-center">
          <img
            src={user.photoURL}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto"
          />
          <h2 className="text-xl font-semibold">{user.displayName}</h2>
          <p className="text-gray-600">{user.email}</p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl"
        >
          Login with Google
        </button>
      )}
    </div>
  );
}
