import React, { useMemo } from "react";
import { Modal, Card, Table, Badge } from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { normalizeLeave } from "../../../utils/helpers";

const TeamMemberLeavesModal = ({ show, onHide, member }) => {
  const leavesArr = useMemo(() => {
    try {
      if (!member?.markedLeaves) return [];
      return member.markedLeaves.map(normalizeLeave).filter(Boolean);
    } catch (e) {
      console.error("leavesArr memo error:", e);
      return [];
    }
  }, [member]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "16px" }}>
          {member?.name}'s Leaves
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="leaves-modal-body">
        {/* Left side: Calendar */}
        <div className="leaves-left">
          <h6 className="fw-semibold mb-3" style={{ fontSize: "14px" }}>
            Calendar View
          </h6>
          <div className="readonly-cal">
            <Calendar
              tileClassName={({ date }) => {
                const key = date.toISOString().split("T")[0];
                return leavesArr.includes(key) ? "leave-day" : "";
              }}
              className="w-100"
              value={new Date()}
              readOnly
            />
          </div>
        </div>

        {/* Right side: List of leaves */}
        <div className="leaves-right">
          <h6 className="fw-semibold mb-3" style={{ fontSize: "14px" }}>
            Leave Dates ({leavesArr.length})
          </h6>

          {leavesArr.length === 0 ? (
            <div className="text-muted" style={{ fontSize: "12px" }}>
              No leaves marked for this member.
            </div>
          ) : (
            <Table bordered size="sm" style={{ fontSize: "12px" }}>
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Month</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {leavesArr.map((dateStr) => {
                  const date = new Date(dateStr);
                  const dayName = date.toLocaleDateString("en-IN", {
                    weekday: "short",
                  });
                  const monthName = date.toLocaleDateString("en-IN", {
                    month: "short",
                  });
                  const dayNum = date.getDate();

                  return (
                    <tr key={dateStr}>
                      <td>
                        <Badge bg="light" text="dark">
                          {dateStr}
                        </Badge>
                      </td>
                      <td>
                        <div className="fw-semibold">{dayName}</div>
                      </td>
                      <td>
                        <div className="text-muted">
                          {dayNum} {monthName}
                        </div>
                      </td>
                      <td>
                        <Badge bg="warning" text="dark">
                          Leave
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}

          {/* Leave stats */}
          {leavesArr.length > 0 && (
            <Card className="mt-3 border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="text-muted" style={{ fontSize: "11px" }}>
                      Total Leaves
                    </div>
                    <div className="fw-bold" style={{ fontSize: "18px" }}>
                      {leavesArr.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: "11px" }}>
                      This Year
                    </div>
                    <div className="fw-bold" style={{ fontSize: "18px" }}>
                      {
                        leavesArr.filter((d) => {
                          const year = new Date(d).getFullYear();
                          return year === new Date().getFullYear();
                        }).length
                      }
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <button
          className="btn btn-outline-secondary"
          onClick={onHide}
          style={{ fontSize: "12px" }}
        >
          Close
        </button>
      </Modal.Footer>

      {/* CSS styles */}
      <style>{`
        .leaves-modal-body {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 14px;
        }
        @media (max-width: 768px) {
          .leaves-modal-body { grid-template-columns: 1fr; }
        }
        .leaves-left {
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 12px;
          background: #fafafa;
        }
        .leaves-right {
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 12px;
          background: #fff;
        }

        .readonly-cal .react-calendar__tile {
          pointer-events: none;
          cursor: default;
        }
        .readonly-cal .react-calendar__tile--active,
        .readonly-cal .react-calendar__tile:enabled:hover,
        .readonly-cal .react-calendar__tile:enabled:focus {
          background: transparent !important;
        }

        .leave-day {
          background: transparent !important;
          color: #111 !important;
          position: relative;
          font-weight: 700;
        }
        .leave-day::after {
          content: "";
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 6px;
          border-radius: 999px;
          background: #111;
        }
      `}</style>
    </Modal>
  );
};

export default TeamMemberLeavesModal;