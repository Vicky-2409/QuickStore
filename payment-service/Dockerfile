FROM node:16-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build TypeScript code
RUN npm run build

# Set environment variables with safe defaults
ENV NODE_ENV=production
ENV PORT=4004
ENV MONGO_URI=mongodb+srv://svignesh2409:GOgxz3UEBjCrSNtl@cluster0.hchjyx3.mongodb.net/quick-store-payment-service
ENV RABBITMQ_URL=amqp://rabbitmq-service:5672
ENV RAZORPAY_KEY_ID=rzp_test_Wsp2NzIUWHF2Cm
ENV RAZORPAY_KEY_SECRET=bhtVpaw0zDw5uCY9ybVGEYRE

# Expose the application port
EXPOSE 4004

# Command to run the application
CMD ["node", "dist/index.js"]