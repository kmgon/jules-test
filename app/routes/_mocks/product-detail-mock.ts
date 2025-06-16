import type { ProductDetail, Product } from '../../components/product-card';

export const mockProductDetail: ProductDetail = {
  id: 1,
  title: "iPhone 9",
  description: "An apple mobile which is nothing like apple",
  price: 549,
  discountPercentage: 12.96,
  rating: 4.69,
  stock: 94,
  brand: "Apple",
  category: "smartphones",
  thumbnail: "https://cdn.dummyjson.com/product-images/1/thumbnail.jpg",
  images: [
    "https://cdn.dummyjson.com/product-images/1/1.jpg",
    "https://cdn.dummyjson.com/product-images/1/2.jpg",
    "https://cdn.dummyjson.com/product-images/1/3.jpg",
  ],
  tags: ["smartphones", "apple", "ios"],
  weight: 1.2, // Assuming kg, or just a number
  dimensions: {
    width: 75.7,
    height: 150.9,
    depth: 8.3,
  },
  shippingInformation: "Ships in 1-2 business days",
  warrantyInformation: "1 year manufacturer warranty",
  returnPolicy: "30 days return policy",
  reviews: [
    {
      rating: 5,
      comment: "Excellent product!",
      date: "2024-05-20T08:30:00.000Z",
      reviewerName: "John Doe",
      reviewerEmail: "john.doe@example.com",
    },
    {
      rating: 4,
      comment: "Good value for money.",
      date: "2024-05-18T12:00:00.000Z",
      reviewerName: "Jane Smith",
      reviewerEmail: "jane.smith@example.com",
    },
  ],
};

export const mockRecommendationsProducts: Product[] = [
  {
    id: 2,
    title: "iPhone X",
    description: "SIM-Free, Model A19211 6.5-inch Super Retina HD display with OLED technology A12 Bionic chip with ...",
    price: 899,
    discountPercentage: 17.94,
    rating: 4.44,
    stock: 34,
    brand: "Apple",
    category: "smartphones",
    thumbnail: "https://cdn.dummyjson.com/product-images/2/thumbnail.jpg",
    images: ["https://cdn.dummyjson.com/product-images/2/1.jpg", "https://cdn.dummyjson.com/product-images/2/2.jpg"],
  },
  {
    id: 3,
    title: "Samsung Universe 9",
    description: "Samsung's new variant which goes beyond Galaxy to the Universe",
    price: 1249,
    discountPercentage: 15.46,
    rating: 4.09,
    stock: 36,
    brand: "Samsung",
    category: "smartphones",
    thumbnail: "https://cdn.dummyjson.com/product-images/3/thumbnail.jpg",
    images: ["https://cdn.dummyjson.com/product-images/3/1.jpg"],
  },
];
