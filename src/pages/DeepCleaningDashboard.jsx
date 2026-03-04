// import React, { useState, useMemo, useEffect } from "react";
// import {
//   Table,
//   Container,
//   Row,
//   Col,
//   Form,
//   Modal,
//   Button,
// } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import { BASE_URL } from "../utils/config";

// /** ✅ MASTER DATA MUST MATCH DB EXACTLY (case + spelling) */
// const DEEP_CLEANING_DATA = [
//   {
//     category: "Furnished apartment",
//     subcategories: [
//       {
//         subcategory: "1 BHK Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "2 BHK Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "3 BHK Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "4 BHK Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "5+ BHK Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//     ],
//   },
//   {
//     category: "Unfurnished apartment",
//     subcategories: [
//       { subcategory: "1 BHK Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "2 BHK Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "3 BHK Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "4 BHK Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "5+ BHK Cleaning", services: ["Classic", "Premium"] },
//     ],
//   },
//   {
//     category: "Book by room",
//     subcategories: [
//       {
//         subcategory: "Bedroom Cleaning",
//         services: ["Unfurnished", "Furnished"],
//       },
//       {
//         subcategory: "Living Room Cleaning",
//         services: ["Unfurnished", "Furnished"],
//       },
//       {
//         subcategory: "Kitchen Cleaning",
//         services: [
//           "Occupied Kitchen",
//           "Occupied Kitchen With Appliances",
//           "Empty Kitchen",
//           "Empty Kitchen With Appliances",
//         ],
//       },
//       { subcategory: "Bathroom Cleaning", services: [] },
//       {
//         subcategory: "Balcony Cleaning",
//         services: ["Small (Upto 3 ft width)", "Big (larger than 3 ft)"],
//       },
//     ],
//   },
//   {
//     category: "Furnished bungalow/duplex",
//     subcategories: [
//       {
//         subcategory: "<1200 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "1200-2000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "2000-3000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "3000-4000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "4000-5000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "5000-6000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//       {
//         subcategory: "6000-7000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium", "Platinum"],
//       },
//     ],
//   },
//   {
//     category: "Unfurnished bungalow/duplex",
//     subcategories: [
//       {
//         subcategory: "<1200 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium"],
//       },
//       {
//         subcategory: "1200-2000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium"],
//       },
//       {
//         subcategory: "2000-3000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium"],
//       },
//       {
//         subcategory: "3000-4000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium"],
//       },
//       {
//         subcategory: "4000-5000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium"],
//       },
//       {
//         subcategory: "5000-6000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium"],
//       },
//       {
//         subcategory: "6000-7000 sqft Bungalow Cleaning",
//         services: ["Classic", "Premium"],
//       },
//     ],
//   },
//   {
//     category: "Mini services",
//     subcategories: [
//       {
//         subcategory: "Kitchen Appliances Cleaning",
//         services: [
//           "Chimney",
//           "Microwave",
//           "Stove",
//           "Single Door Fridge",
//           "Double Door Fridge",
//         ],
//       },
//       {
//         subcategory: "Sofa & Upholstery Wet Shampooing",
//         services: [
//           "Sofa (5 seats)",
//           "Carpet (upto 25 sqft)",
//           "Cushion Chair",
//           "Mattress",
//         ],
//       },

//       // ✅ These are NO SERVICE in DB
//       { subcategory: "Utensil Removal & Placement", services: [] },

//       // ✅ DB has this as a subcategory itself, service = ""
//       { subcategory: "Cabinet Cleaning (Upto 2)", services: [] },

//       { subcategory: "Furniture Wet Wiping", services: [] },
//       { subcategory: "Ceiling Dusting & Cobweb Removal", services: [] },
//     ],
//   },
// ];

// const DeepCleaningDashboard = () => {
//   const [city, setCity] = useState("All Cities");
//   const navigate = useNavigate();

//   const [minOrder, setMinOrder] = useState("");
//   const [minOrderLoading, setMinOrderLoading] = useState(false);
//   const [minOrderSaving, setMinOrderSaving] = useState(false);
//   const [minOrderError, setMinOrderError] = useState("");
//   const [serverMinOrder, setServerMinOrder] = useState("");
//   const [minOrderSuccess, setMinOrderSuccess] = useState("");

//   const [categoryFilter, setCategoryFilter] = useState("Deep Cleaning");

//   const [packages, setPackages] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [showModal, setShowModal] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   const [form, setForm] = useState({
//     category: "",
//     subcategory: "",
//     service: "",
//     totalAmount: "",
//     coinsForVendor: "",
//     teamMembers: "",
//     durationMinutes: "",
//   });

//   const [errorMessage, setErrorMessage] = useState("");
//   const [pkgSaving, setPkgSaving] = useState(false);
//   const [deletingIdState, setDeletingIdState] = useState(null);

//   const isEditMode = Boolean(editingId);
//   // ===== API helpers =====
//   const fetchMinimumOrder = async () => {
//     try {
//       setMinOrderLoading(true);
//       setMinOrderError("");
//       const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`);
//       const json = await res.json();
//       if (!json.success)
//         throw new Error(json.message || "Failed to load minimum order");

//       setMinOrder(String(json.data.amount));
//       setServerMinOrder(String(json.data.amount));
//     } catch (err) {
//       setServerMinOrder("");
//       console.warn("Minimum order GET:", err.message);
//     } finally {
//       setMinOrderLoading(false);
//     }
//   };

//   const saveMinimumOrder = async () => {
//     try {
//       setMinOrderSaving(true);
//       setMinOrderError("");
//       setMinOrderSuccess("");

//       const amountNum = Number(minOrder);
//       if (Number.isNaN(amountNum) || amountNum < 0) {
//         setMinOrderError("Enter a valid non-negative number.");
//         return;
//       }

//       const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ amount: amountNum }),
//       });

//       const json = await res.json();
//       if (!json.success)
//         throw new Error(json.message || "Failed to save minimum order");

//       await fetchMinimumOrder();
//       setMinOrderSuccess("Minimum order saved successfully.");
//     } catch (err) {
//       setMinOrderError(err.message);
//     } finally {
//       setMinOrderSaving(false);
//     }
//   };

