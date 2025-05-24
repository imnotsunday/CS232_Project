// === auth.js ===

// ตรวจสอบว่า login หรือยัง ถ้าไม่ -> ไป login.html
function requireAuth(allowedRoles = []) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      alert("You are not authorized to view this page.");
      window.location.href = "login.html";
      return;
    }

    // กำหนดชื่อผู้ใช้ (optional)
    if (document.getElementById("user-name")) {
      document.getElementById("user-name").innerText = payload.name || role;
    }

  } catch (err) {
    console.error("Invalid token:", err);
    localStorage.clear();
    window.location.href = "login.html";
  }
}

// ออกจากระบบ
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// เรียกข้อมูล user
function getCurrentUser() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      name: payload.name,
      role: payload.role
    };
  } catch (err) {
    return null;
  }
}

// ตั้ง event ให้ปุ่ม logout ทำงาน (ใช้ใน sidebar)
window.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});
