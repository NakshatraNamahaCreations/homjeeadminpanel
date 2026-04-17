// import React, { useEffect, useState } from "react";
// import { Table, Button, Form, Modal } from "react-bootstrap";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";
// import { getKPI, updateRanges } from "../utils/kpiApi";
// import { IoMdSettings } from "react-icons/io";

// /* ---------------------------
//     Helper functions & constants
//   --------------------------- */
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

// /* ---------------------------
//     Component
//   --------------------------- */
// const PerformanceDashboard = () => {
//   // UI / Data states
//   const [city, setCity] = useState("All Cities");
//   const [period, setPeriod] = useState("All Time");
//   const [selectedService, setSelectedService] = useState("House Painters");
// const [cityOptions, setCityOptions] = useState([]); // ✅ NEW

//   const [allLeads, setAllLeads] = useState([]);

//   // KPI Ranges for both services
//   const [kpiRanges, setKpiRanges] = useState({
//     "House Painters": {},
//     "Deep Cleaning": {},
//   });
//   const [showRangeModal, setShowRangeModal] = useState(false);
//   const [selectedRangeService, setSelectedRangeService] =
//     useState("House Painters");

//   // Vendor / Lead related states
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

//   const [isEditMode, setIsEditMode] = useState(false);

//   // Add these states near your other state declarations
//   const [ratingHousePainting, setRatingHousePainting] = useState(0);
//   const [strikesHousePainting, setStrikesHousePainting] = useState(0);
//   const [ratingDeepCleaning, setRatingDeepCleaning] = useState(0);
//   const [strikesDeepCleaning, setStrikesDeepCleaning] = useState(0);

//   // metrics that are reversed (descending ranges)
//   const reversedMetrics = new Set(["strikes", "cancellationPercentage"]);

//   // CORRECTED COLOR RANGE CHECKER
//   const getRangeColor = (serviceName, metricKey, rawValue) => {
//     const ranges = kpiRanges[serviceName];

//     // Fallback for missing data
//     if (!ranges || !ranges[metricKey]) {
//       if (serviceName === "Deep Cleaning" && metricKey === "avgGSV") {
//         return "#2b4eff"; // Forced blue
//       }
//       return "#000000";
//     }

//     // Special-case: Deep Cleaning avgGSV ALWAYS blue
//     if (serviceName === "Deep Cleaning" && metricKey === "avgGSV") {
//       return "#2b4eff";
//     }

//     const value = parseFloat(rawValue);
//     if (Number.isNaN(value)) return "#000000";

//     const { a, b, c, d, e } = ranges[metricKey] || {};

//     // 🟣 NEW RULE: If 4 or more range fields are zero → use GRAY
//     const zeroCount = [a, b, c, d, e].filter((v) => v === 0).length;
//     if (zeroCount >= 4) {
//       return "#808080"; // Gray color for incomplete ranges
//     }

//     // Reversed metrics (strikes, cancellationPercentage)
//     if (reversedMetrics.has(metricKey)) {
//       if (value >= a) return "#df2020"; // Red
//       if (value >= b) return "#ff8c00"; // Orange
//       if (value >= c) return "#fcce00ff"; // Yellow
//       if (value >= d) return "#198754"; // Green
//       return "#198754";
//     }

//     // Normal ascending logic
//     if (value >= a && value < b) return "#df2020"; // Red
//     if (value >= b && value < c) return "#ff8c00"; // Orange
//     if (value >= c && value < d) return "#fcce00ff"; // Yellow
//     if (value >= d) return "#198754"; // Green

//     return "#000000";
//   };

//   // Update range value function
//   const updateRangeValue = (metricKey, field, value) => {
//     const numValue = value === "" ? "" : parseFloat(value);
//     setKpiRanges((prev) => ({
//       ...prev,
//       [selectedRangeService]: {
//         ...prev[selectedRangeService],
//         [metricKey]: {
//           ...prev[selectedRangeService]?.[metricKey],
//           [field]: numValue,
//         },
//       },
//     }));
//   };

