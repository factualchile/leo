import { useState } from 'react';
import { Save, User, Clock, AlertCircle, Tag, CheckCircle, MessageSquare } from 'lucide-react';
import { supabase } from '../supabaseClient';

const PRESET_TAGS = {
  health: ['#dolor-estomago', '#dolor-cabeza', '#fatiga', '#insomnio', '#ansiedad'],
  social: ['#aislado', '#sociable', '#pelea-verbal', '#agresion-fisica', '#apoyo-amigos'],
  behavior: ['#desafiante', '#motivado', '#falta-respeto', '#evasion', '#colaborativo']
};

const SCHEDULE = {
  1: [ // Lunes
    { id: 1, time: '8:00 - 9:30', subject: 'Lenguaje' },
    { id: 2, time: '9:45 - 11:15', subject: 'Ciencias' },
    { id: 3, time: '11:30 - 13:00', subject: 'Historia / Matemática' },
    { id: 4, time: '13:15 - 14:45', subject: 'Inglés' }
  ],
  2: [ // Martes
    { id: 1, time: '8:00 - 9:30', subject: 'Historia' },
    { id: 2, time: '9:45 - 11:15', subject: 'Matemática' },
    { id: 3, time: '11:30 - 13:00', subject: 'Ética / Orientación' },
    { id: 4, time: '13:15 - 14:45', subject: 'Artes' }
  ],
  3: [ // Miércoles
    { id: 1, time: '8:00 - 9:30', subject: 'Historia' },
    { id: 2, time: '9:45 - 11:15', subject: 'Español' },
    { id: 3, time: '11:30 - 13:00', subject: 'Ciencias' },
    { id: 4, time: '13:15 - 14:45', subject: 'Lenguaje / Inglés' }
  ],
  4: [ // Jueves
    { id: 1, time: '8:00 - 9:30', subject: 'Música' },
    { id: 2, time: '9:45 - 11:15', subject: 'Inglés' },
    { id: 3, time: '11:30 - 13:00', subject: 'Educ. Física' },
    { id: 4, time: '13:15 - 14:45', subject: 'Tecnología' },
    { id: 5, time: '14:45 - Jornada Ext.', subject: 'Deporte' }
  ],
  5: [ // Viernes
    { id: 1, time: '8:00 - 9:30', subject: 'Ciencias / Inglés' },
    { id: 2, time: '9:45 - 11:15', subject: 'Lenguaje' },
    { id: 3, time: '11:30 - 13:00', subject: 'Matemática' },
    { id: 4, time: '13:15 - 14:45', subject: 'Geometría' }
  ],
  0: [], 6: [] // Fin de semana
};

