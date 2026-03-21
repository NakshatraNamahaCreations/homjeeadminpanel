import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Container,
  Row,
  Col,
  Form,
  Modal,
  Button,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";
import axios from "axios";

/** ✅ MASTER DATA MUST MATCH DB EXACTLY (case + spelling) */
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
      { subcategory: "Bathroom Cleaning", services: [] }, // service=""
      {
        subcategory: "Balcony Cleaning",
        services: ["Small (Upto 3 ft width)", "Big (larger than 3 ft)"],
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
      { subcategory: "Cabinet Cleaning (Upto 2)", services: [] },
      { subcategory: "Furniture Wet Wiping", services: [] },
      { subcategory: "Ceiling Dusting & Cobweb Removal", services: [] },
    ],
  },
];

const DeepCleaningDashboard = () => {
  const navigate = useNavigate();

  // ✅ City dropdown from DB
  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);

  const [searchPkg, setSearchPkg] = useState("");
  const [selectPackageType, setSelectPackageType] = useState("All");

  const selectedCityName = useMemo(() => {
    const c = cities.find((x) => String(x?._id) === String(cityId));
    return c?.city || "";
  }, [cities, cityId]);

  console.log("selectedCityName", selectedCityName);
  // Minimum order
  const [minOrder, setMinOrder] = useState("");
  const [minOrderLoading, setMinOrderLoading] = useState(false);
  const [minOrderSaving, setMinOrderSaving] = useState(false);
  const [minOrderError, setMinOrderError] = useState("");
  const [serverMinOrder, setServerMinOrder] = useState("");
  const [minOrderSuccess, setMinOrderSuccess] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("Deep Cleaning");

  // ✅ Packages always show master list
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);

  // ✅ only cityConfig fields editable
  const [form, setForm] = useState({
    totalAmount: "",
    coinsForVendor: "",
    teamMembers: "",
    durationMinutes: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [pkgSaving, setPkgSaving] = useState(false);
  console.log("editingPkg", editingPkg);
  // =========================
  // ✅ ORDER MAP (same as your current)
  // =========================
  const ORDER_MAP = useMemo(() => {
    const categoryIndex = new Map();
    const subcategoryIndex = new Map();
    const serviceIndex = new Map();

    DEEP_CLEANING_DATA.forEach((catObj, cIdx) => {
      categoryIndex.set(catObj.category, cIdx);

      catObj.subcategories.forEach((subObj, sIdx) => {
        subcategoryIndex.set(`${catObj.category}__${subObj.subcategory}`, sIdx);

        (subObj.services || []).forEach((sv, vIdx) => {
          serviceIndex.set(
            `${catObj.category}__${subObj.subcategory}__${sv}`,
            vIdx,
          );
        });
      });
    });

    return { categoryIndex, subcategoryIndex, serviceIndex };
  }, []);

  // ✅ Sorted list
  const sortedPackages = useMemo(() => {
    const big = 999999;

    const getCatIdx = (cat) =>
      ORDER_MAP.categoryIndex.has(cat) ? ORDER_MAP.categoryIndex.get(cat) : big;

    const getSubIdx = (cat, sub) =>
      ORDER_MAP.subcategoryIndex.has(`${cat}__${sub}`)
        ? ORDER_MAP.subcategoryIndex.get(`${cat}__${sub}`)
        : big;

    const getSvIdx = (cat, sub, sv) => {
      if (!sv) return -1;
      const key = `${cat}__${sub}__${sv}`;
      return ORDER_MAP.serviceIndex.has(key)
        ? ORDER_MAP.serviceIndex.get(key)
        : big;
    };

    return [...packages].sort((a, b) => {
      const c1 = getCatIdx(a.category);
      const c2 = getCatIdx(b.category);
      if (c1 !== c2) return c1 - c2;

      const s1 = getSubIdx(a.category, a.subcategory);
      const s2 = getSubIdx(b.category, b.subcategory);
      if (s1 !== s2) return s1 - s2;

      const v1 = getSvIdx(a.category, a.subcategory, a.service);
      const v2 = getSvIdx(b.category, b.subcategory, b.service);
      if (v1 !== v2) return v1 - v2;

      return (a.name || "").localeCompare(b.name || "");
    });
  }, [packages, ORDER_MAP]);

  const filteredPackages = useMemo(() => {
    const term = searchPkg.trim().toLowerCase();
    const selectedType = selectPackageType.trim().toLowerCase();

    return sortedPackages.filter((pkg) => {
      const packageName =
        pkg.name ||
        (pkg.service ? `${pkg.subcategory} - ${pkg.service}` : pkg.subcategory);

      const matchesSearch =
        !term ||
        packageName.toLowerCase().includes(term) ||
        (pkg.category || "").toLowerCase().includes(term) ||
        (pkg.subcategory || "").toLowerCase().includes(term) ||
        (pkg.service || "").toLowerCase().includes(term) ||
        String(pkg.totalAmount ?? "")
          .toLowerCase()
          .includes(term) ||
        String(pkg.coinsForVendor ?? "")
          .toLowerCase()
          .includes(term) ||
        String(pkg.teamMembers ?? "")
          .toLowerCase()
          .includes(term) ||
        String(pkg.durationMinutes ?? "")
          .toLowerCase()
          .includes(term);

      const matchesPackageType =
        selectedType === "all" ||
        (pkg.category || "").toLowerCase() === selectedType;

      return matchesSearch && matchesPackageType;
    });
  }, [sortedPackages, searchPkg, selectPackageType]);

  // =========================
  // Fetch city list
  // =========================
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/city/city-list`);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setCities(list);
        if (list.length > 0) setCityId(list[0]?._id || "");
      } catch (e) {
        console.error("City list error:", e);
        setCities([]);
        setCityId("");
      }
    };
    fetchCities();
  }, []);

  const minimumOrderValue = async () => {
    try {
      if (!selectedCityName || !selectedCityName.trim()) return;

      const res = await fetch(
        `${BASE_URL}/minimumorder/get-minimum-orders/city/${encodeURIComponent(selectedCityName.trim())}`,
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch minimum orders");
      }

      const pricing = data?.data || {};
      console.log("minimum price", pricing);
      setMinOrder(
        pricing.amount !== undefined && pricing.amount !== null
          ? String(pricing.amount)
          : "",
      );
    } catch (error) {
      console.error("Error while Mini order value:", error);
      setMinOrder("");
    }
  };
  useEffect(() => {
    minimumOrderValue();
  }, [selectedCityName]);

  const saveMinimumOrder = async () => {
    try {
      setMinOrderSaving(true);
      setMinOrderError("");
      setMinOrderSuccess("");

      const amountNum = Number(minOrder);
      if (Number.isNaN(amountNum) || amountNum < 0) {
        setMinOrderError("Enter a valid non-negative number.");
        return;
      }

      const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, city: selectedCityName }),
      });

      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to save minimum order");

      // await fetchMinimumOrder();
      await minimumOrderValue();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      // setMinOrderSuccess("Minimum order saved successfully.");
    } catch (err) {
      setMinOrderError(err.message);
    } finally {
      setMinOrderSaving(false);
    }
  };

  const fetchPackagesByCity = async () => {
    try {
      if (!cityId) {
        setPackages([]);
        return;
      }

      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/deeppackage/deep-cleaning-packages/by-city/${cityId}`,
      );
      const json = await res.json();
      if (!json.success)
        throw new Error(json.message || "Failed to load packages");

      const list = (json.data || []).map((p) => ({
        // master identity
        id: p._id,
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        service: p.service || "",

        // city config (nullable)
        totalAmount: p.totalAmount ?? null,
        coinsForVendor: p.coinsForVendor ?? null,
        teamMembers: p.teamMembers ?? null,
        durationMinutes: p.durationMinutes ?? null,

        hasCityConfig: Boolean(p.hasCityConfig),
      }));

      setPackages(list);
    } catch (err) {
      console.error("GET packages by city error:", err.message);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save / Upsert only cityConfig fields
  const upsertCityConfig = async (packageId, payload) => {
    const res = await fetch(
      `${BASE_URL}/deeppackage/deep-cleaning-packages/${packageId}/city-config`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    if (!json.success)
      throw new Error(json.message || "Failed to save city config");
    return json.data;
  };

  useEffect(() => {
    fetchPackagesByCity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  const resetForm = () => {
    setForm({
      totalAmount: "",
      coinsForVendor: "",
      teamMembers: "",
      durationMinutes: "",
    });
    setErrorMessage("");
    setEditingPkg(null);
  };

  const openEditModal = (pkg) => {
    setEditingPkg(pkg);

    setForm({
      totalAmount: pkg.totalAmount == null ? "" : String(pkg.totalAmount),
      coinsForVendor:
        pkg.coinsForVendor == null ? "" : String(pkg.coinsForVendor),
      teamMembers: pkg.teamMembers == null ? "" : String(pkg.teamMembers),
      durationMinutes:
        pkg.durationMinutes == null ? "" : String(pkg.durationMinutes),
    });

    setErrorMessage("");
    setShowModal(true);
  };

  const validate = () => {
    if (!cityId) return "Please select a city first.";

    const amount = Number(form.totalAmount);
    const coins = Number(form.coinsForVendor);
    const team = Number(form.teamMembers);
    const dur = Number(form.durationMinutes);

    if (!Number.isFinite(amount) || amount < 0)
      return "Total amount must be a valid number (>= 0).";
    if (!Number.isFinite(coins) || coins < 0)
      return "Coins must be a valid number (>= 0).";
    if (!Number.isFinite(team) || team < 1)
      return "Team members must be at least 1.";
    if (!Number.isFinite(dur) || dur < 30)
      return "Duration must be at least 30 minutes.";

    return "";
  };

  const handleSave = async () => {
    try {
      const err = validate();
      if (err) {
        setErrorMessage(err);
        return;
      }
      setErrorMessage("");

      if (!editingPkg?.id) return;

      setPkgSaving(true);

      await upsertCityConfig(editingPkg.id, {
        category: editingPkg?.category,
        cityId,
        totalAmount: Number(form.totalAmount),
        coinsForVendor: Number(form.coinsForVendor),
        teamMembers: Number(form.teamMembers),
        durationMinutes: Number(form.durationMinutes),
      });

      await fetchPackagesByCity();
      setShowModal(false);
      resetForm();
    } catch (e) {
      setErrorMessage(e?.message || "Something went wrong");
    } finally {
      setPkgSaving(false);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold">Product Dashboard</h5>
        {showSuccess && (
          <Alert
            variant="success"
            onClose={() => setShowSuccess(false)}
            dismissible
            className="price-success-alert-productDash"
          >
            Minimum order saved successfully.
          </Alert>
        )}

        <div className="d-flex gap-2">
          <Form.Select
            value={cityId || ""}
            onChange={(e) => setCityId(e.target.value)}
            style={{ height: "36px", fontSize: "12px" }}
          >
            {cities.length === 0 ? (
              <option value="">No cities</option>
            ) : (
              cities.map((c) => (
                <option key={c?._id} value={c?._id}>
                  {c?.city || ""}
                </option>
              ))
            )}
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

      <h6 className="fw-bold">Minimum Order (Deep Cleaning)</h6>

      <Row className="mb-2 align-items-center">
        <Col md={5}>
          <Form.Control
            type="number"
            placeholder={
              minOrderLoading ? "Loading..." : "Minimum order amount"
            }
            value={minOrder}
            min={0}
            onChange={(e) => setMinOrder(e.target.value)}
            style={{ fontSize: "12px" }}
            disabled={minOrderLoading || minOrderSaving}
          />
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
      <hr />
      <div className="d-flex justify-content-between align-items-center">
        <h6 className="fw-bold">Deep Cleaning Products Table</h6>
        <Form.Control
          type="search"
          placeholder="Search package, category, subcategory, service..."
          value={searchPkg}
          onChange={(e) => setSearchPkg(e.target.value)}
          style={{ width: "320px", fontSize: "12px", height: "36px" }}
        />
        <Form.Select
          value={selectPackageType}
          onChange={(e) => {
            const selected = e.target.value;
            setSelectPackageType(selected);
          }}
          style={{ width: "220px", fontSize: "12px", height: "36px" }}
        >
          <option value="All">All</option>
          <option value="Furnished apartment">Furnished apartment</option>
          <option value="Unfurnished apartment">Unfurnished apartment</option>
          <option value="Book by room">Book by room</option>
          <option value="Unfurnished bungalow/duplex">
            Unfurnished bungalow/duplex
          </option>
          <option value="Furnished bungalow/duplex">
            Furnished bungalow/duplex
          </option>
          <option value="Mini services">Mini services</option>
        </Form.Select>
        <div className="d-flex align-items-center gap-2">
          {loading && (
            <span className="text-muted" style={{ fontSize: 12 }}>
              Loading…
            </span>
          )}

          <Button
            style={{
              borderColor: "black",
              backgroundColor: "transparent",
              color: "black",
              fontSize: "12px",
            }}
            onClick={() => navigate("/admincleaningcatalogeditor")}
          >
            Website Packages
          </Button>
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
            <th>Coins for Vendor</th>
            <th>Team Members Needed</th>
            <th>Duration (mins)</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody style={{ textAlign: "center", fontSize: "12px" }}>
          {filteredPackages.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-muted">
                {cityId ? "No packages found." : "Select a city first."}
              </td>
            </tr>
          ) : (
            filteredPackages.map((pkg) => (
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

                {/* ✅ show blank if null */}
                <td>{pkg.totalAmount == null ? "-" : pkg.totalAmount}</td>
                <td>{pkg.coinsForVendor == null ? "-" : pkg.coinsForVendor}</td>
                <td>{pkg.teamMembers == null ? "-" : pkg.teamMembers}</td>
                <td>
                  {pkg.durationMinutes == null ? "-" : pkg.durationMinutes}
                </td>

                <td>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button
                      variant="black"
                      onClick={() => openEditModal(pkg)}
                      style={{ borderColor: "black", fontSize: "12px" }}
                      disabled={pkgSaving || !cityId}
                      title={!cityId ? "Select city first" : ""}
                    >
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* ✅ Edit City Config Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px" }}>Edit Package </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Control value={selectedCityName || ""} disabled />
            <div className="form-text">
              These values are saved only for the selected city.
            </div>
          </Form.Group>

          {/* ✅ show identity (read-only) */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Control value={editingPkg?.category || ""} disabled />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Subcategory</Form.Label>
                <Form.Control value={editingPkg?.subcategory || ""} disabled />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Service</Form.Label>
                <Form.Control value={editingPkg?.service || "-"} disabled />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Package Name</Form.Label>
                <Form.Control value={editingPkg?.name || ""} disabled />
              </Form.Group>
            </Col>
          </Row>

          {/* ✅ editable city fields */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Total Amount</Form.Label>
                <Form.Control
                  type="number"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, totalAmount: e.target.value }))
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
                    setForm((p) => ({ ...p, coinsForVendor: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Team Members Needed</Form.Label>
                <Form.Control
                  type="number"
                  value={form.teamMembers}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, teamMembers: e.target.value }))
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Duration (Minutes)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Eg: 30"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, durationMinutes: e.target.value }))
                  }
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
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            disabled={pkgSaving}
          >
            Cancel
          </Button>

          <Button
            variant="transparent"
            onClick={handleSave}
            style={{ borderColor: "black" }}
            disabled={pkgSaving}
          >
            {pkgSaving ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DeepCleaningDashboard;
