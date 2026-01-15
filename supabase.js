import { createClient } from "@supabase/supabase-js"

let _supabase = null

function getSupabase() {
  if (_supabase) return _supabase

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase env vars missing (SUPABASE_URL / SERVICE_ROLE_KEY)")
  }

  _supabase = createClient(url, key)
  return _supabase
}

// ✅ EXPORT BOTH (bulletproof)
export { getSupabase }
export default getSupabase
