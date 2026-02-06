import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdContactMail,
  MdPersonAdd,
  MdUpdate,
  MdAttachMoney,
  MdShowChart,
  MdPeopleAlt,
  MdCategory,
  MdNotificationsActive,
  MdMessage,
  MdExitToApp,
  MdSettings,
} from "react-icons/md";
import { logout } from "../utils/auth"; // Import logout function from auth utils

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
   
      logout(); // Clear all auth data and redirect to login
   
  };

  const menuItems = [
    { name: "Home", path: "/dashboard", icon: <MdDashboard /> },
    { name: "Enquiries", path: "/enquiries", icon: <MdContactMail /> },
    { name: "New Leads", path: "/newleads", icon: <MdPersonAdd /> },
    { name: "Ongoing Leads", path: "/ongoing-leads", icon: <MdUpdate /> },
    { name: "Money Dashboard", path: "/moneydashboard", icon: <MdAttachMoney /> },
    { name: "Performance", path: "/performancedashboard", icon: <MdShowChart /> },
    { name: "Vendors", path: "/vendors-list", icon: <MdPeopleAlt /> },
    { name: "Products", path: "/product", icon: <MdCategory /> },
    { name: "Push Notifications", path: "/notification", icon: <MdNotificationsActive /> },
    { name: "Whatsapp Notifications", path: "/whtsapp", icon: <MdMessage /> },
    { name: "Setting", path: "/setting", icon: <MdSettings /> },
    { 
      name: "Log out", 
      path: "#", 
      icon: <MdExitToApp />,
      onClick: handleLogout, // Add onClick handler for logout
      isLogout: true // Flag to identify logout item
    },
  ];

  const styles = {
    sidebar: {
      height: "calc(100vh - 60px)",
      backgroundColor: "#fff",
      paddingTop: "20px",
      position: "fixed",
      top: "60px",
      left: "0",
      width: isOpen ? "250px" : "60px",
      transition: "width 0.3s",
      overflowY: "auto",
      borderRight: "1px solid #ddd",
      zIndex: 1000,
    },
    navList: {
      listStyleType: "none",
      padding: "0",
      marginTop: "-23px",
    },
    navLink: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "12px",
      textDecoration: "none",
      color: "#000",
      fontSize: "1rem",
      transition: "all 0.3s ease",
      borderRadius: "5px",
      cursor: "pointer",
      backgroundColor: "transparent",
      border: "none",
      width: "100%",
      textAlign: "left",
    },
    navLinkHover: {
      backgroundColor: "#f5f5f5",
      color: "#ED1F24",
    },
    icon: (isActive) => ({
      fontSize: "20px",
      color: isActive ? "#ED1F24" : "#000",
      transition: "0.3s",
    }),
    logoutIcon: {
      fontSize: "20px",
      color: "#dc3545", // Red color for logout
      transition: "0.3s",
    },
    logoutText: {
      fontSize: "15px",
      color: "#dc3545",
      fontWeight: "bold",
    }
  };

  return (
    <div style={styles.sidebar}>
      <nav>
        <ul style={styles.navList}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            // For logout item, use button with onClick
            if (item.isLogout) {
              return (
                <li key={item.name}>
                  <button
                    onClick={item.onClick}
                    style={{
                      ...styles.navLink,
                      fontWeight: "normal",
                      color: "#dc3545",
                      ":hover": styles.navLinkHover,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                      e.currentTarget.style.color = "#dc3545";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#dc3545";
                    }}
                  >
                    <span style={styles.logoutIcon}>{item.icon}</span>
                    {isOpen && (
                      <span style={styles.logoutText}>{item.name}</span>
                    )}
                  </button>
                </li>
              );
            }
            
            // For regular menu items, use Link
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  style={{
                    ...styles.navLink,
                    fontWeight: isActive ? "bold" : "normal",
                    color: isActive ? "#ED1F24" : "#000",
                    backgroundColor: isActive ? "#f5f5f5" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                      e.currentTarget.style.color = "#ED1F24";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#000";
                    }
                  }}
                >
                  <span style={styles.icon(isActive)}>{item.icon}</span>
                  {isOpen && (
                    <span style={{ fontSize: "15px" }}>{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;