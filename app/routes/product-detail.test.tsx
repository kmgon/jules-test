import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

import ProductDetailPage, { loader as productDetailLoader } from './product-detail';
import type { Product, ProductDetail as ProductDetailInterface } from '../components/product-card'; // Renamed ProductDetail to avoid conflict
import { mockProductDetail, mockRecommendationsProducts } from './_mocks/product-detail-mock';
import { CartProvider } from '~/contexts/cart-context';

// Minimal localStorage Mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

// Mock RecommendationsWidget to prevent its own fetch calls and simplify tests
vi.mock('../components/recommendations-widget', () => ({
  default: ({currentProductId, category}: {currentProductId?: number, category?: string}) => (
    <div data-testid="recommendations-widget">
      <h3>Recommended Products</h3>
      <p>Mocked Widget: Current ID {currentProductId}, Category: {category}</p>
    </div>
  ),
}));


const server = setupServer(
  http.get('https://dummyjson.com/products/:productId', ({ params }) => {
    const { productId } = params;
    if (productId === String(mockProductDetail.id)) {
      return HttpResponse.json(mockProductDetail);
    }
    // Add a specific mock for product ID 999 (out of stock test)
    if (productId === '999') {
      return HttpResponse.json({ ...mockProductDetail, id: 999, stock: 0, title: "Out of Stock Product" });
    }
    if (productId === '404') {
      return new HttpResponse(JSON.stringify({ message: 'Product not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new HttpResponse(JSON.stringify({ message: 'Generic error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }),
  http.get('https://dummyjson.com/products', () => { // For recommendations
    return HttpResponse.json({ products: mockRecommendationsProducts, total: 2, skip: 0, limit: 2 });
  }),
  // MSW handlers for cart operations
  http.post('https://dummyjson.com/carts/add', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ id: 777, products: body.products, userId: body.userId, totalQuantity: body.products[0]?.quantity || 0 });
  }),
  http.put('https://dummyjson.com/carts/:cartId', async ({ request, params }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ id: Number(params.cartId), products: body.products, totalQuantity: body.products.reduce((sum: number, p: any) => sum + p.quantity, 0) });
  }),
   http.get('https://dummyjson.com/carts/:cartId', ({ params }) => {
    // This is used by CartProvider on init if cartId exists in localStorage
    const cartId = params.cartId;
    const storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
    const totalQuantity = storedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    return HttpResponse.json({ id: Number(cartId), products: storedItems, userId: 1, totalQuantity });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorageMock.clear();
});
afterAll(() => server.close());

// Helper to render with Router and CartProvider
const renderPageWithCart = (productId: string | number) => {
  const testRoutes = [
    {
      path: '/products/:productId',
      element: <ProductDetailPage />,
      loader: productDetailLoader,
    },
    { path: '/', element: <div>Home Page Mock</div> }
  ];
  const router = createMemoryRouter(testRoutes, {
    initialEntries: [`/products/${productId}`],
  });
  return render(
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  );
};


describe('ProductDetailPage Loader', () => {
  it('should fetch and return product details successfully', async () => {
    const params = { productId: String(mockProductDetail.id) };
    const response = await productDetailLoader({ params } as any);
    const data = await response.json();
    expect(data).toEqual(mockProductDetail);
  });

  it('should throw a Response with 404 status for a non-existent product', async () => {
    const params = { productId: '404' };
    try {
      await productDetailLoader({ params } as any);
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const responseError = error as Response; // Type assertion
      expect(responseError.status).toBe(404);
      const errorData = await responseError.json();
      expect(errorData.message).toBe('Product Not Found');
    }
  });
});

describe('ProductDetailPage Component Rendering', () => {
  it('renders all product details correctly when data is loaded', async () => {
    renderPageWithCart(mockProductDetail.id);

    // Wait for loader and component rendering
    await waitFor(() => {
      expect(screen.getByText(mockProductDetail.title)).toBeInTheDocument();
    });

    // Check basic details (sample)
    expect(screen.getByText(mockProductDetail.description)).toBeInTheDocument();
    const discountedPrice = (mockProductDetail.price * (1 - mockProductDetail.discountPercentage / 100)).toFixed(2);
    expect(screen.getByText(`$${discountedPrice}`)).toBeInTheDocument();
    expect(screen.getByText(`Brand: ${mockProductDetail.brand} | Category: ${mockProductDetail.category}`)).toBeInTheDocument();

    // Check tags
    expect(screen.getByText(`Tags:`)).toBeInTheDocument();
    mockProductDetail.tags.forEach(tag => {
      expect(screen.getByText(tag, { exact: false })).toBeInTheDocument();
    });

    // Check weight
    expect(screen.getByText(`Weight:`)).toBeInTheDocument();
    expect(screen.getByText(`${mockProductDetail.weight}g`)).toBeInTheDocument();

    // Check dimensions
    expect(screen.getByText(`Dimensions:`)).toBeInTheDocument();
    expect(screen.getByText(`Width: ${mockProductDetail.dimensions.width} cm`)).toBeInTheDocument();
    expect(screen.getByText(`Height: ${mockProductDetail.dimensions.height} cm`)).toBeInTheDocument();
    expect(screen.getByText(`Depth: ${mockProductDetail.dimensions.depth} cm`)).toBeInTheDocument();

    // Check policies
    expect(screen.getByText(`Shipping:`)).toBeInTheDocument();
    expect(screen.getByText(mockProductDetail.shippingInformation)).toBeInTheDocument();
    expect(screen.getByText(`Warranty:`)).toBeInTheDocument();
    expect(screen.getByText(mockProductDetail.warrantyInformation)).toBeInTheDocument();
    expect(screen.getByText(`Returns:`)).toBeInTheDocument();
    expect(screen.getByText(mockProductDetail.returnPolicy)).toBeInTheDocument();

    // Check images (thumbnail and additional images)
    const mainImage = screen.getByAltText(mockProductDetail.title) as HTMLImageElement;
    expect(mainImage.src).toBe(mockProductDetail.thumbnail);

    if (mockProductDetail.images.length > 1) {
        expect(screen.getByText('More Images:')).toBeInTheDocument();
        mockProductDetail.images.forEach((imgSrc, index) => {
            expect(screen.getByAltText(`${mockProductDetail.title} image ${index + 1}`)).toBeInTheDocument();
        });
    }

    // Check reviews
    expect(screen.getByText('Reviews:')).toBeInTheDocument();
    mockProductDetail.reviews.forEach(review => {
      expect(screen.getByText(review.reviewerName)).toBeInTheDocument();
      expect(screen.getByText(review.comment)).toBeInTheDocument();
    });

    // Check for RecommendationsWidget (mocked version)
    await waitFor(() => {
        expect(screen.getByTestId('recommendations-widget')).toBeInTheDocument();
    });
  });

  it('displays an error message if loader fails (e.g. 404)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderPageWithCart('404');
    await waitFor(() => {
      expect(screen.getByText('Product Not Found', { exact: false })).toBeInTheDocument();
    });
    consoleErrorSpy.mockRestore();
  });
});

