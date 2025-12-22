import React from "react";
import {
  FaBell,
  FaTimes,
  FaChevronDown,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendarAlt,
} from "react-icons/fa";
import { NOTIFICATION_CONFIG } from "../utils/notificationConfig";
import { useNavigate } from "react-router-dom";

const iconMap = (type, color) => {
  switch (type) {
    case "payment":
      return <FaMoneyBillWave style={{ color }} />;
    case "cancellation":
      return <FaExclamationTriangle style={{ color }} />;
    case "completion":
      return <FaCheckCircle style={{ color }} />;
    case "schedule":
      return <FaCalendarAlt style={{ color }} />;
    default:
      return <FaBell style={{ color }} />;
  }
};

const notificationStyleMap = {
  payment: {
    border: "#28a745",
    bg: "#e9f7ef",
    iconColor: "#28a745",
  },
  cancellation: {
    border: "#dc3545",
    bg: "#fdecea",
    iconColor: "#dc3545",
  },
  completion: {
    border: "#007bff",
    bg: "#eaf2ff",
    iconColor: "#007bff",
  },
  schedule: {
    border: "#ffc107",
    bg: "#fff8e1",
    iconColor: "#ffc107",
  },
  default: {
    border: "#6c757d",
    bg: "#f8f9fa",
    iconColor: "#6c757d",
  },
};

