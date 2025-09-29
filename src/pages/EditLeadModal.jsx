import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { GoogleMap, LoadScript, Autocomplete } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyBF48uqsKVyp9P2NlDX-heBJksvvT_8Cqk";

const EditLeadModal = ({ show, onClose, lead, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: lead?.name || "",
    phone: lead?.contact || "",
    houseNumber: lead?.filledData?.houseNumber || "",
    landmark: lead?.filledData?.landmark || "",
    slot: lead?.time || "",
    location: lead?.filledData?.location?.name || "",
    lat: lead?.filledData?.location?.lat || 0,
    lng: lead?.filledData?.location?.lng || 0,
  });

  const [autocomplete, setAutocomplete] = useState(null);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setFormData({
          ...formData,
          location: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `https://homjee-backend.onrender.com/api/bookings/update-user-booking/${lead.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      const result = await response.json();
      if (response.ok) {
        toast.success("Lead updated successfully!");
        onUpdate(formData);
        onClose();
      } else {
        toast.error(result?.message || "Failed to update lead");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Error updating lead");
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Lead</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
              <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged}>
                <Form.Control
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </Autocomplete>
            </LoadScript>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>House/Flat Number</Form.Label>
            <Form.Control
              type="text"
              value={formData.houseNumber}
              onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Landmark</Form.Label>
            <Form.Control
              type="text"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Slot</Form.Label>
            <Form.Control
              type="text"
              value={formData.slot}
              onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Save & Update
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditLeadModal;
