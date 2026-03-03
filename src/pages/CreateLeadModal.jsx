// import { useEffect, useState } from "react";
// import { FaTimes } from "react-icons/fa";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { BASE_URL } from "../utils/config";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { useNavigate } from "react-router-dom";
// import { MdCancel } from "react-icons/md";

// const CreateLeadModal = ({ onClose }) => {
//   const navigate = useNavigate();
//   const [existingUser, setExistingUser] = useState(null);
//   const [typingTimeout, setTypingTimeout] = useState(null);
//   const [showAddress, setShowAddress] = useState(false);
//   const [showTime, setShowTime] = useState(false);

//   const [categories, setCategories] = useState([]);
//   const [selectedSubCategory, setSelectedSubCategory] = useState("");
//   const [originalTotal, setOriginalTotal] = useState(0);
//   const [discountMode, setDiscountMode] = useState("percent");
//   const [discountValue, setDiscountValue] = useState("");
//   const [discountApplied, setDiscountApplied] = useState(false);
//   const [leadData, setLeadData] = useState({
//     name: "",
//     contact: "",
//     googleAddress: "",
//     city: "",
//     houseNo: "",
//     landmark: "",
//     serviceType: "",
//     slotDate: "",
//     slotTime: "",
//     totalAmount: 0,
//     bookingAmount: 0,
//     amountYetToPay: 0,
//     packages: [],
//     selectedPackage: "",
//     coordinates: { lat: 0, lng: 0 },
//   });

//   const [serviceConfig, setServiceConfig] = useState(null);
//   const [checkingUser, setCheckingUser] = useState(false);
//   const [saving, setSaving] = useState(false);

//   const invalidateSlot = () => {
//     setLeadData((p) => ({
//       ...p,
//       slotDate: "",
//       slotTime: "",
//     }));
//   };

//   /* --------------------------------------------------
//      SLOT ENABLE RULES (CRITICAL)
//   -------------------------------------------------- */
//   const isTimeSelectionEnabled =
//     !!leadData.googleAddress &&
//     !!leadData.city &&
//     (leadData.serviceType === "House Painting" ||
//       (leadData.serviceType === "Deep Cleaning" &&
//         leadData.packages.length > 0));

//   /* -----------------------------------------------------------
//      Detect City From Address
//   ------------------------------------------------------------ */
//   useEffect(() => {
//     if (!leadData.googleAddress) return;

//     const addr = leadData.googleAddress.toLowerCase();
//     let detectedCity = "";

//     if (addr.includes("bengaluru")) detectedCity = "Bengaluru";
//     else if (addr.includes("mysuru")) detectedCity = "Mysuru";
//     else if (addr.includes("pune")) detectedCity = "Pune";

//     if (detectedCity && leadData.city !== detectedCity) {
//       setLeadData((prev) => ({ ...prev, city: detectedCity }));
//     }
//   }, [leadData.googleAddress]);

//   useEffect(() => {
//     const fetchLatestService = async () => {
//       try {
//         const res = await axios.get(`${BASE_URL}/service/latest`);

//         setServiceConfig(res?.data?.data);
//         console.log("price config", res?.data?.data);
//       } catch (error) {
//         console.error("Error fetching latest service:", error);
//       }
//     };

//     fetchLatestService();
//   }, []);

//   /* --------------------------------------------------
//      FETCH EXISTING USER
//   -------------------------------------------------- */
//   const fetchExistingUser = async (mobile) => {
//     try {
//       setCheckingUser(true);

//       const res = await axios.post(
//         `${BASE_URL}/user/finding-user-exist/mobilenumber`,
//         { mobileNumber: mobile },
//       );

//       if (res.data?.isNewUser === false) {
//         const user = res.data.data;
//         setExistingUser(user);

//         const addr = user.savedAddress || {};
//         setLeadData((p) => ({
//           ...p,
//           name: user.userName,
//           googleAddress: addr.address || "",
//           houseNo: addr.houseNumber || "",
//           landmark: addr.landmark || "",
//           city: addr.city || "",
//           coordinates: {
//             lat: addr.latitude || 0,
//             lng: addr.longitude || 0,
//           },
//         }));

//         toast.success("Existing user found");
//       } else {
//         setExistingUser(null);
//       }
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to check existing user");
//     } finally {
//       setCheckingUser(false);
//     }
//   };

