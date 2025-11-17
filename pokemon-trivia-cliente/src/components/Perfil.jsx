import { useContext, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../App'
import { getProfile, getMyBestScores, getLeaderboard, updateAvatar } from '../services/api'

export default function Perfil() {
  const { token } = useContext(AuthContext)
  const navigate = useNavigate()
  
  // Estados para el perfil y estadísticas
  const [user, setUser] = useState(null)
  const [myStats, setMyStats] = useState([])
  
  // Estados para el Leaderboard (pestaña y top 5)
  const [topPlayers, setTopPlayers] = useState([])
  const [levelTab, setLevelTab] = useState('general') // Pestaña 'general' por defecto
  
  // Estados para el Modal (la parte que faltaba)
  const [showAllModal, setShowAllModal] = useState(false)
  const [fullLeaderboard, setFullLeaderboard] = useState([])

  // Estados para el Avatar
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [pokeName, setPokeName] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState(null)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    loadData();
  }, [token, navigate]);

  // Efecto para recargar el leaderboard (Top 5) cuando cambia la pestaña
  useEffect(() => {
    if(token) loadLeaderboard(levelTab);
  }, [levelTab]);

  const loadData = async () => {
    try {
      const userData = await getProfile();
      setUser(userData);
      const statsData = await getMyBestScores();
      setMyStats(statsData.stats || []);
      // Carga el leaderboard de la pestaña inicial ('general')
      loadLeaderboard(levelTab);
    } catch (e) { console.error("Error cargando perfil", e); }
  }

  const loadLeaderboard = async (lvl) => {
    try {
        const data = await getLeaderboard(lvl, 5); // Pedimos solo 5 para la vista principal
        setTopPlayers(data.top);
    } catch(e) {}
  }

  // --- ¡AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA! ---
  const openFullLeaderboard = async () => {
      try {
        const data = await getLeaderboard(levelTab); // Sin limite, pide todos
        setFullLeaderboard(data.top);
        setShowAllModal(true); // Abre el modal
      } catch (e) {
        console.error("Error al cargar leaderboard completo", e);
      }
  }

  const handleUpdateAvatar = async (type) => {
      setAvatarLoading(true);
      setAvatarError(null);
      try {
          const res = await updateAvatar(type, pokeName);
          setUser(prev => ({ ...prev, profile_pic: res.profile_pic }));
          setShowAvatarMenu(false);
          setPokeName('');
      } catch (err) {
          setAvatarError(err.response?.data?.error || "Error al actualizar");
      } finally {
          setAvatarLoading(false);
      }
  }

  if (!user) return <div className="profile-container">Cargando Perfil...</div>

  // Verificamos si el usuario puede elegir avatar
  const canChoose = user.total_points >= user.unlock_threshold;

  return (
    <div className="profile-container">
      
      {/* --- SECCIÓN 1: TRAINER CARD (PERFIL REAL) --- */}
      <div className="trainer-card">
        <div className="trainer-avatar-container" style={{ position: 'relative' }}>
            <img 
                src={user.profile_pic} 
                alt="Avatar" 
                className="trainer-avatar-img"
                style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--poke-blue)', backgroundColor: 'white', imageRendering: 'pixelated' }}
            />
            <button 
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                style={{ position: 'absolute', bottom: -10, right: -10, borderRadius: '50%', width: 40, height: 40, padding: 0, fontSize: '1.2rem' }}
            >
                ✏️
            </button>
        </div>

        <div className="trainer-info">
            <h2>Entrenador {user.nombre}</h2>
            <div className="trainer-stats">
                <div className="stat-badge">⭐ Puntos Totales: {user.total_points}</div>
                <div className="stat-badge">🔥 Racha: {user.streak} días</div>
            </div>
        </div>
      </div>

      {/* --- SECCIÓN 1B: MENU DE AVATAR (Si se abre) --- */}
      {showAvatarMenu && (
          <div className="profile-card" style={{ border: '2px dashed var(--poke-blue)', backgroundColor: '#f0f8ff' }}>
              <h4>Cambiar Foto de Perfil</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => handleUpdateAvatar('random')} disabled={avatarLoading}>
                      🎲 ¡Quiero uno aleatorio!
                  </button>
                  
                  <div style={{ display: 'flex', gap: 5 }}>
                      <input 
                          type="text" 
                          placeholder={canChoose ? "Ej: Pikachu, Gengar..." : `Desbloquea a los ${user.unlock_threshold} pts`}
                          value={pokeName}
                          onChange={e => setPokeName(e.target.value)}
                          disabled={!canChoose || avatarLoading}
                          style={{ flex: 1, padding: 8, borderRadius: 8, border: '2px solid #ccc' }}
                      />
                      <button 
                        onClick={() => handleUpdateAvatar('specific')} 
                        disabled={!canChoose || avatarLoading || !pokeName}
                        style={{ opacity: canChoose ? 1 : 0.5 }}
                      >
                          Elegir
                      </button>
                  </div>
                  {!canChoose && <small style={{ color: 'var(--poke-red)' }}>* Gana más puntos jugando para elegir tu Pokémon favorito.</small>}
                  {avatarError && <div style={{ color: 'red', fontWeight: 'bold' }}>{avatarError}</div>}
              </div>
          </div>
      )}

      {/* --- SECCIÓN 2: MIS MEDALLAS (Estadísticas) --- */}
      <div className="profile-card">
        <h3>Mis Medallas (Mejores Puntajes)</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
            {[1, 2, 3].map(lvl => {
                const stat = myStats.find(s => s.level === lvl);
                return (
                    <div key={lvl} style={{ textAlign: 'center', opacity: stat ? 1 : 0.5 }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Nivel {lvl}</div>
                        <div style={{ color: 'var(--poke-blue)', fontSize: '1.5rem', fontFamily: 'var(--font-title)' }}>
                            {stat ? stat.best : '-'}
                        </div>
                        <div style={{ fontSize: '0.8rem' }}>
                            Último: {stat ? stat.last : '-'}
                        </div>
                        <Link to={`/juego/${lvl}`}><button style={{ padding: '5px 10px', fontSize: '0.8rem', marginTop: '5px' }}>Jugar</button></Link>
                    </div>
                )
            })}
        </div>
      </div>

      {/* --- SECCIÓN 3: LEADERBOARD INTERACTIVO (Con pestaña General) --- */}
      <div className="leaderboard-section">
        <h3>Ranking Mundial</h3>
        
        <div className="tabs">
            {/* Botón General */}
            <button 
                className={`tab-btn ${levelTab === 'general' ? 'active' : ''}`}
                onClick={() => setLevelTab('general')}
            >
                🏆 General
            </button>
            
            {/* Botones de Nivel */}
            {[1, 2, 3].map(lvl => (
                <button 
                    key={lvl} 
                    className={`tab-btn ${levelTab === lvl ? 'active' : ''}`}
                    onClick={() => setLevelTab(lvl)}
                >
                    Nivel {lvl}
                </button>
            ))}
        </div>

        <ul className="leaderboard-list">
            {topPlayers.map((p, idx) => (
                <li key={idx} className={`leaderboard-item ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                        <span>#{idx + 1} {p.nombre} {idx === 0 && '👑'}</span>
                    </div>
                    <span>
                        <strong>{levelTab === 'general' ? p.total_score : p.best}</strong> pts
                        {/* Mostramos la racha solo si el backend la provee (como en 'general') */}
                        {p.streak !== undefined && <span style={{fontSize: '0.8em', marginLeft: 5}}>(🔥{p.streak})</span>}
                    </span>
                </li>
            ))}
            {topPlayers.length === 0 && <li style={{padding: 20}}>Sin datos.</li>}
        </ul>

        <div style={{ marginTop: '20px' }}>
            {/* Este botón ahora llamará a la función definida */}
            <button onClick={openFullLeaderboard} style={{ backgroundColor: 'var(--poke-blue)', color: 'white' }}>
                Ver Ranking Completo
            </button>
        </div>
      </div>

      {/* --- ¡LA OTRA PARTE QUE FALTABA! El Modal --- */}
      {showAllModal && (
          <div className="modal-overlay" onClick={() => setShowAllModal(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h3>Ranking Completo - {levelTab === 'general' ? 'General' : `Nivel ${levelTab}`}</h3>
                  <ul className="leaderboard-list">
                    {fullLeaderboard.map((p, idx) => (
                        <li key={idx} className="leaderboard-item">
                            <span>#{idx + 1} {p.nombre}</span>
                            <span><strong>{levelTab === 'general' ? p.total_score : p.best}</strong> pts</span>
                        </li>
                    ))}
                  </ul>
                  <button onClick={() => setShowAllModal(false)} style={{ marginTop: '20px', width: '100%' }}>Cerrar</button>
              </div>
          </div>
      )}

    </div>
  )
}