import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard, type Product } from './product-card';
import { CartProvider, useCart } from '~/contexts/cart-context'; // Adjusted import

// Minimal localStorage Mock
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
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock fetch (if not already globally mocked by cart-context.test.tsx in the same run)
if (!global.fetch) {
  global.fetch = vi.fn();
}


const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: 'This is a test product description.',
  price: 100,
  discountPercentage: 10,
  rating: 3.5,
  stock: 10,
  brand: 'TestBrand',
  category: 'TestCategory',
  thumbnail: 'https://via.placeholder.com/150',
  images: ['https://via.placeholder.com/150'],
};

// Helper to render with providers
const renderProductCardWithCart = (product: Product, initialCartState?: any) => {
  // If initialCartState is provided, we might need a way to make CartProvider use it.
  // For now, CartProvider will initialize its own state (empty or from mocked localStorage).
  // We can manipulate localStorage before rendering to set up initial cart state.
  return render(
    <MemoryRouter>
      <CartProvider>
        <ProductCard product={product} />
      </CartProvider>
    </MemoryRouter>
  );
};


describe('ProductCard', () => {
  beforeEach(() => {
    localStorageMock.clear();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
    // Default fetch mock for cart operations (create, update)
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, products: [], totalQuantity: 0 }), // Generic response
    });
  });

  it('renders product details correctly within a link', () => {
    renderProductCardWithCart(mockProduct);

    // Check that the content is present (basic details)
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Brand: TestBrand')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description.')).toBeInTheDocument();

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://via.placeholder.com/150');
    expect(image).toHaveAttribute('alt', 'Test Product');

    // Check that the entire card is a link pointing to the correct product page
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', `/products/${mockProduct.id}`);
  });

  it('renders stars correctly based on rating', () => {
    const { rerender, unmount } = renderProductCardWithCart(mockProduct);
    // Check stars for the initial mockProduct rating
    let stars = screen.getAllByText((content, element) => element?.tagName.toLowerCase() === 'span' && (content === '★' || content === '☆'));
    expect(stars.filter(star => star.textContent === '★').length).toBe(Math.round(mockProduct.rating));
    expect(stars.filter(star => star.textContent === '☆').length).toBe(5 - Math.round(mockProduct.rating));
    unmount(); // Clean up this render
  });

  it('shows "Add to Cart" button when item is not in cart', async () => {
    renderProductCardWithCart(mockProduct);
    // Wait for CartProvider to initialize (it might do async stuff)
    await screen.findByText('Add to Cart'); // Implicitly waits for loading to finish if any
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('clicking "Add to Cart" adds the item and shows quantity controls', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ // For createNewCart POST
        ok: true,
        json: async () => ({ id: 123, products: [{ ...mockProduct, quantity: 1 }], totalQuantity: 1 }),
      })
      .mockResolvedValueOnce({ // For updateCartAPI PUT (if called by addToCart)
        ok: true,
        json: async () => ({ id: 123, products: [{ ...mockProduct, quantity: 1 }], totalQuantity: 1 }),
      });

    renderProductCardWithCart(mockProduct);
    const addButton = await screen.findByRole('button', { name: /add to cart/i });

    await act(async () => {
      fireEvent.click(addButton);
    });

    // After clicking, quantity controls should appear
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Assuming quantity 1 is displayed
      expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
    });
    // Check if Add to Cart button is gone
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
     // Check localStorage
    const storedCartId = localStorageMock.getItem('cartId');
    expect(storedCartId).toBe('123'); // From mocked createNewCart
    const storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
    expect(storedItems.length).toBe(1);
    expect(storedItems[0].id).toBe(mockProduct.id);
    expect(storedItems[0].quantity).toBe(1);
  });

  it('displays quantity controls when item is already in cart', async () => {
    localStorageMock.setItem('cartId', '123');
    localStorageMock.setItem('cartItems', JSON.stringify([{ ...mockProduct, quantity: 2, stock: mockProduct.stock }]));
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ // For initial cart load
      ok: true,
      json: async () => ({ id: 123, products: [{ ...mockProduct, quantity: 2 }], totalQuantity: 2 }),
    });

    renderProductCardWithCart(mockProduct);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Displays current quantity
      expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
  });

  it('clicking "+" button increases quantity', async () => {
    localStorageMock.setItem('cartId', '123');
    localStorageMock.setItem('cartItems', JSON.stringify([{ ...mockProduct, quantity: 1, stock: mockProduct.stock }]));
     (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ // initial load
        ok: true, json: async () => ({ id: 123, products: [{ ...mockProduct, quantity: 1 }], totalQuantity: 1 }),
      })
      .mockResolvedValueOnce({ // for updateQuantity
        ok: true, json: async () => ({ id: 123, products: [{ ...mockProduct, quantity: 2 }], totalQuantity: 2 }),
      });

    renderProductCardWithCart(mockProduct);
    const plusButton = await screen.findByRole('button', { name: '+' });

    await act(async () => {
      fireEvent.click(plusButton);
    });

    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    const storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
    expect(storedItems[0].quantity).toBe(2);
  });

  it('clicking "-" button decreases quantity or removes item', async () => {
    localStorageMock.setItem('cartId', '123');
    localStorageMock.setItem('cartItems', JSON.stringify([{ ...mockProduct, quantity: 2, stock: mockProduct.stock }]));
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ // initial load
        ok: true, json: async () => ({ id: 123, products: [{ ...mockProduct, quantity: 2 }], totalQuantity: 2 }),
      })
      .mockResolvedValueOnce({ // for updateQuantity (2 -> 1)
        ok: true, json: async () => ({ id: 123, products: [{ ...mockProduct, quantity: 1 }], totalQuantity: 1 }),
      })
      .mockResolvedValueOnce({ // for removeFromCart (1 -> 0, so remove)
        ok: true, json: async () => ({ id: 123, products: [], totalQuantity: 0 }),
      });

    renderProductCardWithCart(mockProduct);
    const minusButton = await screen.findByRole('button', { name: '-' });

    // Decrease from 2 to 1
    await act(async () => {
      fireEvent.click(minusButton);
    });
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    let storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
    expect(storedItems[0].quantity).toBe(1);

    // Decrease from 1 to 0 (item removed, "Add to Cart" shown)
    await act(async () => {
      fireEvent.click(minusButton); // minusButton should still be there
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument());
    storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
    // Item should be removed from localStorage or cartItems array becomes empty
    // Based on CartProvider logic, it removes item from array. If array empty, cartItems key removed.
    expect(storedItems.find((item: Product) => item.id === mockProduct.id)).toBeUndefined();
  });

  it('"+" button is disabled when quantity reaches stock', async () => {
    const productWithLowStock = { ...mockProduct, stock: 1 };
    localStorageMock.setItem('cartId', '123');
    localStorageMock.setItem('cartItems', JSON.stringify([{ ...productWithLowStock, quantity: 1 }]));
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ // initial load
      ok: true, json: async () => ({ id: 123, products: [{ ...productWithLowStock, quantity: 1 }], totalQuantity: 1 }),
    });

    renderProductCardWithCart(productWithLowStock);
    const plusButton = await screen.findByRole('button', { name: '+' });
    expect(plusButton).toBeDisabled();
  });
});
