import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";
import { FaArrowLeft, FaPhone, FaMapMarkerAlt, FaClock } from "react-icons/fa";

const AllReminders = () => {
  const [reminders, setReminders] = useState([]);
  const navigate = useNavigate();

  const loadReminders = async () => {
    const res = await fetch(`${BASE_URL}/reminders/pending-reminder`);
    const data = await res.json();

    if (data.success) setReminders(data.reminders);
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleReminderClick = async (rem) => {
    console.log("rem", rem?.bookingId?._id)
    await fetch(`${BASE_URL}/reminders/${rem._id}/check`, { method: "PATCH" });

    navigate(`/enquiries/${rem?.bookingId?._id}`);
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate("/enquiries")}
        >
          <FaArrowLeft /> Back
        </button>
        <h5 style={{ margin: 0 }}>All Pending Reminders</h5>
      </div>

      {/* REMINDER LIST */}
      <div style={styles.listContainer}>
        {reminders.length === 0 ? (
          <p style={{ fontSize: 14 }}>No pending reminders.</p>
        ) : (
          reminders.map((rem) => {
            const b = rem.bookingId;

            return (
              <div
                key={rem._id}
                style={styles.card}
                onClick={() => handleReminderClick(rem)}
              >
                <div style={styles.row}>
                  <div>
                    <span style={styles.name}>
                      Customer Name: {b?.customer?.name}
                    </span>
                    <span style={styles.phone}>
                      <span style={styles.name}> PhoneNo: </span>
                      <FaPhone /> {b?.customer?.phone}
                    </span>
                  </div>
                  <span style={styles.service}>
                    {b?.serviceType === "deep_cleaning"
                      ? "Deep Cleaning"
                      : "House Painting"}
                  </span>
                </div>

                <div style={styles.row2}>
                  <span style={styles.address}>
                    <span style={styles.name}> Address: </span>
                    <FaMapMarkerAlt />
                    {b?.address?.streetArea ||
                      b?.address?.landMark ||
                      "No Address"}
                  </span>

                  <span style={styles.slot}>
                    Slot: {b?.selectedSlot?.slotDate} |{" "}
                    {b?.selectedSlot?.slotTime}
                  </span>

                  <span style={styles.reminder}>
                    <FaClock />{" "}
                    {new Date(rem.reminderDate).toLocaleDateString()} at{" "}
                    {rem.reminderTime}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AllReminders;

/* ------------ COMPACT STYLES ------------ */
const styles = {
  container: {
    padding: "20px",
    fontFamily: "'Poppins', sans-serif",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },

  backButton: {
    background: "transparent",
    border: "1px solid black",
    padding: "6px 12px",
    borderRadius: 6,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
  },

  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  card: {
    padding: "12px 16px",
    borderRadius: 6,
    backgroundColor: "#fff",
    border: "1px solid #e5e5e5",
    cursor: "pointer",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 500,
  },

  name: { fontWeight: 600, color: "#000" },

  phone: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "#444",
    marginBottom: "10px",
  },

  service: {
    padding: "3px 8px",
    background: "#f1f1f1",
    borderRadius: 4,
    fontSize: 11,
  },

  row2: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  address: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    maxWidth: "30%",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  slot: { fontWeight: 600, fontSize: 12 },

  reminder: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: "#d9534f",
    fontWeight: 600,
  },
};
