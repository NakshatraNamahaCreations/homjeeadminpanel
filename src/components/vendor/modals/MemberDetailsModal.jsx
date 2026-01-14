// components/vendor/modals/MemberDetailsModal.jsx
import React from "react";
import { Modal, Table, Button } from "react-bootstrap";
import ReadOnlyLeavesCalendar from "./ReadOnlyLeavesCalendar";

const MemberDetailsModal = ({ show, onHide, member }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "16px" }}>
          Team Member Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {member ? (
          <Table bordered size="sm" style={{ fontSize: "13px" }}>
            <tbody>
              <tr>
                <td>
                  <strong>Name</strong>
                </td>
                <td>{member.name}</td>
              </tr>
              <tr>
                <td>
                  <strong>Mobile</strong>
                </td>
                <td>{member.mobileNumber}</td>
              </tr>
              <tr>
                <td>
                  <strong>Date of Birth</strong>
                </td>
                <td>{member.dateOfBirth}</td>
              </tr>
              <tr>
                <td>
                  <strong>City</strong>
                </td>
                <td>{member.city}</td>
              </tr>
              <tr>
                <td>
                  <strong>Service Type</strong>
                </td>
                <td>{member.serviceType}</td>
              </tr>
              <tr>
                <td>
                  <strong>Service Area</strong>
                </td>
                <td>{member.serviceArea}</td>
              </tr>
              <tr>
                <td>
                  <strong>Aadhar Number</strong>
                </td>
                <td>{member.aadhaarNumber}</td>
              </tr>
              <tr>
                <td>
                  <strong>PAN Number</strong>
                </td>
                <td>{member.panNumber}</td>
              </tr>
              <tr>
                <td>
                  <strong>Bank Name</strong>
                </td>
                <td>{member.bankName}</td>
              </tr>
              <tr>
                <td>
                  <strong>Account Number</strong>
                </td>
                <td>{member.accountNumber}</td>
              </tr>
              <tr>
                <td>
                  <strong>IFSC Code</strong>
                </td>
                <td>{member.ifscCode}</td>
              </tr>
              <tr>
                <td>
                  <strong>GST Number</strong>
                </td>
                <td>{member.gstNumber || "NA"}</td>
              </tr>
              <tr>
                <td>
                  <strong>Address</strong>
                </td>
                <td>
                  {member.location} <br />
                </td>
              </tr>
            </tbody>
          </Table>
        ) : (
          <p>No details available.</p>
        )}

        {member && (
          <div className="mt-3">
            <h6 className="fw-semibold" style={{ fontSize: 13 }}>
              Marked Leaves (Read-only)
            </h6>

            {member.markedLeaves?.length ? (
              <ReadOnlyLeavesCalendar
                markedLeaves={member.markedLeaves}
              />
            ) : (
              <div className="text-muted" style={{ fontSize: 12 }}>
                No leaves marked for this member.
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MemberDetailsModal;