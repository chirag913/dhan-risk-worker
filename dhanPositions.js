import fetch from "node-fetch"

export default async function fetchDhanPnL(token) {
  const res = await fetch("https://api.dhan.co/v2/positions", {
    headers: {
      "access-token": token
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error("Failed to fetch positions: " + text)
  }

  const data = await res.json()

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
}
