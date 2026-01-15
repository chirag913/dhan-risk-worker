import { getSupabase } from "./supabase.js"
import { decrypt } from "./crypto.js"
import { activateDhanKillSwitch } from "./dhan.js"
import { isMarketOpenIST } from "./marketTime.js"

console.log("🚀 DHAN Risk Worker started")

while (true) {
  
  try {
    if (!isMarketOpenIST()) {
      console.log("⏸ Market closed, sleeping...")
      await sleep(60000) // 1 minute
      continue
    }

    console.log("📊 Market open, checking users...")
const supabase = getSupabase()
    const { data: users, error } = await supabase
      .from("trading_configs")
      .select(`
        user_id,
        max_loss,
        max_orders,
        kill_switch_active,
        encrypted_token
      `)
      .eq("kill_switch_active", false)

    if (error) throw error

    for (const user of users || []) {
      try {
        const token = decrypt(user.encrypted_token)

        // ⛔ PLACEHOLDER — we add real logic next
        const pnl = 0
        const orderCount = 0

        const lossBreached =
          user.max_loss !== null && pnl <= -user.max_loss

        const ordersBreached =
          user.max_orders !== null && orderCount >= user.max_orders

        if (lossBreached || ordersBreached) {
          console.log("🔥 Kill switch triggered for", user.user_id)

          // HARD STATE FIRST
    const supabase = getSupabase()

const { data: users, error } = await supabase
  .from("trading_configs")
            .update({
              kill_switch_active: true,
              kill_triggered_at: new Date().toISOString()
            })
            .eq("user_id", user.user_id)

          // BROKER ACTION
          await activateDhanKillSwitch(token)
        }
      } catch (e) {
        console.error("User error:", e.message)
      }
    }
  } catch (e) {
    console.error("Worker error:", e.message)
  }

  await sleep(5000) // poll every 5 seconds
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
