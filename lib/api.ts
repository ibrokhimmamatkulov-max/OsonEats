// Backend boundary. Every call the UI makes to the server goes through here, so wiring the real
// API means editing only this file. Without NEXT_PUBLIC_API_URL the functions run in demo mode.

const API = process.env.NEXT_PUBLIC_API_URL;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

/** POST /auth/sms — sends a 4-digit code to +992<phone> */
export async function sendCode(phone: string): Promise<void> {
  if (!API) {
    await wait(300);
    return;
  }
  await post("/auth/sms", { phone: "+992" + phone });
}

/** POST /orders — returns the order number assigned by the server. Throws when offline or rejected. */
export async function createOrder(payload: unknown): Promise<{ num?: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("offline");
  if (!API) return {};
  return post<{ num: number }>("/orders", payload);
}

/** POST /auth/verify — true when the code matches; the server sets the session cookie */
export async function verifyCode(phone: string, code: string): Promise<boolean> {
  if (!API) {
    await wait(200);
    return code !== "0000";
  }
  try {
    const r = await post<{ ok: boolean }>("/auth/verify", { phone: "+992" + phone, code });
    return r.ok;
  } catch {
    return false;
  }
}
