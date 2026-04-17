import React from "react";
import { Card, Row, Col, Image } from "react-bootstrap";

const VendorDocuments = ({ vendor }) => {
  if (!vendor) return null;

  const documents = vendor.docs || {};

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
          Vendor Documents
        </h5>

        <Row className="g-3">
          {[
            {
              label: "Aadhaar Front",
              url: documents?.aadhaarFront,
            },
            {
              label: "Aadhaar Back",
              url: documents?.aadhaarBack,
            },
            {
              label: "Aadhaar (Single)",
              url: documents?.aadhaarSingle,
            },
            { label: "PAN", url: documents?.pan },
            {
              label: "Other / Police Verification",
              url: documents?.other,
            },
          ]
            .filter((d) => d.url) // Show only uploaded
            .map((doc) => (
              <Col md={4} key={doc.label}>
                <Card className="shadow-sm" style={{ borderRadius: 12 }}>
                  <Card.Body>
                    <div
                      className="fw-semibold mb-2"
                      style={{ fontSize: 12 }}
                    >
                      {doc.label}
                    </div>

                    <Image
                      src={doc.url}
                      alt={doc.label}
                      thumbnail
                      style={{
                        width: "100%",
                        height: 160,
                        objectFit: "cover",
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(doc.url, "_blank")}
                    />

                    <div
                      className="text-muted mt-2"
                      style={{ fontSize: 11 }}
                    >
                      Click to view
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}

          {/* If nothing uploaded */}
          {(!vendor?.docs ||
            (!vendor?.docs?.aadhaarFront &&
              !vendor?.docs?.aadhaarBack &&
              !vendor?.docs?.aadhaarSingle &&
              !vendor?.docs?.pan &&
              !vendor?.docs?.other)) && (
            <Col>
              <div className="text-muted" style={{ fontSize: 12 }}>
                No vendor documents uploaded.
              </div>
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  );
};

export default VendorDocuments;