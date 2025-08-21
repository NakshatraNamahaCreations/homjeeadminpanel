// import { useState } from "react";
// import { FaTimes } from "react-icons/fa";
// import axios from "axios";

// const CreateLeadModal = ({ onClose }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [showCustomInput, setShowCustomInput] = useState(false);
//   const [customPackage, setCustomPackage] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [leadData, setLeadData] = useState({
//     name: "",
//     contact: "",
//     googleAddress: "",
//     city: "",
//     houseNo: "",
//     landmark: "",
//     serviceType: "",
//     timeSlot: "",
//     totalAmount: "",
//     bookingAmount: "99/-",
//     packages: [],
//     selectedPackage: "",
//   });

//   const packagePrices = {
//     "Basic Package": "1000",
//     "Standard Package": "2000",
//     "Premium Package": "3000",
//   };

//   const getISTMinDateTime = () => {
//     const now = new Date();
//     const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
//     const istDate = new Date(now.getTime() + istOffset);
//     const year = istDate.getUTCFullYear();
//     const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
//     const day = String(istDate.getUTCDate()).padStart(2, "0");
//     const hours = String(istDate.getUTCHours()).padStart(2, "0");
//     const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setLeadData((prev) => ({
//       ...prev,
//       [name]: value,
//       packages: name === "serviceType" ? [] : prev.packages,
//       selectedPackage: name === "selectedPackage" ? value : prev.selectedPackage,
//       totalAmount:
//         name === "totalAmount"
//           ? value
//           : name === "selectedPackage"
//           ? packagePrices[value] || prev.totalAmount
//           : prev.totalAmount,
//       bookingAmount: name === "bookingAmount" ? value : prev.bookingAmount,
//     }));
//   };

//   const addPackage = () => {
//     const { selectedPackage, packages } = leadData;
//     if (selectedPackage && !packages.includes(selectedPackage) && packages.length < 2) {
//       setLeadData((prevState) => ({
//         ...prevState,
//         packages: [...prevState.packages, selectedPackage],
//         selectedPackage: "",
//       }));
//     }
//   };

//   const addCustomPackage = () => {
//     const trimmed = customPackage.trim();
//     if (trimmed && !leadData.packages.includes(trimmed) && leadData.packages.length < 2) {
//       setLead

// Data((prevState) => ({
//         ...prevState,
//         packages: [...prevState.packages, trimmed],
//       }));
//       setCustomPackage("");
//       setShowCustomInput(false);
//     }
//   };

//   const toggleEdit = () => {
//     setIsEditing(!isEditing);
//   };

//   const handleSave = async () => {
//     try {
//       setError("");
//       setSuccess("");

//       // Validate required fields
//       const requiredFields = ["name", "contact", "city", "houseNo", "serviceType", "timeSlot"];
//       for (const field of requiredFields) {
//         if (!leadData[field]) {
//           setError(`Please fill in the ${field} field.`);
//           return;
//         }
//       }

//       // Format the timeSlot to separate date and time
//       const slotDateTime = new Date(leadData.timeSlot);
//       const slotDate = slotDateTime.toISOString().slice(0, 10); // YYYY-MM-DD
//       const slotTime = slotDateTime.toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       });

//       // Prepare service data
//       const services = leadData.packages.map((pkg) => ({
//         category: leadData.serviceType,
//         subCategory: pkg,
//         serviceName: pkg,
//         price: packagePrices[pkg] || leadData.totalAmount || 0,
//         quantity: 1,
//       }));

//       // Prepare booking data for API
//       const bookingData = {
//         customer: {
//           customerId: `CUST-${Date.now()}`, // Generate a simple customer ID
//           name: leadData.name,
//           phone: leadData.contact,
//         },
//         service: services.length > 0 ? services : [{
//           category: leadData.serviceType,
//           subCategory: leadData.serviceType,
//           serviceName: leadData.serviceType,
//           price: leadData.totalAmount || 0,
//           quantity: 1,
//         }],
//         bookingDetails: {
//           bookingDate: new Date().toISOString(),
//           bookingTime: slotTime,
//           paidAmount: parseFloat(leadData.bookingAmount.replace("/-", "")) || 99,
//           amountYetToPay: parseFloat(leadData.totalAmount) - parseFloat(leadData.bookingAmount.replace("/-", "")) || 0,
//         },
//         address: {
//           houseFlatNumber: leadData.houseNo,
//           streetArea: leadData.googleAddress,
//           landMark: leadData.landmark,
//           location: {
//             type: "Point",
//             coordinates: [0, 0], // Placeholder; actual coordinates should be derived from googleAddress
//           },
//         },
//         selectedSlot: {
//           slotDate,
//           slotTime,
//         },
//         isEnquiry: true, // Since this is from CreateLeadModal
//       };

