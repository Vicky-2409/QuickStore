import amqp from "amqplib";

export const connectRabbitMQ = async (): Promise<amqp.Channel> => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://rabbitmq-service:5672"
    );
    const channel = await connection.createChannel();
    return channel;
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
    throw error;
  }
};
