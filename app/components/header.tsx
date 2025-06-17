"use client";

import React, { useEffect, useRef } from 'react';
import { useCart } from '~/contexts/cart-context';

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const { cartState } = useCart();
  const totalQuantity = cartState.totalQuantity;

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const scrollThreshold = 50;

    const handleScroll = () => {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('backdrop-blur-md', 'opacity-80');
        header.classList.remove('backdrop-blur-none', 'opacity-100');
      } else {
        header.classList.add('backdrop-blur-none', 'opacity-100');
        header.classList.remove('backdrop-blur-md', 'opacity-80');
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check in case the page is already scrolled
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleanup on unmount

  return (
    <header
      ref={headerRef}
      id="main-header" // Added an ID for potential direct targeting if needed, though ref is primary
      className="bg-blue-500 text-white p-4 flex justify-between items-center fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out opacity-100 backdrop-blur-none"
    >
      <h1 className="m-0 text-2xl">KM Shop</h1>
      <div className="relative"> {/* Parent div for positioning the badge */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="stroke-white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        {totalQuantity > 0 && (
          <span
            className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            aria-label="Items in cart" // Accessibility for the badge
          >
            {totalQuantity}
          </span>
        )}
      </div>
    </header>
  );
}
