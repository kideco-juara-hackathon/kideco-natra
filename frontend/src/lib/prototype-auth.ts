export const PROTOTYPE_AUTH_KEY = "kideco-dispatcher-session";

export const DEMO_DISPATCHER = {
  employeeId: "DSP-001",
  password: "kideco2026",
  name: "Dispatcher 01",
  role: "Fleet Dispatcher",
} as const;

export function authenticateDispatcher(employeeId: string, password: string) {
  return (
    employeeId.trim().toUpperCase() === DEMO_DISPATCHER.employeeId &&
    password === DEMO_DISPATCHER.password
  );
}

export function hasPrototypeSession() {
  return window.sessionStorage.getItem(PROTOTYPE_AUTH_KEY) === "authenticated";
}

export function createPrototypeSession() {
  window.sessionStorage.setItem(PROTOTYPE_AUTH_KEY, "authenticated");
}

export function clearPrototypeSession() {
  window.sessionStorage.removeItem(PROTOTYPE_AUTH_KEY);
}

