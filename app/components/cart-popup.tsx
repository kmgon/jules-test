import React, { useState, useEffect, useRef } from 'react';

interface CartProduct {
  id: number;
  title: string;
  price: number;
  quantity: number;
  total: number;
  discountPercentage: number;
  discountedPrice: number; // Corrected based on typical API response, might be discountedTotal or similar
}

interface CartData {
  id: number;
  products: CartProduct[];
  total: number;
  discountedTotal: number;
  userId: number;
  totalProducts: number;
  totalQuantity: number;
}

interface CartPopupProps {
  isOpen: boolean;
  onClose: () => void; // Add this line
}

const CartPopup: React.FC<CartPopupProps> = ({ isOpen, onClose }) => {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      const fetchCartData = async () => {
        setIsLoading(true);
        setError(null); // Reset error state on new fetch attempt
        try {
          const response = await fetch('https://dummyjson.com/carts/1');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: CartData = await response.json();
          setCartData(data);
        } catch (e) {
          console.error("Failed to fetch cart data:", e);
          setError(e instanceof Error ? e.message : String(e));
          setCartData(null); // Clear cart data on error
        } finally {
          setIsLoading(false);
        }
      };

      fetchCartData();
    }
  }, [isOpen]);

  const handleBuyButtonClick = () => {
    if (cartData) {
      console.log("Buy button clicked. Cart data:", cartData);
      // Here you would typically proceed with the checkout process,
      // e.g., sending the cartData to a backend API, redirecting to a payment page, etc.
      alert(`Processing purchase for ${cartData.totalProducts} product(s) with a total of $${cartData.discountedTotal.toFixed(2)}.`);
    } else {
      console.log("Buy button clicked, but no cart data to process.");
      alert("Your cart is empty or data could not be loaded.");
    }
  };

  return (
    <div
      className={`fixed top-20 right-4 z-40 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 hidden'
      }`}
    >
      <div ref={popupRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"> {/* Added position: relative */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close cart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-semibold mb-4">Your Cart</h2>
        <div className="mb-4 min-h-[100px]"> {/* Added min-h for consistent size */}
          {isLoading && <p className="text-gray-700">Loading...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {!isLoading && !error && cartData && (
            <div>
              <p className="text-gray-700">
                Total Products: <span className="font-semibold">{cartData.totalProducts}</span>
              </p>
              <p className="text-gray-700">
                Total Quantity: <span className="font-semibold">{cartData.totalQuantity}</span>
              </p>
              <p className="text-gray-700">
                Total Amount: <span className="font-semibold">${cartData.total.toFixed(2)}</span>
              </p>
              <p className="text-green-600">
                Discounted Total: <span className="font-semibold">${cartData.discountedTotal.toFixed(2)}</span>
              </p>
              {/* Placeholder for individual cart items list */}
              <div className="mt-2 border-t pt-2">
                <h3 className="text-lg font-medium mb-1">Items:</h3>
                {cartData.products.map(item => (
                  <div key={item.id} className="text-sm text-gray-600">
                    {item.title} (x{item.quantity}) - ${item.discountedPrice?.toFixed(2) ?? item.price.toFixed(2)}
                  </div>
                ))}
              </div>
            </div>
          )}
          {!isLoading && !error && !cartData && (
            <p>Your cart is currently empty or data could not be loaded.</p>
          )}
        </div>
        <button
          onClick={handleBuyButtonClick}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={isLoading || !cartData}
        >
          Buy
        </button>
      </div>
    </div>
  );
};

export default CartPopup;
