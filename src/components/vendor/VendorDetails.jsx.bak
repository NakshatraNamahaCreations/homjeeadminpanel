import React from "react";
import {
  Card,
  Row,
  Col,
  Image,
  Table,
  Badge,
  Button,
} from "react-bootstrap";
import {
  FaStar,
  FaPhone,
  FaCog,
  FaMapMarkerAlt,
  FaArchive,
  FaUndo,
} from "react-icons/fa";
import { useDialog } from "../common/DialogContext";

const VendorDetails = ({
  vendor,
  onEditVendor,
  onBack,
  onArchiveToggle,
  archiving = false,
}) => {
  const { notify } = useDialog();
  if (!vendor) return null;

  const isArchived = vendor.isArchived === true;

  return (
    <>
      {/* Archived banner */}
      {isArchived && (
        <div
          className="mb-3 p-3 rounded d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{
            background: "#fff4f4",
            border: "1px solid #f5c2c7",
            color: "#842029",
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <FaArchive />
            <strong style={{ fontSize: 13 }}>Archived vendor</strong>
            <span style={{ fontSize: 12 }}>
              — this vendor is blocked from the Vendor App.
            </span>
            {vendor.archiveReason ? (
              <span className="text-muted" style={{ fontSize: 12 }}>
                Reason: {vendor.archiveReason}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* Location + Actions Bar */}
      <Card
        className="mb-3 shadow-sm"
        style={{
          borderRadius: 14,
          border: "1px solid #eee",
          background: "#fff",
        }}
      >
        <Card.Body className="py-3">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            {/* Left: Location */}
            <div style={{ minWidth: 0 }}>
              <div className="d-flex align-items-center gap-2 mb-1">
                <FaMapMarkerAlt />
                <span className="fw-semibold" style={{ fontSize: 14 }}>
                  Location Coordinates
                </span>
                <Badge bg="light" text="dark" style={{ fontSize: 11 }}>
                  Geo
                </Badge>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "#f8f9fa",
                    border: "1px solid #eee",
                    fontSize: 12,
                  }}
                >
                  <span className="text-muted me-1">Lat:</span>
                  <span className="fw-semibold">
                    {vendor?.lat ? Number(vendor.lat) : "N/A"}
                  </span>
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: "#f8f9fa",
                    border: "1px solid #eee",
                    fontSize: 12,
                  }}
                >
                  <span className="text-muted me-1">Lng:</span>
                  <span className="fw-semibold">
                    {vendor?.long ? Number(vendor.long) : "N/A"}
                  </span>
                </div>
              </div>

              <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                Tip: Coordinates are auto-filled from the map picker.
              </div>
            </div>

            {/* Right: Actions */}
            <div className="d-flex align-items-center gap-2 ms-md-auto flex-wrap">
              <Button
                variant="outline-dark"
                onClick={() => onEditVendor(vendor)}
                style={{
                  fontSize: 12,
                  borderRadius: 10,
                  padding: "8px 12px",
                  borderColor: "black",
                }}
              >
                <FaCog className="me-2" />
                Edit Vendor
              </Button>

              <Button
                variant="dark"
                onClick={() => {
                  if (!vendor?.lat || !vendor?.long) {
                    notify({
                      title: "Coordinates missing",
                      message:
                        "This vendor does not have map coordinates yet. Edit the vendor to set them.",
                      variant: "warning",
                    });
                    return;
                  }
                  window.open(
                    `https://www.google.com/maps?q=${vendor.lat},${vendor.long}`,
                    "_blank"
                  );
                }}
                style={{
                  fontSize: 12,
                  borderRadius: 10,
                  padding: "8px 12px",
                }}
              >
                <FaMapMarkerAlt className="me-2" />
                Open in Maps
              </Button>

              {typeof onArchiveToggle === "function" && (
                <Button
                  variant={isArchived ? "success" : "outline-danger"}
                  onClick={onArchiveToggle}
                  disabled={archiving}
                  style={{
                    fontSize: 12,
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                >
                  {isArchived ? (
                    <>
                      <FaUndo className="me-2" />
                      {archiving ? "Unarchiving..." : "Unarchive"}
                    </>
                  ) : (
                    <>
                      <FaArchive className="me-2" />
                      {archiving ? "Archiving..." : "Archive"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Main Vendor Details Card */}
      <Card className="shadow-sm p-4 rounded">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold" style={{ fontSize: "16px" }}>
            {vendor.name}
          </h4>
          {/* <Badge
            bg={vendor.status === "Live" ? "success" : "warning"}
            className="px-3 py-2"
          >
            {vendor.status}
          </Badge> */}
        </div>
        
        <Row className="mb-3">
          <Col md={4} className="text-center">
            <Image
              src={vendor.profileImage}
              roundedCircle
              width={120}
              height={120}
              className="border p-1"
              alt="Vendor Profile"
            />
            <p className="mt-2 text-muted" style={{ fontSize: "12px" }}>
              {vendor.category}
            </p>
          </Col>
          <Col md={8}>
            <Table borderless>
              <tbody style={{ fontSize: "12px" }}>
                <tr>
                  <td>
                    <strong>City:</strong>
                  </td>
                  <td>{vendor.city}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Service Area:</strong>
                  </td>
                  <td>{vendor.serviceArea}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Working Since:</strong>
                  </td>
                  <td>
                    {vendor.workingSince} (
                    {new Date().getFullYear() - vendor.workingSince} years)
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Capacity:</strong>
                  </td>
                  <td>{vendor.capacity} jobs at a time</td>
                </tr>
                <tr>
                  <td>
                    <strong>Date of Birth:</strong>
                  </td>
                  <td>{vendor.dob}</td>
                </tr>
              </tbody>
            </Table>
          </Col>
        </Row>
        
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
          <div>
            <Button
              variant="outline-black"
              size="sm"
              href={`tel:${vendor.phone}`}
              className="me-2"
              style={{ cursor: "pointer", borderColor: "black" }}
            >
              <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                <FaPhone className="me-1" />
                {vendor.phone}
              </p>
            </Button>
          </div>
          <div>
            <p className="mb-0">
              <strong>Rating:</strong> <FaStar className="text-warning" />{" "}
              {vendor.rating}
            </p>
          </div>
        </div>
        
        {/* Financial Details */}
        <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
          Financial Details
        </h5>
        <Table bordered className="bg-light" style={{ fontSize: "12px" }}>
          <tbody>
            <tr>
              <td>
                <strong>Aadhar No.</strong>
              </td>
              <td>{vendor.aadhar}</td>
            </tr>
            <tr>
              <td>
                <strong>PAN No.</strong>
              </td>
              <td>{vendor.pan}</td>
            </tr>
            <tr>
              <td>
                <strong>Bank Name:</strong>
              </td>
              <td>{vendor.bank}</td>
            </tr>
            <tr>
              <td>
                <strong>IFSC Code:</strong>
              </td>
              <td>{vendor.ifsc}</td>
            </tr>
            <tr>
              <td>
                <strong>Account No.:</strong>
              </td>
              <td>{vendor.account}</td>
            </tr>
            <tr>
              <td>
                <strong>GST:</strong>
              </td>
              <td>{vendor.gst}</td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </>
  );
};

export default VendorDetails;