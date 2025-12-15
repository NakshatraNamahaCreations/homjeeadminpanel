import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import { FaSignOutAlt, FaPlus, FaBell, FaBars, FaTimes, FaMoneyBillWave, FaExclamationTriangle, FaCheckCircle, FaCalendarAlt, FaUserClock, FaChevronDown } from "react-icons/fa";
import CreateLeadModal from "../pages/CreateLeadModal";

const Header = ({ toggleSidebar }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6); // Show 6 notifications initially

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
      zIndex: 1050,
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
      gap: "15px",
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
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      zIndex: 100,
    },
    notificationSlider: {
      position: "fixed",
      top: "60px",
      right: showNotification ? "0" : "-400px",
      width: "350px",
      height: "calc(100vh - 60px)",
      backgroundColor: "#fff",
      boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
      transition: "right 0.3s ease-in-out",
      zIndex: 1040,
      overflowY: "auto",
      padding: "15px",
    },
    notificationHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: "12px",
      borderBottom: "1px solid #eaeaea",
      marginBottom: "15px",
    },
    notificationTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      margin: 0,
    },
    notificationItem: {
      padding: "10px 12px",
      marginBottom: "10px",
      borderRadius: "6px",
      borderLeft: "4px solid",
      backgroundColor: "#f8f9fa",
      transition: "all 0.2s ease",
      cursor: "pointer",
      minHeight: "70px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      "&:hover": {
        backgroundColor: "#f0f0f0",
        transform: "translateX(-2px)",
      },
    },
    notificationContent: {
      display: "flex",
      alignItems: "flex-start",
      width: "100%",
    },
    notificationIcon: {
      marginRight: "10px",
      fontSize: "16px",
      flexShrink: 0,
      marginTop: "2px",
    },
    notificationText: {
      flex: 1,
      minWidth: 0,
    },
    notificationTitleText: {
      margin: "0 0 3px 0",
      fontWeight: "600",
      fontSize: "14px",
      lineHeight: "1.3",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitLineClamp: 1,
      WebkitBoxOrient: "vertical",
    },
    notificationMessage: {
      margin: 0,
      fontSize: "12px",
      color: "#495057",
      lineHeight: "1.4",
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
    },
    notificationTime: {
      fontSize: "11px",
      color: "#6c757d",
      marginTop: "4px",
    },
    overlay: {
      position: "fixed",
      top: "60px",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 1039,
      display: showNotification ? "block" : "none",
      transition: "opacity 0.3s ease",
    },
  };

  // Dummy notification data - increased to 12 for demo
  const notifications = [
    {
      id: 1,
      type: "payment",
      title: "Payment Received",
      message: "Payment of ₹2,500 received from customer Ramesh Kumar",
      time: "10 minutes ago",
      icon: <FaMoneyBillWave style={{ color: "#28a745" }} />,
      color: "#28a745",
    },
    {
      id: 2,
      type: "cancellation",
      title: "Booking Cancelled",
      message: "Deep cleaning booking cancelled by customer Priya Sharma",
      time: "1 hour ago",
      icon: <FaExclamationTriangle style={{ color: "#dc3545" }} />,
      color: "#dc3545",
    },
    {
      id: 3,
      type: "completion",
      title: "Job Completed",
      message: "House painting project completed successfully",
      time: "3 hours ago",
      icon: <FaCheckCircle style={{ color: "#007bff" }} />,
      color: "#007bff",
    },
    {
      id: 4,
      type: "schedule",
      title: "New Booking Scheduled",
      message: "New deep cleaning booking scheduled for tomorrow at 2 PM",
      time: "5 hours ago",
      icon: <FaCalendarAlt style={{ color: "#ffc107" }} />,
      color: "#ffc107",
    },
    {
      id: 5,
      type: "payment",
      title: "Payment Pending",
      message: "Final payment of ₹4,200 pending from customer Anil Patel",
      time: "1 day ago",
      icon: <FaUserClock style={{ color: "#6c757d" }} />,
      color: "#6c757d",
    },
    {
      id: 6,
      type: "cancellation",
      title: "Service Rescheduled",
      message: "Bathroom cleaning service rescheduled to next week",
      time: "2 days ago",
      icon: <FaCalendarAlt style={{ color: "#17a2b8" }} />,
      color: "#17a2b8",
    },
    {
      id: 7,
      type: "payment",
      title: "Partial Payment Received",
      message: "Partial payment of ₹1,000 received for booking #HJ-20251210-2261",
      time: "2 days ago",
      icon: <FaMoneyBillWave style={{ color: "#20c997" }} />,
      color: "#20c997",
    },
    {
      id: 8,
      type: "system",
      title: "System Update",
      message: "New features added to the admin panel",
      time: "3 days ago",
      icon: <FaCheckCircle style={{ color: "#6610f2" }} />,
      color: "#6610f2",
    },
    {
      id: 9,
      type: "payment",
      title: "Payment Confirmed",
      message: "Payment of ₹3,800 confirmed for booking #HJ-20251211-2456",
      time: "4 days ago",
      icon: <FaMoneyBillWave style={{ color: "#28a745" }} />,
      color: "#28a745",
    },
    {
      id: 10,
      type: "cancellation",
      title: "Service Cancelled",
      message: "Kitchen cleaning service cancelled due to customer request",
      time: "5 days ago",
      icon: <FaExclamationTriangle style={{ color: "#dc3545" }} />,
      color: "#dc3545",
    },
    {
      id: 11,
      type: "completion",
      title: "Project Delivered",
      message: "Deep cleaning project delivered successfully",
      time: "6 days ago",
      icon: <FaCheckCircle style={{ color: "#007bff" }} />,
      color: "#007bff",
    },
    {
      id: 12,
      type: "schedule",
      title: "Maintenance Scheduled",
      message: "Monthly maintenance scheduled for next Monday",
      time: "1 week ago",
      icon: <FaCalendarAlt style={{ color: "#ffc107" }} />,
      color: "#ffc107",
    },
  ];

  const handleNotificationClick = (notification) => {
    console.log("Notification clicked:", notification);
  };

  const handleLoadMore = () => {
    // Load 3 more notifications each time
    setVisibleCount(prevCount => Math.min(prevCount + 3, notifications.length));
  };

  const visibleNotifications = notifications.slice(0, visibleCount);

  // Reset visible count when notification slider closes
  useEffect(() => {
    if (!showNotification) {
      setVisibleCount(6);
    }
  }, [showNotification]);

  return (
    <>
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
            <FaPlus onClick={() => setShowModal(true)} style={{ color: "red", cursor: "pointer", fontSize: "18px" }} />
            <div style={styles.tooltip}>New Lead/Enquiry</div>
          </div>

          <div
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => setShowNotification(!showNotification)}
          >
            <FaBell size={18} color="red" />
            {/* Notification badge */}
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  backgroundColor: "#ff021cff",
                  color: "white",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {notifications.length}
              </span>
            )}
          </div>

          {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
        </div>
      </header>

      {/* Notification Slider */}
      <div 
        style={styles.overlay}
        onClick={() => setShowNotification(false)}
      />
      
      <div style={styles.notificationSlider} className="notification-slider">
        <div style={styles.notificationHeader}>
          <h5 style={styles.notificationTitle}>Notifications</h5>
          <FaTimes 
            size={20} 
            style={{ cursor: "pointer", color: "#6c757d" }} 
            onClick={() => setShowNotification(false)}
          />
        </div>

        {visibleNotifications.length > 0 ? (
          <>
            {visibleNotifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  ...styles.notificationItem,
                  borderLeftColor: notification.color,
                }}
                onClick={() => handleNotificationClick(notification)}
                className="notification-item"
              >
                <div style={styles.notificationContent}>
                  <div style={styles.notificationIcon}>
                    {notification.icon}
                  </div>
                  <div style={styles.notificationText}>
                    <h6 style={styles.notificationTitleText}>
                      {notification.title}
                    </h6>
                    <p style={styles.notificationMessage}>
                      {notification.message}
                    </p>
                    <div style={styles.notificationTime}>
                      {notification.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {visibleCount < notifications.length && (
              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleLoadMore}
                  style={{ 
                    padding: "5px 20px", 
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    margin: "0 auto",
                  }}
                >
                  <FaChevronDown size={12} />
                  Load More ({notifications.length - visibleCount} remaining)
                </button>
              </div>
            )}

            {/* Show message when all notifications are loaded */}
            {visibleCount >= notifications.length && (
              <div style={{ 
                textAlign: "center", 
                marginTop: "15px",
                padding: "10px",
                color: "#6c757d",
                fontSize: "12px",
                borderTop: "1px solid #eaeaea",
                paddingTop: "15px"
              }}>
                It's showing all notifications
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <FaBell size={48} color="#e0e0e0" />
            <p style={{ marginTop: "20px", color: "#6c757d" }}>
              No new notifications
            </p>
          </div>
        )}
      </div>

      {/* Add some CSS for better animation and hover effects */}
      <style jsx="true">{`
        .notification-slider {
          scrollbar-width: thin;
          scrollbar-color: #ddd #f5f5f5;
        }
        
        .notification-slider::-webkit-scrollbar {
          width: 6px;
        }
        
        .notification-slider::-webkit-scrollbar-track {
          background: #f5f5f5;
        }
        
        .notification-slider::-webkit-scrollbar-thumb {
          background-color: #ddd;
          border-radius: 3px;
        }
        
        .notification-item:hover {
          box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        }
        
        .btn-outline-primary {
          color: #007bff;
          border-color: #007bff;
        }
        
        .btn-outline-primary:hover {
          color: #fff;
          background-color: #007bff;
          border-color: #007bff;
        }
        
        @keyframes slideIn {
          from {
            right: -400px;
          }
          to {
            right: 0;
          }
        }
        
        @keyframes slideOut {
          from {
            right: 0;
          }
          to {
            right: -400px;
          }
        }
      `}</style>
    </>
  );
};