//   /* --------------------------------------------------
//      INPUT HANDLER
//   -------------------------------------------------- */
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "contact") {
//       const v = value.replace(/\D/g, "").slice(0, 10);
//       setLeadData((p) => ({ ...p, contact: v }));

//       if (typingTimeout) clearTimeout(typingTimeout);
//       if (v.length === 10) {
//         setTypingTimeout(setTimeout(() => fetchExistingUser(v), 700));
//       }
//       return;
//     }

//     if (name === "bookingAmount") {
//       const booking = Number(value || 0);
//       setLeadData((p) => ({
//         ...p,
//         bookingAmount: booking,
//         amountYetToPay: p.totalAmount - booking,
//       }));
//       return;
//     }

//     if (name === "name" && existingUser) return;
//     setLeadData((p) => ({ ...p, [name]: value }));
//   };

//   /* -----------------------------------------------------------
//      Get Unique Categories for Deep Cleaning
//   ------------------------------------------------------------ */
//   const uniqueDeepCategories = () => {
//     return [...new Set(categories.map((c) => c.category))];
//   };

//   /* --------------------------------------------------
//      ADD / REMOVE PACKAGES
//   -------------------------------------------------- */
//   const addPackage = () => {
//     const pkg = categories.find((p) => p._id === leadData.selectedPackage);
//     if (!pkg) return;

//     const updated = [...leadData.packages, pkg];
//     const total = updated.reduce((s, p) => s + p.totalAmount, 0);
//     const booking = Math.round(total * 0.2);

//     setOriginalTotal(total);
//     setDiscountApplied(false);

//     setLeadData((p) => ({
//       ...p,
//       packages: updated,
//       selectedPackage: "",
//       totalAmount: total,
//       bookingAmount: booking,
//       amountYetToPay: total - booking,
//       // ✅ RESET SLOT
//       slotDate: "",
//       slotTime: "",
//     }));
//   };
//   const removePackage = (pkg) => {
//     const updated = leadData.packages.filter((p) => p._id !== pkg._id);
//     const total = updated.reduce((s, p) => s + p.totalAmount, 0);
//     const booking = Math.round(total * 0.2);

//     setOriginalTotal(total);
//     setDiscountApplied(false);

//     setLeadData((p) => ({
//       ...p,
//       packages: updated,
//       totalAmount: total,
//       bookingAmount: booking,
//       amountYetToPay: total - booking,
//       // ✅ RESET SLOT
//       slotDate: "",
//       slotTime: "",
//     }));
//   };

//   /* -----------------------------------------------------------
//      Apply Discount
//   ------------------------------------------------------------ */
//   const applyDiscount = () => {
//     const base = originalTotal;
//     if (!base) return;

//     let discounted = base;
//     const val = Number(discountValue);

//     if (discountMode === "percent") {
//       discounted = base - (base * val) / 100;
//     } else {
//       discounted = base - val;
//     }

//     if (discounted < 0) discounted = 0;

//     const booking = Math.round(discounted * 0.2);

//     setLeadData((prev) => ({
//       ...prev,
//       totalAmount: Math.round(discounted),
//       bookingAmount: booking,
//       amountYetToPay: discounted - booking,
//     }));

//     setDiscountApplied(true);
//   };

//   /* -----------------------------------------------------------
//      Clear Discount
//   ------------------------------------------------------------ */
//   const clearDiscount = () => {
//     const total = originalTotal;
//     const booking = Math.round(total * 0.2);

//     setLeadData((prev) => ({
//       ...prev,
//       totalAmount: total,
//       bookingAmount: booking,
//       amountYetToPay: total - booking,
//     }));

//     setDiscountApplied(false);
//     setDiscountValue("");
//   };

//   const isFormValid = () => {
//     if (!leadData.contact || leadData.contact.length !== 10) return false;
//     if (!existingUser && !leadData.name) return false;
//     if (!leadData.googleAddress) return false;
//     if (!leadData.city) return false;
//     if (!leadData.serviceType) return false;

//     if (leadData.serviceType === "Deep Cleaning") {
//       if (leadData.packages.length === 0) return false;
//     }

//     if (!leadData.slotDate || !leadData.slotTime) return false;

//     return true;
//   };

//   /* -----------------------------------------------------------
//      SAVE
//   ------------------------------------------------------------ */
//   const handleSave = async () => {
//     if (checkingUser || saving) return;

//     if (!isFormValid()) {
//       toast.error("Please fill all required fields");
//       return;
//     }

//     try {
//       if (!isTimeSelectionEnabled) {
//         toast.error("Please complete service & slot selection");
//         return;
//       }
//       console.log("p", leadData.packages);
//       const payload = {
//         customer: existingUser
//           ? {
//               customerId: existingUser._id,
//               phone: existingUser.mobileNumber,
//               name: existingUser.userName,
//             }
//           : {
//               phone: leadData.contact,
//               name: leadData.name,
//             },

//         service:
//           leadData.serviceType === "House Painting"
//             ? [
//                 {
//                   category: "House Painting",
//                   serviceName: "House Painters & Waterproofing",
//                   price: leadData.bookingAmount,
//                   quantity: 1,
//                   coinDeduction: serviceConfig?.vendorCoins || 0,
//                 },
//               ]
//             : leadData.packages.map((p) => ({
//                 category: "Deep Cleaning",
//                 subCategory: p.category,
//                 serviceName: p.name,
//                 price: p.totalAmount,
//                 quantity: 1,

//                 // ✅ already present
//                 teamMembersRequired: p.teamMembers,
//                 coinDeduction: p.coinsForVendor || 0,

//                 // ✅ ADD THESE TWO
//                 packageId: p._id,
//                 duration: p.durationMinutes || p.duration || 0,
//               })),

//         bookingDetails: {
//           bookingAmount: leadData.bookingAmount,
//           finalTotal: leadData.totalAmount,
//           paidAmount: 0,
//           paymentMethod: "None",
//         },

//         address: {
//           houseFlatNumber: leadData.houseNo,
//           streetArea: leadData.googleAddress,
//           landMark: leadData.landmark,
//           city: leadData.city,
//           location: {
//             type: "Point",
//             coordinates: [leadData.coordinates.lng, leadData.coordinates.lat],
//           },
//         },

//         selectedSlot: {
//           slotDate: leadData.slotDate,
//           slotTime: leadData.slotTime,
//         },

//         formName: "admin panel",
//         isEnquiry: leadData.bookingAmount > 0,
//       };
//       console.log("booking payload", payload);

//       await axios.post(`${BASE_URL}/bookings/create-admin-booking`, payload);

//       toast.success(
//         `${
//           leadData.bookingAmount == 0
//             ? "Lead created successfully!"
//             : " Enquiry created successfully!"
//         }`,
//       );
//       onClose();
//       navigate(`${leadData.bookingAmount == 0 ? "/newleads" : "/enquiries"}`);
// window.location.reload();

//     } catch (err) {
//       console.error(err);
//       toast.error(err?.response?.data?.message || "Save failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   /* -----------------------------------------------------------
//      UI
//   ------------------------------------------------------------ */
//   return (
//     <div style={styles.overlay}>
//       <div style={styles.modal}>
//         <div style={styles.header}>
//           <h6>Create New Lead / Enquiry</h6>
//           <FaTimes style={styles.close} onClick={onClose} />
//         </div>

//         <div style={styles.content}>
//           {/* PHONE */}
//           <input
//             type="text"
//             name="contact"
//             placeholder="Customer Phone No."
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.contact}
//           />

//           {checkingUser && (
//             <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
//               Checking existing user…
//             </div>
//           )}

//           {/* NAME */}
//           <input
//             type="text"
//             name="name"
//             placeholder="Customer Name"
//             style={styles.input}
//             readOnly={!!existingUser}
//             onChange={handleChange}
//             value={leadData.name}
//           />

//           {/* ADDRESS */}
//           <input
//             type="text"
//             placeholder="Google Address (click to pick)"
//             style={{ ...styles.input, cursor: "pointer" }}
//             onClick={() => setShowAddress(true)}
//             readOnly
//             value={leadData.googleAddress}
//           />

//           {/* HOUSE NO */}
//           <input
//             type="text"
//             name="houseNo"
//             placeholder="House No."
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.houseNo}
//           />