//   /* ---------------------------
//       Load Performance Data from API
//     --------------------------- */
//   useEffect(() => {
//     const fetchPerformanceData = async () => {
//       try {
//         const cityParam = city === "All Cities" ? "All" : city;
//         const periodParam =
//           period === "All Time"
//             ? "all"
//             : period === "This Month"
//             ? "this_month"
//             : "last_month";

//         const res = await axios.get(
//           `${BASE_URL}/bookings/overall?city=${cityParam}&period=${periodParam}`
//         );
//         const data = res.data;

//         // Update overall performance
//         setHousePaintingLeads(data.housePainting.totalLeads);
//         setSurveyPctHousePainting(data.housePainting.surveyPercentage);
//         setAvgGsvHousePainting(data.housePainting.averageGsv);
//         setCancellationPctHousePainting(
//           data.housePainting.cancellationPercentage || 0
//         );
//         setAcceptedHP(data.housePainting.hiringPercentage);

//         setDeepCleaningLeads(data.deepCleaning.totalLeads);
//         setSurveyPctDeepCleaning(data.deepCleaning.responsePercentage || 0);
//         setCancellationPctDeepCleaning(
//           data.deepCleaning.cancellationPercentage
//         );
//         setAvgGsvDeepCleaning(data.deepCleaning.averageGsv);
//         setAcceptedDC(data.deepCleaning.responsePercentage);

//         // Set counts for display
//         setStartedHP(
//           Math.round(
//             (data.housePainting.surveyPercentage / 100) *
//               data.housePainting.totalLeads
//           )
//         );
//         setCancelledDC(
//           Math.round(
//             (data.deepCleaning.cancellationPercentage / 100) *
//               data.deepCleaning.totalLeads
//           )
//         );

//         // Update rating data
//         setRatingHousePainting(data.housePainting.averageRating || 0);
//         setStrikesHousePainting(data.housePainting.strikes || 0);
//         setRatingDeepCleaning(data.deepCleaning.averageRating || 0);
//         setStrikesDeepCleaning(data.deepCleaning.strikes || 0);

//         // Vendors
//         setHousePaintingVendors(
//           (data.vendors.housePainting || []).map((v) => ({
//             name: v.name,
//             totalLeads: v.totalLeads,
//             responded: v.responded,
//             jobsStarted: v.survey,
//             hirings: v.hired,
//             cancelled: v.cancelled,
//             responseRate: `${v.responseRate}%`,
//             surveyRate: `${v.surveyRate}%`,
//             hiringRate: `${v.hiringRate}%`,
//             cancellationRate: `${v.cancellationRate}%`,
//             gsv: `₹${v.gsv}`,
//             rating: `${v.avgRating} ★`,
//             strikes: v.strikes,
//           }))
//         );
//         setDeepCleaningVendors(
//           (data.vendors.deepCleaning || []).map((v) => ({
//             name: v.name,
//             totalLeads: v.totalLeads,
//             responded: v.responded,
//             jobsStarted: v.survey,
//             hirings: v.hired,
//             cancelled: v.cancelled,
//             responseRate: `${v.responseRate}%`,
//             projectsCompleted: v.hired,
//             completionRate: `${v.surveyRate}%`,
//             cancellationRate: `${v.cancellationRate}%`,
//             gsv: `₹${v.gsv}`,
//             rating: `${v.avgRating} ★`,
//             strikes: v.strikes,
//           }))
//         );
//       } catch (err) {
//         console.error("Error fetching performance data:", err);
//       }
//     };

//     fetchPerformanceData();
//   }, [city, period]);

//   /* ---------------------------
//       Load KPI Ranges for both services on component mount
//     --------------------------- */
//   useEffect(() => {
//     const loadAllKPIRanges = async () => {
//       try {
//         const [hpRes, dcRes] = await Promise.all([
//           getKPI("house_painting"),
//           getKPI("deep_cleaning"),
//         ]);