//   const fetchPackages = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(`${BASE_URL}/deeppackage/deep-cleaning-packages`);
//       const json = await res.json();
//       if (!json.success)
//         throw new Error(json.message || "Failed to load packages");

//       const list = (json.data || []).map((p) => ({
//         id: p._id || p.id,
//         name: p.name,
//         category: p.category,
//         subcategory: p.subcategory,
//         service: p.service || "",
//         totalAmount: p.totalAmount,
//         coinsForVendor: p.coinsForVendor,
//         teamMembers: p.teamMembers,
//         durationMinutes: p.durationMinutes || 0,
//       }));

//       setPackages(list);
//     } catch (err) {
//       console.error("GET packages error:", err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createPackage = async (payload) => {
//     const res = await fetch(`${BASE_URL}/deeppackage/deep-cleaning-packages`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });
//     const json = await res.json();
//     if (!json.success)
//       throw new Error(json.message || "Failed to create package");
//     return json.data;
//   };

//   const updatePackage = async (id, payload) => {
//     const res = await fetch(
//       `${BASE_URL}/deeppackage/deep-cleaning-packages/${id}`,
//       {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       }
//     );
//     const json = await res.json();
//     if (!json.success)
//       throw new Error(json.message || "Failed to update package");
//     return json.data;
//   };

//   const deletePackageApi = async (id) => {
//     const res = await fetch(
//       `${BASE_URL}/deeppackage/deep-cleaning-packages/${id}`,
//       {
//         method: "DELETE",
//       }
//     );
//     const json = await res.json();
//     if (!json.success)
//       throw new Error(json.message || "Failed to delete package");
//     return json;
//   };

//   useEffect(() => {
//     fetchMinimumOrder();
//     fetchPackages();
//   }, []);

//   /** ✅ Options derived from master */
//   const subcategoryOptions = useMemo(() => {
//     const cat = DEEP_CLEANING_DATA.find((c) => c.category === form.category);
//     const base = cat ? cat.subcategories.map((s) => s.subcategory) : [];
//     // ✅ ensure current subcategory exists even if master mismatch in future
//     return form.subcategory && !base.includes(form.subcategory)
//       ? [form.subcategory, ...base]
//       : base;
//   }, [form.category, form.subcategory]);

//   const serviceOptions = useMemo(() => {
//     const cat = DEEP_CLEANING_DATA.find((c) => c.category === form.category);
//     const sub = cat?.subcategories.find(
//       (s) => s.subcategory === form.subcategory
//     );
//     const base = sub ? sub.services : [];
//     // ✅ ensure current service exists even if not present in master list
//     return form.service && form.service !== "" && !base.includes(form.service)
//       ? [form.service, ...base]
//       : base;
//   }, [form.category, form.subcategory, form.service]);

//   const resetForm = () => {
//     setForm({
//       category: "",
//       subcategory: "",
//       service: "",
//       totalAmount: "",
//       coinsForVendor: "",
//       teamMembers: "",
//       durationMinutes: "",
//     });
//     setErrorMessage("");
//     setEditingId(null);
//   };

//   const openAddModal = () => {
//     resetForm();
//     setShowModal(true);
//   };

//   /** ✅ FIX: Edit should set category/subcategory/service + durationMinutes */
//   const openEditModal = (pkg) => {
//     setEditingId(pkg.id);
//     setForm({
//       category: pkg.category || "",
//       subcategory: pkg.subcategory || "",
//       service: pkg.service || "",
//       totalAmount: String(pkg.totalAmount ?? ""),
//       coinsForVendor: String(pkg.coinsForVendor ?? ""),
//       teamMembers: String(pkg.teamMembers ?? ""),
//       durationMinutes: String(pkg.durationMinutes ?? ""),
//     });
//     setErrorMessage("");
//     setShowModal(true);
//   };

//   const onFormChange = (field, value) => {
//     setForm((prev) => {
//       if (field === "category")
//         return { ...prev, category: value, subcategory: "", service: "" };
//       if (field === "subcategory")
//         return { ...prev, subcategory: value, service: "" };
//       return { ...prev, [field]: value };
//     });
//   };

//   const validate = () => {
//     if (!form.category) return "Please select a category.";
//     if (!form.subcategory) return "Please select a subcategory.";

//     // ✅ if master says service exists, require it
//     if (serviceOptions.length > 0 && !form.service)
//       return "Please select a service.";

//     if (!form.totalAmount) return "Total amount is required.";
//     if (!form.coinsForVendor) return "Coins for vendor is required.";
//     if (!form.teamMembers) return "Team members needed is required.";

//     const d = Number(form.durationMinutes);
//     if (!Number.isFinite(d) || d < 30)
//       return "Duration must be at least 30 minutes.";

//     return "";
//   };

//   const handleSave = async () => {
//     const err = validate();
//     if (err) {
//       setErrorMessage(err);
//       return;
//     }
//     setErrorMessage("");

//     const payload = {
//       category: form.category,
//       subcategory: form.subcategory,
//       service: form.service || "",
//       totalAmount: Number(form.totalAmount),
//       coinsForVendor: Number(form.coinsForVendor),
//       teamMembers: Number(form.teamMembers),
//       durationMinutes: Number(form.durationMinutes),
//     };

//     try {
//       setPkgSaving(true);

//       if (editingId) {
//         const updated = await updatePackage(editingId, payload);
//         const normalized = {
//           id: updated._id || updated.id,
//           name: updated.name,
//           category: updated.category,
//           subcategory: updated.subcategory,
//           service: updated.service || "",
//           totalAmount: updated.totalAmount,
//           coinsForVendor: updated.coinsForVendor,
//           teamMembers: updated.teamMembers,
//           durationMinutes: updated.durationMinutes || 0,
//         };

//         setPackages((prev) =>
//           prev.map((p) => (p.id === editingId ? normalized : p))
//         );
//       } else {
//         const created = await createPackage(payload);
//         const normalized = {
//           id: created._id || created.id,
//           name: created.name,
//           category: created.category,
//           subcategory: created.subcategory,
//           service: created.service || "",
//           totalAmount: created.totalAmount,
//           coinsForVendor: created.coinsForVendor,
//           teamMembers: created.teamMembers,
//           durationMinutes: created.durationMinutes || 0,
//         };
//         setPackages((prev) => [normalized, ...prev]);
//       }

