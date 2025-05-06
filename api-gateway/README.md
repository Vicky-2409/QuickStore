# API Gateway

A Node.js + Express API Gateway service for microservices architecture, built with TypeScript and designed for Docker deployment.

## Features

- Single entry point for all microservices
- Request routing based on URL paths
- CORS support
- Request logging
- Health check endpoint
- Docker support
- TypeScript support

## Prerequisites

- Node.js (v18 or higher)
- Docker (optional, for containerization)
- Docker Compose (optional, for orchestration)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3001
AUTH_SERVICE_URL=http://localhost:4000
USER_SERVICE_URL=http://localhost:4001
PRODUCT_SERVICE_URL=http://localhost:4002
ORDER_SERVICE_URL=http://localhost:4003
NODE_ENV=development
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up --build
```

## API Endpoints

- `/health` - Health check endpoint
- `/api/auth/*` - Auth service endpoints
- `/api/users/*` - User service endpoints
- `/api/products/*` - Product service endpoints
- `/api/orders/*` - Order service endpoints

## Project Structure

```
api-gateway/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   └── proxy.routes.ts
│   ├── config/
│   │   └── services.config.ts
│   └── middlewares/
│       └── logger.ts
├── .env
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
└── package.json
```

## License

ISC
