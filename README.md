# Project: jules-test

Jules Test is a sample e-commerce application built with React and React Router. It demonstrates features like product listing, product details, a shopping cart, and recommendations. It uses `dummyjson.com` for product data.

![logo](app/welcome/logo-light.svg)

## Features

- Displays a list of products with infinite scrolling.
- Shows detailed product information including images, pricing, reviews, and specifications.
- Shopping cart functionality (add, update, remove items).
- Product recommendations.
- Server-side rendering.
- Hot Module Replacement (HMR) for development.
- Asset bundling and optimization.
- Data loading and mutations with React Router.
- Written in TypeScript.
- Styled with TailwindCSS.
- Example tests with Vitest.
- [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

## Contributing

Contributions are welcome! If you have suggestions or want to improve the project, please feel free to:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Open a Pull Request.

## Testing

Run all tests:
```bash
npm test
```

Run tests with UI (Vitest UI):
```bash
npm run test:ui
```

## License

This project is currently not licensed.

Consider adding an open-source license such as the [MIT License](https://opensource.org/licenses/MIT) to define how others can use, modify, and distribute your code. If you add a `LICENSE` file to the root of your project, you can link to it here.