//       setShowModal(false);
//       resetForm();
//     } catch (e) {
//       setErrorMessage(e.message);
//     } finally {
//       setPkgSaving(false);
//     }
//   };

//   const handleDelete = async (pkg) => {
//     const ok = window.confirm(
//       `Delete package "${pkg.name || pkg.subcategory}"? This cannot be undone.`
//     );
//     if (!ok) return;

//     try {
//       setDeletingIdState(pkg.id);
//       await deletePackageApi(pkg.id);
//       setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
//     } catch (err) {
//       alert(err.message || "Failed to delete package");
//     } finally {
//       setDeletingIdState(null);
//     }
//   };

//   return (
//     <Container className="py-4">
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h5 className="fw-bold">Product Dashboard</h5>
//         <div className="d-flex gap-2">
//           <Form.Select
//             value={city}
//             onChange={(e) => setCity(e.target.value)}
//             style={{ height: "36px", fontSize: "12px" }}
//           >
//             <option>City</option>
//             <option>Bengaluru</option>
//             <option>Mumbai</option>
//           </Form.Select>

//           <Form.Select
//             value={categoryFilter}
//             onChange={(e) => {
//               const selected = e.target.value;
//               setCategoryFilter(selected);
//               if (selected === "House Painting") navigate("/product");
//             }}
//             style={{ height: "36px", fontSize: "12px" }}
//           >
//             <option>Deep Cleaning</option>
//             <option>House Painting</option>
//           </Form.Select>
//         </div>
//       </div>

//       <h5 className="fw-semibold mb-3" style={{ fontSize: "18px" }}>
//         Minimum Order (Deep Cleaning)
//       </h5>

//       <Row className="mb-2 align-items-center">
//         <Col md={5}>
//           <Form.Control
//             type="number"
//             placeholder={
//               minOrderLoading ? "Loading..." : "Minimum order amount"
//             }
//             value={minOrder}
//             onChange={(e) => setMinOrder(e.target.value)}
//             style={{ fontSize: "12px" }}
//             disabled={minOrderLoading || minOrderSaving}
//           />

//           {minOrderError && (
//             <div className="text-danger mt-1" style={{ fontSize: "12px" }}>
//               {minOrderError}
//             </div>
//           )}
//           {minOrderSuccess && (
//             <div className="text-success mt-1" style={{ fontSize: "12px" }}>
//               {minOrderSuccess}
//             </div>
//           )}

//           <div className="text-muted mt-1" style={{ fontSize: "12px" }}>
//             {serverMinOrder !== "" ? (
//               <>Current (server) value: ₹{serverMinOrder}</>
//             ) : (
//               <>No minimum order set yet.</>
//             )}
//           </div>
//         </Col>

//         <Col md={2}>
//           <Button
//             onClick={saveMinimumOrder}
//             disabled={minOrderLoading || minOrderSaving}
//             style={{
//               borderColor: "black",
//               backgroundColor: "transparent",
//               color: "black",
//               fontSize: "14px",
//             }}
//           >
//             {minOrderSaving ? "Saving..." : "Save"}
//           </Button>
//         </Col>
//       </Row>

//       <div className="d-flex justify-content-between align-items-center">
//         <h6 className="fw-bold">Deep Cleaning Products Table</h6>
//         <div className="d-flex align-items-center gap-2">
//           {loading && (
//             <span className="text-muted" style={{ fontSize: 12 }}>
//               Loading…
//             </span>
//           )}
//           <Button
//             onClick={openAddModal}
//             style={{
//               borderColor: "black",
//               backgroundColor: "transparent",
//               color: "black",
//               fontSize: "12px",
//             }}
//           >
//             Add Package
//           </Button>
//           <Button
//             style={{
//               borderColor: "black",
//               backgroundColor: "transparent",
//               color: "black",
//               fontSize: "12px",
//             }}
//             onClick={()=>navigate("/admincleaningcatalogeditor")}
//           >
//             Website Packages
//           </Button>
//         </div>
//       </div>

//       <Table bordered className="mt-2">
//         <thead style={{ textAlign: "center", fontSize: "14px" }}>
//           <tr>
//             <th>Package Name</th>
//             <th>Category</th>
//             <th>Subcategory</th>
//             <th>Service</th>
//             <th>Total Amount</th>
//             <th>Coins for Vendor</th>
//             <th>Team Members Needed</th>
//             <th>Duration (mins)</th>
//             <th>Actions</th>
//           </tr>
//         </thead>

//         <tbody style={{ textAlign: "center", fontSize: "12px" }}>
//           {packages.length === 0 ? (
//             <tr>
//               <td colSpan={9} className="text-muted">
//                 No packages yet. Click “Add Package”.
//               </td>
//             </tr>
//           ) : (
//             packages.map((pkg) => (
//               <tr key={pkg.id}>
//                 <td>
//                   {pkg.name ||
//                     (pkg.service
//                       ? `${pkg.subcategory} - ${pkg.service}`
//                       : pkg.subcategory)}
//                 </td>
//                 <td>{pkg.category}</td>
//                 <td>{pkg.subcategory}</td>
//                 <td>{pkg.service || "-"}</td>
//                 <td>{pkg.totalAmount}</td>
//                 <td>{pkg.coinsForVendor}</td>
//                 <td>{pkg.teamMembers}</td>
//                 <td>{pkg.durationMinutes}</td>
//                 <td>
//                   <div className="d-flex gap-2 justify-content-center">
//                     <Button
//                       variant="black"
//                       onClick={() => openEditModal(pkg)}
//                       style={{ borderColor: "black", fontSize: "12px" }}
//                       disabled={pkgSaving || deletingIdState === pkg.id}
//                     >
//                       Edit
//                     </Button>
//                     {/* <Button
//                       variant="outline-danger"
//                       onClick={() => handleDelete(pkg)}
//                       style={{ fontSize: "12px" }}
//                       disabled={pkgSaving || deletingIdState === pkg.id}
//                     >
//                       {deletingIdState === pkg.id ? "Deleting..." : "Delete"}
//                     </Button> */}
//                   </div>
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </Table>

