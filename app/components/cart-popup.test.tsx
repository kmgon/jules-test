import React, { type ReactNode } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CartPopup from './cart-popup'; // Adjust path as necessary
import { CartContext, type CartContextType, type CartState, type CartItem } from '../contexts/cart-context'; // Assuming path

// Mock console.log and window.alert
const consoleLogSpy = vi.spyOn(console, 'log');
const windowAlertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {}); // Mock alert to avoid actual popups

// Mock CartItem data adhering to the new structure
const mockCartItem1: CartItem = {
  id: 1,
  title: 'iPhone 9',
  price: 549, // unit price
  quantity: 1,
  stock: 5,
  thumbnail: 'iphone.jpg',
  total: 549, // price * quantity
  discountPercentage: 12.96,
  discountedPrice: 478, // discounted total for line item
};

const mockCartItem2: CartItem = {
  id: 2,
  title: 'Samsung Universe 9',
  price: 1249, // unit price
  quantity: 2,
  stock: 3,
  thumbnail: 'samsung.jpg',
  total: 2498, // price * quantity
  discountPercentage: 15.46,
  discountedPrice: 2112, // discounted total for line item
};

interface MockCartProviderProps {
  children: ReactNode;
  mockValue: Partial<CartContextType>;
}

// Helper to create a mock CartProvider
const MockCartProvider: React.FC<MockCartProviderProps> = ({ children, mockValue }) => {
  const defaultCartState: CartState = {
    items: [],
    totalQuantity: 0,
    cartId: null,
  };

  const defaultValue: CartContextType = {
    cartState: defaultCartState,
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    loading: false,
    ...mockValue, // Override defaults with provided mockValue
  };

  return <CartContext.Provider value={defaultValue}>{children}</CartContext.Provider>;
};


