import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from '../axiosInstance';
import { notification } from 'antd';
import { token } from '../../auth';

// ✅ Create Subscription
export const createSubscription = createAsyncThunk(
  "subscription/createSubscription",
  async (amount, { rejectWithValue }) => {
    try {
      const getdb = token.getUser();
      const { data } = await axiosInstance.post(`/subscription/${getdb.db_name}/create-subscription`, amount);
      
      notification.success({
        message: "Subscription Created",
        description: "Subscription order created successfully.",
      });

      return data;
    } catch (error) {
      notification.error({
        message: "Failed to Create Subscription",
        description: error?.response?.data?.message || "Something went wrong.",
      });

      return rejectWithValue(error?.response?.data || "Failed to create subscription.");
    }
  }
);

// ✅ Verify Razorpay Payment
export const verifyPayment = createAsyncThunk(
  "subscription/verifyPayment",
  async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature, amount }, { rejectWithValue }) => {
    try {
      const getdb = token.getUser();
      const { data } = await axiosInstance.post(`/subscription/${getdb.db_name}/verify-payment`, {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount,
      });

      notification.success({
        message: "Payment Verified",
        description: data?.message || "Payment verified and subscription activated.",
      });

      return data;
    } catch (error) {
      notification.error({
        message: "Verification Failed",
        description: error?.response?.data?.message || "Failed to verify payment.",
      });

      return rejectWithValue(error?.response?.data?.message || "Failed to verify payment.");
    }
  }
);

// ✅ Monitor Subscription
export const monitorSubscription = createAsyncThunk(
  "subscription/monitorSubscription",
  async (_, { rejectWithValue }) => {
    try {
      const getdb = token.getUser();
      const { data } = await axiosInstance.get(`/subscription/${getdb.db_name}/monitor-subscription`);
      return data;
    } catch (error) {
      notification.error({
        message: "Monitoring Failed",
        description: error?.response?.data?.message || "Unable to monitor subscription.",
      });

      return rejectWithValue(error?.response?.data || "Failed to monitor subscription.");
    }
  }
);

// 📦 Redux Slice
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: {
    subscription: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(monitorSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(monitorSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
      })
      .addCase(monitorSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default subscriptionSlice.reducer;
