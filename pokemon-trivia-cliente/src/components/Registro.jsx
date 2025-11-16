import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../services/Api'
import './Forms.css' // Importar estilos de formulario

export default function Registro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      await register(email, password)
      navigate('/login') // Si el registro funciona, manda a login
    } catch (err) {
      // Usamos el error de nuestra API falsa
      setError(err.message) 
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-container">
      <h3>Registro</h3>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Crear cuenta</button>
      {error && <div className="form-error">{error}</div>}
    </form>
  )
}