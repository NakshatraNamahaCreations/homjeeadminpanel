

// full working code
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  Container,
  Row,
  Col,
  Form,
  Button,
  Badge,
  Card,
  Modal,
  Image,
  Pagination,
} from "react-bootstrap";
import {
  FaCog,
  FaStar,
  FaPlus,
  FaPhone,
  FaArrowLeft,
  FaUserPlus,
  FaCalendarAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Calendar from "react-calendar";
import axios from "axios";
import vendor from "../../../assets/vendor.svg";
import "react-calendar/dist/Calendar.css";
import { BASE_URL } from "../../../utils/config";
import { useMemo } from "react";

const TeamMemberDocsModal = ({ show, onHide, member }) => {
  const docs = member?.docs || {};

  const docList = [
    { label: "Aadhaar Front", url: docs.aadhaarFront },
    { label: "Aadhaar Back", url: docs.aadhaarBack },
    { label: "PAN", url: docs.pan },
    { label: "Other / Police Verification", url: docs.other },
  ].filter((d) => d.url);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 16 }}>
          Documents - {member?.name || "Team Member"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {docList.length === 0 ? (
          <div className="text-muted" style={{ fontSize: 13 }}>
            No documents uploaded.
          </div>
        ) : (
          <Row className="g-3">
            {docList.map((doc) => (
              <Col md={6} key={doc.label}>
                <Card className="shadow-sm" style={{ borderRadius: 12 }}>
                  <Card.Body>
                    <div className="fw-semibold mb-2" style={{ fontSize: 13 }}>
                      {doc.label}
                    </div>

                    <Image
                      src={doc.url}
                      alt={doc.label}
                      thumbnail
                      style={{
                        width: "100%",
                        height: 220,
                        objectFit: "cover",
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(doc.url, "_blank")}
                    />

                    <div className="text-muted mt-2" style={{ fontSize: 12 }}>
                      Click to view
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
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

export default TeamMemberDocsModal