//       // Send POST request to the API
//       const response = await axios.post("https://homjee-backend.onrender.com/api/bookings/create-user-booking", bookingData);
//       setSuccess("Booking created successfully!");
//       setTimeout(() => {
//         onClose(); // Close the modal after success
//       }, 1500);
//     } catch (err) {
//       console.error("Error creating booking:", err);
//       setError(err.response?.data?.message || "Failed to create booking. Please try again.");
//     }
//   };

//   return (
//     <div style={styles.modalOverlay}>
//       <div style={styles.modal}>
//         <div style={styles.headerContainer}>
//           <h6 style={styles.heading}>Create New Lead/Enquiry</h6>
//           <FaTimes
//             style={{ marginLeft: "97%", marginTop: "-21%", cursor: "pointer" }}
//             onClick={onClose}
//           />
//         </div>

//         <div style={styles.modalContent}>
//           {error && <div style={{ color: "red", marginBottom: "10px", fontSize: "12px" }}>{error}</div>}
//           {success && <div style={{ color: "green", marginBottom: "10px", fontSize: "12px" }}>{success}</div>}

//           {/* Customer Details */}
//           <input
//             type="text"
//             name="name"
//             placeholder="Customer Name"
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.name}
//           />
//           <input
//             type="text"
//             name="contact"
//             placeholder="Customer Phone No."
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.contact}
//           />
//           <input
//             type="text"
//             name="googleAddress"
//             placeholder="Google Address"
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.googleAddress}
//           />
//           <input
//             type="text"
//             name="houseNo"
//             placeholder="House No."
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.houseNo}
//           />
//           <select
//             name="city"
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.city || ""}
//           >
//             <option value="" disabled>
//               Select City
//             </option>
//             <option value="Bengaluru">Bengaluru</option>
//             <option value="Mysuru">Mysuru</option>
//           </select>
//           <select
//             name="serviceType"
//             style={styles.input}
//             onChange={handleChange}
//             value={leadData.serviceType || ""}
//           >
//             <option value="" disabled>
//               Select Service
//             </option>
//             <option value="House Painting">House Painting</option>
//             <option value="Deep Cleaning">Deep Cleaning</option>
//           </select>

//           {leadData.serviceType === "Deep Cleaning" && (
//             <>
//               {/* Select + + Button */}
//               <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                 <select
//                   name="selectedPackage"
//                   style={{
//                     flex: 1,
//                     padding: "8px",
//                     borderRadius: "4px",
//                     fontSize: "14px",
//                     border: "1px solid #ddd",
//                   }}
//                   value={leadData.selectedPackage || ""}
//                   onChange={handleChange}
//                   disabled={leadData.packages.length >= 2}
//                 >
//                   <option value="" disabled>
//                     Select Package
//                   </option>
//                   <option value="Basic Package">Basic Package</option>
//                   <option value="Standard Package">Standard Package</option>
//                   <option value="Premium Package">Premium Package</option>
//                 </select>

//                 <button
//                   style={{
//                     backgroundColor: "",
//                     color: "black",
//                     border: "1px solid black",
//                     borderRadius: "4px",
//                     padding: "6px 10px",
//                     fontSize: "16px",
//                     cursor: "pointer",
//                     lineHeight: "1",
//                   }}
//                   onClick={() => {
//                     if (leadData.selectedPackage) addPackage();
//                     else setShowCustomInput(true);
//                   }}
//                   disabled={leadData.packages.length >= 2}
//                 >
//                   +
//                 </button>
//               </div>

