const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function safeJson(response) {
  return response.text().then((text) => {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  });
}

export async function fetchCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });

  const data = await safeJson(response);
  return { response, data };
}
