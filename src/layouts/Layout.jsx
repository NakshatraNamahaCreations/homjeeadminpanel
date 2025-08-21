import React, { useState } from "react";
import { Outlet } from "react-router-dom"; // ✅ Import Outlet
import Sidebar from "./Sidebar";
import Header from "./Header";

const Layout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const styles = {
    content: {
      marginTop: "60px", // Height of the header
      marginLeft: isOpen ? "250px" : "60px", // Width of the sidebar
      padding: "20px",
      transition: "margin-left 0.3s",
    },
  };

  return (
    <>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={isOpen} />
      <main style={styles.content}>
        <Outlet /> {/* ✅ This ensures pages inside Layout are rendered */}
      </main>
    </>
  );
};

export default Layout;
