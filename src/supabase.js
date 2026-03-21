import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars manquants. Copie .env.example → .env.local et remplis tes clés.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