//               {/* Custom Package Input */}
//               {showCustomInput && (
//                 <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
//                   <input
//                     type="text"
//                     placeholder="Enter custom package"
//                     value={customPackage}
//                     onChange={(e) => setCustomPackage(e.target.value)}
//                     style={{
//                       flex: 1,
//                       padding: "8px",
//                       fontSize: "14px",
//                       borderRadius: "4px",
//                       border: "1px solid #ddd",
//                     }}
//                   />
//                   <button
//                     onClick={addCustomPackage}
//                     style={{
//                       padding: "6px 12px",
//                       fontSize: "14px",
//                       borderRadius: "4px",
//                       border: "1px solid black",
//                       backgroundColor: "transparent",
//                       cursor: "pointer",
//                     }}
//                   >
//                     Add
//                   </button>
//                 </div>
//               )}

//               {/* Display Selected Packages */}
//               <ul style={{ listStyleType: "none", padding: 0, marginTop: "8px" }}>
//                 {leadData.packages.map((pkg, index) => (
//                   <li
//                     key={index}
//                     style={{
//                       backgroundColor: "#f4f4f4",
//                       padding: "6px",
//                       borderRadius: "4px",
//                       marginBottom: "6px",
//                       fontSize: "14px",
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                     }}
//                   >
//                     {pkg}
//                     <FaTimes
//                       style={{
//                         cursor: "pointer",
//                         color: "#d9534f",
//                         fontSize: "16px",
//                       }}
//                       onClick={() =>
//                         setLeadData((prev) => ({
//                           ...prev,
//                           packages: prev.packages.filter((item) => item !== pkg),
//                         }))
//                       }
//                     />
//                   </li>
//                 ))}
//               </ul>
//             </>
//           )}

//           <input
//             type="datetime-local"
//             name="timeSlot"
//             style={styles.input}
//             min={getISTMinDateTime()}
//             value={leadData.timeSlot}
//             onChange={handleChange}
//           />

//           {leadData.serviceType === "Deep Cleaning" && (
//             <>
//               <label style={{ fontSize: "12px", fontWeight: "600" }}>Total Amount</label>
//               {!isEditing ? (
//                 <div
//                   onClick={toggleEdit}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     cursor: "pointer",
//                     marginBottom: "10px",
//                   }}
//                 >
//                   <input
//                     type="text"
//                     name="totalAmount"
//                     placeholder="Total Amount"
//                     style={styles.input}
//                     value={leadData.totalAmount}
//                     onChange={handleChange}
//                     readOnly={!isEditing}
//                   />
//                 </div>
//               ) : (
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     marginBottom: "10px",
//                   }}
//                 >
//                   <input
//                     type="text"
//                     name="totalAmount"
//                     placeholder="Total Amount"
//                     style={styles.input}
//                     value={leadData.totalAmount}
//                     onChange={handleChange}
//                     autoFocus
//                   />
//                 </div>
//               )}
//             </>
//           )}

//           {(leadData.serviceType === "Deep Cleaning" || leadData.serviceType === "House Painting") && (
//             <>
//               <label style={{ fontSize: "12px", fontWeight: "600" }}>Booking Amount</label>
//               <input
//                 type="text"
//                 name="bookingAmount"
//                 placeholder="Booking Amount"
//                 value={leadData.bookingAmount}
//                 style={styles.input}
//                 onChange={handleChange}
//               />
//             </>
//           )}