//         setKpiRanges({
//           "House Painters": hpRes?.data?.data?.ranges || {},
//           "Deep Cleaning": dcRes?.data?.data?.ranges || {},
//         });
//       } catch (e) {
//         console.error("Error loading KPI ranges", e);
//       }
//     };

//     loadAllKPIRanges();
//   }, []);

//   /* ---------------------------
//       Load ranges for modal when service changes
//     --------------------------- */
//   const fetchRangesFor = async (serviceName) => {
//     try {
//       const serviceType = serviceMap[serviceName];
//       const res = await getKPI(serviceType);
//       setKpiRanges((prev) => ({
//         ...prev,
//         [serviceName]: res?.data?.data?.ranges || {},
//       }));
//     } catch (e) {
//       console.error("Error loading ranges", e);
//     }
//   };

//   /* ---------------------------
//       Save Ranges
//       - ascending checks for most
//       - descending checks for strikes & cancellationPercentage
//     --------------------------- */
//   const saveRanges = async () => {
//     try {
//       const payload = {};
//       const currentRanges = kpiRanges[selectedRangeService] || {};

//       for (const metricKey of Object.keys(currentRanges)) {
//         const r = currentRanges[metricKey] || {};
//         const { a, b, c, d, e } = r;
//         const values = [a, b, c, d, e];

//         const allZero = values.every((v) => v === 0);
//         if (allZero) continue;

//         const allFilled = values.every(
//           (v) => typeof v === "number" && !Number.isNaN(v)
//         );
//         if (!allFilled) {
//           alert(
//             `${metricLabels[metricKey]} is incomplete. Fill all a,b,c,d,e or leave all empty.`
//           );
//           return;
//         }

//         // If metric is reversed (strikes or cancellation %), expect descending order
//         if (reversedMetrics.has(metricKey)) {
//           if (!(a > b && b > c && c > d && d > e)) {
//             alert(
//               `Range for ${metricLabels[metricKey]} must satisfy a > b > c > d > e (descending ranges)`
//             );
//             return;
//           }
//         } else {
//           if (!(a < b && b < c && c < d && d < e)) {
//             alert(
//               `Range for ${metricLabels[metricKey]} must satisfy a < b < c < d < e (ascending ranges)`
//             );
//             return;
//           }
//         }

//         payload[metricKey] = { a, b, c, d, e };
//       }

//       if (Object.keys(payload).length === 0) {
//         alert("Nothing to update.");
//         return;
//       }

//       const serviceType = serviceMap[selectedRangeService];
//       await updateRanges(serviceType, payload);

//       alert("Ranges updated successfully!");
//       setShowRangeModal(false);
//       setIsEditMode(false);
//       fetchRangesFor(selectedRangeService);
//     } catch (err) {
//       console.error("Save ranges error:", err);
//       alert("Error saving ranges. Check console for details.");
//     }
//   };

//   /* ---------------------------
//       RANGE UI METRICS
//     --------------------------- */
//   const getRangeMetricKeys = (serviceName) => {
//     if (serviceName === "House Painters") {
//       return [
//         "surveyPercentage",
//         "hiringPercentage",
//         "avgGSV",
//         "rating",
//         "strikes",
//       ];
//     }

//     // Deep Cleaning → REMOVE avgGSV from modal!
//     return [
//       "responsePercentage",
//       "cancellationPercentage",
//       "rating",
//       "strikes",
//     ];
//   };

//   /* ---------------------------
//       RENDER
//     --------------------------- */
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
//             <option>Pune</option>
//           </Form.Select>

//           <Form.Select
//             value={period}
//             onChange={(e) => setPeriod(e.target.value)}
//             style={{ height: "32px", fontSize: "13px" }}
//           >
//             <option>All Time</option>
//             <option>This Month</option>
//             <option>Last Month</option>
//           </Form.Select>

