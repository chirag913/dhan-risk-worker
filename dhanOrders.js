import fetch from "node-fetch"

// DHAN considers only these as actually traded orders
const COMPLETED_STATUSES = new Set([
  "COMPLETE",
  "TRADED",
  "EXECUTED"
])

function isTodayIST(dateStr) {
  const orderDate = new Date(dateStr)

  const nowIST = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata"
    })
  )

  return (
    orderDate.getDate() === nowIST.getDate() &&
    orderDate.getMonth() === nowIST.getMonth() &&
    orderDate.getFullYear() === nowIST.getFullYear()
  )
}

export default async function fetchTodayCompletedOrderCount(token) {
  try {
    const res = await fetch("https://api.dhan.co/v2/orders", {
      method: "GET",
      headers: {
        "access-token": token,
        "client-id": process.env.DHAN_CLIENT_ID,
        "Accept": "application/json",
        "Content-Type": "application/json",

        // 🔥 REQUIRED — prevents DHAN from killing server requests
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
      }
    })

    const text = await res.text()

    if (!res.ok) {
      throw new Error(
        `DHAN orders failed (${res.status}): ${text}`
      )
    }

    const orders = JSON.parse(text)

    let count = 0

    for (const order of orders || []) {
      if (
        order.orderTime &&
        isTodayIST(order.orderTime) &&
        COMPLETED_STATUSES.has(order.orderStatus)
      ) {
        count++
      }
    }

    return count
  } catch (err) {
    throw new Error(
      "DHAN order count fetch error: " + err.message
    )
  }
}
