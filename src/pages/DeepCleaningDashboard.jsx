import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Container,
  Row,
  Col,
  Form,
  Modal,
  Button,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";



/** ---- MASTER DATA (category → subcategory → services) ---- */
const DEEP_CLEANING_DATA = [
  {
    category: "Furnished apartment",
    subcategories: [
      {
        subcategory: "1 BHK Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "2 BHK Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "3 BHK Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "4 BHK Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "5+ BHK Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
    ],
  },
  {
    category: "Unfurnished apartment",
    subcategories: [
      { subcategory: "1 BHK Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "2 BHK Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "3 BHK Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "4 BHK Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "5+ BHK Cleaning", services: ["Classic", "Premium"] },
    ],
  },
  {
    category: "Book by room",
    subcategories: [
      {
        subcategory: "Bedroom Cleaning",
        services: ["Unfurnished", "Furnished"],
      },
      {
        subcategory: "Living Room Cleaning",
        services: ["Unfurnished", "Furnished"],
      },
      {
        subcategory: "Kitchen Cleaning",
        services: [
          "Occupied Kitchen",
          "Occupied Kitchen With Appliances",
          "Empty Kitchen",
          "Empty Kitchen With Appliances",
        ],
      },
      { subcategory: "Bathroom Cleaning", services: [] },
      {
        subcategory: "Balcony Cleaning",
        services: ["Small (Upto 3 ft width)", "Big (larger than 3 ft)"],
      },
    ],
  },
  {
    category: "Furnished bungalow/duplex",
    subcategories: [
      {
        subcategory: "<1200 sqft Bungalow Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "1200-2000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "2000-3000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "3000-4000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "4000-5000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "5000-6000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
      {
        subcategory: "6000-7000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium", "Platinum"],
      },
    ],
  },
  {
    category: "Unfurnished bungalow/duplex",
    subcategories: [
      {
        subcategory: "<1200 sqft Bungalow Cleaning",
        services: ["Classic", "Premium"],
      },
      {
        subcategory: "1200-2000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium"],
      },
      {
        subcategory: "2000-3000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium"],
      },
      {
        subcategory: "3000-4000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium"],
      },
      {
        subcategory: "4000-5000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium"],
      },
      {
        subcategory: "5000-6000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium"],
      },
      {
        subcategory: "6000-7000 sqft Bungalow Cleaning",
        services: ["Classic", "Premium"],
      },
    ],
  },
  {
    category: "Mini services",
    subcategories: [
      {
        subcategory: "Kitchen Appliances Cleaning",
        services: [
          "Chimney",
          "Microwave",
          "Stove",
          "Single Door Fridge",
          "Double Door Fridge",
        ],
      },
      {
        subcategory: "Sofa & Upholstery Wet Shampooing",
        services: [
          "Sofa (5 seats)",
          "Carpet (upto 25 sqft)",
          "Cushion Chair",
          "Mattress",
        ],
      },
      { subcategory: "Utensil Removal & Placement", services: [] },
      { subcategory: "Cabinet Cleaning", services: ["Upto 2"] },
      { subcategory: "Furniture Wet Wiping", services: [] },
      { subcategory: "Ceiling Dusting & Cobweb Removal", services: [] },
    ],
  },
];

