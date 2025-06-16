import { type RouteConfig, index, route } from "@react-router/dev/routes"; // Added route import

export default [
  index("routes/home.tsx"),
  route("products/:productId", "routes/product-detail.tsx") // Added new route
] satisfies RouteConfig;
