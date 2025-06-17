import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
import { ProductCard, type Product } from "../components/product-card";
import { useState, useEffect, useRef } from "react"; // Import useEffect and useRef

export interface HomeLoaderData {
  products: Product[];
  total: number;
  initialLimit: number;
  initialSkip: number;
}

export async function loader() {
  const limit = 20;
  const skip = 0;
  const response = await fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`);
  if (!response.ok) {
    console.error("Failed to fetch products:", response.status, response.statusText);
    throw new Response(JSON.stringify({ message: "Failed to fetch products" }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  const data = await response.json();
  if (!data || !Array.isArray(data.products) || typeof data.total !== 'number') {
    console.error("Fetched data is not in the expected format:", data);
    throw new Response(JSON.stringify({ message: "Invalid data format from API" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { products: data.products as Product[], total: data.total, initialLimit: limit, initialSkip: skip };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const initialData = useLoaderData<HomeLoaderData>();
  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [skip, setSkip] = useState(initialData.initialLimit);
  const [hasMore, setHasMore] = useState(initialData.products.length < initialData.total);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerRef = useRef<HTMLDivElement>(null); // Ref for the sentinel element

  const fetchMoreProducts = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      // Use initialData.initialLimit for consistency, or a defined constant
      const limitPerFetch = initialData.initialLimit;
      const response = await fetch(`https://dummyjson.com/products?limit=${limitPerFetch}&skip=${skip}`);

      if (!response.ok) {
        console.error("Failed to fetch more products:", response.status, response.statusText);
        setHasMore(false); // Stop trying if there's an API error
        return;
      }

      const data: { products: Product[], total: number, skip: number, limit: number } = await response.json();

      if (data.products && data.products.length > 0) {
        // products.length is the count before adding new ones
        const currentProductsCount = products.length;
        setProducts(prevProducts => [...prevProducts, ...data.products]);
        setSkip(prevSkip => prevSkip + data.products.length);
        // Use data.total from the API response as it's the most up-to-date grand total
        setHasMore((currentProductsCount + data.products.length) < data.total);
      } else {
        setHasMore(false); // No more products returned
      }
    } catch (error) {
      console.error("Error fetching more products:", error);
      setHasMore(false); // Stop trying if there's a network or parsing error
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !loadingMore) {
          fetchMoreProducts();
        }
      },
      { threshold: 1.0 } // Trigger when 100% of the sentinel is visible
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [hasMore, loadingMore, skip]); // Dependencies for the effect

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {/* Sentinel Element for Intersection Observer */}
      <div ref={observerRef} style={{ height: '1px' }}></div>

      {/* Loading Indicator */}
      {loadingMore && (
        <div className="text-center p-4">
          <p>Loading more products...</p>
        </div>
      )}

      {/* End of Results Indicator */}
      {!loadingMore && !hasMore && products.length > 0 && initialData.products.length > 0 && (
        <div className="text-center p-4">
          <p>You've reached the end!</p>
        </div>
      )}
    </div>
  );
}
