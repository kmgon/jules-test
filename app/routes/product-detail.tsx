import { useLoaderData, useParams } from "react-router"; // Adjusted to react-router
import type { ProductDetail } from "../components/product-card"; // Assuming ProductDetail is exported from here
import RecommendationsWidget from "../components/recommendations-widget";
import { useCart } from "~/contexts/cart-context";

// Define types for loader params if needed, e.g.
// interface LoaderParams {
//   productId: string;
// }

// Loader function
export async function loader({ params }: { params: { productId: string } }): Promise<ProductDetail> {
  const productId = params.productId;
  const response = await fetch(`https://dummyjson.com/products/${productId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Response("Product Not Found", { status: 404 });
    }
    throw new Response("Failed to fetch product data", { status: response.status });
  }

  const productData = await response.json();

  // The API returns data that matches ProductDetail, but we might need to ensure
  // all fields are present or add default/empty values for fields not directly
  // returned by this specific API endpoint if the ProductDetail interface expects them.
  // For now, we'll assume the API returns data compatible with ProductDetail.
  // If the API doesn't return all fields (e.g. tags, weight, dimensions, etc. might be missing for some products or this endpoint)
  // we would need to augment the data here or ensure ProductDetail fields are optional.
  // Based on the previous subtask, ProductDetail has many more fields than a typical product listing.
  // The dummyjson API might not provide all of them.
  // Let's check the dummyjson documentation for a single product.
  // A quick check of dummyjson.com/products/1 reveals it DOES return:
  // tags, weight, dimensions, shippingInformation, warrantyInformation, returnPolicy, reviews
  // So, a direct cast should be fine.

  return productData as ProductDetail;
}

// Component function
function ProductDetailPage() {
  const product = useLoaderData() as ProductDetail;
  const { cartState, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = cartState.items.find(item => item.id === product.id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="container mx-auto p-4 md:p-8"> {/* Adjusted padding */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Image Section (takes 1/3 on md screens, full width on sm) */}
        <div className="md:col-span-1">
          <img src={product.thumbnail} alt={product.title} className="w-full h-auto object-cover rounded-lg shadow-lg mb-4" />
          {product.images && product.images.length > 1 && ( // Show "More Images" only if there are more than the thumbnail
            <>
              <h3 className="text-xl font-semibold mb-3">More Images:</h3>
              <div className="flex flex-wrap gap-2">
                {product.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${product.title} image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Info Section (takes 2/3 on md screens) */}
        <div className="md:col-span-2">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{product.title}</h1>
          <p className="text-sm text-gray-500 mb-3">Brand: {product.brand} | Category: {product.category}</p>

          <p className="text-2xl font-bold text-green-700 mb-1">
            ${(product.price * (1 - product.discountPercentage / 100)).toFixed(2)}
            {product.discountPercentage > 0 && (
              <span className="text-lg text-gray-500 line-through ml-2">${product.price.toFixed(2)}</span>
            )}
          </p>
          {product.discountPercentage > 0 && (
            <p className="text-sm text-red-600 mb-3">Save {product.discountPercentage}%</p>
          )}

          <div className="flex items-center mb-4">
            <div className="text-yellow-400 flex">
              {Array(5).fill(0).map((_, i) => (
                <svg key={i} className={`w-5 h-5 fill-current ${i < Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
              ))}
            </div>
            <span className="text-gray-600 ml-2 text-sm">({product.rating.toFixed(1)} out of 5 | {product.reviews?.length || 0} reviews)</span>
          </div>

          <p className="text-gray-700 mb-4 leading-relaxed">{product.description}</p>
          <p className="text-sm text-gray-600 mb-4">Stock: {product.stock > 0 ? <span className="text-green-600 font-semibold">{product.stock} available</span> : <span className="text-red-600 font-semibold">Out of Stock</span>}</p>

          {/* Cart Controls */}
          <div className="my-6"> {/* Increased margin for more separation */}
            {product.stock > 0 ? ( // Only show cart controls if product is in stock
              currentQuantity === 0 ? (
                <button
                  onClick={() => { addToCart(product); }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors duration-150"
                >
                  Add to Cart
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => { if (currentQuantity === 1) removeFromCart(product.id); else updateQuantity(product.id, currentQuantity - 1); }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg text-base transition-colors duration-150"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold text-gray-700">{currentQuantity}</span>
                  <button
                    onClick={() => { updateQuantity(product.id, currentQuantity + 1); }}
                    disabled={currentQuantity >= product.stock}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg text-base transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              )
            ) : (
              <p className="text-red-600 font-semibold text-lg">Currently Out of Stock</p>
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3 border-b pb-2">Product Details:</h2>
          <div className="space-y-2 text-sm text-gray-700">
            {product.tags && product.tags.length > 0 && (
              <p><span className="font-semibold text-gray-600">Tags:</span> {product.tags.join(', ')}</p>
            )}
            <p><span className="font-semibold text-gray-600">Weight:</span> {product.weight}g</p>
            <div>
              <span className="font-semibold text-gray-600">Dimensions:</span>
              <ul className="list-disc list-inside ml-4">
                <li>Width: {product.dimensions.width} cm</li>
                <li>Height: {product.dimensions.height} cm</li>
                <li>Depth: {product.dimensions.depth} cm</li>
              </ul>
            </div>
            <p><span className="font-semibold text-gray-600">Shipping:</span> {product.shippingInformation}</p>
            <p><span className="font-semibold text-gray-600">Warranty:</span> {product.warrantyInformation}</p>
            <p><span className="font-semibold text-gray-600">Returns:</span> {product.returnPolicy}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section - Full Width Below */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reviews:</h2>
        {product.reviews && product.reviews.length > 0 ? (
          <ul className="space-y-6">
            {product.reviews.map((review, index) => (
              <li key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-2">
                  <strong className="text-gray-800">{review.reviewerName}</strong>
                  <span className="text-xs text-gray-500 ml-2">- {new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center mb-1">
                  {Array(5).fill(0).map((_, i) => (
                    <svg key={i} className={`w-4 h-4 fill-current ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>
                  ))}
                  <span className="text-xs text-gray-600 ml-1">({review.rating}/5)</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No reviews yet for this product.</p>
        )}
      </div>

      <RecommendationsWidget currentProductId={product.id} category={product.category} />
    </div>
  );
}

export default ProductDetailPage;
