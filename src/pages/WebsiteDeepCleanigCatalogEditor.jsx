import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa6";

const WebsiteDeepCleanigCatalogEditor = () => {
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState("");

  const [searchPkg, setSearchPkg] = useState("");
  const [selectPackageType, setSelectPackageType] = useState("All");

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);

  const [form, setForm] = useState({
    totalAmount: "",
    coinsForVendor: "",
    teamMembers: "",
    durationMinutes: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [pkgSaving, setPkgSaving] = useState(false);

  const selectedCityName = useMemo(() => {
    const selected = cities.find(
      (item) => String(item?._id) === String(cityId),
    );
    return selected?.city || "";
  }, [cities, cityId]);

  const fetchCities = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/city/city-list`);
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setCities(list);

      if (list.length > 0) {
        setCityId((prev) => prev || list[0]?._id || "");
      } else {
        setCityId("");
      }
    } catch (err) {
      console.error("City list error:", err);
      setCities([]);
      setCityId("");
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${BASE_URL}/admin/cleaning-catalog/fetch`);
      setConfig(res?.data?.data || null);
    } catch (err) {
      console.error("Cleaning catalog fetch error:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch catalog",
      );
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const categories = useMemo(() => {
    return Object.keys(config?.data || {});
  }, [config]);

  const flattenedPackages = useMemo(() => {
    if (!config?.data) return [];

    const rows = [];
    let serial = 1;

    Object.entries(config.data).forEach(([categoryName, items]) => {
      (items || []).forEach((pkg) => {
        const matchedCityConfig =
          (pkg?.cityConfigs || []).find(
            (cfg) => String(cfg?.cityId) === String(cityId),
          ) || null;

        const rawName = pkg?.name || "";
        const parts = rawName.split(" - ");
        const subcategory = parts[0] || rawName || "-";
        const service = parts.length > 1 ? parts.slice(1).join(" - ") : "";

        rows.push({
          slNo: serial++,
          id: pkg?.packageId || `${categoryName}-${rawName}`,
          packageId: pkg?.packageId || "",
          name: pkg?.name || "-",
          category: categoryName,
          subcategory,
          service,
          reviews: pkg?.reviews || "",
          details: pkg?.details || "",
          extras: pkg?.extras || "",
          image: pkg?.image || "",
          cityConfigExists: Boolean(matchedCityConfig),
          totalAmount: matchedCityConfig?.price ?? null,
          coinsForVendor: matchedCityConfig?.coinsForVendor ?? null,
          teamMembers: matchedCityConfig?.teamMembers ?? null,
          durationMinutes: matchedCityConfig?.duration ?? null,
        });
      });
    });

    return rows;
  }, [config, cityId]);

  const filteredPackages = useMemo(() => {
    const term = searchPkg.trim().toLowerCase();
    const selectedType = selectPackageType.trim().toLowerCase();

    return flattenedPackages.filter((pkg) => {
      const matchesSearch =
        !term ||
        (pkg.name || "").toLowerCase().includes(term) ||
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
  }, [flattenedPackages, searchPkg, selectPackageType]);

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

  const handleModalClose = () => {
    if (pkgSaving) return;
    setShowModal(false);
    resetForm();
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button
          style={{
            borderColor: "black",
            backgroundColor: "transparent",
            color: "black",
            fontSize: "12px",
          }}
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </Button>
      </div>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <h6 className="fw-bold mb-0">Website Cleaning Catalog</h6>

        <Form.Control
          type="search"
          placeholder="Search package, category, subcategory, service..."
          value={searchPkg}
          onChange={(e) => setSearchPkg(e.target.value)}
          style={{ width: "320px", fontSize: "12px", height: "36px" }}
        />

        <Form.Select
          value={selectPackageType}
          onChange={(e) => setSelectPackageType(e.target.value)}
          style={{ width: "220px", fontSize: "12px", height: "36px" }}
        >
          <option value="All">All</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Form.Select>

        <div className="d-flex align-items-center gap-2">
          {loading && (
            <span className="text-muted" style={{ fontSize: "12px" }}>
              Loading...
            </span>
          )}

          <Form.Select
            value={cityId || ""}
            onChange={(e) => setCityId(e.target.value)}
            style={{ minWidth: "180px", height: "36px", fontSize: "12px" }}
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
        </div>
      </div>

      <hr />

      {error ? (
        <div className="text-danger mb-3" style={{ fontSize: "12px" }}>
          {error}
        </div>
      ) : null}

      <Table bordered responsive className="mt-2">
        <thead style={{ textAlign: "center", fontSize: "14px" }}>
          <tr>
            <th>Sl.No</th>
            <th>Package Name</th>
            <th>Category</th>
            <th>Subcategory</th>
            <th>Service</th>
            <th>Total Amount</th>
            <th>Coins for Vendor</th>
            <th>Team Members Needed</th>
            <th>Duration (mins)</th>
            {/* <th>Actions</th> */}
          </tr>
        </thead>

        <tbody style={{ textAlign: "center", fontSize: "12px" }}>
          {filteredPackages.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-muted">
                {cityId ? "No packages found." : "Select a city first."}
              </td>
            </tr>
          ) : (
            filteredPackages.map((pkg, index) => (
              <tr key={pkg.id || index}>
                <td>{index + 1}</td>
                <td>{pkg.name || "-"}</td>
                <td>{pkg.category || "-"}</td>
                <td>{pkg.subcategory || "-"}</td>
                <td>{pkg.service || "-"}</td>
                <td>{pkg.totalAmount == null ? "-" : pkg.totalAmount}</td>
                <td>{pkg.coinsForVendor == null ? "-" : pkg.coinsForVendor}</td>
                <td>{pkg.teamMembers == null ? "-" : pkg.teamMembers}</td>
                <td>
                  {pkg.durationMinutes == null ? "-" : pkg.durationMinutes}
                </td>
                {/* <td>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button
                      variant="light"
                      onClick={() => openEditModal(pkg)}
                      style={{
                        border: "1px solid black",
                        fontSize: "12px",
                        padding: "4px 12px",
                      }}
                      disabled={pkgSaving || !cityId}
                      title={!cityId ? "Select city first" : ""}
                    >
                      Edit
                    </Button>
                  </div>
                </td> */}
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* <Modal show={showModal} onHide={handleModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px" }}>Edit Package</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Control value={selectedCityName || ""} disabled />
            <div className="form-text">
              These values are saved only for the selected city.
            </div>
          </Form.Group>

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

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Total Amount</Form.Label>
                <Form.Control
                  type="number"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      totalAmount: e.target.value,
                    }))
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
                    setForm((prev) => ({
                      ...prev,
                      coinsForVendor: e.target.value,
                    }))
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
                    setForm((prev) => ({
                      ...prev,
                      teamMembers: e.target.value,
                    }))
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
                    setForm((prev) => ({
                      ...prev,
                      durationMinutes: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          {errorMessage ? (
            <div className="text-danger" style={{ fontSize: "12px" }}>
              {errorMessage}
            </div>
          ) : null}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleModalClose}
            disabled={pkgSaving}
          >
            Cancel
          </Button>

          <Button
            variant="light"
            onClick={handleSave}
            style={{ border: "1px solid black" }}
            disabled={pkgSaving}
          >
            {pkgSaving ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal> */}
    </Container>
  );
};

export default WebsiteDeepCleanigCatalogEditor;

// packageId: "696b2aeda4e50597341a4eff"
// name:"1 BHK Cleaning - Classic"
// reviews:"4.80 (15K reviews)"
// details:"Includes 1 bedroom, 1 bathroom, 1 hall, 1 kitchen & 1 balcony"
// extras:"Basic cleaning, excludes terrace & paint marks removal"
// image:"one"
// city:"Pune"
// price:3000
// coinsForVendor:25
// teamMembers:2
// duration:
// 90
