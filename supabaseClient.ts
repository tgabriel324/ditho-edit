
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Chaves fornecidas pelo usuário
const supabaseUrl = 'https://ffktbselejkbiybgmkat.supabase.co';
const supabaseAnonKey = 'sb_publishable_XfcZebu4B0g87Ln0qnRCzA_QM4AvSal';

// Inicialização segura
export const supabase = (supabaseUrl && !supabaseUrl.includes('YOUR_')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = !!supabase;
