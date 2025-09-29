import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import { FaSignOutAlt, FaPlus, FaBell, FaBars } from "react-icons/fa";
import CreateLeadModal from "../pages/CreateLeadModal";

const Header = ({ toggleSidebar }) => {
  const [showTooltip, setShowTooltip] = useState(false);
    const [showModal, setShowModal] = useState(false);

  const styles = {
    header: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid #ddd",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1000,
      height: "60px",
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    logo: {
      width: "100px",
      cursor: "pointer",
    },
    headerButtons: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      position: "relative",
    },
    tooltip: {
      position: "absolute",
      top: "45px",
      left: "50%",
      transform: "translateX(-50%)",
      backgroundColor: "#fff",
      color: "#000",
      padding: "5px 10px",
      borderRadius: "5px",
      fontSize: "12px",
      whiteSpace: "nowrap",
      visibility: showTooltip ? "visible" : "hidden",
      opacity: showTooltip ? 1 : 0,
      transition: "opacity 0.2s ease-in-out",
    },
  };

  return (
    <header style={styles.header}>
      <div style={styles.logoContainer}>
        <FaBars size={24} style={{ cursor: "pointer" }} onClick={toggleSidebar} />
        <img src={logo} alt="Logo" style={styles.logo} />
      </div>

      <div style={styles.headerButtons}>
        <div
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{ position: "relative" }}
        >
          <FaPlus  onClick={() => setShowModal(true)} style={{ color: "red", cursor: "pointer" }} />
          <div style={styles.tooltip}>New Lead/Enquiry</div>
        </div>

        <Link to="/notification">
          <FaBell size={18} color="red" />
        </Link>
            {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
      </div>
    </header>
  );
};

export default Header;
