# Products Service

A microservice for managing products and categories in the Real-Time Order & Delivery System.

## Features

- Product catalog management
- Category management
- Image upload and storage with AWS S3
- Integration with Authentication Service via RabbitMQ
- RESTful API endpoints
- Role-based access control
- Search and filtering capabilities
- Pagination support

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- RabbitMQ
- AWS S3 bucket
- AWS credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=4002
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://svignesh2409:GOgxz3UEBjCrSNtl@cluster0.hchjyx3.mongodb.net/quick-store-products-service

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost
RABBITMQ_QUEUE=auth_events

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Start the server:
   ```bash
   npm start
   ```

For development:

```bash
npm run dev
```

## API Endpoints

### Categories

- `GET /api/categories` - List all categories
- `GET /api/categories/active` - List active categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Products

- `GET /api/products` - List all products (with pagination)
- `GET /api/products/featured` - Get featured products
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/search` - Search products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `PATCH /api/products/:id/stock` - Update product stock status (Admin only)

## Architecture

The service follows a layered architecture:

- **Repository Layer**: Handles data access and persistence
- **Service Layer**: Implements business logic
- **Controller Layer**: Handles HTTP requests and responses
- **Middleware**: Authentication, validation, and error handling

## Dependencies

- Express.js - Web framework
- MongoDB - Database
- Mongoose - MongoDB ODM
- AWS SDK - S3 integration
- RabbitMQ - Message broker
- JWT - Authentication
- Express Validator - Request validation

## Testing

Run tests:

```bash
npm test
```

## License

MIT
