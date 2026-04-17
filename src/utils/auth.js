// // src/utils/auth.js
// const KEY = "adminAuth";

// export const setAuth = (payload) => {
//   try {
//     localStorage.setItem(KEY, JSON.stringify(payload));
//   } catch {}
// };

// export const getAuth = () => {
//   try {
//     const raw = localStorage.getItem(KEY);
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// };

// export const clearAuth = () => {
//   try {
//     localStorage.removeItem(KEY);
//   } catch {}
// };

// export const isAuthed = () => !!getAuth();



// // utils/auth.js

// // Session timeout in milliseconds (24 hours)
// const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

// // ========== Authentication Data Management ==========

// /**
//  * Store admin authentication data with timestamp
//  * @param {Object} data - Admin authentication data
//  */
// export const setAuth = (data) => {
//   try {
//     const authData = {
//       ...data,
//       loggedInAt: Date.now()
//     };
//     localStorage.setItem('adminAuth', JSON.stringify(authData));
//   } catch (error) {
//     console.error("Error setting auth:", error);
//   }
// };

// /**
//  * Get stored authentication data
//  * @returns {Object|null} Authentication data or null
//  */
// export const getAuth = () => {
//   try {
//     const data = localStorage.getItem('adminAuth');
//     return data ? JSON.parse(data) : null;
//   } catch (error) {
//     console.error("Error getting auth:", error);
//     return null;
//   }
// };

// /**
//  * Clear authentication data
//  */
// export const clearAuth = () => {
//   localStorage.removeItem('adminAuth');
// };

// // ========== Token Management ==========

// /**
//  * Store authentication token
//  * @param {string} token - JWT or authentication token
//  */
// export const setToken = (token) => {
//   localStorage.setItem('adminToken', token);
// };

// /**
//  * Get stored authentication token
//  * @returns {string|null} Token or null
//  */
// export const getToken = () => {
//   return localStorage.getItem('adminToken');
// };

// /**
//  * Remove authentication token
//  */
// export const removeToken = () => {
//   localStorage.removeItem('adminToken');
// };

// // ========== Admin Data Management ==========

// /**
//  * Store admin profile data
//  * @param {Object} data - Admin profile data
//  */
// export const setAdminData = (data) => {
//   try {
//     localStorage.setItem('adminData', JSON.stringify(data));
//   } catch (error) {
//     console.error("Error setting admin data:", error);
//   }
// };

// /**
//  * Get stored admin profile data
//  * @returns {Object|null} Admin data or null
//  */
// export const getAdminData = () => {
//   try {
//     const data = localStorage.getItem('adminData');
//     return data ? JSON.parse(data) : null;
//   } catch (error) {
//     console.error("Error getting admin data:", error);
//     return null;
//   }
// };

// /**
//  * Clear admin profile data
//  */
// export const clearAdminData = () => {
//   localStorage.removeItem('adminData');
// };

// // ========== Session Validation ==========

// /**
//  * Check if user is authenticated (has token and admin data)
//  * @returns {boolean} True if authenticated
//  */
// export const isAuthed = () => {
//   const token = getToken();
//   const adminData = getAdminData();
//   return !!(token && adminData);
// };

// /**
//  * Check if current session is still valid (within timeout period)
//  * @returns {boolean} True if session is valid
//  */
// export const isSessionValid = () => {
//   try {
//     const auth = getAuth();
//     if (!auth || !auth.loggedInAt) return false;

//     const now = Date.now();
//     const sessionAge = now - auth.loggedInAt;

//     // Session is valid if less than timeout period
//     return sessionAge < SESSION_TIMEOUT;
//   } catch (error) {
//     console.error("Error checking session validity:", error);
//     return false;
//   }
// };

// /**
//  * Check if user is fully authenticated (has valid session)
//  * @returns {boolean} True if fully authenticated
//  */
// export const isFullyAuthed = () => {
//   return isAuthed() && isSessionValid();
// };

// /**
//  * Get remaining session time in milliseconds
//  * @returns {number} Remaining time in ms, 0 if expired
//  */
// export const getRemainingSessionTime = () => {
//   try {
//     const auth = getAuth();
//     if (!auth || !auth.loggedInAt) return 0;

//     const now = Date.now();
//     const sessionAge = now - auth.loggedInAt;
//     const remaining = SESSION_TIMEOUT - sessionAge;

//     return remaining > 0 ? remaining : 0;
//   } catch (error) {
//     console.error("Error getting remaining session time:", error);
//     return 0;
//   }
// };

// /**
//  * Format remaining session time for display
//  * @returns {string} Formatted time string
//  */
// export const formatRemainingTime = () => {
//   const remaining = getRemainingSessionTime();
//   if (remaining <= 0) return "Session expired";

