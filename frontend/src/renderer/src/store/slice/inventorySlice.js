import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../axiosInstance'
import { notification } from 'antd'
import { token } from '../../auth'

// 🔹 Fetch All Inventory
export const fetchInventory = createAsyncThunk(
  'inventory/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/inventory/${getdb.db_name}/list`)
      return res.data
    } catch (err) {
      notification.error({
        message: 'Fetch Failed',
        description: err?.response?.data?.message || 'Unable to fetch inventory'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Add Inventory
export const createInventory = createAsyncThunk(
  'inventory/create',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.post(`/inventory/${getdb.db_name}/add`, data)
      notification.success({ message: 'Inventory item added successfully' })
      dispatch(fetchInventory())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Add Failed',
        description: err?.response?.data?.message || 'Unable to add inventory'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Update Inventory
export const updateInventory = createAsyncThunk(
  'inventory/update',
  async ({ id, data, action }, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser();

      // ✅ Inject inventory_id into data payload
      const payload = {
        ...data,
        inventory_id: id,
        action // ✅ Also add action to payload
      };

      const res = await axiosInstance.put(`/inventory/${getdb.db_name}/${id}`, payload);

      notification.success({ message: 'Inventory updated successfully' });
      dispatch(fetchInventory());

      return res.data;
    } catch (err) {
      notification.error({
        message: 'Update Failed',
        description: err?.response?.data?.message || 'Unable to update inventory'
      });
      return rejectWithValue(err.response?.data || err);
    }
  }
);


// 🔹 Delete Inventory
export const deleteInventory = createAsyncThunk(
  'inventory/delete',
  async (inventoryId, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.delete(`/inventory/${getdb.db_name}/delete/${inventoryId}`)
      notification.success({ message: 'Inventory item deleted successfully' })
      dispatch(fetchInventory())
      return res.data
    } catch (err) {
      notification.error({
        message: 'Delete Failed',
        description: err?.response?.data?.message || 'Unable to delete inventory'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

// 🔹 Get Inventory by ID (if needed)
export const fetchInventoryById = createAsyncThunk(
  'inventory/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/inventory/${getdb.db_name}/${id}`)
      return res.data
    } catch (err) {
      notification.error({
        message: 'Fetch Item Failed',
        description: err?.response?.data?.message || 'Unable to fetch item'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    list: [],
    loading: false,
    error: null,
    currentItem: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create
      .addCase(createInventory.pending, (state) => {
        state.loading = true
      })
      .addCase(createInventory.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(createInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update
      .addCase(updateInventory.pending, (state) => {
        state.loading = true
      })
      .addCase(updateInventory.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete
      .addCase(deleteInventory.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteInventory.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(deleteInventory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch By ID
      .addCase(fetchInventoryById.pending, (state) => {
        state.loading = true
        state.currentItem = null
      })
      .addCase(fetchInventoryById.fulfilled, (state, action) => {
        state.loading = false
        state.currentItem = action.payload
      })
      .addCase(fetchInventoryById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.currentItem = null
      })
  }
})

export default inventorySlice.reducer
