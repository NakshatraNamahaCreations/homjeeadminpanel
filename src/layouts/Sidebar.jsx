import React from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "react-icons/md"; // Using Material Design Icons

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  const menuItems = [
    { name: "Home", path: "/dashboard", icon: <MdDashboard /> },
    { name: "Enquiries", path: "/enquiries", icon: <MdContactMail /> },
    { name: "New Leads", path: "/newleads", icon: <MdPersonAdd /> },
    { name: "Ongoing Leads", path: "/ongoing-leads", icon: <MdUpdate /> },
    { name: "Money Dashboard", path: "/moneydashboard", icon: <MdAttachMoney /> },
    { name: "Performance", path: "/performancedashboard", icon: <MdShowChart /> },
    { name: "Vendors", path: "/vendor", icon: <MdPeopleAlt /> },
    { name: "Products", path: "/product", icon: <MdCategory /> },
    { name: "Push Notifications", path: "/notification", icon: <MdNotificationsActive /> },
    { name: "Whatsapp Notifications", path: "/whtsapp", icon: <MdMessage /> },
    { name: "Setting", path: "/setting", icon: <MdSettings /> },
    { name: "Log out", path: "/logout", icon: <MdExitToApp /> },
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
      transition: "0.3s",
      borderRadius: "5px",
    },
    icon: (isActive) => ({
      fontSize: "20px",
      color: isActive ? "#ED1F24" : "#000",
      transition: "0.3s",
    }),
  };

  return (
    <div style={styles.sidebar}>
      <nav>
        <ul style={styles.navList}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  style={{
                    ...styles.navLink,
                    fontWeight: isActive ? "bold" : "normal",
                    color: isActive ? "#ED1F24" : "#000",
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
