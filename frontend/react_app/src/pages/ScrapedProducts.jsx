import React, {useEffect, useState} from 'react'
import api from '../api'

export default function ScrapedProducts(){
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ load() },[])
  async function load(){
    setLoading(true)
    try{ const res=await api.get('/scraped-products'); setProducts(res.data) }catch(e){ alert('Failed to load scraped products') }finally{ setLoading(false) }
  }

  return (
    <div>
      <div className='card'><h2>Scraped Products</h2>
        <div style={{marginTop:12}}>
          {loading ? 'Loading...' : (
            <table className='table'>
              <thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Category</th><th>Price</th><th>Rating</th><th>Availability</th></tr></thead>
              <tbody>{products.map(p=> (<tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.description||''}</td><td>{p.category||''}</td><td>{p.price}</td><td>{p.rating||''}</td><td>{p.availability||''}</td></tr>))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
