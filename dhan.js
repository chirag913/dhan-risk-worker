import fetch from "node-fetch"

const ACTIVATE =
  "https://api.dhan.co/v2/killswitch?killSwitchStatus=ACTIVATE"
const DEACTIVATE =
  "https://api.dhan.co/v2/killswitch?killSwitchStatus=DEACTIVATE"

async function activateDhanKillSwitch(token) {
  const headers = { "access-token": token }

  await fetch(ACTIVATE, { method: "POST", headers })
  await sleep(3000)

  await fetch(DEACTIVATE, { method: "POST", headers })
  await sleep(3000)

  await fetch(ACTIVATE, { method: "POST", headers })
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ✅ EXPORT BOTH (bulletproof)
export { activateDhanKillSwitch }
export default activateDhanKillSwitch
