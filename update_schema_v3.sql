-- update_schema_v3.sql
-- Ejecuta este script en el SQL Editor de Supabase para agregar las nuevas columnas estructuradas

ALTER TABLE daily_logs 
  ADD COLUMN IF NOT EXISTS additional_data TEXT,
  ADD COLUMN IF NOT EXISTS leo_mentions TEXT,
  ADD COLUMN IF NOT EXISTS out_of_class_blocks INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS out_of_school_blocks INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS out_of_class_reasons TEXT,
  ADD COLUMN IF NOT EXISTS out_of_school_reason TEXT;

-- Mensaje de éxito: Las columnas fueron añadidas sin afectar los registros anteriores.
-- El frontend de React actualmente agrupa algunas de estas respuestas en "missed_classes" y "mom_comments" 
-- como medida de seguridad para que la aplicación no falle repentinamente. 
-- Estas nuevas columnas te permitirán tener una base de datos más limpia y estructurada hacia el futuro.
