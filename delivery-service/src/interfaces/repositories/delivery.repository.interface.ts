import { IOrder } from "../../models/order.model";
import { DeliveryPartner } from "../../models/delivery-partner.model";

export interface IDeliveryRepository {
  createOrder(orderData: {
    orderId: string;
    customerEmail: string;
    customerAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    amount: number;
    status: string;
  }): Promise<IOrder>;

  getOrder(orderId: string): Promise<IOrder | null>;
  getPendingOrders(): Promise<IOrder[]>;

  updateOrderStatus(
    orderId: string,
    status: IOrder["status"],
    assignedPartnerId?: string
  ): Promise<IOrder | null>;

  assignDeliveryPartner(orderId: string, partnerId: string): Promise<IOrder>;
  getAvailablePartners(): Promise<DeliveryPartner[]>;
  updatePartnerAvailability(
    partnerId: string,
    available: boolean
  ): Promise<DeliveryPartner>;
}
