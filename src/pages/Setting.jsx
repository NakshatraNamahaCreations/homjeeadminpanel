import React, { useState } from "react";
import {
  Container,
  Button,
  Table,
  Card,
  Modal,
  Form,
} from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

const Settings = () => {
  const [admins, setAdmins] = useState([
    { id: 1, name: "Admin One", email: "admin1@example.com", phone: "1234567890" },
    { id: 2, name: "Admin Two", email: "admin2@example.com", phone: "9876543210" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleShowModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminForm({ ...admin, password: "" });
    } else {
      setEditingAdmin(null);
      setAdminForm({ name: "", email: "", phone: "", password: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    setAdminForm({ name: "", email: "", phone: "", password: "" });
  };

  const handleFormChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingAdmin) {
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === editingAdmin.id ? { ...admin, ...adminForm } : admin
        )
      );
    } else {
      const newAdmin = { id: Date.now(), ...adminForm };
      setAdmins([...admins, newAdmin]);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      setAdmins(admins.filter((admin) => admin.id !== id));
    }
  };

  return (
    <Container className="py-4">
      <h5 className="mb-4">Admin Management</h5>
      <Card body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0"></h5>
          <Button variant="" onClick={() => handleShowModal()} style={{borderColor:'black', fontSize:'16px'}}>
            + Add Admin
          </Button>
        </div>

        <Table striped bordered hover responsive>
          <thead>
            <tr style={{textAlign:'center'}}>
              <th>Sl.no</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody style={{textAlign:"center"}}>
            {admins.map((admin, index) => (
              <tr key={admin.id}>
                <td>{index + 1}</td>
                <td>{admin.name}</td>
                <td>{admin.email}</td>
                <td>{admin.phone}</td>
                <td>
                  <Button
                    variant="outline-black"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowModal(admin)}
                  >
                    <FaEdit />
                  </Button>
                  {admin.name === "Admin Two" && (
    <Button
      variant="outline-black"
      size="sm"
      onClick={() => handleDelete(admin.id)}
    >
      <FaTrash />
    </Button>
  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Modal for Add/Edit Admin */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingAdmin ? "Edit Admin" : "Add New Admin"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={adminForm.name}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={adminForm.email}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="tel"
                name="phone"
                value={adminForm.phone}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{editingAdmin ? "New Password" : "Password"}</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={adminForm.password}
                onChange={handleFormChange}
                required={!editingAdmin}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" variant="" style={{borderColor:'black'}}>
              {editingAdmin ? "Update" : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Settings;
