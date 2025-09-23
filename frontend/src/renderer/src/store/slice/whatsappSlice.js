import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../axiosInstance'
import { token } from '../../auth/index' // assuming you store/get tenant info here
import { notification } from 'antd'

// 🔄 Async thunk for uploading PDF and saving WhatsApp message
export const uploadWhatsAppMessage = createAsyncThunk(
  'whatsapp/uploadMessage',
  async (formData, { rejectWithValue }) => {
    try {
      const getdb = token.getUser() // get current user tenant db_name
      const res = await axiosInstance.post(`/whatsapp/${getdb.db_name}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      notification.success({ message: 'WhatsApp message saved and PDF uploaded' })
      return res.data
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Upload failed'
      notification.error({ message: 'Error', description: message })
      return rejectWithValue(err.response?.data || err)
    }
  }
)

const whatsappSlice = createSlice({
  name: 'whatsapp',
  initialState: {
    uploading: false,
    success: false,
    downloadUrl: null,
    error: null
  },
  reducers: {
    resetWhatsAppState: (state) => {
      state.uploading = false
      state.success = false
      state.downloadUrl = null
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadWhatsAppMessage.pending, (state) => {
        state.uploading = true
        state.success = false
        state.error = null
      })
      .addCase(uploadWhatsAppMessage.fulfilled, (state, action) => {
        state.uploading = false
        state.success = true
        state.downloadUrl = action.payload.downloadUrl
      })
      .addCase(uploadWhatsAppMessage.rejected, (state, action) => {
        state.uploading = false
        state.success = false
        state.error = action.payload
      })
  }
})

export const { resetWhatsAppState } = whatsappSlice.actions
export default whatsappSlice.reducer
