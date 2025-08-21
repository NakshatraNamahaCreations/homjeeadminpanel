import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  Container,
  Row,
  Col,
  Form,
  Button,
  Badge,
  Card,
  Modal,
  Image,
  Pagination,
} from "react-bootstrap";
import {
  FaCog,
  FaStar,
  FaPlus,
  FaPhone,
  FaArrowLeft,
  FaUserPlus,
  FaCalendarAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Calendar from "react-calendar";
import axios from "axios";
import vendor from "../assets/vendor.svg";
import "react-calendar/dist/Calendar.css";

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
  show,
  onHide,
  onSelect,
  initialAddress = "",
  initialLatLng,
}) => {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const geocoderRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [addr, setAddr] = useState(initialAddress || "");
  const [latLng, setLatLng] = useState(initialLatLng || { lat: null, lng: null });

  useEffect(() => {
    if (!show) return;

    let map, marker, geocoder;

    const getCurrentPosition = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      });

    const init = async () => {
      try {
        await loadGoogleMaps();

        let start = await getCurrentPosition();
        if (!start && initialLatLng && !isNaN(initialLatLng.lat) && !isNaN(initialLatLng.lng)) {
          start = initialLatLng;
        }
        if (!start) {
          start = { lat: 12.9716, lng: 77.5946 };
        }

        geocoder = new window.google.maps.Geocoder();
        geocoderRef.current = geocoder;

        map = new window.google.maps.Map(mapRef.current, {
          center: start,
          zoom: 15,
          streetViewControl: false,
          mapTypeControl: false,
        });

        marker = new window.google.maps.Marker({
          map,
          position: start,
          draggable: true,
        });
        markerRef.current = marker;

        const input = inputRef.current;
        autocompleteRef.current = new window.google.maps.places.Autocomplete(input, {
          fields: ["formatted_address", "geometry"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (!place.geometry || !place.geometry.location) return;

          const newLatLng = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setLatLng(newLatLng);
          setAddr(place.formatted_address || "");
          map.setCenter(newLatLng);
          marker.setPosition(newLatLng);
        });

        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          const newLatLng = { lat: position.lat(), lng: position.lng() };
          setLatLng(newLatLng);
          geocoder.geocode({ location: newLatLng }, (results, status) => {
            if (status === "OK" && results?.length) {
              setAddr(results[0].formatted_address);
              input.value = results[0].formatted_address;
            } else {
              setAddr("");
            }
          });
        });

        map.addListener("click", (e) => {
          const newLatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          setLatLng(newLatLng);
          marker.setPosition(newLatLng);
          geocoder.geocode({ location: newLatLng }, (results, status) => {
            if (status === "OK" && results?.length) {
              setAddr(results[0].formatted_address);
              input.value = results[0].formatted_address;
            } else {
              setAddr("");
            }
          });
        });

        if (initialAddress && !latLng.lat && !latLng.lng) {
          geocoder.geocode({ address: initialAddress }, (results, status) => {
            if (status === "OK" && results?.length) {
              const newLatLng = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
              };
              setLatLng(newLatLng);
              setAddr(results[0].formatted_address);
              map.setCenter(newLatLng);
              marker.setPosition(newLatLng);
              input.value = results[0].formatted_address;
            }
          });
        } else if (start) {
          geocoder.geocode({ location: start }, (results, status) => {
            if (status === "OK" && results?.length) {
              setAddr(results[0].formatted_address);
              input.value = results[0].formatted_address;
            }
          });
        }

        setTimeout(() => {
          window.google.maps.event.trigger(map, "resize");
          map.setCenter(start);
        }, 0);
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
      }
    };

    init();

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      if (marker) {
        window.google.maps.event.clearInstanceListeners(marker);
      }
      if (map) {
        window.google.maps.event.clearInstanceListeners(map);
      }
    };
  }, [show, initialAddress, initialLatLng]);

  const handleUseLocation = () => {
    if (!latLng.lat || !latLng.lng || isNaN(latLng.lat) || isNaN(latLng.lng)) {
      alert("Please select a valid location on the map.");
      return;
    }
    onSelect({
      formattedAddress: addr,
      lat: latLng.lat,
      lng: latLng.lng,
    });
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="gmap-dialog"
      contentClassName="gmap-content"
      fullscreen="md-down"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: 16 }}>
          Pick Location{" "}
          <span className="text-muted" style={{ fontWeight: 400 }}>
            (Google Maps)
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="gmap-body">
        <div style={{ marginBottom: 10 }}>
          <input
            ref={inputRef}
            placeholder="Search location or paste address"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
            }}
            defaultValue={initialAddress}
          />
        </div>
        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          <div
            ref={mapRef}
            style={{ position: "absolute", inset: 0, borderRadius: 8 }}
          />
        </div>
        <div
          className="mt-3 p-2"
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            background: "#fafafa",
            fontSize: 13,
          }}
        >
          <strong>Selected:</strong> {addr || "Move the pin or search…"}
          <div className="text-muted" style={{ fontSize: 12 }}>
            Lat: {latLng.lat ? latLng.lat.toFixed(6) : "N/A"} | Lng: {latLng.lng ? latLng.lng.toFixed(6) : "N/A"}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleUseLocation}>
          Use this location
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const VendorsDashboard = () => {
  const [city, setCity] = useState("All Cities");
  const [status, setStatus] = useState("All Statuses");
  const [service, setService] = useState("All Services");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [leaveDates, setLeaveDates] = useState([]);
  const [coinDelta, setCoinDelta] = useState(1);
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [cities, setCities] = useState(["All Cities"]);
  const [services, setServices] = useState(["All Services"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geocodingError, setGeocodingError] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showMemberAddressPicker, setShowMemberAddressPicker] = useState(false);

  const PAGE_SIZE = 10;
const [currentPage, setCurrentPage] = useState(1);

useEffect(() => {
  setCurrentPage(1);
}, [city, status, service, vendors]);

  const [formData, setFormData] = useState({
    vendorName: "",
    mobileNumber: "",
    dateOfBirth: "",
    yearOfWorking: "",
    city: "",
    serviceType: "",
    capacity: "",
    serviceArea: "",
    aadhaarNumber: "",
    panNumber: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    holderName: "",
    accountType: "",
    gstNumber: "",
    location: "",
    latitude: "",
    longitude: "",
  });

  const [files, setFiles] = useState({
    profileImage: null,
    aadhaarImage: null,
    panImage: null,
    otherPolicy: null,
  });

  const [memberFormData, setMemberFormData] = useState({
    name: "",
    mobileNumber: "",
    dateOfBirth: "",
    city: "",
    serviceType: "",
    serviceArea: "",
    aadhaarNumber: "",
    panNumber: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    holderName: "",
    accountType: "",
    gstNumber: "",
    location: "",
    latitude: "",
    longitude: "",
  });

  const [memberFiles, setMemberFiles] = useState({
    profileImage: null,
    aadhaarImage: null,
    panImage: null,
    otherPolicy: null,
  });

  const fetchCoordinates = useCallback(
    debounce(async (location) => {
      if (!location) {
        setGeocodingError(null);
        return;
      }
      try {
        const response = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: {
              q: location,
              format: "json",
              addressdetails: 1,
              limit: 1,
            },
            headers: {
              "User-Agent": "VendorsDashboard/1.0 (your-email@example.com)",
            },
          }
        );
        if (response.data && response.data.length > 0) {
          const { lat, lon } = response.data[0];
          setFormData((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
          }));
          setGeocodingError(null);
        } else {
          setGeocodingError("No coordinates found for the entered location");
          setFormData((prev) => ({
            ...prev,
            latitude: "",
            longitude: "",
          }));
        }
      } catch (error) {
        setGeocodingError(
          "Error fetching coordinates: " +
            (error.response?.data?.message || error.message)
        );
        setFormData((prev) => ({
          ...prev,
          latitude: "",
          longitude: "",
        }));
      }
    }, 500),
    []
  );

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "https://homjee-backend.onrender.com/api/vendor/get-all-vendor"
      );
      const fetchedVendors = response.data.vendor.map((vendor) => ({
        id: vendor._id,
        name: vendor.vendor.vendorName,
        category: vendor.vendor.serviceType,
        city: vendor.vendor.city,
        status: vendor.activeStatus ? "Live" : "Inactive",
        rating: 4.5,
        phone: String(vendor.vendor.mobileNumber ?? ""),
        lastLogin: "Unknown",
        capacity: vendor.vendor.capacity,
        dob: vendor.vendor.dateOfBirth,
        aadhar: vendor.documents.aadhaarNumber,
        pan: vendor.documents.panNumber,
        bank: vendor.bankDetails.bankName,
        ifsc: vendor.bankDetails.ifscCode,
        account: vendor.bankDetails.accountNumber,
        gst: vendor.bankDetails.gstNumber || "NA",
        serviceArea: vendor.vendor.serviceArea,
        workingSince: parseInt(vendor.vendor.yearOfWorking ?? "0", 10),
        coins: Number(vendor.wallet?.coins ?? 0),
        team: vendor.team.map((member) => ({
          _id: member._id,
          name: member.name,
          mobileNumber: member.mobileNumber,
          dateOfBirth: member.dateOfBirth,
          city: member.city,
          serviceType: member.serviceType,
          serviceArea: member.serviceArea,
          aadhaarNumber: member.documents?.aadhaarNumber,
          panNumber: member.documents?.panNumber,
          accountNumber: member.bankDetails?.accountNumber,
          ifscCode: member.bankDetails?.ifscCode,
          bankName: member.bankDetails?.bankName,
          holderName: member.bankDetails?.holderName,
          accountType: member.bankDetails?.accountType,
          gstNumber: member.bankDetails?.gstNumber,
          location: member.address?.location,
          latitude: member.address?.latitude,
          longitude: member.address?.longitude,
        })) || [],
      }));

      setVendors(fetchedVendors);
      const uniqueCities = ["All Cities", ...new Set(fetchedVendors.map((v) => v.city))];
      const uniqueServices = ["All Services", ...new Set(fetchedVendors.map((v) => v.category))];
      setCities(uniqueCities);
      setServices(uniqueServices);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMemberInputChange = (e) => {
    const { name, value } = e.target;
    setMemberFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFiles((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleMemberFileChange = (e) => {
    const { name, files } = e.target;
    setMemberFiles((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude || isNaN(formData.latitude) || isNaN(formData.longitude)) {
      alert("Please select a valid location using the map picker.");
      return;
    }
    try {
      const formDataToSend = new FormData();

      const vendor = {
        vendorName: formData.vendorName,
        mobileNumber: formData.mobileNumber,
        dateOfBirth: formData.dateOfBirth,
        yearOfWorking: formData.yearOfWorking,
        city: formData.city,
        serviceType: formData.serviceType,
        capacity: formData.capacity,
        serviceArea: formData.serviceArea,
      };

      const documents = {
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
      };

      const bankDetails = {
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        bankName: formData.bankName,
        holderName: formData.holderName,
        accountType: formData.accountType,
        gstNumber: formData.gstNumber,
      };

      const address = {
        location: formData.location,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      formDataToSend.append("vendor", JSON.stringify(vendor));
      formDataToSend.append("documents", JSON.stringify(documents));
      formDataToSend.append("bankDetails", JSON.stringify(bankDetails));
      formDataToSend.append("address", JSON.stringify(address));

      if (files.profileImage) formDataToSend.append("profileImage", files.profileImage);
      if (files.aadhaarImage) formDataToSend.append("aadhaarImage", files.aadhaarImage);
      if (files.panImage) formDataToSend.append("panImage", files.panImage);
      if (files.otherPolicy) formDataToSend.append("otherPolicy", files.otherPolicy);

      await axios.post("https://homjee-backend.onrender.com/api/vendor/create-vendor", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Vendor created successfully!");
      setShowAddVendorModal(false);
      setFormData({
        vendorName: "",
        mobileNumber: "",
        dateOfBirth: "",
        yearOfWorking: "",
        city: "",
        serviceType: "",
        capacity: "",
        serviceArea: "",
        aadhaarNumber: "",
        panNumber: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        holderName: "",
        accountType: "",
        gstNumber: "",
        location: "",
        latitude: "",
        longitude: "",
      });
      setFiles({
        profileImage: null,
        aadhaarImage: null,
        panImage: null,
        otherPolicy: null,
      });
      setGeocodingError(null);
      await fetchVendors();
    } catch (error) {
      console.error("Error creating vendor:", error);
      alert("Failed to create vendor: " + (error.response?.data?.message || error.message));
    }
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;
    if (!memberFormData.latitude || !memberFormData.longitude || isNaN(memberFormData.latitude) || isNaN(memberFormData.longitude)) {
      alert("Please select a valid location using the map picker.");
      return;
    }
    try {
      const formDataToSend = new FormData();

      const member = {
        name: memberFormData.name,
        mobileNumber: memberFormData.mobileNumber,
        dateOfBirth: memberFormData.dateOfBirth,
        city: memberFormData.city,
        serviceType: memberFormData.serviceType,
        serviceArea: memberFormData.serviceArea,
      };

      const documents = {
        aadhaarNumber: memberFormData.aadhaarNumber,
        panNumber: memberFormData.panNumber,
      };

      const bankDetails = {
        accountNumber: memberFormData.accountNumber,
        ifscCode: memberFormData.ifscCode,
        bankName: memberFormData.bankName,
        holderName: memberFormData.holderName,
        accountType: memberFormData.accountType,
        gstNumber: memberFormData.gstNumber,
      };

      const address = {
        location: memberFormData.location,
        latitude: parseFloat(memberFormData.latitude),
        longitude: parseFloat(memberFormData.longitude),
      };

      formDataToSend.append("vendorId", selectedVendor.id);
      formDataToSend.append("member", JSON.stringify(member));
      formDataToSend.append("documents", JSON.stringify(documents));
      formDataToSend.append("bankDetails", JSON.stringify(bankDetails));
      formDataToSend.append("address", JSON.stringify(address));

      if (memberFiles.profileImage) formDataToSend.append("profileImage", memberFiles.profileImage);
      if (memberFiles.aadhaarImage) formDataToSend.append("aadhaarImage", memberFiles.aadhaarImage);
      if (memberFiles.panImage) formDataToSend.append("panImage", memberFiles.panImage);
      if (memberFiles.otherPolicy) formDataToSend.append("otherPolicy", memberFiles.otherPolicy);

      const { data } = await axios.post("https://homjee-backend.onrender.com/api/vendor/team/add", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Team member added successfully!");
      setSelectedVendor((v) => (v ? { ...v, team: data.team || [] } : v));
      setVendors((list) =>
        list.map((v) => (v.id === selectedVendor.id ? { ...v, team: data.team || [] } : v))
      );
      setShowAddMemberModal(false);
      setMemberFormData({
        name: "",
        mobileNumber: "",
        dateOfBirth: "",
        city: "",
        serviceType: "",
        serviceArea: "",
        aadhaarNumber: "",
        panNumber: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        holderName: "",
        accountType: "",
        gstNumber: "",
        location: "",
        latitude: "",
        longitude: "",
      });
      setMemberFiles({
        profileImage: null,
        aadhaarImage: null,
        panImage: null,
        otherPolicy: null,
      });
    } catch (error) {
      console.error("Error adding team member:", error);
      alert("Failed to add team member: " + (error.response?.data?.message || error.message));
    }
  };

  const API_BASE = "https://homjee-backend.onrender.com/api/vendor";

  const mutateCoins = async ({ vendorId, coins, type }) => {
    const url = type === "add" ? `${API_BASE}/add-coin` : `${API_BASE}/reduce-coin`;
    setCoinsBalance((b) => Math.max(0, b + (type === "add" ? coins : -coins)));
    try {
      const { data } = await axios.post(url, { vendorId, coins });
      const serverCoins = Number(data?.wallet?.coins ?? coinsBalance);
      setCoinsBalance(serverCoins);
      setVendors((list) => list.map((v) => (v.id === vendorId ? { ...v, coins: serverCoins } : v)));
    } catch (err) {
      setCoinsBalance((b) => Math.max(0, b - (type === "add" ? coins : -coins)));
      alert(
        err?.response?.data?.message ||
          `Failed to ${type === "add" ? "add" : "reduce"} coins`
      );
    }
  };

  const handleAddCoinsAPI = async () => {
    if (!selectedVendor) return;
    const coins = Number(coinDelta || 0);
    if (coins <= 0) return alert("Enter a positive coin amount.");
    await mutateCoins({ vendorId: selectedVendor.id, coins, type: "add" });
  };

  const handleReduceCoinsAPI = async () => {
    if (!selectedVendor) return;
    const coins = Number(coinDelta || 0);
    if (coins <= 0) return alert("Enter a positive coin amount.");
    if (coins > coinsBalance) return alert("Insufficient balance.");
    await mutateCoins({ vendorId: selectedVendor.id, coins, type: "reduce" });
  };

  const removeTeamMemberAPI = async (memberId) => {
    if (!selectedVendor) return;
    try {
      const { data } = await axios.post(`${API_BASE}/team/remove`, {
        vendorId: selectedVendor.id,
        memberId,
      });
      setSelectedVendor((v) => (v ? { ...v, team: data.team || [] } : v));
      setVendors((list) =>
        list.map((v) => (v.id === selectedVendor.id ? { ...v, team: data.team || [] } : v))
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to remove member");
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesCity = city === "All Cities" || vendor.city === city;
    const matchesStatus = status === "All Statuses" || vendor.status === status;
    const matchesService = service === "All Services" || vendor.category === service;
    return matchesCity && matchesStatus && matchesService;
  });


  // Total pages
const totalPages = Math.max(1, Math.ceil(filteredVendors.length / PAGE_SIZE));

// Keep currentPage in bounds
const safePage = Math.min(currentPage, totalPages);

// Slice current page rows
const startIdx = (safePage - 1) * PAGE_SIZE;
const endIdx = Math.min(startIdx + PAGE_SIZE, filteredVendors.length);
const paginatedVendors = filteredVendors.slice(startIdx, endIdx);

// Page change helper
const goToPage = (p) => {
  if (p < 1 || p > totalPages) return;
  setCurrentPage(p);
};



  

  return (
    <>
      <style>{`
        .gmap-dialog {
          max-width: min(1000px, 92vw) !important;
          margin: 1.25rem auto;
        }
        .gmap-content {
          height: 86vh;
          display: flex;
          flex-direction: column;
        }
        .gmap-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
      `}</style>

      <Container className="py-4" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold">Vendors Dashboard</h5>
          <div className="d-flex gap-2">
            <Form.Select value={city} onChange={(e) => setCity(e.target.value)} style={{ height: "34px", fontSize: "12px" }}>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Form.Select>
            <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: "34px", fontSize: "12px" }}>
              <option>All Statuses</option>
              <option>Live</option>
              <option>Inactive</option>
              <option>Low Coins</option>
              <option>Capacity Full</option>
            </Form.Select>
            <Form.Select value={service} onChange={(e) => setService(e.target.value)} style={{ height: "34px", fontSize: "12px" }}>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Form.Select>
            <Button
              onClick={() => setShowAddVendorModal(true)}
              style={{ whiteSpace: "nowrap", fontSize: "12px", backgroundColor: "transparent", borderColor: "black", color: "black" }}
            >
              <FaPlus className="me-2" /> Add Vendor
            </Button>
          </div>
        </div>

        {loading ? (
          <div>Loading vendors...</div>
        ) : error ? (
          <div className="text-danger">Error: {error}</div>
        ) : !selectedVendor ? (

          <>
        
          <Table striped bordered hover responsive className="shadow-lg bg-white text-center">
            <thead className="table-dark">
              <tr style={{ fontSize: "14px" }}>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>City</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  style={{ cursor: "pointer", fontSize: "12px" }}
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setCoinsBalance(Number(vendor.coins || 0));
                  }}
                >
                  <td>{vendor.name}</td>
                  <td>{vendor.category}</td>
                  <td>{vendor.city}</td>
                  <td>
                    <Badge bg={vendor.status === "Live" ? "success" : "warning"}>{vendor.status}</Badge>
                  </td>
                  <td>
                    <FaStar className="text-warning" /> {vendor.rating}
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" href={`tel:${vendor.phone}`}>
                      <FaPhone />
                    </Button>
                    <Button variant="outline-secondary" size="sm" className="ms-2">
                      <FaCog />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {/* Pagination header */}
<div className="d-flex justify-content-between align-items-center mb-2">
  <small className="text-muted">
    Showing <strong>{filteredVendors.length === 0 ? 0 : startIdx + 1}-{endIdx}</strong> of{" "}
    <strong>{filteredVendors.length}</strong>
  </small>
  <Pagination className="mb-0">
    <Pagination.First onClick={() => goToPage(1)} disabled={safePage === 1} />
    <Pagination.Prev onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} />
    {
      // Build a compact window of page numbers
      Array.from({ length: totalPages }).slice(
        Math.max(0, safePage - 3),
        Math.min(totalPages, safePage + 2)
      ).map((_, i, arr) => {
        const pageNum = Math.max(1, safePage - 2) + i;
        return (
          <Pagination.Item
            key={pageNum}
            active={pageNum === safePage}
            onClick={() => goToPage(pageNum)}
          >
            {pageNum}
          </Pagination.Item>
        );
      })
    }
    <Pagination.Next onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages} />
    <Pagination.Last onClick={() => goToPage(totalPages)} disabled={safePage === totalPages} />
  </Pagination>
</div>

          </>
        ) : (
          <div className="vendor-details">
            <Button
              variant="white"
              className="mb-3"
              onClick={() => setSelectedVendor(null)}
              style={{ fontSize: "14px", borderColor: "black" }}
            >
              <FaArrowLeft /> Back to List
            </Button>
            <Card className="shadow-sm p-4 rounded">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold" style={{ fontSize: "16px" }}>
                  {selectedVendor.name}
                </h4>
                <Badge bg={selectedVendor.status === "Live" ? "success" : "warning"} className="px-3 py-2">
                  {selectedVendor.status}
                </Badge>
              </div>
              <Row className="mb-3">
                <Col md={4} className="text-center">
                  <Image src={vendor} roundedCircle width={120} height={120} className="border p-1" alt="Vendor Profile" />
                  <p className="mt-2 text-muted" style={{ fontSize: "12px" }}>
                    {selectedVendor.category}
                  </p>
                </Col>
                <Col md={8}>
                  <Table borderless>
                    <tbody style={{ fontSize: "12px" }}>
                      <tr>
                        <td><strong>City:</strong></td>
                        <td>{selectedVendor.city}</td>
                      </tr>
                      <tr>
                        <td><strong>Service Area:</strong></td>
                        <td>{selectedVendor.serviceArea}</td>
                      </tr>
                      <tr>
                        <td><strong>Working Since:</strong></td>
                        <td>
                          {selectedVendor.workingSince} ({new Date().getFullYear() - selectedVendor.workingSince} years)
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Capacity:</strong></td>
                        <td>{selectedVendor.capacity} jobs at a time</td>
                      </tr>
                      <tr>
                        <td><strong>Date of Birth:</strong></td>
                        <td>{selectedVendor.dob}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
                <div>
                  <Button
                    variant="outline-black"
                    size="sm"
                    href={`tel:${selectedVendor.phone}`}
                    className="me-2"
                    style={{ cursor: "pointer", borderColor: "black" }}
                  >
                    <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                      <FaPhone className="me-1" />
                      {selectedVendor.phone}
                    </p>
                  </Button>
                </div>
                <div>
                  <p className="mb-0">
                    <strong>Rating:</strong> <FaStar className="text-warning" /> {selectedVendor.rating}
                  </p>
                </div>
              </div>
              <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
                Financial Details
              </h5>
              <Table bordered className="bg-light" style={{ fontSize: "12px" }}>
                <tbody>
                  <tr>
                    <td><strong>Aadhar No.</strong></td>
                    <td>{selectedVendor.aadhar}</td>
                  </tr>
                  <tr>
                    <td><strong>PAN No.</strong></td>
                    <td>{selectedVendor.pan}</td>
                  </tr>
                  <tr>
                    <td><strong>Bank Name:</strong></td>
                    <td>{selectedVendor.bank}</td>
                  </tr>
                  <tr>
                    <td><strong>IFSC Code:</strong></td>
                    <td>{selectedVendor.ifsc}</td>
                  </tr>
                  <tr>
                    <td><strong>Account No.:</strong></td>
                    <td>{selectedVendor.account}</td>
                  </tr>
                  <tr>
                    <td><strong>GST:</strong></td>
                    <td>{selectedVendor.gst}</td>
                  </tr>
                </tbody>
              </Table>
              <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
                Coins Wallet
              </h5>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <p className="mb-0" style={{ fontSize: "14px" }}>
                  <strong>Coins Balance:</strong> {coinsBalance} coins
                </p>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="number"
                    min={1}
                    step={1}
                    value={coinDelta}
                    onChange={(e) => setCoinDelta(e.target.value)}
                    style={{ width: 120, fontSize: "12px" }}
                    placeholder="Coins"
                  />
                  <Button
                    variant="outline-dark"
                    size="sm"
                    onClick={handleAddCoinsAPI}
                    className="me-2"
                    style={{ borderColor: "black" }}
                  >
                    Add Coins
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={handleReduceCoinsAPI}>
                    Reduce Coins
                  </Button>
                </div>
              </div>
              <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
                Manage Team
              </h5>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <Button variant="dark" size="sm" className="px-2 py-1" onClick={() => setShowAddMemberModal(true)}>
                  <FaUserPlus className="me-1" /> Add Member
                </Button>
              </div>
              {(selectedVendor.team?.length ?? 0) === 0 ? (
                <p className="text-muted" style={{ fontSize: "12px" }}>
                  No team members yet.
                </p>
              ) : (
                <Table size="sm" bordered className="bg-white" style={{ fontSize: "12px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "60%" }}>Name</th>
                      <th style={{ width: "40%" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVendor.team.map((m) => (
                      <tr key={m._id}>
                        <td>{m.name}</td>
                        <td>
                          <Button variant="outline-danger" size="sm" onClick={() => removeTeamMemberAPI(m._id)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
                Mark Leaves
              </h5>
              <Card className="p-3 bg-light">
                <Calendar onChange={setLeaveDates} value={leaveDates} />
              </Card>
              <div className="mt-4 text-muted text-end">
                <FaCalendarAlt className="me-2" />
                <span>Last Login: {selectedVendor.lastLogin}</span>
              </div>
            </Card>
          </div>
        )}

        <Modal
          show={showAddVendorModal}
          onHide={() => setShowAddVendorModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: "16px" }}>Add New Vendor</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <h5 className="mb-3">Basic Information</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="vendorName"
                      value={formData.vendorName}
                      onChange={handleInputChange}
                      placeholder="Enter Name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      placeholder="Enter Phone Number"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Profile Photo</Form.Label>
                    <Form.Control type="file" name="profileImage" onChange={handleFileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Working Since (Year)</Form.Label>
                    <Form.Control
                      type="number"
                      name="yearOfWorking"
                      value={formData.yearOfWorking}
                      onChange={handleInputChange}
                      placeholder="Enter Year"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Select name="city" value={formData.city} onChange={handleInputChange} required>
                      <option>Select City</option>
                      {cities
                        .filter((c) => c !== "All Cities")
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Service Type</Form.Label>
                    <Form.Select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      required
                    >
                      <option>Select Service</option>
                      {services
                        .filter((s) => s !== "All Services")
                        .map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Capacity (Jobs at a time)</Form.Label>
                    <Form.Control
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      placeholder="Enter Capacity"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Service Area</Form.Label>
                    <Form.Control
                      type="text"
                      name="serviceArea"
                      value={formData.serviceArea}
                      onChange={handleInputChange}
                      placeholder="Enter Service Area"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <h5 className="mt-4 mb-3">Address Details</h5>
              <Row className="align-items-end">
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="location"
                      value={formData.location}
                      placeholder="Click to pick on map"
                      readOnly
                      onClick={() => setShowAddressPicker(true)}
                    />
                    <Form.Text className="text-muted">
                      <FaMapMarkerAlt className="me-1" />
                      Uses Google Maps (autocomplete + draggable pin)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              {geocodingError && (
                <div className="text-danger mb-3">{geocodingError}</div>
              )}
              <h5 className="mt-4 mb-3">Identity Verification</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Aadhar Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="aadhaarNumber"
                      value={formData.aadhaarNumber}
                      onChange={handleInputChange}
                      placeholder="Enter Aadhar No."
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload Aadhar (Front & Back)</Form.Label>
                    <Form.Control type="file" name="aadhaarImage" onChange={handleFileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>PAN Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="Enter PAN No."
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload PAN Card</Form.Label>
                    <Form.Control type="file" name="panImage" onChange={handleFileChange} />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Others / Police Verification</Form.Label>
                <Form.Control type="file" name="otherPolicy" onChange={handleFileChange} />
              </Form.Group>
              <h5 className="mt-4 mb-3">Financial Details</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bank Account Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Enter Bank Account No."
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>IFSC Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      placeholder="Enter IFSC Code"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bank Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      placeholder="Enter Bank Name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name in Bank</Form.Label>
                    <Form.Control
                      type="text"
                      name="holderName"
                      value={formData.holderName}
                      onChange={handleInputChange}
                      placeholder="Enter Name as per Bank"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Account Type</Form.Label>
                    <Form.Select
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleInputChange}
                      required
                    >
                      <option>Select Account Type</option>
                      <option>Savings</option>
                      <option>Current</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>GST (If Applicable)</Form.Label>
                    <Form.Control
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleInputChange}
                      placeholder="Enter GST No."
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Modal.Footer>
                <Button variant="primary" type="submit">
                  Save Vendor
                </Button>
                <Button variant="secondary" onClick={() => setShowAddVendorModal(false)}>
                  Cancel
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal
          show={showAddMemberModal}
          onHide={() => setShowAddMemberModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: "16px" }}>Add Team Member</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleMemberSubmit}>
              <h5 className="mb-3">Basic Information</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={memberFormData.name}
                      onChange={handleMemberInputChange}
                      placeholder="Enter Name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="mobileNumber"
                      value={memberFormData.mobileNumber}
                      onChange={handleMemberInputChange}
                      placeholder="Enter Phone Number"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Profile Photo</Form.Label>
                    <Form.Control type="file" name="profileImage" onChange={handleMemberFileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      name="dateOfBirth"
                      value={memberFormData.dateOfBirth}
                      onChange={handleMemberInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Select name="city" value={memberFormData.city} onChange={handleMemberInputChange} required>
                      <option>Select City</option>
                      {cities
                        .filter((c) => c !== "All Cities")
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Service Type</Form.Label>
                    <Form.Select
                      name="serviceType"
                      value={memberFormData.serviceType}
                      onChange={handleMemberInputChange}
                      required
                    >
                      <option>Select Service</option>
                      {services
                        .filter((s) => s !== "All Services")
                        .map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Service Area</Form.Label>
                    <Form.Control
                      type="text"
                      name="serviceArea"
                      value={memberFormData.serviceArea}
                      onChange={handleMemberInputChange}
                      placeholder="Enter Service Area"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <h5 className="mt-4 mb-3">Address Details</h5>
              <Row className="align-items-end">
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      name="location"
                      value={memberFormData.location}
                      placeholder="Click to pick on map"
                      readOnly
                      onClick={() => setShowMemberAddressPicker(true)}
                    />
                    <Form.Text className="text-muted">
                      <FaMapMarkerAlt className="me-1" />
                      Uses Google Maps (autocomplete + draggable pin)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              <h5 className="mt-4 mb-3">Identity Verification</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Aadhar Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="aadhaarNumber"
                      value={memberFormData.aadhaarNumber}
                      onChange={handleMemberInputChange}
                      placeholder="Enter Aadhar No."
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload Aadhar (Front & Back)</Form.Label>
                    <Form.Control type="file" name="aadhaarImage" onChange={handleMemberFileChange} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>PAN Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="panNumber"
                      value={memberFormData.panNumber}
                      onChange={handleMemberInputChange}
                      placeholder="Enter PAN No."
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload PAN Card</Form.Label>
                    <Form.Control type="file" name="panImage" onChange={handleMemberFileChange} />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Others / Police Verification</Form.Label>
                <Form.Control type="file" name="otherPolicy" onChange={handleMemberFileChange} />
              </Form.Group>
              <h5 className="mt-4 mb-3">Financial Details</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bank Account Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="accountNumber"
                      value={memberFormData.accountNumber}
                      onChange={handleMemberInputChange}
                      placeholder="Enter Bank Account No."
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>IFSC Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="ifscCode"
                      value={memberFormData.ifscCode}
                      onChange={handleMemberInputChange}
                      placeholder="Enter IFSC Code"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bank Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="bankName"
                      value={memberFormData.bankName}
                      onChange={handleMemberInputChange}
                      placeholder="Enter Bank Name"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name in Bank</Form.Label>
                    <Form.Control
                      type="text"
                      name="holderName"
                      value={memberFormData.holderName}
                      onChange={handleMemberInputChange}
                      placeholder="Enter Name as per Bank"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Account Type</Form.Label>
                    <Form.Select
                      name="accountType"
                      value={memberFormData.accountType}
                      onChange={handleMemberInputChange}
                      required
                    >
                      <option>Select Account Type</option>
                      <option>Savings</option>
                      <option>Current</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>GST (If Applicable)</Form.Label>
                    <Form.Control
                      type="text"
                      name="gstNumber"
                      value={memberFormData.gstNumber}
                      onChange={handleMemberInputChange}
                      placeholder="Enter GST No."
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Modal.Footer>
                <Button variant="primary" type="submit">
                  Add Member
                </Button>
                <Button variant="secondary" onClick={() => setShowAddMemberModal(false)}>
                  Cancel
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Body>
        </Modal>

        <AddressPickerModal
          show={showAddressPicker}
          onHide={() => setShowAddressPicker(false)}
          initialAddress={formData.location}
          initialLatLng={
            formData.latitude && formData.longitude && !isNaN(formData.latitude) && !isNaN(formData.longitude)
              ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) }
              : null
          }
          onSelect={(sel) =>
            setFormData((prev) => ({
              ...prev,
              location: sel.formattedAddress,
              latitude: String(sel.lat),
              longitude: String(sel.lng),
            }))
          }
        />

        <AddressPickerModal
          show={showMemberAddressPicker}
          onHide={() => setShowMemberAddressPicker(false)}
          initialAddress={memberFormData.location}
          initialLatLng={
            memberFormData.latitude && memberFormData.longitude && !isNaN(memberFormData.latitude) && !isNaN(memberFormData.longitude)
              ? { lat: parseFloat(memberFormData.latitude), lng: parseFloat(memberFormData.longitude) }
              : null
          }
          onSelect={(sel) =>
            setMemberFormData((prev) => ({
              ...prev,
              location: sel.formattedAddress,
              latitude: String(sel.lat),
              longitude: String(sel.lng),
            }))
          }
        />
      </Container>
    </>
  );
};

export default VendorsDashboard;

