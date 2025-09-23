import React from "react";
import { Navigate } from "react-router-dom";
import { token } from "./auth/index";

const PublicRoute = ({ children }) => {
  return token.get() ? <Navigate to="/" /> : children;
};

export default PublicRoute;
