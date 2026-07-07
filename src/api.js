const API = import.meta.env.VITE_API_URL;

// Wrapper around fetch that automatically attaches the login token,
// and redirects to sign-in if the token is missing/expired.
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("pesasmart_token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401) {
    // token missing or expired -> clear and send to sign-in
    localStorage.removeItem("pesasmart_token");
    localStorage.removeItem("pesasmart_user");
    window.location.href = "/";
    throw new Error("Not authenticated");
  }

  return res;
}

export { API };