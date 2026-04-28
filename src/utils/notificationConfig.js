// // notificationConfig.js
// import {
//   FaMoneyBillWave,
//   FaExclamationTriangle,
//   FaCheckCircle,
//   FaCalendarAlt,
//   FaBell,
//   FaUserPlus,
// } from "react-icons/fa";

// export const NOTIFICATION_CONFIG = {
//   NEW_LEAD_CREATED: {
//     label: "New Lead",
//     color: "#0d6efd",
//     bg: "#e7f1ff",
//     icon: FaUserPlus,
//   },

//   CUSTOMER_CANCEL_REQUESTED: {
//     label: "Customer Cancel",
//     color: "#dc3545",
//     bg: "#fdecea",
//     icon: FaExclamationTriangle,
//   },

//   VENDOR_CANCEL_REQUESTED: {
//     label: "Vendor Cancel",
//     color: "#fd7e14",
//     bg: "#fff4e5",
//     icon: FaExclamationTriangle,
//   },

//   PAYMENT_RECEIVED: {
//     label: "Payment",
//     color: "#28a745",
//     bg: "#e9f7ef",
//     icon: FaMoneyBillWave,
//   },

//   JOB_COMPLETED: {
//     label: "Completed",
//     color: "#007bff",
//     bg: "#eaf2ff",
//     icon: FaCheckCircle,
//   },

//   BOOKING_SCHEDULED: {
//     label: "Scheduled",
//     color: "#ffc107",
//     bg: "#fff8e1",
//     icon: FaCalendarAlt,
//   },

//   DEFAULT: {
//     label: "Notification",
//     color: "#6c757d",
//     bg: "#f8f9fa",
//     icon: FaBell,
//   },
// };


// notificationConfig.js
import {
  FaBell,
  FaUserPlus,
  FaExclamationTriangle,
} from "react-icons/fa";

export const NOTIFICATION_CONFIG = {
  // OTP-verified enquiry — customer hasn't booked yet (isEnquiry: true).
  // Click should open the enquiry detail page so admin can call/follow up.
  NEW_ENQUIRY_CREATED: {
    color: "#f0a30a",
    bg: "#fff8e1",
    icon: FaUserPlus,
    getRoute: (n) => `/enquiry-details/${n.bookingId}`,
  },

  NEW_LEAD_CREATED: {
    color: "#0d6efd",
    bg: "#e7f1ff",
    icon: FaUserPlus,
    getRoute: (n) => `/lead-details/${n.bookingId}`,
  },

  CUSTOMER_CANCEL_REQUESTED: {
    color: "#dc3545",
    bg: "#fdecea",
    icon: FaExclamationTriangle,
    getRoute: (n) => `/lead-details/${n.bookingId}`,
  },

  VENDOR_CANCEL_REQUESTED: {
    color: "#fd7e14",
    bg: "#fff4e5",
    icon: FaExclamationTriangle,
    getRoute: (n) => `/lead-details/${n.bookingId}`,
  },

  DEFAULT: {
    color: "#6c757d",
    bg: "#f8f9fa",
    icon: FaBell,
    getRoute: (n) => `/lead-details/${n.bookingId}`,
  },
};
