// pokemon-trivia-cliente/src/App.jsx
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, createContext, useContext } from 'react'
import './App.css' 
import Login from './components/Login'
import Registro from './components/Registro'
import JuegoTrivia from './components/JuegoTrivia' 
import Perfil from './components/Perfil'

import { logout as apiLogout } from './services/Api'

const AuthContext = createContext(null)

function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, setToken } = useContext(AuthContext)
  
  const onLogout = () => {
    apiLogout();
    setToken(null);
    navigate('/login'); // Mejor ir a login que a home
  }

  // Ocultar header en login/registro si quieres un look más limpio, opcional
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/"><h1>Pokémon Trivia</h1></Link>
      </header>
      
      <nav className="app-nav">
        <Link to="/"><button>Inicio</button></Link>
        
        {!token && (
            <>
                <Link to="/login"><button>Login</button></Link>
                <Link to="/register"><button>Registro</button></Link>
            </>
        )}

        {token && (
          <>
            <Link to="/perfil"><button>Mi Perfil</button></Link> {/* Nombre cambiado */}
            <button onClick={onLogout} style={{ backgroundColor: 'var(--poke-red)', color: 'var(--poke-white)' }}>Salir</button>
          </>
        )}
      </nav>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registro />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/juego/:level" element={<JuegoTrivia />} />
        </Routes>
      </main>
    </div>
  )
}

function Home() {
  const { token } = useContext(AuthContext);
  return (
    <div className="home-container">
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif" alt="Pikachu" className="pokemon-sprite"/>
      <h2>¡Bienvenido a la Trivia Pokémon!</h2>
      
      {!token ? (
        <>
          <p>Demuestra que eres un Maestro Pokémon. Inicia sesión para guardar tu progreso.</p>
          <div className="play-buttons">
            <Link to="/login"><button>Entrar</button></Link>
            <Link to="/register"><button>Crear Cuenta</button></Link>
          </div>
        </>
      ) : (
         <>
          <p>¡Hola Entrenador! Elige tu desafío:</p>
           <div className="play-buttons">
            <Link to="/juego/1"><button>Nivel 1</button></Link>
            <Link to="/juego/2"><button>Nivel 2</button></Link>
            <Link to="/juego/3"><button>Nivel 3</button></Link>
          </div>
        </>
      )}
    </div>
  )
}

function MainApp() {
  // Inicializar estado leyendo localStorage directamente para evitar el 'flash' de estado incorrecto
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  return (
    <AuthContext.Provider value={{ token, setToken }}>
      <Layout />
    </AuthContext.Provider>
  )
}

export default MainApp
export { AuthContext }