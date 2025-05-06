# Authentication Service

This is the authentication service for the real-time order and delivery system. It handles user registration, login, and OTP verification.

## Features

- User registration with email verification
- User login with JWT authentication
- OTP verification via email
- Role-based access control (Customer, Delivery Partner, Admin)

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- JWT for authentication
- Nodemailer for email notifications

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env`:

   - Set your MongoDB connection string
   - Set your JWT secret
   - Configure email settings (Gmail recommended)

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── interfaces/     # TypeScript interfaces
├── middleware/     # Express middleware
├── models/         # Mongoose models
├── repositories/   # Data access layer
├── routes/         # API routes
└── services/       # Business logic
```

## Development

- Use TypeScript for type safety
- Follow the repository pattern for data access
- Implement proper error handling
- Use dependency injection for better testability

## Testing

To run tests:

```bash
npm test
```

## Production Deployment

1. Build the TypeScript code:

   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Security Considerations

- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Use HTTPS in production
- Validate all user inputs
- Implement proper error handling
