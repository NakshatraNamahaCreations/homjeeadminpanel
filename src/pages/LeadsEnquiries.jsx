import React, { useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import CreateLeadModal from "./CreateLeadModal"; // Import the modal

const LeadsEnquiries = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <Container fluid style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h2 style={styles.title}>Leads & Enquiries</h2>
        <Button style={styles.buttonPrimary} onClick={() => setShowModal(true)}>
          + Create New Lead/Enquiry
        </Button>
      </div>

      {/* Cards Section */}
      <Row className="justify-content-center">
        <Col md={5}>
          <Card style={styles.card} onClick={() => navigate("/enquiries")}>
            <Card.Body>
              <h3 style={styles.cardTitle}>Enquiries</h3>
              <p style={styles.cardDescription}>
                View and manage incomplete customer forms that need follow-up.
              </p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={5}>
          <Card style={styles.card} onClick={() => navigate("/newleads")}>
            <Card.Body>
              <h3 style={styles.cardTitle}>New Leads</h3>
              <p style={styles.cardDescription}>
                View completed forms, assign vendors, and track progress.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Lead Modal */}
      {showModal && <CreateLeadModal onClose={() => setShowModal(false)} />}
    </Container>
  );
};

// Styles
const styles = {
  container: { padding: "20px", backgroundColor: "#f3f4f6", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title: { fontSize: "1.8rem", fontWeight: "bold", color: "#333" },
  buttonPrimary: { backgroundColor: "#2563eb", color: "white", padding: "10px 15px", borderRadius: "5px", border: "none", cursor: "pointer" },
  card: { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", textAlign: "center", cursor: "pointer", transition: "0.3s", marginBottom: "20px" },
  cardTitle: { fontSize: "1.5rem", fontWeight: "bold", color: "#333" },
  cardDescription: { fontSize: "1rem", color: "#666" },
};

export default LeadsEnquiries;
