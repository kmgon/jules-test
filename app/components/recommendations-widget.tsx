import React, { useEffect, useState } from 'react';
import { Link } from 'react-router'; // Using react-router as established
import type { Product } from './product-card';

interface RecommendationsWidgetProps {
  currentProductId?: number;
  category?: string; // Category prop is defined but not used in the initial fetch logic as per requirements
}

const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = ({ currentProductId, category }) => {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Use the category prop to fetch related products if provided and API supports it.
        // For now, fetching all products as per requirement.
        const response = await fetch('https://dummyjson.com/products');
        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
        }
        const data = await response.json();

        let products: Product[] = data.products || [];

        if (currentProductId) {
          products = products.filter(product => product.id !== currentProductId);
        }

        // Select a few products (e.g., the first 4)
        setRecommendedProducts(products.slice(0, 4));
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId, category]); // Re-run effect if currentProductId or category changes

  if (loading) {
    return <p>Loading recommendations...</p>;
  }

  if (error) {
    return <p>Error loading recommendations: {error}</p>;
  }

  if (recommendedProducts.length === 0) {
    return <p>No recommendations available at the moment.</p>;
  }

  return (
    <div className="mt-12 pt-6 border-t border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Recommended Products</h3>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {recommendedProducts.map(product => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="block w-40 flex-shrink-0 no-underline text-current group" // group for hover effects if needed later
          >
            <div className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow duration-200 ease-in-out p-3 h-full flex flex-col">
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-24 object-cover mb-2 rounded"
              />
              <h4 className="text-sm font-medium text-gray-800 mb-1 truncate" title={product.title}>
                {product.title}
              </h4>
              <p className="text-sm font-bold text-gray-700 mt-auto">${product.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsWidget;
