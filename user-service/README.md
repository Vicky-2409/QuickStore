# User Service

A microservice responsible for managing user-related information including profiles, addresses, wallet, and cart.

## Features

- User profile management
- Address management
- Wallet management with transactions
- Shopping cart functionality
- RabbitMQ integration for user registration events

## API Endpoints

### User Profile

- `GET /api/users/:id` - Get user profile

### Address Management

- `POST /api/users/:id/address` - Add new address
- `PATCH /api/users/:id/address/:addressId` - Update address

### Wallet Management

- `PATCH /api/users/:id/wallet` - Add wallet transaction

### Cart Management

- `GET /api/users/:id/cart` - Get user's cart
- `PATCH /api/users/:id/cart` - Update cart items
- `DELETE /api/users/:id/cart/:productId` - Remove item from cart

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- MongoDB
- RabbitMQ

## Environment Variables

- `PORT` - Server port (default: 4005)
- `MONGO_URI` - MongoDB connection string
- `RABBITMQ_URL` - RabbitMQ connection URL
- `EXCHANGE_NAME` - RabbitMQ exchange name
- `QUEUE_NAME` - RabbitMQ queue name

## Running the Service

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the services using Docker Compose:
   ```bash
   docker-compose up
   ```

The service will be available at `http://localhost:4005`

## Development

To run in development mode:

```bash
npm run dev
```

## Building

To build the service:

```bash
npm run build
```

## Testing

To run tests:

```bash
npm test
```

## Architecture

The service follows a modular architecture with:

- Controllers: Handle HTTP requests
- Services: Implement business logic
- Models: Define data structures
- RabbitMQ Consumer: Handle user registration events
- Routes: Define API endpoints

## Dependencies

- Express.js - Web framework
- MongoDB - Database
- RabbitMQ - Message broker
- TypeScript - Language
- Mongoose - MongoDB ODM
- AMQP - RabbitMQ client