describe('ProductDetailPage Cart Functionality', () => {
  beforeEach(() => {
    // Ensure localStorage is clean before each cart test
    localStorageMock.clear();
    // Reset fetch mock history if using vi.fn() alongside msw, or rely on msw resetHandlers
    // (global.fetch as ReturnType<typeof vi.fn>).mockClear(); // If global fetch mock is also used
  });

  it('shows "Add to Cart" button for an available product not in cart', async () => {
    renderPageWithCart(mockProductDetail.id);
    await waitFor(() => expect(screen.getByText(mockProductDetail.title)).toBeInTheDocument()); // Wait for page load
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('clicking "Add to Cart" adds the item and shows quantity controls', async () => {
    renderPageWithCart(mockProductDetail.id);
    await waitFor(() => expect(screen.getByText(mockProductDetail.title)).toBeInTheDocument());

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Quantity display
      expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
    });
    expect(localStorageMock.getItem('cartId')).toBe('777'); // From MSW handler
    const storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
    expect(storedItems.length).toBe(1);
    expect(storedItems[0].id).toBe(mockProductDetail.id);
  });

  it('displays quantity controls if item is already in cart', async () => {
    localStorageMock.setItem('cartId', '123');
    localStorageMock.setItem('cartItems', JSON.stringify([{ ...mockProductDetail, quantity: 3 }]));

    renderPageWithCart(mockProductDetail.id);
    await waitFor(() => expect(screen.getByText(mockProductDetail.title)).toBeInTheDocument());

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
    });
  });

  it('clicking "+" increases quantity, clicking "-" decreases or removes', async () => {
    localStorageMock.setItem('cartId', '123');
    localStorageMock.setItem('cartItems', JSON.stringify([{ ...mockProductDetail, quantity: 1 }]));

    renderPageWithCart(mockProductDetail.id);
    await waitFor(() => expect(screen.getByText(mockProductDetail.title)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument()); // Initial quantity

    const plusButton = screen.getByRole('button', { name: '+' });
    await act(async () => {
      fireEvent.click(plusButton);
    });
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument()); // Quantity becomes 2

    const minusButton = screen.getByRole('button', { name: '-' });
    await act(async () => {
      fireEvent.click(minusButton);
    });
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument()); // Quantity becomes 1

    await act(async () => {
      fireEvent.click(minusButton);
    });
    await waitFor(() => expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()); // Item removed
  });

  it('"+" button is disabled if quantity reaches stock', async () => {
    const lowStockProduct = { ...mockProductDetail, stock: 2 };
    localStorageMock.setItem('cartId', '123');
    localStorageMock.setItem('cartItems', JSON.stringify([{ ...lowStockProduct, quantity: 2 }]));

    // Mock the loader to return this specific lowStockProduct for this test
    server.use(
      http.get('https://dummyjson.com/products/:productId', ({ params }) => {
        if (params.productId === String(lowStockProduct.id)) {
          return HttpResponse.json(lowStockProduct);
        }
      })
    );

    renderPageWithCart(lowStockProduct.id);
    await waitFor(() => expect(screen.getByText(lowStockProduct.title)).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument()); // Current quantity is 2

    const plusButton = screen.getByRole('button', { name: '+' });
    expect(plusButton).toBeDisabled();
  });

  it('shows "Out of Stock" message and no cart controls if stock is 0', async () => {
    renderPageWithCart(999); // Product ID 999 is mocked to have stock: 0
    await waitFor(() => expect(screen.getByText("Out of Stock Product")).toBeInTheDocument());

    expect(screen.getByText(/currently out of stock/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '-' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
  });
});
