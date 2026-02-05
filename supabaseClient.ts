
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Segurança: Se as chaves não existirem, o app não crasha no carregamento
const supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || '';
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || '';

// Só inicializa se tiver os dados, senão exportamos um proxy ou nulo controlado
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = !!supabase;