//           <Button
//             variant="secondary"
//             onClick={() => {
//               setShowRangeModal(true);
//               setSelectedRangeService("House Painters");
//               fetchRangesFor("House Painters");
//             }}
//             style={{ whiteSpace: "nowrap", fontSize: "13px" }}
//           >
//             <IoMdSettings /> Setting
//           </Button>
//         </div>
//       </div>

//       {/* House Painting Performance */}
//       <div className="container py-4">
//         <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
//           🏠 House Painting Performance
//         </h6>
//         <div className="d-flex gap-3 align-items-center mb-3">
//           <div className="d-flex flex-column">
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ fontWeight: "bold", fontSize: "14px" }}
//             >
//               <span style={{ color: "#2b4eff" }}>
//                 Total Leads: {housePaintingLeads}
//               </span>
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ fontWeight: "bold", fontSize: "14px" }}
//             >
//               <span
//                 style={{
//                   color: getRangeColor(
//                     "House Painters",
//                     "avgGSV",
//                     avgGsvHousePainting
//                   ),
//                 }}
//               >
//                 Avg. GSV: ₹{avgGsvHousePainting.toFixed(2)}
//               </span>
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3"
//               style={{ fontWeight: "bold", fontSize: "14px" }}
//             >
//               <span
//                 style={{
//                   color: getRangeColor(
//                     "House Painters",
//                     "rating",
//                     ratingHousePainting
//                   ),
//                 }}
//               >
//                 Rating: {ratingHousePainting.toFixed(1)} ★
//               </span>
//             </div>

//             <div
//               className="border rounded-pill p-2 px-3"
//               style={{ fontWeight: "bold", fontSize: "14px" }}
//             >
//               <span
//                 style={{
//                   color: getRangeColor(
//                     "House Painters",
//                     "strikes",
//                     strikesHousePainting
//                   ),
//                 }}
//               >
//                 Strikes: {strikesHousePainting}
//               </span>
//             </div>
//           </div>

//           <div
//             className="border rounded p-3 text-center shadow-sm"
//             style={{
//               width: "25%",
//               fontWeight: "bold",
//               fontSize: "12px",
//               borderColor: "#e6a100 !important",
//             }}
//           >
//             <span
//               style={{
//                 fontSize: "30px",
//                 color: getRangeColor(
//                   "House Painters",
//                   "surveyPercentage",
//                   surveyPctHousePainting
//                 ),
//               }}
//             >
//               {surveyPctHousePainting.toFixed(0)}%
//             </span>
//             <br />
//             <span style={{ color: "#6c757d" }}>Survey({startedHP})</span>
//           </div>

//           <div
//             className="border rounded p-3 text-center shadow-sm"
//             style={{
//               width: "25%",
//               fontWeight: "bold",
//               fontSize: "12px",
//               borderColor: "#df2020 !important",
//             }}
//           >
//             <span
//               style={{
//                 fontSize: "30px",
//                 color: getRangeColor(
//                   "House Painters",
//                   "hiringPercentage",
//                   acceptedHP
//                 ),
//               }}
//             >
//               {acceptedHP.toFixed(0)}%
//             </span>
//             <br />
//             <span style={{ color: "#6c757d" }}>
//               Hiring({Math.round((acceptedHP / 100) * housePaintingLeads)})
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Deep Cleaning Performance */}
//       <div className="container py-4">
//         <h6 style={{ fontWeight: "bold", fontSize: "15px" }}>
//           🧹 Deep Cleaning Performance
//         </h6>
//         <div className="d-flex gap-3 align-items-center mb-3">
//           <div className="d-flex flex-column">
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ fontWeight: "bold", fontSize: "14px" }}
//             >
//               <span style={{ color: "#d97706" }}>
//                 Total Leads: {deepCleaningLeads}
//               </span>
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ fontWeight: "bold", fontSize: "14px" }}
//             >
//               <span
//                 style={{
//                   // Deep Cleaning avgGSV ALWAYS blue per request
//                   color: "#2b4eff",
//                 }}
//               >
//                 Avg. GSV: ₹{avgGsvDeepCleaning.toFixed(2)}
//               </span>
//             </div>
//             <div
//               className="border rounded-pill p-2 px-3 mb-2"
//               style={{ fontWeight: "bold", fontSize: "14px" }}
//             >
//               <span
//                 style={{
//                   color: getRangeColor(
//                     "Deep Cleaning",
//                     "rating",
//                     ratingDeepCleaning
//                   ),
//                 }}
//               >
//                 Rating: {ratingDeepCleaning.toFixed(1)} ★
//               </span>
//             </div>

