import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom'; // Import MemoryRouter
import { ProductCard, type Product } from './product-card';

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

describe('ProductCard', () => {
  it('renders product details correctly within a link', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );

    // Check that the content is present
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
    const { rerender, unmount } = render(
      <MemoryRouter>
        <ProductCard product={{ ...mockProduct, rating: 3.5 }} />
      </MemoryRouter>
    );

    // Test case 1: Rating 3.5 (rounds to 4 stars)
    let stars = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && (content === '★' || content === '☆');
    });
    expect(stars.filter(star => star.textContent === '★').length).toBe(4);
    expect(stars.filter(star => star.textContent === '☆').length).toBe(1);

    // Test case 2: Rating 5
    rerender(
      <MemoryRouter>
        <ProductCard product={{ ...mockProduct, rating: 5 }} />
      </MemoryRouter>
    );
    stars = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && (content === '★' || content === '☆');
    });
    expect(stars.filter(star => star.textContent === '★').length).toBe(5);
    expect(stars.filter(star => star.textContent === '☆').length).toBe(0);

    // Test case 3: Rating 0
    rerender(
      <MemoryRouter>
        <ProductCard product={{ ...mockProduct, rating: 0 }} />
      </MemoryRouter>
    );
    stars = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && (content === '★' || content === '☆');
    });
    expect(stars.filter(star => star.textContent === '★').length).toBe(0);
    expect(stars.filter(star => star.textContent === '☆').length).toBe(5);

    unmount();
  });
});