//       {/* Add/Edit Modal */}
//       <Modal show={showModal} onHide={() => setShowModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: "16px" }}>
//             {editingId ? "Edit Package" : "Add Package"}
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Category</Form.Label>
//                 <Form.Select
//                   value={form.category}
//                   onChange={(e) => onFormChange("category", e.target.value)}
//                   disabled={isEditMode}
//                 >
//                   <option value="">Select Category</option>
//                   {DEEP_CLEANING_DATA.map((cat) => (
//                     <option key={cat.category} value={cat.category}>
//                       {cat.category}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Subcategory</Form.Label>
//                 <Form.Select
//                   value={form.subcategory}
//                   onChange={(e) => onFormChange("subcategory", e.target.value)}
//                   disabled={isEditMode || !form.category}
//                 >
//                   <option value="">Select Subcategory</option>
//                   {subcategoryOptions.map((sc) => (
//                     <option key={sc} value={sc}>
//                       {sc}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Service</Form.Label>
//                 <Form.Select
//                   value={form.service}
//                   onChange={(e) => onFormChange("service", e.target.value)}
//                   disabled={
//                     isEditMode ||
//                     !form.subcategory ||
//                     serviceOptions.length === 0
//                   }
//                 >
//                   <option value="">
//                     {serviceOptions.length
//                       ? "Select Service"
//                       : "No service (optional)"}
//                   </option>
//                   {serviceOptions.map((sv) => (
//                     <option key={sv} value={sv}>
//                       {sv}
//                     </option>
//                   ))}
//                 </Form.Select>