//           {/* LANDMARK */}
//           <input
//             type="text"
//             name="landmark"
//             placeholder="Landmark"
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.landmark}
//           />

//           {/* CITY */}
//           <input
//             type="text"
//             placeholder="Detected City"
//             style={{ ...styles.input, background: "#eee" }}
//             readOnly
//             value={leadData.city}
//           />

//           {/* SLOT SELECTION */}
//           {isTimeSelectionEnabled ? (
//             <>
//               <label style={styles.label}>Select Date & Time</label>
//               <div
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: 10,
//                   marginBottom: 15,
//                 }}
//               >
//                 <input
//                   readOnly
//                   value={
//                     leadData.slotDate
//                       ? `${leadData.slotDate} ${leadData.slotTime}`
//                       : "Select Date & Slot"
//                   }
//                   onClick={() => {
//                     if (!isTimeSelectionEnabled) {
//                       toast.error(
//                         leadData.serviceType === "Deep Cleaning"
//                           ? "Add at least one package"
//                           : "Select service first",
//                       );
//                       return;
//                     }
//                     setShowTime(true);
//                   }}
//                   style={{
//                     ...styles.input,
//                     cursor: isTimeSelectionEnabled ? "pointer" : "not-allowed",
//                     background: isTimeSelectionEnabled ? "#fff" : "#eee",
//                   }}
//                 />
//                 {(leadData.slotDate || leadData.slotTime) && (
//                   <button
//                     style={{
//                       padding: "5px 10px",
//                       background: "#ff4444",
//                       color: "white",
//                       border: "none",
//                       borderRadius: 4,
//                       cursor: "pointer",
//                       fontSize: "12px",
//                       whiteSpace: "nowrap",
//                       height: "30px",
//                     }}
//                     onClick={() => {
//                       setLeadData((p) => ({
//                         ...p,
//                         slotDate: "",
//                         slotTime: "",
//                       }));
//                     }}
//                   >
//                     Clear
//                   </button>
//                 )}
//               </div>
//             </>
//           ) : (
//             <div
//               style={{
//                 fontSize: 12,
//                 color: "#666",
//                 marginBottom: 15,
//                 padding: 8,
//                 background: "#f5f5f5",
//                 borderRadius: 4,
//                 textAlign: "center",
//               }}
//             >
//               Please select an service first to enable slot selection
//             </div>
//           )}

//           {/* SERVICE TYPE */}
//           <select
//             name="serviceType"
//             style={styles.input}
//             onChange={async (e) => {
//               const val = e.target.value;

//               // 🔥 ALWAYS invalidate slot on service change
//               invalidateSlot();

//               if (val === "House Painting") {
//                 const resp = await axios.get(`${BASE_URL}/service/latest`);
//                 const siteVisit = resp.data.data.siteVisitCharge || 0;

//                 setLeadData((prev) => ({
//                   ...prev,
//                   serviceType: val,
//                   packages: [],
//                   selectedPackage: "",
//                   totalAmount: 0,
//                   bookingAmount: siteVisit,
//                   amountYetToPay: 0,
//                 }));
//                 return;
//               }

//               if (val === "Deep Cleaning") {
//                 const res = await axios.get(
//                   `${BASE_URL}/deeppackage/deep-cleaning-packages`,
//                 );
//                 setCategories(res.data.data || []);
//               }

//               setLeadData((prev) => ({
//                 ...prev,
//                 serviceType: val,
//                 packages: [],
//                 selectedPackage: "",
//                 totalAmount: 0,
//                 bookingAmount: 0,
//                 amountYetToPay: 0,
//               }));
//             }}
//             value={leadData.serviceType}
//           >
//             <option value="">Select Service</option>
//             <option value="House Painting">House Painting</option>
//             <option value="Deep Cleaning">Deep Cleaning</option>
//           </select>

//           {leadData.serviceType === "House Painting" && (
//             <>
//               <label style={styles.label}>Booking Amount</label>
//               <input
//                 name="bookingAmount"
//                 type="number"
//                 value={leadData.bookingAmount}
//                 onChange={handleChange}
//                 style={styles.input}
//               />
//             </>
//           )}

//           {leadData.serviceType === "Deep Cleaning" && (
//             <>
//               <select
//                 value={selectedSubCategory}
//                 style={styles.input}
//                 onChange={(e) => {
//                   setSelectedSubCategory(e.target.value);
//                   setLeadData((p) => ({
//                     ...p,
//                     selectedPackage: "",
//                     slotDate: "",
//                     slotTime: "",
//                   }));
//                 }}
//               >
//                 <option value="">Select Subcategory</option>
//                 {uniqueDeepCategories().map((cat) => (
//                   <option key={cat}>{cat}</option>
//                 ))}
//               </select>

//               <div style={{ display: "flex", gap: 10 }}>
//                 <select
//                   value={leadData.selectedPackage}
//                   style={styles.select}
//                   disabled={!selectedSubCategory}
//                   onChange={(e) =>
//                     setLeadData((p) => ({
//                       ...p,
//                       selectedPackage: e.target.value,
//                     }))
//                   }
//                 >
//                   <option value="">Select Package</option>
//                   {categories
//                     .filter((p) => p.category === selectedSubCategory)
//                     .map((p) => (
//                       <option key={p._id} value={p._id}>
//                         {p.name} – ₹{p.totalAmount}
//                       </option>
//                     ))}
//                 </select>

//                 <button style={styles.addBtn} onClick={addPackage}>
//                   +
//                 </button>
//               </div>

//               <ul style={styles.pkgList}>
//                 {leadData.packages.map((pkg) => (
//                   <li key={pkg._id} style={styles.pkgItem}>
//                     {pkg.name} – ₹{pkg.totalAmount}
//                     <FaTimes
//                       style={styles.remove}
//                       onClick={() => removePackage(pkg)}
//                     />
//                   </li>
//                 ))}
//               </ul>

//               <label style={styles.label}>Total Amount</label>
//               <input
//                 style={{ ...styles.input, background: "#eee" }}
//                 readOnly
//                 value={leadData.totalAmount}
//               />

//               {!discountApplied ? (
//                 <div style={styles.discountRow}>
//                   <select
//                     value={discountMode}
//                     onChange={(e) => setDiscountMode(e.target.value)}
//                     style={styles.discountSelect}
//                   >
//                     <option value="percent">% Discount</option>
//                     <option value="amount">Fixed</option>
//                   </select>

