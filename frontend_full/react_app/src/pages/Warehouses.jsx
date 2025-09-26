
import React, {useEffect, useState} from 'react'
import api from '../api'

export default function Warehouses(){
  const [items, setItems] = useState([])
  useEffect(()=>{ async function l(){ try{ const r=await api.get('/warehouses'); setItems(r.data)}catch(e){}}; l() },[])
  return (
    <div>
      <div className='card'><h2>Warehouses</h2>
        <div style={{marginTop:12}}>
          <table className='table'>
            <thead><tr><th>ID</th><th>Name</th><th>Location</th></tr></thead>
            <tbody>{items.map(w=> (<tr key={w.id}><td>{w.id}</td><td>{w.name}</td><td>{w.location||''}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