//             <div
//               className="border rounded-pill p-2 px-3"
//               style={{ fontWeight: "bold", fontSize: "14px" }}
//             >
//               <span
//                 style={{
//                   color: getRangeColor(
//                     "Deep Cleaning",
//                     "strikes",
//                     strikesDeepCleaning
//                   ),
//                 }}
//               >
//                 Strikes: {strikesDeepCleaning}
//               </span>
//             </div>
//           </div>

//           <div
//             className="border rounded p-3 text-center shadow-sm"
//             style={{
//               width: "25%",
//               fontWeight: "bold",
//               fontSize: "12px",
//               borderColor: "#198754 !important",
//             }}
//           >
//             <span
//               style={{
//                 fontSize: "30px",
//                 color: getRangeColor(
//                   "Deep Cleaning",
//                   "responsePercentage",
//                   surveyPctDeepCleaning
//                 ),
//               }}
//             >
//               {surveyPctDeepCleaning.toFixed(0)}%
//             </span>
//             <br />
//             <span style={{ color: "#6c757d" }}>
//               Response(
//               {Math.round((surveyPctDeepCleaning / 100) * deepCleaningLeads)})
//             </span>
//           </div>

//           <div
//             className="border rounded p-3 text-center shadow-sm"
//             style={{
//               width: "25%",
//               fontWeight: "bold",
//               fontSize: "12px",
//               borderColor: "#e6a100 !important",
//             }}
//           >
//             <span
//               style={{
//                 fontSize: "30px",
//                 color: getRangeColor(
//                   "Deep Cleaning",
//                   "cancellationPercentage",
//                   cancellationPctDeepCleaning
//                 ),
//               }}
//             >
//               {cancellationPctDeepCleaning.toFixed(0)}%
//             </span>
//             <br />
//             <span style={{ color: "#6c757d" }}>
//               Cancellation(
//               {Math.round(
//                 (cancellationPctDeepCleaning / 100) * deepCleaningLeads
//               )}
//               )
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Vendor Performance Tables */}
//       <div>
//         <h5 style={{ fontSize: "16px" }}>Vendor Performance</h5>
//         <div className="mb-3">
//           <Button
//             variant={
//               selectedService === "House Painters" ? "danger" : "secondary"
//             }
//             onClick={() => setSelectedService("House Painters")}
//             className="me-2"
//             style={{ fontSize: "12px" }}
//           >
//             House Painting Performance
//           </Button>
//           <Button
//             variant={
//               selectedService === "Deep Cleaning" ? "danger" : "secondary"
//             }
//             onClick={() => setSelectedService("Deep Cleaning")}
//             style={{ fontSize: "12px" }}
//           >
//             Deep Cleaning Performance
//           </Button>
//         </div>

//         {selectedService === "House Painters" ? (
//           <Table striped bordered hover>
//             <thead>
//               <tr style={{ fontSize: "12px", textAlign: "center" }}>
//                 <th>Vendor Name</th>
//                 <th>Total Leads</th>
//                 <th>Jobs Started</th>
//                 <th>Leads Responded</th>
//                 <th>Response %</th>
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

