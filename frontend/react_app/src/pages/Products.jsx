
import React, {useEffect, useState} from 'react'
import api from '../api'

export default function Products(){
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ load() },[])
  async function load(){
    setLoading(true)
    try{ const res=await api.get('/products'); setProducts(res.data) }catch(e){ alert('Failed to load products') }finally{ setLoading(false) }
  }

  return (
    <div>
      <div className='card'><h2>Products</h2>
        <div style={{marginTop:12}}>
          {loading ? 'Loading...' : (
            <table className='table'>
              <thead><tr><th>ID</th><th>Name</th><th>SKU</th><th>Qty</th></tr></thead>
              <tbody>{products.map(p=> (<tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.sku||''}</td><td>{p.quantity||0}</td></tr>))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
