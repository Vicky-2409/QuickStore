import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { orderService, CreateOrderDTO, Order } from "@/services/order.service";

interface OrderItem {
  product: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface OrdersState {
  orders: Order[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: OrdersState = {
  orders: [],
  status: "idle",
  error: null,
};

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrders();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch orders");
    }
  }
);

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (data: Omit<CreateOrderDTO, "userEmail">, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrder(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create order");
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async (
    { orderId, status }: { orderId: string; status: Order["status"] },
    { rejectWithValue }
  ) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      return { _id: orderId, status };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update order status");
    }
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrders: (state) => {
      state.orders = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      // Create Order
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.push(action.payload);
      })
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(
          (order) => order._id === action.payload._id
        );
        if (index !== -1) {
          state.orders[index].status = action.payload.status;
        }
      });
  },
});

export const { clearOrders } = ordersSlice.actions;

export const selectOrders = (state: RootState) => state.orders.orders;
export const selectOrdersStatus = (state: RootState) => state.orders.status;
export const selectOrdersError = (state: RootState) => state.orders.error;

export default ordersSlice.reducer;
