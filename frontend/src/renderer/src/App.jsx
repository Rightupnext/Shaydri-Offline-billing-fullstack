import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout/DashboardLayout'
import AuthForm from './components/AuthForm'
import PrivateRoute from './PrivateRoute'
import PublicRoute from './PublicRoute'
import DashboardStats from './Layout/DashboardStats'
import CompanyProfileForm from './components/CompanyProfileForm'
import CategoryManager from './category/CategoryManager'
import ProductManagement from './products/ProductManagement'
import CustomerManagement from './customer/CustomerManagement'
import InventoryManager from './inventory/InventoryManager'
import Settings from './subscription/Settings'

// 🧾 Default Invoice Components (user.id === 1)
import InvoiceForm from './Invoice/InvoiceForm'
import InvoiceEditForm from './Invoice/InvoiceEditForm'
import InvoiceTable from './Invoice/invoiceTable'

// 🧾 Kovaimannvaasanai Invoice Components (user.id === 2)
import KovaiInvoiceForm from './KovaimannvaasanaiInvoice/InvoiceForm'
import KovaiInvoiceEditForm from './KovaimannvaasanaiInvoice/InvoiceEditForm'
import KovaiInvoiceTable from './KovaimannvaasanaiInvoice/invoiceTable'
import { token } from './auth'
function App() {
  const user = token.getUser()
  const InvoiceRoutes =
    user?.id === 2
      ? {
          form: <KovaiInvoiceForm />,
          edit: <KovaiInvoiceEditForm />,
          list: <KovaiInvoiceTable />
        }
      : {
          form: <InvoiceForm />,
          edit: <InvoiceEditForm />,
          list: <InvoiceTable />
        }

  return (
    <Routes>
      {/* ✅ Public login route */}
      <Route path="/login" element={<AuthForm />} />

      {/* ✅ Protected routes */}
      <Route
        path="/"
        element={
          <PrivateRoute allowedRoles={['admin', 'super-admin', 'employee']}>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardStats />} />
        <Route path="invoice" element={InvoiceRoutes.form} />
        <Route path="editinvoice/:id" element={InvoiceRoutes.edit} />
        <Route path="invoice-list" element={InvoiceRoutes.list} />
        <Route path="profile" element={<CompanyProfileForm />} />
        <Route path="category" element={<CategoryManager />} />
        <Route path="product" element={<ProductManagement />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="inventory" element={<InventoryManager />} />
        <Route path="subscription" element={<Settings />} />
      </Route>

      {/* ✅ Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
