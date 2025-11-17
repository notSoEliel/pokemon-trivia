import React, { useState, useEffect } from 'react';

// --- Funciones de Ayuda para Fechas (en zona horaria local) ---

// Devuelve un string "HH:MM:SS"
const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// --- Componente Principal ---
export default function StreakTracker({ streak, lastPlayed }) {
  const [timeRemaining, setTimeRemaining] = useState('');

  // 1. Convertir todo a fechas locales (en formato YYYY-MM-DD)
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // "2025-11-17"
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA'); // "2025-11-16"

  // 2. Determinar el estado de la racha
  let status = 'none'; // 'none', 'played_today', 'can_play_today', 'streak_broken'
  
  if (lastPlayed === todayStr) {
      status = 'played_today';
  } else if (lastPlayed === yesterdayStr) {
      status = 'can_play_today'; // Jugó ayer, puede jugar hoy
  } else if (streak > 0 && lastPlayed !== null) {
      status = 'streak_broken'; // Tenía racha, pero no jugó ayer
  }
  // 'none' = racha 0 y/o nunca ha jugado

  // 3. Efecto para el contador regresivo
  useEffect(() => {
    // Solo activa el timer si está en estado "can_play_today"
    if (status !== 'can_play_today') return; 

    const calculateTimeRemaining = () => {
      const now = new Date();
      // Calcula el tiempo hasta la medianoche (en la zona horaria local)
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, -1);
      const msRemaining = endOfDay - now;
      
      if (msRemaining > 0) {
        setTimeRemaining(formatTime(msRemaining));
      } else {
        // Por si acaso, si pasa la medianoche mientras ve la página
        setTimeRemaining("00:00:00"); 
      }
    };

    calculateTimeRemaining(); // Ejecuta una vez al cargar
    const interval = setInterval(calculateTimeRemaining, 1000); // Actualiza cada segundo

    return () => clearInterval(interval); // Limpia el intervalo
  }, [status]); // Se recalcula si el estado cambia

  
  // 4. Renderizar el mensaje correcto
  
  if (status === 'played_today') {
    return (
      <div className="streak-tracker played-today">
        <span className="icon">✅</span>
        <div className="text">
          <strong>Racha: {streak} días</strong>
          <small>¡Ya jugaste hoy! Vuelve mañana.</small>
        </div>
      </div>
    );
  }

  if (status === 'can_play_today') {
    return (
      <div className="streak-tracker can-play">
        <span className="icon">🔥</span>
        <div className="text">
          <strong>Racha: {streak} días</strong>
          <small>¡Juega hoy para no perderla!</small>
        </div>
        <div className="timer" title="Tiempo restante para jugar hoy">
          {timeRemaining}
        </div>
      </div>
    );
  }

  if (status === 'streak_broken') {
      return (
        <div className="streak-tracker none">
            <span className="icon">💔</span>
            <div className="text">
            <strong>Racha perdida ({streak} días)</strong>
            <small>¡Juega hoy para iniciar una nueva!</small>
            </div>
        </div>
      );
  }

  // Por defecto (status === 'none')
  return (
    <div className="streak-tracker none">
      <span className="icon">⚔️</span>
      <div className="text">
        <strong>Inicia tu racha</strong>
        <small>¡Juega una partida hoy!</small>
      </div>
    </div>
  );
}