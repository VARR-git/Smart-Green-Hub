import assert from "node:assert/strict"
import test from "node:test"
import {
  DEMO_DATA,
  buildDemoHistory,
  nextDemoData,
  setDemoActuator,
} from "./demo.ts"

test("demo stream produces bounded readings and local actuator changes", () => {
  const history = buildDemoHistory(1_000_000)
  assert.equal(history.length, 10)
  assert.equal(history.at(-1)?.t, 1_000_000)

  const next = nextDemoData(DEMO_DATA, () => 1, new Date("2026-09-11T01:00:00Z"))
  assert.equal(next.ph, 6.22)
  assert.equal(next.tds, 790)
  assert.equal(next.temperature, 23.5)
  assert.equal(next.humidity, 69)

  const toggled = setDemoActuator(DEMO_DATA, "fan", true)
  assert.equal(toggled.fan, true)
  assert.equal(DEMO_DATA.fan, false)
})