//                 <div className="form-text">
//                   {serviceOptions.length === 0
//                     ? "This subcategory has no service variants."
//                     : ""}
//                 </div>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Total Amount</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.totalAmount}
//                   onChange={(e) => onFormChange("totalAmount", e.target.value)}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Coins for Vendor</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.coinsForVendor}
//                   onChange={(e) =>
//                     onFormChange("coinsForVendor", e.target.value)
//                   }
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Team Members Needed</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.teamMembers}
//                   onChange={(e) => onFormChange("teamMembers", e.target.value)}
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Duration (Minutes)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   placeholder="Eg: 300"
//                   value={form.durationMinutes}
//                   onChange={(e) =>
//                     onFormChange("durationMinutes", e.target.value)
//                   }
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {errorMessage && (
//             <div className="text-danger" style={{ fontSize: "12px" }}>
//               {errorMessage}
//             </div>
//           )}
//         </Modal.Body>

//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>
//             Cancel
//           </Button>

//           <Button
//             variant="transparent"
//             onClick={handleSave}
//             style={{ borderColor: "black" }}
//             disabled={pkgSaving}
//           >
//             {pkgSaving
//               ? "Saving..."
//               : editingId
//               ? "Save Changes"
//               : "Add Package"}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default DeepCleaningDashboard;



// import React, { useState, useMemo, useEffect } from "react";
// import { Table, Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import { BASE_URL } from "../utils/config";
// import axios from "axios";

// /** ✅ MASTER DATA MUST MATCH DB EXACTLY (case + spelling) */
// const DEEP_CLEANING_DATA = [
//   {
//     category: "Furnished apartment",
//     subcategories: [
//       { subcategory: "1 BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "2 BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "3 BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "4 BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "5+ BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
//     ],
//   },
//   {
//     category: "Unfurnished apartment",
//     subcategories: [
//       { subcategory: "1 BHK Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "2 BHK Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "3 BHK Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "4 BHK Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "5+ BHK Cleaning", services: ["Classic", "Premium"] },
//     ],
//   },
//   {
//     category: "Book by room",
//     subcategories: [
//       { subcategory: "Bedroom Cleaning", services: ["Unfurnished", "Furnished"] },
//       { subcategory: "Living Room Cleaning", services: ["Unfurnished", "Furnished"] },
//       {
//         subcategory: "Kitchen Cleaning",
//         services: [
//           "Occupied Kitchen",
//           "Occupied Kitchen With Appliances",
//           "Empty Kitchen",
//           "Empty Kitchen With Appliances",
//         ],
//       },
//       { subcategory: "Bathroom Cleaning", services: [] }, // service=""
//       {
//         subcategory: "Balcony Cleaning",
//         services: ["Small (Upto 3 ft width)", "Big (larger than 3 ft)"],
//       },
//     ],
//   },
//   {
//     category: "Unfurnished bungalow/duplex",
//     subcategories: [
//       { subcategory: "<1200 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "1200-2000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "2000-3000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "3000-4000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "4000-5000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "5000-6000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
//       { subcategory: "6000-7000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
//     ],
//   },
//   {
//     category: "Furnished bungalow/duplex",
//     subcategories: [
//       { subcategory: "<1200 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "1200-2000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "2000-3000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "3000-4000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "4000-5000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "5000-6000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
//       { subcategory: "6000-7000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
//     ],
//   },
//   {
//     category: "Mini services",
//     subcategories: [
//       {
//         subcategory: "Kitchen Appliances Cleaning",
//         services: ["Chimney", "Microwave", "Stove", "Single Door Fridge", "Double Door Fridge"],
//       },
//       {
//         subcategory: "Sofa & Upholstery Wet Shampooing",
//         services: ["Sofa (5 seats)", "Carpet (upto 25 sqft)", "Cushion Chair", "Mattress"],
//       },
//       { subcategory: "Utensil Removal & Placement", services: [] },
//       { subcategory: "Cabinet Cleaning (Upto 2)", services: [] },
//       { subcategory: "Furniture Wet Wiping", services: [] },
//       { subcategory: "Ceiling Dusting & Cobweb Removal", services: [] },
//     ],
//   },
// ];

// const DeepCleaningDashboard = () => {
//   const navigate = useNavigate();

//   // ✅ City dropdown now from DB
//   const [cities, setCities] = useState([]);
//   const [cityId, setCityId] = useState("");

//   const selectedCityName = useMemo(() => {
//     const c = cities.find((x) => String(x?._id) === String(cityId));
//     return c?.city || "";
//   }, [cities, cityId]);

//   const [minOrder, setMinOrder] = useState("");
//   const [minOrderLoading, setMinOrderLoading] = useState(false);
//   const [minOrderSaving, setMinOrderSaving] = useState(false);
//   const [minOrderError, setMinOrderError] = useState("");
//   const [serverMinOrder, setServerMinOrder] = useState("");
//   const [minOrderSuccess, setMinOrderSuccess] = useState("");

//   const [categoryFilter, setCategoryFilter] = useState("Deep Cleaning");

//   const [packages, setPackages] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [showModal, setShowModal] = useState(false);
//   const [editingId, setEditingId] = useState(null);

//   const [form, setForm] = useState({
//     category: "",
//     subcategory: "",
//     service: "",
//     totalAmount: "",
//     coinsForVendor: "",
//     teamMembers: "",
//     durationMinutes: "",
//   });

//   const [errorMessage, setErrorMessage] = useState("");
//   const [pkgSaving, setPkgSaving] = useState(false);

//   const isEditMode = Boolean(editingId);

//   // =========================
//   // ✅ ORDER MAP (THIS IS THE FIX)
//   // =========================
//   const ORDER_MAP = useMemo(() => {
//     const categoryIndex = new Map();
//     const subcategoryIndex = new Map(); // key: `${cat}__${sub}`
//     const serviceIndex = new Map(); // key: `${cat}__${sub}__${service}`

//     DEEP_CLEANING_DATA.forEach((catObj, cIdx) => {
//       categoryIndex.set(catObj.category, cIdx);

//       catObj.subcategories.forEach((subObj, sIdx) => {
//         subcategoryIndex.set(`${catObj.category}__${subObj.subcategory}`, sIdx);

//         (subObj.services || []).forEach((sv, vIdx) => {
//           serviceIndex.set(`${catObj.category}__${subObj.subcategory}__${sv}`, vIdx);
//         });
//       });
//     });

//     return { categoryIndex, subcategoryIndex, serviceIndex };
//   }, []);

//   // ✅ Final sorted list (render this instead of packages)
//   const sortedPackages = useMemo(() => {
//     const big = 999999;

//     const getCatIdx = (cat) => (ORDER_MAP.categoryIndex.has(cat) ? ORDER_MAP.categoryIndex.get(cat) : big);
//     const getSubIdx = (cat, sub) =>
//       ORDER_MAP.subcategoryIndex.has(`${cat}__${sub}`) ? ORDER_MAP.subcategoryIndex.get(`${cat}__${sub}`) : big;

//     const getSvIdx = (cat, sub, sv) => {
//       // if service is empty and master has no services, keep it early
//       if (!sv) return -1;
//       const key = `${cat}__${sub}__${sv}`;
//       return ORDER_MAP.serviceIndex.has(key) ? ORDER_MAP.serviceIndex.get(key) : big;
//     };

//     return [...packages].sort((a, b) => {
//       const c1 = getCatIdx(a.category);
//       const c2 = getCatIdx(b.category);
//       if (c1 !== c2) return c1 - c2;

//       const s1 = getSubIdx(a.category, a.subcategory);
//       const s2 = getSubIdx(b.category, b.subcategory);
//       if (s1 !== s2) return s1 - s2;

//       const v1 = getSvIdx(a.category, a.subcategory, a.service);
//       const v2 = getSvIdx(b.category, b.subcategory, b.service);
//       if (v1 !== v2) return v1 - v2;

//       // stable fallback
//       const n1 = (a.name || "").toLowerCase();
//       const n2 = (b.name || "").toLowerCase();
//       if (n1 !== n2) return n1.localeCompare(n2);

//       const amt1 = Number(a.totalAmount || 0);
//       const amt2 = Number(b.totalAmount || 0);
//       return amt1 - amt2;
//     });
//   }, [packages, ORDER_MAP]);

//   // =========================
//   // Fetch city list
//   // =========================
//   useEffect(() => {
//     const fetchCities = async () => {
//       try {
//         const res = await axios.get(`${BASE_URL}/city/city-list`);
//         const list = Array.isArray(res?.data?.data) ? res.data.data : [];
//         setCities(list);
//         if (list.length > 0) setCityId(list[0]?._id || "");
//       } catch (e) {
//         console.error("City list error:", e);
//         setCities([]);
//         setCityId("");
//       }
//     };

//     fetchCities();
//   }, []);

//   // =========================
//   // Minimum order APIs
//   // =========================
//   const fetchMinimumOrder = async () => {
//     try {
//       setMinOrderLoading(true);
//       setMinOrderError("");
//       const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`);
//       const json = await res.json();
//       if (!json.success) throw new Error(json.message || "Failed to load minimum order");
//       setMinOrder(String(json.data.amount));
//       setServerMinOrder(String(json.data.amount));
//     } catch (err) {
//       setServerMinOrder("");
//       console.warn("Minimum order GET:", err.message);
//     } finally {
//       setMinOrderLoading(false);
//     }
//   };

//   const saveMinimumOrder = async () => {
//     try {
//       setMinOrderSaving(true);
//       setMinOrderError("");
//       setMinOrderSuccess("");

//       const amountNum = Number(minOrder);
//       if (Number.isNaN(amountNum) || amountNum < 0) {
//         setMinOrderError("Enter a valid non-negative number.");
//         return;
//       }

//       const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ amount: amountNum }),
//       });

//       const json = await res.json();
//       if (!json.success) throw new Error(json.message || "Failed to save minimum order");

//       await fetchMinimumOrder();
//       setMinOrderSuccess("Minimum order saved successfully.");
//     } catch (err) {
//       setMinOrderError(err.message);
//     } finally {
//       setMinOrderSaving(false);
//     }
//   };

//   // =========================
//   // ✅ Deep Cleaning APIs
//   // =========================
//   const fetchPackagesByCity = async () => {
//     try {
//       if (!cityId) {
//         setPackages([]);
//         return;
//       }

//       setLoading(true);

//       const res = await fetch(`${BASE_URL}/deeppackage/deep-cleaning-packages/by-city/${cityId}`);
//       const json = await res.json();
//       if (!json.success) throw new Error(json.message || "Failed to load packages");

//       const list = (json.data || []).map((p) => ({
//         id: p._id,
//         name: p.name,
//         category: p.category,
//         subcategory: p.subcategory,
//         service: p.service || "",
//         totalAmount: p.totalAmount,
//         coinsForVendor: p.coinsForVendor,
//         teamMembers: p.teamMembers,
//         durationMinutes: p.durationMinutes || 0,
//       }));

//       setPackages(list);
//     } catch (err) {
//       console.error("GET packages by city error:", err.message);
//       setPackages([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createPackage = async (payload) => {
//     try {
//       const res = await fetch(`${BASE_URL}/deeppackage/deep-cleaning-packages`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const json = await res.json();
//       if (!json.success) throw new Error(json.message || "Failed to create package");
//       return json.data;
//     } catch (e) {
//       throw e;
//     }
//   };

//   const updatePackage = async (id, payload) => {
//     try {
//       const res = await fetch(`${BASE_URL}/deeppackage/deep-cleaning-packages/${id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const json = await res.json();
//       if (!json.success) throw new Error(json.message || "Failed to update package");
//       return json.data;
//     } catch (e) {
//       throw e;
//     }
//   };

//   useEffect(() => {
//     fetchMinimumOrder();
//   }, []);

//   useEffect(() => {
//     fetchPackagesByCity();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [cityId]);

//   /** ✅ Options derived from master */
//   const subcategoryOptions = useMemo(() => {
//     const cat = DEEP_CLEANING_DATA.find((c) => c.category === form.category);
//     const base = cat ? cat.subcategories.map((s) => s.subcategory) : [];
//     return form.subcategory && !base.includes(form.subcategory) ? [form.subcategory, ...base] : base;
//   }, [form.category, form.subcategory]);

//   const serviceOptions = useMemo(() => {
//     const cat = DEEP_CLEANING_DATA.find((c) => c.category === form.category);
//     const sub = cat?.subcategories.find((s) => s.subcategory === form.subcategory);
//     const base = sub ? sub.services : [];
//     return form.service && form.service !== "" && !base.includes(form.service) ? [form.service, ...base] : base;
//   }, [form.category, form.subcategory, form.service]);

//   const resetForm = () => {
//     setForm({
//       category: "",
//       subcategory: "",
//       service: "",
//       totalAmount: "",
//       coinsForVendor: "",
//       teamMembers: "",
//       durationMinutes: "",
//     });
//     setErrorMessage("");
//     setEditingId(null);
//   };

//   const openAddModal = () => {
//     resetForm();
//     setShowModal(true);
//   };

//   const openEditModal = (pkg) => {
//     setEditingId(pkg.id);
//     setForm({
//       category: pkg.category || "",
//       subcategory: pkg.subcategory || "",
//       service: pkg.service || "",
//       totalAmount: String(pkg.totalAmount ?? ""),
//       coinsForVendor: String(pkg.coinsForVendor ?? ""),
//       teamMembers: String(pkg.teamMembers ?? ""),
//       durationMinutes: String(pkg.durationMinutes ?? ""),
//     });
//     setErrorMessage("");
//     setShowModal(true);
//   };

//   const onFormChange = (field, value) => {
//     setForm((prev) => {
//       if (field === "category") return { ...prev, category: value, subcategory: "", service: "" };
//       if (field === "subcategory") return { ...prev, subcategory: value, service: "" };
//       return { ...prev, [field]: value };
//     });
//   };

//   const validate = () => {
//     if (!cityId) return "Please select a city first.";
//     if (!form.category) return "Please select a category.";
//     if (!form.subcategory) return "Please select a subcategory.";
//     if (serviceOptions.length > 0 && !form.service) return "Please select a service.";
//     if (!form.totalAmount) return "Total amount is required.";
//     if (!form.coinsForVendor) return "Coins for vendor is required.";
//     if (!form.teamMembers) return "Team members needed is required.";

//     const d = Number(form.durationMinutes);
//     if (!Number.isFinite(d) || d < 30) return "Duration must be at least 30 minutes.";
//     return "";
//   };

//   const handleSave = async () => {
//     try {
//       const err = validate();
//       if (err) {
//         setErrorMessage(err);
//         return;
//       }
//       setErrorMessage("");

//       const payload = {
//         cityId,
//         category: form.category,
//         subcategory: form.subcategory,
//         service: form.service || "",
//         totalAmount: Number(form.totalAmount),
//         coinsForVendor: Number(form.coinsForVendor),
//         teamMembers: Number(form.teamMembers),
//         durationMinutes: Number(form.durationMinutes),
//       };

//       setPkgSaving(true);

//       if (editingId) {
//         await updatePackage(editingId, payload);
//       } else {
//         await createPackage(payload);
//       }

//       await fetchPackagesByCity();
//       setShowModal(false);
//       resetForm();
//     } catch (e) {
//       setErrorMessage(e?.message || "Something went wrong");
//     } finally {
//       setPkgSaving(false);
//     }
//   };

//   return (
//     <Container className="py-4">
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h5 className="fw-bold">Product Dashboard</h5>

//         <div className="d-flex gap-2">
//           <Form.Select
//             value={cityId || ""}
//             onChange={(e) => setCityId(e.target.value)}
//             style={{ height: "36px", fontSize: "12px" }}
//           >
//             {cities.length === 0 ? (
//               <option value="">No cities</option>
//             ) : (
//               cities.map((c) => (
//                 <option key={c?._id} value={c?._id}>
//                   {c?.city || ""}
//                 </option>
//               ))
//             )}
//           </Form.Select>

//           <Form.Select
//             value={categoryFilter}
//             onChange={(e) => {
//               const selected = e.target.value;
//               setCategoryFilter(selected);
//               if (selected === "House Painting") navigate("/product");
//             }}
//             style={{ height: "36px", fontSize: "12px" }}
//           >
//             <option>Deep Cleaning</option>
//             <option>House Painting</option>
//           </Form.Select>
//         </div>
//       </div>

//       <h5 className="fw-semibold mb-3" style={{ fontSize: "18px" }}>
//         Minimum Order (Deep Cleaning)
//       </h5>

//       <Row className="mb-2 align-items-center">
//         <Col md={5}>
//           <Form.Control
//             type="number"
//             placeholder={minOrderLoading ? "Loading..." : "Minimum order amount"}
//             value={minOrder}
//             onChange={(e) => setMinOrder(e.target.value)}
//             style={{ fontSize: "12px" }}
//             disabled={minOrderLoading || minOrderSaving}
//           />

//           {minOrderError && (
//             <div className="text-danger mt-1" style={{ fontSize: "12px" }}>
//               {minOrderError}
//             </div>
//           )}
//           {minOrderSuccess && (
//             <div className="text-success mt-1" style={{ fontSize: "12px" }}>
//               {minOrderSuccess}
//             </div>
//           )}

//           <div className="text-muted mt-1" style={{ fontSize: "12px" }}>
//             {serverMinOrder !== "" ? <>Current (server) value: ₹{serverMinOrder}</> : <>No minimum order set yet.</>}
//           </div>
//         </Col>

//         <Col md={2}>
//           <Button
//             onClick={saveMinimumOrder}
//             disabled={minOrderLoading || minOrderSaving}
//             style={{
//               borderColor: "black",
//               backgroundColor: "transparent",
//               color: "black",
//               fontSize: "14px",
//             }}
//           >
//             {minOrderSaving ? "Saving..." : "Save"}
//           </Button>
//         </Col>
//       </Row>

//       <div className="d-flex justify-content-between align-items-center">
//         <h6 className="fw-bold">Deep Cleaning Products Table</h6>
//         <div className="d-flex align-items-center gap-2">
//           {loading && (
//             <span className="text-muted" style={{ fontSize: 12 }}>
//               Loading…
//             </span>
//           )}

//           <Button
//             onClick={openAddModal}
//             style={{
//               borderColor: "black",
//               backgroundColor: "transparent",
//               color: "black",
//               fontSize: "12px",
//             }}
//             disabled={!cityId}
//             title={!cityId ? "Select city first" : ""}
//           >
//             Add Package
//           </Button>

//           <Button
//             style={{
//               borderColor: "black",
//               backgroundColor: "transparent",
//               color: "black",
//               fontSize: "12px",
//             }}
//             onClick={() => navigate("/admincleaningcatalogeditor")}
//           >
//             Website Packages
//           </Button>
//         </div>
//       </div>

//       <Table bordered className="mt-2">
//         <thead style={{ textAlign: "center", fontSize: "14px" }}>
//           <tr>
//             <th>Package Name</th>
//             <th>Category</th>
//             <th>Subcategory</th>
//             <th>Service</th>
//             <th>Total Amount</th>
//             <th>Coins for Vendor</th>
//             <th>Team Members Needed</th>
//             <th>Duration (mins)</th>
//             <th>Actions</th>
//           </tr>
//         </thead>

//         {/* ✅ RENDER SORTED LIST */}
//         <tbody style={{ textAlign: "center", fontSize: "12px" }}>
//           {sortedPackages.length === 0 ? (
//             <tr>
//               <td colSpan={9} className="text-muted">
//                 {cityId ? "No packages found for this city." : "Select a city first."}
//               </td>
//             </tr>
//           ) : (
//             sortedPackages.map((pkg) => (
//               <tr key={pkg.id}>
//                 <td>
//                   {pkg.name || (pkg.service ? `${pkg.subcategory} - ${pkg.service}` : pkg.subcategory)}
//                 </td>
//                 <td>{pkg.category}</td>
//                 <td>{pkg.subcategory}</td>
//                 <td>{pkg.service || "-"}</td>
//                 <td>{pkg.totalAmount}</td>
//                 <td>{pkg.coinsForVendor}</td>
//                 <td>{pkg.teamMembers}</td>
//                 <td>{pkg.durationMinutes}</td>
//                 <td>
//                   <div className="d-flex gap-2 justify-content-center">
//                     <Button
//                       variant="black"
//                       onClick={() => openEditModal(pkg)}
//                       style={{ borderColor: "black", fontSize: "12px" }}
//                       disabled={pkgSaving}
//                     >
//                       Edit
//                     </Button>
//                   </div>
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </Table>

//       <Modal show={showModal} onHide={() => setShowModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: "16px" }}>
//             {editingId ? "Edit Package" : "Add Package"}
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <Form.Group className="mb-3">
//             <Form.Label>City</Form.Label>
//             <Form.Control value={selectedCityName || ""} disabled />
//             <div className="form-text">City is fixed by the top filter and cannot be changed.</div>
//           </Form.Group>

//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Category</Form.Label>
//                 <Form.Select
//                   value={form.category}
//                   onChange={(e) => onFormChange("category", e.target.value)}
//                   disabled={isEditMode}
//                 >
//                   <option value="">Select Category</option>
//                   {DEEP_CLEANING_DATA.map((cat) => (
//                     <option key={cat.category} value={cat.category}>
//                       {cat.category}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Subcategory</Form.Label>
//                 <Form.Select
//                   value={form.subcategory}
//                   onChange={(e) => onFormChange("subcategory", e.target.value)}
//                   disabled={isEditMode || !form.category}
//                 >
//                   <option value="">Select Subcategory</option>
//                   {subcategoryOptions.map((sc) => (
//                     <option key={sc} value={sc}>
//                       {sc}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Service</Form.Label>
//                 <Form.Select
//                   value={form.service}
//                   onChange={(e) => onFormChange("service", e.target.value)}
//                   disabled={isEditMode || !form.subcategory || serviceOptions.length === 0}
//                 >
//                   <option value="">
//                     {serviceOptions.length ? "Select Service" : "No service (optional)"}
//                   </option>
//                   {serviceOptions.map((sv) => (
//                     <option key={sv} value={sv}>
//                       {sv}
//                     </option>
//                   ))}
//                 </Form.Select>

//                 <div className="form-text">
//                   {serviceOptions.length === 0 ? "This subcategory has no service variants." : ""}
//                 </div>
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Total Amount</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.totalAmount}
//                   onChange={(e) => onFormChange("totalAmount", e.target.value)}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Coins for Vendor</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.coinsForVendor}
//                   onChange={(e) => onFormChange("coinsForVendor", e.target.value)}
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Team Members Needed</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.teamMembers}
//                   onChange={(e) => onFormChange("teamMembers", e.target.value)}
//                 />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Duration (Minutes)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   placeholder="Eg: 30"
//                   value={form.durationMinutes}
//                   onChange={(e) => onFormChange("durationMinutes", e.target.value)}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>