//   const hours = Math.floor(remaining / (1000 * 60 * 60));
//   const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

//   if (hours > 0) {
//     return `${hours}h ${minutes}m remaining`;
//   }
//   return `${minutes}m remaining`;
// };

// // ========== Session Management ==========

// /**
//  * Initialize a new session after successful authentication
//  * @param {Object} adminData - Admin profile data
//  * @param {string} token - Authentication token
//  */
// export const initSession = (adminData, token) => {
//   setAdminData(adminData);
//   setToken(token);
//   setAuth({
//     mobileNumber: adminData.mobileNumber,
//     name: adminData.name || 'Admin',
//     _id: adminData._id,
//     loggedInAt: Date.now()
//   });
// };

// /**
//  * Extend current session (useful for "keep me logged in" feature)
//  */
// export const extendSession = () => {
//   const auth = getAuth();
//   if (auth) {
//     setAuth({ ...auth, loggedInAt: Date.now() });
//   }
// };

// /**
//  * Check and refresh session if needed
//  * @returns {boolean} True if session is still valid
//  */
// export const checkAndRefreshSession = () => {
//   if (isFullyAuthed()) {
//     // Auto-extend session on activity if desired
//     // extendSession();
//     return true;
//   }
//   return false;
// };

// // ========== Logout & Cleanup ==========

// /**
//  * Complete logout - clear all authentication data
//  * @param {boolean} redirect - Whether to redirect to login page
//  */
// // utils/auth.js - Enhanced logout function
// export const logout = async (redirect = true) => {
//   try {
//     const token = getToken();
    
//     // Call backend logout endpoint if exists (optional)
//     if (token) {
//       try {
//         await fetch(`${BASE_URL}/admin/auth/logout`, {
//           method: "POST",
//           headers: {
//             "Authorization": `Bearer ${token}`
//           }
//         });
//       } catch (error) {
//         console.warn("Backend logout failed, proceeding with frontend cleanup:", error);
//       }
//     }
//   } catch (error) {
//     console.error("Logout error:", error);
//   } finally {
//     // Always clear frontend data
//     removeToken();
//     clearAdminData();
//     clearAuth();
    
//     // Clear any other related data
//     localStorage.removeItem('adminPermissions');
//     localStorage.removeItem('adminPreferences');
//     sessionStorage.clear(); // Clear session storage too
    
//     if (redirect) {
//       // Use window.location for complete page reload and cache clearing
//       window.location.href = '/';
//     }
//   }
// };

// /**
//  * Force logout due to session expiration
//  */
// export const forceLogout = () => {
//   logout();
//   // Optional: Show session expired message
//   sessionStorage.setItem('sessionExpired', 'true');
// };

// // ========== Utility Functions ==========

// /**
//  * Get current admin's ID
//  * @returns {string|null} Admin ID or null
//  */
// export const getAdminId = () => {
//   const adminData = getAdminData();
//   return adminData?._id || null;
// };

// /**
//  * Get current admin's name
//  * @returns {string} Admin name or 'Admin'
//  */
// export const getAdminName = () => {
//   const adminData = getAdminData();
//   return adminData?.name || 'Admin';
// };

// /**
//  * Get current admin's mobile number
//  * @returns {string|null} Mobile number or null
//  */
// export const getAdminMobile = () => {
//   const adminData = getAdminData();
//   return adminData?.mobileNumber || null;
// };

// /**
//  * Check if current admin can be deleted
//  * @returns {boolean} True if admin can be deleted
//  */
// export const canAdminBeDeleted = () => {
//   const adminData = getAdminData();
//   return adminData?.canBeDeleted !== false; // Default to true
// };

// /**
//  * Clear all admin-related data (for debugging or cleanup)
//  */
// export const clearAllAdminData = () => {
//   const keys = [
//     'adminToken',
//     'adminData',
//     'adminAuth',
//     'adminPermissions',
//     'adminPreferences',
//     'adminSettings'
//   ];
  
//   keys.forEach(key => localStorage.removeItem(key));
// };

// // ========== Authentication Headers ==========

// /**
//  * Get authentication headers for API requests
//  * @returns {Object} Headers object with token
//  */
// export const getAuthHeaders = () => {
//   const token = getToken();
//   return {
//     'Authorization': token ? `Bearer ${token}` : '',
//     'Content-Type': 'application/json'
//   };
// };

// /**
//  * Get authentication headers with additional options
//  * @param {Object} additionalHeaders - Additional headers to include
//  * @returns {Object} Complete headers object
//  */
// export const getAuthHeadersWithOptions = (additionalHeaders = {}) => {
//   return {
//     ...getAuthHeaders(),
//     ...additionalHeaders
//   };
// };


// utils/auth.js
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
