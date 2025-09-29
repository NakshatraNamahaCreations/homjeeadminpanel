import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


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
 initialLatLng,
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
   const [latLng, setLatLng] = useState(initialLatLng || null);
  const [saving, setSaving] = useState(false);
  const [houseFlatError, setHouseFlatError] = useState("");

  const validateHouseFlat = (value) => {
    if (!value.trim()) {
      setHouseFlatError("House/Flat Number is required");
      return false;
    }
    if (value.length > 50) {
      setHouseFlatError("House/Flat Number must be 50 characters or less");
      return false;
    }
    setHouseFlatError("");
    return true;
  };

useEffect(() => {
  let map, autocomplete, marker, geocoder;

  const reverseGeocode = (pos) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: pos }, (results, status) => {
      if (status === "OK" && results?.length) {
        setAddr(results[0].formatted_address);
      }
    });
  };

  const init = async (posToUse) => {
    await loadGoogleMaps();
    geocoder = new window.google.maps.Geocoder();
    geocoderRef.current = geocoder;

    map = new window.google.maps.Map(mapRef.current, {
      center: posToUse,
      zoom: 16,
      streetViewControl: false,
      mapTypeControl: false,
    });

    marker = new window.google.maps.Marker({
      map,
      position: posToUse,
      draggable: true,
    });
    markerRef.current = marker;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
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

    if (!initialAddress) reverseGeocode(posToUse);
  };

  // ✅ Try current location first
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLatLng(currentPos);
        init(currentPos);
      },
      () => {
        // fallback if user blocks location
        init(initialLatLng || { lat: 12.9716, lng: 77.5946 }); // default to Bangalore
      }
    );
  } else {
    init(initialLatLng || { lat: 12.9716, lng: 77.5946 });
  }
}, [initialLatLng, initialAddress]);




  const onSave = () => {
    if (!validateHouseFlat(houseFlat)) return;
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
              onChange={(e) => {
                setHouseFlat(e.target.value);
                validateHouseFlat(e.target.value);
              }}
              placeholder="Enter House/Flat Number"
              style={addrStyles.input}
            />
            {houseFlatError && <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>{houseFlatError}</div>}

            <label style={addrStyles.label}>Landmark (Optional)</label>
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Enter Landmark"
              style={addrStyles.input}
            />

            <button
              disabled={!addr || !houseFlat || houseFlatError}
              onClick={onSave}
              style={{
                ...addrStyles.saveBtn,
                opacity: !addr || !houseFlat || houseFlatError ? 0.6 : 1,
                cursor: !addr || !houseFlat || houseFlatError ? "not-allowed" : "pointer",
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
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  "08:00 PM", "09:00 PM", "10:00 PM",
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

const formatTime = (time) => {
  const [hours, minutes] = time.split(":");
  const ampm = minutes.split(" ")[1];
  let newHour = parseInt(hours);
  
  if (ampm === "PM" && newHour !== 12) {
    newHour += 12;
  }
  if (ampm === "AM" && newHour === 12) {
    newHour = 0;
  }
  
  return `${String(newHour).padStart(2, "0")}:${minutes.split(" ")[0]}`;
};

const TimePickerModal = ({ onClose, onSelect, approxHours = 5 }) => {
  const [dates] = useState(nextNDays(14));
  const [selectedDate, setSelectedDate] = useState(yyyymmdd(dates[0]));
  const [selectedTime, setSelectedTime] = useState("");
    const [availableTimes, setAvailableTimes] = useState([]); 

  useEffect(() => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  // Calculate time 3 hours from now
  const threeHoursLater = new Date(currentTime);
  threeHoursLater.setHours(currentHour + 3, currentMinute, 0, 0);
  const threeHoursLaterString = `${String(threeHoursLater.getHours()).padStart(2, "0")}:${String(threeHoursLater.getMinutes()).padStart(2, "0")}`;
  

  const filteredTimes = hoursList.filter(time => {
    return formatTime(time) > threeHoursLaterString;
  }).slice(0, 10); 

  setAvailableTimes(filteredTimes);
}, [selectedDate]); 


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

        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
            Select start time of service
          </div>
          <div style={timeStyles.grid}>
            {availableTimes.map((t) => {
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
    maxHeight: "75vh",
    overflowY: "auto",
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
    top: 0,
    zIndex: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  footer: {
    position: "sticky",
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


  const [leadData, setLeadData] = useState({
    name: "",
    contact: "",
    googleAddress: "",
    city: "",
    houseNo: "",
    landmark: "",
    serviceType: "",
    
    timeSlot: "",
    slotDate: "",
    slotTime: "",
    totalAmount: "",
    bookingAmount: "99/-",
    packages: [],
    selectedPackage: "",
    coordinates: { lat: 0, lng: 0 },
      formName: "admin panel", 
  createdDate: "", 
  createdTime: "",
  });


   const [categories, setCategories] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [errors, setErrors] = useState({
    name: "",
    contact: "",
    googleAddress: "",
    city: "",
    houseNo: "",
    serviceType: "",
    slotDate: "",
    slotTime: "",
    totalAmount: "",
    bookingAmount: "",
    customPackage: "",
  });

  const packagePrices = {
    "Basic Package": "1000",
    "Standard Package": "2000",
    "Premium Package": "3000",
  };

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Customer Name is required";
        if (value.length > 50) return "Name must be 50 characters or less";
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Name must contain only letters and spaces"; // Enforces only letters and spaces
        return "";
      case "contact":
        if (!value.trim()) return "Phone Number is required";
        if (!/^\d{10}$/.test(value)) return "Phone Number must be exactly 10 digits"; // Enforces exactly 10 digits
        return "";
      case "googleAddress":
        if (!value.trim()) return "Address is required";
        return "";
      case "city":
        if (!value) return "City is required";
        return "";
      case "houseNo":
        if (!value.trim()) return "House Number is required";
        if (value.length > 50) return "House Number must be 50 characters or less";
        return "";
      case "serviceType":
        if (!value) return "Service Type is required";
        return "";
      case "slotDate":
        if (!value) return "Service Date is required";
        return "";
      case "slotTime":
        if (!value) return "Service Time is required";
        return "";
      case "totalAmount":
        if (leadData.serviceType === "Deep Cleaning" && !value) return "Total Amount is required";
        if (value && !/^\d+(\.\d{1,2})?$/.test(value)) return "Total Amount must be a valid number";
        if (value && parseFloat(value) <= 0) return "Total Amount must be greater than 0";
        return "";
      case "bookingAmount":
  if ((leadData.serviceType === "Deep Cleaning" || leadData.serviceType === "House Painting") && !value) {
    return "Booking Amount is required";
  }
  if (value && !/^\d+(\.\d{1,2})?$/.test(value)) {
    return "Booking Amount must be a valid number";
  }
  if (value && parseFloat(value) <= 0) {
    return "Booking Amount must be greater than 0";
  }
  return "";

      case "customPackage":
        if (value && value.length > 100) return "Custom Package must be 100 characters or less";
        return "";
      default:
        return "";
    }
  };




const handleChange = async (e) => {
  const { name, value } = e.target;
  let sanitizedValue = value;

  if (name === "name") {
    sanitizedValue = value.replace(/[^a-zA-Z\s]/g, ''); 
  } else if (name === "contact") {
    sanitizedValue = value.replace(/\D/g, '').slice(0, 10); 
  }


  if (name === "serviceType" && value === "House Painting") {
    try {
      const response = await axios.get("https://homjee-backend.onrender.com/api/service/latest");
      const siteVisitCharge = response.data.data.siteVisitCharge || "99"; 
      setLeadData((prev) => ({
        ...prev,
        [name]: value,
        bookingAmount: siteVisitCharge, 
      }));
    } catch (error) {
      console.error("Error fetching site visit charge:", error);
    }
  }
  

  else if (name === "serviceType" && value === "Deep Cleaning") {
    try {
      const response = await axios.get("https://homjee-backend.onrender.com/api/deeppackage/deep-cleaning-packages");
      setCategories(response.data.data); 
      setLeadData((prev) => ({
        ...prev,
        [name]: value,
        selectedPackage: "", 
        totalAmount: 0, 
        bookingAmount: 0,
        packages: [], 
      }));
    } catch (error) {
      console.error("Error fetching deep cleaning packages:", error);
    }
  }


  else if (name === "selectedPackage") {
    const selectedPackage = categories.find(pkg => pkg._id === value);
    if (selectedPackage) {
      setLeadData((prev) => ({
        ...prev,
        selectedPackage: value,
        totalAmount: prev.totalAmount + selectedPackage.totalAmount,
        bookingAmount: prev.bookingAmount + selectedPackage.bookingAmount, 
      }));
    }
  }

  // Update other fields
  else {
    setLeadData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
      packages: name === "serviceType" ? [] : prev.packages,
      totalAmount:
        name === "totalAmount"
          ? value
          : prev.totalAmount,
      bookingAmount: name === "bookingAmount" ? value : prev.bookingAmount,
    }));
  }

  setErrors((prev) => ({ ...prev, [name]: validateField(name, sanitizedValue) }));
};


  const handleCategorySelect = (category) => {

  setSelectedCategory(category);


  setLeadData((prev) => ({
    ...prev,
    totalAmount: (prev.totalAmount || 0) + category.totalAmount, 
    bookingAmount: (prev.bookingAmount || 0) + category.bookingAmount, 
  }));
};




const addPackage = () => {
  const { selectedPackage, packages } = leadData;
  if (selectedPackage && !packages.includes(selectedPackage)) {
    const selectedCategory = categories.find((pkg) => pkg._id === selectedPackage);
    if (selectedCategory) {
      setLeadData((prevState) => ({
        ...prevState,
        packages: [...prevState.packages, selectedCategory],
        totalAmount: prevState.totalAmount + selectedCategory.totalAmount,
        bookingAmount: prevState.bookingAmount + selectedCategory.bookingAmount,
        selectedPackage: "",
      }));
    }
  }
};

const removePackage = (pkgToRemove) => {
  setLeadData((prevState) => ({
    ...prevState,
    packages: prevState.packages.filter((pkg) => pkg._id !== pkgToRemove._id),
    totalAmount: prevState.totalAmount - pkgToRemove.totalAmount,
    bookingAmount: prevState.bookingAmount - pkgToRemove.bookingAmount,
  }));
};
  const addCustomPackage = () => {
    const trimmed = customPackage.trim();
    const error = validateField("customPackage", trimmed);
    if (error) {
      setErrors((prev) => ({ ...prev, customPackage: error }));
      return;
    }
    if (trimmed && !leadData.packages.includes(trimmed) && leadData.packages.length < 2) {
      setLeadData((prevState) => ({
        ...prevState,
        packages: [...prevState.packages, trimmed],
      }));
      setCustomPackage("");
      setShowCustomInput(false);
      setErrors((prev) => ({ ...prev, customPackage: "" }));
    }
  };

  const toggleEdit = () => setIsEditing(!isEditing);

  const handleSave = async () => {
    const required = ["name", "contact", "city", "houseNo", "serviceType", "slotDate", "slotTime", "googleAddress", "bookingAmount"];
    if (leadData.serviceType === "Deep Cleaning") required.push("totalAmount");
    if (leadData.serviceType === "Deep Cleaning" || leadData.serviceType === "House Painting") required.push("bookingAmount");

    const newErrors = {};
    let hasError = false;

    required.forEach((field) => {
      const error = validateField(field, leadData[field]);
      newErrors[field] = error;
      if (error) hasError = true;
    });

    setErrors(newErrors);

    if (hasError) {
      setError("Please fix all errors before submitting.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const now = new Date();
    const createdDate = now.toISOString().slice(0, 10); 
    const createdTime = now.toISOString().slice(11, 19);

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
          bookingTime: leadData.slotTime,
      paidAmount: parseFloat(leadData.bookingAmount) || 99,
amountYetToPay:
  (parseFloat(leadData.totalAmount || 0) -
    (parseFloat(leadData.bookingAmount) || 0)) || 0,

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
            formName: "admin panel",
      createdDate, 
      createdTime,
      };

      await axios.post(
        "https://homjee-backend.onrender.com/api/bookings/create-user-booking",
        bookingData
      );

      toast.success("Lead created successfully!", {
        position: "top-right",
        autoClose: 1500,
        onClose: () => {
          onClose();
          window.location.reload();
        },
      });
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

          <div>
            <input
              type="text"
              name="name"
              placeholder="Customer Name"
              style={styles.input}
              onChange={handleChange}
              value={leadData.name}
            />
            {errors.name && <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>{errors.name}</div>}
          </div>

          <div>
            <input
              type="text"
              name="contact"
              placeholder="Customer Phone No."
              style={styles.input}
              onChange={handleChange}
              value={leadData.contact}
            />
            {errors.contact && <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>{errors.contact}</div>}
          </div>

          <div>
            <input
              type="text"
              name="googleAddress"
              placeholder="Google Address (click to pick)"
              style={{ ...styles.input, cursor: "pointer" }}
              onClick={() => setShowAddress(true)}
              value={leadData.googleAddress}
              readOnly
            />
            {errors.googleAddress && <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>{errors.googleAddress}</div>}
          </div>

          <div>
            <input
              type="text"
              name="houseNo"
              placeholder="House No."
              style={styles.input}
              onChange={handleChange}
              value={leadData.houseNo}
            />
            {errors.houseNo && <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>{errors.houseNo}</div>}
          </div>

          <div>
            <select name="city" style={styles.input} onChange={handleChange} value={leadData.city || ""}>
              <option value="" disabled>Select City</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mysuru">Mysuru</option>
            </select>
            {errors.city && <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>{errors.city}</div>}
          </div>

          <div>
            <select
              name="serviceType"
              style={styles.input}
              onChange={handleChange}
              value={leadData.serviceType || ""}
            >
              <option value="" disabled>Select Service</option>
              <option value="House Painting">House Painting</option>
              <option value="Deep Cleaning">Deep Cleaning</option>
            </select>
            {errors.serviceType && <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>{errors.serviceType}</div>}
          </div>


  {leadData.serviceType === "Deep Cleaning" && (
  <div style={styles.packageSelectionContainer}>
    {/* <label style={styles.label}>Select Cleaning Package</label> */}
    <div style={styles.packageSelectorContainer}>
      <select
        onChange={(e) => setLeadData((prev) => ({ ...prev, selectedPackage: e.target.value }))}
        value={leadData.selectedPackage || ""}
        style={styles.selectBox}
      >
        <option value="" disabled>Select Package</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {category.name} - ₹{category.totalAmount}
          </option>
        ))}
      </select>
      <button onClick={addPackage} style={styles.addButton}>
        +
      </button>
    </div>
  </div>
)}

  {leadData.serviceType === "Deep Cleaning" && (
<div style={styles.selectedPackagesContainer}>

  <ul style={styles.packageList}>
    {leadData.packages.map((pkg) => (
      <li key={pkg._id} style={styles.packageItem}>
        <span>{pkg.name} - ₹{pkg.totalAmount}</span>
        <FaTimes
          style={styles.removeIcon}
          onClick={() => removePackage(pkg)}
        />
      </li>
    ))}
  </ul>
</div>
)}



      



          <div>
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
            {(errors.slotDate || errors.slotTime) && (
              <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>
                {errors.slotDate || errors.slotTime}
              </div>
            )}
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
              {errors.totalAmount && <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>{errors.totalAmount}</div>}
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
              {errors.bookingAmount && <div style={{ color: "red", fontSize: 12, marginTop: -6, marginBottom: 6 }}>{errors.bookingAmount}</div>}
            </>
          )}

          <div style={styles.actions}>
            <button style={styles.buttonConfirm} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>

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
              timeSlot: sel.isoLocal,
              slotDate: sel.slotDate,
              slotTime: sel.slotTime,
            }))
          }
        />
      )}

      <ToastContainer position="top-right"
  autoClose={1500}
  style={{ marginTop: "40px" }}  />
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
  packageSelectionContainer: {
    marginBottom: "20px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#333",
  },
  packageSelectorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  selectBox: {
    flex: 1,
    padding: "8px 12px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    color: "#333",
    cursor: "pointer",
  },
  addButton: {
    padding: "8px 12px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  selectedPackagesContainer: {
    marginTop: "20px",
  },
  packageList: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
  },
  packageItem: {
    backgroundColor: "#f9f9f9",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#333",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
  },
  removeIcon: {
    cursor: "pointer",
    color: "#d9534f",
    fontSize: "16px",
    transition: "color 0.3s ease",
  },
  removeIconHover: {
    color: "#c9302c",
  },
};

export default CreateLeadModal;
