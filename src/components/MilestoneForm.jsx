import { useState } from 'react';
import { Save, Milestone } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function MilestoneForm({ onSave }) {
  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    date: getLocalDate(),
    category: 'Psiquiatria',
    subject: '', // for profesor de asignatura
    title: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert("Error: Supabase no está configurado.");
      return;
    }
    
    try {
      // Si es profesor de asignatura, adjuntamos la asignatura al título o categoría
      const finalCategory = formData.category === 'Profesor de asignatura' && formData.subject 
        ? `Profesor de asignatura (${formData.subject})`
        : formData.category;

      const { error } = await supabase
        .from('clinical_milestones')
        .insert([{
          milestone_date: formData.date,
          category: finalCategory,
          title: formData.title,
          description: formData.description
        }]);

      if (error) throw error;
      alert('Hito registrado exitosamente');
      setFormData({...formData, title: '', description: '', subject: ''});
      if(onSave) onSave();
    } catch (error) {
      console.error('Error al guardar hito:', error.message);
      alert('Error al guardar el hito.');
    }
  };

  // Helper para obligar fondo oscuro nativo en options (Windows/Chrome)
  const optStyle = { background: '#0f0f1a', color: '#fff' };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 className="hud-title" style={{ fontSize: '1.8rem', color: 'var(--neon-yellow)' }}>Registro de Hito Clínico</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Marca eventos importantes que puedan afectar la tendencia emocional.</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '3px solid var(--neon-yellow)' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Fecha de Cambio</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange} 
                  className="input-glass" 
                  required 
                  style={{ width: '100%', color: 'transparent', zIndex: 1, background: 'transparent' }} 
                />
                <span style={{ position: 'absolute', left: '1rem', color: '#fff', pointerEvents: 'none', zIndex: 0 }}>
                  {formData.date ? `${formData.date.split('-')[2]}/${formData.date.split('-')[1]}/${formData.date.split('-')[0]}` : ''}
                </span>
              </div>
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Categoría / Profesional</label>
              <select name="category" value={formData.category} onChange={handleChange} className="input-glass" style={{ appearance: 'none' }} required>
                <option value="Psiquiatria" style={optStyle}>Psiquiatría (Ej: Meds)</option>
                <option value="Teraupeta Ocupacional" style={optStyle}>Terapeuta Ocupacional</option>
                <option value="Educadora Diferencial" style={optStyle}>Educadora Diferencial</option>
                <option value="Profesor jefe" style={optStyle}>Profesor Jefe</option>
                <option value="Profesor de asignatura" style={optStyle}>Profesor de asignatura</option>
                <option value="Inspectoria" style={optStyle}>Inspectoría</option>
                <option value="UTP" style={optStyle}>UTP</option>
                <option value="Rutina de Vida" style={optStyle}>Cambio de Rutina Crítico</option>
                <option value="Otro" style={optStyle}>Otro Evento Mayor</option>
              </select>
            </div>
          </div>
          
          {formData.category === 'Profesor de asignatura' && (
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--neon-yellow)', animation: 'fadeIn 0.3s' }}>
              <label style={{ color: 'var(--neon-yellow)', display: 'block', marginBottom: '0.5rem' }}>Asignatura de la incidencia:</label>
              <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="input-glass" placeholder="Ej: Matemáticas, Lenguaje..." required />
            </div>
          )}
        </div>

        <div>
          <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Título del Hito</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-glass" placeholder="Ej: Nuevo medicamento Adderall 10mg" required />
        </div>

        <div>
          <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Descripción / Notas adicionales</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="input-glass" rows="3" placeholder="Contexto sobre por qué se hizo este cambio..." />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn-neon" style={{ borderColor: 'var(--neon-yellow)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={20} /> GUARDAR HITO
          </button>
        </div>
      </form>
    </div>
  );
}
