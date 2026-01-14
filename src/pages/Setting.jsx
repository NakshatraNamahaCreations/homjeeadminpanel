// import React, { useState } from "react";
// import {
//   Container,
//   Button,
//   Table,
//   Card,
//   Modal,
//   Form,
// } from "react-bootstrap";
// import { FaEdit, FaTrash } from "react-icons/fa";

// const Settings = () => {
//   const [admins, setAdmins] = useState([
//     { id: 1, name: "Admin One", email: "admin1@example.com", phone: "1234567890" },
//     { id: 2, name: "Admin Two", email: "admin2@example.com", phone: "9876543210" },
//   ]);

//   const [showModal, setShowModal] = useState(false);
//   const [editingAdmin, setEditingAdmin] = useState(null);
//   const [adminForm, setAdminForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     password: "",
//   });

//   const handleShowModal = (admin = null) => {
//     if (admin) {
//       setEditingAdmin(admin);
//       setAdminForm({ ...admin, password: "" });
//     } else {
//       setEditingAdmin(null);
//       setAdminForm({ name: "", email: "", phone: "", password: "" });
//     }
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     setEditingAdmin(null);
//     setAdminForm({ name: "", email: "", phone: "", password: "" });
//   };

//   const handleFormChange = (e) => {
//     setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
//   };

//   const handleFormSubmit = (e) => {
//     e.preventDefault();
//     if (editingAdmin) {
//       setAdmins((prev) =>
//         prev.map((admin) =>
//           admin.id === editingAdmin.id ? { ...admin, ...adminForm } : admin
//         )
//       );
//     } else {
//       const newAdmin = { id: Date.now(), ...adminForm };
//       setAdmins([...admins, newAdmin]);
//     }
//     handleCloseModal();
//   };

//   const handleDelete = (id) => {
//     if (window.confirm("Are you sure you want to delete this admin?")) {
//       setAdmins(admins.filter((admin) => admin.id !== id));
//     }
//   };

//   return (
//     <Container className="py-4">
//       <h5 className="mb-4">Admin Management</h5>
//       <Card body>
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <h5 className="mb-0"></h5>
//           <Button variant="" onClick={() => handleShowModal()} style={{borderColor:'black', fontSize:'16px'}}>
//             + Add Admin
//           </Button>
//         </div>

//         <Table striped bordered hover responsive>
//           <thead>
//             <tr style={{textAlign:'center'}}>
//               <th>Sl.no</th>
//               <th>Full Name</th>
//               <th>Email</th>
//               <th>Phone</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody style={{textAlign:"center"}}>
//             {admins.map((admin, index) => (
//               <tr key={admin.id}>
//                 <td>{index + 1}</td>
//                 <td>{admin.name}</td>
//                 <td>{admin.email}</td>
//                 <td>{admin.phone}</td>
//                 <td>
//                   <Button
//                     variant="outline-black"
//                     size="sm"
//                     className="me-2"
//                     onClick={() => handleShowModal(admin)}
//                   >
//                     <FaEdit />
//                   </Button>
//                   {admin.name === "Admin Two" && (
//     <Button
//       variant="outline-black"
//       size="sm"
//       onClick={() => handleDelete(admin.id)}
//     >
//       <FaTrash />
//     </Button>
//   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </Table>
//       </Card>

//       {/* Modal for Add/Edit Admin */}
//       <Modal show={showModal} onHide={handleCloseModal} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>{editingAdmin ? "Edit Admin" : "Add New Admin"}</Modal.Title>
//         </Modal.Header>
//         <Form onSubmit={handleFormSubmit}>
//           <Modal.Body>
//             <Form.Group className="mb-3">
//               <Form.Label>Full Name</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="name"
//                 value={adminForm.name}
//                 onChange={handleFormChange}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Email Address</Form.Label>
//               <Form.Control
//                 type="email"
//                 name="email"
//                 value={adminForm.email}
//                 onChange={handleFormChange}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>Phone Number</Form.Label>
//               <Form.Control
//                 type="tel"
//                 name="phone"
//                 value={adminForm.phone}
//                 onChange={handleFormChange}
//                 required
//               />
//             </Form.Group>
//             <Form.Group className="mb-3">
//               <Form.Label>{editingAdmin ? "New Password" : "Password"}</Form.Label>
//               <Form.Control
//                 type="password"
//                 name="password"
//                 value={adminForm.password}
//                 onChange={handleFormChange}
//                 required={!editingAdmin}
//               />
//             </Form.Group>
//           </Modal.Body>
//           <Modal.Footer>
//             <Button variant="secondary" onClick={handleCloseModal}>
//               Cancel
//             </Button>
//             <Button type="submit" variant="" style={{borderColor:'black'}}>
//               {editingAdmin ? "Update" : "Add"}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal>
//     </Container>
//   );
// };

// export default Settings;

import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Button,
  Table,
  Card,
  Modal,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";
import { getToken, logoutLocal } from "../utils/auth";

