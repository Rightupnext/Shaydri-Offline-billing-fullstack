// src/redux/companyProfileSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../axiosInstance'
import { notification } from 'antd'
import { token } from '../../auth'

// 🔹 Get Company Profile
export const fetchCompanyProfile = createAsyncThunk(
  'companyProfile/fetch',
  async (db_name, { rejectWithValue }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.get(`/profile/${getdb.db_name}/get`)
      return res.data
    } catch (err) {
      notification.error({
        message: 'Fetch Failed',
        description: err?.response?.data?.message || 'Something went wrong'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)
// 🔹 Upload or Update Company Profile
export const upsertCompanyProfile = createAsyncThunk(
  'companyProfile/upsert',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      const getdb = token.getUser()
      const res = await axiosInstance.post(`/profile/${getdb.db_name}/add`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      notification.success({ message: res.data.message })
      dispatch(fetchCompanyProfile)
      return res.data
    } catch (err) {
      notification.error({
        message: 'Save Failed',
        description: err?.response?.data?.message || 'Something went wrong'
      })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

const companyProfileSlice = createSlice({
  name: 'companyProfile',
  initialState: {
    profile: null,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(upsertCompanyProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(upsertCompanyProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(upsertCompanyProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(fetchCompanyProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCompanyProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(fetchCompanyProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export default companyProfileSlice.reducer
