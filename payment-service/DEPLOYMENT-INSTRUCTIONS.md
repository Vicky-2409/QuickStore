# Payment Service Deployment Instructions

Follow these steps to deploy the fixed payment service:

## 1. Build and Push the Docker Image

```bash
# Navigate to the payment service directory
cd payment-service

# Build the new Docker image
docker build -t svignesh2409/quick-store-payment-service:fixed -f Dockerfile.fixed .

# Push the image to Docker Hub
docker push svignesh2409/quick-store-payment-service:fixed
```

## 2. Update the Kubernetes Deployment

Update the payment service deployment to use the new image:

```bash
# Edit the deployment to use the new image
kubectl set image deployment/payment-service-depl payment-service=svignesh2409/quick-store-payment-service:fixed

# Alternatively, you can use kubectl edit:
kubectl edit deployment payment-service-depl
# Change the image to: svignesh2409/quick-store-payment-service:fixed
```

## 3. Restart the Payment Service

```bash
# Force restart the deployment
kubectl rollout restart deployment payment-service-depl

# Check the rollout status
kubectl rollout status deployment payment-service-depl
```

## 4. Verify Logs

```bash
# Get the new pod name
kubectl get pods | grep payment-service

# View the logs to ensure proper initialization
kubectl logs -f payment-service-depl-[POD_ID]
```

## 5. Test Payment Functionality

Once the service is running, test the payment functionality in the application to verify that it's working correctly.

## Key Changes Made to Fix the Issue:

1. Fixed the dependency injection order - now services are fully initialized before controllers
2. Added detailed logging to track initialization and payment processing
3. Fixed amount conversion to prevent double conversion (frontend already multiplies by 100)
4. Added more robust error handling 
5. Added better environment variable handling with fallbacks

## Troubleshooting

If you encounter issues:

1. Check that the RabbitMQ service is running:
   ```bash
   kubectl get pods | grep rabbitmq
   ```

2. Ensure database connectivity:
   ```bash
   kubectl logs payment-service-depl-[POD_ID] | grep "MongoDB"
   ```

3. Check for payment processing errors:
   ```bash
   kubectl logs payment-service-depl-[POD_ID] | grep "Error"
   ```