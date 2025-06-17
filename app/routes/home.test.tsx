import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import Home, { loader, type HomeLoaderData } from './home';
import type { Product } from '../components/product-card';
import { MemoryRouter, Routes, Route, useLoaderData } from 'react-router-dom'; // Using react-router-dom
import '@testing-library/jest-dom';

// --- Mock IntersectionObserver ---
let mockIntersectionObserverCallback: IntersectionObserverCallback | null = null;
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

global.IntersectionObserver = vi.fn((callback) => {
  mockIntersectionObserverCallback = callback;
  return {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
    root: null,
    rootMargin: '',
    thresholds: [],
  };
}) as unknown as typeof IntersectionObserver;

function triggerIntersectionObserver(isIntersecting: boolean) {
  // `act` ensures that state updates are processed
  act(() => {
    if (mockIntersectionObserverCallback) {
      // Simulate a target element for the entry
      const mockTarget = document.createElement('div');
      mockIntersectionObserverCallback([{ isIntersecting, target: mockTarget } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  });
}
// --- End Mock IntersectionObserver ---

// Mock react-router's useLoaderData
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLoaderData: vi.fn(),
    // json is not typically exported from react-router-dom directly for client-side loaders,
    // but if the loader was using it, we'd mock it here. Loaders in Remix/RR use `json` from `@remix-run/node` or similar.
    // For this test, loader is tested separately, and for component, we mock useLoaderData.
  };
});


// Mock global fetch
global.fetch = vi.fn();

const mockProduct = (id: number, title: string): Product => ({
  id,
  title,
  description: `Description for ${title}`,
  price: (id * 10) % 100 + 0.99, // Example price
  discountPercentage: id % 2 === 0 ? 5 : 10, // Example discount
  rating: (id % 5) + 1, // Example rating 1-5
  stock: id * 5, // Example stock
  brand: `Brand ${String.fromCharCode(65 + (id % 26))}`, // Example Brand A, B, ...
  category: `Category ${id % 3 === 0 ? 'X' : id % 3 === 1 ? 'Y' : 'Z'}`, // Example Category X, Y, Z
  thumbnail: `https://cdn.dummyjson.com/products/images/smartphones/${id}/thumbnail.png`, // Placeholder
  images: [`https://cdn.dummyjson.com/products/images/smartphones/${id}/1.png`], // Placeholder
});

const initialProductsBatch = Array.from({ length: 20 }, (_, i) => mockProduct(i + 1, `Initial Product ${i + 1}`));
const nextProductsBatch = Array.from({ length: 10 }, (_, i) => mockProduct(i + 21, `Next Product ${i + 21}`));
const finalProductsBatch = Array.from({ length: 5 }, (_, i) => mockProduct(i + 31, `Final Product ${i + 31}`));


// --- Tests for the loader function (adapted from existing, if any) ---
describe('Home Route Loader Function', () => {
  beforeEach(() => {
    (fetch as ReturnType<typeof vi.fn>).mockClear();
     // If Remix's json or defer were used by loader, they'd need mocking and clearing.
     // For now, assuming loader returns data directly or uses native Response.
  });

  it('fetches initial products successfully for loader', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: initialProductsBatch, total: 50, skip: 0, limit: 20 }),
    } as Response);

    // Loader request now uses limit=20&skip=0 from home.tsx
    const request = new Request("http://localhost/?limit=20&skip=0");
    const response = await loader({ request, params: {}, context: {} }); // Pass dummy request, params, context

    // The loader in home.tsx returns the direct JSON data, not a Response object
    // if it's a client-side loader or a Remix loader that directly returns data.
    // Based on home.tsx, it returns { products, total, initialLimit, initialSkip }
    expect(fetch).toHaveBeenCalledWith('https://dummyjson.com/products?limit=20&skip=0');
    expect(response.products.length).toBe(20);
    expect(response.total).toBe(50);
    expect(response.initialLimit).toBe(20);
    expect(response.initialSkip).toBe(0);
    expect(response.products[0].title).toBe('Initial Product 1');
  });

  it('loader handles API error when fetch is not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Server Error' }),
    } as Response);

    const request = new Request("http://localhost/?limit=20&skip=0");
    await expect(loader({ request, params: {}, context: {} })).rejects.toThrowError("Failed to fetch products");
  });
});


