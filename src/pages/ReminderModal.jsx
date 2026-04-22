import React, { useMemo, useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { BASE_URL } from "../utils/config";
import { getAdminData } from "../utils/auth";
import { useDialog } from "../components/common/DialogContext";

// YYYY-MM-DD for the <input type="date"> min attribute and for comparing today.
const toDateInputValue = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// HH:mm for the <input type="time"> min attribute.
const toTimeInputValue = (d) => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const ReminderModal = ({ show, onClose, enquiry, onSaved }) => {
  const { notify } = useDialog();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const todayStr = useMemo(() => toDateInputValue(new Date()), []);

  // Reset form each time the modal is (re)opened so stale values don't leak
  // between enquiries.
  useEffect(() => {
    if (show) {
      setDate("");
      setTime("");
      setNote("");
    }
  }, [show]);

  // If the picked date is today, prevent picking a time that's already passed.
  const minTime = useMemo(() => {
    if (!date || date !== todayStr) return undefined;
    return toTimeInputValue(new Date());
  }, [date, todayStr]);

  // Combine the selected date+time into a Date for validation.
  const scheduledAt = useMemo(() => {
    if (!date || !time) return null;
    const [hh, mm] = time.split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    const d = new Date(date);
    d.setHours(hh, mm, 0, 0);
    return d;
  }, [date, time]);

  const isFuture = !!scheduledAt && scheduledAt.getTime() > Date.now();
  const canSave = !!date && !!time && isFuture && !saving;

  const handleSave = async () => {
    if (!canSave) return;

    const admin = getAdminData();
    const adminId = admin?._id || undefined;

    try {
      setSaving(true);
      const res = await fetch(`${BASE_URL}/reminders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: enquiry.bookingId,
          reminderDate: date,
          reminderTime: time,
          // Pass the exact intended instant so the server doesn't have to
          // re-derive it and risk a timezone mismatch (server runs in UTC,
          // admin is in IST).
          reminderAt: scheduledAt.toISOString(),
          adminId,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        await notify({
          title: "Failed to set reminder",
          message: data?.message || "Please try again.",
          variant: "danger",
        });
        return;
      }

      await notify({
        title: "Reminder set",
        message: `You'll be notified on ${scheduledAt.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}.`,
        variant: "success",
      });

      if (typeof onSaved === "function") onSaved(data.reminder || null);
      onClose();
    } catch (error) {
      console.error("Error creating reminder:", error);
      await notify({
        title: "Error",
        message: "Could not reach the server. Please try again.",
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={saving ? undefined : onClose} centered>
      <Modal.Header closeButton={!saving}>
        <Modal.Title style={{ fontSize: 16 }}>Set Reminder</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group>
          <Form.Label style={{ fontSize: 13 }}>Select Date</Form.Label>
          <Form.Control
            type="date"
            value={date}
            min={todayStr}
            onChange={(e) => setDate(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mt-2">
          <Form.Label style={{ fontSize: 13 }}>Select Time</Form.Label>
          <Form.Control
            type="time"
            value={time}
            min={minTime}
            onChange={(e) => setTime(e.target.value)}
            disabled={!date}
          />
          {date && time && !isFuture && (
            <div className="text-danger mt-1" style={{ fontSize: 12 }}>
              Please choose a future date and time.
            </div>
          )}
        </Form.Group>

        <Form.Group className="mt-2">
          <Form.Label style={{ fontSize: 13 }}>Note (optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="e.g. Follow up on payment confirmation"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ fontSize: 13 }}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleSave} disabled={!canSave}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReminderModal;
