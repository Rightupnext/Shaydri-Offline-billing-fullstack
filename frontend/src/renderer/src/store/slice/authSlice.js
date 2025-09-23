// src/redux/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../axiosInstance';
import { token } from '../../auth/index';
import { notification } from 'antd';

// ✅ Login Thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      const { token: accessToken, user } = response.data;

      if (accessToken && user) {
        // Save token and user
        token.set(accessToken);
        localStorage.setItem('user', JSON.stringify(user));

        // AntD Notification
        notification.success({
          message: 'Login Successful',
          description: `Welcome, ${user.name || user.email || 'User'}`,
        });

        return { token: accessToken, user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      notification.error({
        message: 'Login Failed',
        description:
          err?.response?.data?.message || err.message || 'Something went wrong',
      });
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// ✅ Register Thunk
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);

      notification.success({
        message: 'Registration Successful',
        description: 'You can now log in with your credentials.',
      });

      return response.data;
    } catch (err) {
      notification.error({
        message: 'Registration Failed',
        description:
          err?.response?.data?.message || err.message || 'Something went wrong',
      });
      return rejectWithValue(err.response?.data || { message: err.message });
    }
  }
);

// ✅ Initial Auth State
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  error: null,
  isAuthenticated: !!token.get(),
};

// ✅ Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      token.remove();
      localStorage.removeItem('user');
      state.user = null;
      state.isAuthenticated = false;

      notification.info({
        message: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Registration failed';
      });
  },
});

// ✅ Exports
export const { logout } = authSlice.actions;
export default authSlice.reducer;
