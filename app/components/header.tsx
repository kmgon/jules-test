import { colors } from '../theme';

export function Header() {
  return (
    <header
      style={{
        backgroundColor: colors.primary.main,
        color: colors.primary.contrastText,
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>KM Shop</h1>
      {/* Simple inline SVG cart icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.primary.contrastText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true" // Add aria-hidden as it's decorative
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    </header>
  );
}
