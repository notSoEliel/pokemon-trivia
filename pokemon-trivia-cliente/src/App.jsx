import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, createContext, useContext } from 'react'
import './App.css' // Importamos los estilos de App

// Importamos los componentes que creamos
import Login from './components/Login'
import Registro from './components/Registro'
import JuegoTrivia from './components/JuegoTrivia' // <-- ¡NUEVO!

// Importamos la API (falsa) para el perfil
import { getMyBestScores, getLeaderboard } from './services/Api'


// 1. Creamos el Contexto para la autenticación
const AuthContext = createContext(null)

// 2. Creamos el componente Layout (la estructura de la página)
function Layout() {
  const navigate = useNavigate()
  const { token, setToken } = useContext(AuthContext)
  
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    navigate('/')
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/"><h1>Pokémon Trivia</h1></Link>
      </header>
      
      <nav className="app-nav">
        <Link to="/"><button>Inicio</button></Link>
        {!token && <Link to="/login"><button>Login</button></Link>}
        {!token && <Link to="/register"><button>Registro</button></Link>}
        {token && <Link to="/perfil"><button>Perfil</button></Link>}
        {token && (
          <>
            {/* ¡Links de juego activados! */}
            <Link to="/juego/1"><button>Nivel 1</button></Link>
            <Link to="/juego/2"><button>Nivel 2</button></Link>
            <Link to="/juego/3"><button>Nivel 3</button></Link>
            <button onClick={logout} style={{ backgroundColor: 'var(--poke-red)', color: 'var(--poke-white)' }}>Salir</button>
          </>
        )}
      </nav>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Registro />} />
          <Route path="/perfil" element={<Perfil />} />
          {/* ¡Ruta de juego activada! */}
          <Route path="/juego/:level" element={<JuegoTrivia />} />
        </Routes>
      </main>
    </div>
  )
}

// 3. Creamos los componentes de las páginas
function Home() {
  const { token } = useContext(AuthContext);
  
  return (
    <div className="home-container">
      <img 
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif" 
        alt="Pikachu"
        className="pokemon-sprite"
      />
      <h2>¡Bienvenido a la Trivia Pokémon!</h2>
      
      {!token && (
        <>
          <p>Inicia sesión o regístrate para jugar.</p>
          <div className="play-buttons">
            <Link to="/login"><button>Login</button></Link>
            <Link to="/register"><button>Registro</button></Link>
          </div>
        </>
      )}

      {token && (
         <>
          <p>¡Hola! Elige un nivel para empezar a jugar.</p>
           <div className="play-buttons">
            <Link to="/juego/1"><button>Jugar Nivel 1</button></Link>
            <Link to="/juego/2"><button>Jugar Nivel 2</button></Link>
            <Link to="/juego/3"><button>Jugar Nivel 3</button></Link>
          </div>
        </>
      )}

    </div>
  )
}

// Perfil actualizado para cargar datos falsos
function Perfil() {
  const { token } = useContext(AuthContext)
  const navigate = useNavigate()
  const [best, setBest] = useState([])
  const [level, setLevel] = useState(1)
  const [top, setTop] = useState([])
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    let mounted = true
    async function load() {
      setLoading(true);
      try {
        // Usamos la API (falsa)
        const [me, board] = await Promise.all([
          getMyBestScores(token),
          getLeaderboard(level, token),
        ])
        if (!mounted) return
        setBest(me.bestByLevel || [])
        setTop(board.top || [])
      } catch (_) {
        // no-op
      } finally {
        setLoading(false);
      }
    }
    load()
    return () => { mounted = false }
  }, [token, navigate, level]) // Se recarga si cambias el 'level' del leaderboard

  const last = (() => {
    try {
      const raw = localStorage.getItem('lastResult')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()

  // Función para enmascarar email
  function maskEmail(email) {
    if (!email) return ''
    const [name, domain] = email.split('@')
    if (!domain) return email
    const visible = name.slice(0, 2)
    return `${visible}***@${domain}`
  }

  if (!token) return null; // Ya estamos protegidos por el useEffect, pero por si acaso

  return (
    <div className="profile-container">
      
      {last && (
        <div className="profile-card" style={{ background: 'var(--poke-yellow)' }}>
          <h3>¡Último resultado!</h3>
          <strong>Nivel {last.level}</strong> · Puntaje <strong>{last.score}</strong> · {new Date(last.date).toLocaleString()}
        </div>
      )}

      <div className="profile-card">
        <h3>Mejor puntaje por nivel</h3>
        {loading ? <p>Cargando...</p> : (
          <ul>
            {[1,2,3].map(l => {
              const item = best.find(b => b.level === l)
              return (
                <li key={l}>
                  <strong>Nivel {l}:</strong> {item ? item.best : 0} Pts.
                  <Link to={`/juego/${l}`} style={{ marginLeft: '1rem' }}><button>Jugar</button></Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="profile-card">
        <div className="leaderboard-header">
          <h3>Leaderboard</h3>
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))}>
            <option value={1}>Nivel 1</option>
            <option value={2}>Nivel 2</option>
            <option value={3}>Nivel 3</option>
          </select>
        </div>
        {loading ? <p>Cargando...</p> : (
          <ol>
            {top.map((r, idx) => (
              <li key={r.userId}>
                <strong>#{idx + 1}</strong> · {maskEmail(r.email)} · <strong>{r.best} Pts.</strong>
              </li>
            ))}
            {top.length === 0 && <li>¡Sé el primero en jugar!</li>}
          </ol>
        )}
      </div>
    </div>
  )
}


// 4. Creamos el componente raíz que "provee" el contexto
function MainApp() {
  const [token, setToken] = useState(null)
  
  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) setToken(t)
  }, [])

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      <Layout />
    </AuthContext.Provider>
  )
}

// 5. El ÚNICO export default
export default MainApp

// 6. Un export "nombrado" para el contexto
export { AuthContext }