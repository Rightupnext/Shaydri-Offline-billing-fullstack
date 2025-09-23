import React from 'react'
import { Navigate } from 'react-router-dom'
import { token } from './auth/index'

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const user = token.getUser()

  if (!user) return <Navigate to="/login" />

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />
  }

  return children
}

export default PrivateRoute
