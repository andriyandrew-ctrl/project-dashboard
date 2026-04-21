import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Ini adalah "kurir" resmi yang akan mengantar-jemput data kita ke Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)