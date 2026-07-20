import { initializeApp } from "firebase/app"
import { getAuth, signInAnonymously } from "firebase/auth"
import { getDatabase, onValue, ref, set } from "firebase/database"
import type { HydroData } from "./types"

// Konfigurasi web publik (bukan rahasia). Provider Anonymous harus aktif.
const firebaseConfig = {
  apiKey: "AIzaSyAnjM7EBD_eDXOmPcgKChrh3mTuFBBinzM",
  authDomain: "smart-green-hub.firebaseapp.com",
  databaseURL:
    "https://smart-green-hub-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-green-hub",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getDatabase(app)

export function signIn() {
  return signInAnonymously(auth)
}

const num = (v: unknown): number | null =>
  typeof v === "number" ? v : v == null || v === "" ? null : Number(v)
const onoff = (v: unknown) => v === "ON" || v === true

export function subscribe(cb: (d: HydroData) => void) {
  return onValue(ref(db, "hidroponik"), (snap) => {
    const v = snap.val() || {}
    cb({
      ph: num(v.ph),
      tds: num(v.tds),
      temperature: num(v.temperature),
      humidity: num(v.humidity),
      pump: onoff(v.pump),
      lamp: onoff(v.lamp),
      fan: onoff(v.fan),
      espStatus: v.esp_status ?? "unknown",
      lastPing: num(v.last_ping),
      updatedAt: v.updated_at ?? "",
      fw: v.fw ?? {},
    })
  })
}

export function setActuator(name: "pump" | "lamp" | "fan", on: boolean) {
  return set(ref(db, `hidroponik/${name}`), on ? "ON" : "OFF")
}
