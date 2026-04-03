import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ReferenceLine } from 'recharts';
import { AlertTriangle, TrendingUp, Calendar, ShieldAlert, Filter, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

// Datos reales se obtienen de Supabase
export default function DashboardView() {
  const [timeRange, setTimeRange] = useState('semana');
  const [data, setData] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!supabase) return;

      const now = new Date();
      let startDate = new Date();
      if (timeRange === 'semana') startDate.setDate(now.getDate() - 7);
      else if (timeRange === 'mes') startDate.setMonth(now.getMonth() - 1);
      else startDate.setFullYear(now.getFullYear() - 1);

      const { data: logs, error: logError } = await supabase
        .from('daily_logs')
        .select('*')
        .gte('log_date', startDate.toISOString().split('T')[0])
        .order('log_date', { ascending: true });

      if (logError) throw logError;

      const { data: miles, error: mileError } = await supabase
        .from('clinical_milestones')
        .select('*')
        .gte('milestone_date', startDate.toISOString().split('T')[0]);

      if (mileError) throw mileError;

      if (logs && logs.length > 0) {
        const sum = logs.reduce((acc, curr) => acc + curr.general_score, 0);
        setAvgScore((sum / logs.length).toFixed(1));
      } else {
        setAvgScore(0);
      }

      setData(logs || []);
      setMilestones(miles || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      if (timeRange === 'semana') return d.toLocaleDateString('es-ES', { weekday: 'short' });
      // Forzado a dd/mm para evitar saturar el eje en mensual
      if (timeRange === 'mes') return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      return d.toLocaleDateString('es-ES', { month: 'short' });
    } catch(e) { return dateStr; }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--neon-cyan)' }}>
        <Loader2 className="animate-spin" size={48} style={{ animation: 'spin 2s linear infinite' }} />
        <span style={{ marginTop: '1rem', fontSize: '1.2rem', fontFamily: 'Outfit' }}>Sincronizando con Supabase...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '2rem' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--neon-cyan)' }}>Panorama General V2</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Análisis de métricas por período.</p>
        </div>
        
        <div style={{ textAlign: 'right', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '0.2rem' }}>
            {['semana', 'mes', 'año'].map(tab => (
              <button
                key={tab}
                onClick={() => setTimeRange(tab)}
                style={{
                  background: timeRange === tab ? 'var(--neon-cyan)' : 'transparent',
                  color: timeRange === tab ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1', color: parseFloat(avgScore) >= 7 ? 'var(--state-success)' : 'var(--state-warning)', textShadow: `0 0 20px ${parseFloat(avgScore) >= 7 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}` }}>
              {avgScore}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Score Promedio</span>
          </div>
        </div>
      </header>

      <div className="charts-grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <section className="glass-panel" style={{ gridColumn: timeRange === 'año' ? 'span 2' : '1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', color: 'var(--neon-cyan)' }}>
            <Calendar size={20} /> Asistencia Académica
          </h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="log_date" tickFormatter={formatXAxis} stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{ backgroundColor: 'var(--bg-card-hover)', border: 'var(--glass-border)' }}
                  labelFormatter={(val) => {
                    const d = new Date(val + 'T12:00:00');
                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                  }}
                />
                <Bar dataKey="attended_classes" name="Asistidas" fill="var(--neon-cyan)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass-panel" style={{ gridColumn: timeRange === 'año' ? 'span 2' : '2' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0', color: 'var(--neon-purple)' }}>
            <Activity size={20} /> Tendencia Emocional
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="log_date" tickFormatter={formatXAxis} stroke="var(--text-secondary)" />
                <YAxis domain={[0, 10]} stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card-hover)', border: 'var(--glass-border)' }}
                  labelFormatter={(val) => {
                    const d = new Date(val + 'T12:00:00');
                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                  }}
                />
                
                {milestones.map(m => (
                  <ReferenceLine key={m.id} x={m.milestone_date} stroke="var(--neon-yellow)" strokeDasharray="3 3" strokeWidth={2} />
                ))}

                <Line 
                  type="monotone" 
                  dataKey="general_score" 
                  name="Puntaje"
                  stroke="var(--neon-purple)" 
                  strokeWidth={3} 
                  dot={{ r: 6, fill: 'var(--bg-color)', strokeWidth: 2, stroke: 'var(--neon-purple)' }} 
                  activeDot={{ r: 8, fill: 'var(--neon-cyan)' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {milestones.length > 0 && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {milestones.map(m => {
                const d = new Date(m.milestone_date + 'T12:00:00');
                const fmt = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                return (
                  <div key={m.id} style={{ fontSize: '0.7rem', color: 'var(--neon-yellow)', border: '1px solid var(--neon-yellow)', padding: '2px 8px', borderRadius: '4px' }}>
                    {fmt}: {m.title}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {data.filter(l => l.general_score <= 4 || l.pickup_requested).length > 0 && (
        <section className="glass-panel pulse-warning" style={{ borderLeft: '4px solid var(--neon-magenta)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neon-magenta)', margin: '0 0 1rem 0' }}>
            <ShieldAlert size={20} /> Alertas Críticas Detectadas
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.filter(l => l.general_score <= 4 || l.pickup_requested).slice(-3).reverse().map(log => {
              const d = new Date(log.log_date + 'T12:00:00');
              const formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
              return (
                <li key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 0, 60, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                  <AlertTriangle color="var(--neon-magenta)" size={24} />
                  <div>
                    <strong style={{ color: '#fff' }}>{formattedDate}:</strong> 
                    {log.general_score <= 4 ? ` Puntaje bajo (${log.general_score}). ` : ''}
                    {log.pickup_requested ? ' Solicitó retiro anticipado. ' : ''}
                    {log.missed_classes ? ` Clases: ${log.missed_classes}` : ''}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
