import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

import RecommendationsWidget from './recommendations-widget';
import type { Product } from './product-card';
import { mockProductList } from './_mocks/recommendations-mock';

const server = setupServer(); // Handlers will be added per test or describe block

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const renderWidget = (props = {}) => {
  return render(
    <MemoryRouter>
      <RecommendationsWidget {...props} />
    </MemoryRouter>
  );
};

describe('RecommendationsWidget', () => {
  describe('Successful Data Fetching and Display', () => {
    beforeEach(() => {
      server.use(
        http.get('https://dummyjson.com/products', () => {
          return HttpResponse.json({ products: mockProductList, total: mockProductList.length, skip: 0, limit: 30 });
        })
      );
    });

    it('displays up to 4 recommended products', async () => {
      renderWidget();
      expect(await screen.findByText('Recommended Products')).toBeInTheDocument();

      const productLinks = await screen.findAllByRole('link');
      expect(productLinks.length).toBe(4); // Component hardcodes slice(0, 4)

      // Check details of the first product shown (which should be mockProductList[0])
      const firstProduct = mockProductList[0];
      expect(screen.getByText(firstProduct.title)).toBeInTheDocument();
      expect(screen.getByAltText(firstProduct.title)).toHaveAttribute('src', firstProduct.thumbnail);
      expect(screen.getByText(`$${firstProduct.price.toFixed(2)}`)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: new RegExp(firstProduct.title, 'i') })).toHaveAttribute('href', `/products/${firstProduct.id}`);
    });

    it('filters out currentProductId', async () => {
      const currentProductIdToFilter = mockProductList[1].id; // Filter out the second product
      renderWidget({ currentProductId: currentProductIdToFilter });

      expect(await screen.findByText('Recommended Products')).toBeInTheDocument();

      const productLinks = await screen.findAllByRole('link');
      expect(productLinks.length).toBe(4); // Still shows 4 products

      // Ensure the filtered product is not present
      expect(screen.queryByText(mockProductList[1].title)).not.toBeInTheDocument();

      // Ensure other products are present (e.g., the first product which wasn't filtered)
      expect(screen.getByText(mockProductList[0].title)).toBeInTheDocument();
    });
     it('displays fewer than 4 products if API returns fewer', async () => {
      const fewProducts = mockProductList.slice(0, 2);
      server.use(
        http.get('https://dummyjson.com/products', () => {
          return HttpResponse.json({ products: fewProducts, total: fewProducts.length, skip: 0, limit: 30 });
        })
      );
      renderWidget();
      expect(await screen.findByText('Recommended Products')).toBeInTheDocument();
      const productLinks = await screen.findAllByRole('link');
      expect(productLinks.length).toBe(2);
    });
  });

  describe('Loading State', () => {
    it('shows a loading message initially', async () => {
      server.use(
        http.get('https://dummyjson.com/products', async () => {
          await new Promise(resolve => setTimeout(resolve, 100)); // Introduce delay
          return HttpResponse.json({ products: mockProductList, total: mockProductList.length, skip: 0, limit: 30 });
        })
      );
      renderWidget();
      // Check for loading message immediately
      expect(screen.getByText('Loading recommendations...')).toBeInTheDocument();
      // And then wait for it to disappear / content to load
      await waitFor(() => {
        expect(screen.queryByText('Loading recommendations...')).not.toBeInTheDocument();
        expect(screen.getByText(mockProductList[0].title)).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('shows an error message if data fetching fails', async () => {
      server.use(
        http.get('https://dummyjson.com/products', () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        })
      );
      renderWidget();
      await waitFor(() => {
        expect(screen.getByText(/Error loading recommendations:/i)).toBeInTheDocument();
        expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
      });
    });
  });

  describe('No Recommendations Available', () => {
    it('shows a message if no products are returned', async () => {
      server.use(
        http.get('https://dummyjson.com/products', () => {
          return HttpResponse.json({ products: [], total: 0, skip: 0, limit: 30 });
        })
      );
      renderWidget();
      await waitFor(() => {
        expect(screen.getByText('No recommendations available at the moment.')).toBeInTheDocument();
      });
    });

    it('shows "No recommendations" if all products are filtered out (e.g., currentProductId matches all)', async () => {
      // This case is a bit artificial as currentProductId should be one,
      // but if the slice(0,4) results in an empty array after filtering, it should show "No recommendations".
      // Let's test by returning only one product that matches currentProductId.
      const singleProduct = mockProductList[0];
      server.use(
        http.get('https://dummyjson.com/products', () => {
          return HttpResponse.json({ products: [singleProduct], total: 1, skip: 0, limit: 30 });
        })
      );
      renderWidget({ currentProductId: singleProduct.id });
       await waitFor(() => {
        expect(screen.getByText('No recommendations available at the moment.')).toBeInTheDocument();
      });
    });
  });
});
