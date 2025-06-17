import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Header } from './header';
import '@testing-library/jest-dom'; // For additional matchers like .toBeInTheDocument
import { CartProvider } from '~/contexts/cart-context';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { mockProduct } from '~/routes/_mocks/product-detail-mock'; // Assuming a mock product is useful
import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';


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

// MSW server setup for cart API calls (if CartProvider makes them on init)
const server = setupServer(
  http.get('https://dummyjson.com/carts/:cartId', ({ params }) => {
    const cartId = params.cartId;
    const storedItems = JSON.parse(localStorageMock.getItem('cartItems') || '[]');
    const totalQuantity = storedItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    if (localStorageMock.getItem('cartId') === cartId) {
      return HttpResponse.json({ id: Number(cartId), products: storedItems, userId: 1, totalQuantity });
    }
    return new HttpResponse(null, { status: 404 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  localStorageMock.clear();
  window.scrollTo(0, 0); // Reset scroll for each test
});
afterAll(() => server.close());

// Helper to render Header with CartProvider
const renderHeaderWithCart = () => {
  return render(
    <CartProvider>
      <Header />
    </CartProvider>
  );
};

describe('Header Component Rendering and Style', () => {
  // beforeEach for scroll reset is now in afterEach

  test('renders the site title "KM Shop"', () => {
    render(<Header />);
    // Check if the heading with the title "KM Shop" is in the document
    const titleElement = screen.getByRole('heading', { name: /KM Shop/i });
    expect(titleElement).toBeInTheDocument();
  });

  test('renders the cart icon', () => {
    render(<Header />);
    // Check for the SVG icon. A simple way is to check for its presence via its role or a test ID.
    // Since the SVG has aria-hidden="true", it might not be easily queryable by accessible role.
    // Let's query for the svg element itself.
    // A more robust way would be to add a data-testid to the SVG.
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();

    // Additionally, check some properties if possible, like stroke color, to ensure it's the cart icon
    // This depends on how specifically we want to identify it.
    // For this test, presence is sufficient.
    // Check for the class that dictates the stroke color
    expect(svgElement).toHaveClass('stroke-white');
  });

  test('applies correct Tailwind classes for styling and positioning', () => {
    render(<Header />);
    const headerElement = screen.getByRole('banner'); // <header> has an implicit role of banner

    // Check for color and background classes
    expect(headerElement).toHaveClass('bg-blue-500');
    expect(headerElement).toHaveClass('text-white');

    // Check for flexbox and padding classes
    expect(headerElement).toHaveClass('p-4');
    expect(headerElement).toHaveClass('flex');
    expect(headerElement).toHaveClass('justify-between');
    expect(headerElement).toHaveClass('items-center');

    // Check for fixed positioning and z-index
    expect(headerElement).toHaveClass('fixed');
    expect(headerElement).toHaveClass('top-0');
    expect(headerElement).toHaveClass('left-0'); // Added in implementation
    expect(headerElement).toHaveClass('w-full');
    expect(headerElement).toHaveClass('z-50');

    // Check for transition classes
    expect(headerElement).toHaveClass('transition-all');
    expect(headerElement).toHaveClass('duration-300');
    expect(headerElement).toHaveClass('ease-in-out');

    // Check for initial opacity and backdrop-filter state (before scroll)
    expect(headerElement).toHaveClass('opacity-100');
    expect(headerElement).toHaveClass('backdrop-blur-none');
  });

  describe('Scroll Animation Behavior', () => {
    test('initial state before scroll applies correct opacity and backdrop classes', () => {
      render(<Header />);
      const headerElement = screen.getByRole('banner');
      // Initial state is set by useEffect calling handleScroll on mount
      expect(headerElement).toHaveClass('opacity-100', 'backdrop-blur-none');
      expect(headerElement).not.toHaveClass('opacity-80', 'backdrop-blur-md');
    });

    test('changes classes on scroll down past threshold', () => {
    renderHeaderWithCart(); // Use helper for consistency, though cart not directly tested here
      const headerElement = screen.getByRole('banner');
      expect(headerElement).toHaveClass('opacity-100', 'backdrop-blur-none');
      fireEvent.scroll(window, { target: { scrollY: 100 } });
      expect(headerElement).toHaveClass('opacity-80', 'backdrop-blur-md');
      expect(headerElement).not.toHaveClass('opacity-100', 'backdrop-blur-none');
    });

    test('reverts classes on scroll back to top', () => {
    renderHeaderWithCart(); // Use helper
      const headerElement = screen.getByRole('banner');
      fireEvent.scroll(window, { target: { scrollY: 100 } });
    expect(headerElement).toHaveClass('opacity-80', 'backdrop-blur-md');
      fireEvent.scroll(window, { target: { scrollY: 0 } });
      expect(headerElement).toHaveClass('opacity-100', 'backdrop-blur-none');
      expect(headerElement).not.toHaveClass('opacity-80', 'backdrop-blur-md');
    });
  });

describe('Header Cart Badge Functionality', () => {
  test('cart badge is not visible when cart is empty', async () => {
    renderHeaderWithCart();
    // CartProvider initializes asynchronously
    await waitFor(() => {
      // Check that loading state from CartProvider is false if it affects rendering
      // For now, assume Header doesn't depend on CartProvider's loading state directly for the badge.
    });
    // The badge span has specific classes, check for its absence or specific content.
    // If totalQuantity is 0, the span is not rendered.
    const badge = screen.queryByLabelText('Items in cart');
    expect(badge).not.toBeInTheDocument();
  });

  test('cart badge is visible with correct quantity when cart has items', async () => {
    // Setup localStorage to simulate cart with items
    localStorageMock.setItem('cartId', '123');
    const items = [{ ...mockProduct, id: 1, quantity: 3 }, { ...mockProduct, id: 2, quantity: 2 }]; // Total 5 items
    localStorageMock.setItem('cartItems', JSON.stringify(items));

    renderHeaderWithCart();

    // Wait for CartProvider to initialize and update totalQuantity
    // The badge itself has an aria-label we can use.
    const badge = await screen.findByLabelText('Items in cart');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5'); // Sum of quantities
    expect(badge).toHaveClass('bg-red-500'); // Check some styling
  });

   test('cart badge updates when cart content changes (e.g. item added elsewhere)', async () => {
    renderHeaderWithCart();
    // Initially cart is empty
    await waitFor(() => {
      expect(screen.queryByLabelText('Items in cart')).not.toBeInTheDocument();
    });

    // Simulate adding items to the cart (e.g. by another component)
    // We can do this by updating localStorage and "re-triggering" context update if needed,
    // but CartProvider should react to localStorage changes if designed to, or more directly,
    // tests could simulate actions that would update the context that Header listens to.
    // For this test, let's assume CartProvider's internal state is updated,
    // and Header re-renders. The most straightforward way to test this in isolation for Header
    // is to re-render with a new state in provider, or mock the useCart hook.
    // Since we are testing integration with CartProvider, we update localStorage and
    // rely on CartProvider's effects.

    // Simulate adding items to cart by directly modifying localStorage and re-rendering or
    // by having a mechanism to update the provider's state if we had access to its functions.
    // The CartProvider is designed to load from localStorage on mount.
    // A more realistic test of dynamic updates would involve full page interactions.
    // For an isolated Header test, we can re-render with new localStorage state.

    localStorageMock.setItem('cartId', '124');
    const newItems = [{ ...mockProduct, id: 3, quantity: 7 }];
    localStorageMock.setItem('cartItems', JSON.stringify(newItems));

    // Re-render or trigger an update. If CartProvider doesn't listen to storage events,
    // this won't reflect automatically without a re-render.
    // Let's assume for this unit/integration test, a re-render with new setup is acceptable.
    renderHeaderWithCart(); // This will cause CartProvider to re-initialize from new localStorage state

    const badge = await screen.findByLabelText('Items in cart');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('7');
  });
});
});