//       {/* RANGE MODAL */}
//       <Modal
//         show={showRangeModal}
//         onHide={() => {
//           setShowRangeModal(false);
//           setIsEditMode(false);
//         }}
//         size="lg"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>Set Ranges - {selectedRangeService}</Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <div className="mb-3">
//             <Form.Check
//               inline
//               label="House Painters"
//               type="radio"
//               disabled={isEditMode}
//               checked={selectedRangeService === "House Painters"}
//               onChange={() => {
//                 setSelectedRangeService("House Painters");
//                 fetchRangesFor("House Painters");
//               }}
//             />
//             <Form.Check
//               inline
//               label="Deep Cleaning"
//               type="radio"
//               disabled={isEditMode}
//               checked={selectedRangeService === "Deep Cleaning"}
//               onChange={() => {
//                 setSelectedRangeService("Deep Cleaning");
//                 fetchRangesFor("Deep Cleaning");
//               }}
//             />
//           </div>

//           <div style={styles.rangeColorLabelRow}>
//             <div></div>
//             <div></div>
//             <div style={{ ...styles.rangeLabel, ...styles.redText }}>Red</div>
//             <div></div>
//             <div style={{ ...styles.rangeLabel, ...styles.orangeText }}>
//               Orange
//             </div>
//             <div></div>
//             <div style={{ ...styles.rangeLabel, ...styles.yellowText }}>
//               Yellow
//             </div>
//             <div></div>
//             <div style={{ ...styles.rangeLabel, ...styles.greenText }}>
//               Green
//             </div>
//             <div></div>
//           </div>
//           {getRangeMetricKeys(selectedRangeService).map((metricKey) => {
//             const range = kpiRanges[selectedRangeService]?.[metricKey] || {};

//             return (
//               <div key={metricKey} style={styles.rangeInputRow}>
//                 <div>{metricLabels[metricKey]}</div>

//                 {/* A */}
//                 <input
//                   type="number"
//                   disabled={!isEditMode}
//                   className="form-control"
//                   style={{ width: "100px" }}
//                   value={range?.a ?? ""}
//                   onChange={(e) =>
//                     updateRangeValue(metricKey, "a", e.target.value)
//                   }
//                 />

//                 <div style={{ ...styles.vLine, ...styles.redLine }} />

//                 {/* B */}
//                 <input
//                   type="number"
//                   disabled={!isEditMode}
//                   className="form-control"
//                   style={{ width: "100px" }}
//                   value={range?.b ?? ""}
//                   onChange={(e) =>
//                     updateRangeValue(metricKey, "b", e.target.value)
//                   }
//                 />

//                 <div style={{ ...styles.vLine, ...styles.orangeLine }} />

//                 {/* C */}
//                 <input
//                   type="number"
//                   disabled={!isEditMode}
//                   className="form-control"
//                   style={{ width: "100px" }}
//                   value={range?.c ?? ""}
//                   onChange={(e) =>
//                     updateRangeValue(metricKey, "c", e.target.value)
//                   }
//                 />

//                 <div style={{ ...styles.vLine, ...styles.yellowLine }} />

//                 {/* D */}
//                 <input
//                   type="number"
//                   disabled={!isEditMode}
//                   className="form-control"
//                   style={{ width: "100px" }}
//                   value={range?.d ?? ""}
//                   onChange={(e) =>
//                     updateRangeValue(metricKey, "d", e.target.value)
//                   }
//                 />

//                 <div style={{ ...styles.vLine, ...styles.greenLine }} />

//                 {/* E */}
//                 <input
//                   type="number"
//                   disabled={!isEditMode}
//                   className="form-control"
//                   style={{ width: "100px" }}
//                   value={range?.e ?? ""}
//                   onChange={(e) =>
//                     updateRangeValue(metricKey, "e", e.target.value)
//                   }
//                 />
//               </div>
//             );
//           })}
//         </Modal.Body>

//         <Modal.Footer>
//           {!isEditMode ? (
//             <>
//               <Button variant="primary" onClick={() => setIsEditMode(true)}>
//                 Edit
//               </Button>
//               <Button
//                 variant="secondary"
//                 onClick={() => {
//                   setShowRangeModal(false);
//                   setIsEditMode(false);
//                 }}
//               >
//                 Close
//               </Button>
//             </>
//           ) : (
//             <>
//               <Button variant="success" onClick={saveRanges}>
//                 Save Ranges
//               </Button>
//               <Button
//                 variant="secondary"
//                 onClick={() => {
//                   setIsEditMode(false);
//                   fetchRangesFor(selectedRangeService);
//                 }}
//               >
//                 Cancel
//               </Button>
//             </>
//           )}
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// };

