function isMarketOpenIST() {
  const now = new Date()

  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  )

  const day = ist.getDay() // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false

  const hours = ist.getHours()
  const minutes = ist.getMinutes()

  // Market hours: 9:00 AM – 3:30 PM IST
  const afterOpen = hours > 9 || (hours === 9 && minutes >= 0)
  const beforeClose = hours < 15 || (hours === 15 && minutes <= 30)

  return afterOpen && beforeClose
}

// ✅ EXPORT BOTH (bulletproof, like other files)
export { isMarketOpenIST }
export default isMarketOpenIST