//                   <input
//                     type="number"
//                     value={discountValue}
//                     style={styles.discountInput}
//                     onChange={(e) => setDiscountValue(e.target.value)}
//                   />

//                   <button style={styles.applyBtn} onClick={applyDiscount}>
//                     Apply
//                   </button>
//                 </div>
//               ) : (
//                 <div style={styles.discountApplied}>
//                   Discount Applied:{" "}
//                   {discountMode === "percent"
//                     ? `${discountValue}%`
//                     : `₹${discountValue}`}
//                   <MdCancel
//                     style={styles.cancelDiscount}
//                     onClick={clearDiscount}
//                   />
//                 </div>
//               )}

//               <label style={styles.label}>Booking Amount</label>
//               <input
//                 name="bookingAmount"
//                 type="number"
//                 style={styles.input}
//                 value={leadData.bookingAmount}
//                 onChange={handleChange}
//               />

//               <label style={styles.label}>Amount Yet To Pay</label>
//               <input
//                 readOnly
//                 style={{ ...styles.input, background: "#eee" }}
//                 value={leadData.amountYetToPay}
//               />
//             </>
//           )}

//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               marginTop: "20px",
//             }}
//           >
//             <button
//               style={{
//                 ...styles.saveBtn,
//                 background:
//                   checkingUser || saving || !isFormValid()
//                     ? "#ccc"
//                     : styles.saveBtn.background,
//                 cursor:
//                   checkingUser || saving || !isFormValid()
//                     ? "not-allowed"
//                     : "pointer",
//               }}
//               disabled={checkingUser || saving || !isFormValid()}
//               onClick={handleSave}
//             >
//               {saving ? "Saving..." : "Save"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ADDRESS PICKER */}
//       {showAddress && (
//         <AddressPickerModal
//           onClose={() => setShowAddress(false)}
//           initialAddress={leadData.googleAddress || ""}
//            initialHouseFlatNumber={leadData.houseNo || ""}
//            initialCity={leadData.city || ""}
//   initialLandmark={leadData.landmark || ""}
//           initialLatLng={
//             leadData.coordinates?.lat && leadData.coordinates?.lng
//               ? leadData.coordinates
//               : null
//           }
//           onSelect={(sel) =>
//             setLeadData((p) => ({
//               ...p,
//               googleAddress: sel.streetArea,
//               houseNo: sel.houseFlatNumber || p.houseNo,
//               landmark: sel.landMark || p.landmark,
//               coordinates: {
//                 lat: sel.latLng?.lat || 0,
//                 lng: sel.latLng?.lng || 0,
//               },
//               city: sel.city || p.city,
//               slotDate: "",
//               slotTime: "",
//             }))
//           }
//         />
//       )}

//       {/* TIME PICKER */}
//       {showTime && (
//         <TimePickerModal
//           onClose={() => setShowTime(false)}
//           onSelect={(sel) =>
//             setLeadData((p) => ({
//               ...p,
//               slotDate: sel.slotDate,
//               slotTime: sel.slotTime,
//             }))
//           }
//           serviceType={
//             leadData.serviceType === "Deep Cleaning"
//               ? "deep_cleaning"
//               : "house_painting"
//           }
//           packageId={
//             leadData.serviceType === "Deep Cleaning"
//               ? leadData.packages.map((p) => p._id)
//               : []
//           }
//           coordinates={leadData.coordinates}
//         />
//       )}
//       <ToastContainer />
//     </div>
//   );
// };

// /* -----------------------------------------------------------
//    Styles
// ------------------------------------------------------------ */
// const styles = {
//   overlay: {
//     position: "fixed",
//     top: "0%",
//     left: 0,
//     width: "100%",
//     height: "100%",
//     background: "rgba(0,0,0,0.5)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     fontFamily: "'Poppins', sans-serif",
//     zIndex: 999999,
//   },
//   modal: {
//     width: "560px",
//     background: "#fff",
//     borderRadius: 8,
//     padding: 20,
//     maxHeight: "85vh",
//     overflow: "hidden",
//     boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
//   },
//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingBottom: 15,
//     marginBottom: 15,
//     borderBottom: "1px solid #eaeaea",
//   },
//   close: {
//     cursor: "pointer",
//     fontSize: 18,
//     color: "#666",
//     transition: "color 0.2s",
//   },
//   closeHover: {
//     color: "#333",
//   },
//   content: {
//     maxHeight: "70vh",
//     overflowY: "auto",
//     overflowX: "hidden",
//     paddingRight: 5,
//     scrollbarWidth: "none",
//     msOverflowStyle: "none",
//   },
//   contentScroll: {
//     "&::-webkit-scrollbar": {
//       display: "none",
//     },
//   },
//   input: {
//     width: "100%",
//     padding: "10px 12px",
//     border: "1px solid #ddd",
//     borderRadius: 6,
//     marginBottom: 12,
//     fontSize: 13,
//     fontFamily: "'Poppins', sans-serif",
//     boxSizing: "border-box",
//     transition: "border 0.2s, box-shadow 0.2s",
//   },
//   inputFocus: {
//     border: "1px solid #03942fff",
//     boxShadow: "0 0 0 2px rgba(3, 148, 47, 0.1)",
//     outline: "none",
//   },
//   select: {
//     flex: 1,
//     padding: "8px 10px",
//     borderRadius: 6,
//     border: "1px solid #ddd",
//     fontSize: "13px",
//     fontFamily: "'Poppins', sans-serif",
//     background: "white",
//   },
//   addBtn: {
//     padding: "8px 15px",
//     background: "#03942fff",
//     color: "#fff",
//     borderRadius: 6,
//     cursor: "pointer",
//     border: "none",
//     fontSize: "14px",
//     fontWeight: "600",
//     transition: "background 0.2s",
//   },
//   addBtnHover: {
//     background: "#027a3b",
//   },
//   pkgList: {
//     listStyle: "none",
//     padding: 0,
//     margin: "10px 0",
//   },
//   pkgItem: {
//     background: "#f8f9fa",
//     padding: "10px 12px",
//     borderRadius: 6,
//     marginBottom: 8,
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     fontSize: 13,
//     border: "1px solid #eaeaea",
//   },
//   remove: {
//     cursor: "pointer",
//     color: "#dc3545",
//     fontSize: "14px",
//     transition: "color 0.2s",
//   },
//   removeHover: {
//     color: "#bd2130",
//   },
//   label: {
//     fontSize: 13,
//     fontWeight: 600,
//     marginBottom: 6,
//     display: "block",
//     color: "#333",
//   },
//   discountRow: {
//     display: "flex",
//     gap: 10,
//     marginBottom: 15,
//     alignItems: "center",
//   },
//   discountSelect: {
//     padding: "8px 10px",
//     borderRadius: 6,
//     border: "1px solid #ddd",
//     fontSize: "13px",
//     fontFamily: "'Poppins', sans-serif",
//     background: "white",
//     flex: 1,
//   },
//   discountInput: {
//     padding: "8px 10px",
//     borderRadius: 6,
//     border: "1px solid #ddd",
//     width: 120,
//     fontSize: "13px",
//     fontFamily: "'Poppins', sans-serif",
//   },
//   applyBtn: {
//     padding: "8px 16px",
//     color: "#fff",
//     borderRadius: 6,
//     cursor: "pointer",
//     border: "none",
//     fontSize: "13px",
//     fontWeight: "600",
//     backgroundColor: "#a00a0aff",
//     transition: "background 0.2s",
//     whiteSpace: "nowrap",
//   },
//   applyBtnHover: {
//     backgroundColor: "#8a0909",
//   },
//   discountApplied: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     gap: 8,
//     fontSize: 13,
//     color: "#28a745",
//     padding: "10px 12px",
//     background: "#f0fff4",
//     borderRadius: 6,
//     marginBottom: 12,
//     border: "1px solid #c3e6cb",
//   },
//   cancelDiscount: {
//     cursor: "pointer",
//     color: "#dc3545",
//     fontSize: "18px",
//     transition: "color 0.2s",
//   },
//   cancelDiscountHover: {
//     color: "#bd2130",
//   },
//   saveBtn: {
//     padding: "10px 35px",
//     background: "#03942fff",
//     color: "white",
//     borderRadius: 6,
//     border: "none",
//     cursor: "pointer",
//     fontSize: "14px",
//     fontWeight: "600",
//     transition: "all 0.2s",
//   },
//   saveBtnHover: {
//     background: "#027a3b",
//     transform: "translateY(-1px)",
//     boxShadow: "0 4px 8px rgba(3, 148, 47, 0.2)",
//   },
// };