// --- Tests for the Home component and infinite scroll ---
describe('Home Component - Infinite Scroll', () => {
  beforeEach(() => {
    (fetch as ReturnType<typeof vi.fn>).mockClear();
    mockObserve.mockClear();
    mockUnobserve.mockClear();
    mockDisconnect.mockClear();
    mockIntersectionObserverCallback = null;
    (useLoaderData as ReturnType<typeof vi.fn>).mockClear();
  });

  const renderHomeWithData = (loaderData: HomeLoaderData) => {
    (useLoaderData as ReturnType<typeof vi.fn>).mockReturnValue(loaderData);
    // Using MemoryRouter to simulate routing context
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </MemoryRouter>
    );
  };

  test('loads and displays initial products', async () => {
    const initialLoaderData: HomeLoaderData = {
      products: initialProductsBatch,
      total: 50, // More than initially loaded
      initialLimit: 20,
      initialSkip: 0,
    };
    renderHomeWithData(initialLoaderData);

    expect(screen.getByText('Initial Product 1')).toBeInTheDocument();
    expect(screen.getByText('Initial Product 20')).toBeInTheDocument();
    expect(screen.queryByText('Next Product 1')).not.toBeInTheDocument();
    expect(mockObserve).toHaveBeenCalled(); // IntersectionObserver should observe the sentinel
  });

  test('loads more products on scroll, displays loading indicator, and finally "end of results"', async () => {
    const initialLoaderData: HomeLoaderData = {
      products: initialProductsBatch, // 20 products
      total: 35, // total: 20 initial + 10 next + 5 final
      initialLimit: 20,
      initialSkip: 0,
    };
    renderHomeWithData(initialLoaderData);

    expect(screen.getByText('Initial Product 1')).toBeInTheDocument();

    // --- First scroll: Load nextProductsBatch (10 products) ---
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: nextProductsBatch, total: 35, skip: 20, limit: 20 }),
    } as Response);

    triggerIntersectionObserver(true); // Simulate sentinel becoming visible

    await waitFor(() => {
      expect(screen.getByText('Loading more products...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Next Product 1')).toBeInTheDocument(); // First of next batch
      expect(screen.getByText('Next Product 10')).toBeInTheDocument(); // Last of next batch
    }, { timeout: 3000 }); // Increased timeout for state updates

    expect(screen.queryByText('Loading more products...')).not.toBeInTheDocument();
    // Now 20 + 10 = 30 products loaded. Total is 35.

    // --- Second scroll: Load finalProductsBatch (5 products) ---
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: finalProductsBatch, total: 35, skip: 30, limit: 20 }),
    } as Response);

    triggerIntersectionObserver(true);

    await waitFor(() => {
      expect(screen.getByText('Loading more products...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Final Product 1')).toBeInTheDocument();
      expect(screen.getByText('Final Product 5')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.queryByText('Loading more products...')).not.toBeInTheDocument();
    // Now 30 + 5 = 35 products loaded. Total is 35. hasMore should be false.

    // --- Third scroll: No more products ---
    // fetch should not be called if hasMore is false, but if it were, mock it:
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [], total: 35, skip: 35, limit: 20 }),
    } as Response);

    triggerIntersectionObserver(true); // Sentinel might still be visible

    await waitFor(() => {
      expect(screen.getByText("You've reached the end!")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.queryByText('Loading more products...')).not.toBeInTheDocument();
    // Verify fetch was not called for the third scroll because hasMore should be false
    // The fetch mock was called twice (for nextProductsBatch and finalProductsBatch)
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('shows "end of results" if initial load contains all products', async () => {
    const allProducts = Array.from({ length: 15 }, (_, i) => mockProduct(i + 1, `Product ${i + 1}`));
    const loaderData: HomeLoaderData = {
      products: allProducts,
      total: 15, // Total is same as products loaded
      initialLimit: 20,
      initialSkip: 0,
    };
    renderHomeWithData(loaderData);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 15')).toBeInTheDocument();

    // The "end of results" message should appear because hasMore is false from the start.
    // The IntersectionObserver's effect runs on mount, and if hasMore is false, it won't fetch.
    // The message relies on !hasMore && !loadingMore && products.length > 0.
    await waitFor(() => {
       expect(screen.getByText("You've reached the end!")).toBeInTheDocument();
    });
    expect(mockObserve).toHaveBeenCalled(); // Observer still observes initially
  });

   test('does not show "end of results" if initial load is empty', async () => {
    const loaderData: HomeLoaderData = {
      products: [],
      total: 0,
      initialLimit: 20,
      initialSkip: 0,
    };
    renderHomeWithData(loaderData);

    expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
    // The condition for "end of results" includes products.length > 0 and initialData.products.length > 0
    // In home.tsx, it's `!loadingMore && !hasMore && products.length > 0 && initialData.products.length > 0`
    // Since initialData.products.length is 0 (via our mock setup of useLoaderData), this shouldn't render.
    // And products.length is also 0.
    expect(screen.queryByText("You've reached the end!")).not.toBeInTheDocument();
  });

});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