// export default PerformanceDashboard;

// const styles = {
//   rangeColorLabelRow: {
//     display: "grid",
//     gridTemplateColumns: "100px repeat(4, 100px 20px) 100px",
//     alignItems: "center",
//     marginBottom: "5px",
//     // paddingLeft: "3px",
//   },
//   rangeLabel: {
//     textAlign: "center",
//     fontWeight: 600,
//     fontSize: "14px",
//     transform: "translateY(-5px)",
//     // transform: "translatex(30px)",
//   },
//   redText: { color: "#df2020" },
//   orangeText: { color: "#ff8c00" },
//   yellowText: { color: "#fcce00ff" },
//   greenText: { color: "#198754" },
//   rangeInputRow: {
//     display: "grid",
//     gridTemplateColumns: "100px repeat(4, 100px 0px) 100px",
//     alignItems: "center",
//     gap: "10px",
//     marginBottom: "10px",
//   },
//   vLine: {
//     width: "2px",
//     height: "38px",
//     margin: "0 auto",
//   },
//   redLine: { backgroundColor: "#df2020" },
//   orangeLine: { backgroundColor: "#ff8c00" },
//   yellowLine: { backgroundColor: "#fcce00ff" },
//   greenLine: { backgroundColor: "#198754" },
// };


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

  const [cityOptions, setCityOptions] = useState([]); // ✅ NEW
  const [cityLoading, setCityLoading] = useState(false); // ✅ NEW
  const [cityError, setCityError] = useState(""); // ✅ NEW

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

  // metrics that are reversed (descending ranges)
  const reversedMetrics = new Set(["strikes", "cancellationPercentage"]);

  // CORRECTED COLOR RANGE CHECKER
  const getRangeColor = (serviceName, metricKey, rawValue) => {
    const ranges = kpiRanges[serviceName];

    // Fallback for missing data
    if (!ranges || !ranges[metricKey]) {
      if (serviceName === "Deep Cleaning" && metricKey === "avgGSV") {
        return "#2b4eff"; // Forced blue
      }
      return "#000000";
    }

    // Special-case: Deep Cleaning avgGSV ALWAYS blue
    if (serviceName === "Deep Cleaning" && metricKey === "avgGSV") {
      return "#2b4eff";
    }

    const value = parseFloat(rawValue);
    if (Number.isNaN(value)) return "#000000";

    const { a, b, c, d, e } = ranges[metricKey] || {};

    // 🟣 NEW RULE: If 4 or more range fields are zero → use GRAY
    const zeroCount = [a, b, c, d, e].filter((v) => v === 0).length;
    if (zeroCount >= 4) {
      return "#808080"; // Gray color for incomplete ranges
    }

    // Reversed metrics (strikes, cancellationPercentage)
    if (reversedMetrics.has(metricKey)) {
      if (value >= a) return "#df2020"; // Red
      if (value >= b) return "#ff8c00"; // Orange
      if (value >= c) return "#fcce00ff"; // Yellow
      if (value >= d) return "#198754"; // Green
      return "#198754";
    }

    // Normal ascending logic
    if (value >= a && value < b) return "#df2020"; // Red
    if (value >= b && value < c) return "#ff8c00"; // Orange
    if (value >= c && value < d) return "#fcce00ff"; // Yellow
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
      ✅ Load Cities from API
    --------------------------- */
  useEffect(() => {
    const fetchCities = async () => {
      setCityLoading(true);
      setCityError("");
      try {
        const res = await axios.get("http://localhost:9000/api/city/city-list");

        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const cities = list
          .map((x) => String(x?.city || "").trim())
          .filter(Boolean);

        // unique + sort
        const uniqueSorted = Array.from(new Set(cities)).sort((a, b) =>
          a.localeCompare(b)
        );

        setCityOptions(uniqueSorted);

        // If current city was a static one and not in fetched list, keep "All Cities"
        // (no forced change needed)
      } catch (err) {
        console.error("Error fetching cities:", err);
        setCityError("Failed to load cities");
        setCityOptions([]); // keep dropdown usable with All Cities only
      } finally {
        setCityLoading(false);
      }
    };

    fetchCities();
  }, []);

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
          `${BASE_URL}/bookings/overall?city=${cityParam}&period=${periodParam}`
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
        setCancellationPctDeepCleaning(data.deepCleaning.cancellationPercentage);
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
      - ascending checks for most
      - descending checks for strikes & cancellationPercentage
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

        // If metric is reversed (strikes or cancellation %), expect descending order
        if (reversedMetrics.has(metricKey)) {
          if (!(a > b && b > c && c > d && d > e)) {
            alert(
              `Range for ${metricLabels[metricKey]} must satisfy a > b > c > d > e (descending ranges)`
            );
            return;
          }
        } else {
          if (!(a < b && b < c && c < d && d < e)) {
            alert(
              `Range for ${metricLabels[metricKey]} must satisfy a < b < c < d < e (ascending ranges)`
            );
            return;
          }
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
      alert("Error saving ranges. Check console for details.");
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

    // Deep Cleaning → REMOVE avgGSV from modal!
    return ["responsePercentage", "cancellationPercentage", "rating", "strikes"];
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
            disabled={cityLoading}
            title={cityError || ""}
          >
            <option>All Cities</option>

            {/* ✅ Dynamic cities */}
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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
              borderColor: "#df2020 !important",
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
                  // Deep Cleaning avgGSV ALWAYS blue per request
                  color: "#2b4eff",
                }}
              >
                Avg. GSV: ₹{avgGsvDeepCleaning.toFixed(2)}
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
            variant={selectedService === "Deep Cleaning" ? "danger" : "secondary"}
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

                {/* A */}
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "100px" }}
                  value={range?.a ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "a", e.target.value)
                  }
                />

                <div style={{ ...styles.vLine, ...styles.redLine }} />

                {/* B */}
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "100px" }}
                  value={range?.b ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "b", e.target.value)
                  }
                />

                <div style={{ ...styles.vLine, ...styles.orangeLine }} />

                {/* C */}
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "100px" }}
                  value={range?.c ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "c", e.target.value)
                  }
                />

                <div style={{ ...styles.vLine, ...styles.yellowLine }} />

                {/* D */}
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "100px" }}
                  value={range?.d ?? ""}
                  onChange={(e) =>
                    updateRangeValue(metricKey, "d", e.target.value)
                  }
                />

                <div style={{ ...styles.vLine, ...styles.greenLine }} />

                {/* E */}
                <input
                  type="number"
                  disabled={!isEditMode}
                  className="form-control"
                  style={{ width: "100px" }}
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
    gridTemplateColumns: "100px repeat(4, 100px 20px) 100px",
    alignItems: "center",
    marginBottom: "5px",
    // paddingLeft: "3px",
  },
  rangeLabel: {
    textAlign: "center",
    fontWeight: 600,
    fontSize: "14px",
    transform: "translateY(-5px)",
    // transform: "translatex(30px)",
  },
  redText: { color: "#df2020" },
  orangeText: { color: "#ff8c00" },
  yellowText: { color: "#fcce00ff" },
  greenText: { color: "#198754" },
  rangeInputRow: {
    display: "grid",
    gridTemplateColumns: "100px repeat(4, 100px 0px) 100px",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  vLine: {
    width: "2px",
    height: "38px",
    margin: "0 auto",
  },
  redLine: { backgroundColor: "#df2020" },
  orangeLine: { backgroundColor: "#ff8c00" },
  yellowLine: { backgroundColor: "#fcce00ff" },
  greenLine: { backgroundColor: "#198754" },
};