export default function DailyForm({ onSave }) {
  const optStyle = { background: '#0f0f1a', color: '#fff' };

  const getLocalDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    date: getLocalDate(),
    generalScore: 5,
    blockStatus: {}, // stores block data: { '1': { status: 'attended', reason: '' } }
    pain: '',
    feeling: '',
    momOffice: false,
    momComments: '',
    pickupRequested: false,
    pickupTime: '',
    pickupComments: '',
    custody: 'Mama',
    healthTags: [],
    socialTags: [],
    behaviorTags: [],
    additionalData: '',
    leoMentions: '',
    dayType: 'normal' // 'normal', 'holiday', 'no_school'
  });

  const getDayOfWeek = () => {
    try {
      const d = new Date(formData.date + 'T12:00:00');
      return d.getDay();
    } catch(e) {
      return 1;
    }
  };
  
  const dayOfWeek = getDayOfWeek();
  const currentSchedule = SCHEDULE[dayOfWeek] || [];
  const maxBlocks = currentSchedule.length;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const updateBlockStatus = (blockId, field, value) => {
    setFormData(prev => ({
      ...prev,
      blockStatus: {
        ...prev.blockStatus,
        [blockId]: {
          ...(prev.blockStatus[blockId] || { status: 'attended', reason: '' }),
          [field]: value
        }
      }
    }));
  };

  const toggleTag = (category, tag) => {
    setFormData(prev => {
      const field = category;
      const arr = prev[field];
      if (arr.includes(tag)) {
        return { ...prev, [field]: arr.filter(t => t !== tag) };
      } else {
        return { ...prev, [field]: [...arr, tag] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      alert("Error: Supabase no está configurado. Revisa tu archivo .env");
      return;
    }

    try {
      let attendedTotal = 0;
      let outClassTotal = 0;
      let outSchoolTotal = 0;
      let missedLog = [];

      currentSchedule.forEach(block => {
        const st = formData.blockStatus[block.id] || { status: 'attended', reason: '' };
        if (st.status === 'attended') {
          attendedTotal++;
        } else if (st.status === 'out_class') {
          outClassTotal++;
          missedLog.push(`[${block.subject}] Fuera de clase: ${st.reason}`);
        } else if (st.status === 'out_school') {
          outSchoolTotal++;
          missedLog.push(`[${block.subject}] Fuera de colegio: ${st.reason}`);
        }
      });

      let missedString = missedLog.join(' | ');
      
      if (formData.dayType === 'holiday') {
        missedString = "[FERIADO/VACACIONES] " + missedString;
        attendedTotal = 0;
      } else if (formData.dayType === 'no_school') {
        missedString = "[DÍA SIN CLASES] " + missedString;
        attendedTotal = 0;
      }

      const { data, error } = await supabase
        .from('daily_logs')
        .insert([{
          log_date: formData.date,
          general_score: formData.generalScore,
          attended_classes: attendedTotal,
          missed_classes: missedString.trim(),
          pain_reported: formData.pain,
          emotional_state: formData.feeling,
          mom_office_visit: formData.momOffice,
          social_tags: formData.socialTags,
          behavior_tags: formData.behaviorTags,
          mom_comments: `${formData.momComments || ''}\n\n[Datos Adicionales]: ${formData.additionalData}\n[Menciones Leo]: ${formData.leoMentions}`.trim()
        }]);

      if (error) throw error;
      
      alert('Registro guardado exitosamente');
      onSave();
    } catch (error) {
      console.error('Error al guardar:', error.message);
      alert('Hubo un error al guardar el registro en Supabase.');
    }
  };

  const renderTagButtons = (options, currentArr, fieldName) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
      {options.map(tag => {
        const active = currentArr.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(fieldName, tag)}
            style={{
              background: active ? 'var(--neon-cyan)' : 'transparent',
              color: active ? '#000' : 'var(--text-secondary)',
              border: `1px solid ${active ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.2)'}`,
              borderRadius: '20px',
              padding: '0.3rem 0.8rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Tag size={12} /> {tag}
          </button>
        )
      })}
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 className="hud-title" style={{ fontSize: '1.8rem', color: 'var(--neon-cyan)' }}>Scanner Diario V2</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Sistema avanzado de registro clínico y educativo.</p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Sección Principal */}
        <section className="glass-panel">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', color: 'var(--neon-cyan)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Fecha de Reporte</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleChange} 
                  className="input-glass" 
                  style={{ width: '100%', color: 'transparent', zIndex: 1, background: 'transparent' }} 
                />
                <span style={{ position: 'absolute', left: '1rem', color: '#fff', pointerEvents: 'none', zIndex: 0 }}>
                  {formData.date ? `${formData.date.split('-')[2]}/${formData.date.split('-')[1]}/${formData.date.split('-')[0]}` : ''}
                </span>
              </div>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neon-purple)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <User size={16}/> Custodia del Día
              </label>
              <select name="custody" value={formData.custody} onChange={handleChange} className="input-glass" style={{ appearance: 'none' }}>
                <option value="Mama" style={optStyle}>Con Mamá (18 días)</option>
                <option value="Papa" style={optStyle}>Con Papá</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <span>Puntaje General del Día</span>
              <span style={{ color: formData.generalScore >= 7 ? 'var(--state-success)' : formData.generalScore <= 4 ? 'var(--state-danger)' : 'var(--state-warning)', fontWeight: 'bold' }}>
                {formData.generalScore} / 10
              </span>
            </label>
            <input 
              type="range" 
              name="generalScore" 
              min="1" max="10" 
              value={formData.generalScore} 
              onChange={handleChange} 
              style={{ width: '100%', accentColor: 'var(--neon-cyan)', cursor: 'pointer' }}
            />
          </div>
        </section>

        {/* Sección Académica & Conducta */}
        <section className="glass-panel" style={{ borderLeft: '3px solid var(--neon-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--neon-cyan)', margin: 0 }}>
              {maxBlocks > 0 ? `Distribución Académica (${maxBlocks} bloques hoy)` : 'Sin horario predefinido'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {[
                  { id: 'normal', label: 'Clases' },
                  { id: 'holiday', label: 'Feriado' },
                  { id: 'no_school', label: 'Sin Clase' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dayType: type.id }))}
                    style={{
                      background: formData.dayType === type.id ? 'var(--neon-cyan)' : 'transparent',
                      color: formData.dayType === type.id ? '#000' : 'var(--text-secondary)',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem', 
            opacity: formData.dayType !== 'normal' ? 0.3 : 1, 
            pointerEvents: formData.dayType !== 'normal' ? 'none' : 'auto', 
            transition: 'all 0.3s ease' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                
              {currentSchedule.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Fin de semana o día sin asignaturas registradas.</div>
              ) : (
                currentSchedule.map(block => {
                  const bs = formData.blockStatus[block.id] || { status: 'attended', reason: '' };
                  return (
                    <div key={block.id} style={{ paddingBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>{block.subject}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={12}/> {block.time}
                          </div>
                        </div>
                        <select className="input-glass" style={{ width: '160px', fontSize: '0.8rem', padding: '0.5rem' }} value={bs.status} onChange={(e) => updateBlockStatus(block.id, 'status', e.target.value)}>
                          <option value="attended" style={optStyle}>✓ Asistió (Normal)</option>
                          <option value="out_class" style={optStyle}>⚠️ Fuera de clase</option>
                          <option value="out_school" style={optStyle}>🚨 Fuera de colegio</option>
                        </select>
                      </div>
                      {bs.status !== 'attended' && (
                        <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: `2px solid ${bs.status === 'out_class' ? 'var(--state-warning)' : 'var(--state-danger)'}` }}>
                          <input 
                            type="text" 
                            placeholder={bs.status === 'out_class' ? "Motivo del bloque fuera de clase..." : "Motivo general de ausencia en este bloque..."}
                            className="input-glass" 
                            style={{ fontSize: '0.85rem', width: '100%' }} 
                            value={bs.reason} 
                            onChange={(e) => updateBlockStatus(block.id, 'reason', e.target.value)} 
                            required 
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            
            <div style={{marginTop: '0.5rem'}}>
              <label style={{ color: '#fff', fontWeight: '500' }}>Etiquetas de Conducta Múltiples:</label>
              {renderTagButtons(PRESET_TAGS.behavior, formData.behaviorTags, 'behaviorTags')}
            </div>
          </div>
        </section>

        {/* Sección Bienestar y Emociones */}
        <section className="glass-panel" style={{ borderLeft: '3px solid var(--neon-purple)' }}>
          <h3 style={{ color: 'var(--neon-purple)', margin: '0 0 1rem 0' }}>Salud Física y Social</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Salud y Dolor */}
            <div>
              <label style={{ color: '#fff', fontWeight: '500' }}>Salud y Molestias (Tags):</label>
              {renderTagButtons(PRESET_TAGS.health, formData.healthTags, 'healthTags')}
              <input type="text" name="pain" value={formData.pain} onChange={handleChange} className="input-glass" style={{ marginTop: '0.8rem' }} placeholder="Detalles de salud (Ej: vomitó en el almuerzo)" />
            </div>

            {/* Social */}
            <div>
              <label style={{ color: '#fff', fontWeight: '500' }}>Interacción Social (Tags):</label>
              {renderTagButtons(PRESET_TAGS.social, formData.socialTags, 'socialTags')}
              <input type="text" name="feeling" value={formData.feeling} onChange={handleChange} className="input-glass" style={{ marginTop: '0.8rem' }} placeholder="¿Cómo dice que se sintió emocionalmente?" />
            </div>
            
          </div>
        </section>

        {/* Sección Observaciones y Comentarios de Leo */}
        <section className="glass-panel" style={{ borderLeft: '3px solid var(--neon-yellow)' }}>
          <h3 style={{ color: 'var(--neon-yellow)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={20} /> Observaciones Generales
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Datos adicionales</label>
              <textarea name="additionalData" value={formData.additionalData} onChange={handleChange} className="input-glass" rows="3" placeholder="Otras observaciones relevantes del día..." />
            </div>
            <div>
              <label style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>¿Qué mencionó Leo sobre el día de hoy?</label>
              <textarea name="leoMentions" value={formData.leoMentions} onChange={handleChange} className="input-glass" rows="3" placeholder="Palabras o comentarios de Leo..." />
            </div>
          </div>
        </section>

        {/* Sección Incidencias Específicas */}
        <section className="glass-panel" style={{ borderLeft: '3px solid var(--state-warning)' }}>
          <h3 style={{ color: 'var(--state-warning)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} /> Sucesos Extraordinarios
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Oficina Mamá */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ color: '#fff' }}>¿Fue a la oficina de la mamá?</label>
                <label className="toggle-switch">
                  <input type="checkbox" name="momOffice" checked={formData.momOffice} onChange={handleChange} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {formData.momOffice && (
                <textarea name="momComments" value={formData.momComments} onChange={handleChange} className="input-glass" placeholder="¿Qué le dijo la mamá?" rows="2" />
              )}
            </div>

            {/* Retiro Anticipado */}
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ color: '#fff' }}>¿Solicitó que lo fueran a buscar?</label>
                <label className="toggle-switch">
                  <input type="checkbox" name="pickupRequested" checked={formData.pickupRequested} onChange={handleChange} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              {formData.pickupRequested && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Clock size={20} color="var(--text-secondary)" />
                    <input type="time" name="pickupTime" value={formData.pickupTime} onChange={handleChange} className="input-glass" style={{ width: '150px' }} />
                  </div>
                  <textarea name="pickupComments" value={formData.pickupComments} onChange={handleChange} className="input-glass" placeholder="¿Qué dijo/sucedió después que lo buscaron?" rows="2" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn-neon" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 3rem' }}>
            <Save size={20} /> GRABAR DATOS
          </button>
        </div>

      </form>
    </div>
  );
}
