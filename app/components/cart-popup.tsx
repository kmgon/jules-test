import React, { useEffect, useRef } from 'react';
import { useCart } from '~/contexts/cart-context'; // Adjusted path

// Interfaces like CartProduct and CartData are no longer needed here
// as cartState from useCart will provide the data structure.
// We will rely on CartItem from cart-context.

interface CartPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartPopup: React.FC<CartPopupProps> = ({ isOpen, onClose }) => {
  const { cartState, loading: cartLoading, updateQuantity, removeFromCart } = useCart();
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

  // Removed local fetchCartData useEffect

  // Calculate totals from cartState.items
  // Note: cartState.items are of type CartItem from cart-context.tsx
  // CartItem currently has: id, quantity, price (original unit), title, thumbnail, stock.
  // It does *not* have discountedPrice per item line.
  // So, currentDiscountedTotalAmount will be same as currentTotalAmount until CartItem is updated.

  const totalProductsCount = cartState.items.length;
  const currentTotalAmount = cartState.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Placeholder for discounted total. Will effectively be the same as currentTotalAmount
  // if item.discountedPrice is not available on CartItem.
  // The API returns `discountedPrice` as the total for the line item.
  const currentDiscountedTotalAmount = cartState.items.reduce(
    (acc, item) => acc + ((item as any).discountedPrice || item.price * item.quantity),
    0
  );


  const handleBuyButtonClick = () => {
    if (cartState.items.length > 0) {
      console.log("Buy button clicked. Cart state:", cartState);
      alert(
        `Processing purchase for ${totalProductsCount} product type(s) (total ${cartState.totalQuantity} items) with a total of $${currentDiscountedTotalAmount.toFixed(2)}.`
      );
    } else {
      console.log("Buy button clicked, but cart is empty.");
      alert("Your cart is empty.");
    }
  };

  return (
    <div
      data-testid="cart-popup-container" // Added data-testid for easier selection in tests
      className={`fixed top-20 right-4 z-40 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none' // Added pointer-events-none when hidden
      }`}
    >
      <div ref={popupRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
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
        <div className="mb-4 min-h-[100px]">
          {cartLoading && <p className="text-gray-700">Loading cart...</p>}
          {!cartLoading && cartState.items.length === 0 && (
            <p>Your cart is currently empty.</p>
          )}
          {!cartLoading && cartState.items.length > 0 && (
            <div>
              <p className="text-gray-700">
                Total Product Types: <span className="font-semibold">{totalProductsCount}</span>
              </p>
              <p className="text-gray-700">
                Total Quantity of Items: <span className="font-semibold">{cartState.totalQuantity}</span>
              </p>
              <p className="text-gray-700">
                Total Amount: <span className="font-semibold">${currentTotalAmount.toFixed(2)}</span>
              </p>
              <p className="text-green-600">
                Discounted Total: <span className="font-semibold">${currentDiscountedTotalAmount.toFixed(2)}</span>
              </p>
              <div className="mt-2 border-t pt-2">
                <h3 className="text-lg font-medium mb-1">Items:</h3>
                {cartState.items.map(item => (
                  <div key={item.id} className="py-2 border-b border-gray-200 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">{item.title}</span>
                      <span className="text-sm text-gray-500">
                        ${((item as any).discountedPrice || item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateQuantity(item.id, item.quantity - 1);
                            } else {
                              removeFromCart(item.id);
                            }
                          }}
                          className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs"
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          -
                        </button>
                        <span className="mx-2 text-sm text-gray-700" aria-live="polite">
                          Qty: {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs"
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Removed the specific error display from local state, context might handle errors globally */}
        </div>
        <button
          onClick={handleBuyButtonClick}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={cartLoading || cartState.items.length === 0}
        >
          Buy
        </button>
      </div>
    </div>
  );
};

export default CartPopup;
