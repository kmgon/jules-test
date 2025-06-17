import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CartProvider, useCart, CartItem, Product } from './cart-context'; // Adjust path as needed

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn();

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  price: 100,
  stock: 10,
  thumbnail: 'test.jpg',
  description: 'Test Description',
  rating: 4,
  discountPercentage: 10,
  brand: 'TestBrand',
  category: 'TestCategory',
  images: [],
};

const mockCartItem: CartItem = {
  ...mockProduct,
  quantity: 1,
};

// Helper component to consume context for testing
// This component can be used to observe state changes.
// For triggering actions with specific parameters, we'll get context directly in tests.
const TestObserverComponent = () => {
  const context = useCart();
  if (!context) return null;
  return (
    <>
      <div data-testid="cart-id">{context.cartState.cartId ?? ''}</div>
      <div data-testid="total-quantity">{context.cartState.totalQuantity}</div>
      <div data-testid="items-count">{context.cartState.items.length}</div>
      <div data-testid="loading">{context.loading.toString()}</div>
      {context.cartState.items.map(item => (
        <div key={item.id} data-testid={`item-${item.id}-qty`}>{item.quantity}</div>
      ))}
    </>
  );
};

// Helper function to render with provider and return context
const renderWithCartProvider = (ui?: React.ReactElement) => {
  let contextValue: any;
  const TestComponentWithContext = () => {
    contextValue = useCart();
    return ui || <TestObserverComponent />;
  }
  const renderResult = render(
    <CartProvider>
      <TestComponentWithContext />
    </CartProvider>
  );
  return { ...renderResult, getContext: () => contextValue };
};


describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    (global.fetch as jest.Mock).mockClear();
    // Default mock for successful cart creation/update
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 123, // Mocked cart ID
        products: [{ ...mockProduct, quantity: 1 }], // Mocked products in cart
        totalQuantity: 1,
      }),
    });
  });

  test('initial state is empty cart, not loading', async () => {
    renderWithCartProvider();
    // Initial load from storage/API might take a moment
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('cart-id').textContent).toBe('');
    expect(screen.getByTestId('total-quantity').textContent).toBe('0');
    expect(screen.getByTestId('items-count').textContent).toBe('0');
  });

  test('loads cart from localStorage if cartId exists and fetch is successful', async () => {
    localStorageMock.setItem('cartId', '789');
    // Mock fetch for an existing cart
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 789,
        products: [{ ...mockProduct, quantity: 2, id: mockProduct.id }],
        total: 200, // Example total price
        totalQuantity: 2,
        userId: 1,
      }),
    });

    renderWithCartProvider();
    renderWithCartProvider();

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await waitFor(() => expect(screen.getByTestId('cart-id').textContent).toBe('789'));
    await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));
    await waitFor(() => expect(screen.getByTestId('items-count').textContent).toBe('1'));
  });

  test('clears localStorage and starts fresh if fetched cart (404) not found', async () => {
    localStorageMock.setItem('cartId', '789');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Cart not found" }),
    });

    render(
      <CartProvider>
        <TestConsumerComponent />
      </CartProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('cart-id').textContent).toBe('');
    expect(screen.getByTestId('total-quantity').textContent).toBe('0');
    expect(screen.getByTestId('items-count').textContent).toBe('0');
    expect(localStorageMock.getItem('cartId')).toBeNull();
  });


  describe('addToCart', () => {
    test('adds a new item to an empty cart, creates cart via API', async () => {
      // Mock for POST /carts/add
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 101,
          products: [{ ...mockProduct, quantity: 1 }],
          totalQuantity: 1,
          userId: 1
        }),
      });
      // Mock for subsequent PUT /carts/101 (if addToCart calls updateCartAPI separately)
      // This might not be called if createNewCart directly adds the product effectively.
      // Based on current implementation, createNewCart adds the product, then addToCart might call updateCartAPI.
      // Let's assume updateCartAPI is called.
       (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({
            id: 101,
            products: [{ ...mockProduct, quantity: 1, price: mockProduct.price, title: mockProduct.title, thumbnail: mockProduct.thumbnail }],
            totalQuantity: 1
        }),
      });

      const { getContext } = renderWithCartProvider();

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false')); // Wait for initial load

      await act(async () => {
        await getContext().addToCart(mockProduct, 1);
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

      expect(global.fetch).toHaveBeenCalledWith('https://dummyjson.com/carts/add', expect.objectContaining({method: 'POST'}));
      expect(screen.getByTestId('cart-id').textContent).toBe('101');
      expect(screen.getByTestId('total-quantity').textContent).toBe('1');
      expect(screen.getByTestId('items-count').textContent).toBe('1');
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]')[0].id).toBe(mockProduct.id);
      expect(localStorageMock.getItem('cartId')).toBe('101');
    });

    test('addToCart updates quantity of an existing item', async () => {
      // Initial state: cart with mockProduct, quantity 1
      localStorageMock.setItem('cartId', '102');
      localStorageMock.setItem('cartItems', JSON.stringify([{ ...mockCartItem, quantity: 1 }]));

      // Mock for initial load from localstorage/API
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 102, products: [{ ...mockProduct, quantity: 1 }], totalQuantity: 1 }),
      });
      // Mock for PUT /carts/102 (updateCartAPI)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 102, products: [{ ...mockProduct, quantity: 2 }], totalQuantity: 2 }),
      });

      const { getContext } = renderWithCartProvider();
      await waitFor(() => { // Wait for initial load to complete and context to be available
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(getContext()).toBeDefined();
      });

      // Add item first time (already handled by beforeEach/initial load mock)
      // Let's ensure the state is as expected (item with qty 1)
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('1'));


      await act(async () => {
        await getContext().addToCart(mockProduct, 1); // Adds mockProduct again
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('2');
      expect(screen.getByTestId('items-count').textContent).toBe('1');
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]')[0].quantity).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith('https://dummyjson.com/carts/102', expect.objectContaining({ method: 'PUT' }));
    });

    test('addToCart respects product stock', async () => {
      const productWithLimitedStock = { ...mockProduct, id: 2, stock: 1 };
      localStorageMock.setItem('cartId', '103');
      // Initial cart is empty for this test, cartId exists.
       (global.fetch as jest.Mock).mockResolvedValueOnce({ // initial load
        ok: true,
        json: async () => ({ id: 103, products: [], totalQuantity: 0 }),
      });
      // Mock for PUT /carts/103 (updateCartAPI after adding item)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 103, products: [{ ...productWithLimitedStock, quantity: 1 }], totalQuantity: 1 }),
      });

      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());


      await act(async () => {
        await getContext().addToCart(productWithLimitedStock, 1); // Add to stock limit
      });

      // Re-render observer to check state
      renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId(`item-${productWithLimitedStock.id}-qty`).textContent).toBe('1'));
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]')[0].quantity).toBe(1);


      // Attempt to add again - should not exceed stock
      (global.fetch as jest.Mock).mockResolvedValueOnce({ // Mock for the next PUT
        ok: true,
        json: async () => ({ id: 103, products: [{ ...productWithLimitedStock, quantity: 1 }], totalQuantity: 1 }),
      });

      await act(async () => {
        await getContext().addToCart(productWithLimitedStock, 1); // Attempt to add one more
      });

      renderWithCartProvider(); // Re-render to observe updated state
      await waitFor(() => expect(screen.getByTestId(`item-${productWithLimitedStock.id}-qty`).textContent).toBe('1'));
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]')[0].quantity).toBe(1);

      const lastFetchCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0] === 'https://dummyjson.com/carts/103' && call[1].method === 'PUT');
      expect(lastFetchCall).toBeDefined();
      expect(JSON.parse(lastFetchCall[1].body).products[0].quantity).toBe(1);
    });
  });

  describe('updateQuantity', () => {
    beforeEach(async () => {
      localStorageMock.setItem('cartId', '104');
      const initialItems = [{ ...mockProduct, id: mockProduct.id, quantity: 2, stock: 5 }];
      localStorageMock.setItem('cartItems', JSON.stringify(initialItems));
      (global.fetch as jest.Mock).mockResolvedValueOnce({ // Mock for initial load
        ok: true,
        json: async () => ({ id: 104, products: initialItems, totalQuantity: 2 }),
      });
       // Render here to allow context to initialize for subsequent getContext calls within this describe block
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));
    });

    test('increases quantity of an item', async () => {
      const { getContext } = renderWithCartProvider(); // Get context from a fresh render if needed, or ensure it's the correct one
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));


      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({ id: 104, products: [{ ...mockProduct, quantity: 3, stock: 5 }], totalQuantity: 3 }),
      });

      await act(async () => {
        await getContext().updateQuantity(mockProduct.id, 3);
      });

      renderWithCartProvider(); // Re-render observer
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('3');
      expect(screen.getByTestId(`item-${mockProduct.id}-qty`).textContent).toBe('3');
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]')[0].quantity).toBe(3);
      const lastFetchCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0] === 'https://dummyjson.com/carts/104' && call[1].method === 'PUT');
      expect(lastFetchCall).toBeDefined();
      expect(JSON.parse(lastFetchCall[1].body).products[0].quantity).toBe(3);
    });

    test('decreases quantity of an item', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({ id: 104, products: [{ ...mockProduct, quantity: 1, stock: 5 }], totalQuantity: 1 }),
      });

      await act(async () => {
        await getContext().updateQuantity(mockProduct.id, 1);
      });

      renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('1');
      expect(screen.getByTestId(`item-${mockProduct.id}-qty`).textContent).toBe('1');
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]')[0].quantity).toBe(1);
      const lastFetchCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0] === 'https://dummyjson.com/carts/104' && call[1].method === 'PUT');
       expect(lastFetchCall).toBeDefined();
      expect(JSON.parse(lastFetchCall[1].body).products[0].quantity).toBe(1);
    });

    test('removes item if quantity becomes 0', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({ id: 104, products: [], totalQuantity: 0 }),
      });

      await act(async () => {
        await getContext().updateQuantity(mockProduct.id, 0);
      });

      renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('0');
      expect(screen.getByTestId('items-count').textContent).toBe('0');
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]').length).toBe(0);
      const lastFetchCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0] === 'https://dummyjson.com/carts/104' && call[1].method === 'PUT');
      expect(lastFetchCall).toBeDefined();
      expect(JSON.parse(lastFetchCall[1].body).products.length).toBe(0);
    });

    test('updateQuantity respects product stock (cannot increase beyond stock)', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({ id: 104, products: [{ ...mockProduct, quantity: 5, stock: 5 }], totalQuantity: 5 }),
      });

      await act(async () => {
        await getContext().updateQuantity(mockProduct.id, 10); // Attempt to set to 10 (stock is 5)
      });

      renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('5');
      expect(screen.getByTestId(`item-${mockProduct.id}-qty`).textContent).toBe('5');
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]')[0].quantity).toBe(5);
      const lastFetchCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0] === 'https://dummyjson.com/carts/104' && call[1].method === 'PUT');
      expect(lastFetchCall).toBeDefined();
      expect(JSON.parse(lastFetchCall[1].body).products[0].quantity).toBe(5);
    });
  });

  describe('removeFromCart', () => {
    beforeEach(async () => {
      localStorageMock.setItem('cartId', '105');
      const initialItems = [
        { ...mockProduct, id: mockProduct.id, quantity: 1, stock: 5 },
        { ...mockProduct, id: 2, title: "Another Product", quantity: 3, stock: 10 }
      ];
      localStorageMock.setItem('cartItems', JSON.stringify(initialItems));
      (global.fetch as jest.Mock).mockResolvedValueOnce({ // Mock for initial load
        ok: true,
        json: async () => ({ id: 105, products: initialItems, totalQuantity: 4 }),
      });
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('4'));
    });

    test('removes an item from the cart', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('4'));

      const productToRemoveId = mockProduct.id;
      // Expected remaining items after removal
      const expectedRemainingItems = [{ ...mockProduct, id: 2, title: "Another Product", quantity: 3, stock: 10 }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({ id: 105, products: expectedRemainingItems, totalQuantity: 3 }),
      });

      await act(async () => {
        await getContext().removeFromCart(productToRemoveId);
      });

      renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('3');
      expect(screen.getByTestId('items-count').textContent).toBe('1');
      expect(screen.queryByTestId(`item-${productToRemoveId}-qty`)).toBeNull(); // Check item is removed from DOM
      expect(screen.getByTestId('item-2-qty').textContent).toBe('3'); // Check other item still exists

      const storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
      expect(storedItems.length).toBe(1);
      expect(storedItems[0].id).toBe(2);

      const lastFetchCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0] === 'https://dummyjson.com/carts/105' && call[1].method === 'PUT');
      expect(lastFetchCall).toBeDefined();
      expect(JSON.parse(lastFetchCall[1].body).products.length).toBe(1);
      expect(JSON.parse(lastFetchCall[1].body).products[0].id).toBe(2);
    });
  });

  describe('clearCart', () => {
    beforeEach(async () => {
      localStorageMock.setItem('cartId', '106');
      const initialItems = [
        { ...mockProduct, id: 1, quantity: 1, stock: 5 },
        { ...mockProduct, id: 2, title: "Another Product", quantity: 3, stock: 10 }
      ];
      localStorageMock.setItem('cartItems', JSON.stringify(initialItems));
      (global.fetch as jest.Mock).mockResolvedValueOnce({ // Mock for initial load
        ok: true,
        json: async () => ({ id: 106, products: initialItems, totalQuantity: 4 }),
      });
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('4'));
    });

    test('clears all items from the cart and updates API', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('4'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI with empty items
        ok: true,
        json: async () => ({ id: 106, products: [], totalQuantity: 0 }),
      });

      await act(async () => {
        await getContext().clearCart();
      });

      renderWithCartProvider(); // Re-render observer
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('0');
      expect(screen.getByTestId('items-count').textContent).toBe('0');
      expect(screen.queryByTestId(`item-1-qty`)).toBeNull();
      expect(screen.queryByTestId(`item-2-qty`)).toBeNull();

      // localStorage 'cartItems' should be removed or be an empty array, 'cartId' should persist.
      const storedItems = localStorageMock.getItem('cartItems');
      // Depending on implementation, it might remove the item or store an empty array.
      // Current CartProvider removes 'cartItems' if items array is empty.
      expect(storedItems).toBeNull();
      expect(localStorageMock.getItem('cartId')).toBe('106'); // CartId persists

      const lastFetchCall = (global.fetch as jest.Mock).mock.calls.find(call => call[0] === 'https://dummyjson.com/carts/106' && call[1].method === 'PUT');
      expect(lastFetchCall).toBeDefined();
      expect(JSON.parse(lastFetchCall[1].body).products.length).toBe(0);
    });
  });

  describe('loading states', () => {
    test('sets loading to true during API call and false after', async () => {
      renderWithCartProvider(); // Initial render
      const { getContext } = renderWithCartProvider(); // Get context from a re-render to ensure it's fresh
      await waitFor(() => expect(getContext()).toBeDefined());
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false')); // Initial state

      // Mock fetch for an action, e.g., addToCart creating a new cart
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(resolve => {
          // Check loading state *during* the fetch call
          expect(screen.getByTestId('loading').textContent).toBe('true');
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ id: 201, products: [{...mockProduct, quantity: 1}], totalQuantity: 1 }),
          }), 50); // Short delay to simulate network
        })
      );
       (global.fetch as jest.Mock).mockImplementationOnce(() =>  // for the updateCartAPI call in addToCart
        new Promise(resolve => {
          expect(screen.getByTestId('loading').textContent).toBe('true');
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ id: 201, products: [{...mockProduct, quantity: 1}], totalQuantity: 1 }),
          }), 50);
        })
      );


      await act(async () => {
        await getContext().addToCart(mockProduct, 1);
      });

      // Loading should be false after all operations complete
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    });
  });

  // TODO: Test localStorage updates for all actions (double check coverage)
});
});
  // TODO: Test removeFromCart
  // TODO: Test clearCart
  // TODO: Test loading states more thoroughly
  // TODO: Test localStorage updates for all actions
});
