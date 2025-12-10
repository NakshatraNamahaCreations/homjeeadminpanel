import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { BASE_URL } from "../utils/config";
import { getKPI, updateRanges } from "../utils/kpiApi";
import { IoMdSettings } from "react-icons/io";

/* ---------------------------
  Helper functions & constants
--------------------------- */
const serviceMap = {
  "House Painters": "house_painting",
  "Deep Cleaning": "deep_cleaning",
};

const metricLabels = {
  surveyPercentage: "Survey %",
  hiringPercentage: "Hiring %",
  avgGSV: "Avg. GSV",
  rating: "Rating",
  strikes: "Strikes",
  responsePercentage: "Response %",
  cancellationPercentage: "Cancellation %",
};

/* ---------------------------
  Component
--------------------------- */
const PerformanceDashboard = () => {
  // UI / Data states
  const [city, setCity] = useState("All Cities");
  const [period, setPeriod] = useState("All Time");
  const [selectedService, setSelectedService] = useState("House Painters");

  const [allLeads, setAllLeads] = useState([]);

  // KPI Ranges for both services
  const [kpiRanges, setKpiRanges] = useState({
    "House Painters": {},
    "Deep Cleaning": {},
  });
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [selectedRangeService, setSelectedRangeService] =
    useState("House Painters");

  // Vendor / Lead related states
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

  const [isEditMode, setIsEditMode] = useState(false);

  // Add these states near your other state declarations
  const [ratingHousePainting, setRatingHousePainting] = useState(0);
  const [strikesHousePainting, setStrikesHousePainting] = useState(0);
  const [ratingDeepCleaning, setRatingDeepCleaning] = useState(0);
  const [strikesDeepCleaning, setStrikesDeepCleaning] = useState(0);

  // CORRECTED COLOR RANGE CHECKER
  const getRangeColor = (serviceName, metricKey, rawValue) => {
    const ranges = kpiRanges[serviceName];
    if (!ranges || !ranges[metricKey]) return "#000000";

    const value = parseFloat(rawValue);
    if (Number.isNaN(value)) return "#000000";

    const { a, b, c, d, e } = ranges[metricKey];

    // CORRECTED RANGE LOGIC:
    // a <= value < b = Red
    // b <= value < c = Orange
    // c <= value < d = Yellow
    // d <= value = Green
    if (value >= a && value < b) return "#dc3545"; // Red
    if (value >= b && value < c) return "#ff8c00"; // Orange
    if (value >= c && value < d) return "#d4aa00"; // Yellow
    if (value >= d) return "#198754"; // Green

    return "#000000";
  };

  // Update range value function
  const updateRangeValue = (metricKey, field, value) => {
    const numValue = value === "" ? "" : parseFloat(value);
    setKpiRanges((prev) => ({
      ...prev,
      [selectedRangeService]: {
        ...prev[selectedRangeService],
        [metricKey]: {
          ...prev[selectedRangeService]?.[metricKey],
          [field]: numValue,
        },
      },
    }));
  };

  /* ---------------------------
    Load Performance Data from API
  --------------------------- */
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const cityParam = city === "All Cities" ? "All" : city;
        const periodParam =
          period === "All Time"
            ? "all"
            : period === "This Month"
            ? "this_month"
            : "last_month";

        const res = await axios.get(
          `http://localhost:9000/api/bookings/overall?city=${cityParam}&period=${periodParam}`
        );
        const data = res.data;

        // Update overall performance
        setHousePaintingLeads(data.housePainting.totalLeads);
        setSurveyPctHousePainting(data.housePainting.surveyPercentage);
        setAvgGsvHousePainting(data.housePainting.averageGsv);
        setCancellationPctHousePainting(
          data.housePainting.cancellationPercentage || 0
        );
        setAcceptedHP(data.housePainting.hiringPercentage);

        setDeepCleaningLeads(data.deepCleaning.totalLeads);
        setSurveyPctDeepCleaning(data.deepCleaning.responsePercentage || 0);
        setCancellationPctDeepCleaning(
          data.deepCleaning.cancellationPercentage
        );
        setAvgGsvDeepCleaning(data.deepCleaning.averageGsv);
        setAcceptedDC(data.deepCleaning.responsePercentage);

        // Set counts for display
        setStartedHP(
          Math.round(
            (data.housePainting.surveyPercentage / 100) *
              data.housePainting.totalLeads
          )
        );
        setCancelledDC(
          Math.round(
            (data.deepCleaning.cancellationPercentage / 100) *
              data.deepCleaning.totalLeads
          )
        );

        // Inside your fetchPerformanceData function, after setting other states:

        // Update rating data
        setRatingHousePainting(data.housePainting.averageRating || 0);
        setStrikesHousePainting(data.housePainting.strikes || 0);
        setRatingDeepCleaning(data.deepCleaning.averageRating || 0);
        setStrikesDeepCleaning(data.deepCleaning.strikes || 0);

        // Vendors
        setHousePaintingVendors(
          (data.vendors.housePainting || []).map((v) => ({
            name: v.name,
            totalLeads: v.totalLeads,
            responded: v.responded,
            jobsStarted: v.survey,
            hirings: v.hired,
            cancelled: v.cancelled,
            responseRate: `${v.responseRate}%`,
            surveyRate: `${v.surveyRate}%`,
            hiringRate: `${v.hiringRate}%`,
            cancellationRate: `${v.cancellationRate}%`,
            gsv: `₹${v.gsv}`,
            rating: `${v.avgRating} ★`,
            strikes: v.strikes,
          }))
        );
        setDeepCleaningVendors(
          (data.vendors.deepCleaning || []).map((v) => ({
            name: v.name,
            totalLeads: v.totalLeads,
            responded: v.responded,
            jobsStarted: v.survey,
            hirings: v.hired,
            cancelled: v.cancelled,
            responseRate: `${v.responseRate}%`,
            projectsCompleted: v.hired,
            completionRate: `${v.surveyRate}%`,
            cancellationRate: `${v.cancellationRate}%`,
            gsv: `₹${v.gsv}`,
            rating: `${v.avgRating} ★`,
            strikes: v.strikes,
          }))
        );
      } catch (err) {
        console.error("Error fetching performance data:", err);
      }
    };

    fetchPerformanceData();
  }, [city, period]);

  /* ---------------------------
    Load KPI Ranges for both services on component mount
  --------------------------- */
  useEffect(() => {
    const loadAllKPIRanges = async () => {
      try {
        const [hpRes, dcRes] = await Promise.all([
          getKPI("house_painting"),
          getKPI("deep_cleaning"),
        ]);

        setKpiRanges({
          "House Painters": hpRes?.data?.data?.ranges || {},
          "Deep Cleaning": dcRes?.data?.data?.ranges || {},
        });
      } catch (e) {
        console.error("Error loading KPI ranges", e);
      }
    };

    loadAllKPIRanges();
  }, []);

  /* ---------------------------
    Load ranges for modal when service changes
  --------------------------- */
  const fetchRangesFor = async (serviceName) => {
    try {
      const serviceType = serviceMap[serviceName];
      const res = await getKPI(serviceType);
      setKpiRanges((prev) => ({
        ...prev,
        [serviceName]: res?.data?.data?.ranges || {},
      }));
    } catch (e) {
      console.error("Error loading ranges", e);
    }
  };

  /* ---------------------------
    Save Ranges
  --------------------------- */
  const saveRanges = async () => {
    try {
      const payload = {};
      const currentRanges = kpiRanges[selectedRangeService] || {};

      for (const metricKey of Object.keys(currentRanges)) {
        const r = currentRanges[metricKey] || {};
        const { a, b, c, d, e } = r;
        const values = [a, b, c, d, e];

        const allZero = values.every((v) => v === 0);
        if (allZero) continue;

        const allFilled = values.every(
          (v) => typeof v === "number" && !Number.isNaN(v)
        );
        if (!allFilled) {
          alert(
            `${metricLabels[metricKey]} is incomplete. Fill all a,b,c,d,e or leave all empty.`
          );
          return;
        }

        if (!(a < b && b < c && c < d && d < e)) {
          alert(
            `Range for ${metricLabels[metricKey]} must satisfy a < b < c < d < e`
          );
          return;
        }

        payload[metricKey] = { a, b, c, d, e };
      }

      if (Object.keys(payload).length === 0) {
        alert("Nothing to update.");
        return;
      }

      const serviceType = serviceMap[selectedRangeService];
      await updateRanges(serviceType, payload);

      alert("Ranges updated successfully!");
      setShowRangeModal(false);
      setIsEditMode(false);
      fetchRangesFor(selectedRangeService);
    } catch (err) {
      console.error("Save ranges error:", err);
    }
  };

  /* ---------------------------
    RANGE UI METRICS
  --------------------------- */
  const getRangeMetricKeys = (serviceName) => {
    if (serviceName === "House Painters") {
      return [
        "surveyPercentage",
        "hiringPercentage",
        "avgGSV",
        "rating",
        "strikes",
      ];
    }
    return [
      "responsePercentage",
      "cancellationPercentage",
      "avgGSV",
      "rating",
      "strikes",
    ];
  };

  /* ---------------------------
    RENDER
  --------------------------- */
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
            <option>Pune</option>
          </Form.Select>

          <Form.Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ height: "32px", fontSize: "13px" }}
          >
            <option>All Time</option>
            <option>This Month</option>
            <option>Last Month</option>
          </Form.Select>

          <Button
            variant="secondary"
            onClick={() => {
              setShowRangeModal(true);
              setSelectedRangeService("House Painters");
              fetchRangesFor("House Painters");
            }}
            style={{ whiteSpace: "nowrap", fontSize: "13px" }}
          >
            <IoMdSettings /> Setting
          </Button>
        </div>
      </div>

      {/* House Painting Performance */}
      <div className="container py-4">
        <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
          🏠 House Painting Performance
        </h6>
        <div className="d-flex gap-3 align-items-center mb-3">
          <div className="d-flex flex-column">
            <div
              className="border rounded-pill p-2 px-3 mb-2"
              style={{ fontWeight: "bold", fontSize: "14px" }}
            >
              <span style={{ color: "#2b4eff" }}>
                Total Leads: {housePaintingLeads}
              </span>
            </div>
            <div
              className="border rounded-pill p-2 px-3 mb-2"
              style={{ fontWeight: "bold", fontSize: "14px" }}
            >
              <span
                style={{
                  color: getRangeColor(
                    "House Painters",
                    "avgGSV",
                    avgGsvHousePainting
                  ),
                }}
              >
                Avg. GSV: ₹{avgGsvHousePainting.toFixed(2)}
              </span>
            </div>
            <div
              className="border rounded-pill p-2 px-3"
              style={{ fontWeight: "bold", fontSize: "14px" }}
            >
              <span
                style={{
                  color: getRangeColor(
                    "House Painters",
                    "rating",
                    ratingHousePainting
                  ),
                }}
              >
                Rating: {ratingHousePainting.toFixed(1)} ★
              </span>
            </div>

            <div
              className="border rounded-pill p-2 px-3"
              style={{ fontWeight: "bold", fontSize: "14px" }}
            >
              <span
                style={{
                  color: getRangeColor(
                    "House Painters",
                    "strikes",
                    strikesHousePainting
                  ),
                }}
              >
                Strikes: {strikesHousePainting}
              </span>
            </div>
          </div>

          <div
            className="border rounded p-3 text-center shadow-sm"
            style={{
              width: "25%",
              fontWeight: "bold",
              fontSize: "12px",
              borderColor: "#e6a100 !important",
            }}
          >
            <span
              style={{
                fontSize: "30px",
                color: getRangeColor(
                  "House Painters",
                  "surveyPercentage",
                  surveyPctHousePainting
                ),
              }}
            >
              {surveyPctHousePainting.toFixed(0)}%
            </span>
            <br />
            <span style={{ color: "#6c757d" }}>Survey({startedHP})</span>
          </div>

          <div
            className="border rounded p-3 text-center shadow-sm"
            style={{
              width: "25%",
              fontWeight: "bold",
              fontSize: "12px",
              borderColor: "#dc3545 !important",
            }}
          >
            <span
              style={{
                fontSize: "30px",
                color: getRangeColor(
                  "House Painters",
                  "hiringPercentage",
                  acceptedHP
                ),
              }}
            >
              {acceptedHP.toFixed(0)}%
            </span>
            <br />
            <span style={{ color: "#6c757d" }}>
              Hiring({Math.round((acceptedHP / 100) * housePaintingLeads)})
            </span>
          </div>
        </div>
      </div>

      {/* Deep Cleaning Performance */}
      <div className="container py-4">
        <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
          🧹 Deep Cleaning Performance
        </h6>
        <div className="d-flex gap-3 align-items-center mb-3">
          <div className="d-flex flex-column">
            <div
              className="border rounded-pill p-2 px-3 mb-2"
              style={{ fontWeight: "bold", fontSize: "14px" }}
            >
              <span style={{ color: "#d97706" }}>
                Total Leads: {deepCleaningLeads}
              </span>
            </div>
            <div
              className="border rounded-pill p-2 px-3 mb-2"
              style={{ fontWeight: "bold", fontSize: "14px" }}
            >
              <span
                style={{
                  color: getRangeColor(
                    "Deep Cleaning",
                    "avgGSV",
                    avgGsvDeepCleaning
                  ),
                }}
              >
                Avg. GSV: ₹{avgGsvDeepCleaning.toFixed(2)}
              </span>
            </div>
            <div
              className="border rounded-pill p-2 px-3"
              style={{ fontWeight: "bold", fontSize: "14px" }}
            >
              <span
                style={{
                  color: getRangeColor(
                    "Deep Cleaning",
                    "rating",
                    ratingDeepCleaning
                  ),
                }}
              >
                Rating: {ratingDeepCleaning.toFixed(1)} ★
              </span>
            </div>
          
            <div
              className="border rounded-pill p-2 px-3"
              style={{ fontWeight: "bold", fontSize: "14px" }}
            >
              <span
                style={{
                  color: getRangeColor(
                    "Deep Cleaning",
                    "strikes",
                    strikesDeepCleaning
                  ),
                }}
              >
                Strikes: {strikesDeepCleaning}
              </span>
            </div>
          </div>

          <div
            className="border rounded p-3 text-center shadow-sm"
            style={{
              width: "25%",
              fontWeight: "bold",
              fontSize: "12px",
              borderColor: "#198754 !important",
            }}
          >
            <span
              style={{
                fontSize: "30px",
                color: getRangeColor(
                  "Deep Cleaning",
                  "responsePercentage",
                  surveyPctDeepCleaning
                ),
              }}
            >
              {surveyPctDeepCleaning.toFixed(0)}%
            </span>
            <br />
            <span style={{ color: "#6c757d" }}>
              Response(
              {Math.round((surveyPctDeepCleaning / 100) * deepCleaningLeads)})
            </span>
          </div>

          <div
            className="border rounded p-3 text-center shadow-sm"
            style={{
              width: "25%",
              fontWeight: "bold",
              fontSize: "12px",
              borderColor: "#e6a100 !important",
            }}
          >
            <span
              style={{
                fontSize: "30px",
                color: getRangeColor(
                  "Deep Cleaning",
                  "cancellationPercentage",
                  cancellationPctDeepCleaning
                ),
              }}
            >
              {cancellationPctDeepCleaning.toFixed(0)}%
            </span>
            <br />
            <span style={{ color: "#6c757d" }}>
              Cancellation(
              {Math.round(
                (cancellationPctDeepCleaning / 100) * deepCleaningLeads
              )}
              )
            </span>
          </div>
        </div>
      </div>

      {/* Vendor Performance Tables */}
      <div>
        <h5 style={{ fontSize: "16px" }}>Vendor Performance</h5>
        <div className="mb-3">
          <Button
            variant={
              selectedService === "House Painters" ? "danger" : "secondary"
            }
            onClick={() => setSelectedService("House Painters")}
            className="me-2"
            style={{ fontSize: "12px" }}
          >
            House Painting Performance
          </Button>
          <Button
            variant={
              selectedService === "Deep Cleaning" ? "danger" : "secondary"
            }
            onClick={() => setSelectedService("Deep Cleaning")}
            style={{ fontSize: "12px" }}
          >
            Deep Cleaning Performance
          </Button>
        </div>

        {selectedService === "House Painters" ? (
          <Table striped bordered hover>
            <thead>
              <tr style={{ fontSize: "12px", textAlign: "center" }}>
                <th>Vendor Name</th>
                <th>Total Leads</th>
                <th>Jobs Started</th>
                <th>Leads Responded</th>
                <th>Response %</th>
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

      {/* RANGE MODAL */}
      <Modal
        show={showRangeModal}
        onHide={() => {
          setShowRangeModal(false);
          setIsEditMode(false);
        }}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Set Ranges - {selectedRangeService}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-3">
            <Form.Check
              inline
              label="House Painters"
              type="radio"
              disabled={isEditMode}
              checked={selectedRangeService === "House Painters"}
              onChange={() => {
                setSelectedRangeService("House Painters");
                fetchRangesFor("House Painters");
              }}
            />
            <Form.Check
              inline
              label="Deep Cleaning"
              type="radio"
              disabled={isEditMode}
              checked={selectedRangeService === "Deep Cleaning"}
              onChange={() => {
                setSelectedRangeService("Deep Cleaning");
                fetchRangesFor("Deep Cleaning");
              }}
            />
          </div>

          <div style={styles.rangeColorLabelRow}>
            <div></div>
            <div></div>
            <div style={{ ...styles.rangeLabel, ...styles.redText }}>Red</div>
            <div></div>
            <div style={{ ...styles.rangeLabel, ...styles.orangeText }}>
              Orange
            </div>
            <div></div>
            <div style={{ ...styles.rangeLabel, ...styles.yellowText }}>
              Yellow
            </div>
            <div></div>
            <div style={{ ...styles.rangeLabel, ...styles.greenText }}>
              Green
            </div>
            <div></div>
          </div>

          {getRangeMetricKeys(selectedRangeService).map((metricKey) => {
            const range = kpiRanges[selectedRangeService]?.[metricKey] || {};
            return (
              <div key={metricKey} style={styles.rangeInputRow}>
                <div>{metricLabels[metricKey]}</div>
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "80px" }}
                  value={range?.a ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "a", e.target.value)
                  }
                />
                <div style={{ ...styles.vLine, ...styles.redLine }} />
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "80px" }}
                  value={range?.b ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "b", e.target.value)
                  }
                />
                <div style={{ ...styles.vLine, ...styles.orangeLine }} />
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "80px" }}
                  value={range?.c ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "c", e.target.value)
                  }
                />
                <div style={{ ...styles.vLine, ...styles.yellowLine }} />
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "80px" }}
                  value={range?.d ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "d", e.target.value)
                  }
                />
                <div style={{ ...styles.vLine, ...styles.greenLine }} />
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "80px" }}
                  value={range?.e ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "e", e.target.value)
                  }
                />
              </div>
            );
          })}
        </Modal.Body>

        <Modal.Footer>
          {!isEditMode ? (
            <>
              <Button variant="primary" onClick={() => setIsEditMode(true)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRangeModal(false);
                  setIsEditMode(false);
                }}
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <Button variant="success" onClick={saveRanges}>
                Save Ranges
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditMode(false);
                  fetchRangesFor(selectedRangeService);
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PerformanceDashboard;

const styles = {
  rangeColorLabelRow: {
    display: "grid",
    gridTemplateColumns: "120px repeat(4, 80px 10px) 80px",
    alignItems: "center",
    marginBottom: "5px",
    paddingLeft: "3px",
  },
  rangeLabel: {
    textAlign: "center",
    fontWeight: 600,
    fontSize: "14px",
    transform: "translateY(-5px)",
  },
  redText: { color: "#dc3545" },
  orangeText: { color: "#ff8c00" },
  yellowText: { color: "#d4aa00" },
  greenText: { color: "#198754" },
  rangeInputRow: {
    display: "grid",
    gridTemplateColumns: "120px repeat(4, 80px 10px) 80px",
    alignItems: "center",
    gap: "5px",
    marginBottom: "10px",
  },
  vLine: {
    width: "2px",
    height: "38px",
    margin: "0 auto",
  },
  redLine: { backgroundColor: "#dc3545" },
  orangeLine: { backgroundColor: "#ff8c00" },
  yellowLine: { backgroundColor: "#d4aa00" },
  greenLine: { backgroundColor: "#198754" },
};

// // src/components/PerformanceDashboard.jsx
// import React, { useEffect, useState } from "react";
// import { Table, Button, Form, Modal } from "react-bootstrap";
// import { FaCog } from "react-icons/fa";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";
// import { getKPI, updateRanges, updateMetrics } from "../utils/kpiApi";

// /* ---------------------------
//   Helper functions & constants
// --------------------------- */
// const serviceMap = {
//   "House Painters": "house_painting",
//   "Deep Cleaning": "deep_cleaning",
// };

// const metricLabels = {
//   surveyPercentage: "Survey %",
//   hiringPercentage: "Hiring %",
//   avgGSV: "Avg. GSV",
//   rating: "Rating",
//   strikes: "Strikes",
//   responsePercentage: "Response %",
//   cancellationPercentage: "Cancellation %",
// };

// function defaultKpiObject() {
//   return {
//     surveyPercentage: 0,
//     hiringPercentage: 0,
//     avgGSV: 0,
//     rating: 0,
//     strikes: 0,
//     responsePercentage: 0,
//     cancellationPercentage: 0,
//   };
// }

// /* validate metric value within range (a..e inclusive) */
// function isWithinRange(value, range) {
//   if (!range) return true;
//   if ([range.a, range.b, range.c, range.d, range.e].every((v) => v === 0))
//     return true;
//   return value >= range.a && value <= range.e;
// }

// /* ---------------------------
//   Component
// --------------------------- */
// const PerformanceDashboard = ({ show, onHide }) => {
//   // UI / Data states
//   const [city, setCity] = useState("All Cities");
//   const [selectedService, setSelectedService] = useState("House Painters");
//   const [showSettingsModal, setShowSettingsModal] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("housePainting");
//   const [allLeads, setAllLeads] = useState([]);

//   // KPIs & Ranges
//   const [kpiValues, setKpiValues] = useState({});

//   const [rangeValues, setRangeValues] = useState({});
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [showRangeModal, setShowRangeModal] = useState(false);
//   const [selectedRangeService, setSelectedRangeService] =
//     useState("House Painters");

//   // Vendor / Lead derived states (kept from your original component)
//   const [housePaintingLeads, setHousePaintingLeads] = useState(0);
//   const [deepCleaningLeads, setDeepCleaningLeads] = useState(0);
//   const [avgGsvHousePainting, setAvgGsvHousePainting] = useState(0);
//   const [avgGsvDeepCleaning, setAvgGsvDeepCleaning] = useState(0);
//   const [surveyPctHousePainting, setSurveyPctHousePainting] = useState(0);
//   const [surveyPctDeepCleaning, setSurveyPctDeepCleaning] = useState(0);
//   const [acceptedDC, setAcceptedDC] = useState(0);
//   const [cancelledDC, setCancelledDC] = useState(0);
//   const [cancellationPctDeepCleaning, setCancellationPctDeepCleaning] =
//     useState(0);
//   const [acceptedHP, setAcceptedHP] = useState(0);
//   const [cancelledHP, setCancelledHP] = useState(0);
//   const [cancellationPctHousePainting, setCancellationPctHousePainting] =
//     useState(0);
//   const [housePaintingVendors, setHousePaintingVendors] = useState([]);
//   const [deepCleaningVendors, setDeepCleaningVendors] = useState([]);
//   const [startedHP, setStartedHP] = useState(0);

//   /* ---------------------------
//     Load leads (unchanged logic)
//   --------------------------- */
//   useEffect(() => {
//     const fetchLeads = async () => {
//       try {
//         const res = await axios.get(
//           "https://homjee-backend.onrender.com/api/bookings/get-all-leads"
//         );
//         const leads = res.data?.allLeads ?? [];
//         setAllLeads(leads);

//         const normalize = (v) => (v ?? "").toString().trim().toLowerCase();
//         const isHP = (lead) =>
//           Array.isArray(lead?.service) &&
//           lead.service.some((s) => normalize(s?.category) === "house painting");
//         const isDC = (lead) =>
//           Array.isArray(lead?.service) &&
//           lead.service.some((s) => normalize(s?.category) === "deep cleaning");

//         const housePainting = leads.filter(isHP);
//         const deepCleaning = leads.filter(isDC);

//         setHousePaintingLeads(housePainting.length);
//         setDeepCleaningLeads(deepCleaning.length);

//         const computeTotals = (arr) => {
//           let totalAmount = 0;
//           let totalProjects = 0;
//           arr.forEach((lead) => {
//             if (Array.isArray(lead?.service)) {
//               lead.service.forEach((srv) => {
//                 const qty = Number(srv?.quantity) || 1;
//                 const price = Number(srv?.price) || 0;
//                 totalAmount += price * qty;
//                 totalProjects += qty;
//               });
//             }
//           });
//           return { totalAmount, totalProjects };
//         };

//         const { totalAmount: hpAmount, totalProjects: hpProjects } =
//           computeTotals(housePainting);
//         setAvgGsvHousePainting(
//           hpProjects > 0 ? (hpAmount / hpProjects) * 100 : 0
//         );

//         const { totalAmount: dcAmount, totalProjects: dcProjects } =
//           computeTotals(deepCleaning);
//         setAvgGsvDeepCleaning(
//           dcProjects > 0 ? (dcAmount / dcProjects) * 100 : 0
//         );

//         const hpAccepted = housePainting.filter(
//           (l) => l?.assignedProfessional?.acceptedDate
//         ).length;
//         const hpStarted = housePainting.filter(
//           (l) => l?.assignedProfessional?.startedDate
//         ).length;
//         setStartedHP(hpStarted);

//         const hpCancelled = housePainting.filter(
//           (l) => normalize(l?.bookingDetails?.status) === "customer cancelled"
//         ).length;

//         const dcAccepted = deepCleaning.filter(
//           (l) => l?.assignedProfessional?.acceptedDate
//         ).length;
//         const dcStarted = deepCleaning.filter(
//           (l) => l?.assignedProfessional?.startedDate
//         ).length;
//         const dcCancelled = deepCleaning.filter(
//           (l) => normalize(l?.bookingDetails?.status) === "customer cancelled"
//         ).length;

//         setAcceptedHP(hpAccepted);
//         setCancelledHP(hpCancelled);
//         setSurveyPctHousePainting(
//           hpAccepted ? (hpStarted / hpAccepted) * 100 : 0
//         );
//         setCancellationPctHousePainting(
//           hpAccepted ? (hpCancelled / hpAccepted) * 100 : 0
//         );

//         setAcceptedDC(dcAccepted);
//         setCancelledDC(dcCancelled);
//         setSurveyPctDeepCleaning(
//           dcAccepted ? (dcStarted / dcAccepted) * 100 : 0
//         );
//         setCancellationPctDeepCleaning(
//           dcAccepted ? (dcCancelled / dcAccepted) * 100 : 0
//         );

//         const computeVendorData = (leads) => {
//           const vendorMap = {};
//           leads.forEach((lead) => {
//             const prof = lead.assignedProfessional;
//             if (prof?.professionalId) {
//               const id = prof.professionalId;
//               if (!vendorMap[id]) {
//                 vendorMap[id] = {
//                   name: prof.name || "Unknown",
//                   professionalId: id,
//                   totalLeads: 0,
//                   jobsStarted: 0,
//                   responded: 0,
//                   surveys: 0,
//                   hirings: 0,
//                   cancelled: 0,
//                 };
//               }
//               vendorMap[id].totalLeads += 1;
//               if (prof.acceptedDate) vendorMap[id].responded += 1;
//               if (prof.startedDate) {
//                 vendorMap[id].jobsStarted += 1;
//                 vendorMap[id].surveys += 1;
//               }
//               if (
//                 normalize(lead?.bookingDetails?.status) === "customer cancelled"
//               )
//                 vendorMap[id].cancelled += 1;
//               if (normalize(lead?.bookingDetails?.status) === "confirmed")
//                 vendorMap[id].hirings += 1;
//             }
//           });

//           return Object.values(vendorMap).map((vendor) => ({
//             ...vendor,
//             responseRate: vendor.totalLeads
//               ? `${((vendor.responded / vendor.totalLeads) * 100).toFixed(0)}%`
//               : "0%",
//             surveyRate: vendor.responded
//               ? `${((vendor.surveys / vendor.responded) * 100).toFixed(0)}%`
//               : "0%",
//             hiringRate: vendor.responded
//               ? `${((vendor.hirings / vendor.responded) * 100).toFixed(0)}%`
//               : "0%",
//             cancellationRate: vendor.responded
//               ? `${((vendor.cancelled / vendor.responded) * 100).toFixed(0)}%`
//               : "0%",
//             gsv: "₹0",
//             rating: "0 ★",
//             strikes: 0,
//           }));
//         };

//         setHousePaintingVendors(computeVendorData(housePainting));
//         setDeepCleaningVendors(computeVendorData(deepCleaning));
//       } catch (err) {
//         console.error("Error fetching leads:", err);
//       }
//     };

//     fetchLeads();
//   }, []);

//   /* ---------------------------
//     KPI + Ranges API interactions
//   --------------------------- */
//   const fetchKPI = async (serviceName = selectedService) => {
//     try {
//       const service = serviceMap[serviceName];
//       const res = await getKPI(service);
//       const data = res.data?.data || {};
//       const formatted = {};
//       Object.keys(data.metrics || {}).forEach((key) => {
//         formatted[key] = {
//           red: data.metrics[key]?.red ?? 0,
//           orange: data.metrics[key]?.orange ?? 0,
//           yellow: data.metrics[key]?.yellow ?? 0,
//           green: data.metrics[key]?.green ?? 0,
//         };
//       });
//       setKpiValues(formatted);

//       setRangeValues(data.ranges || {});
//       setIsEditMode(false);
//     } catch (err) {
//       console.error("Error fetching KPI:", err);
//       alert("Failed to load KPI");
//     }
//   };

//   const onOpenSettings = async () => {
//     setShowSettingsModal(true);
//     await fetchKPI(selectedService);
//   };

//   /* ---------------------------
//     Save KPI (single value per metric)
//   --------------------------- */
//   const saveKPI = async () => {
//     try {
//       const service = serviceMap[selectedService];
//       const payload = {};

//       const original = await getKPI(service).then((r) => r.data.data.metrics);

//       Object.keys(kpiValues).forEach((metricKey) => {
//         const editedColors = kpiValues[metricKey];
//         const originalColors = original[metricKey];

//         Object.keys(editedColors).forEach((color) => {
//           const newVal = editedColors[color];
//           const oldVal = originalColors[color];

//           if (newVal === "" || newVal === undefined || newVal === null) return;

//           // if value actually changed → send this
//           if (Number(newVal) !== Number(oldVal)) {
//             if (!payload[metricKey]) payload[metricKey] = {};
//             payload[metricKey][color] = Number(newVal);
//           }
//         });
//       });

//       if (Object.keys(payload).length === 0) {
//         alert("No changes detected.");
//         return;
//       }

//       await updateMetrics(service, payload);

//       alert("KPI updated successfully!");

//       setIsEditMode(false);
//       fetchKPI(selectedService);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to update KPI");
//     }
//   };

//   /* ---------------------------
//     Save ranges (partial allowed; ignore all-zero metrics)
//   --------------------------- */
//   const saveRanges = async () => {
//     try {
//       const payload = {};

//       for (const metricKey of Object.keys(rangeValues || {})) {
//         const r = rangeValues[metricKey] || {};
//         const { a, b, c, d, e } = r;
//         const values = [a, b, c, d, e];

//         // Ignore metrics with all zeros (these are "unchanged" defaults)
//         const allZero = values.every((v) => v === 0);
//         if (allZero) continue;

//         // Ignore metrics with no values at all
//         const noneFilled = values.every(
//           (v) => v === undefined || v === null || v === ""
//         );
//         if (noneFilled) continue;

//         // If user partially filled this metric -> block
//         const allFilled = values.every(
//           (v) => typeof v === "number" && !Number.isNaN(v)
//         );
//         if (!allFilled) {
//           alert(
//             `${metricLabels[metricKey]} is incomplete. Fill all a,b,c,d,e or leave all empty.`
//           );
//           return;
//         }

//         // Validate ordering
//         if (!(a < b && b < c && c < d && d < e)) {
//           alert(
//             `Range for ${metricLabels[metricKey]} must satisfy a < b < c < d < e`
//           );
//           return;
//         }

//         payload[metricKey] = { a, b, c, d, e };
//       }

//       if (Object.keys(payload).length === 0) {
//         alert("Nothing to update.");
//         return;
//       }

//       const service = serviceMap[selectedRangeService];
//       await updateRanges(service, payload);

//       alert("Ranges updated!");
//       setShowRangeModal(false);
//       fetchKPI(selectedRangeService);
//     } catch (err) {
//       console.error("Save ranges error:", err);
//       alert("Failed to save ranges");
//     }
//   };

//   /* ---------------------------
//     UI helpers
//   --------------------------- */
//   const getFilteredMetricKeys = (service = selectedService) => {
//     if (service === "House Painters") {
//       return [
//         "surveyPercentage",
//         "hiringPercentage",
//         "avgGSV",
//         "rating",
//         "strikes",
//       ];
//     }
//     return [
//       "responsePercentage",
//       "cancellationPercentage",
//       "rating",
//       "strikes",
//     ];
//   };

//   /* ---------------------------
//     Render
//   --------------------------- */
//   return (
//     <div
//       className="container py-4"
//       style={{ fontFamily: "Poppins, sans-serif" }}
//     >
//       {/* Header */}
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h5 style={{ fontWeight: "bold" }}>Performance Dashboard</h5>
//         <div className="d-flex gap-2">
//           <Form.Select
//             value={city}
//             onChange={(e) => setCity(e.target.value)}
//             style={{ height: "32px", fontSize: "13px" }}
//           >
//             <option>All Cities</option>
//             <option>Bengaluru</option>
//             <option>Mumbai</option>
//           </Form.Select>

//           <Form.Select style={{ height: "32px", fontSize: "13px" }}>
//             <option>Select Period</option>
//             <option>All Time</option>
//             <option>This Month</option>
//             <option>Last Month</option>
//           </Form.Select>

//           <Button
//             variant="secondary"
//             onClick={onOpenSettings}
//             style={{ whiteSpace: "nowrap", fontSize: "13px" }}
//           >
//             <FaCog className="me-2" /> Settings
//           </Button>

//           <Button
//             variant="warning"
//             onClick={() => {
//               setShowRangeModal(true);
//               setSelectedRangeService("House Painters");
//               getKPI(serviceMap["House Painters"])
//                 .then((r) => setRangeValues(r?.data?.data?.ranges || {}))
//                 .catch((e) => console.error(e));
//             }}
//             style={{ whiteSpace: "nowrap", fontSize: "13px" }}
//           >
//             Set Ranges
//           </Button>
//         </div>
//       </div>

//       {/* House Painting Performance (UI unchanged) */}
//       <div className="container py-4">
//         <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
//           🏠 House Painting Performance
//         </h6>
//         <div
//           className="d-flex gap-3 align-items-center mb-3"
//           style={{ marginTop: "2%" }}
//         >
//           <div className="d-flex flex-column">
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ color: "#2b4eff", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Total Leads: {housePaintingLeads}
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Avg. GSV: ₹{avgGsvHousePainting.toFixed(2)}
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3"
//               style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Rating: 0 ★
//             </div>
//           </div>

//           <div
//             className="border rounded p-3 text-warning text-center shadow-sm"
//             style={{
//               width: "25%",
//               color: "#e6a100",
//               fontWeight: "bold",
//               fontSize: "12px",
//             }}
//           >
//             <span style={{ fontSize: "30px" }}>
//               {surveyPctHousePainting.toFixed(0)}%
//             </span>
//             <br />
//             <span>Survey({startedHP})</span>
//           </div>

//           <div
//             className="border rounded p-3 text-danger text-center shadow-sm"
//             style={{
//               width: "25%",
//               color: "#dc3545",
//               fontWeight: "bold",
//               fontSize: "12px",
//             }}
//           >
//             <span style={{ fontSize: "30px" }}>0%</span>
//             <br />
//             <span>Hiring(0)</span>
//           </div>
//         </div>
//       </div>

//       {/* Deep Cleaning Performance (UI unchanged) */}
//       <div className="container py-4">
//         <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
//           🧹 Deep Cleaning Performance
//         </h6>
//         <div
//           className="d-flex gap-3 align-items-center mb-3"
//           style={{ marginTop: "2%" }}
//         >
//           <div className="d-flex flex-column">
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ color: "#d97706", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Total Leads: {deepCleaningLeads}
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Avg. GSV: ₹{avgGsvDeepCleaning.toFixed(2)}
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3"
//               style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Rating: 0 ★
//             </div>
//           </div>

//           <div
//             className="border rounded p-3 text-success text-center shadow-sm"
//             style={{
//               width: "25%",
//               color: "#198754",
//               fontWeight: "bold",
//               fontSize: "12px",
//             }}
//           >
//             <span style={{ fontSize: "30px" }}>
//               {deepCleaningLeads > 0
//                 ? ((acceptedDC / deepCleaningLeads) * 100).toFixed(0)
//                 : 0}
//               %
//             </span>
//             <br />
//             <span>Response({acceptedDC})</span>
//           </div>

//           <div
//             className="border rounded p-3 text-warning text-center shadow-sm"
//             style={{
//               width: "25%",
//               color: "#e6a100",
//               fontWeight: "bold",
//               fontSize: "12px",
//             }}
//           >
//             <span style={{ fontSize: "30px" }}>
//               {cancellationPctDeepCleaning.toFixed(0)}%
//             </span>
//             <br />
//             <span>Cancellation({cancelledDC})</span>
//           </div>
//         </div>
//       </div>

//       {/* Vendor table - unchanged */}
//       <div>
//         <h5 style={{ fontSize: "16px" }}>Vendor Performance</h5>
//         <div className="mb-3">
//           <Button
//             variant={
//               selectedCategory === "housePainting" ? "danger" : "secondary"
//             }
//             onClick={() => setSelectedCategory("housePainting")}
//             className="me-2"
//             style={{ fontSize: "12px" }}
//           >
//             House Painting Performance
//           </Button>
//           <Button
//             variant={
//               selectedCategory === "deepCleaning" ? "danger" : "secondary"
//             }
//             onClick={() => setSelectedCategory("deepCleaning")}
//             style={{ fontSize: "12px" }}
//           >
//             Deep Cleaning Performance
//           </Button>
//         </div>

//         {selectedCategory === "housePainting" ? (
//           <Table striped bordered hover>
//             <thead>
//               <tr style={{ fontSize: "12px", textAlign: "center" }}>
//                 <th>Vendor Name</th>
//                 <th>Total Leads</th>
//                 <th>Jobs Started</th>
//                 <th>Leads Responded</th>
//                 <th>Lead Response %</th>
//                 <th>Surveys</th>
//                 <th>Survey %</th>
//                 <th>Hirings</th>
//                 <th>Hiring %</th>
//                 <th>GSV</th>
//                 <th>Projects Completed</th>
//                 <th>Ratings</th>
//                 <th>Strikes</th>
//               </tr>
//             </thead>
//             <tbody style={{ fontSize: "12px", textAlign: "center" }}>
//               {housePaintingVendors.map((vendor, index) => (
//                 <tr key={index}>
//                   <td>{vendor.name}</td>
//                   <td>{vendor.totalLeads}</td>
//                   <td>{vendor.jobsStarted}</td>
//                   <td>{vendor.responded}</td>
//                   <td>{vendor.responseRate}</td>
//                   <td>{vendor.surveys}</td>
//                   <td>{vendor.surveyRate}</td>
//                   <td>{vendor.hirings}</td>
//                   <td>{vendor.hiringRate}</td>
//                   <td>{vendor.gsv}</td>
//                   <td>{vendor.projects}</td>
//                   <td>{vendor.rating}</td>
//                   <td>{vendor.strikes}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         ) : (
//           <Table striped bordered hover>
//             <thead>
//               <tr style={{ fontSize: "12px", textAlign: "center" }}>
//                 <th>Vendor Name</th>
//                 <th>Total Leads</th>
//                 <th>Jobs Started</th>
//                 <th>Leads Responded</th>
//                 <th>Lead Response %</th>
//                 <th>Projects Completed</th>
//                 <th>Completion %</th>
//                 <th>Cancelled</th>
//                 <th>Cancellation %</th>
//                 <th>Ratings</th>
//                 <th>Strikes</th>
//               </tr>
//             </thead>
//             <tbody style={{ fontSize: "12px", textAlign: "center" }}>
//               {deepCleaningVendors.map((vendor, index) => (
//                 <tr key={index}>
//                   <td>{vendor.name}</td>
//                   <td>{vendor.totalLeads}</td>
//                   <td>{vendor.jobsStarted}</td>
//                   <td>{vendor.responded}</td>
//                   <td>{vendor.responseRate}</td>
//                   <td>{vendor.projectsCompleted}</td>
//                   <td>{vendor.completionRate}</td>
//                   <td>{vendor.cancelled}</td>
//                   <td>{vendor.cancellationRate}</td>
//                   <td>{vendor.rating}</td>
//                   <td>{vendor.strikes}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         )}
//       </div>

//       {/* KPI Modal */}
//       <Modal
//         show={showSettingsModal}
//         onHide={() => setShowSettingsModal(false)}
//         size="lg"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: "16px" }}>
//             Set KPI Parameters for {selectedService}
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <div className="mt-3">
//             <Form.Check
//               type="radio"
//               name="kpiType"
//               label="House Painters"
//               checked={selectedService === "House Painters"}
//               onChange={() => setSelectedService("House Painters")}
//             />
//             <Form.Check
//               type="radio"
//               name="kpiType"
//               label="Deep Cleaning"
//               checked={selectedService === "Deep Cleaning"}
//               onChange={() => setSelectedService("Deep Cleaning")}
//             />
//           </div>

//           {/* <div className="mt-3 mb-3">
//             <Button
//               variant="info"
//               size="sm"
//               onClick={() => fetchKPI(selectedService)}
//             >
//               Reload
//             </Button>
//           </div> */}

//           <Table bordered className="mt-3 text-center">
//             <thead>
//               <tr>
//                 <th>Metrics</th>
//                 <th style={{ color: "red" }}>Red</th>
//                 <th style={{ color: "orange" }}>Orange</th>
//                 <th style={{ color: "yellow" }}>Yellow</th>
//                 <th style={{ color: "green" }}>Green</th>
//               </tr>
//             </thead>

//             <tbody>
//               {getFilteredMetricKeys().map((metricKey) => {
//                 const metric = kpiValues[metricKey] || {};
//                 return (
//                   <tr key={metricKey}>
//                     <td style={{ textAlign: "left" }}>
//                       {metricLabels[metricKey]}
//                     </td>

//                     {/* RED */}
//                     <td>
//                       {isEditMode ? (
//                         <input
//                           type="number"
//                           className="form-control"
//                           style={{ width: "80px", fontSize: "12px" }}
//                           value={metric.red !== undefined ? metric.red : ""}
//                           onChange={(e) => {
//                             const val = e.target.value;
//                             const updated = { ...kpiValues };

//                             updated[metricKey] = {
//                               ...updated[metricKey],
//                               red: val === "" ? "" : Number(val),
//                             };

//                             setKpiValues(updated);
//                           }}
//                         />
//                       ) : (
//                         metric.red ?? "-"
//                       )}
//                     </td>

//                     {/* ORANGE */}
//                     <td>
//                       {isEditMode ? (
//                         <input
//                           type="number"
//                           className="form-control"
//                           style={{ width: "80px", fontSize: "12px" }}
//                           value={metric.orange ?? ""}
//                           onChange={(e) => {
//                             const updated = { ...kpiValues };
//                             updated[metricKey] = {
//                               ...updated[metricKey],
//                               orange: Number(e.target.value),
//                             };
//                             setKpiValues(updated);
//                           }}
//                         />
//                       ) : (
//                         metric.orange ?? "-"
//                       )}
//                     </td>

//                     {/* YELLOW */}
//                     <td>
//                       {isEditMode ? (
//                         <input
//                           type="number"
//                           className="form-control"
//                           style={{ width: "80px", fontSize: "12px" }}
//                           value={metric.yellow ?? ""}
//                           onChange={(e) => {
//                             const updated = { ...kpiValues };
//                             updated[metricKey] = {
//                               ...updated[metricKey],
//                               yellow: Number(e.target.value),
//                             };
//                             setKpiValues(updated);
//                           }}
//                         />
//                       ) : (
//                         metric.yellow ?? "-"
//                       )}
//                     </td>

//                     {/* GREEN */}
//                     <td>
//                       {isEditMode ? (
//                         <input
//                           type="number"
//                           className="form-control"
//                           style={{ width: "80px", fontSize: "12px" }}
//                           value={metric.green ?? ""}
//                           onChange={(e) => {
//                             const updated = { ...kpiValues };
//                             updated[metricKey] = {
//                               ...updated[metricKey],
//                               green: Number(e.target.value),
//                             };
//                             setKpiValues(updated);
//                           }}
//                         />
//                       ) : metricKey === "avgGSV" ? (
//                         `₹${metric.green ?? 0}`
//                       ) : (
//                         metric.green ?? 0
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </Table>

//           {/* Show ranges under the KPI table for quick reference */}
//           <div className="mt-3">
//             <h6>Configured Ranges (a..e per metric)</h6>
//             <Table size="sm" bordered>
//               <thead>
//                 <tr>
//                   <th>Metric</th>
//                   <th>a</th>
//                   <th>b</th>
//                   <th>c</th>
//                   <th>d</th>
//                   <th>e</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {getFilteredMetricKeys().map((metricKey) => {
//                   const r = rangeValues?.[metricKey] || {
//                     a: 0,
//                     b: 0,
//                     c: 0,
//                     d: 0,
//                     e: 0,
//                   };
//                   return (
//                     <tr key={metricKey}>
//                       <td style={{ textAlign: "left" }}>
//                         {metricLabels[metricKey]}
//                       </td>
//                       <td>{r.a}</td>
//                       <td>{r.b}</td>
//                       <td>{r.c}</td>
//                       <td>{r.d}</td>
//                       <td>{r.e}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </Table>
//           </div>
//         </Modal.Body>

//         <Modal.Footer>
//           {!isEditMode ? (
//             <>
//               <Button variant="primary" onClick={() => setIsEditMode(true)}>
//                 Edit KPI
//               </Button>
//               <Button
//                 variant="secondary"
//                 onClick={() => setShowSettingsModal(false)}
//               >
//                 Close
//               </Button>
//             </>
//           ) : (
//             <>
//               <Button variant="success" onClick={saveKPI}>
//                 Save KPI
//               </Button>
//               <Button
//                 variant="danger"
//                 onClick={() => {
//                   setIsEditMode(false);
//                   fetchKPI(selectedService);
//                 }}
//               >
//                 Cancel
//               </Button>
//             </>
//           )}
//         </Modal.Footer>
//       </Modal>

//       {/* Range Modal */}
//       <Modal
//         show={showRangeModal}
//         onHide={() => setShowRangeModal(false)}
//         // size="lg"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>Set Ranges</Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <div className="mb-3">
//             <Form.Check
//               inline
//               label="House Painters"
//               type="radio"
//               checked={selectedRangeService === "House Painters"}
//               onChange={() => {
//                 setSelectedRangeService("House Painters");
//                 getKPI(serviceMap["House Painters"])
//                   .then((r) => setRangeValues(r?.data?.data?.ranges || {}))
//                   .catch((e) => console.error(e));
//               }}
//             />
//             <Form.Check
//               inline
//               label="Deep Cleaning"
//               type="radio"
//               checked={selectedRangeService === "Deep Cleaning"}
//               onChange={() => {
//                 setSelectedRangeService("Deep Cleaning");
//                 getKPI(serviceMap["Deep Cleaning"])
//                   .then((r) => setRangeValues(r?.data?.data?.ranges || {}))
//                   .catch((e) => console.error(e));
//               }}
//             />
//           </div>

//           {getFilteredMetricKeys(selectedRangeService).map((metricKey) => (
//             <div key={metricKey} className="mb-3">
//               <h6>{metricLabels[metricKey]}</h6>
//               <div className="d-flex gap-2">
//                 {["a", "b", "c", "d", "e"].map((k) => (
//                   <input
//                     key={k}
//                     type="number"
//                     placeholder={k}
//                     className="form-control"
//                     style={{ width: "80px" }}
//                     value={rangeValues?.[metricKey]?.[k] ?? ""}
//                     onChange={(e) => {
//                       const raw = e.target.value;
//                       const updated = { ...rangeValues };
//                       if (raw === "") {
//                         updated[metricKey] = { ...(updated[metricKey] || {}) };
//                         delete updated[metricKey][k];
//                       } else {
//                         updated[metricKey] = {
//                           ...(updated[metricKey] || {}),
//                           [k]: Number(raw),
//                         };
//                       }
//                       setRangeValues(updated);
//                     }}
//                   />
//                 ))}
//               </div>
//             </div>
//           ))}
//         </Modal.Body>

//         <Modal.Footer>
//           <Button variant="success" onClick={saveRanges}>
//             Save Ranges
//           </Button>
//           <Button variant="secondary" onClick={() => setShowRangeModal(false)}>
//             Cancel
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default PerformanceDashboard;

// import { useState, useEffect } from "react";
// import { Table, Button, Form, Modal } from "react-bootstrap";
// import { FaCog } from "react-icons/fa";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";

// const PerformanceDashboard = ({ show, onHide }) => {
//   const [city, setCity] = useState("All Cities");
//   const [selectedService, setSelectedService] = useState("House Painters");
//   const [showSettingsModal, setShowSettingsModal] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("house Painting");
//   const [allLeads, setAllLeads] = useState([]);
//   const [housePaintingLeads, setHousePaintingLeads] = useState(0);
//   const [deepCleaningLeads, setDeepCleaningLeads] = useState(0);
//   const [avgGsvHousePainting, setAvgGsvHousePainting] = useState(0);
//   const [avgGsvDeepCleaning, setAvgGsvDeepCleaning] = useState(0);
//   const [surveyPctHousePainting, setSurveyPctHousePainting] = useState(0);
//   const [surveyPctDeepCleaning, setSurveyPctDeepCleaning] = useState(0);
//   const [acceptedDC, setAcceptedDC] = useState(0);
//   const [cancelledDC, setCancelledDC] = useState(0);
//   const [cancellationPctDeepCleaning, setCancellationPctDeepCleaning] =
//     useState(0);
//   const [acceptedHP, setAcceptedHP] = useState(0);
//   const [cancelledHP, setCancelledHP] = useState(0);
//   const [cancellationPctHousePainting, setCancellationPctHousePainting] =
//     useState(0);
//   const [housePaintingVendors, setHousePaintingVendors] = useState([]);
//   const [deepCleaningVendors, setDeepCleaningVendors] = useState([]);
//   const [startedHP, setStartedHP] = useState(0);

//   const [kpiValues, setKpiValues] = useState({});
//   const [isEditMode, setIsEditMode] = useState(false);

//   const [showRangeModal, setShowRangeModal] = useState(false);
//   const [rangeValues, setRangeValues] = useState({
//     a: "",
//     b: "",
//     c: "",
//     d: "",
//     e: "",
//   });

//   const serviceMap = {
//     "House Painters": "house_painting",
//     "Deep Cleaning": "deep_cleaning",
//   };

//   // 🚀 ADD THIS HERE
//   const metricLabels = {
//     surveyPercentage: "Survey %",
//     hiringPercentage: "Hiring %",
//     avgGSV: "Avg. GSV",
//     rating: "Rating",
//     strikes: "Strikes",

//     // Deep Cleaning Metrics
//     responsePercentage: "Response %",
//     cancellationPercentage: "Cancellation %",
//   };

//   const normalize = (v) => (v ?? "").toString().trim().toLowerCase();

//   const computeTotals = (arr) => {
//     let totalAmount = 0;
//     let totalProjects = 0;

//     arr.forEach((lead) => {
//       if (Array.isArray(lead?.service)) {
//         lead.service.forEach((srv) => {
//           const qty = Number(srv?.quantity) || 1;
//           const price = Number(srv?.price) || 0;
//           totalAmount += price * qty;
//           totalProjects += qty; // each service item counts as a project
//         });
//       }
//     });

//     return { totalAmount, totalProjects };
//   };

//   console.log("surveyPctHousePainting", surveyPctHousePainting);

//   useEffect(() => {
//     const fetchLeads = async () => {
//       try {
//         const res = await axios.get(
//           "https://homjee-backend.onrender.com/api/bookings/get-all-leads"
//         );

//         const leads = res.data?.allLeads ?? [];
//         setAllLeads(leads);

//         const isHP = (lead) =>
//           Array.isArray(lead?.service) &&
//           lead.service.some((s) => normalize(s?.category) === "house painting");
//         const isDC = (lead) =>
//           Array.isArray(lead?.service) &&
//           lead.service.some((s) => normalize(s?.category) === "deep cleaning");

//         const housePainting = leads.filter(isHP);
//         const deepCleaning = leads.filter(isDC);

//         setHousePaintingLeads(housePainting.length);
//         setDeepCleaningLeads(deepCleaning.length);

//         const sumGsv = (arr) =>
//           arr.reduce(
//             (sum, lead) =>
//               sum +
//               (lead?.service?.reduce(
//                 (s, srv) =>
//                   s + (Number(srv?.price) || 0) * (Number(srv?.quantity) || 1),
//                 0
//               ) || 0),
//             0
//           );

//         const hpGsv = sumGsv(housePainting);
//         const dcGsv = sumGsv(deepCleaning);

//         const { totalAmount: hpAmount, totalProjects: hpProjects } =
//           computeTotals(housePainting);
//         setAvgGsvHousePainting(
//           hpProjects > 0 ? (hpAmount / hpProjects) * 100 : 0
//         );

//         // For deep cleaning
//         const { totalAmount: dcAmount, totalProjects: dcProjects } =
//           computeTotals(deepCleaning);
//         setAvgGsvDeepCleaning(
//           dcProjects > 0 ? (dcAmount / dcProjects) * 100 : 0
//         );

//         const hpAccepted = housePainting.filter(
//           (l) => l?.assignedProfessional?.acceptedDate
//         ).length;
//         const hpStarted = housePainting.filter(
//           (l) => l?.assignedProfessional?.startedDate
//         ).length;
//         setStartedHP(hpStarted);

//         const hpCancelled = housePainting.filter(
//           (l) => normalize(l?.bookingDetails?.status) === "customer cancelled"
//         ).length;

//         const dcAccepted = deepCleaning.filter(
//           (l) => l?.assignedProfessional?.acceptedDate
//         ).length;
//         const dcStarted = deepCleaning.filter(
//           (l) => l?.assignedProfessional?.startedDate
//         ).length;
//         const dcCancelled = deepCleaning.filter(
//           (l) => normalize(l?.bookingDetails?.status) === "customer cancelled"
//         ).length;

//         setAcceptedHP(hpAccepted);
//         setCancelledHP(hpCancelled);
//         setSurveyPctHousePainting(
//           hpAccepted ? (hpStarted / hpAccepted) * 100 : 0
//         );
//         setCancellationPctHousePainting(
//           hpAccepted ? (hpCancelled / hpAccepted) * 100 : 0
//         );

//         setAcceptedDC(dcAccepted);
//         setCancelledDC(dcCancelled);
//         setSurveyPctDeepCleaning(
//           dcAccepted ? (dcStarted / dcAccepted) * 100 : 0
//         );
//         setCancellationPctDeepCleaning(
//           dcAccepted ? (dcCancelled / dcAccepted) * 100 : 0
//         );

//         // Compute vendor data
//         const computeVendorData = (leads, category) => {
//           const vendorMap = {};

//           leads.forEach((lead) => {
//             const prof = lead.assignedProfessional;
//             if (prof?.professionalId) {
//               const id = prof.professionalId;
//               if (!vendorMap[id]) {
//                 vendorMap[id] = {
//                   name: prof.name || "Unknown",
//                   professionalId: id,
//                   totalLeads: 0,
//                   jobsStarted: 0,
//                   responded: 0,
//                   surveys: 0,
//                   hirings: 0,
//                   cancelled: 0,
//                 };
//               }

//               // Increment total leads
//               vendorMap[id].totalLeads += 1;

//               // If vendor responded (accepted lead)
//               if (prof.acceptedDate) {
//                 vendorMap[id].responded += 1;
//               }

//               // If vendor actually started work = count as survey
//               if (prof.startedDate) {
//                 vendorMap[id].jobsStarted += 1;
//                 vendorMap[id].surveys += 1;
//               }

//               // If cancelled
//               if (
//                 normalize(lead?.bookingDetails?.status) === "customer cancelled"
//               ) {
//                 vendorMap[id].cancelled += 1;
//               }

//               // (Optional: hiring = confirmed jobs)
//               if (normalize(lead?.bookingDetails?.status) === "confirmed") {
//                 vendorMap[id].hirings += 1;
//               }
//             }
//           });

//           return Object.values(vendorMap).map((vendor) => ({
//             ...vendor,
//             responseRate: vendor.totalLeads
//               ? `${((vendor.responded / vendor.totalLeads) * 100).toFixed(0)}%`
//               : "0%",
//             surveyRate: vendor.responded
//               ? `${((vendor.surveys / vendor.responded) * 100).toFixed(0)}%`
//               : "0%",
//             hiringRate: vendor.responded
//               ? `${((vendor.hirings / vendor.responded) * 100).toFixed(0)}%`
//               : "0%",
//             cancellationRate: vendor.responded
//               ? `${((vendor.cancelled / vendor.responded) * 100).toFixed(0)}%`
//               : "0%",
//             gsv: "₹0", // you can compute GSV per vendor if needed
//             rating: "0 ★", // hook up actual ratings later
//             strikes: 0,
//           }));
//         };

//         setHousePaintingVendors(
//           computeVendorData(housePainting, "housePainting")
//         );
//         setDeepCleaningVendors(computeVendorData(deepCleaning, "deepCleaning"));

//         console.log("Deep Cleaning Metrics:", {
//           totalDeepCleaningLeads: deepCleaning.length,
//           acceptedDC: dcAccepted,
//           cancelledDC: dcCancelled,
//           cancellationPctDeepCleaning: dcAccepted
//             ? (dcCancelled / dcAccepted) * 100
//             : 0,
//           deepCleaningVendors: computeVendorData(deepCleaning, "deepCleaning"),
//         });

//         console.log("House Painting Metrics:", {
//           totalHousePaintingLeads: housePainting.length,
//           acceptedHP: hpAccepted,
//           cancelledHP: hpCancelled,
//           cancellationPctHousePainting: hpAccepted
//             ? (hpCancelled / hpAccepted) * 100
//             : 0,
//           housePaintingVendors: computeVendorData(
//             housePainting,
//             "housePainting"
//           ),
//         });
//       } catch (err) {
//         console.error("Error fetching leads:", err);
//       }
//     };

//     fetchLeads();
//   }, []);

//   const fetchKPI = async (service) => {
//     try {
//       const apiService = serviceMap[service];

//       const res = await axios.get(`${BASE_URL}/kpi-parameters/${apiService}`);

//       setKpiValues(res.data.data.metrics);
//       setIsEditMode(false);
//     } catch (err) {
//       console.error("Error fetching KPI:", err);
//     }
//   };

//   const saveKPI = async () => {
//     try {
//       const apiService = serviceMap[selectedService];

//       const res = await axios.put(`${BASE_URL}/kpi-parameters/${apiService}`, {
//         metrics: kpiValues,
//       });

//       setIsEditMode(false);
//       fetchKPI(); // Refresh UI
//     } catch (err) {
//       console.error("KPI Update Error:", err);
//       alert("Failed to update KPI");
//     }
//   };

//   const getFilteredMetricKeys = () => {
//     if (selectedService === "House Painters") {
//       return [
//         "surveyPercentage",
//         "hiringPercentage",
//         "avgGSV",
//         "rating",
//         "strikes",
//       ];
//     } else {
//       return [
//         "responsePercentage",
//         "cancellationPercentage",
//         "rating",
//         "strikes",
//       ];
//     }
//   };

//   return (
//     <div
//       className="container py-4"
//       style={{ fontFamily: "Poppins, sans-serif" }}
//     >
//       {/* Header */}
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h5 style={{ fontWeight: "bold" }}>Performance Dashboard</h5>
//         <div className="d-flex gap-2">
//           <Form.Select
//             value={city}
//             onChange={(e) => setCity(e.target.value)}
//             style={{ height: "32px", fontSize: "13px" }}
//           >
//             <option>All Cities</option>
//             <option>Bengaluru</option>
//             <option>Mumbai</option>
//           </Form.Select>
//           <Form.Select
//             // value={city}
//             // onChange={(e) => setCity(e.target.value)}
//             style={{ height: "32px", fontSize: "13px" }}
//           >
//             <option>Select Period</option>
//             <option>All Time</option>
//             <option>This Month</option>
//             <option>Last Month</option>
//           </Form.Select>
//           <Button
//             variant="secondary"
//             onClick={() => {
//               setShowSettingsModal(true);
//               fetchKPI(selectedService);
//             }}
//             style={{ whiteSpace: "nowrap", fontSize: "13px" }}
//           >
//             <FaCog className="me-2" /> Settings
//           </Button>
//           <Button
//             variant="warning"
//             onClick={() => setShowRangeModal(true)}
//             style={{ marginLeft: 10, fontSize: "12px" }}
//           >
//             Set Ranges
//           </Button>
//         </div>
//       </div>

//       {/* House Painting Performance */}
//       <div className="container py-4">
//         <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
//           🏠 House Painting Performance
//         </h6>
//         <div
//           className="d-flex gap-3 align-items-center mb-3"
//           style={{ marginTop: "2%" }}
//         >
//           <div className="d-flex flex-column">
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ color: "#2b4eff", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Total Leads: {housePaintingLeads}
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Avg. GSV: ₹{avgGsvHousePainting.toFixed(2)}
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3"
//               style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Rating: 0 ★
//             </div>
//           </div>
//           <div
//             className="border rounded p-3 text-warning text-center shadow-sm"
//             style={{
//               width: "25%",
//               color: "#e6a100",
//               fontWeight: "bold",
//               fontSize: "12px",
//             }}
//           >
//             <span style={{ fontSize: "30px" }}>
//               {surveyPctHousePainting.toFixed(0)}%
//             </span>
//             <br />
//             <span>Survey({startedHP})</span>
//           </div>
//           <div
//             className="border rounded p-3 text-danger text-center shadow-sm"
//             style={{
//               width: "25%",
//               color: "#dc3545",
//               fontWeight: "bold",
//               fontSize: "12px",
//             }}
//           >
//             <span style={{ fontSize: "30px" }}>0%</span> <br />{" "}
//             <span>Hiring(0)</span>
//           </div>
//         </div>
//       </div>

//       {/* Deep Cleaning Performance */}
//       <div className="container py-4">
//         <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
//           🧹 Deep Cleaning Performance
//         </h6>
//         <div
//           className="d-flex gap-3 align-items-center mb-3"
//           style={{ marginTop: "2%" }}
//         >
//           <div className="d-flex flex-column">
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ color: "#d97706", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Total Leads: {deepCleaningLeads}
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Avg. GSV: ₹{avgGsvDeepCleaning.toFixed(2)}
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3"
//               style={{ color: "#198754", fontWeight: "bold", fontSize: "14px" }}
//             >
//               Rating: 0 ★
//             </div>
//           </div>
//           <div
//             className="border rounded p-3 text-success text-center shadow-sm"
//             style={{
//               width: "25%",
//               color: "#198754",
//               fontWeight: "bold",
//               fontSize: "12px",
//             }}
//           >
//             <span style={{ fontSize: "30px" }}>
//               {deepCleaningLeads > 0
//                 ? ((acceptedDC / deepCleaningLeads) * 100).toFixed(0)
//                 : 0}
//               %
//             </span>
//             <br />
//             <span>Response({acceptedDC})</span>
//           </div>
//           <div
//             className="border rounded p-3 text-warning text-center shadow-sm"
//             style={{
//               width: "25%",
//               color: "#e6a100",
//               fontWeight: "bold",
//               fontSize: "12px",
//             }}
//           >
//             <span style={{ fontSize: "30px" }}>
//               {cancellationPctDeepCleaning.toFixed(0)}%
//             </span>
//             <br />
//             <span>Cancellation({cancelledDC})</span>
//           </div>
//         </div>
//       </div>

//       {/* Vendor Performance Table */}
//       <div>
//         <h5 style={{ fontSize: "16px" }}>Vendor Performance</h5>
//         <div className="mb-3">
//           <Button
//             variant={
//               selectedCategory === "housePainting" ? "danger" : "secondary"
//             }
//             onClick={() => setSelectedCategory("housePainting")}
//             className="me-2"
//             style={{ fontSize: "12px" }}
//           >
//             House Painting Performance
//           </Button>
//           <Button
//             variant={
//               selectedCategory === "deepCleaning" ? "danger" : "secondary"
//             }
//             onClick={() => setSelectedCategory("deepCleaning")}
//             style={{ fontSize: "12px" }}
//           >
//             Deep Cleaning Performance
//           </Button>
//         </div>

//         {selectedCategory === "housePainting" ? (
//           <Table striped bordered hover>
//             <thead>
//               <tr style={{ fontSize: "12px", textAlign: "center" }}>
//                 <th>Vendor Name</th>
//                 <th>Total Leads</th>
//                 <th>Jobs Started</th>
//                 <th>Leads Responded</th>
//                 <th>Lead Response %</th>
//                 <th>Surveys</th>
//                 <th>Survey %</th>
//                 <th>Hirings</th>
//                 <th>Hiring %</th>
//                 <th>GSV</th>
//                 <th>Projects Completed</th>
//                 <th>Ratings</th>
//                 <th>Strikes</th>
//               </tr>
//             </thead>
//             <tbody style={{ fontSize: "12px", textAlign: "center" }}>
//               {housePaintingVendors.map((vendor, index) => (
//                 <tr key={index}>
//                   <td>{vendor.name}</td>
//                   <td>{vendor.totalLeads}</td>
//                   <td>{vendor.jobsStarted}</td>
//                   <td>{vendor.responded}</td>
//                   <td>{vendor.responseRate}</td>
//                   <td>{vendor.surveys}</td>
//                   <td>{vendor.surveyRate}</td>
//                   <td>{vendor.hirings}</td>
//                   <td>{vendor.hiringRate}</td>
//                   <td>{vendor.gsv}</td>
//                   <td>{vendor.projects}</td>
//                   <td>{vendor.rating}</td>
//                   <td>{vendor.strikes}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         ) : (
//           <Table striped bordered hover>
//             <thead>
//               <tr style={{ fontSize: "12px", textAlign: "center" }}>
//                 <th>Vendor Name</th>
//                 <th>Total Leads</th>
//                 <th>Jobs Started</th>
//                 <th>Leads Responded</th>
//                 <th>Lead Response %</th>
//                 <th>Projects Completed</th>
//                 <th>Completion %</th>
//                 <th>Cancelled</th>
//                 <th>Cancellation %</th>
//                 <th>Ratings</th>
//                 <th>Strikes</th>
//               </tr>
//             </thead>
//             <tbody style={{ fontSize: "12px", textAlign: "center" }}>
//               {deepCleaningVendors.map((vendor, index) => (
//                 <tr key={index}>
//                   <td>{vendor.name}</td>
//                   <td>{vendor.totalLeads}</td>
//                   <td>{vendor.jobsStarted}</td>
//                   <td>{vendor.responded}</td>
//                   <td>{vendor.responseRate}</td>
//                   <td>{vendor.projectsCompleted}</td>
//                   <td>{vendor.completionRate}</td>
//                   <td>{vendor.cancelled}</td>
//                   <td>{vendor.cancellationRate}</td>
//                   <td>{vendor.rating}</td>
//                   <td>{vendor.strikes}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         )}
//       </div>

//       {/* KPI Parameters Modal */}
//       <Modal
//         show={showSettingsModal}
//         onHide={() => setShowSettingsModal(false)}
//         size="lg"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: "16px" }}>
//             Set KPI Parameters for {selectedService}
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <div className="mt-3">
//             <Form.Check
//               type="radio"
//               name="kpiType"
//               label="House Painters"
//               checked={selectedService === "House Painters"}
//               onChange={() => setSelectedService("House Painters")}
//             />
//             <Form.Check
//               type="radio"
//               name="kpiType"
//               label="Deep Cleaning"
//               checked={selectedService === "Deep Cleaning"}
//               onChange={() => setSelectedService("Deep Cleaning")}
//             />
//           </div>
//           <Table bordered className="mt-3 text-center">
//             <thead>
//               <tr>
//                 <th>Metrics</th>
//                 <th style={{ color: "red" }}>Red</th>
//                 <th style={{ color: "orange" }}>Orange</th>
//                 <th style={{ color: "yellow" }}>Yellow</th>
//                 <th style={{ color: "green" }}>Green</th>
//               </tr>
//             </thead>

//             <tbody>
//               {getFilteredMetricKeys().map((metricKey) => {
//                 const bands = kpiValues?.[metricKey] || {
//                   red: 0,
//                   orange: 0,
//                   yellow: 0,
//                   green: 0,
//                 };

//                 return (
//                   <tr key={metricKey}>
//                     <td>{metricLabels[metricKey]}</td>

//                     {["red", "orange", "yellow", "green"].map((color) => (
//                       <td key={color}>
//                         {isEditMode ? (
//                           <input
//                             type="number"
//                             className="form-control"
//                             style={{ width: "80px", fontSize: "12px" }}
//                             value={bands[color]}
//                             onChange={(e) => {
//                               const updated = { ...kpiValues };
//                               updated[metricKey] = updated[metricKey] || {};
//                               updated[metricKey][color] = Number(
//                                 e.target.value
//                               );
//                               setKpiValues(updated);
//                             }}
//                           />
//                         ) : metricKey === "avgGSV" ? (
//                           // SHOW ₹ ONLY IN VIEW MODE
//                           `₹${bands[color]}`
//                         ) : (
//                           bands[color]
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </Table>
//         </Modal.Body>
//         <Modal.Footer>
//           {!isEditMode ? (
//             <Button variant="primary" onClick={() => setIsEditMode(true)}>
//               Edit
//             </Button>
//           ) : (
//             <Button variant="success" onClick={saveKPI}>
//               Save
//             </Button>
//           )}
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default PerformanceDashboard;