//           <div style={styles.actions}>
//             <button style={styles.buttonConfirm} onClick={handleSave}>
//               Save
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Styles
// const styles = {
//   modalOverlay: {
//     position: "fixed",
//     fontFamily: "'Poppins', sans-serif",
//     top: "3%",
//     left: 0,
//     width: "100%",
//     height: "100%",
//     backgroundColor: "rgba(0,0,0,0.5)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   modal: {
//     backgroundColor: "#fff",
//     padding: "20px",
//     borderRadius: "8px",
//     width: "400px",
//     maxHeight: "80vh",
//     display: "flex",
//     flexDirection: "column",
//     boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
//     overflow: "hidden",
//   },
//   heading: {
//     fontSize: "14px",
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: "10px",
//   },
//   modalContent: {
//     maxHeight: "70vh",
//     overflowY: "auto",
//     paddingRight: "10px",
//     backgroundColor: "#fff",
//     borderRadius: "8px",
//     padding: "20px",
//     marginTop: "-9%",
//     scrollbarWidth: "none",
//     msOverflowStyle: "none",
//   },
//   "@global": {
//     ".modalContent::-webkit-scrollbar": {
//       display: "none",
//     },
//   },
//   input: {
//     width: "100%",
//     padding: "10px",
//     marginBottom: "10px",
//     borderRadius: "5px",
//     fontSize: "12px",
//     border: "1px solid #ccc",
//   },
//   actions: {
//     display: "flex",
//     flexDirection: "row",
//     gap: "10px",
//     marginTop: "10px",
//     justifyContent: "space-between",
//   },
//   buttonConfirm: {
//     color: "black",
//     padding: "8px 16px",
//     borderRadius: "6px",
//     cursor: "pointer",
//     border: "1px solid black",
//     fontSize: "12px",
//     whiteSpace: "nowrap",
//     textAlign: "center",
//     marginLeft: "auto",
//   },
// };

// export default CreateLeadModal;


import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";

/* ================= Address Picker (Google Maps) ================= */
const GOOGLE_MAPS_API_KEY = "AIzaSyBF48uqsKVyp9P2NlDX-heBJksvvT_8Cqk";

const loadGoogleMaps = () =>
  new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();
    const existing = document.querySelector('script[data-google="maps"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.setAttribute("data-google", "maps");
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });

const AddressPickerModal = ({
  initialLatLng = { lat: 12.9716, lng: 77.5946 },
  initialAddress = "",
  onClose,
  onSelect,
}) => {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const geocoderRef = useRef(null);
  const markerRef = useRef(null);

  const [addr, setAddr] = useState(initialAddress || "");
  const [houseFlat, setHouseFlat] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latLng, setLatLng] = useState(initialLatLng);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let map, autocomplete, marker, geocoder;

    const init = async () => {
      await loadGoogleMaps();
      geocoder = new window.google.maps.Geocoder();
      geocoderRef.current = geocoder;

      map = new window.google.maps.Map(mapRef.current, {
        center: initialLatLng,
        zoom: 16,
        streetViewControl: false,
        mapTypeControl: false,
      });

      marker = new window.google.maps.Marker({
        map,
        position: initialLatLng,
        draggable: true,
      });
      markerRef.current = marker;

      autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        fields: ["formatted_address", "geometry"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;
        const pos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setLatLng(pos);
        setAddr(place.formatted_address || "");
        map.panTo(pos);
        marker.setPosition(pos);
      });

      map.addListener("click", (e) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setLatLng(pos);
        marker.setPosition(pos);
        reverseGeocode(pos);
      });

      marker.addListener("dragend", () => {
        const pos = {
          lat: marker.getPosition().lat(),
          lng: marker.getPosition().lng(),
        };
        setLatLng(pos);
        reverseGeocode(pos);
      });

      if (!initialAddress) reverseGeocode(initialLatLng);
    };

    const reverseGeocode = (pos) => {
      geocoderRef.current.geocode({ location: pos }, (results, status) => {
        if (status === "OK" && results?.length) {
          setAddr(results[0].formatted_address);
        }
      });
    };

    init();
  }, [initialLatLng, initialAddress]);

  const onSave = () => {
    setSaving(true);
    onSelect({
      formattedAddress: addr,
      houseFlatNumber: houseFlat,
      landmark,
      lat: latLng.lat,
      lng: latLng.lng,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div style={addrStyles.overlay}>
      <div style={addrStyles.sheet}>
        <div style={addrStyles.headerRow}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Current Location</h3>
          <FaTimes style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={addrStyles.body}>
          <div style={addrStyles.mapCol}>
            <input
              ref={inputRef}
              placeholder="Search location or paste address"
              style={addrStyles.search}
            />
            <div ref={mapRef} style={addrStyles.mapBox} />
          </div>

          <div style={addrStyles.formCol}>
            <div style={addrStyles.addrPreview}>{addr || "Move the pin or search…"}</div>

            <label style={addrStyles.label}>House/Flat Number *</label>
            <input
              value={houseFlat}
              onChange={(e) => setHouseFlat(e.target.value)}
              placeholder="Enter House/Flat Number"
              style={addrStyles.input}
            />

            <label style={addrStyles.label}>Landmark (Optional)</label>
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Enter Landmark"
              style={addrStyles.input}
            />

            <button
              disabled={!addr || !houseFlat}
              onClick={onSave}
              style={{
                ...addrStyles.saveBtn,
                opacity: !addr || !houseFlat ? 0.6 : 1,
                cursor: !addr || !houseFlat ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Save and proceed"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const addrStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    fontFamily: "'Poppins', sans-serif",
  },
  sheet: {
    width: "90vw",
    maxWidth: 1000,
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #eee",
  },
  body: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: 16,
    padding: 16,
  },
  mapCol: { position: "relative", minHeight: 420 },
  search: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    zIndex: 2,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    background: "#fff",
  },
  mapBox: { width: "100%", height: "100%", borderRadius: 8 },
  formCol: { display: "flex", flexDirection: "column", gap: 10 },
  addrPreview: {
    minHeight: 48,
    padding: 12,
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 1.3,
    background: "#fafafa",
  },
  label: { fontSize: 12, fontWeight: 600 },
  input: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 8,
    padding: "12px 14px",
    border: "1px solid #111",
    background: "#fff",
    borderRadius: 10,
    fontWeight: 600,
  },
};

