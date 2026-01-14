import { useEffect, useMemo, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { BASE_URL } from "../utils/config";
import axios from "axios";

/* ------------------ HELPERS ------------------ */

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

const RescheduleTimePickerModal = ({ booking, onClose, onRescheduled }) => {
  const dates = useMemo(() => nextNDays(14), []);

  const [availableTimes, setAvailableTimes] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ------------------ LOCATION & SERVICE ------------------ */

  const serviceType = booking?.serviceType;
  const lat = booking?.address?.location?.coordinates?.[1];
  const lng = booking?.address?.location?.coordinates?.[0];

  const packageId = useMemo(() => {
    if (serviceType !== "deep_cleaning") return [];
    return booking?.service?.map((s) => s.packageId).filter(Boolean) || [];
  }, [booking, serviceType]);

  /* ------------------ INITIAL STATE (FIXED) ------------------ */

  // ✅ Always today (not booking date)
  const [selectedDate, setSelectedDate] = useState(yyyymmdd(new Date()));

  // ✅ No pre-selected time
  const [selectedTime, setSelectedTime] = useState("");

  /* ------------------ FETCH AVAILABLE SLOTS ------------------ */

  useEffect(() => {
    if (!selectedDate || !lat || !lng || !serviceType) return;
    if (serviceType === "deep_cleaning" && packageId.length === 0) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setAvailableTimes([]);
      setSelectedTime(""); // ✅ reset time on date change

      try {
        const payload =
          serviceType === "deep_cleaning"
            ? { serviceType, packageId, date: selectedDate, lat, lng }
            : { serviceType, date: selectedDate, lat, lng };

        const res = await axios.post(
          `${BASE_URL}/slots/available-slots`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = res.data;
        setAvailableTimes(data?.success ? data.slots || [] : []);
      } catch (err) {
        console.error("Slot fetch error:", err);
        setAvailableTimes([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, serviceType, lat, lng, JSON.stringify(packageId)]);

  /* ------------------ CONFIRM RESCHEDULE ------------------ */

  const confirmReschedule = async () => {
    if (!selectedDate || !selectedTime || submitting) return;

    setSubmitting(true);

    try {
      const res = await axios.put(
        `${BASE_URL}/slot/admin/reschedule-booking/${booking._id}`,
        null,
        {
          params: {
            slotDate: selectedDate,
            slotTime: selectedTime,
          },
        }
      );

      const data = res.data;

      if (!data.success) {
        throw new Error(data.message || "Reschedule failed");
      }

      toast.success("Booking rescheduled successfully 🎉");

      onRescheduled?.({
        slotDate: selectedDate,
        slotTime: selectedTime,
        mode: data.mode,
        newBookingId: data.newBookingId,
      });

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reschedule booking");
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------ UI ------------------ */

  return (
    <div style={styles.overlay}>
      <div style={styles.sheet}>
        <div style={styles.scrollArea}>
          <div style={styles.header}>
            <div>
              <h3 style={{ fontSize: 16, margin: 0 }}>
                Reschedule Service Time
              </h3>
              <div style={{ fontSize: 11, color: "#777" }}>
                Current:&nbsp;
                <b>
                  {booking?.selectedSlot?.slotDate}{" "}
                  {booking?.selectedSlot?.slotTime}
                </b>
              </div>
            </div>
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
                  <div>
                    {m} {day}
                  </div>
                </button>
              );
            })}
          </div>

          {/* SLOT PICKER */}
          <div style={styles.slotArea}>
            {loadingSlots ? (
              <div style={styles.msg}>Loading slots…</div>
            ) : availableTimes.length === 0 ? (
              <div style={styles.msg}>No slots available</div>
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
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <button
            disabled={!selectedTime || submitting}
            onClick={confirmReschedule}
            style={{
              ...styles.confirmBtn,
              background: !selectedTime || submitting ? "#ccc" : "#111",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Rescheduling..." : "Confirm Reschedule"}
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
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  sheet: {
    width: "90%",
    maxWidth: 700,
    height: "85vh",
    background: "#fff",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
  },
  scrollArea: { flex: 1, overflowY: "auto" },
  header: {
    padding: 14,
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
  },
  dateRow: { display: "flex", gap: 8, padding: 12, overflowX: "auto" },
  dateBtn: {
    padding: "8px 10px",
    borderRadius: 8,
    minWidth: 85,
    fontSize: 12,
    fontWeight: 600,
    background: "#fff",
  },
  slotArea: { padding: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  timeBtn: {
    padding: 10,
    borderRadius: 8,
    background: "#fff",
    fontSize: 13,
    fontWeight: 500,
  },
  msg: { textAlign: "center", padding: 20, fontSize: 13, color: "#777" },
  footer: { padding: 14, borderTop: "1px solid #eee" },
  confirmBtn: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    color: "#fff",
    border: "none",
    fontWeight: 600,
  },
};

export default RescheduleTimePickerModal;
