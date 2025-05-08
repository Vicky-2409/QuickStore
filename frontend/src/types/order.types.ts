export type OrderStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "on_the_way"
  | "delivered";

export interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
}


export interface Order {
  _id: string;
  userEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderId?: string;
  assignedPartnerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableOrder {
  _id: string;
  orderId: string;
  assignedPartnerId: string | null;
  createdAt: string;
  updatedAt: string;
  customerEmail: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  status: string; // Adjust as neede
  total: number;
  items: {
    _id: string;
    quantity: number;
    product: {
      _id: string;
      name: string;
      price: number;
      imageUrl: string;
    };
  }[];
  __v?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  deliveryPartners: number;
}

export interface DeliveryPartner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
}
