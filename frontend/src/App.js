import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Layout from "./components/Layout";

import "./index.css";

const publicUrl = process.env.PUBLIC_URL || '';
const basename = publicUrl
  ? (publicUrl.startsWith('http')
      ? new URL(publicUrl).pathname.replace(/\/$/, '')
      : publicUrl.replace(/\/$/, ''))
  : '';

/* ---------------- SAFE PRIVATE ROUTE ---------------- */
const PrivateRoute = ({ children }) => {
  const auth = useAuth();

  if (!auth) return null;

  const { user, loading } = auth;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

/* ---------------- SAFE PUBLIC ROUTE ---------------- */
const PublicRoute = ({ children }) => {
  const auth = useAuth();

  if (!auth) return null;

  const { user, loading } = auth;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return !user ? children : <Navigate to="/" replace />;
};

/* ---------------- ROUTES ---------------- */
function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>
    </Routes>
  );
}

/* ---------------- APP ROOT ---------------- */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a2e",
              color: "#e2e8f0",
              border: "1px solid #334155",
            },
          }}
        />

        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}