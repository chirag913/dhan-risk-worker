import activateDhanKillSwitch from "./dhan.js"
import isMarketOpenIST from "./marketTime.js"
import fetchDhanPnL from "./dhanPositions.js"
import fetchTodayCompletedOrderCount from "./dhanOrders.js"

const DHAN_TOKEN = process.env.DHAN_ACCESS_TOKEN

if (!DHAN_TOKEN) {
  throw new Error("DHAN_ACCESS_TOKEN is missing")
}

console.log("🚀 DHAN Risk Worker started (PERSONAL MODE)")

// 🔧 PERSONAL LIMITS (change anytime)
const MAX_LOSS = 5        // ₹
const MAX_ORDERS = 1        // completed trades

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

    console.log("📊 Market open, checking risk...")

    console.log(
      "🔑 Using DHAN token (first 6 chars):",
      DHAN_TOKEN.slice(0, 6)
    )

    /* =========================
       FETCH REAL P&L
       ========================= */
    const pnl = await fetchDhanPnL(DHAN_TOKEN)

    console.log(
      `PnL: ${pnl.total} (R: ${pnl.realised}, U: ${pnl.unrealised})`
    )

    /* =========================
       FETCH COMPLETED ORDERS
       ========================= */
    const orderCount =
      await fetchTodayCompletedOrderCount(DHAN_TOKEN)

    console.log(
      `Completed orders today:`,
      orderCount
    )

    /* =========================
       BREACH CHECKS
       ========================= */
    const lossBreached = pnl.total <= -MAX_LOSS
    const ordersBreached = orderCount >= MAX_ORDERS

    if (!lossBreached && !ordersBreached) {
      await sleep(5000)
      continue
    }

    const reason = lossBreached ? "MAX_LOSS" : "MAX_ORDERS"

    console.log(`🔥 KILL SWITCH TRIGGERED | Reason: ${reason}`)

    /* =========================
       BROKER ENFORCEMENT
       ACTIVATE → DEACTIVATE → ACTIVATE
       ========================= */
    await activateDhanKillSwitch(DHAN_TOKEN)

    console.log("🛑 Kill switch locked for the day")
    break // stop worker after kill (personal safety)

  } catch (e) {
    console.error("Worker error:", e.message)
  }

  await sleep(5000)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
