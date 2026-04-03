import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'AQUI_TU_ANON_KEY'

let supabaseClient = null;
try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} catch(e) {
  console.warn("Supabase no configurado o credenciales invalidas. Por favor crea el archivo .env");
}

export const supabase = supabaseClient;
