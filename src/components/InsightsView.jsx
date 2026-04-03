import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { BrainCircuit, Loader2, Calendar, FileText, CheckCircle, Lightbulb } from 'lucide-react';

export default function InsightsView() {
  const [timeRange, setTimeRange] = useState('semana');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const generateInsights = async () => {
    setLoading(true);
    setErrorStatus(null);
    setReport(null);

    try {
      if (!supabase) throw new Error("Supabase no configurado");
      
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiKey) throw new Error("Clave de OpenAI no configurada en .env");

      // Calcular rango
      const now = new Date();
      let startDate = new Date();
      if (timeRange === 'semana') startDate.setDate(now.getDate() - 7);
      else if (timeRange === 'mes') startDate.setMonth(now.getMonth() - 1);
      else startDate.setFullYear(now.getFullYear() - 1);

      // Fetch Data
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

      if (!logs || logs.length === 0) {
        throw new Error("No hay suficientes datos en el periodo seleccionado para hacer un análisis.");
      }

      // Preparar data para IA
      const contextData = {
        rango_tiempo: timeRange,
        registros_diarios: logs.map(l => {
          const d = new Date(l.log_date + 'T12:00:00');
          const fmt = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          return {
            fecha: fmt,
            puntaje: l.general_score,
            custodia: l.custody_day,
            asistencias: `${l.attended_classes} asis, ${l.missed_classes ? l.missed_classes : '0 faltas'}`,
            dolor: l.pain_reported,
            salud: l.health_tags,
            social: l.social_tags,
            conducta: l.behavior_tags,
            estado_emocional: l.emotional_state,
            sucesos: { mom_office: l.mom_office_visit, pickup: l.pickup_requested }
          };
        }),
        hitos_clinicos: miles.map(m => {
          const d = new Date(m.milestone_date + 'T12:00:00');
          const fmt = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
          return `${fmt}: [${m.category}] ${m.title}`;
        })
      };

      const systemPrompt = `
      Eres el consultor clínico analítico senior personal de Leo, especializado en neuropsiquiatría infantojuvenil, psicología clínica y desarrollo neurocognitivo emocional. Trabajas en conjunto con su Psiquiatra, Terapeuta Ocupacional y Educadora Diferencial.
      Leo alterna 18 días al mes con su madre y el resto con su padre, lo que presenta un escenario particular de co-crianza bidireccional y posibles cruces de adherencia a normativas.

      Recibirás un JSON analítico con datos conductuales escolares, registros de afectación y dolor somático, etiquetas de ecosistema social y sucesos de contingencia (ej: escapes disruptivos a oficinas directivas o episodios que culminan en un retiro anticipado).
      
      **Tu deber es procesar esta matriz analítica bajo el más estricto lente clínico avanzado:**
      1. Evita un tono conversacional obvio. Aborda los datos utilizando un lenguaje técnico, formal y riguroso de las ciencias de la salud mental. Construye andamiajes psicoterapéuticos sólidos y perspectivas neurobiológicas.
      2. Descubre correlaciones implícitas y proyecciones sintomatológicas sin falsificar datos. Proyecta inferencias sobre fenómenos como angustia por separación, desregulación autonómica, evitación del estímulo adverso, somatización del conflicto, o factores ansiógenos subyacentes.
      3. IMPORTANTE: Todas las fechas redactadas en el documento final DEBEN reflejarse bajo el formato estricto dd/mm/yyyy.
      
      Redacta el informe pericial estructurando obligatoriamente los siguientes 3 ejes utilizando el exacto formato Markdown listado a continuación:
      
      ### 📊 Interpretación de Datos
      (Análisis descriptivo clínico. Traduce promedios estadísticos, cruce cuantitativo de variables conductuales frente al ausentismo selectivo o quejas de dolor. Utiliza una narrativa empírica y rigurosa basada pura y excluyentemente en los datos provistos.)
      
      ### 🧠 Conclusiones
      (Hipótesis etiológicas y factores de latencia. Desarrolla profundamente la dinámica psicosocial desde la psicología de esquemas y la neurofisiología inter-relacional. Teoriza sólidamente por qué eventos exógenos desencadenan o gatillan estados emocionales o actitudes disruptivas, apuntando a los vectores emocionales que podrían estar experimentando tanto la madre, el padre y Leo en triángulo.)
      
      ### 💡 Recomendaciones Accionables
      (Pautas de intervención directa multidisciplinarias. Instrucciones terapéuticas inmediatas orientadas al ajuste de fronteras familiares, estabilización de pautas de crianza coordinadas, directrices sensoriomotoras claras a derivar con la Terapeuta Ocupacional, y marcos de prescripción clínica a escalar de forma urgente con su Psiquiatra en la próxima interconsulta presencial.)
      `;

      // Llamada a OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analiza los siguientes datos de la temporalidad: ${timeRange}.\n\n` + JSON.stringify(contextData) }
          ],
          temperature: 0.7,
        })
      });

      const jsonResponse = await response.json();
      
      if (jsonResponse.error) {
        throw new Error(jsonResponse.error.message);
      }

      setReport(jsonResponse.choices[0].message.content);

    } catch (err) {
      console.error(err);
      setErrorStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatMarkdown = (text) => {
    // Dividir usando saltos de línea reales de la API
    return text.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <br key={idx} />; // Preservar saltos de texto vacíos

      // Estilización de Headers Clave
      if (trimmedLine.startsWith('### 📊')) return <h3 key={idx} style={{ color: 'var(--neon-cyan)', margin: '2rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(0, 255, 255, 0.2)', paddingBottom: '0.5rem' }}><FileText size={20}/> {trimmedLine.replace('### 📊', '')}</h3>;
      if (trimmedLine.startsWith('### 🧠')) return <h3 key={idx} style={{ color: 'var(--neon-purple)', margin: '2rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(176, 38, 255, 0.2)', paddingBottom: '0.5rem' }}><BrainCircuit size={20}/> {trimmedLine.replace('### 🧠', '')}</h3>;
      if (trimmedLine.startsWith('### 💡')) return <h3 key={idx} style={{ color: 'var(--neon-yellow)', margin: '2rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 0, 0.2)', paddingBottom: '0.5rem' }}><Lightbulb size={20}/> {trimmedLine.replace('### 💡', '')}</h3>;
      
      // Parseador dinámico para negritas nativas **ejemplo**
      const renderBold = (str) => {
        const parts = str.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} style={{ color: '#fff', fontWeight: '600' }}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      };

      // Si detecta viñeta con guión
      if (trimmedLine.startsWith('- ')) {
        return (
          <div key={idx} style={{ display: 'flex', marginBottom: '1rem', lineHeight: '1.6', paddingLeft: '1rem' }}>
            <span style={{ color: 'var(--neon-cyan)', marginRight: '0.8rem', marginTop: '2px' }}>•</span>
            <div>{renderBold(trimmedLine.replace('- ', ''))}</div>
          </div>
        );
      }
      
      // Párrafos convencionales
      return <p key={idx} style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1rem' }}>{renderBold(trimmedLine)}</p>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 className="hud-title" style={{ fontSize: '2.5rem', color: 'var(--neon-purple)', letterSpacing: '0' }}>MOTOR IA ANALÍTICO</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Escanea el historial completo de Leo en busca de correlaciones clínicas y de comportamiento usando GPT-4.</p>
      </header>

      {/* Control Panel */}
      <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', borderTop: '3px solid var(--neon-purple)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Rango Analítico (Input)</label>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '0.3rem', border: '1px solid rgba(176, 38, 255, 0.3)' }}>
            {['semana', 'mes', 'año'].map(tab => (
              <button
                key={tab}
                onClick={() => setTimeRange(tab)}
                disabled={loading}
                style={{
                  background: timeRange === tab ? 'var(--neon-purple)' : 'transparent',
                  color: timeRange === tab ? '#000' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.6rem 2rem',
                  borderRadius: '6px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={generateInsights} 
          disabled={loading}
          className="btn-neon" 
          style={{ width: '100%', maxWidth: '400px', padding: '1.2rem', fontSize: '1.2rem', borderColor: 'var(--neon-purple)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem' }}
        >
          {loading ? (
            <><Loader2 className="animate-spin" /> PROCESANDO MATRIZ NEURAL...</>
          ) : (
            <><BrainCircuit /> GENERAR ANÁLISIS CLÍNICO</>
          )}
        </button>

        {errorStatus && (
          <div style={{ color: 'var(--neon-magenta)', background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--neon-magenta)', width: '100%'}}>
            <strong>Error del Motor IA:</strong> {errorStatus}
          </div>
        )}
      </section>

      {/* Área de Reporte Generado */}
      {report && (
        <section className="glass-panel" style={{ position: 'relative', marginTop: '1rem' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '20px', background: 'var(--neon-purple)', color: '#000', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
            <CheckCircle size={14} /> REPORTE GENERADO
          </div>
          
          <div style={{ padding: '1rem' }}>
            {formatMarkdown(report)}
          </div>
        </section>
      )}
    </div>
  );
}
