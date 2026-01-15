import fetch from "node-fetch"

// Only executed orders count
const COMPLETED_STATUSES = new Set([
  "COMPLETE",
  "TRADED",
  "EXECUTED"
])

function isTodayIST(dateStr) {
  const orderDate = new Date(dateStr)

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  )

  return (
    orderDate.getDate() === now.getDate() &&
    orderDate.getMonth() === now.getMonth() &&
    orderDate.getFullYear() === now.getFullYear()
  )
}

export default async function fetchTodayCompletedOrderCount(token) {
  const res = await fetch("https://api.dhan.co/v2/orders", {
    headers: {
      "access-token": token
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error("Failed to fetch orders: " + text)
  }

  const orders = await res.json()

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
}