/* ================= Time Picker (date chips + time slots) ================= */

const hoursList = [
  "08:00 AM","09:00 AM","10:00 AM","11:00 AM",
  "12:00 PM","01:00 PM","02:00 PM","03:00 PM",
  "04:00 PM","05:00 PM","06:00 PM","07:00 PM",
  "08:00 PM","09:00 PM","10:00 PM",
];

const toDisplay = (d) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const yyyymmdd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const nextNDays = (n) => {
  const out = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push(d);
  }
  return out;
};

const TimePickerModal = ({ onClose, onSelect, approxHours = 5 }) => {
  const [dates] = useState(nextNDays(14));
  const [selectedDate, setSelectedDate] = useState(yyyymmdd(dates[0]));
  const [selectedTime, setSelectedTime] = useState("");

  const proceed = () => {
    if (!selectedDate || !selectedTime) return;

    const [hhmm, ampm] = selectedTime.split(" ");
    let [hh, mm] = hhmm.split(":").map((x) => parseInt(x, 10));
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    const iso = `${selectedDate}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;

    onSelect({
      slotDate: selectedDate,
      slotTime: selectedTime,
      display: `${selectedTime}, ${selectedDate}`,
      isoLocal: iso,
    });
    onClose();
  };

  return (
    <div style={timeStyles.overlay}>
      <div style={timeStyles.sheet}>
        <div style={timeStyles.headerRow}>
          <h3 style={{ margin: 0, fontSize: 18 }}>When should the professional arrive?</h3>
          <FaTimes style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        <div style={{ padding: 16, color: "#666", fontSize: 14 }}>
          Service will take approx. {approxHours} hrs
        </div>

        {/* Date chips */}
        <div style={{ display: "flex", gap: 12, padding: "0 16px 12px", flexWrap: "wrap" }}>
          {dates.map((d) => {
            const id = yyyymmdd(d);
            const active = id === selectedDate;
            const [w, m, day] = toDisplay(d).split(" ");
            return (
              <button
                key={id}
                onClick={() => setSelectedDate(id)}
                style={{
                  border: active ? "2px solid #111" : "1px solid #ddd",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#fff",
                  cursor: "pointer",
                  minWidth: 110,
                  fontWeight: 600,
                }}
              >
                <div style={{ fontSize: 14 }}>{w}</div>
                <div style={{ fontSize: 12, color: "#333" }}>
                  {m} {day}
                </div>
              </button>
            );
          })}
        </div>

        {/* Time grid */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
            Select start time of service
          </div>
          <div style={timeStyles.grid}>
            {hoursList.map((t) => {
              const active = t === selectedTime;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  style={{
                    border: active ? "2px solid #111" : "1px solid #ddd",
                    padding: "14px",
                    borderRadius: 10,
                    background: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky footer (always visible) */}
        <div style={timeStyles.footer}>
          <button
            onClick={proceed}
            disabled={!selectedDate || !selectedTime}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: !selectedDate || !selectedTime ? "#d9d9d9" : "#111",
              color: !selectedDate || !selectedTime ? "#888" : "#fff",
              fontWeight: 700,
              cursor: !selectedDate || !selectedTime ? "not-allowed" : "pointer",
            }}
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
};

const timeStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    fontFamily: "'Poppins', sans-serif",
  },
  sheet: {
    width: "90vw",
    maxWidth: 700,
    maxHeight: "75vh",     // ⬅️ cap height
    overflowY: "auto",     // ⬅️ entire modal scrolls
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px",
    borderBottom: "1px solid #eee",
    background: "#fff",
    position: "sticky",
    top: 0,                // keep header visible while scrolling
    zIndex: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  footer: {
    position: "sticky",    // ⬅️ button stays visible
    bottom: 0,
    padding: 16,
    borderTop: "1px solid #eee",
    background: "#fff",
  },
};


/* ======================= Main CreateLeadModal ======================= */

const CreateLeadModal = ({ onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPackage, setCustomPackage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddress, setShowAddress] = useState(false);
  const [showTime, setShowTime] = useState(false);
const DEFAULT_FORM_NAME = "Admin Panel";

  const [leadData, setLeadData] = useState({
    name: "",
    contact: "",
    googleAddress: "",
    city: "",
    houseNo: "",
    landmark: "",
    serviceType: "",
    // time fields now handled by the popup:
    timeSlot: "",       // human-readable or ISO-like string for display (optional)
    slotDate: "",       // "YYYY-MM-DD"
    slotTime: "",       // "08:00 AM"
    totalAmount: "",
    bookingAmount: "99/-",
    packages: [],
    selectedPackage: "",
    coordinates: { lat: 0, lng: 0 },
  });

  const packagePrices = {
    "Basic Package": "1000",
    "Standard Package": "2000",
    "Premium Package": "3000",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeadData((prev) => ({
      ...prev,
      [name]: value,
      packages: name === "serviceType" ? [] : prev.packages,
      selectedPackage: name === "selectedPackage" ? value : prev.selectedPackage,
      totalAmount:
        name === "totalAmount"
          ? value
          : name === "selectedPackage"
          ? packagePrices[value] || prev.totalAmount
          : prev.totalAmount,
      bookingAmount: name === "bookingAmount" ? value : prev.bookingAmount,
    }));
  };

  const addPackage = () => {
    const { selectedPackage, packages } = leadData;
    if (selectedPackage && !packages.includes(selectedPackage) && packages.length < 2) {
      setLeadData((prevState) => ({
        ...prevState,
        packages: [...prevState.packages, selectedPackage],
        selectedPackage: "",
      }));
    }
  };

  const addCustomPackage = () => {
    const trimmed = customPackage.trim();
    if (trimmed && !leadData.packages.includes(trimmed) && leadData.packages.length < 2) {
      setLeadData((prevState) => ({
        ...prevState,
        packages: [...prevState.packages, trimmed],
      }));
      setCustomPackage("");
      setShowCustomInput(false);
    }
  };

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleSave = async () => {
    try {
      setError("");
      setSuccess("");

      const required = ["name", "contact", "city", "houseNo", "serviceType", "slotDate", "slotTime", "googleAddress"];
      for (const f of required) {
        if (!leadData[f]) {
          setError(`Please fill in the ${f} field.`);
          return;
        }
      }

      const services = leadData.packages.map((pkg) => ({
        category: leadData.serviceType,
        subCategory: pkg,
        serviceName: pkg,
        price: packagePrices[pkg] || leadData.totalAmount || 0,
        quantity: 1,
      }));

      const bookingData = {
        customer: {
          customerId: `CUST-${Date.now()}`,
          name: leadData.name,
          phone: leadData.contact,
        },
        service:
          services.length > 0
            ? services
            : [
                {
                  category: leadData.serviceType,
                  subCategory: leadData.serviceType,
                  serviceName: leadData.serviceType,
                  price: leadData.totalAmount || 0,
                  quantity: 1,
                },
              ],
        bookingDetails: {
          bookingDate: new Date().toISOString(),
          bookingTime: leadData.slotTime, // keep your readable time
          paidAmount: parseFloat(leadData.bookingAmount.replace("/-", "")) || 99,
          amountYetToPay:
            (parseFloat(leadData.totalAmount || 0) -
              (parseFloat(leadData.bookingAmount.replace("/-", "")) || 0)) || 0,
        },
        address: {
          houseFlatNumber: leadData.houseNo,
          streetArea: leadData.googleAddress,
          landMark: leadData.landmark,
          location: {
            type: "Point",
            coordinates: [leadData.coordinates.lng || 0, leadData.coordinates.lat || 0],
          },
        },
        selectedSlot: { slotDate: leadData.slotDate, slotTime: leadData.slotTime },
        isEnquiry: true,
        formName: DEFAULT_FORM_NAME,   // preferred key
  formname: DEFAULT_FORM_NAME, 
      };

      await axios.post(
        "https://homjee-backend.onrender.com/api/bookings/create-user-booking",
        bookingData
      );

      setSuccess("Booking created successfully!");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error("Error creating booking:", err);
      setError(err.response?.data?.message || "Failed to create booking. Please try again.");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.headerContainer}>
          <h6 style={styles.heading}>Create New Lead/Enquiry</h6>
          <FaTimes
            style={{ marginLeft: "97%", marginTop: "-21%", cursor: "pointer" }}
            onClick={onClose}
          />
        </div>

        <div style={styles.modalContent}>
          {error && <div style={{ color: "red", marginBottom: 10, fontSize: 12 }}>{error}</div>}
          {success && <div style={{ color: "green", marginBottom: 10, fontSize: 12 }}>{success}</div>}

          <input
            type="text"
            name="name"
            placeholder="Customer Name"
            style={styles.input}
            onChange={handleChange}
            value={leadData.name}
          />
          <input
            type="text"
            name="contact"
            placeholder="Customer Phone No."
            style={styles.input}
            onChange={handleChange}
            value={leadData.contact}
          />

          {/* Address field -> opens Google map modal */}
          <input
            type="text"
            name="googleAddress"
            placeholder="Google Address (click to pick)"
            style={{ ...styles.input, cursor: "pointer" }}
            onClick={() => setShowAddress(true)}
            value={leadData.googleAddress}
            readOnly
          />

          <input
            type="text"
            name="houseNo"
            placeholder="House No."
            style={styles.input}
            onChange={handleChange}
            value={leadData.houseNo}
          />

          <select name="city" style={styles.input} onChange={handleChange} value={leadData.city || ""}>
            <option value="" disabled>
              Select City
            </option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Mysuru">Mysuru</option>
          </select>

          <select
            name="serviceType"
            style={styles.input}
            onChange={handleChange}
            value={leadData.serviceType || ""}
          >
            <option value="" disabled>
              Select Service
            </option>
            <option value="House Painting">House Painting</option>
            <option value="Deep Cleaning">Deep Cleaning</option>
          </select>

          {leadData.serviceType === "Deep Cleaning" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  name="selectedPackage"
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    border: "1px solid #ddd",
                  }}
                  value={leadData.selectedPackage || ""}
                  onChange={handleChange}
                  disabled={leadData.packages.length >= 2}
                >
                  <option value="" disabled>
                    Select Package
                  </option>
                  <option value="Basic Package">Basic Package</option>
                  <option value="Standard Package">Standard Package</option>
                  <option value="Premium Package">Premium Package</option>
                </select>

                <button
                  style={{
                    backgroundColor: "",
                    color: "black",
                    border: "1px solid black",
                    borderRadius: "4px",
                    padding: "6px 10px",
                    fontSize: "16px",
                    cursor: "pointer",
                    lineHeight: "1",
                  }}
                  onClick={() => {
                    if (leadData.selectedPackage) addPackage();
                    else setShowCustomInput(true);
                  }}
                  disabled={leadData.packages.length >= 2}
                >
                  +
                </button>
              </div>

              {showCustomInput && (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter custom package"
                    value={customPackage}
                    onChange={(e) => setCustomPackage(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      fontSize: "14px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  />
                  <button
                    onClick={addCustomPackage}
                    style={{
                      padding: "6px 12px",
                      fontSize: "14px",
                      borderRadius: "4px",
                      border: "1px solid black",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              )}

              <ul style={{ listStyleType: "none", padding: 0, marginTop: 8 }}>
                {leadData.packages.map((pkg, index) => (
                  <li
                    key={index}
                    style={{
                      backgroundColor: "#f4f4f4",
                      padding: "6px",
                      borderRadius: "4px",
                      marginBottom: "6px",
                      fontSize: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {pkg}
                    <FaTimes
                      style={{ cursor: "pointer", color: "#d9534f", fontSize: 16 }}
                      onClick={() =>
                        setLeadData((prev) => ({
                          ...prev,
                          packages: prev.packages.filter((item) => item !== pkg),
                        }))
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ======= NEW: Time picker trigger (no datetime-local) ======= */}
          <div
            onClick={() => setShowTime(true)}
            style={{
              ...styles.input,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              color: leadData.slotDate && leadData.slotTime ? "#111" : "#777",
              background: "#fff",
            }}
          >
            {leadData.slotDate && leadData.slotTime
              ? `${leadData.slotTime}, ${leadData.slotDate}`
              : "Select service start date & time"}
          </div>

          {leadData.serviceType === "Deep Cleaning" && (
            <>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Total Amount</label>
              {!isEditing ? (
                <div
                  onClick={toggleEdit}
                  style={{ display: "flex", alignItems: "center", cursor: "pointer", marginBottom: 10 }}
                >
                  <input
                    type="text"
                    name="totalAmount"
                    placeholder="Total Amount"
                    style={styles.input}
                    value={leadData.totalAmount}
                    onChange={handleChange}
                    readOnly={!isEditing}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                  <input
                    type="text"
                    name="totalAmount"
                    placeholder="Total Amount"
                    style={styles.input}
                    value={leadData.totalAmount}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>
              )}
            </>
          )}

          {(leadData.serviceType === "Deep Cleaning" || leadData.serviceType === "House Painting") && (
            <>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Booking Amount</label>
              <input
                type="text"
                name="bookingAmount"
                placeholder="Booking Amount"
                value={leadData.bookingAmount}
                style={styles.input}
                onChange={handleChange}
              />
            </>
          )}

          <div style={styles.actions}>
            <button style={styles.buttonConfirm} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Address & Time modals */}
      {showAddress && (
        <AddressPickerModal
          initialAddress={leadData.googleAddress}
          initialLatLng={
            leadData.coordinates.lat
              ? { lat: leadData.coordinates.lat, lng: leadData.coordinates.lng }
              : undefined
          }
          onClose={() => setShowAddress(false)}
          onSelect={(sel) =>
            setLeadData((p) => ({
              ...p,
              googleAddress: sel.formattedAddress,
              houseNo: sel.houseFlatNumber || p.houseNo,
              landmark: sel.landmark || p.landmark,
              coordinates: { lat: sel.lat, lng: sel.lng },
            }))
          }
        />
      )}

      {showTime && (
        <TimePickerModal
          onClose={() => setShowTime(false)}
          onSelect={(sel) =>
            setLeadData((p) => ({
              ...p,
              timeSlot: sel.isoLocal, // optional display/back-compat
              slotDate: sel.slotDate,
              slotTime: sel.slotTime,
            }))
          }
        />
      )}
    </div>
  );
};

/* ======================= Styles (base) ======================= */
const styles = {
  modalOverlay: {
    position: "fixed",
    fontFamily: "'Poppins', sans-serif",
    top: "3%",
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  heading: {
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "10px",
  },
  headerContainer: {},
  modalContent: {
    maxHeight: "70vh",
    overflowY: "auto",
    paddingRight: "10px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "20px",
    marginTop: "-9%",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  "@global": {
    ".modalContent::-webkit-scrollbar": { display: "none" },
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    fontSize: "12px",
    border: "1px solid #ccc",
    background: "#fff",
  },
  actions: {
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    marginTop: "10px",
    justifyContent: "space-between",
  },
  buttonConfirm: {
    color: "black",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    border: "1px solid black",
    fontSize: "12px",
    whiteSpace: "nowrap",
    textAlign: "center",
    marginLeft: "auto",
  },
};

export default CreateLeadModal;
