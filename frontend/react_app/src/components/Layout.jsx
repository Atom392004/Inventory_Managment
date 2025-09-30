
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Nav({onLogout}){
  const token = localStorage.getItem('token')
  const isAdmin = localStorage.getItem('is_admin') === 'true'
  const navigate = useNavigate()
  function logout(){ localStorage.removeItem('token'); localStorage.removeItem('is_admin'); navigate('/login') }
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <Link to="/"><strong style={{color:'white'}}>Inventory</strong></Link>
        <nav style={{display:'flex',gap:8}}>
          <Link to="/products">Products</Link>
          <Link to="/warehouses">Warehouses</Link>
          <Link to="/stock-movements">Stock Movements</Link>
          <Link to="/scraped-products">Scraped Products</Link>
          {isAdmin && <Link to="/admin">Admin</Link>}
        </nav>
      </div>
      <div>
        {!token ? <Link to="/login" style={{background:'white',padding:'8px 10px',borderRadius:8}}>Login</Link> : <button onClick={logout} className='btn'>Logout</button>}
      </div>
    </div>
  )
}

export default function Layout({children}){
  return (
    <div>
      <header className="header container"><Nav/></header>
      <main className="container" style={{marginTop:16}}>{children}</main>
    </div>
  )
}
