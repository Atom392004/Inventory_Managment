
import React, {useEffect, useState} from 'react'
import api from '../api'

export default function StockMovements(){
  const [moves, setMoves] = useState([])
  useEffect(()=>{ async function l(){ try{ const r=await api.get('/stock_movements'); setMoves(r.data)}catch(e){}}; l() },[])
  return (
    <div>
      <div className='card'><h2>Stock Movements</h2>
        <div style={{marginTop:12}}>
          <table className='table'>
            <thead><tr><th>ID</th><th>Product</th><th>Warehouse</th><th>Qty</th><th>Type</th></tr></thead>
            <tbody>{moves.map(m=> (<tr key={m.id}><td>{m.id}</td><td>{m.product_name||m.product_id}</td><td>{m.warehouse_name||m.warehouse_id}</td><td>{m.quantity}</td><td>{m.type||m.movement_type||''}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
