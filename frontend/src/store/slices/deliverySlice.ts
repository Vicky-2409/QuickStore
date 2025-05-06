import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AvailableOrder, Order } from "@/types/order.types";

interface DeliveryState {
  currentOrder: Order | null;
  availableOrders: AvailableOrder[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DeliveryState = {
  currentOrder: null,
  availableOrders: [],
  isLoading: false,
  error: null,
};

const deliverySlice = createSlice({
  name: "delivery",
  initialState,
  reducers: {
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    setAvailableOrders: (state, action: PayloadAction<AvailableOrder[]>) => {
      state.availableOrders = action.payload;
    },
    removeAvailableOrder: (state, action: PayloadAction<string>) => {
      state.availableOrders = state.availableOrders.filter(
        (order) => order.orderId !== action.payload
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearOrders: (state) => {
      state.currentOrder = null;
      state.availableOrders = [];
    },
  },
});

export const {
  setCurrentOrder,
  setAvailableOrders,
  removeAvailableOrder,
  setLoading,
  setError,
  clearOrders,
} = deliverySlice.actions;

export default deliverySlice.reducer;
