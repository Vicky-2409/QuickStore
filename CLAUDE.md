# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beeyond Quick Commerce is a real-time order tracking and delivery system built using a microservices architecture. The application connects customers, delivery partners, and administrators through real-time communication. Key features include:

- Real-time order tracking and delivery management
- User authentication and authorization with roles (Customer, Delivery Partner, Admin)
- Product catalog with categories and search
- Order processing and payment integration
- Delivery partner management and order assignment

## Architecture

The project follows a microservices architecture with the following components:

1. **API Gateway**: Single entry point for all client requests, routing to appropriate services
2. **Frontend**: Next.js application for customer, delivery partner, and admin interfaces
3. **Microservices**:
   - **Auth Service**: User registration, login, and authentication
   - **User Service**: User profile management
   - **Products Service**: Product and category management
   - **Order Service**: Order processing and management
   - **Payment Service**: Payment processing using Razorpay
   - **Delivery Service**: Delivery partner management and real-time order tracking

### Communication Patterns

Services communicate through:
- **Synchronous REST API calls**: For direct request-response patterns
- **Asynchronous Messaging (RabbitMQ)**: For event-driven communication between services
- **WebSockets (Socket.io)**: For real-time updates and notifications

## Common Commands

### Development

Each service follows a similar pattern for development:

```bash
# Start a service in development mode (with auto-reload)
cd <service-directory>
npm run dev

# Build a service
cd <service-directory>
npm run build

# Start a service in production mode
cd <service-directory>
npm start

# Run the frontend
cd frontend
npm run dev
```

### Docker and Kubernetes

```bash
# Build a Docker image for a service
docker build -t <service-name> ./<service-directory>

# Deploy to Kubernetes
kubectl apply -f ./k8s-manifests/<service-name>-depl.yaml

# Deploy all services to Kubernetes
kubectl apply -f ./k8s-manifests/
```

## Key Component Relationships

### Service Communication

- **API Gateway**: Routes client requests to appropriate microservices
- **Auth Service**: Publishes user registration events to other services via RabbitMQ
- **Delivery Service**: Maintains real-time communication with delivery partners and customers using Socket.io
- **Order Service**: Communicates with Payment and Delivery services for order processing

### Real-Time Communication

The real-time communication is implemented using Socket.io:

1. The Delivery Service maintains socket connections with:
   - Delivery partners: To notify about new orders
   - Customers: To provide real-time order status updates

2. Socket events include:
   - `delivery_partner_connected`: When a delivery partner comes online
   - `new_order`: Broadcast to available delivery partners
   - `accept_order`: When a delivery partner accepts an order
   - `update_order_status`: For updating order status in real-time
   - `order_status_updated`: Broadcast to customers for tracking

## Environment Variables

Each service has its own environment variables with similar patterns:

```
# Common variables across services
PORT=<service-port>
MONGODB_URI=mongodb://mongodb-srv:27017/<database-name>
JWT_SECRET=<jwt-secret>
RABBITMQ_URL=amqp://rabbitmq-srv:5672

# Service-specific variables
# (See individual service README files for service-specific variables)
```

## Important Notes for Development

1. **Service Dependencies**: 
   - Most services depend on MongoDB and RabbitMQ
   - The Delivery Service relies on Socket.io for real-time communication
   - The Payment Service integrates with Razorpay

2. **Authentication**:
   - The Auth Service handles authentication and generates JWTs
   - The API Gateway forwards authentication headers to downstream services
   - Role-based access control is implemented across services

3. **Communication Patterns**:
   - Use REST for synchronous communication
   - Use RabbitMQ for asynchronous event-driven communication
   - Use Socket.io for real-time updates

4. **Infrastructure**:
   - The application is containerized using Docker
   - Kubernetes is used for orchestration
   - Nginx Ingress is used for external access