import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import { api } from "./utils/api";

// Guard for authenticated pages
function PrivateRoute({ children }) {
  const auth = api.isAuthenticated();
  return auth ? (
    <>
      <Navbar />
      <main className="pb-16 mt-4">{children}</main>
    </>
  ) : (
    <Navigate to="/login" replace />
  );
}

// Guard for admin-only pages
function AdminRoute({ children }) {
  const role = api.getUserRole();
  return role === "admin" ? children : <Navigate to="/dashboard" replace />;
}

// Redirect logged in users away from auth pages
function GuestRoute({ children }) {
  const auth = api.isAuthenticated();
  return !auth ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route 
          path="/" 
          element={
            api.isAuthenticated() ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Landing />
            )
          } 
        />

        {/* Auth page */}
        <Route 
          path="/login" 
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } 
        />

        {/* Private Dashboard Portal pages */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/analyze" 
          element={
            <PrivateRoute>
              <Analyze />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/history" 
          element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />

        {/* Admin only page */}
        <Route 
          path="/admin" 
          element={
            <PrivateRoute>
              <AdminRoute>
                <Admin />
              </AdminRoute>
            </PrivateRoute>
          } 
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
