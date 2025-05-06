export type OrderStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "delivered"
  | "cancelled";

export interface Order {
  orderId: string;
  customerEmail: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  assignedPartnerId: string | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}
