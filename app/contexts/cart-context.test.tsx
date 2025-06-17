import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CartProvider, useCart, CartItem, Product } from './cart-context'; // Adjust path as needed

// Mock localStorage
global.fetch = jest.fn(); // Ensure fetch is mocked globally at the top

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


const mockApiProduct1 = { // Corresponds to Product, but as API would return in cart
  id: 1,
  title: 'Test Product 1',
  price: 100, // Unit price
  quantity: 1,
  total: 100, // Line total (price * quantity)
  discountPercentage: 10,
  discountedPrice: 90, // Line discounted total
  thumbnail: 'test1.jpg',
  // stock is NOT part of API response for cart items
};

const mockApiProduct2 = {
  id: 2,
  title: 'Test Product 2',
  price: 50,
  quantity: 2,
  total: 100,
  discountPercentage: 0,
  discountedPrice: 100,
  thumbnail: 'test2.jpg',
};

// This is the full Product object, as would be passed to addToCart
const fullProduct1: Product = {
  id: 1,
  title: 'Test Product 1',
  price: 100,
  stock: 10, // Has stock
  thumbnail: 'test1.jpg',
  description: 'Desc 1',
  rating: 4,
  discountPercentage: 10,
  brand: 'Brand1',
  category: 'Cat1',
  images: [],
};

const fullProduct2: Product = {
  id: 2,
  title: 'Test Product 2',
  price: 50,
  stock: 5,
  thumbnail: 'test2.jpg',
  description: 'Desc 2',
  rating: 3,
  discountPercentage: 0,
  brand: 'Brand2',
  category: 'Cat2',
  images: [],
};


// This is what a CartItem in cartState should look like (derived from API product + stock)
const stateCartItem1: CartItem = {
  id: mockApiProduct1.id,
  title: mockApiProduct1.title,
  price: mockApiProduct1.price,
  quantity: mockApiProduct1.quantity,
  stock: fullProduct1.stock, // Stock from fullProduct1
  thumbnail: mockApiProduct1.thumbnail,
  total: mockApiProduct1.total,
  discountPercentage: mockApiProduct1.discountPercentage,
  discountedPrice: mockApiProduct1.discountedPrice,
};


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
        <div key={item.id} data-testid={`item-${item.id}`}>
          <span data-testid={`item-${item.id}-qty`}>{item.quantity}</span>
          <span data-testid={`item-${item.id}-stock`}>{item.stock}</span>
          <span data-testid={`item-${item.id}-price`}>{item.price}</span>
          <span data-testid={`item-${item.id}-total`}>{item.total}</span>
          <span data-testid={`item-${item.id}-discountedPrice`}>{item.discountedPrice}</span>
        </div>
      ))}
    </>
  );
};

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
  // Return contextValue via a getter to ensure it's the latest after render completes
  return { ...renderResult, getContext: () => contextValue };
};


describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    (global.fetch as jest.Mock).mockClear();
    // Default mock for GET /carts/:id to prevent console errors on initial load if cartId is set
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1, products: [], totalQuantity: 0, // Default empty cart
      }),
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('initial state is empty cart, not loading', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ // for initializeCart if it tries to fetch
        ok: true, json: async () => ({ id:1, products: [], totalQuantity: 0 })
    });
    renderWithCartProvider();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('cart-id').textContent).toBe('');
    expect(screen.getByTestId('total-quantity').textContent).toBe('0');
    expect(screen.getByTestId('items-count').textContent).toBe('0');
  });

  describe('initializeCart', () => {
    test('loads cart from localStorage if cartId exists and fetch is successful', async () => {
      localStorageMock.setItem('cartId', '789');
      // Mock fetch for GET /carts/789
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 789,
          products: [mockApiProduct1], // API returns product structure
          total: mockApiProduct1.total,
          discountedTotal: mockApiProduct1.discountedPrice,
          totalQuantity: mockApiProduct1.quantity,
          userId: 1,
        }),
      });
      // Store related item with stock in local storage to test stock preservation
      const localCartItemWithStock = { ...stateCartItem1, stock: fullProduct1.stock };
      localStorageMock.setItem('cartItems', JSON.stringify([localCartItemWithStock]));


      renderWithCartProvider();

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('cart-id').textContent).toBe('789');
      expect(screen.getByTestId('total-quantity').textContent).toBe(String(mockApiProduct1.quantity));
      expect(screen.getByTestId('items-count').textContent).toBe('1');
      await waitFor(() => { // Wait for item to render
        expect(screen.getByTestId(`item-${mockApiProduct1.id}-qty`).textContent).toBe(String(mockApiProduct1.quantity));
        expect(screen.getByTestId(`item-${mockApiProduct1.id}-stock`).textContent).toBe(String(fullProduct1.stock)); // Check stock
        expect(screen.getByTestId(`item-${mockApiProduct1.id}-discountedPrice`).textContent).toBe(String(mockApiProduct1.discountedPrice));
      });
    });

    test('loads cartItems from localStorage if no cartId but items exist', async () => {
        const localCartItems = [{ ...stateCartItem1, stock: 25 }]; // Item with stock
        localStorageMock.setItem('cartItems', JSON.stringify(localCartItems));
        // No fetch should be called if only cartItems exist without cartId

        renderWithCartProvider();

        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        expect(screen.getByTestId('cart-id').textContent).toBe(''); // No cartId
        expect(screen.getByTestId('total-quantity').textContent).toBe(String(localCartItems[0].quantity));
        expect(screen.getByTestId('items-count').textContent).toBe('1');
        expect(screen.getByTestId(`item-${localCartItems[0].id}-stock`).textContent).toBe('25');
        expect(global.fetch).not.toHaveBeenCalledWith(expect.stringMatching(/https:\/\/dummyjson.com\/carts\/\d+/));
    });


    test('clears localStorage and starts fresh if fetched cart (404) not found', async () => {
      localStorageMock.setItem('cartId', '789');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: "Cart not found" }),
      });

      render( <CartProvider> <TestObserverComponent /> </CartProvider> ); // Corrected TestConsumerComponent

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('cart-id').textContent).toBe('');
      expect(screen.getByTestId('total-quantity').textContent).toBe('0');
      expect(screen.getByTestId('items-count').textContent).toBe('0');
      expect(localStorageMock.getItem('cartId')).toBeNull();
      expect(localStorageMock.getItem('cartItems')).toBeNull();
    });
  });


  describe('addToCart', () => {
    test('adds a new item to an empty cart (creates cart via API) - optimized path', async () => {
      const newCartId = '101';
      // Mock for POST /carts/add
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: newCartId,
          products: [{ ...mockApiProduct1, quantity: 1 }], // API returns product with its structure
          totalQuantity: 1,
          userId: 1
        }),
      });

      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

      await act(async () => {
        // Pass fullProduct1 which includes stock
        await getContext().addToCart(fullProduct1, 1);
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

      // Check fetch call for cart creation
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only one call for createNewCart
      expect(global.fetch).toHaveBeenCalledWith('https://dummyjson.com/carts/add', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ userId: 1, products: [{ id: fullProduct1.id, quantity: 1 }]})
      }));

      // Check state
      expect(screen.getByTestId('cart-id').textContent).toBe(newCartId);
      expect(screen.getByTestId('total-quantity').textContent).toBe('1');
      expect(screen.getByTestId('items-count').textContent).toBe('1');

      // Check item details in state (via observer)
      await waitFor(() => {
        expect(screen.getByTestId(`item-${fullProduct1.id}-qty`).textContent).toBe('1');
        expect(screen.getByTestId(`item-${fullProduct1.id}-stock`).textContent).toBe(String(fullProduct1.stock));
        expect(screen.getByTestId(`item-${fullProduct1.id}-price`).textContent).toBe(String(fullProduct1.price));
        expect(screen.getByTestId(`item-${fullProduct1.id}-total`).textContent).toBe(String(mockApiProduct1.total)); // From API mock
        expect(screen.getByTestId(`item-${fullProduct1.id}-discountedPrice`).textContent).toBe(String(mockApiProduct1.discountedPrice)); // From API mock
      });

      // Check localStorage
      const storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
      expect(storedItems.length).toBe(1);
      expect(storedItems[0].id).toBe(fullProduct1.id);
      expect(storedItems[0].stock).toBe(fullProduct1.stock);
      expect(storedItems[0].discountedPrice).toBe(mockApiProduct1.discountedPrice);
      expect(localStorageMock.getItem('cartId')).toBe(newCartId);
    });

    test('adds a new item to an existing cart', async () => {
        const existingCartId = '102';
        // Initial state: cart with fullProduct1
        localStorageMock.setItem('cartId', existingCartId);
        localStorageMock.setItem('cartItems', JSON.stringify([{...stateCartItem1, quantity: 1, stock: fullProduct1.stock}]));

        // Mock for initial load (GET /carts/:id)
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: existingCartId,
                products: [{ ...mockApiProduct1, quantity: 1 }], // fullProduct1 is item 1
                totalQuantity: 1,
            }),
        });

        const { getContext } = renderWithCartProvider();
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        await waitFor(() => expect(screen.getByTestId('cart-id').textContent).toBe(existingCartId));


        // Mock for PUT /carts/:cartId when adding fullProduct2
        const expectedApiProduct2Optimistic = { // What addToCart optimistically creates for product 2
            id: fullProduct2.id,
            title: fullProduct2.title,
            price: fullProduct2.price,
            quantity: 1,
            total: fullProduct2.price * 1, // Optimistic total
            discountPercentage: 0, // Optimistic
            discountedPrice: fullProduct2.price * 1, // Optimistic
            thumbnail: fullProduct2.thumbnail,
        };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: existingCartId,
                // API returns both items, product2 now has its API-authoritative values
                products: [
                    { ...mockApiProduct1, quantity: 1 }, // Item 1 already in cart
                    { ...mockApiProduct2, quantity: 1 }  // Item 2 added, API confirms its details
                ],
                totalQuantity: 2,
            }),
        });

        await act(async () => {
            await getContext().addToCart(fullProduct2, 1); // Add fullProduct2
        });
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

        expect(global.fetch).toHaveBeenCalledWith(`https://dummyjson.com/carts/${existingCartId}`, expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining(`"id":${fullProduct2.id}`),
        }));

        expect(screen.getByTestId('items-count').textContent).toBe('2');
        expect(screen.getByTestId('total-quantity').textContent).toBe('2');
        // Verify product 2 details (after API update)
        await waitFor(() => {
            expect(screen.getByTestId(`item-${fullProduct2.id}-qty`).textContent).toBe('1');
            expect(screen.getByTestId(`item-${fullProduct2.id}-stock`).textContent).toBe(String(fullProduct2.stock));
            expect(screen.getByTestId(`item-${fullProduct2.id}-discountedPrice`).textContent).toBe(String(mockApiProduct2.discountedPrice)); // from API
        });
    });


    test('updates quantity of an existing item in cart', async () => {
      localStorageMock.setItem('cartId', '102');
      const initialCartItem = { ...stateCartItem1, quantity: 1, stock: fullProduct1.stock };
      localStorageMock.setItem('cartItems', JSON.stringify([initialCartItem]));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ // Initial load
          ok: true,
          json: async () => ({ id: '102', products: [{...mockApiProduct1, quantity: 1}], totalQuantity: 1 }),
        })
        .mockResolvedValueOnce({ // PUT update
          ok: true,
          json: async () => ({ id: '102', products: [{ ...mockApiProduct1, quantity: 2 }], totalQuantity: 2 }),
        });

      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('1'));


      await act(async () => {
        await getContext().addToCart(fullProduct1, 1); // Add same product again
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('2');
      expect(screen.getByTestId('items-count').textContent).toBe('1');
      expect(screen.getByTestId(`item-${fullProduct1.id}-qty`).textContent).toBe('2');
      expect(JSON.parse(localStorageMock.getItem('cartItems') || '[]')[0].quantity).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith('https://dummyjson.com/carts/102', expect.objectContaining({ method: 'PUT' }));
    });

    test('addToCart respects product stock', async () => {
      const productWithLimitedStock = { ...fullProduct1, stock: 1 }; // stock is 1
      localStorageMock.setItem('cartId', '103');
      localStorageMock.setItem('cartItems', JSON.stringify([]));


      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ // Initial load (empty cart)
          ok: true,
          json: async () => ({ id: '103', products: [], totalQuantity: 0 }),
        })
        .mockResolvedValueOnce({ // PUT after adding item (quantity 1)
          ok: true,
          json: async () => ({ id: '103', products: [{ ...mockApiProduct1, id:productWithLimitedStock.id, quantity: 1 }], totalQuantity: 1 }),
        })
        .mockResolvedValueOnce({ // PUT after attempting to add again (should still be quantity 1)
          ok: true,
          json: async () => ({ id: '103', products: [{ ...mockApiProduct1, id:productWithLimitedStock.id, quantity: 1 }], totalQuantity: 1 }),
        });

      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

      // Add to stock limit
      await act(async () => {
        await getContext().addToCart(productWithLimitedStock, 1);
      });
      await waitFor(() => expect(screen.getByTestId(`item-${productWithLimitedStock.id}-qty`).textContent).toBe('1'));

      // Attempt to add again - should not exceed stock
      await act(async () => {
        await getContext().addToCart(productWithLimitedStock, 1);
      });
      await waitFor(() => expect(screen.getByTestId(`item-${productWithLimitedStock.id}-qty`).textContent).toBe('1'));

      const putCalls = (global.fetch as jest.Mock).mock.calls.filter(call => call[0].startsWith('https://dummyjson.com/carts/103') && call[1].method === 'PUT');
      expect(putCalls.length).toBe(2);
      expect(JSON.parse(putCalls[0][1].body).products[0].quantity).toBe(1);
      expect(JSON.parse(putCalls[1][1].body).products[0].quantity).toBe(1); // Still 1, respecting stock
    });
  });

  describe('updateQuantity', () => {
    const cartIdForUpdate = '104';
    const productForUpdate: CartItem = {...stateCartItem1, id: fullProduct1.id, quantity: 2, stock: 5 };

    beforeEach(async () => {
      localStorageMock.setItem('cartId', cartIdForUpdate);
      localStorageMock.setItem('cartItems', JSON.stringify([productForUpdate]));
      (global.fetch as jest.Mock).mockResolvedValueOnce({ // Mock for initial load
        ok: true,
        json: async () => ({ id: cartIdForUpdate, products: [{...mockApiProduct1, quantity: 2}], totalQuantity: 2 }),
      });
      renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));
    });

    test('increases quantity of an item', async () => {
      const { getContext } = renderWithCartProvider(); // Re-render or get fresh context
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));


      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({ id: cartIdForUpdate, products: [{ ...mockApiProduct1, quantity: 3 }], totalQuantity: 3 }),
      });

      await act(async () => {
        await getContext().updateQuantity(fullProduct1.id, 3);
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('3');
      expect(screen.getByTestId(`item-${fullProduct1.id}-qty`).textContent).toBe('3');
      const stored = JSON.parse(localStorageMock.getItem('cartItems') || '[]')
      expect(stored[0].quantity).toBe(3);
      expect(stored[0].stock).toBe(5); // Stock should be preserved
    });

    test('removes item if quantity becomes 0', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({ id: cartIdForUpdate, products: [], totalQuantity: 0 }),
      });

      await act(async () => {
        await getContext().updateQuantity(fullProduct1.id, 0);
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('0');
      expect(screen.getByTestId('items-count').textContent).toBe('0');
    });

    test('respects product stock (cannot increase beyond stock)', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe('2'));


      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true, // API confirms quantity is capped at stock
        json: async () => ({ id: cartIdForUpdate, products: [{ ...mockApiProduct1, quantity: productForUpdate.stock }], totalQuantity: productForUpdate.stock }),
      });

      await act(async () => {
        await getContext().updateQuantity(fullProduct1.id, 10); // Attempt to set to 10 (stock is 5)
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe(String(productForUpdate.stock));
      expect(screen.getByTestId(`item-${fullProduct1.id}-qty`).textContent).toBe(String(productForUpdate.stock));
    });
  });

  describe('removeFromCart', () => {
    const cartIdForRemove = '105';
    const item1InCart: CartItem = { ...stateCartItem1, id: fullProduct1.id, quantity: 1, stock: fullProduct1.stock };
    const item2InCart: CartItem = {
        ...stateCartItem1, // Base it on stateCartItem1 to have all fields
        id: fullProduct2.id, title: fullProduct2.title, price: fullProduct2.price, stock: fullProduct2.stock, quantity: 3,
        total: fullProduct2.price * 3, discountedPrice: fullProduct2.price * 3, discountPercentage: 0, thumbnail: fullProduct2.thumbnail
    };


    beforeEach(async () => {
      localStorageMock.setItem('cartId', cartIdForRemove);
      localStorageMock.setItem('cartItems', JSON.stringify([item1InCart, item2InCart]));
      (global.fetch as jest.Mock).mockResolvedValueOnce({ // Mock for initial load
        ok: true, // API returns products corresponding to item1InCart and item2InCart
        json: async () => ({ id: cartIdForRemove, products: [
            {...mockApiProduct1, id: item1InCart.id, quantity: item1InCart.quantity},
            {...mockApiProduct2, id: item2InCart.id, quantity: item2InCart.quantity}
        ], totalQuantity: item1InCart.quantity + item2InCart.quantity }),
      });
      renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe(String(item1InCart.quantity + item2InCart.quantity)));
      await waitFor(() => expect(screen.getByTestId('items-count').textContent).toBe('2'));
    });

    test('removes an item from the cart', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe(String(item1InCart.quantity + item2InCart.quantity)));


      const productToRemoveId = fullProduct1.id;
      // Expected API product structure for remaining item (item2InCart)
      const expectedRemainingApiProduct = {...mockApiProduct2, id: item2InCart.id, quantity: item2InCart.quantity};


      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI
        ok: true,
        json: async () => ({ id: cartIdForRemove, products: [expectedRemainingApiProduct], totalQuantity: item2InCart.quantity }),
      });

      await act(async () => {
        await getContext().removeFromCart(productToRemoveId);
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe(String(item2InCart.quantity));
      expect(screen.getByTestId('items-count').textContent).toBe('1');
      expect(screen.queryByTestId(`item-${productToRemoveId}`)).toBeNull();
      expect(screen.getByTestId(`item-${item2InCart.id}-qty`).textContent).toBe(String(item2InCart.quantity));
      expect(screen.getByTestId(`item-${item2InCart.id}-stock`).textContent).toBe(String(item2InCart.stock)); // Check stock preserved
    });
  });

  describe('clearCart', () => {
    const cartIdForClear = '106';
     const item1InCart: CartItem = { ...stateCartItem1, id: fullProduct1.id, quantity: 1, stock: fullProduct1.stock };
    const item2InCart: CartItem = {
        ...stateCartItem1, id: fullProduct2.id, title: fullProduct2.title, price: fullProduct2.price, stock: fullProduct2.stock, quantity: 3,
        total: fullProduct2.price * 3, discountedPrice: fullProduct2.price * 3, discountPercentage: 0, thumbnail: fullProduct2.thumbnail
    };

    beforeEach(async () => {
      localStorageMock.setItem('cartId', cartIdForClear);
      localStorageMock.setItem('cartItems', JSON.stringify([item1InCart, item2InCart]));
      (global.fetch as jest.Mock).mockResolvedValueOnce({ // Mock for initial load
        ok: true,
        json: async () => ({ id: cartIdForClear, products: [
             {...mockApiProduct1, id: item1InCart.id, quantity: item1InCart.quantity},
             {...mockApiProduct2, id: item2InCart.id, quantity: item2InCart.quantity}
        ], totalQuantity: item1InCart.quantity + item2InCart.quantity }),
      });
      renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
       await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe(String(item1InCart.quantity + item2InCart.quantity)));
    });

    test('clears all items from the cart and updates API', async () => {
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('total-quantity').textContent).toBe(String(item1InCart.quantity + item2InCart.quantity)));


      (global.fetch as jest.Mock).mockResolvedValueOnce({ // For updateCartAPI with empty items
        ok: true,
        json: async () => ({ id: cartIdForClear, products: [], totalQuantity: 0 }),
      });

      await act(async () => {
        await getContext().clearCart();
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
      expect(screen.getByTestId('total-quantity').textContent).toBe('0');
      expect(screen.getByTestId('items-count').textContent).toBe('0');
      expect(localStorageMock.getItem('cartItems')).toBeNull(); // cartItems removed
      expect(localStorageMock.getItem('cartId')).toBe(cartIdForClear); // CartId persists
    });
  });

  describe('loading states', () => {
    test('sets loading to true during API call and false after', async () => {
       (global.fetch as jest.Mock).mockResolvedValueOnce({ // initial load
          ok: true, json: async () => ({ id:1, products: [], totalQuantity: 0 })
      });
      const { getContext } = renderWithCartProvider();
      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

      (global.fetch as jest.Mock).mockImplementationOnce(() => // For POST /carts/add
        new Promise(resolve => {
          // Must use `act` for state changes even within promise if they affect React components
          act(() => {
            // We can't easily check screen.getByTestId('loading') here directly if it's updated
            // within the same tick as the promise. Instead, we rely on observing it before/after the await.
          });
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ id: 201, products: [{...mockApiProduct1, quantity: 1}], totalQuantity: 1 }),
          }), 50);
        })
      );

      // No second fetch call expected due to addToCart optimization

      await act(async () => {
        // This will trigger setLoading(true) internally
        const loadingPromise = getContext().addToCart(fullProduct1, 1);
        // Check loading state immediately after calling (should be true if setLoading(true) is synchronous)
        // However, due to async nature and state batching, it's better to check within waitFor or after await.
        // For this test, we'll check it becomes true then false.
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('true'));
        await loadingPromise; // Wait for addToCart to complete
      });

      await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    });
  });
});
