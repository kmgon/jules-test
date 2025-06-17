import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import type { Product } from '../components/product-card';

// Define Interfaces
export interface CartItem {
  id: number;
  quantity: number;
  price: number;
  title: string;
  thumbnail: string;
  stock: number;
}

export interface CartState {
  items: CartItem[];
  totalQuantity: number;
  cartId: number | null;
}

export interface CartContextType {
  cartState: CartState;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  loading: boolean;
}

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// CartProvider Component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartState, setCartState] = useState<CartState>({
    items: [],
    totalQuantity: 0,
    cartId: null,
  });
  const [loading, setLoading] = useState<boolean>(true); // Start with loading true

  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      try {
        const storedCartId = localStorage.getItem('cartId');
        const storedItems = localStorage.getItem('cartItems');

        if (storedCartId) {
          const response = await fetch(`https://dummyjson.com/carts/${storedCartId}`);
          if (response.ok) {
            const cartData = await response.json();
            // Ensure products are transformed into CartItem format if needed
            const items: CartItem[] = cartData.products.map((p: any) => ({
              id: p.id,
              quantity: p.quantity,
              price: p.price,
              title: p.title,
              thumbnail: p.thumbnail,
              stock: p.totalQuantity / p.quantity // Estimate stock from totalQuantity and quantity per item
            }));
            setCartState({
              items: items,
              totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
              cartId: cartData.id,
            });
          } else if (response.status === 404) {
            // Cart not found on server, clear local storage and start fresh
            localStorage.removeItem('cartId');
            localStorage.removeItem('cartItems');
            setCartState({ items: [], totalQuantity: 0, cartId: null });
          } else {
            // Other error, maybe log it and start fresh
            console.error('Failed to fetch cart:', response.status);
            setCartState({ items: [], totalQuantity: 0, cartId: null });
            // Optionally clear local storage here too
            localStorage.removeItem('cartId');
            localStorage.removeItem('cartItems');
          }
        } else if (storedItems) {
          // Fallback if only items are in local storage (e.g. before cartId logic was added)
          // Or if we decide not to fetch an existing cart if only cartId is missing
          const items = JSON.parse(storedItems);
          setCartState({
            items: items,
            totalQuantity: items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
            cartId: null, // No cartId, will create one on next add
          });
        } else {
          // No cartId and no items in local storage, start with an empty cart
          setCartState({ items: [], totalQuantity: 0, cartId: null });
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
        setCartState({ items: [], totalQuantity: 0, cartId: null });
        // Clear potentially corrupted local storage
        localStorage.removeItem('cartId');
        localStorage.removeItem('cartItems');
      } finally {
        setLoading(false);
      }
    };

    initializeCart();
  }, []);

  useEffect(() => {
    // Save cart items and cartId to local storage whenever they change
    if (cartState.items.length > 0 || cartState.cartId !== null) {
      localStorage.setItem('cartItems', JSON.stringify(cartState.items));
    } else {
      // Clear items if cart is empty to avoid storing empty array
      localStorage.removeItem('cartItems');
    }
    if (cartState.cartId !== null) {
      localStorage.setItem('cartId', String(cartState.cartId));
    } else {
      // Clear cartId if it's null
      localStorage.removeItem('cartId');
    }
  }, [cartState.items, cartState.cartId]);

  const createNewCart = async (initialProduct?: { id: number; quantity: number }) => {
    setLoading(true);
    try {
      const productsToAdd = initialProduct ? [initialProduct] : [];
      const response = await fetch('https://dummyjson.com/carts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1, // Mock user ID
          products: productsToAdd,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create new cart:', response.status, errorData);
        throw new Error(`Failed to create cart: ${errorData.message || response.status}`);
      }
      const newCartData = await response.json();
      setCartState(prevState => ({
        ...prevState,
        cartId: newCartData.id,
        // If initialProduct was added, API response should reflect that.
        // Update items and totalQuantity based on response.
        items: newCartData.products.map((p: any) => ({ // map back to CartItem including stock
          id: p.id,
          quantity: p.quantity,
          price: p.price,
          title: p.title,
          thumbnail: p.thumbnail,
          // We need to get stock information from the original product data if possible
          // This is a limitation as createNewCart might not have full product details for stock
          // For now, let's assume stock is not fully known here or set to a default.
          // This will be better handled by addToCart which has the full product object.
          stock: initialProduct && p.id === initialProduct.id ?
                 (cartState.items.find(item => item.id === initialProduct.id)?.stock || 100) : 100 // Placeholder stock
        })),
        totalQuantity: newCartData.products.reduce((sum: number, p: any) => sum + p.quantity, 0),
      }));
      localStorage.setItem('cartId', String(newCartData.id));
      return newCartData.id; // Return the new cart ID
    } catch (error) {
      console.error('Error in createNewCart:', error);
      // Handle error (e.g., show notification to user)
      setLoading(false); // Ensure loading is false on error
      return null; // Indicate failure
    } finally {
      // setLoading(false); // Loading will be set by the calling function or subsequent updates
      // The addToCart function will call updateCartAPI which will handle final loading state
    }
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    setLoading(true);
    let currentCartId = cartState.cartId;

    try {
      // If there's no cart ID, create a new cart first
      if (currentCartId === null) {
        const newCartId = await createNewCart({ id: product.id, quantity });
        if (newCartId) {
          currentCartId = newCartId;
          // createNewCart already updates state with the initial product and calls setLoading(false) if it was the one setting it.
          // We need to ensure the product details (price, title, thumbnail, stock) are correctly set.
          // The createNewCart function's response might not have all details like 'stock'.
          // The API for adding to cart (PUT /carts/:id) is more suitable for adding items with details.
          // So, createNewCart will just create an empty cart or cart with minimal product info,
          // then this function will proceed to add/update the item properly.

          // Let's adjust createNewCart to potentially not add the product directly,
          // or ensure it fetches full product details if it does.
          // For simplicity now, createNewCart creates the cart, then addToCart adds to it.
          // If createNewCart added the product, the state would be updated.
          // We need to ensure product details are complete.

          // Re-fetch cart state or ensure createNewCart correctly initialized items.
          // The current createNewCart implementation *does* add the product.
          // We need to make sure 'stock' and other details are correctly sourced.
          // The product object passed to addToCart has 'stock'.

          // If createNewCart added the product, its quantity might be 'quantity'.
          // We need to ensure the state reflects the *full* CartItem.
          const existingItemInNewCart = cartState.items.find(item => item.id === product.id);
          if(existingItemInNewCart) {
             // Update with full product details if createNewCart added it
            setCartState(prevState => {
                const updatedItems = prevState.items.map(item =>
                    item.id === product.id ? {
                        ...item, // properties from API response (id, quantity, price, title, thumbnail)
                        stock: product.stock, // ensure stock from original product is used
                        price: product.price, // ensure price from original product
                        title: product.title, // ensure title from original product
                        thumbnail: product.thumbnail, // ensure thumbnail
                    } : item
                );
                return {
                    ...prevState,
                    items: updatedItems,
                    totalQuantity: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
                };
            });
          } else {
            // If createNewCart did NOT add the product (e.g., if it's modified to create an empty cart)
            // OR if the product wasn't the one createNewCart was initialized with.
             const newItem: CartItem = {
              id: product.id,
              quantity,
              price: product.price,
              title: product.title,
              thumbnail: product.thumbnail,
              stock: product.stock,
            };
            setCartState(prevState => ({
                ...prevState,
                items: [...prevState.items, newItem],
                totalQuantity: prevState.totalQuantity + quantity,
            }));
          }
          // After new cart is created and initial item possibly added and state updated,
          // we will call updateCartAPI with the complete list.
          await updateCartAPI(cartState.items); // cartState.items should be up-to-date
          setLoading(false);
          return; // Early return as updateCartAPI handles loading and state update
        } else {
          console.error('addToCart: Failed to create a new cart.');
          setLoading(false);
          return; // Failed to create cart
        }
      }

      // If cart exists, check if item already in cart
      const existingItemIndex = cartState.items.findIndex(item => item.id === product.id);
      let newItems: CartItem[];
      let newTotalQuantity: number;

      if (existingItemIndex !== -1) {
        // Item exists, update its quantity
        const existingItem = cartState.items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;
        // Delegate to updateQuantity for stock checks and consistent update logic
        // However, updateQuantity itself calls updateCartAPI. To avoid double API call,
        // we'll replicate some logic here or make updateQuantity more flexible.
        // For now, direct update:
        if (newQuantity <= 0) { // Remove if quantity becomes 0 or less
          newItems = cartState.items.filter(item => item.id !== product.id);
        } else {
            newItems = cartState.items.map(item =>
            item.id === product.id ? { ...item, quantity: Math.min(newQuantity, item.stock) } : item
          );
        }
      } else {
        // Item does not exist, add as new
        const newItem: CartItem = {
          id: product.id,
          quantity: Math.min(quantity, product.stock), // Respect stock limit
          price: product.price,
          title: product.title,
          thumbnail: product.thumbnail,
          stock: product.stock,
        };
        newItems = [...cartState.items, newItem];
      }

      newTotalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);
      setCartState(prevState => ({
        ...prevState,
        items: newItems,
        totalQuantity: newTotalQuantity,
      }));

      await updateCartAPI(newItems);

    } catch (error) {
      console.error('Error in addToCart:', error);
      // Potentially revert optimistic updates or show error
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (cartState.cartId === null) {
      console.error('updateQuantity called with no cartId. This should not happen if cart is initialized.');
      return;
    }

    setLoading(true);
    let newItems: CartItem[];
    const itemToUpdate = cartState.items.find(item => item.id === productId);

    if (!itemToUpdate) {
      console.error(`updateQuantity: Item with id ${productId} not found in cart.`);
      setLoading(false);
      return;
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      newItems = cartState.items.filter(item => item.id !== productId);
    } else {
      // Update quantity, ensuring it does not exceed stock
      newItems = cartState.items.map(item =>
        item.id === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
      );
    }

    const newTotalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);

    setCartState(prevState => ({
      ...prevState,
      items: newItems,
      totalQuantity: newTotalQuantity,
    }));

    try {
      await updateCartAPI(newItems);
    } catch (error) {
      console.error('Error in updateQuantity while calling updateCartAPI:', error);
      // Potentially revert state changes if API call fails
      // For now, error is logged by updateCartAPI
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: number) => {
    if (cartState.cartId === null) {
      console.error('removeFromCart called with no cartId.');
      return;
    }

    setLoading(true);
    const itemExists = cartState.items.find(item => item.id === productId);

    if (!itemExists) {
      console.warn(`removeFromCart: Item with id ${productId} not found in cart.`);
      setLoading(false);
      return; // Or proceed to call updateCartAPI with current items if that's desired
    }

    const newItems = cartState.items.filter(item => item.id !== productId);
    const newTotalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);

    setCartState(prevState => ({
      ...prevState,
      items: newItems,
      totalQuantity: newTotalQuantity,
    }));

    try {
      await updateCartAPI(newItems);
    } catch (error) {
      console.error('Error in removeFromCart while calling updateCartAPI:', error);
      // Potentially revert
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (cartState.cartId === null) {
      console.warn('clearCart called but no cartId exists. Clearing local state only.');
      setCartState({
        items: [],
        totalQuantity: 0,
        cartId: null, // Or keep cartId if preferred, though an empty cart might not need an ID
      });
      // No API call if no cartId
      return;
    }

    setLoading(true);
    setCartState(prevState => ({
      ...prevState,
      items: [],
      totalQuantity: 0,
    }));

    try {
      // Update the remote cart with an empty list of products
      await updateCartAPI([]);
    } catch (error) {
      console.error('Error in clearCart while calling updateCartAPI:', error);
      // Potentially revert local state changes if API call fails, though clearing is usually a "fire and forget"
    } finally {
      setLoading(false);
      // As per requirements, cartId is kept. If we wanted to get a new ID next time:
      // localStorage.removeItem('cartId');
      // setCartState(prevState => ({ ...prevState, cartId: null }));
    }
  };

  const updateCartAPI = async (updatedItemsOverride?: CartItem[]) => {
    // Use cartState.cartId directly, assuming it's updated by createNewCart or initial load
    if (cartState.cartId === null) {
      console.error('updateCartAPI called with no cartId. This should have been handled by createNewCart.');
      return;
    }
    setLoading(true);
    try {
      const itemsToUpdate = updatedItemsOverride || cartState.items;
      // Ensure cartId is not null before making the call
      const currentCartId = cartState.cartId; // Use the cartId from state
      if (!currentCartId) {
        console.error("updateCartAPI: cartId is null after all checks.");
        setLoading(false);
        return;
      }
      const response = await fetch(`https://dummyjson.com/carts/${currentCartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merge: false, // Replace all products in the cart with the new list
          products: itemsToUpdate.map(p => ({ id: p.id, quantity: p.quantity })),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update cart API:', response.status, errorData);
        // Potentially revert state or show error to user
        throw new Error(`Failed to update cart: ${errorData.message || response.status}`);
      }
      const updatedCartData = await response.json();
      // Update state with potentially adjusted data from API (e.g., if API adjusts quantity based on stock)
      // For dummyjson, it seems to just echo back the products sent or the updated cart structure.
      // We should ensure our local state is the source of truth after a successful update,
      // unless the API provides more accurate information (e.g. final price after discount).
      // For now, let's assume our local calculation is fine.
      // If updatedItemsOverride was used, the main state update is handled by the calling function.
      // If not, we ensure totalQuantity is correctly recalculated.
      if (!updatedItemsOverride) {
        setCartState(prevState => ({
          ...prevState,
          items: updatedCartData.products.map((p: any) => ({ // map back to CartItem
            id: p.id,
            quantity: p.quantity,
            price: p.price, // assuming API returns these, adjust if not
            title: p.title,
            thumbnail: p.thumbnail,
            stock: prevState.items.find(i => i.id === p.id)?.stock || 0 // maintain stock info
          })),
          totalQuantity: updatedCartData.products.reduce((sum: number, p: any) => sum + p.quantity, 0),
        }));
      }

    } catch (error) {
      console.error('Error in updateCartAPI:', error);
      // Handle error (e.g., show notification to user)
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartState,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook to use Cart Context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
