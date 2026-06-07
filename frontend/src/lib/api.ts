const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function createRoutePlan(payload: unknown) {
  const response = await fetch(`${API_BASE_URL}/api/route-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Route plan request failed with ${response.status}`);
  }

  return response.json();
}