const NotificationPanel = ({
  show,
  onClose,
  notifications,
  unreadCount,
  hasNextPage,
  loading,
  onLoadMore,
  onMarkRead,
}) => {
  if (!show) return null;
  const navigate = useNavigate();

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1039,
        }}
      />

      {/* Panel */}
      <div
        className="notification-slider"
        style={{
          position: "fixed",
          top: 60,
          right: 0,
          width: 350,
          height: "calc(100vh - 60px)",
          background: "#fff",
          zIndex: 1040,
          overflowY: "auto",
          padding: 15,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 12,
            borderBottom: "1px solid #eaeaea",
            marginBottom: 15,
          }}
        >
          <h5 style={{ margin: 0, fontWeight: "bold" }}>
            Notifications{" "}
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#dc3545",
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 12,
                  marginLeft: 6,
                }}
              >
                {unreadCount}
              </span>
            )}
          </h5>
          <FaTimes
            size={18}
            style={{ cursor: "pointer", color: "#6c757d" }}
            onClick={onClose}
          />
        </div>

        {/* Empty */}
        {notifications.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <FaBell size={48} color="#e0e0e0" />
            <p style={{ marginTop: 20, color: "#6c757d" }}>No notifications</p>
          </div>
        )}

        {/* Notification cards (SAME AS HEADER UI) */}
        {notifications.map((n) => {
          const config =
            NOTIFICATION_CONFIG[n.notificationType] ||
            NOTIFICATION_CONFIG.DEFAULT;

          const Icon = config.icon;

          return (
            <div
              key={n._id}
              onClick={() => {
                if (n.status === "unread") onMarkRead(n._id);

                const config =
                  NOTIFICATION_CONFIG[n.notificationType] ||
                  NOTIFICATION_CONFIG.DEFAULT;

                const route = config.getRoute?.(n);
                if (route) {
                  navigate(route);
                  onClose(); // ✅ close notification panel after redirect
                }
              }}
              className="notification-item"
              style={{
                padding: "12px",
                marginBottom: 12,
                borderRadius: 8,
                borderLeft: `5px solid ${config.color}`,
                background: n.status === "unread" ? config.bg : "#fff",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div
                  style={{
                    marginRight: 12,
                    fontSize: 18,
                    color: config.color,
                  }}
                >
                  <Icon />
                </div>

                <div style={{ flex: 1 }}>
                  <h6
                    style={{
                      margin: "0 0 4px",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {n.thumbnailTitle}
                  </h6>

                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "#495057",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.message}
                  </p>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#6c757d",
                      marginTop: 6,
                    }}
                  >
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load more */}
        {hasNextPage && (
          <button
            className="btn btn-outline-danger btn-sm w-100"
            disabled={loading}
            onClick={onLoadMore}
            style={{ marginTop: 10 }}
          >
            <FaChevronDown /> {loading ? "Loading..." : "Load More"}
          </button>
        )}
      </div>

      {/* Hover + scrollbar effects (same as Header) */}
      <style jsx="true">{`
        .notification-slider {
          scrollbar-width: thin;
          scrollbar-color: #ddd #f5f5f5;
        }

        .notification-slider::-webkit-scrollbar {
          width: 6px;
        }

        .notification-slider::-webkit-scrollbar-thumb {
          background-color: #ddd;
          border-radius: 3px;
        }

        .notification-item:hover {
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
          background: #f0f0f0;
        }
      `}</style>
    </>
  );
};

export default NotificationPanel;

// import React from "react";
// import {
//   FaBell,
//   FaTimes,
//   FaChevronDown,
//   FaMoneyBillWave,
//   FaExclamationTriangle,
//   FaCheckCircle,
//   FaCalendarAlt,
// } from "react-icons/fa";

// const iconMap = {
//   payment: <FaMoneyBillWave color="#28a745" />,
//   cancellation: <FaExclamationTriangle color="#dc3545" />,
//   completion: <FaCheckCircle color="#007bff" />,
//   schedule: <FaCalendarAlt color="#ffc107" />,
//   default: <FaBell color="#6c757d" />,
// };

// const NotificationPanel = ({
//   show,
//   onClose,
//   notifications,
//   unreadCount,
//   hasNextPage,
//   loading,
//   onLoadMore,
//   onMarkRead,
// }) => {
//   if (!show) return null;

//   return (
//     <>
//       {/* Overlay */}
//       <div
//         onClick={onClose}
//         style={{
//           position: "fixed",
//           inset: 0,
//           background: "rgba(0,0,0,0.5)",
//           zIndex: 1039,
//         }}
//       />

//       {/* Panel */}
//       <div
//         style={{
//           position: "fixed",
//           top: 60,
//           right: 0,
//           width: 350,
//           height: "calc(100vh - 60px)",
//           background: "#fff",
//           zIndex: 1040,
//           overflowY: "auto",
//           padding: 15,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "space-between",
//             marginBottom: 12,
//           }}
//         >
//           <h5>
//             Notifications{" "}
//             {unreadCount > 0 && (
//               <span
//                 style={{
//                   background: "#dc3545",
//                   color: "#fff",
//                   padding: "2px 8px",
//                   borderRadius: 12,
//                   fontSize: 12,
//                 }}
//               >
//                 {unreadCount}
//               </span>
//             )}
//           </h5>
//           <FaTimes onClick={onClose} style={{ cursor: "pointer" }} />
//         </div>

//         {notifications.length === 0 && !loading && (
//           <p style={{ textAlign: "center", color: "#777" }}>
//             No notifications
//           </p>
//         )}

//         {notifications.map((n) => (
//           <div
//             key={n._id}
//             onClick={() =>
//               n.status === "unread" && onMarkRead(n._id)
//             }
//             style={{
//               padding: 10,
//               marginBottom: 10,
//               borderLeft: `4px solid ${
//                 n.status === "unread" ? "#dc3545" : "#ccc"
//               }`,
//               background: n.status === "unread" ? "#f8f9fa" : "#fff",
//               cursor: "pointer",
//             }}
//           >
//             <div style={{ display: "flex", gap: 10 }}>
//               {iconMap[n.notificationType] || iconMap.default}
//               <div>
//                 <strong>{n.thumbnailTitle}</strong>
//                 <p style={{ fontSize: 12 }}>{n.message}</p>
//                 <small style={{ color: "#777" }}>
//                   {new Date(n.createdAt).toLocaleString()}
//                 </small>
//               </div>
//             </div>
//           </div>
//         ))}

//         {hasNextPage && (
//           <button
//             className="btn btn-outline-danger btn-sm w-100"
//             disabled={loading}
//             onClick={onLoadMore}
//           >
//             <FaChevronDown />{" "}
//             {loading ? "Loading..." : "Load More"}
//           </button>
//         )}
//       </div>
//     </>
//   );
// };

// export default NotificationPanel;