//           {errorMessage && <div className="text-danger" style={{ fontSize: "12px" }}>{errorMessage}</div>}
//         </Modal.Body>

//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowModal(false)}>
//             Cancel
//           </Button>

//           <Button
//             variant="transparent"
//             onClick={handleSave}
//             style={{ borderColor: "black" }}
//             disabled={pkgSaving}
//           >
//             {pkgSaving ? "Saving..." : editingId ? "Save Changes" : "Add Package"}
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default DeepCleaningDashboard;

import React, { useState, useMemo, useEffect } from "react";
import { Table, Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";
import axios from "axios";

/** ✅ MASTER DATA MUST MATCH DB EXACTLY (case + spelling) */
const DEEP_CLEANING_DATA = [
  {
    category: "Furnished apartment",
    subcategories: [
      { subcategory: "1 BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "2 BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "3 BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "4 BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "5+ BHK Cleaning", services: ["Classic", "Premium", "Platinum"] },
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
      { subcategory: "Bedroom Cleaning", services: ["Unfurnished", "Furnished"] },
      { subcategory: "Living Room Cleaning", services: ["Unfurnished", "Furnished"] },
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
      { subcategory: "<1200 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "1200-2000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "2000-3000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "3000-4000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "4000-5000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "5000-6000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
      { subcategory: "6000-7000 sqft Bungalow Cleaning", services: ["Classic", "Premium"] },
    ],
  },
  {
    category: "Furnished bungalow/duplex",
    subcategories: [
      { subcategory: "<1200 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "1200-2000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "2000-3000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "3000-4000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "4000-5000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "5000-6000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
      { subcategory: "6000-7000 sqft Bungalow Cleaning", services: ["Classic", "Premium", "Platinum"] },
    ],
  },
  {
    category: "Mini services",
    subcategories: [
      {
        subcategory: "Kitchen Appliances Cleaning",
        services: ["Chimney", "Microwave", "Stove", "Single Door Fridge", "Double Door Fridge"],
      },
      {
        subcategory: "Sofa & Upholstery Wet Shampooing",
        services: ["Sofa (5 seats)", "Carpet (upto 25 sqft)", "Cushion Chair", "Mattress"],
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

  const selectedCityName = useMemo(() => {
    const c = cities.find((x) => String(x?._id) === String(cityId));
    return c?.city || "";
  }, [cities, cityId]);

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
          serviceIndex.set(`${catObj.category}__${subObj.subcategory}__${sv}`, vIdx);
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
      return ORDER_MAP.serviceIndex.has(key) ? ORDER_MAP.serviceIndex.get(key) : big;
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

  // =========================
  // Minimum order APIs (unchanged)
  // =========================
  const fetchMinimumOrder = async () => {
    try {
      setMinOrderLoading(true);
      setMinOrderError("");
      const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load minimum order");
      setMinOrder(String(json.data.amount));
      setServerMinOrder(String(json.data.amount));
    } catch (err) {
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
        return;
      }

      const res = await fetch(`${BASE_URL}/minimumorder/minimum-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to save minimum order");

      await fetchMinimumOrder();
      setMinOrderSuccess("Minimum order saved successfully.");
    } catch (err) {
      setMinOrderError(err.message);
    } finally {
      setMinOrderSaving(false);
    }
  };

  // =========================
  // ✅ NEW: Fetch packages for selected city (merged master + city config)
  // =========================
  const fetchPackagesByCity = async () => {
    try {
      if (!cityId) {
        setPackages([]);
        return;
      }

      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/deeppackage/deep-cleaning-packages/by-city/${cityId}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load packages");

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
      }
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Failed to save city config");
    return json.data;
  };

  useEffect(() => {
    fetchMinimumOrder();
  }, []);

  useEffect(() => {
    fetchPackagesByCity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  // =========================
  // Modal handlers
  // =========================
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
      coinsForVendor: pkg.coinsForVendor == null ? "" : String(pkg.coinsForVendor),
      teamMembers: pkg.teamMembers == null ? "" : String(pkg.teamMembers),
      durationMinutes: pkg.durationMinutes == null ? "" : String(pkg.durationMinutes),
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

    if (!Number.isFinite(amount) || amount < 0) return "Total amount must be a valid number (>= 0).";
    if (!Number.isFinite(coins) || coins < 0) return "Coins must be a valid number (>= 0).";
    if (!Number.isFinite(team) || team < 1) return "Team members must be at least 1.";
    if (!Number.isFinite(dur) || dur < 30) return "Duration must be at least 30 minutes.";

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

      <h5 className="fw-semibold mb-3" style={{ fontSize: "18px" }}>
        Minimum Order (Deep Cleaning)
      </h5>

      <Row className="mb-2 align-items-center">
        <Col md={5}>
          <Form.Control
            type="number"
            placeholder={minOrderLoading ? "Loading..." : "Minimum order amount"}
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            style={{ fontSize: "12px" }}
            disabled={minOrderLoading || minOrderSaving}
          />

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
          {sortedPackages.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-muted">
                {cityId ? "No packages found." : "Select a city first."}
              </td>
            </tr>
          ) : (
            sortedPackages.map((pkg) => (
              <tr key={pkg.id}>
                <td>{pkg.name || (pkg.service ? `${pkg.subcategory} - ${pkg.service}` : pkg.subcategory)}</td>
                <td>{pkg.category}</td>
                <td>{pkg.subcategory}</td>
                <td>{pkg.service || "-"}</td>

                {/* ✅ show blank if null */}
                <td>{pkg.totalAmount == null ? "-" : pkg.totalAmount}</td>
                <td>{pkg.coinsForVendor == null ? "-" : pkg.coinsForVendor}</td>
                <td>{pkg.teamMembers == null ? "-" : pkg.teamMembers}</td>
                <td>{pkg.durationMinutes == null ? "-" : pkg.durationMinutes}</td>

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
            <div className="form-text">These values are saved only for the selected city.</div>
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
                  onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Coins for Vendor</Form.Label>
                <Form.Control
                  type="number"
                  value={form.coinsForVendor}
                  onChange={(e) => setForm((p) => ({ ...p, coinsForVendor: e.target.value }))}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Team Members Needed</Form.Label>
                <Form.Control
                  type="number"
                  value={form.teamMembers}
                  onChange={(e) => setForm((p) => ({ ...p, teamMembers: e.target.value }))}
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
                  onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))}
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
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={pkgSaving}>
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