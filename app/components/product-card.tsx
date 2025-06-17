import { Link } from 'react-router';
import { useCart } from '~/contexts/cart-context';

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

export interface ProductDetail extends Product {
  tags: string[];
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  shippingInformation: string;
  warrantyInformation: string;
  returnPolicy: string;
  reviews: {
    rating: number;
    comment: string;
    date: string; // ISO date string
    reviewerName: string;
    reviewerEmail: string;
  }[];
}

interface ProductCardProps {
  product: Product;
}

function renderStars(rating: number): React.ReactNode[] {
  const stars = [];
  const roundedRating = Math.round(rating);
  for (let i = 0; i < 5; i++) {
    if (i < roundedRating) {
      stars.push(<span key={i}>★</span>);
    } else {
      stars.push(<span key={i}>☆</span>);
    }
  }
  return stars;
}

export function ProductCard({ product }: ProductCardProps) {
  const { cartState, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = cartState.items.find(item => item.id === product.id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  return (
    <Link to={`/products/${product.id}`} className="block hover:shadow-xl transition-shadow duration-200 ease-in-out rounded-lg h-full">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
        <img src={product.thumbnail} alt={product.title} className="w-full h-48 object-cover" />
        <div className="p-4 flex flex-col flex-grow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{product.title}</h2>
          <p className="text-sm text-gray-600 mb-1">Brand: {product.brand}</p>
          <p className="text-gray-700 text-sm mb-2 line-clamp-3 flex-grow">{product.description}</p>

          {/* Cart Controls */}
          <div className="mt-2 mb-2">
            {currentQuantity === 0 ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded text-sm"
              >
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (currentQuantity === 1) removeFromCart(product.id); else updateQuantity(product.id, currentQuantity - 1); }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded-l text-sm"
                >
                  -
                </button>
                <span className="px-3 text-sm">{currentQuantity}</span>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, currentQuantity + 1); }}
                  disabled={currentQuantity >= product.stock}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded-r text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center mt-auto"> {/* Push stars to the bottom */}
            <div className="text-yellow-500 flex">
              {renderStars(product.rating)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
