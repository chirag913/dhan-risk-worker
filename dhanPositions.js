import fetch from "node-fetch"

export default async function fetchDhanPnL(token) {
  try {
    const res = await fetch("https://api.dhan.co/v2/positions", {
      method: "GET",
      headers: {
        "access-token": token,
        "client-id": process.env.DHAN_CLIENT_ID,
        "Accept": "application/json",
        "Content-Type": "application/json",
        // 🔥 THIS IS THE FIX
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
      }
    })

    const text = await res.text()

    if (!res.ok) {
      throw new Error(
        `DHAN positions failed (${res.status}): ${text}`
      )
    }

    const data = JSON.parse(text)

    let realised = 0
    let unrealised = 0

    for (const pos of data || []) {
      realised += Number(pos.realisedProfit || 0)
      unrealised += Number(pos.unrealisedProfit || 0)
    }

    return {
      realised,
      unrealised,
      total: realised + unrealised
    }
  } catch (err) {
    throw new Error("DHAN PnL fetch error: " + err.message)
  }
}
