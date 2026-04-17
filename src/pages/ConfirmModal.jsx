import React from "react";
import { Modal, Button } from "react-bootstrap";

const ConfirmModal = ({ show, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) => (
  <Modal show={show} onHide={onCancel} centered>
    <Modal.Header closeButton>
      <Modal.Title style={{ fontSize: 16 }}>{title}</Modal.Title>
    </Modal.Header>
    <Modal.Body style={{ fontSize: 14 }}>{message}</Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button variant="danger" onClick={onConfirm}>
        {confirmText}
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ConfirmModal;
