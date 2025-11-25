import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/api'
import { AuthContext } from '../App' // Importamos el contexto
import './Forms.css' // Importar estilos de formulario

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { setToken } = useContext(AuthContext) // Para guardar el token

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const token = await login(email, password) // Llama a la API (falsa)
      setToken(token) // Guarda el token en el estado global
      navigate('/perfil') // ¡Nos manda al perfil!
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-container">
      <h3>Login</h3>
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
      <button type="submit">Entrar</button>
      {error && <div className="form-error">{error}</div>}
    </form>
  )
}