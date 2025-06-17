import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './header';
import '@testing-library/jest-dom'; // For additional matchers like .toBeInTheDocument

describe('Header Component', () => {
  beforeEach(() => {
    // Reset scroll position before each test
    window.scrollTo(0, 0);
    // Mocking classList add/remove for JSDOM if necessary, but direct class checks should work.
    // It's important that the component calls handleScroll on mount to set initial classes.
  });

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
      render(<Header />);
      const headerElement = screen.getByRole('banner');

      // Initial state check (redundant with above test, but good for clarity within this test's scope)
      expect(headerElement).toHaveClass('opacity-100', 'backdrop-blur-none');
      expect(headerElement).not.toHaveClass('opacity-80', 'backdrop-blur-md');

      // Simulate scroll down
      fireEvent.scroll(window, { target: { scrollY: 100 } });

      expect(headerElement).toHaveClass('opacity-80', 'backdrop-blur-md');
      expect(headerElement).not.toHaveClass('opacity-100', 'backdrop-blur-none');
    });

    test('reverts classes on scroll back to top', () => {
      render(<Header />);
      const headerElement = screen.getByRole('banner');

      // Scroll down first
      fireEvent.scroll(window, { target: { scrollY: 100 } });
      expect(headerElement).toHaveClass('opacity-80', 'backdrop-blur-md'); // Verify scrolled state
      expect(headerElement).not.toHaveClass('opacity-100', 'backdrop-blur-none');

      // Scroll back to top
      fireEvent.scroll(window, { target: { scrollY: 0 } });

      expect(headerElement).toHaveClass('opacity-100', 'backdrop-blur-none');
      expect(headerElement).not.toHaveClass('opacity-80', 'backdrop-blur-md');
    });
  });
});