describe('CartPopup Component (Contextual)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithMockContext = (mockContextValue: Partial<CartContextType>, popupProps = { isOpen: true, onClose: vi.fn() }) => {
    return render(
      <MockCartProvider mockValue={mockContextValue}>
        <CartPopup {...popupProps} />
      </MockCartProvider>
    );
  };

  it('is not visible when isOpen is false', () => {
    // Use default empty cart state for this test, isOpen is the key
    renderWithMockContext({ cartState: { items: [], totalQuantity: 0, cartId: null }, loading: false }, { isOpen: false, onClose: vi.fn() });
    // The main div has opacity-0 and pointer-events-none when not open.
    // We target the outer div. Let's add a test-id to CartPopup's outer div.
    // For now, let's check for a high-level element.
    // If CartPopup renders null or nothing when !isOpen, this test needs adjustment.
    // Based on current CartPopup, it renders a div with classes.
    const popupContainer = screen.getByTestId('cart-popup-container'); // Assuming you add data-testid="cart-popup-container" to the outer div of CartPopup
    expect(popupContainer).toHaveClass('opacity-0', 'pointer-events-none');
  });

  it('becomes visible when isOpen is true', () => {
    renderWithMockContext({ cartState: { items: [], totalQuantity: 0, cartId: null }, loading: false });
    const popupContainer = screen.getByTestId('cart-popup-container');
    expect(popupContainer).not.toHaveClass('pointer-events-none');
    expect(popupContainer).toHaveClass('opacity-100');
  });

  it('displays "Loading cart..." when cartLoading from context is true', () => {
    renderWithMockContext({ loading: true });
    expect(screen.getByText('Loading cart...')).toBeInTheDocument();
  });

  it('displays "Your cart is currently empty." when cart is empty and not loading', () => {
    renderWithMockContext({ cartState: { items: [], totalQuantity: 0, cartId: 1 }, loading: false });
    expect(screen.getByText('Your cart is currently empty.')).toBeInTheDocument();
  });

  it('displays cart items and calculated totals correctly', () => {
    const mockItems = [mockCartItem1, mockCartItem2];
    const mockTotalQuantity = mockItems.reduce((sum, item) => sum + item.quantity, 0);
    renderWithMockContext({
      cartState: { items: mockItems, totalQuantity: mockTotalQuantity, cartId: 1 },
      loading: false,
    });

    // Check item 1
    expect(screen.getByText(`${mockCartItem1.title} (x${mockCartItem1.quantity}) - $${mockCartItem1.discountedPrice.toFixed(2)}`)).toBeInTheDocument();
    // Check item 2
    expect(screen.getByText(`${mockCartItem2.title} (x${mockCartItem2.quantity}) - $${mockCartItem2.discountedPrice.toFixed(2)}`)).toBeInTheDocument();

    // Check calculated totals (as per CartPopup's internal calculations)
    const expectedTotalProductsCount = mockItems.length;
    const expectedCurrentTotalAmount = mockItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    // In CartPopup, currentDiscountedTotalAmount uses item.discountedPrice (which is line total)
    const expectedCurrentDiscountedTotalAmount = mockItems.reduce((acc, item) => acc + item.discountedPrice, 0);


    expect(screen.getByText('Total Product Types:')).toBeInTheDocument();
    expect(screen.getByText(String(expectedTotalProductsCount))).toBeInTheDocument();

    expect(screen.getByText('Total Quantity of Items:')).toBeInTheDocument();
    expect(screen.getByText(String(mockTotalQuantity))).toBeInTheDocument(); // This comes directly from cartState.totalQuantity

    expect(screen.getByText('Total Amount:')).toBeInTheDocument();
    expect(screen.getByText(`$${expectedCurrentTotalAmount.toFixed(2)}`)).toBeInTheDocument();

    expect(screen.getByText('Discounted Total:')).toBeInTheDocument();
    expect(screen.getByText(`$${expectedCurrentDiscountedTotalAmount.toFixed(2)}`)).toBeInTheDocument();
  });


  describe('Buy Button Interactions (Contextual)', () => {
    it('Buy button is disabled when cartLoading is true', () => {
      renderWithMockContext({ loading: true, cartState: { items: [mockCartItem1], totalQuantity: 1, cartId: 1 } });
      const buyButton = screen.getByRole('button', { name: /Buy/i });
      expect(buyButton).toBeDisabled();
    });

    it('Buy button is disabled when cart is empty and not loading', () => {
      renderWithMockContext({ loading: false, cartState: { items: [], totalQuantity: 0, cartId: 1 } });
      const buyButton = screen.getByRole('button', { name: /Buy/i });
      expect(buyButton).toBeDisabled();
    });

    it('Buy button is enabled when cart has items and not loading', () => {
      renderWithMockContext({ loading: false, cartState: { items: [mockCartItem1], totalQuantity: 1, cartId: 1 } });
      const buyButton = screen.getByRole('button', { name: /Buy/i });
      expect(buyButton).not.toBeDisabled();
    });

    it('logs correct data and alerts on "Buy" button click', () => {
      const mockItems = [mockCartItem1];
      const mockTotalQuantity = mockCartItem1.quantity;
      const mockCartId = 123;

      renderWithMockContext({
        cartState: { items: mockItems, totalQuantity: mockTotalQuantity, cartId: mockCartId },
        loading: false,
      });

      const buyButton = screen.getByRole('button', { name: /Buy/i });
      fireEvent.click(buyButton);

      const totalProductsCount = mockItems.length;
      // currentDiscountedTotalAmount in CartPopup uses item.discountedPrice (which is line total)
      const currentDiscountedTotalAmount = mockItems.reduce((acc, item) => acc + item.discountedPrice, 0);

      expect(consoleLogSpy).toHaveBeenCalledWith("Buy button clicked. Cart state:", {
        items: mockItems,
        totalQuantity: mockTotalQuantity,
        cartId: mockCartId
      });
      expect(windowAlertSpy).toHaveBeenCalledWith(
        `Processing purchase for ${totalProductsCount} product type(s) (total ${mockTotalQuantity} items) with a total of $${currentDiscountedTotalAmount.toFixed(2)}.`
      );
    });
  });

  it('calls onClose when the close button is clicked', () => {
    const mockOnClose = vi.fn();
    renderWithMockContext(
      { cartState: { items: [], totalQuantity: 0, cartId: null }, loading: false },
      { isOpen: true, onClose: mockOnClose }
    );
    const closeButton = screen.getByRole('button', { name: /Close cart/i });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // Test for handleClickOutside is more complex and often considered an integration detail.
  // Basic check: if popup is open, clicking outside calls onClose.
  it('calls onClose when clicking outside the popup', () => {
    const mockOnClose = vi.fn();
    // Render the component within a container to simulate "outside"
    const { container } = render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <MockCartProvider mockValue={{ cartState: { items: [], totalQuantity: 0, cartId: null }, loading: false }}>
          <CartPopup isOpen={true} onClose={mockOnClose} />
        </MockCartProvider>
      </div>
    );

    // Clicking on an element clearly outside the popup content
    fireEvent.mouseDown(screen.getByTestId('outside-area'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
