import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateLeadModal from "./CreateLeadModal";
import { FaMapMarkerAlt } from "react-icons/fa";
import { Badge } from "react-bootstrap";
import { BASE_URL } from "../utils/config";

const genUID = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const EnquiriesList = () => {
  const [showOld, setShowOld] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visibleLeads, setVisibleLeads] = useState(6);
  const navigate = useNavigate();

  const [newEnquiries, setNewEnquiries] = useState([]);
  const [oldEnquiries, setOldEnquiries] = useState([]);

  // ✅ loader
  const [loading, setLoading] = useState(true);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/bookings/get-all-enquiries`);
      const data = await res.json();

      if (!data.allEnquies) {
        setLoading(false);
        return;
      }

      const freshNew = [];
      const freshOld = [];

      data.allEnquies.forEach((booking) => {
        const enquiry = {
          _uid: genUID(),
          bookingId: booking?._id,
          date: booking?.selectedSlot?.slotDate
            ? new Date(booking.selectedSlot.slotDate).toLocaleDateString(
                "en-GB"
              )
            : "—",
          time: booking?.selectedSlot?.slotTime || "—",
          name: booking?.customer?.name || "",
          contact: booking?.customer?.phone
            ? `+91 ${booking.customer.phone}`
            : "",
          category:
            [...new Set((booking?.service || []).map((s) => s.category))].join(
              ", "
            ) || "Service",
          formName: booking?.formName || "—",
          filledData: {
            serviceType:
              (booking?.service || [])
                .map((s) => s.serviceName)
                .filter(Boolean)
                .join(", ") || "",
            location: booking?.address?.streetArea || "",
            houseNumber: booking?.address?.houseFlatNumber || "",
            landmark: booking?.address?.landMark || "",
            timeSlot: booking?.selectedSlot?.slotTime || "",
          },
          googleLocation: booking?.address?.location
            ? `https://maps.google.com/?q=${booking.address.location.coordinates[1]},${booking.address.location.coordinates[0]}`
            : "",
          createdDate: booking?.createdDate
            ? new Date(booking.createdDate).toLocaleDateString("en-GB")
            : "",
          createdTime: booking?.createdDate
            ? new Date(booking.createdDate).toLocaleTimeString()
            : "",
          raw: {
            ...booking,
            isRead: booking?.isRead || false,
            isDismmised: booking?.isDismmised || false,
          },
          timestamp: new Date(
            booking?.createdDate ||
              booking?.selectedSlot?.slotDate ||
              Date.now()
          ).getTime(),
        };

        if (booking.isDismmised) {
          freshOld.push({ ...enquiry, note: "Dismissed" });
        } else {
          freshNew.push(enquiry);
        }
      });

      const sortByDateDesc = (a, b) => b.timestamp - a.timestamp;

      setNewEnquiries(freshNew.sort(sortByDateDesc));
      setOldEnquiries(freshOld.sort(sortByDateDesc));
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    setVisibleLeads((v) => v + 6);
  };

  const getCardStyle = (enquiry) => ({
    backgroundColor: enquiry.raw?.isRead ? "#f8f9fa" : "#ebebeb",
    padding: "15px",
    borderRadius: "8px",
    width: "100%",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    cursor: "pointer",
    borderLeft: "4px solid #6c757d",
    opacity: enquiry.raw?.isRead ? 0.9 : 1,
  });

  const openDetails = (bookingId) => {
    navigate(`/enquiry-details/${bookingId}`);
  };

  // ----------------------------
  // JSX RETURN
  // ----------------------------
  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <h6 style={styles.heading}>Enquiries</h6>

        <div style={styles.headerContainerbtn}>
          <button
            style={styles.buttonPrimary}
            onClick={() => setShowModal(true)}
          >
            + Create New Lead/Enquiry
          </button>

          <button
            style={styles.buttonPrimary}
            onClick={() => navigate("/all-reminders")}
          >
            See All Reminders
          </button>
        </div>
      </div>

      <div style={styles.tabContainer}>
        <button
          style={!showOld ? styles.activeTab : styles.inactiveTab}
          onClick={() => {
            setShowOld(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          New Enquiries ({newEnquiries.length})
        </button>

        <button
          style={showOld ? styles.activeTab : styles.inactiveTab}
          onClick={() => {
            setShowOld(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Old Enquiries ({oldEnquiries.length})
        </button>
      </div>

      {loading ? (
        <div
          style={{
            height: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <div className="loader-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="mt-3 text-muted">Loading booking details...</p>

          <style>{`
          .loader-dots span {
            width: 10px;
            height: 10px;
            margin: 0 4px;
            background: #DC3545;
            border-radius: 50%;
            display: inline-block;
            animation: pulse 1s infinite alternate;
          }
          .loader-dots span:nth-child(2) {
            animation-delay: 0.2s;
          }
          .loader-dots span:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.6); opacity: 1; }
          }
        `}</style>
        </div>
      ) : (
        <>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {(showOld ? oldEnquiries : newEnquiries)
              .slice(0, visibleLeads)
              .map((enquiry) => (
                <div
                  key={enquiry._uid}
                  style={getCardStyle(enquiry)}
                  onClick={() => openDetails(enquiry.bookingId)}
                >
                  <div style={styles.cardHeader}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color:
                            enquiry.category === "Deep Cleaning"
                              ? "red"
                              : "#008E00",
                          margin: 0,
                        }}
                      >
                        {enquiry.category}
                      </p>

                      {enquiry.raw?.isRead && (
                        <Badge bg="success" style={{ fontSize: 10 }}>
                          Read
                        </Badge>
                      )}
                    </div>

                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
                      {enquiry.date}
                    </p>
                  </div>

                  <div style={styles.cardHeader}>
                    <p style={{ fontWeight: "bold", fontSize: 14, margin: 0 }}>
                      {enquiry.name}
                    </p>

                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
                      {enquiry.time}
                    </p>
                  </div>

                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    <FaMapMarkerAlt style={{ marginRight: 5 }} />
                    {enquiry.filledData?.location}
                  </p>

                  {showOld && enquiry.note && (
                    <p style={{ fontSize: 11, color: "#777", marginTop: 6 }}>
                      Moved to Old: <strong>{enquiry.note}</strong>
                    </p>
                  )}
                </div>
              ))}
          </div>

          {(showOld ? oldEnquiries : newEnquiries).length > visibleLeads && (
            <button
              style={{
                ...styles.buttonPrimary,
                marginTop: 15,
                backgroundColor: "#e0e0e0",
                alignSelf: "center",
              }}
              onClick={handleLoadMore}
            >
              Load More
            </button>
          )}
        </>
      )}

      {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
    minHeight: "100vh",
  },
  heading: { fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px" },
  buttonPrimary: {
    color: "black",
    padding: "10px 15px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  headerContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContainerbtn: { display: "flex", gap: "20px" },
  tabContainer: {
    display: "flex",
    marginBottom: "10px",
    marginTop: "4%",
  },
  activeTab: {
    flex: 1,
    padding: "10px",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    backgroundColor: "#e0e0e0",
    border: "none",
    borderRadius: "5px",
  },
  inactiveTab: {
    flex: 1,
    padding: "10px",
    textAlign: "center",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "5px",
    color: "#555",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};

export default EnquiriesList;

// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import CreateLeadModal from "./CreateLeadModal";
// import { FaMapMarkerAlt } from "react-icons/fa";
// import { Badge } from "react-bootstrap";
// import { BASE_URL } from "../utils/config";

// const genUID = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// const EnquiriesList = () => {
//   const [showOld, setShowOld] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [visibleLeads, setVisibleLeads] = useState(6);
//   const navigate = useNavigate();

//   const [newEnquiries, setNewEnquiries] = useState([]);
//   const [oldEnquiries, setOldEnquiries] = useState([]);

//  const fetchPendingBookings = async () => {
//   try {
//     const res = await fetch(`${BASE_URL}/bookings/get-all-enquiries`);
//     const data = await res.json();

//     if (!data.allEnquies) return;

//     const freshNew = [];
//     const freshOld = [];

//     data.allEnquies.forEach((booking) => {
//       const enquiry = {
//         _uid: genUID(),
//         bookingId: booking?._id,
//         date: booking?.selectedSlot?.slotDate
//           ? new Date(booking.selectedSlot.slotDate).toLocaleDateString("en-GB")
//           : "—",
//         time: booking?.selectedSlot?.slotTime || "—",
//         name: booking?.customer?.name || "",
//         contact: booking?.customer?.phone
//           ? `+91 ${booking.customer.phone}`
//           : "",
//         category:
//           [...new Set((booking?.service || []).map((s) => s.category))].join(
//             ", "
//           ) || "Service",
//         formName: booking?.formName || "—",
//         filledData: {
//           serviceType:
//             (booking?.service || [])
//               .map((s) => s.serviceName)
//               .filter(Boolean)
//               .join(", ") || "",
//           location: booking?.address?.streetArea || "",
//           houseNumber: booking?.address?.houseFlatNumber || "",
//           landmark: booking?.address?.landMark || "",
//           timeSlot: booking?.selectedSlot?.slotTime || "",
//         },
//         googleLocation: booking?.address?.location
//           ? `https://maps.google.com/?q=${booking.address.location.coordinates[1]},${booking.address.location.coordinates[0]}`
//           : "",
//         createdDate: booking?.createdDate
//           ? new Date(booking.createdDate).toLocaleDateString("en-GB")
//           : "",
//         createdTime: booking?.createdDate
//           ? new Date(booking.createdDate).toLocaleTimeString()
//           : "",
//         raw: {
//           ...booking,
//           isRead: booking?.isRead || false,
//           isDismmised: booking?.isDismmised || false,
//         },
//         // Add timestamp for sorting
//         timestamp: new Date(booking?.createdDate || booking?.selectedSlot?.slotDate || Date.now()).getTime()
//       };

//       if (booking.isDismmised) {
//         freshOld.push({ ...enquiry, note: "Dismissed" });
//       } else {
//         freshNew.push(enquiry);
//       }
//     });

//     // Sort by createdDate descending (newest first)
//     const sortByDateDesc = (a, b) => b.timestamp - a.timestamp;

//     setNewEnquiries(freshNew.sort(sortByDateDesc));
//     setOldEnquiries(freshOld.sort(sortByDateDesc));
//   } catch (err) {
//     console.error("Error fetching bookings:", err);
//   }
// };

//   useEffect(() => {
//     fetchPendingBookings();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleLoadMore = () => {
//     setVisibleLeads((v) => v + 6);
//   };

//   const getCardStyle = (enquiry) => ({
//     backgroundColor: enquiry.raw?.isRead ? "#f8f9fa" : "#ebebeb",
//     padding: "15px",
//     borderRadius: "8px",
//     width: "100%",
//     boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
//     cursor: "pointer",
//     borderLeft: "4px solid #6c757d",
//     opacity: enquiry.raw?.isRead ? 0.9 : 1,
//   });

//   const openDetails = (bookingId, enquiryObj) => {
//     navigate(`/enquiry-details/${bookingId}`);
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.headerContainer}>
//         <h6 style={styles.heading}>Enquiries</h6>

//         <div style={styles.headerContainerbtn}>
//           <button style={styles.buttonPrimary} onClick={() => setShowModal(true)}>
//             + Create New Lead/Enquiry
//           </button>

//           <button style={styles.buttonPrimary} onClick={() => navigate("/all-reminders")}>
//             See All Reminders
//           </button>
//         </div>
//       </div>

//       <div style={styles.tabContainer}>
//         <button
//           style={!showOld ? styles.activeTab : styles.inactiveTab}
//           onClick={() => {
//             setShowOld(false);
//             window.scrollTo({ top: 0, behavior: "smooth" });
//           }}
//         >
//           New Enquiries ({newEnquiries.length})
//         </button>

//         <button
//           style={showOld ? styles.activeTab : styles.inactiveTab}
//           onClick={() => {
//             setShowOld(true);
//             window.scrollTo({ top: 0, behavior: "smooth" });
//           }}
//         >
//           Old Enquiries ({oldEnquiries.length})
//         </button>
//       </div>

//       <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
//         {(showOld ? oldEnquiries : newEnquiries)
//           .slice(0, visibleLeads)
//           .map((enquiry) => (
//             <div
//               key={enquiry._uid}
//               style={getCardStyle(enquiry)}
//               onClick={() => openDetails(enquiry.bookingId, enquiry)}
//             >
//               <div style={styles.cardHeader}>
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <p
//                     style={{
//                       fontSize: 14,
//                       fontWeight: "bold",
//                       color: enquiry.category === "Deep Cleaning" ? "red" : "#008E00",
//                       margin: 0,
//                     }}
//                   >
//                     {enquiry.category}
//                   </p>

//                   {enquiry.raw?.isRead && (
//                     <Badge bg="success" style={{ fontSize: 10 }}>
//                       Read
//                     </Badge>
//                   )}
//                 </div>

//                 <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{enquiry.date}</p>
//               </div>

//               <div style={styles.cardHeader}>
//                 <p style={{ fontWeight: "bold", fontSize: 14, margin: 0 }}>{enquiry.name}</p>

//                 <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{enquiry.time}</p>
//               </div>

//               <p style={{ display: "flex", alignItems: "center", fontSize: 12, marginTop: 4 }}>
//                 <FaMapMarkerAlt style={{ marginRight: 5 }} />
//                 {enquiry.filledData?.location}
//               </p>

//               {showOld && enquiry.note && (
//                 <p style={{ fontSize: 11, color: "#777", marginTop: 6 }}>
//                   Moved to Old: <strong>{enquiry.note}</strong>
//                 </p>
//               )}
//             </div>
//           ))}
//       </div>

//       {(showOld ? oldEnquiries : newEnquiries).length > visibleLeads && (
//         <button
//           style={{
//             ...styles.buttonPrimary,
//             marginTop: 15,
//             backgroundColor: "#e0e0e0",
//             alignSelf: "center",
//           }}
//           onClick={handleLoadMore}
//         >
//           Load More
//         </button>
//       )}

//       {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
//     </div>
//   );
// };

// const styles = {
//   container: { padding: "20px", fontFamily: "'Poppins', sans-serif", minHeight: "100vh" },
//   heading: { fontSize: "1.2rem", fontWeight: "bold", marginBottom: "15px" },
//   buttonPrimary: {
//     color: "black",
//     padding: "10px 15px",
//     borderRadius: "5px",
//     border: "none",
//     cursor: "pointer",
//     fontWeight: "bold",
//     fontSize: "13px",
//   },
//   headerContainer: { display: "flex", justifyContent: "space-between", alignItems: "center" },
//   headerContainerbtn: { display: "flex", gap: "20px" },
//   tabContainer: { display: "flex", marginBottom: "10px", marginTop: "4%" },
//   activeTab: {
//     flex: 1,
//     padding: "10px",
//     textAlign: "center",
//     cursor: "pointer",
//     fontSize: "12px",
//     fontWeight: "bold",
//     backgroundColor: "#e0e0e0",
//     border: "none",
//     borderRadius: "5px",
//   },
//   inactiveTab: {
//     flex: 1,
//     padding: "10px",
//     textAlign: "center",
//     cursor: "pointer",
//     fontSize: "12px",
//     fontWeight: "bold",
//     backgroundColor: "transparent",
//     border: "none",
//     borderRadius: "5px",
//     color: "#555",
//   },
//   cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
// };

// export default EnquiriesList;