// export default CreateLeadModal;

import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BASE_URL } from "../utils/config";
import AddressPickerModal from "./AddressPickerModal";
import TimePickerModal from "./TimePickerModal";
import { useNavigate } from "react-router-dom";
import { MdCancel } from "react-icons/md";

const CreateLeadModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [existingUser, setExistingUser] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showAddress, setShowAddress] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [originalTotal, setOriginalTotal] = useState(0);
  const [discountMode, setDiscountMode] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [leadData, setLeadData] = useState({
    name: "",
    contact: "",
    googleAddress: "",
    city: "",
    houseNo: "",
    landmark: "",
    serviceType: "",
    slotDate: "",
    slotTime: "",
    totalAmount: 0,
    bookingAmount: 0,
    amountYetToPay: 0,
    packages: [],
    selectedPackage: "",
    coordinates: { lat: 0, lng: 0 },
  });

  const [serviceConfig, setServiceConfig] = useState(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [saving, setSaving] = useState(false);

  const invalidateSlot = () => {
    setLeadData((p) => ({
      ...p,
      slotDate: "",
      slotTime: "",
    }));
  };

  const isTimeSelectionEnabled =
    !!leadData.googleAddress &&
    !!leadData.city &&
    (leadData.serviceType === "House Painting" ||
      (leadData.serviceType === "Deep Cleaning" &&
        leadData.packages.length > 0));

  useEffect(() => {
    if (!leadData.googleAddress) return;

    const addr = leadData.googleAddress.toLowerCase();
    let detectedCity = "";

    if (addr.includes("bengaluru")) detectedCity = "Bengaluru";
    else if (addr.includes("mysuru")) detectedCity = "Mysuru";
    else if (addr.includes("pune")) detectedCity = "Pune";

    if (detectedCity && leadData.city !== detectedCity) {
      setLeadData((prev) => ({ ...prev, city: detectedCity }));
    }
  }, [leadData.googleAddress]);

  useEffect(() => {
    const fetchLatestService = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/service/latest`);
        setServiceConfig(res?.data?.data);
      } catch (error) {
        console.error("Error fetching latest service:", error);
      }
    };

    fetchLatestService();
  }, []);

  const fetchExistingUser = async (mobile) => {
    try {
      setCheckingUser(true);

      const res = await axios.post(
        `${BASE_URL}/user/finding-user-exist/mobilenumber`,
        { mobileNumber: mobile },
      );

      if (res.data?.isNewUser === false) {
        const user = res.data.data;
        setExistingUser(user);

        const addr = user.savedAddress || {};
        setLeadData((p) => ({
          ...p,
          name: user.userName,
          googleAddress: addr.address || "",
          houseNo: addr.houseNumber || "",
          landmark: addr.landmark || "",
          city: addr.city || "",
          coordinates: {
            lat: addr.latitude || 0,
            lng: addr.longitude || 0,
          },
        }));

        toast.success("Existing user found");
      } else {
        setExistingUser(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to check existing user");
    } finally {
      setCheckingUser(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact") {
      const v = value.replace(/\D/g, "").slice(0, 10);
      setLeadData((p) => ({ ...p, contact: v }));

      if (typingTimeout) clearTimeout(typingTimeout);
      if (v.length === 10) {
        setTypingTimeout(setTimeout(() => fetchExistingUser(v), 700));
      }
      return;
    }

    if (name === "bookingAmount") {
      const booking = Number(value || 0);
      setLeadData((p) => ({
        ...p,
        bookingAmount: booking,
        amountYetToPay: p.totalAmount - booking,
      }));
      return;
    }

    if (name === "name" && existingUser) return;
    setLeadData((p) => ({ ...p, [name]: value }));
  };

  const uniqueDeepCategories = () => {
    return [...new Set(categories.map((c) => c.category))];
  };

  const addPackage = () => {
    const pkg = categories.find((p) => p._id === leadData.selectedPackage);
    if (!pkg) return;

    const updated = [...leadData.packages, pkg];
    const total = updated.reduce((s, p) => s + p.totalAmount, 0);
    const booking = Math.round(total * 0.2);

    setOriginalTotal(total);
    setDiscountApplied(false);

    setLeadData((p) => ({
      ...p,
      packages: updated,
      selectedPackage: "",
      totalAmount: total,
      bookingAmount: booking,
      amountYetToPay: total - booking,
      slotDate: "",
      slotTime: "",
    }));
  };
  const removePackage = (pkg) => {
    const updated = leadData.packages.filter((p) => p._id !== pkg._id);
    const total = updated.reduce((s, p) => s + p.totalAmount, 0);
    const booking = Math.round(total * 0.2);

    setOriginalTotal(total);
    setDiscountApplied(false);

    setLeadData((p) => ({
      ...p,
      packages: updated,
      totalAmount: total,
      bookingAmount: booking,
      amountYetToPay: total - booking,
      slotDate: "",
      slotTime: "",
    }));
  };

  const applyDiscount = () => {
    const base = originalTotal;
    if (!base) return;

    let discounted = base;
    const val = Number(discountValue);

    if (discountMode === "percent") {
      discounted = base - (base * val) / 100;
    } else {
      discounted = base - val;
    }

    if (discounted < 0) discounted = 0;

    const booking = Math.round(discounted * 0.2);

    setLeadData((prev) => ({
      ...prev,
      totalAmount: Math.round(discounted),
      bookingAmount: booking,
      amountYetToPay: discounted - booking,
    }));

    setDiscountApplied(true);
  };

  const clearDiscount = () => {
    const total = originalTotal;
    const booking = Math.round(total * 0.2);

    setLeadData((prev) => ({
      ...prev,
      totalAmount: total,
      bookingAmount: booking,
      amountYetToPay: total - booking,
    }));

    setDiscountApplied(false);
    setDiscountValue("");
  };

  const isFormValid = () => {
    if (!leadData.contact || leadData.contact.length !== 10) return false;
    if (!existingUser && !leadData.name) return false;
    if (!leadData.googleAddress) return false;
    if (!leadData.city) return false;
    if (!leadData.serviceType) return false;

    if (leadData.serviceType === "Deep Cleaning") {
      if (leadData.packages.length === 0) return false;
    }

    if (!leadData.slotDate || !leadData.slotTime) return false;

    return true;
  };

  const handleSave = async () => {
    if (checkingUser || saving) return;

    if (!isFormValid()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      if (!isTimeSelectionEnabled) {
        toast.error("Please complete service & slot selection");
        return;
      }
      const payload = {
        customer: existingUser
          ? {
              customerId: existingUser._id,
              phone: existingUser.mobileNumber,
              name: existingUser.userName,
            }
          : {
              phone: leadData.contact,
              name: leadData.name,
            },

        service:
          leadData.serviceType === "House Painting"
            ? [
                {
                  category: "House Painting",
                  serviceName: "House Painters & Waterproofing",
                  price: leadData.bookingAmount,
                  quantity: 1,
                  coinDeduction: serviceConfig?.vendorCoins || 0,
                },
              ]
            : leadData.packages.map((p) => ({
                category: "Deep Cleaning",
                subCategory: p.category,
                serviceName: p.name,
                price: p.totalAmount,
                quantity: 1,
                teamMembersRequired: p.teamMembers,
                coinDeduction: p.coinsForVendor || 0,
                packageId: p._id,
                duration: p.durationMinutes || p.duration || 0,
              })),

        bookingDetails: {
          bookingAmount: leadData.bookingAmount,
          finalTotal: leadData.totalAmount,
          paidAmount: 0,
          paymentMethod: "None",
        },

        address: {
          houseFlatNumber: leadData.houseNo,
          streetArea: leadData.googleAddress,
          landMark: leadData.landmark,
          city: leadData.city,
          location: {
            type: "Point",
            coordinates: [leadData.coordinates.lng, leadData.coordinates.lat],
          },
        },

        selectedSlot: {
          slotDate: leadData.slotDate,
          slotTime: leadData.slotTime,
        },

        formName: "admin panel",
        isEnquiry: leadData.bookingAmount > 0,
      };

      setSaving(true);
      await axios.post(`${BASE_URL}/bookings/create-admin-booking`, payload);

      toast.success(
        `${
          leadData.bookingAmount == 0
            ? "Lead created successfully!"
            : " Enquiry created successfully!"
        }`,
      );
      onClose();
      navigate(`${leadData.bookingAmount == 0 ? "/newleads" : "/enquiries"}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // New: fetch deep-cleaning packages by city name
  // -----------------------------
  const fetchDeepCleaningPackagesByCity = async (cityName) => {
    try {
      if (!cityName) {
        setCategories([]);
        return;
      }
      const encoded = encodeURIComponent(String(cityName).trim());
      const res = await axios.get(
        `${BASE_URL}/deeppackage/deep-cleaning-packages/by-city-name/${encoded}`,
      );
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch deep cleaning packages by city:", err);
      setCategories([]);
    }
  };

  // When the selected service type or city changes, load categories appropriately
  useEffect(() => {
    if (leadData.serviceType === "Deep Cleaning") {
      // fetch only when city known
      if (leadData.city) fetchDeepCleaningPackagesByCity(leadData.city);
      else setCategories([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadData.serviceType, leadData.city]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h6>Create New Lead / Enquiry</h6>
          <FaTimes style={styles.close} onClick={onClose} />
        </div>

        <div style={styles.content}>
          <input
            type="text"
            name="contact"
            placeholder="Customer Phone No."
            style={styles.input}
            onChange={handleChange}
            value={leadData.contact}
          />

          {checkingUser && (
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>
              Checking existing user…
            </div>
          )}

          <input
            type="text"
            name="name"
            placeholder="Customer Name"
            style={styles.input}
            readOnly={!!existingUser}
            onChange={handleChange}
            value={leadData.name}
          />

          <input
            type="text"
            placeholder="Google Address (click to pick)"
            style={{ ...styles.input, cursor: "pointer" }}
            onClick={() => setShowAddress(true)}
            readOnly
            value={leadData.googleAddress}
          />

          <input
            type="text"
            name="houseNo"
            placeholder="House No."
            style={styles.input}
            onChange={handleChange}
            value={leadData.houseNo}
          />

          <input
            type="text"
            name="landmark"
            placeholder="Landmark"
            style={styles.input}
            onChange={handleChange}
            value={leadData.landmark}
          />

          <input
            type="text"
            placeholder="Detected City"
            style={{ ...styles.input, background: "#eee" }}
            readOnly
            value={leadData.city}
          />

          {isTimeSelectionEnabled ? (
            <>
              <label style={styles.label}>Select Date & Time</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 15,
                }}
              >
                <input
                  readOnly
                  value={
                    leadData.slotDate
                      ? `${leadData.slotDate} ${leadData.slotTime}`
                      : "Select Date & Slot"
                  }
                  onClick={() => {
                    if (!isTimeSelectionEnabled) {
                      toast.error(
                        leadData.serviceType === "Deep Cleaning"
                          ? "Add at least one package"
                          : "Select service first",
                      );
                      return;
                    }
                    setShowTime(true);
                  }}
                  style={{
                    ...styles.input,
                    cursor: isTimeSelectionEnabled ? "pointer" : "not-allowed",
                    background: isTimeSelectionEnabled ? "#fff" : "#eee",
                  }}
                />
                {(leadData.slotDate || leadData.slotTime) && (
                  <button
                    style={{
                      padding: "5px 10px",
                      background: "#ff4444",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      height: "30px",
                    }}
                    onClick={() => {
                      setLeadData((p) => ({
                        ...p,
                        slotDate: "",
                        slotTime: "",
                      }));
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: "#666",
                marginBottom: 15,
                padding: 8,
                background: "#f5f5f5",
                borderRadius: 4,
                textAlign: "center",
              }}
            >
              Please select an service first to enable slot selection
            </div>
          )}
{/* 
          <select
            name="serviceType"
            style={styles.input}
            onChange={async (e) => {
              const val = e.target.value;

              invalidateSlot();

              if (val === "House Painting") {
                const resp = await axios.get(`${BASE_URL}/service/latest`);
                const siteVisit = resp.data.data.siteVisitCharge || 0;

                setLeadData((prev) => ({
                  ...prev,
                  serviceType: val,
                  packages: [],
                  selectedPackage: "",
                  totalAmount: 0,
                  bookingAmount: siteVisit,
                  amountYetToPay: 0,
                }));
                return;
              }

              if (val === "Deep Cleaning") {
                // fetch packages only if city exists; use effect will handle when city changes
                if (leadData.city) {
                  await fetchDeepCleaningPackagesByCity(leadData.city);
                } else {
                  setCategories([]);
                }
              }

              setLeadData((prev) => ({
                ...prev,
                serviceType: val,
                packages: [],
                selectedPackage: "",
                totalAmount: 0,
                bookingAmount: 0,
                amountYetToPay: 0,
              }));
            }}
            value={leadData.serviceType}
          >
            <option value="">Select Service</option>
            <option value="House Painting">House Painting</option>
            <option value="Deep Cleaning">Deep Cleaning</option>
          </select> */}

    <select
            name="serviceType"
            style={styles.input}
            disabled={!leadData.googleAddress}
            onChange={async (e) => {
              const val = e.target.value;

              invalidateSlot();

              if (val === "House Painting") {
                const resp = await axios.get(`${BASE_URL}/service/latest`);
                const siteVisit = resp.data.data.siteVisitCharge || 0;

                setLeadData((prev) => ({
                  ...prev,
                  serviceType: val,
                  packages: [],
                  selectedPackage: "",
                  totalAmount: 0,
                  bookingAmount: siteVisit,
                  amountYetToPay: 0,
                }));
                return;
              }

              if (val === "Deep Cleaning") {
                if (leadData.city) {
                  await fetchDeepCleaningPackagesByCity(leadData.city);
                } else {
                  setCategories([]);
                }
              }

              setLeadData((prev) => ({
                ...prev,
                serviceType: val,
                packages: [],
                selectedPackage: "",
                totalAmount: 0,
                bookingAmount: 0,
                amountYetToPay: 0,
              }));
            }}
            value={leadData.serviceType}
          >
            <option value="">Select Service</option>
            <option value="House Painting">House Painting</option>
            <option value="Deep Cleaning">Deep Cleaning</option>
          </select>
          {leadData.serviceType === "House Painting" && (
            <>
              <label style={styles.label}>Booking Amount</label>
              <input
                name="bookingAmount"
                type="number"
                value={leadData.bookingAmount}
                onChange={handleChange}
                style={styles.input}
              />
            </>
          )}

          {leadData.serviceType === "Deep Cleaning" && (
            <>
              <select
                value={selectedSubCategory}
                style={styles.input}
                onChange={(e) => {
                  setSelectedSubCategory(e.target.value);
                  setLeadData((p) => ({
                    ...p,
                    selectedPackage: "",
                    slotDate: "",
                    slotTime: "",
                  }));
                }}
              >
                <option value="">Select Subcategory</option>
                {uniqueDeepCategories().map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={leadData.selectedPackage}
                  style={styles.select}
                  disabled={!selectedSubCategory}
                  onChange={(e) =>
                    setLeadData((p) => ({
                      ...p,
                      selectedPackage: e.target.value,
                    }))
                  }
                >
                  <option value="">Select Package</option>
                  {categories
                    .filter((p) => p.category === selectedSubCategory)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} – ₹{p.totalAmount}
                      </option>
                    ))}
                </select>

                <button style={styles.addBtn} onClick={addPackage}>
                  +
                </button>
              </div>

              <ul style={styles.pkgList}>
                {leadData.packages.map((pkg) => (
                  <li key={pkg._id} style={styles.pkgItem}>
                    {pkg.name} – ₹{pkg.totalAmount}
                    <FaTimes
                      style={styles.remove}
                      onClick={() => removePackage(pkg)}
                    />
                  </li>
                ))}
              </ul>

              <label style={styles.label}>Total Amount</label>
              <input
                style={{ ...styles.input, background: "#eee" }}
                readOnly
                value={leadData.totalAmount}
              />

              {!discountApplied ? (
                <div style={styles.discountRow}>
                  <select
                    value={discountMode}
                    onChange={(e) => setDiscountMode(e.target.value)}
                    style={styles.discountSelect}
                  >
                    <option value="percent">% Discount</option>
                    <option value="amount">Fixed</option>
                  </select>

                  <input
                    type="number"
                    value={discountValue}
                    style={styles.discountInput}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />

                  <button style={styles.applyBtn} onClick={applyDiscount}>
                    Apply
                  </button>
                </div>
              ) : (
                <div style={styles.discountApplied}>
                  Discount Applied:{" "}
                  {discountMode === "percent"
                    ? `${discountValue}%`
                    : `₹${discountValue}`}
                  <MdCancel
                    style={styles.cancelDiscount}
                    onClick={clearDiscount}
                  />
                </div>
              )}

              <label style={styles.label}>Booking Amount</label>
              <input
                name="bookingAmount"
                type="number"
                style={styles.input}
                value={leadData.bookingAmount}
                onChange={handleChange}
              />

              <label style={styles.label}>Amount Yet To Pay</label>
              <input
                readOnly
                style={{ ...styles.input, background: "#eee" }}
                value={leadData.amountYetToPay}
              />
            </>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "20px",
            }}
          >
            <button
              style={{
                ...styles.saveBtn,
                background:
                  checkingUser || saving || !isFormValid()
                    ? "#ccc"
                    : styles.saveBtn.background,
                cursor:
                  checkingUser || saving || !isFormValid()
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={checkingUser || saving || !isFormValid()}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

    {showAddress && (
            <AddressPickerModal
              onClose={() => setShowAddress(false)}
              initialAddress={leadData.googleAddress || ""}
              initialHouseFlatNumber={leadData.houseNo || ""}
              initialCity={leadData.city || ""}
              initialLandmark={leadData.landmark || ""}
              initialLatLng={
                leadData.coordinates?.lat && leadData.coordinates?.lng
                  ? leadData.coordinates
                  : null
              }
              onSelect={(sel) => {
                const newCity = sel.city || leadData.city;
                const cityChanged = newCity !== leadData.city;

                if (cityChanged) {
                  setCategories([]);
                  setSelectedSubCategory("");
                }

                setLeadData((p) => ({
                  ...p,
                  googleAddress: sel.streetArea,
                  houseNo: sel.houseFlatNumber || p.houseNo,
                  landmark: sel.landMark || p.landmark,
                  coordinates: {
                    lat: sel.latLng?.lat || 0,
                    lng: sel.latLng?.lng || 0,
                  },
                  city: newCity,
                  slotDate: "",
                  slotTime: "",
                  ...(cityChanged && {
                    serviceType: "",
                    packages: [],
                    selectedPackage: "",
                    totalAmount: 0,
                    bookingAmount: 0,
                    amountYetToPay: 0,
                  }),
                }));
              }}
            />
          )}
      {showTime && (
        <TimePickerModal
          onClose={() => setShowTime(false)}
          onSelect={(sel) =>
            setLeadData((p) => ({
              ...p,
              slotDate: sel.slotDate,
              slotTime: sel.slotTime,
            }))
          }
          serviceType={
            leadData.serviceType === "Deep Cleaning"
              ? "deep_cleaning"
              : "house_painting"
          }
          city={leadData.city}
          packageId={
            leadData.serviceType === "Deep Cleaning"
              ? leadData.packages.map((p) => p._id)
              : []
          }
          coordinates={leadData.coordinates}
        />
      )}
      <ToastContainer />
    </div>
  );
};

/* Styles (unchanged) */
const styles = {
  overlay: {
    position: "fixed",
    top: "0%",
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Poppins', sans-serif",
    zIndex: 999999,
  },
  modal: {
    width: "560px",
    background: "#fff",
    borderRadius: 8,
    padding: 20,
    maxHeight: "85vh",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 15,
    marginBottom: 15,
    borderBottom: "1px solid #eaeaea",
  },
  close: {
    cursor: "pointer",
    fontSize: 18,
    color: "#666",
    transition: "color 0.2s",
  },
  closeHover: {
    color: "#333",
  },
  content: {
    maxHeight: "70vh",
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: 5,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 13,
    fontFamily: "'Poppins', sans-serif",
    boxSizing: "border-box",
    transition: "border 0.2s, box-shadow 0.2s",
  },
  inputFocus: {
    border: "1px solid #03942fff",
    boxShadow: "0 0 0 2px rgba(3, 148, 47, 0.1)",
    outline: "none",
  },
  select: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: "13px",
    fontFamily: "'Poppins', sans-serif",
    background: "white",
  },
  addBtn: {
    padding: "8px 15px",
    background: "#03942fff",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    transition: "background 0.2s",
  },
  addBtnHover: {
    background: "#027a3b",
  },
  pkgList: {
    listStyle: "none",
    padding: 0,
    margin: "10px 0",
  },
  pkgItem: {
    background: "#f8f9fa",
    padding: "10px 12px",
    borderRadius: 6,
    marginBottom: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    border: "1px solid #eaeaea",
  },
  remove: {
    cursor: "pointer",
    color: "#dc3545",
    fontSize: "14px",
    transition: "color 0.2s",
  },
  removeHover: {
    color: "#bd2130",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    display: "block",
    color: "#333",
  },
  discountRow: {
    display: "flex",
    gap: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  discountSelect: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: "13px",
    fontFamily: "'Poppins', sans-serif",
    background: "white",
    flex: 1,
  },
  discountInput: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    width: 120,
    fontSize: "13px",
    fontFamily: "'Poppins', sans-serif",
  },
  applyBtn: {
    padding: "8px 16px",
    color: "#fff",
    borderRadius: 6,
    cursor: "pointer",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    backgroundColor: "#a00a0aff",
    transition: "background 0.2s",
    whiteSpace: "nowrap",
  },
  applyBtnHover: {
    backgroundColor: "#8a0909",
  },
  discountApplied: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 13,
    color: "#28a745",
    padding: "10px 12px",
    background: "#f0fff4",
    borderRadius: 6,
    marginBottom: 12,
    border: "1px solid #c3e6cb",
  },
  cancelDiscount: {
    cursor: "pointer",
    color: "#dc3545",
    fontSize: "18px",
    transition: "color 0.2s",
  },
  cancelDiscountHover: {
    color: "#bd2130",
  },
  saveBtn: {
    padding: "10px 35px",
    background: "#03942fff",
    color: "white",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  saveBtnHover: {
    background: "#027a3b",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 8px rgba(3, 148, 47, 0.2)",
  },
};

export default CreateLeadModal;