const Settings = () => {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [adminForm, setAdminForm] = useState({
    name: "",
    mobileNumber: "",
    canBeDeleted: true,
  });

  // ✅ unified headers
  const authHeaders = useCallback(() => {
    const token = getToken();
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers["x-auth-token"] = token;
      headers.token = token;
    }
    return headers;
  }, []);

  // ✅ only on 401 go login
  const handle401 = useCallback(() => {
    logoutLocal?.(); // if you have it
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    localStorage.removeItem("adminAuth");
    navigate("/login", { replace: true });
  }, [navigate]);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();
      if (!token) {
        handle401();
        return;
      }

      const res = await fetch(`${BASE_URL}/admin/auth/list`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          handle401();
          return;
        }
        throw new Error(data?.message || "Failed to fetch admins");
      }

      setAdmins(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, handle401]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleShowModal = (admin = null) => {
    setError("");
    setSuccess("");

    if (admin) {
      setEditingAdmin(admin);
      setAdminForm({
        name: admin.name || "",
        mobileNumber: admin.mobileNumber || "",
        canBeDeleted: admin.canBeDeleted !== false,
      });
    } else {
      setEditingAdmin(null);
      setAdminForm({ name: "", mobileNumber: "", canBeDeleted: true });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setAdminForm({ name: "", mobileNumber: "", canBeDeleted: true });
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAdminForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ✅ CREATE ADMIN
  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    try {
      setBtnLoading(true);
      setError("");
      setSuccess("");

      const name = String(adminForm.name || "").trim();
      const mobileNumber = String(adminForm.mobileNumber || "").replace(
        /\D/g,
        ""
      );

      if (name.length < 2) {
        setError("Admin name must be at least 2 characters");
        return;
      }

      if (!/^\d{10,15}$/.test(mobileNumber)) {
        setError("Mobile number must be 10-15 digits");
        return;
      }

      const token = getToken();
      if (!token) {
        handle401();
        return;
      }

      const payload = {
        name,
        mobileNumber,
        canBeDeleted: !!adminForm.canBeDeleted,
      };

      const res = await fetch(`${BASE_URL}/admin/auth/create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          handle401();
          return;
        }
        throw new Error(data?.message || "Failed to create admin");
      }

      setSuccess("Admin created successfully");
      handleCloseModal();
      fetchAdmins();
    } catch (e) {
      setError(e?.message || "Failed to create admin");
    } finally {
      setBtnLoading(false);
    }
  };

  // ✅ DELETE ADMIN
  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this admin?");
    if (!ok) return;

    const loggedInAdminId = (() => {
      try {
        const d = JSON.parse(localStorage.getItem("adminData") || "{}");
        return d?._id || null;
      } catch {
        return null;
      }
    })();

    try {
      setBtnLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();
      if (!token) {
        handle401();
        return;
      }

      const res = await fetch(`${BASE_URL}/admin/auth/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          handle401();
          return;
        }
        throw new Error(data?.message || "Failed to delete admin");
      }

      setSuccess("Admin deleted successfully");

      // ✅ self-delete => force logout
      if (loggedInAdminId && String(loggedInAdminId) === String(id)) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        localStorage.removeItem("adminAuth");
        navigate("/login", { replace: true });
        return;
      }

      fetchAdmins();
    } catch (e) {
      setError(e?.message || "Failed to delete admin");
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h5 className="mb-4">Admin Management</h5>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      <Card body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button
            variant=""
            onClick={() => handleShowModal()}
            style={{ borderColor: "black", fontSize: "16px" }}
            disabled={btnLoading}
          >
            <FaPlus className="me-2" />
            Add Admin
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-5">
            <p>No admins found.</p>
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr style={{ textAlign: "center" }}>
                <th>Sl.no</th>
                <th>Full Name</th>
                <th>Mobile Number</th>
                {/* <th>Can Be Deleted</th> */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody style={{ textAlign: "center" }}>
              {admins.map((admin, index) => (
                <tr key={admin._id}>
                  <td>{index + 1}</td>
                  <td>{admin.name}</td>
                  <td>{admin.mobileNumber}</td>
                  {/* <td>
                    <span
                      className={`badge bg-${
                        admin.canBeDeleted ? "success" : "danger"
                      }`}
                    >
                      {admin.canBeDeleted ? "Yes" : "No"}
                    </span>
                  </td> */}
                  <td>
                    {admin.canBeDeleted && (
                      <Button
                        variant="outline-black"
                        size="sm"
                        onClick={() => handleDelete(admin._id)}
                        disabled={btnLoading}
                      >
                        <FaTrash />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Modal for Add Admin */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAdmin ? "Edit Admin" : "Add New Admin"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleCreateAdmin}>
          <Modal.Body>
            {editingAdmin && (
              <Alert variant="warning">
                Update is not available because your backend doesn't have an
                update API. Create/delete works perfectly.
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={adminForm.name}
                onChange={handleFormChange}
                placeholder="Enter admin name"
                required
                minLength={2}
                disabled={btnLoading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mobile Number *</Form.Label>
              <Form.Control
                type="tel"
                name="mobileNumber"
                value={adminForm.mobileNumber}
                onChange={handleFormChange}
                placeholder="Enter 10-15 digit mobile number"
                required
                disabled={btnLoading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="canBeDeleted"
                label="Allow deletion of this admin account"
                checked={adminForm.canBeDeleted}
                onChange={handleFormChange}
                disabled={btnLoading}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseModal}
              disabled={btnLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant=""
              style={{ borderColor: "black" }}
              disabled={btnLoading}
            >
              {btnLoading ? "Please wait..." : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Settings;
