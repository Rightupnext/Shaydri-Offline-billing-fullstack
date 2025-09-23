// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../store/slice/authSlice'
import companyProfileReducer from '../store/slice/profileSlice'
import categoryReducers from '../store/slice/categorySlice'
import productReducers from '../store/slice/productSlice'
import customerReducers from '../store/slice/customerSlice'
import invocieReducers from '../store/slice/invoiceSlice'
import inventoryReducers from './slice/inventorySlice'
import whatsappReducers from './slice/whatsappSlice'
import subscriptionReducers from './slice/subscriptionSlice'
export const store = configureStore({
  reducer: {
    auth: authReducer,
    companyProfile: companyProfileReducer,
    categories: categoryReducers,
    products: productReducers,
    customers: customerReducers,
    invoices: invocieReducers,
    inventory:inventoryReducers,
    whatsapp:whatsappReducers,
    subscription:subscriptionReducers,
  }
})
