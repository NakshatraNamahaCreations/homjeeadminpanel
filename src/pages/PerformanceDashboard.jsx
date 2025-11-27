import { useState, useEffect } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import { FaCog } from "react-icons/fa";
import axios from "axios";
import { BASE_URL } from "../utils/config";

const PerformanceDashboard = ({ show, onHide }) => {
  const [city, setCity] = useState("All Cities");
  const [selectedService, setSelectedService] = useState("House Painters");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("house Painting");
  const [allLeads, setAllLeads] = useState([]);
  const [housePaintingLeads, setHousePaintingLeads] = useState(0);
  const [deepCleaningLeads, setDeepCleaningLeads] = useState(0);
  const [avgGsvHousePainting, setAvgGsvHousePainting] = useState(0);
  const [avgGsvDeepCleaning, setAvgGsvDeepCleaning] = useState(0);
  const [surveyPctHousePainting, setSurveyPctHousePainting] = useState(0);
  const [surveyPctDeepCleaning, setSurveyPctDeepCleaning] = useState(0);
  const [acceptedDC, setAcceptedDC] = useState(0);
  const [cancelledDC, setCancelledDC] = useState(0);
  const [cancellationPctDeepCleaning, setCancellationPctDeepCleaning] =
    useState(0);
  const [acceptedHP, setAcceptedHP] = useState(0);
  const [cancelledHP, setCancelledHP] = useState(0);
  const [cancellationPctHousePainting, setCancellationPctHousePainting] =
    useState(0);
  const [housePaintingVendors, setHousePaintingVendors] = useState([]);
  const [deepCleaningVendors, setDeepCleaningVendors] = useState([]);
  const [startedHP, setStartedHP] = useState(0);

  const [kpiValues, setKpiValues] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  const serviceMap = {
    "House Painters": "house_painting",
    "Deep Cleaning": "deep_cleaning",
  };

  // 🚀 ADD THIS HERE
  const metricLabels = {
    surveyPercentage: "Survey %",
    hiringPercentage: "Hiring %",
    avgGSV: "Avg. GSV",
    rating: "Rating",
    strikes: "Strikes",

    // Deep Cleaning Metrics
    responsePercentage: "Response %",
    cancellationPercentage: "Cancellation %",
  };

  const normalize = (v) => (v ?? "").toString().trim().toLowerCase();

  const computeTotals = (arr) => {
    let totalAmount = 0;
    let totalProjects = 0;

    arr.forEach((lead) => {
      if (Array.isArray(lead?.service)) {
        lead.service.forEach((srv) => {
          const qty = Number(srv?.quantity) || 1;
          const price = Number(srv?.price) || 0;
          totalAmount += price * qty;
          totalProjects += qty; // each service item counts as a project
        });
      }
    });

    return { totalAmount, totalProjects };
  };

  console.log("surveyPctHousePainting", surveyPctHousePainting);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await axios.get(
          "https://homjee-backend.onrender.com/api/bookings/get-all-leads"
        );

        const leads = res.data?.allLeads ?? [];
        setAllLeads(leads);

        const isHP = (lead) =>
          Array.isArray(lead?.service) &&
          lead.service.some((s) => normalize(s?.category) === "house painting");
        const isDC = (lead) =>
          Array.isArray(lead?.service) &&
          lead.service.some((s) => normalize(s?.category) === "deep cleaning");

        const housePainting = leads.filter(isHP);
        const deepCleaning = leads.filter(isDC);

        setHousePaintingLeads(housePainting.length);
        setDeepCleaningLeads(deepCleaning.length);

        const sumGsv = (arr) =>
          arr.reduce(
            (sum, lead) =>
              sum +
              (lead?.service?.reduce(
                (s, srv) =>
                  s + (Number(srv?.price) || 0) * (Number(srv?.quantity) || 1),
                0
              ) || 0),
            0
          );

        const hpGsv = sumGsv(housePainting);
        const dcGsv = sumGsv(deepCleaning);

        const { totalAmount: hpAmount, totalProjects: hpProjects } =
          computeTotals(housePainting);
        setAvgGsvHousePainting(
          hpProjects > 0 ? (hpAmount / hpProjects) * 100 : 0
        );

        // For deep cleaning
        const { totalAmount: dcAmount, totalProjects: dcProjects } =
          computeTotals(deepCleaning);
        setAvgGsvDeepCleaning(
          dcProjects > 0 ? (dcAmount / dcProjects) * 100 : 0
        );

        const hpAccepted = housePainting.filter(
          (l) => l?.assignedProfessional?.acceptedDate
        ).length;
        const hpStarted = housePainting.filter(
          (l) => l?.assignedProfessional?.startedDate
        ).length;
        setStartedHP(hpStarted);

        const hpCancelled = housePainting.filter(
          (l) => normalize(l?.bookingDetails?.status) === "customer cancelled"
        ).length;

        const dcAccepted = deepCleaning.filter(
          (l) => l?.assignedProfessional?.acceptedDate
        ).length;
        const dcStarted = deepCleaning.filter(
          (l) => l?.assignedProfessional?.startedDate
        ).length;
        const dcCancelled = deepCleaning.filter(
          (l) => normalize(l?.bookingDetails?.status) === "customer cancelled"
        ).length;

        setAcceptedHP(hpAccepted);
        setCancelledHP(hpCancelled);
        setSurveyPctHousePainting(
          hpAccepted ? (hpStarted / hpAccepted) * 100 : 0
        );
        setCancellationPctHousePainting(
          hpAccepted ? (hpCancelled / hpAccepted) * 100 : 0
        );

        setAcceptedDC(dcAccepted);
        setCancelledDC(dcCancelled);
        setSurveyPctDeepCleaning(
          dcAccepted ? (dcStarted / dcAccepted) * 100 : 0
        );
        setCancellationPctDeepCleaning(
          dcAccepted ? (dcCancelled / dcAccepted) * 100 : 0
        );

        // Compute vendor data
        const computeVendorData = (leads, category) => {
          const vendorMap = {};

          leads.forEach((lead) => {
            const prof = lead.assignedProfessional;
            if (prof?.professionalId) {
              const id = prof.professionalId;
              if (!vendorMap[id]) {
                vendorMap[id] = {
                  name: prof.name || "Unknown",
                  professionalId: id,
                  totalLeads: 0,
                  jobsStarted: 0,
                  responded: 0,
                  surveys: 0,
                  hirings: 0,
                  cancelled: 0,
                };
              }

              // Increment total leads
              vendorMap[id].totalLeads += 1;

              // If vendor responded (accepted lead)
              if (prof.acceptedDate) {
                vendorMap[id].responded += 1;
              }

              // If vendor actually started work = count as survey
              if (prof.startedDate) {
                vendorMap[id].jobsStarted += 1;
                vendorMap[id].surveys += 1;
              }

              // If cancelled
              if (
                normalize(lead?.bookingDetails?.status) === "customer cancelled"
              ) {
                vendorMap[id].cancelled += 1;
              }

              // (Optional: hiring = confirmed jobs)
              if (normalize(lead?.bookingDetails?.status) === "confirmed") {
                vendorMap[id].hirings += 1;
              }
            }
          });

          return Object.values(vendorMap).map((vendor) => ({
            ...vendor,
            responseRate: vendor.totalLeads
              ? `${((vendor.responded / vendor.totalLeads) * 100).toFixed(0)}%`
              : "0%",
            surveyRate: vendor.responded
              ? `${((vendor.surveys / vendor.responded) * 100).toFixed(0)}%`
              : "0%",
            hiringRate: vendor.responded
              ? `${((vendor.hirings / vendor.responded) * 100).toFixed(0)}%`
              : "0%",
            cancellationRate: vendor.responded
              ? `${((vendor.cancelled / vendor.responded) * 100).toFixed(0)}%`
              : "0%",
            gsv: "₹0", // you can compute GSV per vendor if needed
            rating: "0 ★", // hook up actual ratings later
            strikes: 0,
          }));
        };

        setHousePaintingVendors(
          computeVendorData(housePainting, "housePainting")
        );
        setDeepCleaningVendors(computeVendorData(deepCleaning, "deepCleaning"));

        console.log("Deep Cleaning Metrics:", {
          totalDeepCleaningLeads: deepCleaning.length,
          acceptedDC: dcAccepted,
          cancelledDC: dcCancelled,
          cancellationPctDeepCleaning: dcAccepted
            ? (dcCancelled / dcAccepted) * 100
            : 0,
          deepCleaningVendors: computeVendorData(deepCleaning, "deepCleaning"),
        });

        console.log("House Painting Metrics:", {
          totalHousePaintingLeads: housePainting.length,
          acceptedHP: hpAccepted,
          cancelledHP: hpCancelled,
          cancellationPctHousePainting: hpAccepted
            ? (hpCancelled / hpAccepted) * 100
            : 0,
          housePaintingVendors: computeVendorData(
            housePainting,
            "housePainting"
          ),
        });
      } catch (err) {
        console.error("Error fetching leads:", err);
      }
    };

    fetchLeads();
  }, []);

  const fetchKPI = async (service) => {
    try {
      const apiService = serviceMap[service];

      const res = await axios.get(`${BASE_URL}/kpi-parameters/${apiService}`);

      setKpiValues(res.data.data.metrics);
      setIsEditMode(false);
    } catch (err) {
      console.error("Error fetching KPI:", err);
    }
  };

  const saveKPI = async () => {
    try {
      const apiService = serviceMap[selectedService];

      const res = await axios.put(`${BASE_URL}/kpi-parameters/${apiService}`, {
        metrics: kpiValues,
      });

      setIsEditMode(false);
      fetchKPI(); // Refresh UI
    } catch (err) {
      console.error("KPI Update Error:", err);
      alert("Failed to update KPI");
    }
  };

  const getFilteredMetricKeys = () => {
    if (selectedService === "House Painters") {
      return [
        "surveyPercentage",
        "hiringPercentage",
        "avgGSV",
        "rating",
        "strikes",
      ];
    } else {
      return [
        "responsePercentage",
        "cancellationPercentage",
        "rating",
        "strikes",
      ];
    }
  };

  return (
    <div
      className="container py-4"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 style={{ fontWeight: "bold" }}>Performance Dashboard</h5>
        <div className="d-flex gap-2">
          <Form.Select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ height: "32px", fontSize: "13px" }}
          >
            <option>All Cities</option>
            <option>Bengaluru</option>
            <option>Mumbai</option>
          </Form.Select>
          <Form.Select
            // value={city}
            // onChange={(e) => setCity(e.target.value)}
            style={{ height: "32px", fontSize: "13px" }}
          >
            <option>Select Period</option>
            <option>All Time</option>
            <option>This Month</option>
            <option>Last Month</option>
          </Form.Select>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSettingsModal(true);
              fetchKPI(selectedService);
            }}
            style={{ whiteSpace: "nowrap", fontSize: "13px" }}
          >
            <FaCog className="me-2" /> Settings
          </Button>
        </div>
      </div>

      {/* House Painting Performance */}
      <div className="container py-4">
        <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
          🏠 House Painting Performance
        </h6>
        <div
          className="d-flex gap-3 align-items-center mb-3"
          style={{ marginTop: "2%" }}
        >
          <div className="d-flex flex-column">
            <div
              className="border rounded-pill p-2 px-3 mb-2"
              style={{ color: "#2b4eff", fontWeight: "bold", fontSize: "14px" }}
            >
              Total Leads: {housePaintingLeads}
            </div>
            <div
              className="border rounded-pill p-2 px-3 mb-2"
              style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
            >
              Avg. GSV: ₹{avgGsvHousePainting.toFixed(2)}
            </div>
            <div
              className="border rounded-pill p-2 px-3"
              style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
            >
              Rating: 0 ★
            </div>
          </div>
          <div
            className="border rounded p-3 text-warning text-center shadow-sm"
            style={{
              width: "25%",
              color: "#e6a100",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            <span style={{ fontSize: "30px" }}>
              {surveyPctHousePainting.toFixed(0)}%
            </span>
            <br />
            <span>Survey({startedHP})</span>
          </div>
          <div
            className="border rounded p-3 text-danger text-center shadow-sm"
            style={{
              width: "25%",
              color: "#dc3545",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            <span style={{ fontSize: "30px" }}>0%</span> <br />{" "}
            <span>Hiring(0)</span>
          </div>
        </div>
      </div>

      {/* Deep Cleaning Performance */}
      <div className="container py-4">
        <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
          🧹 Deep Cleaning Performance
        </h6>
        <div
          className="d-flex gap-3 align-items-center mb-3"
          style={{ marginTop: "2%" }}
        >
          <div className="d-flex flex-column">
            <div
              className="border rounded-pill p-2 px-3 mb-2"
              style={{ color: "#d97706", fontWeight: "bold", fontSize: "14px" }}
            >
              Total Leads: {deepCleaningLeads}
            </div>
            <div
              className="border rounded-pill p-2 px-3 mb-2"
              style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
            >
              Avg. GSV: ₹{avgGsvDeepCleaning.toFixed(2)}
            </div>
            <div
              className="border rounded-pill p-2 px-3"
              style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
            >
              Rating: 0 ★
            </div>
          </div>
          <div
            className="border rounded p-3 text-success text-center shadow-sm"
            style={{
              width: "25%",
              color: "#198754",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            <span style={{ fontSize: "30px" }}>
              {deepCleaningLeads > 0
                ? ((acceptedDC / deepCleaningLeads) * 100).toFixed(0)
                : 0}
              %
            </span>
            <br />
            <span>Response({acceptedDC})</span>
          </div>
          <div
            className="border rounded p-3 text-warning text-center shadow-sm"
            style={{
              width: "25%",
              color: "#e6a100",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            <span style={{ fontSize: "30px" }}>
              {cancellationPctDeepCleaning.toFixed(0)}%
            </span>
            <br />
            <span>Cancellation({cancelledDC})</span>
          </div>
        </div>
      </div>

      {/* Vendor Performance Table */}
      <div>
        <h5 style={{ fontSize: "16px" }}>Vendor Performance</h5>
        <div className="mb-3">
          <Button
            variant={
              selectedCategory === "housePainting" ? "danger" : "secondary"
            }
            onClick={() => setSelectedCategory("housePainting")}
            className="me-2"
            style={{ fontSize: "12px" }}
          >
            House Painting Performance
          </Button>
          <Button
            variant={
              selectedCategory === "deepCleaning" ? "danger" : "secondary"
            }
            onClick={() => setSelectedCategory("deepCleaning")}
            style={{ fontSize: "12px" }}
          >
            Deep Cleaning Performance
          </Button>
        </div>

        {selectedCategory === "housePainting" ? (
          <Table striped bordered hover>
            <thead>
              <tr style={{ fontSize: "12px", textAlign: "center" }}>
                <th>Vendor Name</th>
                <th>Total Leads</th>
                <th>Jobs Started</th>
                <th>Leads Responded</th>
                <th>Lead Response %</th>
                <th>Surveys</th>
                <th>Survey %</th>
                <th>Hirings</th>
                <th>Hiring %</th>
                <th>GSV</th>
                <th>Projects Completed</th>
                <th>Ratings</th>
                <th>Strikes</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "12px", textAlign: "center" }}>
              {housePaintingVendors.map((vendor, index) => (
                <tr key={index}>
                  <td>{vendor.name}</td>
                  <td>{vendor.totalLeads}</td>
                  <td>{vendor.jobsStarted}</td>
                  <td>{vendor.responded}</td>
                  <td>{vendor.responseRate}</td>
                  <td>{vendor.surveys}</td>
                  <td>{vendor.surveyRate}</td>
                  <td>{vendor.hirings}</td>
                  <td>{vendor.hiringRate}</td>
                  <td>{vendor.gsv}</td>
                  <td>{vendor.projects}</td>
                  <td>{vendor.rating}</td>
                  <td>{vendor.strikes}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr style={{ fontSize: "12px", textAlign: "center" }}>
                <th>Vendor Name</th>
                <th>Total Leads</th>
                <th>Jobs Started</th>
                <th>Leads Responded</th>
                <th>Lead Response %</th>
                <th>Projects Completed</th>
                <th>Completion %</th>
                <th>Cancelled</th>
                <th>Cancellation %</th>
                <th>Ratings</th>
                <th>Strikes</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "12px", textAlign: "center" }}>
              {deepCleaningVendors.map((vendor, index) => (
                <tr key={index}>
                  <td>{vendor.name}</td>
                  <td>{vendor.totalLeads}</td>
                  <td>{vendor.jobsStarted}</td>
                  <td>{vendor.responded}</td>
                  <td>{vendor.responseRate}</td>
                  <td>{vendor.projectsCompleted}</td>
                  <td>{vendor.completionRate}</td>
                  <td>{vendor.cancelled}</td>
                  <td>{vendor.cancellationRate}</td>
                  <td>{vendor.rating}</td>
                  <td>{vendor.strikes}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* KPI Parameters Modal */}
      <Modal
        show={showSettingsModal}
        onHide={() => setShowSettingsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px" }}>
            Set KPI Parameters for {selectedService}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mt-3">
            <Form.Check
              type="radio"
              name="kpiType"
              label="House Painters"
              checked={selectedService === "House Painters"}
              onChange={() => setSelectedService("House Painters")}
            />
            <Form.Check
              type="radio"
              name="kpiType"
              label="Deep Cleaning"
              checked={selectedService === "Deep Cleaning"}
              onChange={() => setSelectedService("Deep Cleaning")}
            />
          </div>
          <Table bordered className="mt-3 text-center">
            <thead>
              <tr>
                <th>Metrics</th>
                <th style={{ color: "red" }}>Red</th>
                <th style={{ color: "orange" }}>Orange</th>
                <th style={{ color: "yellow" }}>Yellow</th>
                <th style={{ color: "green" }}>Green</th>
              </tr>
            </thead>

            <tbody>
              {getFilteredMetricKeys().map((metricKey) => {
                const bands = kpiValues?.[metricKey] || {
                  red: 0,
                  orange: 0,
                  yellow: 0,
                  green: 0,
                };

                return (
                  <tr key={metricKey}>
                    <td>{metricLabels[metricKey]}</td>

                    {["red", "orange", "yellow", "green"].map((color) => (
                      <td key={color}>
                        {isEditMode ? (
                          <input
                            type="number"
                            className="form-control"
                            style={{ width: "80px", fontSize: "12px" }}
                            value={bands[color]}
                            onChange={(e) => {
                              const updated = { ...kpiValues };
                              updated[metricKey] = updated[metricKey] || {};
                              updated[metricKey][color] = Number(
                                e.target.value
                              );
                              setKpiValues(updated);
                            }}
                          />
                        ) : metricKey === "avgGSV" ? (
                          // SHOW ₹ ONLY IN VIEW MODE
                          `₹${bands[color]}`
                        ) : (
                          bands[color]
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          {!isEditMode ? (
            <Button variant="primary" onClick={() => setIsEditMode(true)}>
              Edit
            </Button>
          ) : (
            <Button variant="success" onClick={saveKPI}>
              Save
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PerformanceDashboard;
