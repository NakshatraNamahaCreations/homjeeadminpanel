import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Container,
  Button,
  Table,
  Card,
  Modal,
  Form,
  Alert,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";
import { FaTrash, FaPlus, FaCity } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";
import { getToken, logoutLocal } from "../utils/auth";

const Settings = () => {
  const navigate = useNavigate();

  /* =========================
   * Admin Management State
   * ========================= */
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    mobileNumber: "",
  });

  /* =========================
   * City Management State
   * ========================= */
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  const [showCityModal, setShowCityModal] = useState(false);
  const [cityForm, setCityForm] = useState({
    city: "",
    feedbackLink: "",
  });

  /* =========================
   * Common UI State
   * ========================= */
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================
   * Auth Helpers
   * ========================= */
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

  const handle401 = useCallback(() => {
    try {
      logoutLocal?.();
    } catch {}
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    localStorage.removeItem("adminAuth");
    navigate("/login", { replace: true });
  }, [navigate]);

  /* =========================
   * API Endpoints
   * ========================= */
  const CITY_API = useMemo(
    () => ({
      LIST: `${BASE_URL}/city/city-list`,
      CREATE: `${BASE_URL}/city/city-create`,
      DELETE: (id) => `${BASE_URL}/city/${id}`,
    }),
    []
  );

  /* =========================
   * Fetch Admins
   * ========================= */
  const fetchAdmins = useCallback(async () => {
    try {
      setAdminsLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();
      if (!token) return handle401();

      const res = await fetch(`${BASE_URL}/admin/auth/list`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) return handle401();
        throw new Error(data?.message || "Failed to fetch admins");
      }

      setAdmins(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load admins");
    } finally {
      setAdminsLoading(false);
    }
  }, [authHeaders, handle401]);

  /* =========================
   * Fetch Cities
   * ========================= */
  const fetchCities = useCallback(async () => {
    try {
      setCitiesLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();
      if (!token) return handle401();

      const res = await fetch(CITY_API.LIST, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) return handle401();
        throw new Error(data?.message || "Failed to fetch cities");
      }

      setCities(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load cities");
    } finally {
      setCitiesLoading(false);
    }
  }, [authHeaders, handle401, CITY_API.LIST]);

  useEffect(() => {
    fetchAdmins();
    fetchCities();
  }, [fetchAdmins, fetchCities]);

  /* =========================
   * Admin Modal
   * ========================= */
  const openAdminModal = () => {
    setError("");
    setSuccess("");
    setAdminForm({ name: "", mobileNumber: "" });
    setShowAdminModal(true);
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAdminForm({ name: "", mobileNumber: "" });
  };

  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm((p) => ({ ...p, [name]: value }));
  };

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
      if (!token) return handle401();

      // ✅ canBeDeleted removed from UI; defaulting to true
      const payload = { name, mobileNumber, canBeDeleted: true };

      const res = await fetch(`${BASE_URL}/admin/auth/create`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) return handle401();
        throw new Error(data?.message || "Failed to create admin");
      }

      setSuccess("Admin created successfully");
      closeAdminModal();
      fetchAdmins();
    } catch (e) {
      setError(e?.message || "Failed to create admin");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
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
      if (!token) return handle401();

      const res = await fetch(`${BASE_URL}/admin/auth/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) return handle401();
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

  /* =========================
   * City Modal + CRUD
   * ========================= */
  const openCityModal = () => {
    setError("");
    setSuccess("");
    setCityForm({ city: "", feedbackLink: "" });
    setShowCityModal(true);
  };

  const closeCityModal = () => {
    setShowCityModal(false);
    setCityForm({ city: "", feedbackLink: "" });
  };

  const handleCityFormChange = (e) => {
    const { name, value } = e.target;
    setCityForm((p) => ({ ...p, [name]: value }));
  };

  const handleCreateCity = async (e) => {
    e.preventDefault();

    try {
      setBtnLoading(true);
      setError("");
      setSuccess("");

      const city = String(cityForm.city || "").trim();
      const feedbackLink = String(cityForm.feedbackLink || "").trim();

      if (city.length < 2) {
        setError("City name must be at least 2 characters");
        return;
      }

      try {
        // eslint-disable-next-line no-new
        new URL(feedbackLink);
      } catch {
        setError("Feedback link must be a valid URL (https://...)");
        return;
      }

      const token = getToken();
      if (!token) return handle401();

      const payload = { city, feedbackLink };

      const res = await fetch(CITY_API.CREATE, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) return handle401();
        throw new Error(data?.message || "Failed to create city");
      }

      setSuccess("City added successfully");
      closeCityModal();
      fetchCities();
    } catch (e) {
      setError(e?.message || "Failed to create city");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDeleteCity = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this city?");
    if (!ok) return;

    try {
      setBtnLoading(true);
      setError("");
      setSuccess("");

      const token = getToken();
      if (!token) return handle401();

      const res = await fetch(CITY_API.DELETE(id), {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) return handle401();
        throw new Error(data?.message || "Failed to delete city");
      }

      setSuccess("City deleted successfully");
      fetchCities();
    } catch (e) {
      setError(e?.message || "Failed to delete city");
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h5 className="mb-4">Settings</h5>

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

      <Row className="g-3">
        {/* ===================== Admin Management ===================== */}
        <Col lg={12}>
          <Card body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="mb-0">Admin Management</h6>
                <small className="text-muted">
                  Create and delete admin users
                </small>
              </div>

              <Button
                variant=""
                onClick={openAdminModal}
                style={{ borderColor: "black", fontSize: "16px" }}
                disabled={btnLoading}
              >
                <FaPlus className="me-2" />
                Add Admin
              </Button>
            </div>

            {adminsLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
                <p className="mt-2 mb-0">Loading admins...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-4">
                <p className="mb-0">No admins found.</p>
              </div>
            ) : (
              <Table striped bordered hover responsive className="mb-0">
                <thead>
                  <tr style={{ textAlign: "center" }}>
                    <th style={{ width: 70 }}>Sl.no</th>
                    <th>Full Name</th>
                    <th>Mobile Number</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ textAlign: "center" }}>
                  {admins.map((admin, index) => (
                    <tr key={admin._id}>
                      <td>{index + 1}</td>
                      <td>{admin.name}</td>
                      <td>{admin.mobileNumber}</td>
                      <td>
                        {admin.canBeDeleted && (
                          <Button
                            variant="outline-dark"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin._id)}
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
        </Col>

        {/* ===================== City Management ===================== */}
        <Col lg={12}>
          <Card body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h6 className="mb-0">City Management</h6>
                <small className="text-muted">
                  Add cities with feedback links
                </small>
              </div>

              <Button
                variant=""
                onClick={openCityModal}
                style={{ borderColor: "black", fontSize: "16px" }}
                disabled={btnLoading}
              >
                <FaCity className="me-2" />
                Add City
              </Button>
            </div>

            {citiesLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
                <p className="mt-2 mb-0">Loading cities...</p>
              </div>
            ) : cities.length === 0 ? (
              <div className="text-center py-4">
                <p className="mb-0">No cities found.</p>
              </div>
            ) : (
              <Table striped bordered hover responsive className="mb-0">
                <thead>
                  <tr style={{ textAlign: "center" }}>
                    <th style={{ width: 70 }}>Sl.no</th>
                    <th>City</th>
                    <th>Feedback Link</th>
                    <th style={{ width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ textAlign: "center" }}>
                  {cities.map((c, index) => (
                    <tr key={c._id || c.id || index}>
                      <td>{index + 1}</td>
                      <td>{c.city || "-"}</td>
                      <td style={{ textAlign: "left" }}>
                        {c.feedbackLink ? (
                          <a
                            href={c.feedbackLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {c.feedbackLink}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-dark"
                          size="sm"
                          onClick={() => handleDeleteCity(c._id || c.id)}
                          disabled={btnLoading}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Col>
      </Row>

      {/* ===================== Add Admin Modal ===================== */}
      <Modal show={showAdminModal} onHide={closeAdminModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Admin</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleCreateAdmin}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={adminForm.name}
                onChange={handleAdminFormChange}
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
                onChange={handleAdminFormChange}
                placeholder="Enter 10-15 digit mobile number"
                required
                disabled={btnLoading}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeAdminModal}
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

      {/* ===================== Add City Modal ===================== */}
      <Modal show={showCityModal} onHide={closeCityModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add City</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleCreateCity}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>City *</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={cityForm.city}
                onChange={handleCityFormChange}
                placeholder="Enter city name"
                required
                minLength={2}
                disabled={btnLoading}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Feedback Link *</Form.Label>
              <Form.Control
                type="url"
                name="feedbackLink"
                value={cityForm.feedbackLink}
                onChange={handleCityFormChange}
                placeholder="https://...."
                required
                disabled={btnLoading}
              />
              <small className="text-muted">
                Example: Google Form / feedback page URL
              </small>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeCityModal}
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

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   Container,
//   Button,
//   Table,
//   Card,
//   Modal,
//   Form,
//   Alert,
//   Spinner,
// } from "react-bootstrap";
// import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import { BASE_URL } from "../utils/config";
// import { getToken, logoutLocal } from "../utils/auth";

// const Settings = () => {
//   const navigate = useNavigate();

//   const [admins, setAdmins] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [btnLoading, setBtnLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [showModal, setShowModal] = useState(false);
//   const [editingAdmin, setEditingAdmin] = useState(null);

//   const [adminForm, setAdminForm] = useState({
//     name: "",
//     mobileNumber: "",
//     canBeDeleted: true,
//   });

//   // ✅ unified headers
//   const authHeaders = useCallback(() => {
//     const token = getToken();
//     const headers = { "Content-Type": "application/json" };
//     if (token) {
//       headers.Authorization = `Bearer ${token}`;
//       headers["x-auth-token"] = token;
//       headers.token = token;
//     }
//     return headers;
//   }, []);

//   // ✅ only on 401 go login
//   const handle401 = useCallback(() => {
//     logoutLocal?.(); // if you have it
//     localStorage.removeItem("adminToken");
//     localStorage.removeItem("adminData");
//     localStorage.removeItem("adminAuth");
//     navigate("/login", { replace: true });
//   }, [navigate]);

//   const fetchAdmins = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError("");
//       setSuccess("");

//       const token = getToken();
//       if (!token) {
//         handle401();
//         return;
//       }

//       const res = await fetch(`${BASE_URL}/admin/auth/list`, {
//         method: "GET",
//         headers: authHeaders(),
//       });

//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         if (res.status === 401) {
//           handle401();
//           return;
//         }
//         throw new Error(data?.message || "Failed to fetch admins");
//       }

//       setAdmins(Array.isArray(data?.data) ? data.data : []);
//     } catch (e) {
//       setError(e?.message || "Failed to load admins");
//     } finally {
//       setLoading(false);
//     }
//   }, [authHeaders, handle401]);

//   useEffect(() => {
//     fetchAdmins();
//   }, [fetchAdmins]);

//   const handleShowModal = (admin = null) => {
//     setError("");
//     setSuccess("");

//     if (admin) {
//       setEditingAdmin(admin);
//       setAdminForm({
//         name: admin.name || "",
//         mobileNumber: admin.mobileNumber || "",
//         canBeDeleted: admin.canBeDeleted !== false,
//       });
//     } else {
//       setEditingAdmin(null);
//       setAdminForm({ name: "", mobileNumber: "", canBeDeleted: true });
//     }
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     setEditingAdmin(null);
//     setAdminForm({ name: "", mobileNumber: "", canBeDeleted: true });
//   };

//   const handleFormChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setAdminForm((p) => ({
//       ...p,
//       [name]: type === "checkbox" ? checked : value,
//     }));
//   };

//   // ✅ CREATE ADMIN
//   const handleCreateAdmin = async (e) => {
//     e.preventDefault();

//     try {
//       setBtnLoading(true);
//       setError("");
//       setSuccess("");

//       const name = String(adminForm.name || "").trim();
//       const mobileNumber = String(adminForm.mobileNumber || "").replace(
//         /\D/g,
//         ""
//       );

//       if (name.length < 2) {
//         setError("Admin name must be at least 2 characters");
//         return;
//       }

//       if (!/^\d{10,15}$/.test(mobileNumber)) {
//         setError("Mobile number must be 10-15 digits");
//         return;
//       }

//       const token = getToken();
//       if (!token) {
//         handle401();
//         return;
//       }

//       const payload = {
//         name,
//         mobileNumber,
//         canBeDeleted: !!adminForm.canBeDeleted,
//       };

//       const res = await fetch(`${BASE_URL}/admin/auth/create`, {
//         method: "POST",
//         headers: authHeaders(),
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         if (res.status === 401) {
//           handle401();
//           return;
//         }
//         throw new Error(data?.message || "Failed to create admin");
//       }

//       setSuccess("Admin created successfully");
//       handleCloseModal();
//       fetchAdmins();
//     } catch (e) {
//       setError(e?.message || "Failed to create admin");
//     } finally {
//       setBtnLoading(false);
//     }
//   };

//   // ✅ DELETE ADMIN
//   const handleDelete = async (id) => {
//     const ok = window.confirm("Are you sure you want to delete this admin?");
//     if (!ok) return;

//     const loggedInAdminId = (() => {
//       try {
//         const d = JSON.parse(localStorage.getItem("adminData") || "{}");
//         return d?._id || null;
//       } catch {
//         return null;
//       }
//     })();

//     try {
//       setBtnLoading(true);
//       setError("");
//       setSuccess("");

//       const token = getToken();
//       if (!token) {
//         handle401();
//         return;
//       }

//       const res = await fetch(`${BASE_URL}/admin/auth/${id}`, {
//         method: "DELETE",
//         headers: authHeaders(),
//       });

//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         if (res.status === 401) {
//           handle401();
//           return;
//         }
//         throw new Error(data?.message || "Failed to delete admin");
//       }

//       setSuccess("Admin deleted successfully");

//       // ✅ self-delete => force logout
//       if (loggedInAdminId && String(loggedInAdminId) === String(id)) {
//         localStorage.removeItem("adminToken");
//         localStorage.removeItem("adminData");
//         localStorage.removeItem("adminAuth");
//         navigate("/login", { replace: true });
//         return;
//       }

//       fetchAdmins();
//     } catch (e) {
//       setError(e?.message || "Failed to delete admin");
//     } finally {
//       setBtnLoading(false);
//     }
//   };

//   return (
//     <Container className="py-4">
//       <h5 className="mb-4">Admin Management</h5>

//       {error && (
//         <Alert variant="danger" onClose={() => setError("")} dismissible>
//           {error}
//         </Alert>
//       )}

//       {success && (
//         <Alert variant="success" onClose={() => setSuccess("")} dismissible>
//           {success}
//         </Alert>
//       )}

//       <Card body>
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <Button
//             variant=""
//             onClick={() => handleShowModal()}
//             style={{ borderColor: "black", fontSize: "16px" }}
//             disabled={btnLoading}
//           >
//             <FaPlus className="me-2" />
//             Add Admin
//           </Button>
//         </div>

//         {loading ? (
//           <div className="text-center py-5">
//             <Spinner animation="border" />
//             <p className="mt-2">Loading admins...</p>
//           </div>
//         ) : admins.length === 0 ? (
//           <div className="text-center py-5">
//             <p>No admins found.</p>
//           </div>
//         ) : (
//           <Table striped bordered hover responsive>
//             <thead>
//               <tr style={{ textAlign: "center" }}>
//                 <th>Sl.no</th>
//                 <th>Full Name</th>
//                 <th>Mobile Number</th>
//                 {/* <th>Can Be Deleted</th> */}
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody style={{ textAlign: "center" }}>
//               {admins.map((admin, index) => (
//                 <tr key={admin._id}>
//                   <td>{index + 1}</td>
//                   <td>{admin.name}</td>
//                   <td>{admin.mobileNumber}</td>
//                   {/* <td>
//                     <span
//                       className={`badge bg-${
//                         admin.canBeDeleted ? "success" : "danger"
//                       }`}
//                     >
//                       {admin.canBeDeleted ? "Yes" : "No"}
//                     </span>
//                   </td> */}
//                   <td>
//                     {admin.canBeDeleted && (
//                       <Button
//                         variant="outline-black"
//                         size="sm"
//                         onClick={() => handleDelete(admin._id)}
//                         disabled={btnLoading}
//                       >
//                         <FaTrash />
//                       </Button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         )}
//       </Card>

//       {/* Modal for Add Admin */}
//       <Modal show={showModal} onHide={handleCloseModal} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>
//             {editingAdmin ? "Edit Admin" : "Add New Admin"}
//           </Modal.Title>
//         </Modal.Header>

//         <Form onSubmit={handleCreateAdmin}>
//           <Modal.Body>
//             {editingAdmin && (
//               <Alert variant="warning">
//                 Update is not available because your backend doesn't have an
//                 update API. Create/delete works perfectly.
//               </Alert>
//             )}

//             <Form.Group className="mb-3">
//               <Form.Label>Full Name *</Form.Label>
//               <Form.Control
//                 type="text"
//                 name="name"
//                 value={adminForm.name}
//                 onChange={handleFormChange}
//                 placeholder="Enter admin name"
//                 required
//                 minLength={2}
//                 disabled={btnLoading}
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Mobile Number *</Form.Label>
//               <Form.Control
//                 type="tel"
//                 name="mobileNumber"
//                 value={adminForm.mobileNumber}
//                 onChange={handleFormChange}
//                 placeholder="Enter 10-15 digit mobile number"
//                 required
//                 disabled={btnLoading}
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Check
//                 type="checkbox"
//                 name="canBeDeleted"
//                 label="Allow deletion of this admin account"
//                 checked={adminForm.canBeDeleted}
//                 onChange={handleFormChange}
//                 disabled={btnLoading}
//               />
//             </Form.Group>
//           </Modal.Body>

//           <Modal.Footer>
//             <Button
//               variant="secondary"
//               onClick={handleCloseModal}
//               disabled={btnLoading}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               variant=""
//               style={{ borderColor: "black" }}
//               disabled={btnLoading}
//             >
//               {btnLoading ? "Please wait..." : "Add"}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal>
//     </Container>
//   );
// };

// export default Settings;
