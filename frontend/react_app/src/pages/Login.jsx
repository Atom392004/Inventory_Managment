
import React, {useState} from 'react'
import api from '../api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const nav = useNavigate()

  async function submit(e){
    e.preventDefault()
    try{
      const fd = new URLSearchParams()
      fd.append('username', username)
      fd.append('password', password)
      const res = await api.post('/auth/login', fd, { headers: {'Content-Type':'application/x-www-form-urlencoded'} })
      const token = res.data.access_token
      localStorage.setItem('token', token)
      // try to read user info (if endpoint exists) or mark admin by decoding not implemented; keep naive: call /admin/users to check permission
      try{
        const r = await api.get('/admin/users')
        localStorage.setItem('is_admin','true')
      }catch(e){ localStorage.setItem('is_admin','false') }
      nav('/')
    }catch(e){ alert('Login failed') }
  }

  return (
    <div style={{maxWidth:420,margin:'40px auto'}}>
      <div className='card'>
        <h2>Login</h2>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:10}}>
          <input className='input' placeholder='username or email' value={username} onChange={e=>setUsername(e.target.value)} required/>
          <input className='input' type='password' placeholder='password' value={password} onChange={e=>setPassword(e.target.value)} required/>
          <button className='btn' type='submit'>Login</button>
        </form>
      </div>
    </div>
  )
}
