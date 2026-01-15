import getSupabase from "./supabase.js"
import decrypt from "./crypto.js"
import activateDhanKillSwitch from "./dhan.js"
import isMarketOpenIST from "./marketTime.js"
import fetchDhanPnL from "./dhanPositions.js"
import fetchTodayCompletedOrderCount from "./dhanOrders.js"

// import fetchTodayOrderCount from "./dhanOrders.js" // enable when ready

console.log("🚀 DHAN Risk Worker started")

while (true) {
  try {
    /* =========================
       MARKET TIME GUARD
       ========================= */
    if (!isMarketOpenIST()) {
      console.log("⏸ Market closed, sleeping...")
      await sleep(60000)
      continue
    }

    console.log("📊 Market open, checking users...")

    const supabase = getSupabase()

    /* =========================
       FETCH ACTIVE USERS
       ========================= */
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

    /* =========================
       PROCESS EACH USER
       ========================= */
    for (const user of users || []) {
      try {
        const token = decrypt(user.encrypted_token)

        /* =========================
           FETCH REAL P&L FROM DHAN
           ========================= */
        const pnl = await fetchDhanPnL(token)

        console.log(
          `PnL for ${user.user_id}: ${pnl.total} (R: ${pnl.realised}, U: ${pnl.unrealised})`
        )

      const orderCount = await fetchTodayCompletedOrderCount(token)

console.log(
  `Completed orders today for ${user.user_id}:`,
  orderCount
)
        /* =========================
           BREACH CHECKS
           ========================= */
        const lossBreached =
          user.max_loss !== null && pnl.total <= -user.max_loss

        const ordersBreached =
          user.max_orders !== null && orderCount >= user.max_orders

        if (!lossBreached && !ordersBreached) continue

        const killReason = lossBreached ? "MAX_LOSS" : "MAX_ORDERS"

        console.log(
          `🔥 Kill switch triggered for ${user.user_id} | Reason: ${killReason}`
        )

        /* =========================
           1️⃣ AUDIT LOG (IMMUTABLE)
           ========================= */
        await supabase
          .from("kill_switch_audit_logs")
          .insert({
            user_id: user.user_id,
            kill_reason: killReason,

            max_loss: user.max_loss,
            max_orders: user.max_orders,

            realised_pnl: pnl.realised,
            unrealised_pnl: pnl.unrealised,
            total_pnl: pnl.total,

            order_count: orderCount,

            dhan_kill_attempted: true
          })

        /* =========================
           2️⃣ HARD STATE UPDATE
           ========================= */
        await supabase
          .from("trading_configs")
          .update({
            kill_switch_active: true,
            kill_triggered_at: new Date().toISOString()
          })
          .eq("user_id", user.user_id)

        /* =========================
           3️⃣ BROKER ENFORCEMENT
           ACTIVATE → DEACTIVATE → ACTIVATE
           ========================= */
        await activateDhanKillSwitch(token)
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
  return new Promise(resolve => setTimeout(resolve, ms))
}
