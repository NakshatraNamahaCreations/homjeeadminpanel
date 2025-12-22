import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { BASE_URL } from "../utils/config";

/* ------------------ DATE HELPERS ------------------ */

const toDisplay = (d) =>
  d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const yyyymmdd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const nextNDays = (n) => {
  const out = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push(d);
  }
  return out;
};

/* ------------------ COMPONENT ------------------ */

const TimePickerModal = ({
  onClose,
  onSelect,
  serviceType,
  packageId,        // ✅ can be ARRAY now
  coordinates,
  bookingId,
}) => {
  const [dates] = useState(nextNDays(14));
  const [selectedDate, setSelectedDate] = useState(yyyymmdd(dates[0]));
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);
const lat = coordinates?.lat;
const lng = coordinates?.lng;

  console.log("⏱ TimePicker props:", {
  serviceType,
  packageId,
  lat,
  lng,
});


  /* ------------------ FETCH SLOTS ------------------ */
useEffect(() => {
  if (!selectedDate || !lat || !lng || !serviceType) return;

  // 🔒 Deep cleaning must have at least one package
  if (
    serviceType === "deep_cleaning" &&
    (!Array.isArray(packageId) || packageId.length === 0)
  ) {
    setAvailableTimes([]);
    return;
  }

  const fetchSlots = async () => {
    setLoading(true);
    setAvailableTimes([]);
    setSelectedTime("");

    try {
      const payload =
        serviceType === "deep_cleaning"
          ? {
              serviceType: "deep_cleaning",
              packageId: [...packageId], // ✅ clone array
              date: selectedDate,
              lat,
              lng,
            }
          : {
              serviceType: "house_painting",
              date: selectedDate,
              lat,
              lng,
            };

      console.log("🟢 SLOT API PAYLOAD:", payload);

      const res = await fetch(`${BASE_URL}/slots/available-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("🟢 SLOT API RESPONSE:", data);

      setAvailableTimes(data?.success ? data.slots || [] : []);
    } catch (err) {
      console.error("Slot fetch error:", err);
      setAvailableTimes([]);
    } finally {
      setLoading(false);
    }
  };

  fetchSlots();
}, [
  selectedDate,
  serviceType,
  lat,
  lng,
  JSON.stringify(packageId), // ✅ VERY IMPORTANT
]);


  /* ------------------ CONFIRM SLOT ------------------ */

  const proceed = async () => {
    if (!selectedDate || !selectedTime) return;

    // CREATE LEAD FLOW
    if (!bookingId) {
      onSelect({
        slotDate: selectedDate,
        slotTime: selectedTime,
      });
      onClose();
      return;
    }

    // EDIT FLOW
    try {
      await fetch(`${BASE_URL}/bookings/update-slot/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedSlot: { slotDate: selectedDate, slotTime: selectedTime },
        }),
      });

      onSelect({
        slotDate: selectedDate,
        slotTime: selectedTime,
      });
      onClose();
    } catch (err) {
      alert("Failed to update slot");
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <div style={styles.header}>
          <h3>Select Service Time</h3>
          <FaTimes onClick={onClose} style={{ cursor: "pointer" }} />
        </div>

        {/* DATE PICKER */}
        <div style={styles.dateRow}>
          {dates.map((d) => {
            const id = yyyymmdd(d);
            const active = id === selectedDate;
            const [w, m, day] = toDisplay(d).split(" ");
            return (
              <button
                key={id}
                onClick={() => setSelectedDate(id)}
                style={{
                  ...styles.dateBtn,
                  border: active ? "2px solid #111" : "1px solid #ddd",
                }}
              >
                <div>{w}</div>
                <div>{m} {day}</div>
              </button>
            );
          })}
        </div>

        {/* TIME SLOTS */}
        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={styles.msg}>Loading slots…</div>
          ) : availableTimes.length === 0 ? (
            <div style={styles.msg}>No slots available for this date</div>
          ) : (
            <div style={styles.grid}>
              {availableTimes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  style={{
                    ...styles.timeBtn,
                    border:
                      selectedTime === t
                        ? "2px solid #111"
                        : "1px solid #ddd",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <button
            disabled={!selectedTime}
            onClick={proceed}
            style={{
              ...styles.confirmBtn,
              background: selectedTime ? "#111" : "#ccc",
            }}
          >
            Confirm Slot
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------ STYLES ------------------ */

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  sheet: {
    width: "90%",
    maxWidth: 700,
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRow: {
    display: "flex",
    gap: 10,
    padding: 16,
    overflowX: "auto",
  },
  dateBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "#fff",
    cursor: "pointer",
    minWidth: 100,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  timeBtn: {
    padding: 14,
    borderRadius: 10,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  msg: {
    textAlign: "center",
    color: "#777",
    padding: 20,
  },
  footer: {
    padding: 16,
    borderTop: "1px solid #eee",
  },
  confirmBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "none",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default TimePickerModal;





// import { useEffect, useState } from "react";
// import { FaTimes } from "react-icons/fa";
// import { BASE_URL } from "../utils/config";

// const hoursList = [
//   "08:00 AM",
//   "09:00 AM",
//   "10:00 AM",
//   "11:00 AM",
//   "12:00 PM",
//   "01:00 PM",
//   "02:00 PM",
//   "03:00 PM",
//   "04:00 PM",
//   "05:00 PM",
//   "06:00 PM",
//   "07:00 PM",
//   "08:00 PM",
//   // "09:00 PM",
//   // "10:00 PM",
// ];

// const toDisplay = (d) =>
//   d.toLocaleDateString("en-US", {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//   });

// const yyyymmdd = (d) => {
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const da = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${da}`;
// };

// const nextNDays = (n) => {
//   const out = [];
//   const now = new Date();
//   for (let i = 0; i < n; i++) {
//     const d = new Date(now);
//     d.setDate(now.getDate() + i);
//     out.push(d);
//   }
//   return out;
// };

// const formatTime = (time) => {
//   const [hours, minutes] = time.split(":");
//   const ampm = minutes.split(" ")[1];
//   let newHour = parseInt(hours);

//   if (ampm === "PM" && newHour !== 12) {
//     newHour += 12;
//   }
//   if (ampm === "AM" && newHour === 12) {
//     newHour = 0;
//   }

//   return `${String(newHour).padStart(2, "0")}:${minutes.split(" ")[0]}`;
// };

// const TimePickerModal = ({ onClose, onSelect, approxHours = 5, bookingId }) => {
//   const [dates] = useState(nextNDays(14));
//   const [selectedDate, setSelectedDate] = useState(yyyymmdd(dates[0]));
//   const [selectedTime, setSelectedTime] = useState("");
//   const [availableTimes, setAvailableTimes] = useState([]);
//   const [saving, setSaving] = useState(false);

//   // useEffect(() => {
//   //   const currentTime = new Date();
//   //   const currentHour = currentTime.getHours();
//   //   const currentMinute = currentTime.getMinutes();

//   //   const threeHoursLater = new Date(currentTime);
//   //   threeHoursLater.setHours(currentHour + 3, currentMinute, 0, 0);
//   //   const threeHoursLaterString = `${String(
//   //     threeHoursLater.getHours()
//   //   ).padStart(2, "0")}:${String(threeHoursLater.getMinutes()).padStart(
//   //     2,
//   //     "0"
//   //   )}`;

//   //   const filteredTimes = hoursList
//   //     .filter((time) => {
//   //       return formatTime(time) > threeHoursLaterString;
//   //     })
//   //     .slice(0, 10);

//   //   setAvailableTimes(filteredTimes);
//   // }, [selectedDate]);

//   // Updated proceed function to call API directly
 
//   useEffect(() => {
//   // Show all hours always, no filtering
//   setAvailableTimes(hoursList);
// }, [selectedDate]);


//   const proceed = async () => {
//     if (!selectedDate || !selectedTime) return;

//     const selectedSlot = {
//       slotDate: selectedDate,
//       slotTime: selectedTime,
//     };

//     // -------------------------
//     // CASE 1: CREATE LEAD — NO bookingId
//     // -------------------------
//     if (!bookingId) {
//       onSelect({
//         slotDate: selectedDate,
//         slotTime: selectedTime,
//         display: `${selectedTime}, ${selectedDate}`,
//       });
//       onClose();
//       return;
//     }

//     // -------------------------
//     // CASE 2: EDIT EXISTING — bookingId AVAILABLE
//     // -------------------------
//     setSaving(true);

//     try {
//       const res = await fetch(`${BASE_URL}/bookings/update-slot/${bookingId}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ selectedSlot }),
//       });

//       const data = await res.json();
//       if (!res.ok)
//         throw new Error(data?.message || "Failed to update time slot");

//       onSelect({
//         slotDate: selectedDate,
//         slotTime: selectedTime,
//         display: `${selectedTime}, ${selectedDate}`,
//       });

//       // alert("Time slot updated successfully!");
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating time slot");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div style={timeStyles.overlay}>
//       <div style={timeStyles.sheet}>
//         <div style={timeStyles.headerRow}>
//           <h3 style={{ margin: 0, fontSize: 18 }}>
//             When should the professional arrive?
//           </h3>
//           <FaTimes style={{ cursor: "pointer" }} onClick={onClose} />
//         </div>

//         <div style={{ padding: 16, color: "#666", fontSize: 14 }}>
//           Service will take approx. {approxHours} hrs
//         </div>

//         <div
//           style={{
//             display: "flex",
//             gap: 12,
//             padding: "0 16px 12px",
//             flexWrap: "wrap",
//           }}
//         >
//           {dates.map((d) => {
//             const id = yyyymmdd(d);
//             const active = id === selectedDate;
//             const [w, m, day] = toDisplay(d).split(" ");
//             return (
//               <button
//                 key={id}
//                 onClick={() => setSelectedDate(id)}
//                 style={{
//                   border: active ? "2px solid #111" : "1px solid #ddd",
//                   padding: "10px 14px",
//                   borderRadius: 10,
//                   background: "#fff",
//                   cursor: "pointer",
//                   minWidth: 110,
//                   fontWeight: 600,
//                 }}
//               >
//                 <div style={{ fontSize: 14 }}>{w}</div>
//                 <div style={{ fontSize: 12, color: "#333" }}>
//                   {m} {day}
//                 </div>
//               </button>
//             );
//           })}
//         </div>

//         <div style={{ padding: "0 16px 16px" }}>
//           <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
//             Select start time of service
//           </div>
//           <div style={timeStyles.grid}>
//             {availableTimes.map((t) => {
//               const active = t === selectedTime;
//               return (
//                 <button
//                   key={t}
//                   onClick={() => setSelectedTime(t)}
//                   style={{
//                     border: active ? "2px solid #111" : "1px solid #ddd",
//                     padding: "14px",
//                     borderRadius: 10,
//                     background: "#fff",
//                     cursor: "pointer",
//                     fontWeight: 600,
//                   }}
//                 >
//                   {t}
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         <div style={timeStyles.footer}>
//           <button
//             onClick={proceed}
//             disabled={!selectedDate || !selectedTime || saving}
//             style={{
//               width: "100%",
//               padding: "14px",
//               borderRadius: 12,
//               border: "none",
//               background: !selectedDate || !selectedTime ? "#d9d9d9" : "#111",
//               color: !selectedDate || !selectedTime ? "#888" : "#fff",
//               cursor:
//                 !selectedDate || !selectedTime ? "not-allowed" : "pointer",

//               fontWeight: 700,
//             }}
//           >
//             {saving ? "Updating..." : "Proceed to checkout"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const timeStyles = {
//   overlay: {
//     position: "fixed",
//     inset: 0,
//     background: "rgba(0,0,0,0.5)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 9999,
//     fontFamily: "'Poppins', sans-serif",
//   },
//   sheet: {
//     width: "90vw",
//     maxWidth: 700,
//     maxHeight: "75vh",
//     overflowY: "auto",
//     background: "#fff",
//     borderRadius: 12,
//     boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
//   },
//   headerRow: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: "16px 16px",
//     borderBottom: "1px solid #eee",
//     background: "#fff",
//     position: "sticky",
//     top: 0,
//     zIndex: 1,
//   },
//   grid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
//     gap: 14,
//   },
//   footer: {
//     position: "sticky",
//     bottom: 0,
//     padding: 16,
//     borderTop: "1px solid #eee",
//     background: "#fff",
//   },
// };

// export default TimePickerModal;
