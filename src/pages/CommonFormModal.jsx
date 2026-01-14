import { Modal, Button, Form } from "react-bootstrap";

/**
 * 🔁 Reusable Modal for Add/Edit Vendor & Team Member
 * UI stays EXACTLY same
 */
const CommonFormModal = ({
  show,
  onHide,
  title,
  onSubmit,
  submitText,
  children,
  size = "lg",
}) => {
  return (
    <Modal show={show} onHide={onHide} size={size} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "16px" }}>
          {title}
        </Modal.Title>
      </Modal.Header>

      {/* ✅ IMPORTANT: Modal.Footer INSIDE Form */}
      <Form onSubmit={onSubmit}>
        <Modal.Body>{children}</Modal.Body>

        <Modal.Footer>
          <Button variant="primary" type="submit">
            {submitText}
          </Button>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CommonFormModal;
