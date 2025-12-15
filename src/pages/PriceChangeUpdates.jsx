import React, { useState } from "react";
import {
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import {
  FaCheck,
  FaTimes,
  FaRupeeSign,
  FaUser,
  FaCalendarAlt,
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
  FaReceipt,
  FaEdit,
} from "react-icons/fa";
import { GiPriceTag } from "react-icons/gi";

const PriceChangeUpdates = ({
  bookingDetails,
  onUpdateResponse,
  show = true,
  onClose,
}) => {
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Get pending price changes from bookingDetails
  const pendingPriceChanges = bookingDetails?.priceChanges?.filter(
    (change) => change.status === "pending"
  ) || [];

  // Get the latest pending change (last in array)
  const latestPendingChange = pendingPriceChanges[pendingPriceChanges.length - 1];

  // Get the previous total from the last approved change or original amount
  const getPreviousTotal = () => {
    if (bookingDetails?.priceChanges && bookingDetails.priceChanges.length > 0) {
      // Find the last approved change
      const approvedChanges = bookingDetails.priceChanges.filter(
        (change) => change.status === "approved"
      );
      
      if (approvedChanges.length > 0) {
        const lastApproved = approvedChanges[approvedChanges.length - 1];
        return lastApproved.proposedTotal;
      }
    }
    return bookingDetails?.originalTotalAmount || 0;
  };

  const previousTotal = getPreviousTotal();

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning" className="px-2 py-1">Pending Approval</Badge>;
      case "approved":
        return <Badge bg="success" className="px-2 py-1">Approved</Badge>;
      case "rejected":
        return <Badge bg="danger" className="px-2 py-1">Rejected</Badge>;
      default:
        return <Badge bg="secondary" className="px-2 py-1">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRequesterName = (requestedBy) => {
    switch (requestedBy) {
      case "admin":
        return "Admin";
      case "vendor":
        return "Vendor";
      case "customer":
        return "Customer";
      default:
        return requestedBy;
    }
  };

  const handleAccept = async () => {
    if (!latestPendingChange) return;
    
    setProcessing(true);
    try {
      await onUpdateResponse?.(latestPendingChange, "approved", null);
    } catch (error) {
      console.error("Error accepting price change:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    if (!latestPendingChange) return;
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim() || !latestPendingChange) {
      alert("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    try {
      await onUpdateResponse?.(latestPendingChange, "rejected", rejectReason);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (error) {
      console.error("Error rejecting price change:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (!show || !bookingDetails?.priceUpdateRequestedToAdmin || !latestPendingChange) {
    return null;
  }

  return (
    <>
      <div className="mt-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">
            <GiPriceTag className="me-2" />
            Price Change Request
            <Badge bg="warning" className="ms-2">
              Needs Approval
            </Badge>
          </h6>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        {/* Main Price Change Summary Card */}
        <Card className="border-primary mb-4">
          <Card.Header className="bg-primary text-white py-2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0">Price Adjustment Request</h6>
                <small>Request #{pendingPriceChanges.length}</small>
              </div>
              {getStatusBadge(latestPendingChange.status)}
            </div>
          </Card.Header>
          <Card.Body>
            {/* Summary Section - Similar to your payment summary */}
            <div
              className="p-3 mb-3"
              style={{
                background: "#f8f9fa",
                borderRadius: 8,
                border: "1px solid #e3e3e3",
              }}
            >
              <h6 style={{ marginBottom: 15 }}>
                <FaReceipt className="me-2" />
                Price Change Summary
              </h6>

              <Row className="mb-2">
                <Col xs={6}>
                  <div className="text-muted">Previous Total:</div>
                  <div className="fw-bold">₹{previousTotal}</div>
                </Col>
                <Col xs={6}>
                  <div className="text-muted">Proposed Total:</div>
                  <div className="fw-bold text-success">
                    ₹{latestPendingChange.proposedTotal}
                  </div>
                </Col>
              </Row>

              <div className="d-flex justify-content-between mb-2">
                <span>Adjustment Amount:</span>
                <span
                  className={
                    latestPendingChange.scopeType === "Added"
                      ? "text-success fw-bold"
                      : "text-danger fw-bold"
                  }
                >
                  {latestPendingChange.scopeType === "Added" ? (
                    <FaArrowUp className="me-1" />
                  ) : (
                    <FaArrowDown className="me-1" />
                  )}
                  {latestPendingChange.scopeType === "Added" ? "+" : "-"}₹
                  {latestPendingChange.adjustmentAmount}
                </span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Change Type:</span>
                <Badge
                  bg={
                    latestPendingChange.scopeType === "Added"
                      ? "success"
                      : "danger"
                  }
                >
                  {latestPendingChange.scopeType === "Added"
                    ? "Increase"
                    : "Decrease"}
                </Badge>
              </div>

              {latestPendingChange.reason && (
                <div className="mb-2">
                  <div className="text-muted">Reason:</div>
                  <div className="p-2 bg-white rounded border">
                    {latestPendingChange.reason}
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between">
                <span>Requested By:</span>
                <span className="fw-bold">
                  <FaUser className="me-1" />
                  {getRequesterName(latestPendingChange.requestedBy)}
                </span>
              </div>

              <div className="d-flex justify-content-between mt-2">
                <span>Requested At:</span>
                <span>
                  <FaCalendarAlt className="me-1" />
                  {formatDate(latestPendingChange.requestedAt)}
                </span>
              </div>
            </div>

            {/* Payment Impact Summary */}
            <div
              className="p-3"
              style={{
                background: "#fff3cd",
                borderRadius: 8,
                border: "1px solid #ffeaa7",
              }}
            >
              <h6 style={{ marginBottom: 10 }}>
                <FaInfoCircle className="me-2 text-warning" />
                Payment Impact
              </h6>

              <div className="d-flex justify-content-between mb-1">
                <span>Original Total:</span>
                <span>₹{bookingDetails.originalTotalAmount || 0}</span>
              </div>

              <div className="d-flex justify-content-between mb-1">
                <span>Current Total:</span>
                <span>₹{bookingDetails.finalTotal || 0}</span>
              </div>

              <div className="d-flex justify-content-between mb-1">
                <span>Proposed New Total:</span>
                <span className="fw-bold text-primary">
                  ₹{latestPendingChange.proposedTotal}
                </span>
              </div>

              <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                <span>Net Change from Original:</span>
                <span
                  className={
                    latestPendingChange.proposedTotal >
                    bookingDetails.originalTotalAmount
                      ? "text-success fw-bold"
                      : "text-danger fw-bold"
                  }
                >
                  {latestPendingChange.proposedTotal >
                  bookingDetails.originalTotalAmount
                    ? "+"
                    : "-"}
                  ₹
                  {Math.abs(
                    latestPendingChange.proposedTotal -
                      bookingDetails.originalTotalAmount
                  )}
                </span>
              </div>
            </div>
          </Card.Body>
          <Card.Footer className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">
                  Booking ID: {bookingDetails.booking_id}
                </small>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleReject}
                  disabled={processing}
                >
                  <FaTimes className="me-1" />
                  Reject
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleAccept}
                  disabled={processing}
                >
                  <FaCheck className="me-1" />
                  {processing ? "Processing..." : "Approve"}
                </Button>
              </div>
            </div>
          </Card.Footer>
        </Card>

        {/* Price Change History */}
        {bookingDetails?.priceChanges &&
          bookingDetails.priceChanges.length > 0 && (
            <div className="mt-4">
              <h6 className="mb-3">
                <FaHistory className="me-2" />
                Price Change History
              </h6>
              <div className="timeline">
                {bookingDetails.priceChanges.map((change, index) => (
                  <Card
                    key={index}
                    className={`mb-2 ${
                      change.status === "pending"
                        ? "border-warning"
                        : change.status === "approved"
                        ? "border-success"
                        : "border-danger"
                    }`}
                  >
                    <Card.Body className="py-2">
                      <Row className="align-items-center">
                        <Col xs={2} className="text-center">
                          <div
                            className={`rounded-circle p-2 ${
                              change.status === "pending"
                                ? "bg-warning text-white"
                                : change.status === "approved"
                                ? "bg-success text-white"
                                : "bg-danger text-white"
                            }`}
                          >
                            {change.status === "pending" ? (
                              <FaEdit />
                            ) : change.status === "approved" ? (
                              <FaCheck />
                            ) : (
                              <FaTimes />
                            )}
                          </div>
                        </Col>
                        <Col xs={10}>
                          <div className="d-flex justify-content-between">
                            <div>
                              <div className="fw-bold">
                                {change.scopeType === "Added"
                                  ? "Price Increase"
                                  : "Price Reduction"}
                              </div>
                              <small className="text-muted">
                                By {getRequesterName(change.requestedBy)} •{" "}
                                {formatDate(change.requestedAt)}
                              </small>
                            </div>
                            <div className="text-end">
                              <div
                                className={
                                  change.scopeType === "Added"
                                    ? "text-success fw-bold"
                                    : "text-danger fw-bold"
                                }
                              >
                                {change.scopeType === "Added" ? "+" : "-"}₹
                                {change.adjustmentAmount}
                              </div>
                              <small>To: ₹{change.proposedTotal}</small>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Reject Reason Modal */}
      <Modal
        show={showRejectModal}
        onHide={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
        centered
        size="sm"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fs-6">
            <FaTimes className="me-2" />
            Reject Price Change
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <FaInfoCircle className="me-2" />
            Are you sure you want to reject this price change request?
          </Alert>
          <Form.Group>
            <Form.Label>Reason for Rejection *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please specify reason for rejection..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setShowRejectModal(false);
              setRejectReason("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRejectConfirm}
            disabled={!rejectReason.trim() || processing}
          >
            {processing ? "Processing..." : "Confirm Rejection"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PriceChangeUpdates;