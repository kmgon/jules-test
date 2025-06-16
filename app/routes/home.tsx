import type { Route } from "./+types/home";
import { useLoaderData } from "react-router";
import { ProductCard, type Product } from "../components/product-card";

export async function loader() {
  const response = await fetch("https://dummyjson.com/products");
  if (!response.ok) {
    // Log error or handle more gracefully if needed, then throw a Response
    console.error("Failed to fetch products:", response.status, response.statusText);
    throw new Response(JSON.stringify({ message: "Failed to fetch products" }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  const data = await response.json();
  // Ensure data has products, or handle cases where products might be missing
  if (!data || !Array.isArray(data.products)) {
    console.error("Fetched data does not contain a products array:", data);
    throw new Response(JSON.stringify({ message: "Invalid data format from API" }), {
      status: 500, // Internal Server Error, as the API contract was violated
      headers: { "Content-Type": "application/json" },
    });
  }
  return { products: data.products as Product[] };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const { products } = useLoaderData<{ products: Product[] }>();
  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
