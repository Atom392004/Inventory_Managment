
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import WarehousesPage from "./pages/WarehousesPage";
import WarehouseDetailPage from "./pages/WarehouseDetailPage";
import StockMovementsPage from "./pages/StockMovementsPage";
import ScrapedProductsPage from "./pages/ScrapedProductsPage";
import ProfilePage from "./pages/ProfilePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PendingApprovalsPage from "./pages/PendingApprovalsPage";
import UserManagementPage from "./pages/UserManagementPage";
import NotFoundPage from "./pages/NotFoundPage";
import { AuthProvider, useAuth } from "./state/auth";
import RegisterPage from "./pages/RegisterPage";

function Protected({ children }){
  const { token } = useAuth();
  if(!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App(){
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage/>}/>
        
        <Route path="/" element={
          <Protected>
            <Layout />
          </Protected>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="warehouses" element={<WarehousesPage />} />
          <Route path="warehouses/:id" element={<WarehouseDetailPage />} />
          <Route path="stock-movements" element={<StockMovementsPage />} />
          <Route path="scraped-products" element={<ScrapedProductsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="pending-approvals" element={<PendingApprovalsPage />} />
          <Route path="user-management" element={<UserManagementPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
