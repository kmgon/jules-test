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

interface ProductCardProps {
  product: Product;
}

function renderStars(rating: number): JSX.Element[] {
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
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <img src={product.thumbnail} alt={product.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{product.title}</h2>
        <p className="text-sm text-gray-600 mb-1">Brand: {product.brand}</p>
        <p className="text-gray-700 text-sm mb-2 line-clamp-3">{product.description}</p>
        <div className="flex items-center mb-2">
          <div className="text-yellow-500 flex">
            {renderStars(product.rating)}
          </div>
        </div>
      </div>
    </div>
  );
}
