import React from "react";
import WarehouseOwnerProductsPage from "./WarehouseOwnerProductsPage";
import UserProductsPage from "./UserProductsPage";
import { useAuth } from "../state/auth";

export default function ProductsPage() {
  const { user } = useAuth();

  if (user?.role === "admin" || user?.role === "warehouse_owner") {
    return <WarehouseOwnerProductsPage />;
  } else {
    return <UserProductsPage />;
  }
}
