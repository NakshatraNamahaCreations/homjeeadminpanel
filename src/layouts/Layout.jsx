// import React, { useState } from "react";
// import { Outlet } from "react-router-dom"; // ✅ Import Outlet
// import Sidebar from "./Sidebar";
// import Header from "./Header";

// const Layout = () => {
//   const [isOpen, setIsOpen] = useState(true);
//   const toggleSidebar = () => setIsOpen(!isOpen);

//   const styles = {
//     content: {
//       marginTop: "60px", // Height of the header
//       marginLeft: isOpen ? "250px" : "60px", // Width of the sidebar
//       padding: "20px",
//       transition: "margin-left 0.3s",
//     },
//   };

//   return (
//     <>
//       <Header toggleSidebar={toggleSidebar} />
//       <Sidebar isOpen={isOpen} />
//       <main style={styles.content}>
//         <Outlet /> {/* ✅ This ensures pages inside Layout are rendered */}
//       </main>
//     </>
//   );
// };

// export default Layout;


// layouts/Layout.jsx
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { isSessionValid, logout } from "../utils/auth";
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsOpen((p) => !p);

  useEffect(() => {
    const checkSession = () => {
      try {
        const valid = isSessionValid();

        if (!valid) {
          // ✅ only clear auth keys (via logout), not full localStorage
          logout();

          // ✅ avoid redirect loop if already on login
          if (location.pathname !== "/" && location.pathname !== "/login") {
            navigate("/login", { replace: true });
          }
        }
      } catch (e) {
        // ✅ if session checker itself throws, logout safely
        logout();
        navigate("/login", { replace: true });
      }
    };

    // ✅ delay slightly so first render + storage hydration completes
    const t = setTimeout(checkSession, 0);

    // ✅ keep interval but not too aggressive
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [navigate, location.pathname]);

  const sidebarWidth = isOpen ? 250 : 60;
  const headerHeight = 60;

  const styles = {
    container: { minHeight: "100vh", backgroundColor: "#f8f9fa" },
    content: {
      marginLeft: `${sidebarWidth}px`,
      marginTop: `${headerHeight}px`,
      padding: "20px",
      transition: "margin-left 0.3s ease",
      minHeight: `calc(100vh - ${headerHeight}px)`,
      backgroundColor: "#f8f9fa",
    },
  };

  return (
    <div style={styles.container}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isOpen} />
      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
