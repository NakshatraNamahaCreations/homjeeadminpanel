import { BASE_URL } from "./config"; // ✅ IMPORTANT: add this import

// Session timeout in milliseconds (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// ========== Authentication Data Management ==========
export const setAuth = (data) => {
  try {
    const authData = { ...data, loggedInAt: Date.now() };
    localStorage.setItem("adminAuth", JSON.stringify(authData));
  } catch (error) {
    console.error("Error setting auth:", error);
  }
};

export const getAuth = () => {
  try {
    const data = localStorage.getItem("adminAuth");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting auth:", error);
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem("adminAuth");
};

// ========== Token Management ==========
export const setToken = (token) => {
  localStorage.setItem("adminToken", token);
};

// export const getToken = () => {
//   return localStorage.getItem("adminToken");
// };

export const getToken = () => {
  try {
    const token = localStorage.getItem("adminToken");
    if (!token || token === "undefined" || token === "null") return null;
    return token;
  } catch (e) {
    return null;
  }
};

export const removeToken = () => {
  localStorage.removeItem("adminToken");
};

// ========== Admin Data Management ==========
export const setAdminData = (data) => {
  try {
    localStorage.setItem("adminData", JSON.stringify(data));
  } catch (error) {
    console.error("Error setting admin data:", error);
  }
};

export const getAdminData = () => {
  try {
    const data = localStorage.getItem("adminData");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting admin data:", error);
    return null;
  }
};

export const clearAdminData = () => {
  localStorage.removeItem("adminData");
};

// ========== Session Validation ==========
export const isAuthed = () => {
  const token = getToken();
  const adminData = getAdminData();
  return !!(token && adminData);
};

export const isSessionValid = () => {
  try {
    const auth = getAuth();
    if (!auth || !auth.loggedInAt) return false;

    const sessionAge = Date.now() - auth.loggedInAt;
    return sessionAge < SESSION_TIMEOUT;
  } catch (error) {
    console.error("Error checking session validity:", error);
    return false;
  }
};

export const isFullyAuthed = () => {
  return isAuthed() && isSessionValid();
};

// ========== Session Management ==========
export const initSession = (adminData, token) => {
  setAdminData(adminData);
  setToken(token);
  setAuth({
    mobileNumber: adminData.mobileNumber,
    name: adminData.name || "Admin",
    _id: adminData._id,
    loggedInAt: Date.now(),
  });
};

// ========== Logout & Cleanup ==========
export const logoutLocal = () => {
  removeToken();
  clearAdminData();
  clearAuth();

  localStorage.removeItem("adminPermissions");
  localStorage.removeItem("adminPreferences");
  localStorage.removeItem("adminSettings");

  // ⚠️ Don't nuke all sessionStorage; remove only auth-related if needed
  sessionStorage.removeItem("sessionExpired");
};

// ✅ keep redirect behavior (so your Sidebar logout still works)
// ✅ but now BASE_URL is imported so it won’t crash
export const logout = async (redirect = true) => {
  try {
    const token = getToken();

    if (token) {
      try {
        await fetch(`${BASE_URL}/admin/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-auth-token": token,
            token: token,
          },
        });
      } catch (error) {
        console.warn("Backend logout failed, proceeding:", error);
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    logoutLocal();
    if (redirect) window.location.href = "/";
  }
};

// ========== Authentication Headers ==========
// ✅ This is the most important fix for Settings API calls
export const getAuthHeaders = () => {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };

  // ✅ block bad token values
  if (token && token !== "undefined" && token !== "null") {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const getAuthHeadersWithOptions = (additionalHeaders = {}) => {
  return {
    ...getAuthHeaders(),
    ...additionalHeaders,
  };
};
