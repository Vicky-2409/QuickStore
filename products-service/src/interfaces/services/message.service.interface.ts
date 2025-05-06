export interface IMessageService {
  connect(): Promise<void>;
  consumeMessages(
    queue: string,
    callback: (message: any) => Promise<void>
  ): Promise<void>;
  publishMessage(exchange: string, message: any): Promise<void>;
}
