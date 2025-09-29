// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  stock: number;
}

// Warehouse Types
export interface Warehouse {
  id: number;
  name: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehouseRequest {
  name: string;
  location: string;
}

// Stock Movement Types
export interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  created_at: string;
}

export interface CreateStockMovementRequest {
  product_id: number;
  warehouse_id: number;
  quantity: number;
  movement_type: 'IN' | 'OUT';
}