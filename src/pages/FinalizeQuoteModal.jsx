import { useState } from "react";
import { Button, Modal } from "react-bootstrap";

const FinalizeQuoteModal = ({ quoteId, onFinalize, show, handleClose }) => {
  const handleFinalize = async () => {
    try {
      const response = await fetch(
        `https://homjee-backend.onrender.com/api/quotations/quote/${quoteId}/finalize`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (response.ok) {
        onFinalize(); // Callback to parent component to handle successful finalization
        handleClose(); // Close the modal
      } else {
        console.error(result.message || "Error finalizing quote");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Finalize Quote</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to finalize this quote?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleFinalize}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FinalizeQuoteModal;