export default Header;
// import React, { useState } from "react";
// import { Link } from "react-router-dom";
// import logo from "../assets/logo.svg";
// import { FaSignOutAlt, FaPlus, FaBell, FaBars } from "react-icons/fa";
// import CreateLeadModal from "../pages/CreateLeadModal";

// const Header = ({ toggleSidebar }) => {
//   const [showTooltip, setShowTooltip] = useState(false);
//     const [showModal, setShowModal] = useState(false);

//   const styles = {
//     header: {
//       width: "100%",
//       display: "flex",
//       justifyContent: "space-between",
//       alignItems: "center",
//       padding: "10px 20px",
//       backgroundColor: "#f8f9fa",
//       borderBottom: "1px solid #ddd",
//       position: "fixed",
//       top: 0,
//       left: 0,
//       zIndex: 1000,
//       height: "60px",
//     },
//     logoContainer: {
//       display: "flex",
//       alignItems: "center",
//       gap: "10px",
//     },
//     logo: {
//       width: "100px",
//       cursor: "pointer",
//     },
//     headerButtons: {
//       display: "flex",
//       alignItems: "center",
//       gap: "10px",
//       position: "relative",
//     },
//     tooltip: {
//       position: "absolute",
//       top: "45px",
//       left: "50%",
//       transform: "translateX(-50%)",
//       backgroundColor: "#fff",
//       color: "#000",
//       padding: "5px 10px",
//       borderRadius: "5px",
//       fontSize: "12px",
//       whiteSpace: "nowrap",
//       visibility: showTooltip ? "visible" : "hidden",
//       opacity: showTooltip ? 1 : 0,
//       transition: "opacity 0.2s ease-in-out",
//     },
//   };

//   return (
//     <header style={styles.header}>
//       <div style={styles.logoContainer}>
//         <FaBars size={24} style={{ cursor: "pointer" }} onClick={toggleSidebar} />
//         <img src={logo} alt="Logo" style={styles.logo} />
//       </div>

//       <div style={styles.headerButtons}>
//         <div
//           onMouseEnter={() => setShowTooltip(true)}
//           onMouseLeave={() => setShowTooltip(false)}
//           style={{ position: "relative" }}
//         >
//           <FaPlus  onClick={() => setShowModal(true)} style={{ color: "red", cursor: "pointer" }} />
//           <div style={styles.tooltip}>New Lead/Enquiry</div>
//         </div>

//         <Link to="/notification">
//           <FaBell size={18} color="red" />
//         </Link>
//             {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
//       </div>
//     </header>
//   );
// };

// export default Header;
