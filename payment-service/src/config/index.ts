export const config = {
  rabbitmq: {
    url: process.env.RABBITMQ_URL || "amqp://rabbitmq-service:5672",
  },
};
