
import React, {useEffect, useState} from 'react'
import api from '../api'

export default function Home(){
  const [stats, setStats] = useState({products:0, warehouses:0, movements:0})
  useEffect(()=>{
    async function load(){
      try{
        const p = await api.get('/products')
        const w = await api.get('/warehouses')
        const m = await api.get('/stock_movements')
        setStats({products: p.data.length, warehouses: w.data.length, movements: m.data.length})
      }catch(e){}
    }
    load()
  },[])
  return (
    <div>
      <div className='card'>
        <h2>Overview</h2>
        <div className='kpi' style={{marginTop:12}}>
          <div className='item'><div className='small'>Products</div><h3>{stats.products}</h3></div>
          <div className='item'><div className='small'>Warehouses</div><h3>{stats.warehouses}</h3></div>
          <div className='item'><div className='small'>Stock Movements</div><h3>{stats.movements}</h3></div>
        </div>
      </div>
      <div className='card'>
        <h3>Quick Actions</h3>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <a href="/products" className='btn'>Manage Products</a>
          <a href="/warehouses" className='btn'>Manage Warehouses</a>
        </div>
      </div>
    </div>
  )
}