const DeepCleaningDashboard = () => {
  const [city, setCity] = useState("All Cities");
  const navigate = useNavigate();
  const [minOrder, setMinOrder] = useState(""); // text input
  const [minOrderLoading, setMinOrderLoading] = useState(false);
  const [minOrderSaving, setMinOrderSaving] = useState(false);
  const [minOrderError, setMinOrderError] = useState("");
  const [serverMinOrder, setServerMinOrder] = useState(""); // last fetched from server
  const [lastFetchedAt, setLastFetchedAt] = useState(""); // timestamp
  const [minOrderSuccess, setMinOrderSuccess] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("Deep Cleaning");

  // Packages from API
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null => add; non-null => edit

  // Form state inside modal
  const [form, setForm] = useState({
    category: "",
    subcategory: "",
    service: "",
    totalAmount: "",
    bookingAmount: "",
    coinsForVendor: "",
    teamMembers: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const fetchMinimumOrder = async () => {
    try {
      setMinOrderLoading(true);
      setMinOrderError("");
      const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`);
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to load minimum order");

      setMinOrder(String(json.data.amount)); // keep input synced
      setServerMinOrder(String(json.data.amount)); // display below input
      setLastFetchedAt(new Date().toLocaleString());
    } catch (err) {
      // If 404 (not set), clear values
      setServerMinOrder("");
      console.warn("Minimum order GET:", err.message);
    } finally {
      setMinOrderLoading(false);
    }
  };

  const saveMinimumOrder = async () => {
    try {
      setMinOrderSaving(true);
      setMinOrderError("");
      setMinOrderSuccess("");

      const amountNum = Number(minOrder);
      if (Number.isNaN(amountNum) || amountNum < 0) {
        setMinOrderError("Enter a valid non-negative number.");
        setMinOrderSaving(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum }),
      });
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to save minimum order");

      // Re-fetch to confirm and update the “Current (server) value” text
      await fetchMinimumOrder();
      setMinOrderSuccess("Minimum order saved successfully.");
    } catch (err) {
      setMinOrderError(err.message);
    } finally {
      setMinOrderSaving(false);
    }
  };

  useEffect(() => {
    fetchMinimumOrder();
    fetchPackages(); // you already had this
  }, []);

  // ===== API helpers =====
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/deeppackage/deep-cleaning-packages`);
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to load packages");
      // Normalize id for UI convenience
      const list = (json.data || []).map((p) => ({
        id: p._id || p.id,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        service: p.service || "",
        totalAmount: p.totalAmount,
        bookingAmount: p.bookingAmount,
        coinsForVendor: p.coinsForVendor,
        teamMembers: p.teamMembers,
      }));
      setPackages(list);
    } catch (err) {
      console.error("GET packages error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async (payload) => {
    const res = await fetch(`${BASE_URL}/deeppackage/deep-cleaning-packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success)
      throw new Error(json.message || "Failed to create package");
    return json.data;
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Derived options
  const subcategoryOptions = useMemo(() => {
    const cat = DEEP_CLEANING_DATA.find((c) => c.category === form.category);
    return cat ? cat.subcategories.map((s) => s.subcategory) : [];
  }, [form.category]);

  const serviceOptions = useMemo(() => {
    const cat = DEEP_CLEANING_DATA.find((c) => c.category === form.category);
    const sub = cat?.subcategories.find(
      (s) => s.subcategory === form.subcategory
    );
    return sub ? sub.services : [];
  }, [form.category, form.subcategory]);

  const resetForm = () => {
    setForm({
      category: "",
      subcategory: "",
      service: "",
      totalAmount: "",
      bookingAmount: "",
      coinsForVendor: "",
      teamMembers: "",
    });
    setErrorMessage("");
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (pkg) => {
    // Keeping edit local (no PUT as per request). Add PUT later if needed.
    setEditingId(pkg.id);
    setForm({
      category: pkg.category,
      subcategory: pkg.subcategory,
      service: pkg.service,
      totalAmount: String(pkg.totalAmount ?? ""),
      bookingAmount: String(pkg.bookingAmount ?? ""),
      coinsForVendor: String(pkg.coinsForVendor ?? ""),
      teamMembers: String(pkg.teamMembers ?? ""),
    });
    setShowModal(true);
  };

  const onFormChange = (field, value) => {
    setForm((prev) => {
      if (field === "category")
        return { ...prev, category: value, subcategory: "", service: "" };
      if (field === "subcategory")
        return { ...prev, subcategory: value, service: "" };
      return { ...prev, [field]: value };
    });
  };

  const validate = () => {
    if (!form.category) return "Please select a category.";
    if (!form.subcategory) return "Please select a subcategory.";
    if (serviceOptions.length > 0 && !form.service)
      return "Please select a service.";
    if (!form.totalAmount) return "Total amount is required.";
    if (!form.bookingAmount) return "Booking amount is required.";
    if (Number(form.bookingAmount) < 0)
      return "Booking amount cannot be negative.";
    if (!form.coinsForVendor) return "Coins for vendor is required.";
    if (!form.teamMembers) return "Team members needed is required.";
    return "";
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setErrorMessage(err);
      return;
    }
    setErrorMessage("");

    const payload = {
      category: form.category,
      subcategory: form.subcategory,
      service: form.service || "",
      totalAmount: Number(form.totalAmount),
      bookingAmount: Number(form.bookingAmount),
      coinsForVendor: Number(form.coinsForVendor),
      teamMembers: Number(form.teamMembers),
    };

    try {
      if (editingId) {
        // TODO: Add PUT /deep-cleaning-packages/:id if you want to persist edits
        // For now, we only support CREATE + GET as requested.
        // Update locally so the user sees changes:
        setPackages((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  ...payload,
                  name: payload.service
                    ? `${payload.subcategory} - ${payload.service}`
                    : payload.subcategory,
                }
              : p
          )
        );
      } else {
        // CREATE on server
        const created = await createPackage(payload);
        // Normalize created for UI:
        const normalized = {
          id: created._id || created.id,
          name: created.name,
          category: created.category,
          subcategory: created.subcategory,
          service: created.service || "",
          totalAmount: created.totalAmount,
          bookingAmount: created.bookingAmount,
          coinsForVendor: created.coinsForVendor,
          teamMembers: created.teamMembers,
        };
        setPackages((prev) => [normalized, ...prev]);
      }
      setShowModal(false);
      resetForm();
    } catch (e) {
      setErrorMessage(e.message);
    }
  };

  const handleEdit = (pkg) => {
    openEditModal(pkg);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold">Product Dashboard</h5>
        <div className="d-flex gap-2">
          <Form.Select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ height: "36px", fontSize: "12px" }}
          >
            <option>City</option>
            <option>Bengaluru</option>
            <option>Mumbai</option>
          </Form.Select>

          <Form.Select
            value={categoryFilter}
            onChange={(e) => {
              const selected = e.target.value;
              setCategoryFilter(selected);
              if (selected === "House Painting") navigate("/product");
            }}
            style={{ height: "36px", fontSize: "12px" }}
          >
            <option>Deep Cleaning</option>
            <option>House Painting</option>
          </Form.Select>
        </div>
      </div>

      <h5 className="fw-semibold mb-3" style={{ fontSize: "18px" }}>
        Minimum Order (Deep Cleaning)
      </h5>
      <Row className="mb-2 align-items-center">
        <Col md={5}>
          <Form.Control
            type="number"
            placeholder={
              minOrderLoading ? "Loading..." : "Minimum order amount"
            }
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            style={{ fontSize: "12px" }}
            disabled={minOrderLoading || minOrderSaving}
          />
          {/* messages */}
          {minOrderError && (
            <div className="text-danger mt-1" style={{ fontSize: "12px" }}>
              {minOrderError}
            </div>
          )}
          {minOrderSuccess && (
            <div className="text-success mt-1" style={{ fontSize: "12px" }}>
              {minOrderSuccess}
            </div>
          )}
          {/* current server value shown below input */}
          <div className="text-muted mt-1" style={{ fontSize: "12px" }}>
            {serverMinOrder !== "" ? (
              <>Current (server) value: ₹{serverMinOrder}</>
            ) : (
              <>No minimum order set yet.</>
            )}
          </div>
        </Col>
        <Col md={2}>
          <Button
            onClick={saveMinimumOrder}
            disabled={minOrderLoading || minOrderSaving}
            style={{
              borderColor: "black",
              backgroundColor: "transparent",
              color: "black",
              fontSize: "14px",
            }}
          >
            {minOrderSaving ? "Saving..." : "Save"}
          </Button>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center">
        <h6 className="fw-bold">Deep Cleaning Products Table</h6>
        <div className="d-flex align-items-center gap-2">
          {loading && (
            <span className="text-muted" style={{ fontSize: 12 }}>
              Loading…
            </span>
          )}
          <Button
            onClick={openAddModal}
            style={{
              borderColor: "black",
              backgroundColor: "transparent",
              color: "black",
              fontSize: "12px",
            }}
          >
            Add Package
          </Button>
          {/* <Button onClick={fetchPackages} style={{ borderColor: 'black', backgroundColor: 'transparent', color: 'black', fontSize: '12px' }}>
            Refresh
          </Button> */}
        </div>
      </div>

      <Table bordered className="mt-2">
        <thead style={{ textAlign: "center", fontSize: "14px" }}>
          <tr>
            <th>Package Name</th>
            <th>Category</th>
            <th>Subcategory</th>
            <th>Service</th>
            <th>Total Amount</th>
            <th>Booking Amount</th>
            <th>Coins for Vendor</th>
            <th>Team Members Needed</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody style={{ textAlign: "center", fontSize: "12px" }}>
          {packages.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-muted">
                No packages yet. Click “Add Package”.
              </td>
            </tr>
          ) : (
            packages.map((pkg) => (
              <tr key={pkg.id}>
                <td>
                  {pkg.name ||
                    (pkg.service
                      ? `${pkg.subcategory} - ${pkg.service}`
                      : pkg.subcategory)}
                </td>
                <td>{pkg.category}</td>
                <td>{pkg.subcategory}</td>
                <td>{pkg.service || "-"}</td>
                <td>{pkg.totalAmount}</td>
                <td>{pkg.bookingAmount}</td>
                <td>{pkg.coinsForVendor}</td>
                <td>{pkg.teamMembers}</td>
                <td>
                  <Button
                    variant="black"
                    onClick={() => handleEdit(pkg)}
                    style={{ borderColor: "black", fontSize: "12px" }}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px" }}>
            {editingId ? "Edit Package" : "Add Package"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={form.category}
                  onChange={(e) => onFormChange("category", e.target.value)}
                >
                  <option value="">Select Category</option>
                  {DEEP_CLEANING_DATA.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Subcategory</Form.Label>
                <Form.Select
                  value={form.subcategory}
                  onChange={(e) => onFormChange("subcategory", e.target.value)}
                  disabled={!form.category}
                >
                  <option value="">Select Subcategory</option>
                  {subcategoryOptions.map((sc) => (
                    <option key={sc} value={sc}>
                      {sc}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Service</Form.Label>
                <Form.Select
                  value={form.service}
                  onChange={(e) => onFormChange("service", e.target.value)}
                  disabled={!form.subcategory || serviceOptions.length === 0}
                >
                  <option value="">
                    {serviceOptions.length
                      ? "Select Service"
                      : "No service (optional)"}
                  </option>
                  {serviceOptions.map((sv) => (
                    <option key={sv} value={sv}>
                      {sv}
                    </option>
                  ))}
                </Form.Select>
                <div className="form-text">
                  {serviceOptions.length === 0
                    ? "This subcategory has no service variants."
                    : ""}
                </div>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Total Amount</Form.Label>
                <Form.Control
                  type="number"
                  value={form.totalAmount}
                  onChange={(e) => onFormChange("totalAmount", e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Booking Amount</Form.Label>
                <Form.Control
                  type="number"
                  value={form.bookingAmount}
                  onChange={(e) =>
                    onFormChange("bookingAmount", e.target.value)
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Coins for Vendor</Form.Label>
                <Form.Control
                  type="number"
                  value={form.coinsForVendor}
                  onChange={(e) =>
                    onFormChange("coinsForVendor", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Team Members Needed</Form.Label>
                <Form.Control
                  type="number"
                  value={form.teamMembers}
                  onChange={(e) => onFormChange("teamMembers", e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {errorMessage && (
            <div className="text-danger" style={{ fontSize: "12px" }}>
              {errorMessage}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="transparent"
            onClick={handleSave}
            style={{ borderColor: "black" }}
          >
            {editingId ? "Save Changes" : "Add Package"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DeepCleaningDashboard;
