
import React, {useState} from 'react'

function Header({onLogin, token, setToken}){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function login(e){
    e.preventDefault()
    try{
      const fd = new URLSearchParams()
      fd.append('username', username)
      fd.append('password', password)
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: fd
      })
      if(!res.ok) throw new Error('Login failed')
      const data = await res.json()
      setToken(data.access_token)
      onLogin(true)
    }catch(err){
      alert(err.message || err)
    }
  }

  return (
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px',background:'#0f172a',color:'white'}}>
      <div style={{fontSize:20,fontWeight:700}}>Inventory Admin</div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        {!token ? (
          <form onSubmit={login} style={{display:'flex',gap:8}}>
            <input required placeholder='username/email' value={username} onChange={e=>setUsername(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid #334155'}}/>
            <input required type='password' placeholder='password' value={password} onChange={e=>setPassword(e.target.value)} style={{padding:8,borderRadius:8,border:'1px solid #334155'}}/>
            <button style={{padding:'8px 12px',borderRadius:8,background:'#4f46e5',color:'white',border:0}}>Login</button>
          </form>
        ) : (
          <button onClick={()=>{setToken(null)}} style={{padding:'8px 12px',borderRadius:8,background:'#ef4444',color:'white',border:0}}>Logout</button>
        )}
      </div>
    </header>
  )
}

function UsersTable({users, onToggle}){
  return (
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr style={{textAlign:'left',background:'#f1f5f9'}}>
            <th style={{padding:12}}>ID</th><th>Username</th><th>Email</th><th>Admin</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u=>(
            <tr key={u.id} style={{borderBottom:'1px solid #e2e8f0'}}>
              <td style={{padding:10}}>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email||''}</td>
              <td>{u.is_admin? 'Yes':'No'}</td>
              <td><button onClick={()=>onToggle(u.id)} style={{padding:'6px 10px',borderRadius:8}}>Toggle</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Admin(){
  const [token, setToken] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  async function loadUsers(){
    if(!token){ alert('Please login first'); return }
    setLoading(true)
    try{
      const res = await fetch('/admin/users', {headers: {'Authorization':'Bearer '+token}})
      if(!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data)
    }catch(err){
      alert(err.message||err)
    }finally{ setLoading(false) }
  }

  async function toggle(id){
    if(!token){ alert('Please login first'); return }
    try{
      const res = await fetch('/admin/users/'+id+'/toggle_admin', {method:'POST', headers: {'Authorization':'Bearer '+token}})
      if(!res.ok) throw new Error('Toggle failed')
      await loadUsers()
    }catch(err){
      alert(err.message||err)
    }
  }

  return (
    <div style={{fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', minHeight:'100vh', background:'#f8fafc'}}>
      <Header onLogin={()=>loadUsers()} token={token} setToken={setToken} />
      <main style={{maxWidth:1000,margin:'28px auto',padding:20}}>
        <div style={{background:'white',padding:20,borderRadius:12,boxShadow:'0 8px 30px rgba(2,6,23,0.08)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <h2 style={{margin:0}}>Users</h2>
            <div style={{display:'flex',gap:8}}>
              <button onClick={loadUsers} style={{padding:'8px 12px',borderRadius:8}}>Refresh</button>
              <button onClick={()=>{}}>Export</button>
            </div>
          </div>

          {loading ? <div>Loading...</div> : <UsersTable users={users} onToggle={toggle} />}
        </div>
      </main>
    </div>
  )
}
