import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function DataCalendarWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [loggedDates, setLoggedDates] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchDates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('log_date');
      if (error) throw error;
      const dates = new Set(data.map(d => d.log_date));
      setLoggedDates(dates);
    } catch (e) {
      console.error("Error fetching dates for calendar:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchDates();
    }
  }, [isOpen]);

  const getLocalDateString = (d) => {
    // Para evitar problemas de UTC, construimos el string YYYY-MM-DD usando métodos locales
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Empezar semana en Lunes
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const blankCells = Array.from({ length: offset }, () => null);
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const today = new Date();
  const todayStr = getLocalDateString(today);
  
  const getDayStatus = (day) => {
    const checkDate = new Date(year, month, day);
    const dStr = getLocalDateString(checkDate);
    
    // Evitar contar como perdidos los días previos al inicio del sistema
    const startDate = "2026-03-26"; 
    
    // Fines de semana siempre en verde (o un verde pastel distinto si prefieres)
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';

    if (loggedDates.has(dStr)) return 'logged'; // Verde
    if (dStr < startDate) return 'future'; // Transparente para antes del límite
    if (dStr === todayStr) return 'today-missing'; // Amarillo
    if (dStr < todayStr) return 'past-missing'; // Rojo
    return 'future'; // Futuro sin datos o normal
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'logged': return 'var(--state-success)';
      case 'weekend': return 'rgba(0, 255, 127, 0.4)'; // Verde suave para fines de semana
      case 'no-school': return 'var(--neon-cyan)'; // Azul para días marcados como sin clase
      case 'past-missing': return 'var(--state-danger)';
      case 'today-missing': return 'var(--neon-yellow)';
      default: return 'rgba(255,255,255,0.05)';
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-neon secondary"
        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', borderRadius: '8px' }}
        title="Verificar Días Registrados"
      >
        <CalendarIcon size={16} /> Verificar Días
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel pulse-neon" style={{ width: '400px', maxWidth: '90%', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--neon-cyan)', textAlign: 'center' }}>Auditoría de Registros</h3>

            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--neon-cyan)' }}>Cargando datos...</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronLeft /></button>
                  <strong style={{ textTransform: 'capitalize', color: 'var(--neon-purple)' }}>
                    {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                  </strong>
                  <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronRight /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                  {blankCells.map((_, i) => (
                    <div key={`blank-${i}`} style={{ padding: '0.5rem' }}></div>
                  ))}
                  {dayCells.map(day => {
                    const status = getDayStatus(day);
                    const isToday = getLocalDateString(new Date(year, month, day)) === todayStr;
                    return (
                      <div 
                        key={day}
                        style={{
                          background: getStatusColor(status),
                          color: status === 'today-missing' || status === 'logged' ? '#000' : '#fff',
                          fontWeight: 'bold',
                          padding: '0.5rem',
                          borderRadius: '8px',
                          border: isToday ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                          opacity: status === 'future' ? 0.3 : 1
                        }}
                        title={status === 'logged' ? 'Registrado' : status === 'past-missing' ? 'Día perdido' : status === 'today-missing' ? 'Falta hoy' : ''}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '15px', height: '15px', background: 'var(--state-success)', borderRadius: '4px' }}></div> Registros listos
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '15px', height: '15px', background: 'rgba(0, 255, 127, 0.4)', borderRadius: '4px' }}></div> Fin de semana
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '15px', height: '15px', background: 'var(--state-danger)', borderRadius: '4px' }}></div> Falta registrar
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '15px', height: '15px', background: 'var(--neon-yellow)', borderRadius: '4px' }}></div> Tienes que ingresarlo hoy
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
