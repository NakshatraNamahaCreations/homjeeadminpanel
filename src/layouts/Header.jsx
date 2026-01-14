import React, { useEffect, useMemo, useState } from "react";
import { FaBars, FaPlus, FaBell, FaUserCircle } from "react-icons/fa";
import axios from "axios";
import logo from "../assets/logo.svg";
import CreateLeadModal from "../pages/CreateLeadModal";
import NotificationPanel from "./NotificationPanel";
import { BASE_URL } from "../utils/config";

const Header = ({ toggleSidebar }) => {
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ logged in admin (from localStorage)
  const loggedAdmin = useMemo(() => {
    try {
      const adminData = localStorage.getItem("adminData");
      if (adminData) return JSON.parse(adminData);

      const adminAuth = localStorage.getItem("adminAuth");
      if (adminAuth) return JSON.parse(adminAuth);

      return null;
    } catch (e) {
      return null;
    }
  }, []);

  const adminName = loggedAdmin?.name || "Admin";
  const adminMobile = loggedAdmin?.mobileNumber ? `(${loggedAdmin.mobileNumber})` : "";

  /* ✅ SINGLE SOURCE OF TRUTH */
  const fetchNotifications = async (pageNo = 1, append = false) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/in-app-notify/fetch-admin-notifications?page=${pageNo}&limit=15`
      );

      const { data, unreadCount, pagination } = res.data;

      setUnreadCount(unreadCount ?? 0);
      setHasNextPage(pagination?.hasNextPage ?? false);
      setPage(pageNo);

      setNotifications((prev) => (append ? [...prev, ...data] : data));
    } catch (err) {
      console.error("❌ Notification fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, []);

  useEffect(() => {
    const onFocus = () => fetchNotifications(1, false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.post(`${BASE_URL}/in-app-notify/mark-notification-read/${id}`);

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, status: "read" } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("❌ Mark read error:", err);
    }
  };

  return (
    <>
      <header
        style={{
          height: 60,
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f8f9fa",
          borderBottom: "1px solid #ddd",
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 1050,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FaBars size={22} onClick={toggleSidebar} />
          <img src={logo} alt="Logo" style={{ width: 100 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* ✅ Logged in Admin */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaUserCircle size={18} color="#333" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>
              {adminName} 
            </span>
          </div>

          <FaPlus style={{ color: "red", cursor: "pointer" }} onClick={() => setShowModal(true)} />

          <div
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => setShowNotification(true)}
          >
            <FaBell size={18} color="red" />

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-10px",
                  background: "red",
                  color: "#fff",
                  borderRadius: "50%",
                  fontSize: 10,
                  padding: "2px 5px",
                  textAlign: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <NotificationPanel
        show={showNotification}
        onClose={() => setShowNotification(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        hasNextPage={hasNextPage}
        onLoadMore={() => fetchNotifications(page + 1, true)}
        onMarkRead={markAsRead}
      />

      {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default Header;
