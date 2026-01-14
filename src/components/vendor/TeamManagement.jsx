import React from "react";
import { Card, Button, Badge } from "react-bootstrap";
import {
  FaUserPlus,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaEye,
} from "react-icons/fa";

const TeamManagement = ({
  vendor,
  onAddMember,
  onEditMember,
  onViewMemberDetails,
  onViewMemberLeaves,
  onViewMemberDocs,
  onRemoveMember,
}) => {
  if (!vendor) return null;

  const normalizeLeave = (dateString) => {
    try {
      if (!dateString) return "-";
      const d = new Date(dateString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="mt-4">
      <h5 className="fw-semibold mb-3" style={{ fontSize: "14px" }}>
        Manage Team
      </h5>

      <Card className="team-card">
        <div className="team-card-header">
          <div style={{ fontWeight: 700, fontSize: 13 }}>Team Members</div>

          <Button
            variant="light"
            size="sm"
            onClick={onAddMember}
            style={{ borderRadius: 10, fontWeight: 700 }}
          >
            <FaUserPlus className="me-1" /> Add Member
          </Button>
        </div>

        {(vendor?.team?.length ?? 0) === 0 ? (
          <div className="p-3 text-muted" style={{ fontSize: 12 }}>
            No team members yet.
          </div>
        ) : (
          (vendor.team || []).map((member) => {
            const initials =
              (member?.name || "NA")
                .split(" ")
                .slice(0, 1)
                .map((x) => x[0]?.toUpperCase())
                .join("") || "NA";

            const leaves = member?.markedLeaves || [];
            const showLeaves = leaves.slice(0, 2);

            return (
              <div className="team-row" key={member._id}>
                {/* Name */}
                <div className="team-name">
                  <div className="avatar">{initials}</div>

                  <div className="name-text">
                    <div
                      className="primary"
                      onClick={() => onViewMemberDetails(member)}
                      title={member.name}
                    >
                      {member.name}
                    </div>
                    <div className="secondary">
                      {member.mobileNumber || "-"}
                    </div>
                  </div>
                </div>

                {/* Leaves */}
                <div>
                  {leaves.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      No leaves
                    </span>
                  ) : (
                    <>
                      {showLeaves.map((date) => (
                        <span className="leave-chip" key={date}>
                          <FaCalendarAlt />
                          {normalizeLeave(date)}
                        </span>
                      ))}
                      {leaves.length > 2 && (
                        <span className="leave-chip">
                          +{leaves.length - 2} more
                        </span>
                      )}

                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="ms-1"
                        onClick={() => onViewMemberLeaves(member)}
                        style={{ borderRadius: 10 }}
                      >
                        View
                      </Button>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="actions-wrap">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => onEditMember(member)}
                    style={{ borderRadius: 10 }}
                  >
                    <FaEdit /> 
                  </Button>

                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      const ok = window.confirm(
                        `Are you sure you want to remove ${
                          member?.name || "this member"
                        }?`
                      );
                      if (ok) onRemoveMember(member._id);
                    }}
                    style={{ borderRadius: 10 }}
                  >
                    <FaTrash /> 
                  </Button>

                  <Button
                    variant="outline-dark"
                    size="sm"
                    onClick={() => onViewMemberDocs(member)}
                    style={{ borderRadius: 10 }}
                  >
                    <FaEye /> 
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* CSS styles for the team management component */}
      <style>{`
        .team-card {
          border: 1px solid #eee;
          border-radius: 16px;
          box-shadow: 0 6px 22px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .team-card-header {
          background: #0f172a;
          color: #fff;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .team-row {
          padding: 12px 14px;
          border-top: 1px solid #f0f0f0;
          display: grid;
          grid-template-columns: 1.2fr 1fr 0.9fr;
          gap: 12px;
          align-items: center;
        }
        .team-name {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #f1f5f9;
          border: 1px solid #e5e7eb;
          display: grid;
          place-items: center;
          font-weight: 700;
          color: #0f172a;
          flex: 0 0 auto;
        }
        .name-text {
          min-width: 0;
        }
        .name-text .primary {
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }
        .name-text .primary:hover {
          color: #3b82f6;
        }
        .name-text .secondary {
          font-size: 11px;
          color: #64748b;
        }
        .leave-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          font-size: 11px;
          margin: 0 6px 6px 0;
        }
        .actions-wrap {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .team-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .actions-wrap {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamManagement;