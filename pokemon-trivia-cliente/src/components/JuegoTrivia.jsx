import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getGame, saveScore } from '../services/api'
import { AuthContext } from '../App'
import './JuegoTrivia.css' // Importar estilos del juego

export default function JuegoTrivia() {
  const { level } = useParams()
  const navigate = useNavigate()
  const { token } = useContext(AuthContext)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null) // 'correct' o 'incorrect'

  useEffect(() => {
    if (!token) {
      navigate('/login') // Si no hay token, fuera
      return
    }

    let mounted = true
    async function load() {
      try {
        setLoading(true)
        setError(null)
        setScore(0)
        setIdx(0)
        setFeedback(null)
        // Usamos la API (falsa) para obtener preguntas
        const data = await getGame(Number(level), token)
        if (!mounted) return
        setQuestions(data.questions || [])
      } catch (e) {
        setError('No se pudieron cargar preguntas.')
      } finally {
        setLoading(false)
      }
    }
    
    load()
    
    return () => {
      mounted = false
    }
  }, [level, token, navigate])

  const current = questions[idx]

  const onAnswer = async (opt) => {
    if (feedback) return // Evitar doble click

    const isCorrect = opt === current?.answer
    let finalScore = score;

    if (isCorrect) {
      setScore((s) => s + 1)
      setFeedback('correct')
      finalScore = score + 1;
    } else {
      setFeedback('incorrect')
    }

    // Pausa para mostrar feedback
    setTimeout(async () => {
      setFeedback(null)
      const next = idx + 1
      if (next < questions.length) {
        setIdx(next)
      } else {
        // Juego terminado
        try {
          // Usamos la API (falsa) para guardar
          await saveScore(finalScore, Number(level), token)
          localStorage.setItem('lastResult', JSON.stringify({
            level: Number(level),
            score: finalScore,
            date: new Date().toISOString(),
          }))
        } catch (e) {
          // ignorar si falla el guardado
        }
        navigate('/perfil') // Al terminar, vamos al perfil
      }
    }, 1000) // 1 segundo de feedback
  }

  if (loading) return <div className="trivia-loading">Cargando...</div>
  if (error) return <div className="trivia-error">{error}</div>
  if (!current) return <div className="trivia-error">No hay preguntas</div>

  // Dinamismo para el color de fondo durante el feedback
  const containerStyle = {}
  if (feedback === 'correct') {
    containerStyle.backgroundColor = '#d4edda'; // Verde suave
    containerStyle.borderColor = '#c3e6cb';
  } else if (feedback === 'incorrect') {
    containerStyle.backgroundColor = '#f8d7da'; // Rojo suave
    containerStyle.borderColor = '#f5c6cb';
  }

  return (
    <div className="trivia-container" style={containerStyle}>
      <div className="trivia-header">
        <strong>Pregunta {idx + 1} / {questions.length}</strong>
      </div>
      
      <div className="trivia-question-text">{current.question}</div>
      
      {current.image_url && (
        <img src={current.image_url} alt="pokemon" className="trivia-pokemon-image" />
      )}
      {current.name && (
        <div className="trivia-pokemon-name">{current.name}</div>
      )}

      <div className="trivia-options-grid">
        {current.options?.map((opt) => (
          <button 
            key={opt} 
            onClick={() => onAnswer(opt)} 
            className="trivia-option-button"
            disabled={!!feedback} // Deshabilitar botones durante el feedback
          >
            {opt}
          </button>
        ))}
      </div>
      
      <div className="trivia-score-display">Puntaje: {score}</div>
    </div>
  )
}