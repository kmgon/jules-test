import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

import ProductDetailPage, { loader as productDetailLoader } from './product-detail';
import type { ProductDetail } from '../components/product-card';
import { mockProductDetail, mockRecommendationsProducts } from './_mocks/product-detail-mock';

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
    if (productId === '404') {
      return new HttpResponse(JSON.stringify({ message: 'Product not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new HttpResponse(JSON.stringify({ message: 'Generic error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }),
  // Mock for RecommendationsWidget's potential fetch, though the widget itself is mocked here.
  // If it weren't mocked, this would be necessary.
  http.get('https://dummyjson.com/products', () => {
    return HttpResponse.json({ products: mockRecommendationsProducts, total: 2, skip: 0, limit: 2 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProductDetailPage Loader', () => {
  it('should fetch and return product details successfully', async () => {
    const params = { productId: String(mockProductDetail.id) };
    const response = await productDetailLoader({ params } as any); // Cast as any to satisfy LoaderFunctionArgs typing

    // Vitest/React Router v6 loaders return Response objects
    const data = await response.json();
    expect(data).toEqual(mockProductDetail);
  });

  it('should throw a Response with 404 status for a non-existent product', async () => {
    const params = { productId: '404' };
    try {
      await productDetailLoader({ params } as any);
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      const response = error as Response;
      expect(response.status).toBe(404);
      const errorData = await response.json();
      expect(errorData.message).toBe('Product Not Found'); // Loader throws new Response("Product Not Found",...)
    }
  });
});

describe('ProductDetailPage Component', () => {
  const renderPage = (productId: string | number) => {
    const testRoutes = [
      {
        path: '/products/:productId',
        element: <ProductDetailPage />,
        loader: productDetailLoader, // Use the actual loader, MSW will mock the fetch
      },
      // Add a root path or other paths if Link components navigate elsewhere unexpectedly
      {
        path: '/',
        element: <div>Home Page Mock</div>
      }
    ];
    const router = createMemoryRouter(testRoutes, {
      initialEntries: [`/products/${productId}`],
    });
    render(<RouterProvider router={router} />);
  };

  it('renders all product details correctly when data is loaded', async () => {
    renderPage(mockProductDetail.id);

    // Wait for loader and component rendering
    await waitFor(() => {
      expect(screen.getByText(mockProductDetail.title)).toBeInTheDocument();
    });

    // Check basic details
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
        expect(screen.getByText('Recommended Products')).toBeInTheDocument(); // Heading inside mocked widget
        expect(screen.getByText(`Mocked Widget: Current ID ${mockProductDetail.id}, Category: ${mockProductDetail.category}`)).toBeInTheDocument();
    });
  });

  it('displays an error message if loader fails (e.g. 404)', async () => {
    // Suppress console.error output from React Router for the expected error boundary
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderPage('404');

    await waitFor(() => {
      // React Router's default error element for a thrown Response will show status text
      // The loader throws: new Response("Product Not Found", { status: 404 });
      // The errorElement in a route definition would customize this.
      // Here, we expect React Router's internals to render something based on the Response.
      expect(screen.getByText('Product Not Found', { exact: false })).toBeInTheDocument();
    });
    consoleErrorSpy.mockRestore();
  });
});
