import { render, screen } from '@testing-library/react';
import { Header } from './header';
import { colors } from '../theme'; // Import colors to verify style if needed, though not strictly for this test
import '@testing-library/jest-dom'; // For additional matchers like .toBeInTheDocument

describe('Header Component', () => {
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
    expect(svgElement).toHaveAttribute('stroke', colors.primary.contrastText);
  });

  test('applies correct background and text colors', () => {
    render(<Header />);
    const headerElement = screen.getByRole('banner'); // <header> has an implicit role of banner
    expect(headerElement).toHaveStyle({
      backgroundColor: colors.primary.main,
      color: colors.primary.contrastText,
    });
  });
});
