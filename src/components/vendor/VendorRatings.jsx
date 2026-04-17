// components/vendor/VendorRatings.jsx
import React from "react";
import { Card, Table, Button } from "react-bootstrap";
import { FaStar } from "react-icons/fa";
import { prettyServiceType } from "../../utils/helpers";

const VendorRatings = ({ vendorId, ratings, loading, error }) => {
  return (
    <>
      <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
        Vendor Ratings
      </h5>

      <Card
        className="mt-2 shadow-sm"
        style={{ borderRadius: 14, border: "1px solid #eee" }}
      >
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div style={{ fontWeight: 800, fontSize: 13 }}>
              Latest Feedback (Max 50)
            </div>
          </div>

          {loading ? (
            <div className="text-muted" style={{ fontSize: 12 }}>
              Loading ratings...
            </div>
          ) : error ? (
            <div className="text-danger" style={{ fontSize: 12 }}>
              {error}
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-muted" style={{ fontSize: 12 }}>
              No ratings found for this vendor.
            </div>
          ) : (
            <Table
              bordered
              hover
              responsive
              className="mb-0"
              style={{ fontSize: 12 }}
            >
              <thead className="table-light">
                <tr>
                  <th style={{ width: 180 }}>Customer</th>
                  <th style={{ width: 90 }}>Rating</th>
                  <th>Feedback</th>
                  <th style={{ width: 170 }}>Booking ID</th>
                  <th style={{ width: 140 }}>Service</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((r) => (
                  <tr key={r?._id}>
                    <td className="fw-semibold">
                      {r?.customerName || "-"}
                    </td>

                    <td>
                      <FaStar className="text-warning" />{" "}
                      {Number(r?.rating || 0)}
                    </td>

                    <td>{r?.feedback?.trim?.() ? r.feedback : "-"}</td>

                    <td style={{ fontFamily: "monospace" }}>
                      {r?.bookingId || "-"}
                    </td>

                    <td>{prettyServiceType(r?.serviceType)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default VendorRatings;