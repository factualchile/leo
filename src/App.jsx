import { useState } from 'react';
import { Activity, LayoutDashboard, PlusCircle, Settings, UserCircle, Flag, Lock, ShieldCheck } from 'lucide-react';
import DashboardView from './components/DashboardView';
import DailyForm from './components/DailyForm';
import MilestoneForm from './components/MilestoneForm';
import InsightsView from './components/InsightsView';
import DataCalendarWidget from './components/DataCalendarWidget';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '310514') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)'
      }}>
        <form onSubmit={handleLogin} className="glass-panel pulse-neon" style={{ 
          width: '400px', 
          padding: '3rem', 
          textAlign: 'center',
          border: error ? '2px solid var(--state-danger)' : '1px solid var(--neon-cyan)',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'rgba(0, 243, 255, 0.1)', 
              borderRadius: '50%', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              margin: '0 auto 1rem auto',
              border: '1px solid var(--neon-cyan)',
              boxShadow: '0 0 15px rgba(0, 243, 255, 0.3)'
            }}>
              <Lock size={32} color="var(--neon-cyan)" />
            </div>
            <h1 className="hud-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>LEO CCSP</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ACCESO RESTRINGIDO - FILTRO CLÍNICO</p>
          </div>

          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="CÓDIGO DE ACCESO"
              autoFocus
              className="input-glass"
              style={{ 
                textAlign: 'center', 
                fontSize: '1.2rem', 
                letterSpacing: '5px',
                borderColor: error ? 'var(--state-danger)' : 'rgba(255,255,255,0.2)'
              }}
            />
            {error && (
              <div style={{ 
                marginTop: '0.5rem', 
                color: 'var(--state-danger)', 
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                CÓDIGO INVÁLIDO - ACCESO DENEGADO
              </div>
            )}
          </div>

          <button type="submit" className="btn-neon" style={{ width: '100%', padding: '1rem' }}>
            DESBLOQUEAR SISTEMA
          </button>
          
          <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>
            ENCRYPTED BIOMETRIC LINK v2.4
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <aside className="glass-panel" style={{ width: '280px', margin: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <h1 className="hud-title" style={{ fontSize: '2rem', margin: '0' }}>LEO</h1>
          <span style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
            System Analytics
          </span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '2rem' }}>
          <button 
            className={`btn-neon ${activeTab !== 'dashboard' ? 'secondary' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          
          <button 
            className={`btn-neon ${activeTab !== 'registro' ? 'secondary' : ''}`}
            onClick={() => setActiveTab('registro')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}
          >
            <PlusCircle size={20} /> Nuevo Registro
          </button>

          <button 
            className={`btn-neon ${activeTab !== 'hitos' ? 'secondary' : ''}`}
            onClick={() => setActiveTab('hitos')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderColor: activeTab === 'hitos' ? 'var(--neon-yellow)' : 'var(--neon-purple)' }}
          >
            <Flag size={20} /> Agregar Hito Clínico
          </button>
          
          <button 
            className={`btn-neon ${activeTab !== 'insights' ? 'secondary' : ''}`}
            onClick={() => setActiveTab('insights')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderColor: activeTab === 'insights' ? 'var(--neon-cyan)' : 'var(--neon-purple)' }}
          >
            <Activity size={20} /> Insights AI (GPT-4)
          </button>
        </nav>

        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', padding: '0 1rem' }}>
          <DataCalendarWidget />
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={32} color="var(--state-success)" />
          <div style={{ fontSize: '0.9rem' }}>
            <div>Admin: <strong>Claudio</strong></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--state-success)' }}>SISTEMA SEGURO</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1rem 1rem 1rem 0' }}>
        <div className="glass-panel" style={{ height: '100%', minHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'registro' && <DailyForm onSave={() => setActiveTab('dashboard')} />}
          {activeTab === 'hitos' && <MilestoneForm onSave={() => setActiveTab('dashboard')} />}
          {activeTab === 'insights' && <InsightsView />}
        </div>
      </main>
    </div>
  );
}

export default App;

