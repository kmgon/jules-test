import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import type { Product } from '../components/product-card';

// Define Interfaces
export interface CartItem {
  id: number;
  quantity: number;
  price: number; // Original unit price
  title: string;
  thumbnail: string;
  stock: number; // Available stock for the product
  total: number; // Original total for this line (price * quantity)
  discountPercentage: number;
  discountedPrice: number; // Final price for this line after discount (api-calculated)
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

  // Helper function to map API product data to CartItem
  // Stock needs to be handled carefully: either from existing item or full product data.
  const mapApiProductToCartItem = (apiProduct: any, existingStock?: number): CartItem => {
    return {
      id: apiProduct.id,
      title: apiProduct.title,
      price: apiProduct.price, // unit price
      quantity: apiProduct.quantity,
      total: apiProduct.total, // original total for line (price * quantity)
      discountPercentage: apiProduct.discountPercentage,
      discountedPrice: apiProduct.discountedPrice, // final discounted price for line
      thumbnail: apiProduct.thumbnail,
      stock: existingStock !== undefined ? existingStock : (apiProduct.stock || 100), // Fallback for stock
    };
  };


  useEffect(() => {
    const initializeCart = async () => {
      setLoading(true);
      try {
        const storedCartId = localStorage.getItem('cartId');
        const storedItemsRaw = localStorage.getItem('cartItems');
        let localItems: CartItem[] = [];
        if (storedItemsRaw) {
          try {
            localItems = JSON.parse(storedItemsRaw);
            // Basic validation if it's an array, could be more thorough
            if (!Array.isArray(localItems)) localItems = [];
          } catch (e) {
            console.warn("Error parsing cartItems from localStorage", e);
            localItems = [];
          }
        }

        if (storedCartId) {
          const response = await fetch(`https://dummyjson.com/carts/${storedCartId}`);
          if (response.ok) {
            const cartData = await response.json();
            const items: CartItem[] = cartData.products.map((p: any) => {
              const existingLocalItem = localItems.find(item => item.id === p.id);
              return mapApiProductToCartItem(p, existingLocalItem?.stock);
            });
            setCartState({
              items: items,
              totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
              cartId: cartData.id,
            });
          } else if (response.status === 404) {
            localStorage.removeItem('cartId');
            localStorage.removeItem('cartItems');
            setCartState({ items: [], totalQuantity: 0, cartId: null });
          } else {
            console.error('Failed to fetch cart:', response.status);
            // Keep local items if server fails for reasons other than 404
            setCartState({ items: localItems, totalQuantity: localItems.reduce((sum, item) => sum + item.quantity, 0), cartId: storedCartId ? Number(storedCartId) : null });
          }
        } else if (localItems.length > 0) {
          // If no cartId but local items exist, use them.
          // This state may occur if cart creation failed previously or if it's an old cart state.
          setCartState({
            items: localItems,
            totalQuantity: localItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
            cartId: null, // No server cartId confirmed.
          });
        } else {
          setCartState({ items: [], totalQuantity: 0, cartId: null });
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
        localStorage.removeItem('cartId');
        localStorage.removeItem('cartItems');
        setCartState({ items: [], totalQuantity: 0, cartId: null });
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

  // Pass the full product to include its stock when creating new cart with an initial item
  const createNewCart = async (productToAdd?: Product, quantity?: number) => {
    setLoading(true);
    try {
      const productsPayload = productToAdd && quantity
        ? [{ id: productToAdd.id, quantity }]
        : [];

      const response = await fetch('https://dummyjson.com/carts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1, // Mock user ID
          products: productsPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create new cart:', response.status, errorData);
        throw new Error(`Failed to create cart: ${errorData.message || response.status}`);
      }
      const newCartData = await response.json();

      // Map API response products to CartItem[]
      // For the initial product, its stock comes from the 'productToAdd' object
      const items: CartItem[] = newCartData.products.map((p: any) => {
        const stock = (productToAdd && p.id === productToAdd.id) ? productToAdd.stock : (p.stock || 100);
        return mapApiProductToCartItem(p, stock);
      });

      setCartState(prevState => ({
        ...prevState,
        cartId: newCartData.id,
        items: items,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      }));
      localStorage.setItem('cartId', String(newCartData.id));
      return newCartData.id;
    } catch (error) {
      console.error('Error in createNewCart:', error);
      setLoading(false);
      return null;
    }
    // setLoading(false) will be handled by the calling function (addToCart)
  };

  const addToCart = async (product: Product, quantityToAdd: number = 1) => {
    setLoading(true);
    try {
      let currentCartId = cartState.cartId;

      if (currentCartId === null) {
        const newCartId = await createNewCart(product, quantityToAdd);
        if (newCartId) {
          // createNewCart already updated the cartState with the new item(s)
          // including stock for the initial item. No further API call needed here.
          setLoading(false);
          return; // Optimization: return early
        } else {
          console.error('addToCart: Failed to create a new cart.');
          setLoading(false);
          return;
        }
      }

      // If cart exists, or if createNewCart was for an empty cart and now we add item
      const existingItemIndex = cartState.items.findIndex(item => item.id === product.id);
      let newItems: CartItem[];

      if (existingItemIndex !== -1) {
        const existingItem = cartState.items[existingItemIndex];
        const newQuantity = existingItem.quantity + quantityToAdd;
        if (newQuantity <= 0) {
          newItems = cartState.items.filter(item => item.id !== product.id);
        } else {
          newItems = cartState.items.map(item =>
            item.id === product.id ? { ...item, quantity: Math.min(newQuantity, item.stock) } : item
          );
        }
      } else {
        // Item does not exist in cart, add as new
        const newItem: CartItem = {
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: Math.min(quantityToAdd, product.stock),
          stock: product.stock,
          thumbnail: product.thumbnail,
          total: product.price * Math.min(quantityToAdd, product.stock), // Calculate initial total
          discountPercentage: 0, // Placeholder, will be updated by API response via updateCartAPI
          discountedPrice: product.price * Math.min(quantityToAdd, product.stock), // Placeholder
        };
        newItems = [...cartState.items, newItem];
      }

      setCartState(prevState => ({
        ...prevState,
        items: newItems,
        totalQuantity: newItems.reduce((sum, item) => sum + item.quantity, 0),
      }));

      await updateCartAPI(newItems); // This will fetch the updated cart with correct discount info

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
      setLoading(false); // Ensure loading is reset
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
      newItems = cartState.items.filter(item => item.id !== productId);
    } else {
      newItems = cartState.items.map(item =>
        item.id === productId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
      );
    }
    setCartState(prevState => ({
      ...prevState,
      items: newItems,
      totalQuantity: newItems.reduce((sum, item) => sum + item.quantity, 0),
    }));

    try {
      await updateCartAPI(newItems);
    } catch (error) {
      console.error('Error in updateQuantity while calling updateCartAPI:', error);
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
      // API returns the full cart data including all product details
      const updatedItemsFromApi = updatedCartData.products.map((apiProduct: any) => {
        const existingItem = (updatedItemsOverride || cartState.items).find(i => i.id === apiProduct.id);
        return mapApiProductToCartItem(apiProduct, existingItem?.stock);
      });

      setCartState(prevState => ({
        ...prevState, // cartId is preserved
        items: updatedItemsFromApi,
        totalQuantity: updatedItemsFromApi.reduce((sum, item) => sum + item.quantity, 0),
      }));

    } catch (error) {
      console.error('Error in updateCartAPI:', error);
      // Note: If updateCartAPI fails, the optimistic update in addToCart/updateQuantity/removeFromCart
      // might leave the local state inconsistent with the server.
      // A more robust solution would involve reverting optimistic updates on API failure.
      // For now, we just log the error.
      throw error; // Re-throw to allow calling function to handle if needed
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
