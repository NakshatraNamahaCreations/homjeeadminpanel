import React from "react";
import { Table, Button, Badge, Pagination } from "react-bootstrap";
import { FaPhone, FaCog, FaStar } from "react-icons/fa";

const VendorList = ({
  vendors,
  loading,
  error,
  serverPagination,
  onVendorSelect,
  onEditVendor,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div className="loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="mt-3 text-muted">Loading vendor details...</p>
        <style>{`
          .loader-dots span {
            width: 10px;
            height: 10px;
            margin: 0 4px;
            background: #DC3545;
            border-radius: 50%;
            display: inline-block;
            animation: pulse 1s infinite alternate;
          }
          .loader-dots span:nth-child(2) {
            animation-delay: 0.2s;
          }
          .loader-dots span:nth-child(3) {
            animation-delay: 0.4s;
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.6); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return <div className="text-danger">Error: {error}</div>;
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-5">
        <h5>No vendors found</h5>
        <p className="text-muted">Try adjusting your filters</p>
      </div>
    );
  }

  const PAGE_SIZE = 10;
  const { page: safePage, totalPages, total } = serverPagination;

  return (
    <>
      <Table
        striped
        bordered
        hover
        responsive
        className="shadow-lg bg-white text-center"
      >
        <thead className="table-dark">
          <tr style={{ fontSize: "14px" }}>
            <th>Vendor Name</th>
            <th>Category</th>
            <th>City</th>
            {/* <th>Status</th> */}
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr
              key={vendor.id}
              style={{ cursor: "pointer", fontSize: "12px" }}
              onClick={() => onVendorSelect(vendor)}
            >
              <td>{vendor.name}</td>
              <td>{vendor.category}</td>
              <td>{vendor.city}</td>
              {/* <td>
                <Badge bg={vendor.status === "Live" ? "success" : "warning"}>
                  {vendor.status}
                </Badge>
              </td> */}
              <td>
                <FaStar className="text-warning" /> {vendor.rating}
              </td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  href={`tel:${vendor.phone}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaPhone />
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="ms-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditVendor(vendor);
                  }}
                >
                  <FaCog />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">
          Showing{" "}
          <strong>
            {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, total)}
          </strong>{" "}
          of <strong>{total}</strong>
        </small>

        <Pagination className="mb-0">
          <Pagination.First
            onClick={() => onPageChange(1)}
            disabled={safePage === 1}
          />
          <Pagination.Prev
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
          />
          {Array.from({ length: totalPages })
            .slice(
              Math.max(0, safePage - 3),
              Math.min(totalPages, safePage + 2)
            )
            .map((_, i, arr) => {
              const pageNum = Math.max(1, safePage - 2) + i;
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === safePage}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
          <Pagination.Next
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
          />
          <Pagination.Last
            onClick={() => onPageChange(totalPages)}
            disabled={safePage === totalPages}
          />
        </Pagination>
      </div>
    </>
  );
};

export default VendorList;
