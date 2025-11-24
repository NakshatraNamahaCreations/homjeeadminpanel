import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { BASE_URL } from "../utils/config";

const ReminderModal = ({ show, onClose, enquiry }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSave = async () => {
    if (!date || !time) {
      alert("Please select both date & time");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/reminders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: enquiry.bookingId,
          reminderDate: date,
          reminderTime: time,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Reminder created successfully!");
        onClose();
      } else {
        alert(data.message || "Failed to create reminder");
      }
    } catch (error) {
      console.error("Error creating reminder:", error);
      alert("Error creating reminder");
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 16 }}>Set Reminder</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group>
          <Form.Label>Select Date</Form.Label>
          <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Form.Group>

        <Form.Group className="mt-2">
          <Form.Label>Select Time</Form.Label>
          <Form.Control type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleSave}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReminderModal;
