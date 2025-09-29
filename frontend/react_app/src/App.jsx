
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Products from './pages/Products'
import Warehouses from './pages/Warehouses'
import StockMovements from './pages/StockMovements'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Home from './pages/Home'

export default function App(){
  return (
    <Layout>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/products' element={<Products/>} />
        <Route path='/warehouses' element={<Warehouses/>} />
        <Route path='/stock-movements' element={<StockMovements/>} />
        <Route path='/admin' element={<Admin/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='*' element={<Navigate to='/'/>} />
      </Routes>
    </Layout>
  )
}
