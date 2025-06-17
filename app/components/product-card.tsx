import { Link } from 'react-router';

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
  return (
    <Link to={`/products/${product.id}`} className="block hover:shadow-xl transition-shadow duration-200 ease-in-out rounded-lg h-full">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden h-full flex flex-col">
        <img src={product.thumbnail} alt={product.title} className="w-full h-48 object-cover" />
        <div className="p-4 flex flex-col flex-grow"> {/* flex-grow to push content below, flex-col for proper alignment */}
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{product.title}</h2>
          <p className="text-sm text-gray-600 mb-1">Brand: {product.brand}</p>
          <p className="text-gray-700 text-sm mb-2 line-clamp-3 flex-grow">{product.description}</p> {/* Allow description to take available space */}
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
