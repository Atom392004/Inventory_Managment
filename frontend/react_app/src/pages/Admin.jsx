
import React, {useEffect, useState} from 'react'
import api from '../api'

export default function Admin(){
  const [users, setUsers] = useState([])
  useEffect(()=>{ load() },[])
  async function load(){
    try{ const r = await api.get('/admin/users'); setUsers(r.data) }catch(e){ console.error(e); }
  }
  async function toggle(id){ try{ await api.post('/admin/users/'+id+'/toggle_admin'); await load() }catch(e){ alert('Action failed') } }
  return (
    <div>
      <div className='card'><h2>Admin Console</h2>
        <div style={{marginTop:12}}>
          <table className='table'>
            <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Admin</th><th>Action</th></tr></thead>
            <tbody>{users.map(u=> (<tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.email||''}</td><td>{u.is_admin? 'Yes':'No'}</td><td><button onClick={()=>toggle(u.id)} className='btn'>Toggle</button></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
