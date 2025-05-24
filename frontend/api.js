// === api.js ===

// ตั้ง base URL สำหรับ API Gateway
const API_BASE = "https://lq0uod4tn3.execute-api.us-east-1.amazonaws.com";

// ดึง token จาก localStorage
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// GET request
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// POST request
async function apiPost(path, data = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// PUT request
async function apiPut(path, data = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}

// DELETE request
async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw await res.json();
  return await res.json();
}
