import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loader } from './home'; // Adjust path as necessary
import type { Product } from '../components/product-card'; // Adjust path as necessary

import * as ReactRouter from 'react-router';

// Reset modules to ensure fresh imports after mocks are defined.
vi.resetModules();

// Mock the 'react-router' module
vi.mock('react-router', async (importActual) => {
  const actual = await importActual<typeof ReactRouter>();
  // Define the mock function INSIDE the factory.
  // Make it return a Promise, just in case.
  const mockJsonFnInFactory = vi.fn(data => Promise.resolve(data));
  return {
    ...actual,
    json: mockJsonFnInFactory,
  };
});

let loaderFn: typeof loader;
// This will hold the 'json' function imported from 'react-router', which should be our mock.
let importedMockedJson: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  // After vi.mock, importing from 'react-router' should yield the mocked module.
  const rr = await import('react-router');
  // Assuming 'json' is the named export we mocked.
  // Need to cast because TypeScript doesn't know it's a Vitest mock function.
  importedMockedJson = rr.json as unknown as ReturnType<typeof vi.fn>;

  // Dynamically import the loader from home.tsx.
  // It should use the mocked 'react-router' because of vi.mock hoisting.
  const homeModule = await import('./home');
  loaderFn = homeModule.loader;
});

// Mock product data
const mockProducts: Product[] = [
  {
    id: 1,
    title: 'Product 1',
    description: 'Description 1',
    price: 10,
    discountPercentage: 0,
    rating: 4,
    stock: 100,
    brand: 'Brand A',
    category: 'Category X',
    thumbnail: 'thumb1.jpg',
    images: ['img1.jpg'],
  },
  {
    id: 2,
    title: 'Product 2',
    description: 'Description 2',
    price: 20,
    discountPercentage: 5,
    rating: 5,
    stock: 50,
    brand: 'Brand B',
    category: 'Category Y',
    thumbnail: 'thumb2.jpg',
    images: ['img2.jpg'],
  },
];

describe('Home Route Loader', () => {
  beforeEach(() => {
    // Reset all mocks before each test.
    vi.resetAllMocks();
    // Clear the history of the imported mock function.
    if (importedMockedJson && typeof importedMockedJson.mockClear === 'function') {
      importedMockedJson.mockClear();
    }
  });

  it('fetches products successfully', async () => {
    // Mock successful fetch response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        // The loader does `const data = await response.json();`
        // so this inner `json()` is from native fetch Response, not react-router.
        json: () => Promise.resolve({ products: mockProducts }),
      } as Response)
    );

    // The loader will call our mocked `json` from react-router, which now returns plain data.
    const result = await loaderFn();

    expect(importedMockedJson).toHaveBeenCalledTimes(1);
    // The loader calls `json({ products: data.products })`.
    // `data.products` is `mockProducts` from the fetch mock.
    expect(importedMockedJson).toHaveBeenCalledWith({ products: mockProducts });

    // The result from the loader should now be the plain data returned by our mock.
    expect(result).toEqual({ products: mockProducts });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://dummyjson.com/products');
    // No need to check data from response.json() as result is now the data itself.
  });

  it('handles API error when fetch itself fails (network error)', async () => {
    // Mock fetch to reject (simulating a network error)
    global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

    // Expect the loader to propagate or handle the error
    // If the loader doesn't catch this, Vitest will catch the unhandled promise rejection.
    await expect(loaderFn()).rejects.toThrow("Network error"); // Use loaderFn
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://dummyjson.com/products');
  });

  it('handles API error with non-ok response from fetch', async () => {
    // Mock fetch to return a non-ok response (e.g., 500 server error)
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server Error Details' }),
      } as Response)
    );

    // The loader now throws a Response if fetch fails or if response.ok is false.
    try {
      await loaderFn();
      // Should not reach here if an error is expected
      expect.fail("Loader did not throw when it should have.");
    } catch (error) {
      expect(importedMockedJson).not.toHaveBeenCalled(); // The imported mock should not be called if loader throws before
      expect(error).toBeInstanceOf(Response);
      const errorResponse = error as Response;
      expect(errorResponse.status).toBe(500);
      const errorData = await errorResponse.json();
      expect(errorData.message).toBe("Failed to fetch products");
    }

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://dummyjson.com/products');
  });

  afterEach(() => {
    // Restore original fetch implementation
    vi.restoreAllMocks();
  });
});
