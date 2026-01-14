// VendorsDashboard.jsx - List only version
import { useState, useEffect } from "react";
import { Container, Form, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/config";
import { normalizeMember } from "../utils/helpers";
import VendorList from "../components/vendor/VendorList";
import VendorModal from "../components/vendor/modals/VendorModal";
import AddressPickerModal from "../components/vendor/modals/AddressPickerModal";

const VendorsDashboard = () => {
  const [city, setCity] = useState("All Cities");
  const [status, setStatus] = useState("All Statuses");
  const [service, setService] = useState("All Services");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverPagination, setServerPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [vendorFormData, setVendorFormData] = useState(null);

  const navigate = useNavigate();
  const PAGE_SIZE = 10;

  const fetchVendors = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${BASE_URL}/vendor/get-all-vendor`, {
        params: {
          page,
          limit: PAGE_SIZE,
        },
      });

      const { vendor, pagination } = response.data;

      const fetchedVendors = vendor.map((vendor) => ({
        id: vendor._id,
        name: vendor.vendor.vendorName,
        profileImage: vendor.vendor.profileImage,
        category: vendor.vendor.serviceType,
        city: vendor.vendor.city,
        status: vendor.activeStatus ? "Live" : "Inactive",
        rating: 4.5,
        phone: String(vendor.vendor.mobileNumber ?? ""),
        capacity: vendor.vendor.capacity,
        dob: vendor.vendor.dateOfBirth,
        serviceArea: vendor.vendor?.serviceArea,
        location: vendor.address?.location || "",
        workingSince: parseInt(vendor.vendor?.yearOfWorking ?? "0", 10),
        coins: Number(vendor.wallet?.coins ?? 0),
        lat: vendor.address?.latitude,
        long: vendor.address?.longitude,
        aadhar: vendor.documents?.aadhaarNumber || "",
        pan: vendor.documents?.panNumber || "",
        account: vendor.bankDetails?.accountNumber || "",
        ifsc: vendor.bankDetails?.ifscCode || "",
        bank: vendor.bankDetails?.bankName || "",
        holderName: vendor.bankDetails?.holderName || "",
        accountType: vendor.bankDetails?.accountType || "",
        gst: vendor.bankDetails?.gstNumber || "",
        docs: {
          aadhaarFront:
            vendor.documents?.aadhaarfrontImage ||
            vendor.documents?.aadhaarFrontImage ||
            "",
          aadhaarBack:
            vendor.documents?.aadhaarbackImage ||
            vendor.documents?.aadhaarBackImage ||
            "",
          pan: vendor.documents?.panImage || "",
          other: vendor.documents?.otherPolicy || "",
        },
        team: (vendor.team || []).map(normalizeMember),
      }));

      setVendors(fetchedVendors);

      if (pagination) {
        setServerPagination(pagination);
      }

      return fetchedVendors;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError(error.response?.data?.message || error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleVendorSelect = (vendor) => {
    navigate(`/vendor-details/${vendor.id}`);
  };

  const openEditVendorModal = (vendor) => {
    setIsEditingVendor(true);
    setEditingVendorId(vendor.id);
    
    setVendorFormData({
      vendorName: vendor.name || "",
      mobileNumber: vendor.phone || "",
      dateOfBirth: vendor.dob || "",
      yearOfWorking: String(vendor.workingSince || ""),
      city: vendor.city || "",
      serviceType: vendor.category || "",
      capacity: vendor.capacity || "",
      serviceArea: vendor.serviceArea || "",
      aadhaarNumber: vendor.aadhar || "",
      panNumber: vendor.pan || "",
      accountNumber: vendor.account || "",
      ifscCode: vendor.ifsc || "",
      bankName: vendor.bank || "",
      holderName: vendor.holderName || vendor.name || "",
      accountType: vendor.accountType || "Savings",
      gstNumber: vendor.gst || "",
      location: vendor.location || "",
      latitude: String(vendor.lat || ""),
      longitude: String(vendor.long || ""),
    });
    
    setShowAddVendorModal(true);
  };

  const handleVendorSuccess = () => {
    fetchVendors(serverPagination.page);
  };

  const goToPage = (p) => {
    if (p < 1 || p > serverPagination.totalPages) return;
    fetchVendors(p);
  };

  useEffect(() => {
    fetchVendors(1);
  }, []);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesCity = city === "All Cities" || vendor.city === city;
    const matchesStatus = status === "All Statuses" || vendor.status === status;
    const matchesService = service === "All Services" || vendor.category === service;
    return matchesCity && matchesStatus && matchesService;
  });

  return (
    <>
      <style>{`
        .loader-dots span {
          width: 10px;
          height: 10px;
          margin: 0 4px;
          background: #DC3545;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1s infinite alternate;
        }
        .loader-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .loader-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 1; }
        }
      `}</style>

      <Container className="py-4" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold">Vendors Dashboard</h5>
          <div className="d-flex gap-2">
            <Form.Select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ height: "34px", fontSize: "12px" }}
            >
              {["All Cities", "Bengaluru", "Pune", "Mumbai", "Delhi", "Hyderabad", "Chennai"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Form.Select>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ height: "34px", fontSize: "12px" }}
            >
              <option>All Statuses</option>
              <option>Live</option>
              <option>Inactive</option>
              <option>Low Coins</option>
              <option>Capacity Full</option>
            </Form.Select>
            <Form.Select
              value={service}
              onChange={(e) => setService(e.target.value)}
              style={{ height: "34px", fontSize: "12px" }}
            >
              {["All Services", "House Painting", "Deep Cleaning", "Plumbing", "Electrical", "Carpentry"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Form.Select>
            <Button
              onClick={() => {
                setIsEditingVendor(false);
                setEditingVendorId(null);
                setVendorFormData(null);
                setShowAddVendorModal(true);
              }}
              style={{
                whiteSpace: "nowrap",
                fontSize: "12px",
                backgroundColor: "transparent",
                borderColor: "black",
                color: "black",
              }}
            >
              <FaPlus className="me-2" /> Add Vendor
            </Button>
          </div>
        </div>

        <VendorList
          vendors={filteredVendors}
          loading={loading}
          error={error}
          serverPagination={serverPagination}
          onVendorSelect={handleVendorSelect}
          onEditVendor={openEditVendorModal}
          onPageChange={goToPage}
        />

        {/* Modals */}
        <VendorModal
          show={showAddVendorModal}
          onHide={() => {
            setShowAddVendorModal(false);
            setIsEditingVendor(false);
            setEditingVendorId(null);
            setVendorFormData(null);
          }}
          isEditing={isEditingVendor}
          vendorId={editingVendorId}
          formData={vendorFormData}
          onSuccess={handleVendorSuccess}
          onAddressPickerOpen={() => setShowAddressPicker(true)}
        />

        <AddressPickerModal
          show={showAddressPicker}
          onHide={() => setShowAddressPicker(false)}
          initialAddress={vendorFormData?.location || ""}
          initialLatLng={
            vendorFormData?.latitude && vendorFormData?.longitude &&
            !isNaN(vendorFormData.latitude) && !isNaN(vendorFormData.longitude)
              ? {
                  lat: parseFloat(vendorFormData.latitude),
                  lng: parseFloat(vendorFormData.longitude),
                }
              : null
          }
          onSelect={(sel) => {
            if (vendorFormData) {
              setVendorFormData(prev => ({
                ...prev,
                location: sel.formattedAddress,
                serviceArea: sel.formattedAddress,
                latitude: String(sel.lat),
                longitude: String(sel.lng),
              }));
            }
          }}
        />
      </Container>
    </>
  );
};

export default VendorsDashboard;


// // full working code
// import { useState, useEffect, useCallback, useRef } from "react";
// import {
//   Table,
//   Container,
//   Row,
//   Col,
//   Form,
//   Button,
//   Badge,
//   Card,
//   Modal,
//   Image,
//   Pagination,
// } from "react-bootstrap";
// import {
//   FaCog,
//   FaStar,
//   FaPlus,
//   FaPhone,
//   FaArrowLeft,
//   FaUserPlus,
//   FaCalendarAlt,
//   FaMapMarkerAlt,
// } from "react-icons/fa";
// import Calendar from "react-calendar";
// import axios from "axios";
// import vendor from "../assets/vendor.svg";
// import "react-calendar/dist/Calendar.css";
// import { BASE_URL } from "../utils/config";
// import { useMemo } from "react";

// const GOOGLE_MAPS_API_KEY = "AIzaSyBF48uqsKVyp9P2NlDX-heBJksvvT_8Cqk";

// const loadGoogleMaps = () =>
//   new Promise((resolve, reject) => {
//     if (window.google?.maps) return resolve();
//     const existing = document.querySelector('script[data-google="maps"]');
//     if (existing) {
//       existing.addEventListener("load", () => resolve());
//       existing.addEventListener("error", reject);
//       return;
//     }
//     const s = document.createElement("script");
//     s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
//     s.async = true;
//     s.defer = true;
//     s.setAttribute("data-google", "maps");
//     s.onload = () => resolve();
//     s.onerror = reject;
//     document.head.appendChild(s);
//   });

// const AddressPickerModal = ({
//   show,
//   onHide,
//   onSelect,
//   initialAddress = "",
//   initialLatLng,
// }) => {
//   const mapRef = useRef(null);
//   const inputRef = useRef(null);
//   const geocoderRef = useRef(null);
//   const markerRef = useRef(null);
//   const autocompleteRef = useRef(null);

//   const [addr, setAddr] = useState(initialAddress || "");
//   const [latLng, setLatLng] = useState(
//     initialLatLng || { lat: null, lng: null }
//   );

//   useEffect(() => {
//     if (!show) return;

//     let map, marker, geocoder;

//     const getCurrentPosition = () =>
//       new Promise((resolve) => {
//         if (!navigator.geolocation) return resolve(null);
//         navigator.geolocation.getCurrentPosition(
//           (pos) =>
//             resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//           () => resolve(null),
//           { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
//         );
//       });

//     const init = async () => {
//       try {
//         await loadGoogleMaps();

//         let start = await getCurrentPosition();
//         if (
//           !start &&
//           initialLatLng &&
//           !isNaN(initialLatLng.lat) &&
//           !isNaN(initialLatLng.lng)
//         ) {
//           start = initialLatLng;
//         }
//         if (!start) {
//           start = { lat: 12.9716, lng: 77.5946 };
//         }

//         geocoder = new window.google.maps.Geocoder();
//         geocoderRef.current = geocoder;

//         map = new window.google.maps.Map(mapRef.current, {
//           center: start,
//           zoom: 15,
//           streetViewControl: false,
//           mapTypeControl: false,
//         });

//         marker = new window.google.maps.Marker({
//           map,
//           position: start,
//           draggable: true,
//         });
//         markerRef.current = marker;

//         const input = inputRef.current;
//         autocompleteRef.current = new window.google.maps.places.Autocomplete(
//           input,
//           {
//             fields: ["formatted_address", "geometry"],
//           }
//         );

//         autocompleteRef.current.addListener("place_changed", () => {
//           const place = autocompleteRef.current.getPlace();
//           if (!place.geometry || !place.geometry.location) return;

//           const newLatLng = {
//             lat: place.geometry.location.lat(),
//             lng: place.geometry.location.lng(),
//           };
//           setLatLng(newLatLng);
//           setAddr(place.formatted_address || "");
//           map.setCenter(newLatLng);
//           marker.setPosition(newLatLng);
//         });

//         marker.addListener("dragend", () => {
//           const position = marker.getPosition();
//           const newLatLng = { lat: position.lat(), lng: position.lng() };
//           setLatLng(newLatLng);
//           geocoder.geocode({ location: newLatLng }, (results, status) => {
//             if (status === "OK" && results?.length) {
//               setAddr(results[0].formatted_address);
//               input.value = results[0].formatted_address;
//             } else {
//               setAddr("");
//             }
//           });
//         });

//         map.addListener("click", (e) => {
//           const newLatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
//           setLatLng(newLatLng);
//           marker.setPosition(newLatLng);
//           geocoder.geocode({ location: newLatLng }, (results, status) => {
//             if (status === "OK" && results?.length) {
//               setAddr(results[0].formatted_address);
//               input.value = results[0].formatted_address;
//             } else {
//               setAddr("");
//             }
//           });
//         });

//         if (initialAddress && !latLng.lat && !latLng.lng) {
//           geocoder.geocode({ address: initialAddress }, (results, status) => {
//             if (status === "OK" && results?.length) {
//               const newLatLng = {
//                 lat: results[0].geometry.location.lat(),
//                 lng: results[0].geometry.location.lng(),
//               };
//               setLatLng(newLatLng);
//               setAddr(results[0].formatted_address);
//               map.setCenter(newLatLng);
//               marker.setPosition(newLatLng);
//               input.value = results[0].formatted_address;
//             }
//           });
//         } else if (start) {
//           geocoder.geocode({ location: start }, (results, status) => {
//             if (status === "OK" && results?.length) {
//               setAddr(results[0].formatted_address);
//               input.value = results[0].formatted_address;
//             }
//           });
//         }

//         setTimeout(() => {
//           window.google.maps.event.trigger(map, "resize");
//           map.setCenter(start);
//         }, 0);
//       } catch (error) {
//         console.error("Error initializing Google Maps:", error);
//       }
//     };

//     init();

//     return () => {
//       if (autocompleteRef.current) {
//         window.google.maps.event.clearInstanceListeners(
//           autocompleteRef.current
//         );
//       }
//       if (marker) {
//         window.google.maps.event.clearInstanceListeners(marker);
//       }
//       if (map) {
//         window.google.maps.event.clearInstanceListeners(map);
//       }
//     };
//   }, [show, initialAddress, initialLatLng]);

//   const handleUseLocation = () => {
//     if (!latLng.lat || !latLng.lng || isNaN(latLng.lat) || isNaN(latLng.lng)) {
//       alert("Please select a valid location on the map.");
//       return;
//     }
//     onSelect({
//       formattedAddress: addr,
//       lat: latLng.lat,
//       lng: latLng.lng,
//     });
//     onHide();
//   };

//   return (
//     <Modal
//       show={show}
//       onHide={onHide}
//       centered
//       dialogClassName="gmap-dialog"
//       contentClassName="gmap-content"
//       fullscreen="md-down"
//       scrollable
//     >
//       <Modal.Header closeButton>
//         <Modal.Title style={{ fontSize: 16 }}>
//           Pick Location{" "}
//           <span className="text-muted" style={{ fontWeight: 400 }}>
//             (Google Maps)
//           </span>
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body className="gmap-body">
//         <div style={{ marginBottom: 10 }}>
//           <input
//             ref={inputRef}
//             placeholder="Search location or paste address"
//             style={{
//               width: "100%",
//               padding: "10px 12px",
//               borderRadius: 8,
//               border: "1px solid #ddd",
//               fontSize: 14,
//             }}
//           />
//         </div>
//         <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
//           <div
//             ref={mapRef}
//             style={{ position: "absolute", inset: 0, borderRadius: 8 }}
//           />
//         </div>
//         <div
//           className="mt-3 p-2"
//           style={{
//             border: "1px solid #eee",
//             borderRadius: 8,
//             background: "#fafafa",
//             fontSize: 13,
//           }}
//         >
//           <strong>Selected:</strong> {addr || "Move the pin or search…"}
//           <div className="text-muted" style={{ fontSize: 12 }}>
//             Lat: {latLng.lat ? latLng.lat.toFixed(6) : "N/A"} | Lng:{" "}
//             {latLng.lng ? latLng.lng.toFixed(6) : "N/A"}
//           </div>
//         </div>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide}>
//           Cancel
//         </Button>
//         <Button variant="primary" onClick={handleUseLocation}>
//           Use this location
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// const TeamMemberDocsModal = ({ show, onHide, member }) => {
//   const docs = member?.docs || {};

//   const docList = [
//     { label: "Aadhaar Front", url: docs.aadhaarFront },
//     { label: "Aadhaar Back", url: docs.aadhaarBack },
//     { label: "PAN", url: docs.pan },
//     { label: "Other / Police Verification", url: docs.other },
//   ].filter((d) => d.url);

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title style={{ fontSize: 16 }}>
//           Documents - {member?.name || "Team Member"}
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         {docList.length === 0 ? (
//           <div className="text-muted" style={{ fontSize: 13 }}>
//             No documents uploaded.
//           </div>
//         ) : (
//           <Row className="g-3">
//             {docList.map((doc) => (
//               <Col md={6} key={doc.label}>
//                 <Card className="shadow-sm" style={{ borderRadius: 12 }}>
//                   <Card.Body>
//                     <div className="fw-semibold mb-2" style={{ fontSize: 13 }}>
//                       {doc.label}
//                     </div>

//                     <Image
//                       src={doc.url}
//                       alt={doc.label}
//                       thumbnail
//                       style={{
//                         width: "100%",
//                         height: 220,
//                         objectFit: "cover",
//                         cursor: "pointer",
//                       }}
//                       onClick={() => window.open(doc.url, "_blank")}
//                     />

//                     <div className="text-muted mt-2" style={{ fontSize: 12 }}>
//                       Click to view
//                     </div>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             ))}
//           </Row>
//         )}
//       </Modal.Body>

//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide}>
//           Close
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// const TeamMemberLeavesModal = ({ show, onHide, member }) => {
//   const leavesArr = useMemo(() => {
//     try {
//       const arr = Array.isArray(member?.markedLeaves)
//         ? member.markedLeaves
//         : [];
//       return [...new Set(arr.map(normalizeLeave))].sort(); // YYYY-MM-DD sort
//     } catch (e) {
//       console.error("leavesArr memo error:", e);
//       return [];
//     }
//   }, [member?._id, member?.markedLeaves]);

//   const leaveSet = useMemo(() => {
//     try {
//       return new Set(leavesArr);
//     } catch (e) {
//       console.error("leaveSet memo error:", e);
//       return new Set();
//     }
//   }, [leavesArr]);

//   // ✅ month state (this is the fix)
//   const [calMonth, setCalMonth] = useState(new Date());

//   // ✅ when modal opens / member changes, move calendar to first leave month
//   useEffect(() => {
//     try {
//       if (!show) return;

//       const first = leavesArr[0];
//       const start = first ? new Date(first + "T00:00:00") : new Date();
//       setCalMonth(start);
//     } catch (e) {
//       console.error("calMonth init error:", e);
//       setCalMonth(new Date());
//     }
//   }, [show, leavesArr]);

//   return (
//     <Modal show={show} onHide={onHide} centered size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title style={{ fontSize: 16, fontWeight: 800 }}>
//           Marked Leaves
//           <span className="text-muted" style={{ fontWeight: 500 }}>
//             {" "}
//             - {member?.name || "Team Member"}
//           </span>
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         {!member ? (
//           <div className="text-muted" style={{ fontSize: 13 }}>
//             No member selected.
//           </div>
//         ) : leavesArr.length === 0 ? (
//           <div className="text-muted" style={{ fontSize: 13 }}>
//             No leaves marked for this member.
//           </div>
//         ) : (
//           <div className="leaves-modal-body">
//             {/* Left */}
//             <div className="leaves-left">
//               <div style={{ fontWeight: 800, fontSize: 13 }}>Summary</div>
//               <div className="text-muted" style={{ fontSize: 12 }}>
//                 Total Leaves: <strong>{leavesArr.length}</strong>
//               </div>

//               <div
//                 className="mt-3"
//                 style={{ maxHeight: 320, overflow: "auto" }}
//               >
//                 {leavesArr.map((d) => (
//                   <div
//                     key={d}
//                     className="leave-chip"
//                     style={{ width: "fit-content", cursor: "pointer" }}
//                     onClick={() => {
//                       try {
//                         setCalMonth(new Date(d + "T00:00:00"));
//                       } catch (e) {
//                         console.error("setCalMonth click error:", e);
//                       }
//                     }}
//                     title="Jump to this month"
//                   >
//                     <FaCalendarAlt />
//                     {d}
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Right */}
//             <div className="leaves-right">
//               <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
//                 Calendar Preview
//               </div>

//               <div className="readonly-cal">
//                 <Calendar
//                   activeStartDate={calMonth}
//                   onActiveStartDateChange={({ activeStartDate }) => {
//                     try {
//                       if (activeStartDate) setCalMonth(activeStartDate);
//                     } catch (e) {
//                       console.error("onActiveStartDateChange error:", e);
//                     }
//                   }}
//                   value={null}
//                   onChange={() => {}}
//                   selectRange={false}
//                   tileDisabled={() => true} // keep read-only
//                   tileClassName={({ date, view }) => {
//                     try {
//                       if (view !== "month") return null;
//                       return leaveSet.has(dateKey(date)) ? "leave-day" : null;
//                     } catch (e) {
//                       console.error("tileClassName error:", e);
//                       return null;
//                     }
//                   }}
//                 />
//               </div>
//             </div>
//           </div>
//         )}
//       </Modal.Body>

//       <Modal.Footer>
//         <Button
//           variant="secondary"
//           onClick={onHide}
//           style={{ borderRadius: 10 }}
//         >
//           Close
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// const ReadOnlyLeavesCalendar = ({ markedLeaves = [] }) => {
//   try {
//     const leavesArr = useMemo(() => {
//       try {
//         const arr = Array.isArray(markedLeaves) ? markedLeaves : [];
//         return [...new Set(arr.map(normalizeLeave))].sort(); // YYYY-MM-DD sorted
//       } catch (e) {
//         console.error("ReadOnlyLeavesCalendar leavesArr error:", e);
//         return [];
//       }
//     }, [markedLeaves]);

//     const leaveSet = useMemo(() => {
//       try {
//         return new Set(leavesArr);
//       } catch (e) {
//         console.error("ReadOnlyLeavesCalendar leaveSet error:", e);
//         return new Set();
//       }
//     }, [leavesArr]);

//     const [calMonth, setCalMonth] = useState(() => {
//       try {
//         const first = leavesArr[0];
//         return first ? new Date(first + "T00:00:00") : new Date();
//       } catch (e) {
//         console.error("ReadOnlyLeavesCalendar init month error:", e);
//         return new Date();
//       }
//     });

//     // ✅ reset month when leaves change (member changed)
//     useEffect(() => {
//       try {
//         const first = leavesArr[0];
//         setCalMonth(first ? new Date(first + "T00:00:00") : new Date());
//       } catch (e) {
//         console.error("ReadOnlyLeavesCalendar reset month error:", e);
//       }
//     }, [leavesArr]);

//     return (
//       <div className="readonly-cal">
//         <Calendar
//           activeStartDate={calMonth}
//           onActiveStartDateChange={({ activeStartDate }) => {
//             try {
//               if (activeStartDate) setCalMonth(activeStartDate);
//             } catch (e) {
//               console.error("ReadOnlyLeavesCalendar month change error:", e);
//             }
//           }}
//           value={null}
//           onChange={() => {}}
//           selectRange={false}
//           tileDisabled={() => true} // read-only dates (navigation still works)
//           tileClassName={({ date, view }) => {
//             try {
//               if (view !== "month") return null;
//               return leaveSet.has(dateKey(date)) ? "leave-day" : null;
//             } catch (e) {
//               console.error("ReadOnlyLeavesCalendar tileClassName error:", e);
//               return null;
//             }
//           }}
//         />
//       </div>
//     );
//   } catch (e) {
//     console.error("ReadOnlyLeavesCalendar render error:", e);
//     return null;
//   }
// };

// const debounce = (func, wait) => {
//   let timeout;
//   return (...args) => {
//     clearTimeout(timeout);
//     timeout = setTimeout(() => func(...args), wait);
//   };
// };

// const isIgnoreValue = (v) =>
//   v === undefined || v === null || (typeof v === "string" && v.trim() === "");

// const dateKey = (d) => {
//   const y = d.getFullYear();
//   const m = String(d.getMonth() + 1).padStart(2, "0");
//   const day = String(d.getDate()).padStart(2, "0");
//   return `${y}-${m}-${day}`;
// };

// const normalizeLeave = (d) => String(d || "").split("T")[0]; // keeps YYYY-MM-DD

// const normalizeMember = (m) => ({
//   _id: m._id,
//   name: m.name || "",
//   mobileNumber: String(m.mobileNumber ?? ""),
//   dateOfBirth: m.dateOfBirth || "",
//   city: m.city || "",
//   serviceType: m.serviceType || "",
//   serviceArea: m.serviceArea || "",
//   profileImage: m.profileImage || "",

//   aadhaarNumber: m.documents?.aadhaarNumber || "",
//   panNumber: m.documents?.panNumber || "",

//   docs: {
//     aadhaarFront:
//       m.documents?.aadhaarfrontImage || m.documents?.aadhaarFrontImage || "",
//     aadhaarBack:
//       m.documents?.aadhaarbackImage || m.documents?.aadhaarBackImage || "",
//     pan: m.documents?.panImage || "",
//     other: m.documents?.otherPolicy || "",
//   },

//   accountNumber: m.bankDetails?.accountNumber || "",
//   ifscCode: m.bankDetails?.ifscCode || "",
//   bankName: m.bankDetails?.bankName || "",
//   holderName: m.bankDetails?.holderName || "",
//   accountType: m.bankDetails?.accountType || "",
//   gstNumber: m.bankDetails?.gstNumber || "",

//   location: m.address?.location || "",
//   latitude: m.address?.latitude,
//   longitude: m.address?.longitude,

//   markedLeaves: Array.isArray(m.markedLeaves)
//     ? m.markedLeaves.map(normalizeLeave)
//     : [],
// });

// const VendorsDashboard = () => {
//   const [city, setCity] = useState("All Cities");
//   const [status, setStatus] = useState("All Statuses");
//   const [service, setService] = useState("All Services");
//   const [selectedVendor, setSelectedVendor] = useState(null);
//   const [showAddVendorModal, setShowAddVendorModal] = useState(false);
//   const [showAddMemberModal, setShowAddMemberModal] = useState(false);
//   const [leaveDates, setLeaveDates] = useState([]);
//   const [coinDelta, setCoinDelta] = useState(1);
//   const [coinsBalance, setCoinsBalance] = useState(0);
//   const [vendors, setVendors] = useState([]);
//   const [cities, setCities] = useState(["All Cities"]);
//   const [services, setServices] = useState(["All Services"]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [geocodingError, setGeocodingError] = useState(null);
//   const [showAddressPicker, setShowAddressPicker] = useState(false);
//   const [showMemberAddressPicker, setShowMemberAddressPicker] = useState(false);
//   const [selectedTeamMember, setSelectedTeamMember] = useState(null);
//   const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
//   const [showMemberLeavesModal, setShowMemberLeavesModal] = useState(false);

//   const [isEditingVendor, setIsEditingVendor] = useState(false);
//   const [editingVendorId, setEditingVendorId] = useState(null);

//   const [isEditingMember, setIsEditingMember] = useState(false);
//   const [editingMemberId, setEditingMemberId] = useState(null);
//   const [showMemberDocsModal, setShowMemberDocsModal] = useState(false);

//   const [bulkFile, setBulkFile] = useState(null);
//   const [bulkUploading, setBulkUploading] = useState(false);

//   const [vendorRatings, setVendorRatings] = useState([]);
//   const [ratingsLoading, setRatingsLoading] = useState(false);
//   const [ratingsError, setRatingsError] = useState(null);
//   const [serverPagination, setServerPagination] = useState({
//     page: 1,
//     limit: 10,
//     total: 0,
//     totalPages: 1,
//   });

//   const PAGE_SIZE = 10;
//   const [currentPage, setCurrentPage] = useState(1);
//   console.log("Team member:", selectedVendor);
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [city, status, service, vendors]);

//   const [formData, setFormData] = useState({
//     vendorName: "",
//     profileImage: "",
//     mobileNumber: "",
//     dateOfBirth: "",
//     yearOfWorking: "",
//     city: "",
//     serviceType: "",
//     capacity: "",
//     serviceArea: "",
//     aadhaarNumber: "",
//     panNumber: "",
//     accountNumber: "",
//     ifscCode: "",
//     bankName: "",
//     holderName: "",
//     accountType: "",
//     gstNumber: "",
//     location: "",
//     latitude: "",
//     longitude: "",
//   });

//   const [errors, setErrors] = useState({});

//   const [files, setFiles] = useState({
//     profileImage: null,

//     aadhaarfrontImage: null,
//     aadhaarbackImage: null,
//     panImage: null,
//     otherPolicy: null,
//   });

//   const [memberFormData, setMemberFormData] = useState({
//     name: "",
//     mobileNumber: "",
//     dateOfBirth: "",
//     city: "",
//     serviceType: "",
//     serviceArea: "",
//     aadhaarNumber: "",
//     panNumber: "",
//     accountNumber: "",
//     ifscCode: "",
//     bankName: "",
//     holderName: "",
//     accountType: "",
//     gstNumber: "",
//     location: "",
//     latitude: "",
//     longitude: "",
//   });
//   const [memberErrors, setMemberErrors] = useState({});
//   const [memberFiles, setMemberFiles] = useState({
//     profileImage: null,
//     aadhaarfrontImage: null,
//     aadhaarbackImage: null,
//     panImage: null,
//     otherPolicy: null,
//   });

//   const downloadExcelTemplate = () => {
//     const headers = [
//       [
//         "vendorName",
//         "vendorMobile",
//         "vendorDOB",
//         "vendorExperience",
//         "city",
//         "serviceType",
//         "capacity",
//         "serviceArea",
//         "vendorAadhaar",
//         "vendorPAN",
//         "vendorLat",
//         "vendorLng",
//         "memberName",
//         "memberMobile",
//         "memberDOB",
//         "memberAadhaar",
//         "memberPAN",
//         "memberLat",
//         "memberLng",
//       ],
//     ];

//     const csvContent =
//       "data:text/csv;charset=utf-8," +
//       headers.map((e) => e.join(",")).join("\n");

//     const link = document.createElement("a");
//     link.href = encodeURI(csvContent);
//     link.download = "vendor_bulk_template.csv";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const handleBulkUpload = async () => {
//     if (!bulkFile) {
//       alert("Please select an Excel file");
//       return;
//     }

//     const fd = new FormData();
//     fd.append("file", bulkFile);

//     try {
//       setBulkUploading(true);

//       await axios.post(`${BASE_URL}/vendor/bulk-upload`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       alert("Bulk vendors uploaded successfully!");
//       setBulkFile(null);
//       await fetchVendors();
//     } catch (error) {
//       alert(
//         error.response?.data?.message ||
//           "Bulk upload failed. Please check the file."
//       );
//     } finally {
//       setBulkUploading(false);
//     }
//   };

//   const validate = () => {
//     const newErrors = {};

//     // Vendor Name: Required and should only contain alphabets and spaces
//     const nameRegex = /^[A-Za-z\s]+$/;
//     if (!formData.vendorName) {
//       newErrors.vendorName = "Vendor name is required.";
//     } else if (!nameRegex.test(formData.vendorName)) {
//       newErrors.vendorName =
//         "Vendor name must contain only alphabets and spaces.";
//     }

//     // Mobile Number: Required and should be exactly 10 digits
//     const mobileNumberRegex = /^[0-9]{10}$/;
//     if (!formData.mobileNumber) {
//       newErrors.mobileNumber = "Phone number is required.";
//     } else if (!mobileNumberRegex.test(formData.mobileNumber)) {
//       newErrors.mobileNumber = "Phone number must be 10 digits.";
//     }

//     // Date of Birth: Required
//     if (!formData.dateOfBirth)
//       newErrors.dateOfBirth = "Date of birth is required.";

//     // Year of Working: Required and must be a valid number
//     if (!formData.yearOfWorking)
//       newErrors.yearOfWorking = "Year of working is required.";
//     else if (isNaN(formData.yearOfWorking))
//       newErrors.yearOfWorking = "Year of working must be a valid number.";

//     // City: Required
//     if (!formData.city) newErrors.city = "City is required.";

//     // Service Type: Required
//     if (!formData.serviceType)
//       newErrors.serviceType = "Service type is required.";

//     // Capacity: Required and must be a valid number
//     if (!formData.capacity) newErrors.capacity = "Capacity is required.";
//     else if (isNaN(formData.capacity))
//       newErrors.capacity = "Capacity must be a valid number.";

//     // Service Area: Required
//     if (!formData.serviceArea)
//       newErrors.serviceArea = "Service area is required.";

//     // Aadhar Number: Required and must be exactly 12 digits
//     const aadhaarRegex = /^[0-9]{12}$/;
//     if (!formData.aadhaarNumber) {
//       newErrors.aadhaarNumber = "Aadhar number is required.";
//     } else if (!aadhaarRegex.test(formData.aadhaarNumber)) {
//       newErrors.aadhaarNumber = "Aadhar number must be 12 digits.";
//     }

//     // PAN Number: Required and must follow the PAN format (XXXXX9999X)
//     const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
//     if (!formData.panNumber) {
//       newErrors.panNumber = "PAN number is required.";
//     } else if (!panRegex.test(formData.panNumber)) {
//       newErrors.panNumber = "PAN number is invalid.";
//     }

//     // Account Number: Required and must be numeric
//     if (!formData.accountNumber) {
//       newErrors.accountNumber = "Account number is required.";
//     } else if (!/^[0-9]+$/.test(formData.accountNumber)) {
//       newErrors.accountNumber = "Account number must be numeric.";
//     }

//     // IFSC Code: Required and must follow the format (4 alphabets + 7 digits)
//     const ifscRegex = /^[A-Za-z]{4}[0-9]{7}$/;
//     if (!formData.ifscCode) {
//       newErrors.ifscCode = "IFSC code is required.";
//     } else if (!ifscRegex.test(formData.ifscCode)) {
//       newErrors.ifscCode = "Invalid IFSC code.";
//     }

//     // Bank Name: Required
//     if (!formData.bankName) newErrors.bankName = "Bank name is required.";

//     // Holder Name: Required
//     if (!formData.holderName) newErrors.holderName = "Holder name is required.";

//     // Account Type: Required
//     if (!formData.accountType)
//       newErrors.accountType = "Account type is required.";

//     // GST Number: If provided, must be valid (minimum length 15 characters)
//     if (formData.gstNumber && formData.gstNumber.length < 15) {
//       newErrors.gstNumber =
//         "GST number must be valid (at least 15 characters).";
//     }

//     // Location: Required
//     if (!formData.location) newErrors.location = "Location is required.";

//     // Latitude: Required and must be a valid number
//     if (!formData.latitude || isNaN(formData.latitude))
//       newErrors.latitude = "Latitude is required.";

//     // Longitude: Required and must be a valid number
//     if (!formData.longitude || isNaN(formData.longitude))
//       newErrors.longitude = "Longitude is required.";

//     // Set the errors state
//     setErrors(newErrors);

//     // Return true if no errors, false if there are errors
//     return Object.keys(newErrors).length === 0;
//   };

//   const validateMember = () => {
//     const newErrors = {};

//     // Name: Only alphabets and spaces
//     const nameRegex = /^[A-Za-z\s]+$/;
//     if (!memberFormData.name) {
//       newErrors.name = "Name is required.";
//     } else if (!nameRegex.test(memberFormData.name)) {
//       newErrors.name = "Name must contain only alphabets and spaces.";
//     }

//     // Mobile Number: 10 digits
//     const mobileNumberRegex = /^[0-9]{10}$/;
//     if (!memberFormData.mobileNumber) {
//       newErrors.mobileNumber = "Phone number is required.";
//     } else if (!mobileNumberRegex.test(memberFormData.mobileNumber)) {
//       newErrors.mobileNumber = "Phone number must be 10 digits.";
//     }

//     // Date of Birth: Required and valid date format
//     if (!memberFormData.dateOfBirth) {
//       newErrors.dateOfBirth = "Date of birth is required.";
//     }

//     // City: Required
//     if (!memberFormData.city) {
//       newErrors.city = "City is required.";
//     }

//     // Service Type: Required
//     if (!memberFormData.serviceType) {
//       newErrors.serviceType = "Service type is required.";
//     }

//     // Service Area: Required
//     if (!memberFormData.serviceArea) {
//       newErrors.serviceArea = "Service area is required.";
//     }

//     // Aadhar Number: 12 digits
//     const aadhaarRegex = /^[0-9]{12}$/;
//     if (!memberFormData.aadhaarNumber) {
//       newErrors.aadhaarNumber = "Aadhar number is required.";
//     } else if (!aadhaarRegex.test(memberFormData.aadhaarNumber)) {
//       newErrors.aadhaarNumber = "Aadhar number must be 12 digits.";
//     }

//     // PAN Number: PAN format validation
//     const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
//     if (!memberFormData.panNumber) {
//       newErrors.panNumber = "PAN number is required.";
//     } else if (!panRegex.test(memberFormData.panNumber)) {
//       newErrors.panNumber = "PAN number is invalid.";
//     }

//     // Bank Account Number: Numeric validation
//     if (!memberFormData.accountNumber) {
//       newErrors.accountNumber = "Bank account number is required.";
//     } else if (!/^[0-9]+$/.test(memberFormData.accountNumber)) {
//       newErrors.accountNumber = "Bank account number should be numeric.";
//     }

//     // IFSC Code: Format validation (4 alphabets + 7 digits)
//     const ifscRegex = /^[A-Za-z]{4}[0-9]{7}$/;
//     if (!memberFormData.ifscCode) {
//       newErrors.ifscCode = "IFSC code is required.";
//     } else if (!ifscRegex.test(memberFormData.ifscCode)) {
//       newErrors.ifscCode = "Invalid IFSC code.";
//     }

//     // Bank Name: Required
//     if (!memberFormData.bankName) {
//       newErrors.bankName = "Bank name is required.";
//     }

//     // Account Holder Name: Required
//     if (!memberFormData.holderName) {
//       newErrors.holderName = "Account holder name is required.";
//     }

//     // Account Type: Required
//     if (!memberFormData.accountType) {
//       newErrors.accountType = "Account type is required.";
//     }

//     // GST Number: If provided, it must be at least 15 characters long
//     if (memberFormData.gstNumber && memberFormData.gstNumber.length < 15) {
//       newErrors.gstNumber = "GST number must be at least 15 characters.";
//     }

//     // Location: Required
//     if (!memberFormData.location) {
//       newErrors.location = "Location is required.";
//     }

//     // Latitude: Numeric and required
//     if (!memberFormData.latitude || isNaN(memberFormData.latitude)) {
//       newErrors.latitude = "Latitude is required.";
//     }

//     // Longitude: Numeric and required
//     if (!memberFormData.longitude || isNaN(memberFormData.longitude)) {
//       newErrors.longitude = "Longitude is required.";
//     }

//     // If any errors exist, update the error state
//     setMemberErrors(newErrors);

//     // Return true if there are no errors, else false
//     return Object.keys(newErrors).length === 0;
//   };

//   const prettyServiceType = (s) => {
//     try {
//       if (!s) return "-";
//       return String(s)
//         .replace(/_/g, " ")
//         .replace(/\b\w/g, (c) => c.toUpperCase());
//     } catch (e) {
//       console.error("prettyServiceType error:", e);
//       return "-";
//     }
//   };

//   const fetchVendorRatings = useCallback(async (vendorId, signal) => {
//     try {
//       if (!vendorId) return;

//       setRatingsLoading(true);
//       setRatingsError(null);

//       const { data } = await axios.get(
//         `${BASE_URL}/ratings/vendor-ratings/${vendorId}/latest`,
//         {
//           params: { limit: 50 },
//           signal, // ✅ abort support
//         }
//       );

//       const list = Array.isArray(data?.data) ? data.data : [];
//       setVendorRatings(list);
//     } catch (err) {
//       if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
//       console.error("fetchVendorRatings error:", err);
//       setRatingsError(
//         err?.response?.data?.message || err.message || "Failed to load ratings"
//       );
//       setVendorRatings([]);
//     } finally {
//       setRatingsLoading(false);
//     }
//   }, []);

//   const fetchCoordinates = useCallback(
//     debounce(async (location) => {
//       if (!location) {
//         setGeocodingError(null);
//         return;
//       }
//       try {
//         const response = await axios.get(
//           "https://nominatim.openstreetmap.org/search",
//           {
//             params: {
//               q: location,
//               format: "json",
//               addressdetails: 1,
//               limit: 1,
//             },
//             headers: {
//               "User-Agent": "VendorsDashboard/1.0 (your-email@example.com)",
//             },
//           }
//         );
//         if (response.data && response.data.length > 0) {
//           const { lat, lon } = response.data[0];
//           setFormData((prev) => ({
//             ...prev,
//             latitude: lat,
//             longitude: lon,
//           }));
//           setGeocodingError(null);
//         } else {
//           setGeocodingError("No coordinates found for the entered location");
//           setFormData((prev) => ({
//             ...prev,
//             latitude: "",
//             longitude: "",
//           }));
//         }
//       } catch (error) {
//         setGeocodingError(
//           "Error fetching coordinates: " +
//             (error.response?.data?.message || error.message)
//         );
//         setFormData((prev) => ({
//           ...prev,
//           latitude: "",
//           longitude: "",
//         }));
//       }
//     }, 500),
//     []
//   );

//   const openEditVendorModal = (v) => {
//     try {
//       setIsEditingVendor(true);
//       setEditingVendorId(v.id);
//       setShowAddVendorModal(true);

//       setFormData((prev) => ({
//         ...prev,
//         vendorName: v.name || "",
//         mobileNumber: v.phone || "",
//         dateOfBirth: v.dob || "",
//         yearOfWorking: String(v.workingSince || ""),
//         city: v.city || "",
//         serviceType: v.category || "",
//         capacity: v.capacity || "",
//         serviceArea: v.serviceArea || "",

//         aadhaarNumber: v.aadhar || "",
//         panNumber: v.pan || "",

//         accountNumber: v.account || "",
//         ifscCode: v.ifsc || "",
//         bankName: v.bank || "",
//         holderName: v.holderName || v.name || "", // if you don’t have holderName, fallback to vendor name
//         accountType: v.accountType || "Savings",
//         gstNumber: v.gst === "NA" ? "" : v.gst || "",

//         // ✅ FIX: location should come from address location, not serviceArea
//         location: v.location || "",
//         latitude: String(v.lat || ""),
//         longitude: String(v.long || ""),
//       }));

//       // ✅ reset file inputs in edit mode (avoid sending old files)
//       setFiles({
//         profileImage: null,
//         aadhaarfrontImage: null,
//         aadhaarbackImage: null,
//         panImage: null,
//         otherPolicy: null,
//       });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const openEditMemberModal = (m) => {
//     try {
//       setIsEditingMember(true);
//       setEditingMemberId(m._id);
//       setShowAddMemberModal(true);

//       setMemberFormData({
//         name: m.name || "",
//         mobileNumber: m.mobileNumber || "",
//         dateOfBirth: m.dateOfBirth || "",
//         city: m.city || "",
//         serviceType: m.serviceType || "",
//         serviceArea: m.serviceArea || "",

//         aadhaarNumber: m.aadhaarNumber || "",
//         panNumber: m.panNumber || "",

//         accountNumber: m.accountNumber || "",
//         ifscCode: m.ifscCode || "",
//         bankName: m.bankName || "",
//         holderName: m.holderName || m.name || "",
//         accountType: m.accountType || "Savings",
//         gstNumber: m.gstNumber || "",

//         location: m.location || "",
//         latitude: String(m.latitude || ""),
//         longitude: String(m.longitude || ""),
//       });

//       // reset new uploads (so old is kept unless user selects new files)
//       setMemberFiles({
//         profileImage: null,
//         aadhaarfrontImage: null,
//         aadhaarbackImage: null,
//         // aadhaarImage: null, // ✅ ADD THIS
//         panImage: null,
//         otherPolicy: null,
//       });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const fetchVendors = async (page = 1) => {
//     setLoading(true);
//     setError(null);

//     try {
//       const response = await axios.get(`${BASE_URL}/vendor/get-all-vendor`, {
//         params: {
//           page,
//           limit: PAGE_SIZE, // reuse existing PAGE_SIZE
//         },
//       });

//       const { vendor, pagination } = response.data;

//       const fetchedVendors = vendor.map((vendor) => ({
//         id: vendor._id,
//         name: vendor.vendor.vendorName,
//         profileImage: vendor.vendor.profileImage,
//         category: vendor.vendor.serviceType,
//         city: vendor.vendor.city,
//         status: vendor.activeStatus ? "Live" : "Inactive",
//         rating: 4.5,
//         phone: String(vendor.vendor.mobileNumber ?? ""),
//         capacity: vendor.vendor.capacity,
//         dob: vendor.vendor.dateOfBirth,
//         serviceArea: vendor.vendor?.serviceArea,
//         location: vendor.address?.location || "",
//         workingSince: parseInt(vendor.vendor?.yearOfWorking ?? "0", 10),
//         coins: Number(vendor.wallet?.coins ?? 0),
//         lat: vendor.address?.latitude,
//         long: vendor.address?.longitude,
//         docs: {
//           aadhaarFront:
//             vendor.documents?.aadhaarfrontImage ||
//             vendor.documents?.aadhaarFrontImage ||
//             "",
//           aadhaarBack:
//             vendor.documents?.aadhaarbackImage ||
//             vendor.documents?.aadhaarBackImage ||
//             "",
//           pan: vendor.documents?.panImage || "",
//           other: vendor.documents?.otherPolicy || "",
//         },
//         team: (vendor.team || []).map(normalizeMember),
//       }));

//       setVendors(fetchedVendors);

//       // ✅ store backend pagination
//       if (pagination) {
//         setServerPagination(pagination);
//         setCurrentPage(pagination.page);
//       }

//       return fetchedVendors;
//     } catch (error) {
//       console.error("Error fetching vendors:", error);
//       setError(error.response?.data?.message || error.message);
//       return [];
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchVendors(1);
//   }, []);

//   useEffect(() => {
//     const controller = new AbortController();

//     try {
//       if (selectedVendor?.id) {
//         fetchVendorRatings(selectedVendor.id, controller.signal);
//       } else {
//         setVendorRatings([]);
//         setRatingsError(null);
//       }
//     } catch (e) {
//       console.error("ratings useEffect error:", e);
//     }

//     return () => controller.abort();
//   }, [selectedVendor?.id, fetchVendorRatings]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleMemberInputChange = (e) => {
//     const { name, value } = e.target;
//     setMemberFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e) => {
//     const { name, files } = e.target;
//     setFiles((prev) => ({ ...prev, [name]: files[0] }));
//   };

//   const handleMemberFileChange = (e) => {
//     const { name, files } = e.target;
//     setMemberFiles((prev) => ({ ...prev, [name]: files[0] }));
//   };

//   const handleUpdateVendor = async (e) => {
//     e.preventDefault();

//     try {
//       if (!editingVendorId) return alert("Vendor Id missing for update.");
//       if (!validate()) return;

//       const latOk = formData.latitude && !isNaN(formData.latitude);
//       const lngOk = formData.longitude && !isNaN(formData.longitude);
//       if (!latOk || !lngOk) {
//         alert("Please select a valid location using the map picker.");
//         return;
//       }

//       const fd = new FormData();

//       const vendorPayload = {
//         vendorName: formData.vendorName,
//         mobileNumber: formData.mobileNumber,
//         dateOfBirth: formData.dateOfBirth,
//         yearOfWorking: formData.yearOfWorking,
//         city: formData.city,
//         serviceType: formData.serviceType,
//         capacity: formData.capacity,
//         serviceArea: formData.serviceArea,
//       };

//       const documentsPayload = {
//         aadhaarNumber: formData.aadhaarNumber,
//         panNumber: formData.panNumber,
//       };

//       const bankDetailsPayload = {
//         accountNumber: formData.accountNumber,
//         ifscCode: formData.ifscCode,
//         bankName: formData.bankName,
//         holderName: formData.holderName,
//         accountType: formData.accountType,
//         gstNumber: formData.gstNumber,
//       };

//       const addressPayload = {
//         location: formData.location,
//         latitude: parseFloat(formData.latitude),
//         longitude: parseFloat(formData.longitude),
//       };

//       fd.append("vendor", JSON.stringify(vendorPayload));
//       fd.append("documents", JSON.stringify(documentsPayload));
//       fd.append("bankDetails", JSON.stringify(bankDetailsPayload));
//       fd.append("address", JSON.stringify(addressPayload));

//       // ✅ append ONLY actual Files
//       const appendIfFile = (key, val) => {
//         if (val && val instanceof File) fd.append(key, val);
//       };

//       appendIfFile("profileImage", files.profileImage);
//       appendIfFile("aadhaarfrontImage", files.aadhaarfrontImage);
//       appendIfFile("aadhaarbackImage", files.aadhaarbackImage);
//       appendIfFile("panImage", files.panImage);
//       appendIfFile("otherPolicy", files.otherPolicy);

//       await axios.put(
//         `${BASE_URL}/vendor/update-vendor/${editingVendorId}`,
//         fd,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );

//       alert("Vendor updated successfully!");

//       setShowAddVendorModal(false);
//       setIsEditingVendor(false);
//       setEditingVendorId(null);

//       // ✅ IMPORTANT: get fresh list and update selectedVendor from that list
//       const list = await fetchVendors();

//       setSelectedVendor((prev) => {
//         if (!prev) return prev;
//         const found = list.find((x) => x.id === prev.id);
//         return found || prev;
//       });

//       // ✅ clear files after update
//       setFiles({
//         profileImage: null,
//         aadhaarfrontImage: null,
//         aadhaarbackImage: null,
//         panImage: null,
//         otherPolicy: null,
//       });
//     } catch (error) {
//       console.error("Error updating vendor:", error);
//       alert(
//         "Failed to update vendor: " +
//           (error.response?.data?.message || error.message)
//       );
//     }
//   };

//   const handleMemberUpdate = async (e) => {
//     e.preventDefault();

//     try {
//       if (!selectedVendor?.id) return alert("Vendor not selected");
//       if (!editingMemberId) return alert("Member Id missing");
//       if (!validateMember()) return;

//       const latOk =
//         memberFormData.latitude &&
//         !isNaN(memberFormData.latitude) &&
//         Number(memberFormData.latitude) !== 0;

//       const lngOk =
//         memberFormData.longitude &&
//         !isNaN(memberFormData.longitude) &&
//         Number(memberFormData.longitude) !== 0;

//       if (!latOk || !lngOk) {
//         alert("Please select a valid location using the map picker.");
//         return;
//       }

//       const fd = new FormData();
//       fd.append("vendorId", selectedVendor.id);
//       fd.append("memberId", editingMemberId);

//       const member = {
//         name: memberFormData.name,
//         mobileNumber: memberFormData.mobileNumber,
//         dateOfBirth: memberFormData.dateOfBirth,
//         city: memberFormData.city,
//         serviceType: memberFormData.serviceType,
//         serviceArea: memberFormData.serviceArea,
//       };

//       const documents = {
//         aadhaarNumber: memberFormData.aadhaarNumber,
//         panNumber: memberFormData.panNumber,
//       };

//       const bankDetails = {
//         accountNumber: memberFormData.accountNumber,
//         ifscCode: memberFormData.ifscCode,
//         bankName: memberFormData.bankName,
//         holderName: memberFormData.holderName,
//         accountType: memberFormData.accountType,
//         gstNumber: memberFormData.gstNumber,
//       };

//       const address = {
//         location: memberFormData.location,
//         latitude: parseFloat(memberFormData.latitude),
//         longitude: parseFloat(memberFormData.longitude),
//       };

//       fd.append("member", JSON.stringify(member));
//       fd.append("documents", JSON.stringify(documents));
//       fd.append("bankDetails", JSON.stringify(bankDetails));
//       fd.append("address", JSON.stringify(address));

//       const appendIfFile = (key, val) => {
//         if (val && val instanceof File) fd.append(key, val);
//       };

//       appendIfFile("profileImage", memberFiles.profileImage);
//       appendIfFile("aadhaarfrontImage", memberFiles.aadhaarfrontImage);
//       appendIfFile("aadhaarbackImage", memberFiles.aadhaarbackImage);
//       appendIfFile("panImage", memberFiles.panImage);
//       appendIfFile("otherPolicy", memberFiles.otherPolicy);

//       const { data } = await axios.put(`${BASE_URL}/vendor/team/update`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       alert("Team member updated successfully!");

//       const normalizedTeam = (data?.team || []).map(normalizeMember);

//       setSelectedVendor((v) => (v ? { ...v, team: normalizedTeam } : v));
//       setVendors((list) =>
//         list.map((v) =>
//           v.id === selectedVendor.id ? { ...v, team: normalizedTeam } : v
//         )
//       );

//       setShowAddMemberModal(false);
//       setIsEditingMember(false);
//       setEditingMemberId(null);

//       setMemberFiles({
//         profileImage: null,
//         aadhaarfrontImage: null,
//         aadhaarbackImage: null,
//         panImage: null,
//         otherPolicy: null,
//       });
//     } catch (error) {
//       console.error("Error updating team member:", error);
//       alert(
//         "Failed to update member: " +
//           (error?.response?.data?.message || error.message)
//       );
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     if (
//       !formData.latitude ||
//       !formData.longitude ||
//       isNaN(formData.latitude) ||
//       isNaN(formData.longitude)
//     ) {
//       alert("Please select a valid location using the map picker.");
//       return;
//     }
//     try {
//       const formDataToSend = new FormData();

//       const vendor = {
//         vendorName: formData.vendorName,
//         mobileNumber: formData.mobileNumber,
//         dateOfBirth: formData.dateOfBirth,
//         yearOfWorking: formData.yearOfWorking,
//         city: formData.city,
//         serviceType: formData.serviceType,
//         capacity: formData.capacity,
//         serviceArea: formData.serviceArea,
//       };

//       const documents = {
//         aadhaarNumber: formData.aadhaarNumber,
//         panNumber: formData.panNumber,
//       };

//       const bankDetails = {
//         accountNumber: formData.accountNumber,
//         ifscCode: formData.ifscCode,
//         bankName: formData.bankName,
//         holderName: formData.holderName,
//         accountType: formData.accountType,
//         gstNumber: formData.gstNumber,
//       };

//       const address = {
//         location: formData.location,
//         latitude: parseFloat(formData.latitude),
//         longitude: parseFloat(formData.longitude),
//       };

//       formDataToSend.append("vendor", JSON.stringify(vendor));
//       formDataToSend.append("documents", JSON.stringify(documents));
//       formDataToSend.append("bankDetails", JSON.stringify(bankDetails));
//       formDataToSend.append("address", JSON.stringify(address));

//       if (files.profileImage)
//         formDataToSend.append("profileImage", files.profileImage);
//       if (files.aadhaarbackImage)
//         formDataToSend.append("aadhaarbackImage", files.aadhaarbackImage);
//       if (files.aadhaarfrontImage)
//         formDataToSend.append("aadhaarfrontImage", files.aadhaarfrontImage);

//       if (files.panImage) formDataToSend.append("panImage", files.panImage);
//       if (files.otherPolicy)
//         formDataToSend.append("otherPolicy", files.otherPolicy);

//       await axios.post(`${BASE_URL}/vendor/create-vendor`, formDataToSend, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       alert("Vendor created successfully!");
//       setShowAddVendorModal(false);
//       setFormData({
//         vendorName: "",
//         mobileNumber: "",
//         dateOfBirth: "",
//         yearOfWorking: "",
//         city: "",
//         serviceType: "",
//         capacity: "",
//         serviceArea: "",
//         aadhaarNumber: "",
//         panNumber: "",
//         accountNumber: "",
//         ifscCode: "",
//         bankName: "",
//         holderName: "",
//         accountType: "",
//         gstNumber: "",
//         location: "",
//         latitude: "",
//         longitude: "",
//       });
//       setFiles({
//         profileImage: null,
//         aadhaarfrontImage: null,
//         aadhaarbackImage: null,
//         panImage: null,
//         otherPolicy: null,
//       });
//       setGeocodingError(null);
//       await fetchVendors();
//     } catch (error) {
//       console.error("Error creating vendor:", error);
//       alert(
//         "Failed to create vendor: " +
//           (error.response?.data?.message || error.message)
//       );
//     }
//   };

//   const handleMemberSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       if (!selectedVendor?.id) return alert("Vendor not selected");

//       if (!validateMember()) return;

//       const latOk =
//         memberFormData.latitude &&
//         !isNaN(memberFormData.latitude) &&
//         Number(memberFormData.latitude) !== 0;

//       const lngOk =
//         memberFormData.longitude &&
//         !isNaN(memberFormData.longitude) &&
//         Number(memberFormData.longitude) !== 0;

//       if (!latOk || !lngOk) {
//         alert("Please select a valid location using the map picker.");
//         return;
//       }

//       const fd = new FormData();
//       fd.append("vendorId", selectedVendor.id);

//       const member = {
//         name: memberFormData.name,
//         mobileNumber: memberFormData.mobileNumber,
//         dateOfBirth: memberFormData.dateOfBirth,
//         city: memberFormData.city,
//         serviceType: memberFormData.serviceType,
//         serviceArea: memberFormData.serviceArea,
//       };

//       const documents = {
//         aadhaarNumber: memberFormData.aadhaarNumber,
//         panNumber: memberFormData.panNumber,
//       };

//       const bankDetails = {
//         accountNumber: memberFormData.accountNumber,
//         ifscCode: memberFormData.ifscCode,
//         bankName: memberFormData.bankName,
//         holderName: memberFormData.holderName,
//         accountType: memberFormData.accountType,
//         gstNumber: memberFormData.gstNumber,
//       };

//       const address = {
//         location: memberFormData.location,
//         latitude: parseFloat(memberFormData.latitude),
//         longitude: parseFloat(memberFormData.longitude),
//       };

//       fd.append("member", JSON.stringify(member));
//       fd.append("documents", JSON.stringify(documents));
//       fd.append("bankDetails", JSON.stringify(bankDetails));
//       fd.append("address", JSON.stringify(address));

//       // ✅ only append if it's a real File
//       const appendIfFile = (key, val) => {
//         if (val && val instanceof File) fd.append(key, val);
//       };

//       appendIfFile("profileImage", memberFiles.profileImage);
//       appendIfFile("aadhaarfrontImage", memberFiles.aadhaarfrontImage);
//       appendIfFile("aadhaarbackImage", memberFiles.aadhaarbackImage);
//       appendIfFile("panImage", memberFiles.panImage);
//       appendIfFile("otherPolicy", memberFiles.otherPolicy);

//       const { data } = await axios.post(`${BASE_URL}/vendor/team/add`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       alert("Team member added successfully!");

//       const normalizedTeam = (data?.team || []).map(normalizeMember);

//       setSelectedVendor((v) => (v ? { ...v, team: normalizedTeam } : v));
//       setVendors((list) =>
//         list.map((v) =>
//           v.id === selectedVendor.id ? { ...v, team: normalizedTeam } : v
//         )
//       );

//       setShowAddMemberModal(false);

//       setMemberFormData({
//         name: "",
//         mobileNumber: "",
//         dateOfBirth: "",
//         city: "",
//         serviceType: "",
//         serviceArea: "",
//         aadhaarNumber: "",
//         panNumber: "",
//         accountNumber: "",
//         ifscCode: "",
//         bankName: "",
//         holderName: "",
//         accountType: "",
//         gstNumber: "",
//         location: "",
//         latitude: "",
//         longitude: "",
//       });

//       setMemberFiles({
//         profileImage: null,
//         aadhaarfrontImage: null,
//         aadhaarbackImage: null,
//         panImage: null,
//         otherPolicy: null,
//       });
//     } catch (error) {
//       console.error("Error adding team member:", error);
//       alert(
//         "Failed to add team member: " +
//           (error?.response?.data?.message || error.message)
//       );
//     }
//   };

//   const API_BASE = `${BASE_URL}/vendor`;

//   const mutateCoins = async ({ vendorId, coins, type }) => {
//     const url =
//       type === "add" ? `${API_BASE}/add-coin` : `${API_BASE}/reduce-coin`;
//     setCoinsBalance((b) => Math.max(0, b + (type === "add" ? coins : -coins)));
//     try {
//       const { data } = await axios.post(url, { vendorId, coins });
//       const serverCoins = Number(data?.wallet?.coins ?? coinsBalance);
//       setCoinsBalance(serverCoins);
//       setVendors((list) =>
//         list.map((v) => (v.id === vendorId ? { ...v, coins: serverCoins } : v))
//       );
//     } catch (err) {
//       setCoinsBalance((b) =>
//         Math.max(0, b - (type === "add" ? coins : -coins))
//       );
//       alert(
//         err?.response?.data?.message ||
//           `Failed to ${type === "add" ? "add" : "reduce"} coins`
//       );
//     }
//   };

//   const handleAddCoinsAPI = async () => {
//     if (!selectedVendor) return;
//     const coins = Number(coinDelta || 0);
//     if (coins <= 0) return alert("Enter a positive coin amount.");
//     await mutateCoins({ vendorId: selectedVendor.id, coins, type: "add" });
//   };

//   const handleReduceCoinsAPI = async () => {
//     if (!selectedVendor) return;
//     const coins = Number(coinDelta || 0);
//     if (coins <= 0) return alert("Enter a positive coin amount.");
//     if (coins > coinsBalance) return alert("Insufficient balance.");
//     await mutateCoins({ vendorId: selectedVendor.id, coins, type: "reduce" });
//   };

//   const removeTeamMemberAPI = async (memberId) => {
//     if (!selectedVendor) return;
//     try {
//       const { data } = await axios.post(`${API_BASE}/team/remove`, {
//         vendorId: selectedVendor.id,
//         memberId,
//       });
//       const normalizedTeam = (data?.team || []).map(normalizeMember);

//       setSelectedVendor((v) => (v ? { ...v, team: normalizedTeam } : v));
//       setVendors((list) =>
//         list.map((v) =>
//           v.id === selectedVendor.id ? { ...v, team: normalizedTeam } : v
//         )
//       );
//     } catch (err) {
//       alert(err?.response?.data?.message || "Failed to remove member");
//     }
//   };

//   const filteredVendors = vendors.filter((vendor) => {
//     const matchesCity = city === "All Cities" || vendor.city === city;
//     const matchesStatus = status === "All Statuses" || vendor.status === status;
//     const matchesService =
//       service === "All Services" || vendor.category === service;
//     return matchesCity && matchesStatus && matchesService;
//   });

//   // Total pages
//   // Adjust the pagination logic
//   const totalPages = serverPagination.totalPages;
//   const safePage = serverPagination.page;

//   // Page change helper
//   const goToPage = (p) => {
//     if (p < 1 || p > serverPagination.totalPages) return;
//     fetchVendors(p);
//   };
//   return (
//     <>
//       <style>{`
//       .gmap-dialog {
//         max-width: min(1000px, 92vw) !important;
//         margin: 1.25rem auto;
//       }
//       .gmap-content {
//         height: 86vh;
//         display: flex;
//         flex-direction: column;
//       }
//       .gmap-body {
//         display: flex;
//         flex-direction: column;
//         flex: 1;
//         min-height: 0;
//       }

//       /* ✅ READONLY TEAM LEAVES CALENDAR */
//       .readonly-cal .react-calendar__tile {
//         pointer-events: none;
//         cursor: default;
//       }
//       .readonly-cal .react-calendar__tile--active,
//       .readonly-cal .react-calendar__tile:enabled:hover,
//       .readonly-cal .react-calendar__tile:enabled:focus {
//         background: transparent !important;
//       }

//         .team-card {
//     border: 1px solid #eee;
//     border-radius: 16px;
//     box-shadow: 0 6px 22px rgba(0,0,0,0.06);
//     overflow: hidden;
//   }
//   .team-card-header {
//     background: #0f172a;
//     color: #fff;
//     padding: 14px 16px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//   }
//   .team-row {
//     padding: 12px 14px;
//     border-top: 1px solid #f0f0f0;
//     display: grid;
//     grid-template-columns: 1.2fr 1fr 0.9fr;
//     gap: 12px;
//     align-items: center;
//   }
//   .team-name {
//     display: flex;
//     align-items: center;
//     gap: 10px;
//     min-width: 0;
//   }
//   .avatar {
//     width: 36px;
//     height: 36px;
//     border-radius: 12px;
//     background: #f1f5f9;
//     border: 1px solid #e5e7eb;
//     display: grid;
//     place-items: center;
//     font-weight: 700;
//     color: #0f172a;
//     flex: 0 0 auto;
//   }
//   .name-text {
//     min-width: 0;
//   }
//   .name-text .primary {
//     font-weight: 700;
//     font-size: 13px;
//     white-space: nowrap;
//     overflow: hidden;
//     text-overflow: ellipsis;
//     cursor: pointer;
//   }
//   .name-text .secondary {
//     font-size: 11px;
//     color: #64748b;
//   }
//   .leave-chip {
//     display: inline-flex;
//     align-items: center;
//     gap: 6px;
//     padding: 6px 10px;
//     border-radius: 999px;
//     background: #f8fafc;
//     border: 1px solid #e5e7eb;
//     font-size: 11px;
//     margin: 0 6px 6px 0;
//   }
//   .actions-wrap {
//     display: flex;
//     gap: 8px;
//     justify-content: flex-end;
//     flex-wrap: wrap;
//   }

//   /* Leaves modal polish */
//   .leaves-modal-body {
//     display: grid;
//     grid-template-columns: 260px 1fr;
//     gap: 14px;
//   }
//   @media (max-width: 768px) {
//     .leaves-modal-body { grid-template-columns: 1fr; }
//   }
//   .leaves-left {
//     border: 1px solid #eee;
//     border-radius: 14px;
//     padding: 12px;
//     background: #fafafa;
//   }
//   .leaves-right {
//     border: 1px solid #eee;
//     border-radius: 14px;
//     padding: 12px;
//     background: #fff;
//   }

//   /* Calendar: make leave highlight subtle + modern */
//   .leave-day {
//     background: transparent !important;
//     color: #111 !important;
//     position: relative;
//     font-weight: 700;
//   }
//   .leave-day::after {
//     content: "";
//     position: absolute;
//     bottom: 6px;
//     left: 50%;
//     transform: translateX(-50%);
//     width: 20px;
//     height: 6px;
//     border-radius: 999px;
//     background: #111;
//   }
//     `}</style>

//       <Container className="py-4" style={{ fontFamily: "Poppins, sans-serif" }}>
//         <div className="d-flex justify-content-between align-items-center mb-4">
//           <h5 className="fw-bold">Vendors Dashboard</h5>
//           <div className="d-flex gap-2">
//             <Form.Select
//               value={city}
//               onChange={(e) => setCity(e.target.value)}
//               style={{ height: "34px", fontSize: "12px" }}
//             >
//               {cities.map((c) => (
//                 <option key={c} value={c}>
//                   {c}
//                 </option>
//               ))}
//             </Form.Select>
//             <Form.Select
//               value={status}
//               onChange={(e) => setStatus(e.target.value)}
//               style={{ height: "34px", fontSize: "12px" }}
//             >
//               <option>All Statuses</option>
//               <option>Live</option>
//               <option>Inactive</option>
//               <option>Low Coins</option>
//               <option>Capacity Full</option>
//             </Form.Select>
//             <Form.Select
//               value={service}
//               onChange={(e) => setService(e.target.value)}
//               style={{ height: "34px", fontSize: "12px" }}
//             >
//               {services.map((s) => (
//                 <option key={s} value={s}>
//                   {s}
//                 </option>
//               ))}
//             </Form.Select>
//             <Button
//               onClick={() => setShowAddVendorModal(true)}
//               style={{
//                 whiteSpace: "nowrap",
//                 fontSize: "12px",
//                 backgroundColor: "transparent",
//                 borderColor: "black",
//                 color: "black",
//               }}
//             >
//               <FaPlus className="me-2" /> Add Vendor
//             </Button>
//           </div>
//         </div>
//         {/* <div className="d-flex justify-content-end align-items-center gap-2 mb-4">
//           <Button
//             size="sm"
//             variant="outline-success"
//             onClick={downloadExcelTemplate}
//             style={{ fontSize: "12px" }}
//           >
//             Download Excel
//           </Button>

//           <Form.Control
//             type="file"
//             accept=".xlsx,.xls,.csv"
//             size="sm"
//             onChange={(e) => setBulkFile(e.target.files[0])}
//             style={{ width: 180, fontSize: "12px" }}
//           />

//           <Button
//             size="sm"
//             variant="outline-primary"
//             onClick={handleBulkUpload}
//             disabled={bulkUploading}
//             style={{ fontSize: "12px" }}
//           >
//             {bulkUploading ? "Uploading..." : "Upload Excel"}
//           </Button>
//         </div> */}

//         {loading ? (
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               flexDirection: "column",
//             }}
//           >
//             <div className="loader-dots">
//               <span></span>
//               <span></span>
//               <span></span>
//             </div>
//             <p className="mt-3 text-muted">Loading vendor details...</p>

//             <style>{`
//             .loader-dots span {
//               width: 10px;
//               height: 10px;
//               margin: 0 4px;
//               background: #DC3545;
//               border-radius: 50%;
//               display: inline-block;
//               animation: pulse 1s infinite alternate;
//             }

//             .loader-dots span:nth-child(2) {
//               animation-delay: 0.2s;
//             }

//             .loader-dots span:nth-child(3) {
//               animation-delay: 0.4s;
//             }

//             @keyframes pulse {
//               0% { transform: scale(1); opacity: 0.5; }
//               100% { transform: scale(1.6); opacity: 1; }
//             }
//           `}</style>
//           </div>
//         ) : error ? (
//           <div className="text-danger">Error: {error}</div>
//         ) : !selectedVendor ? (
//           <>
//             <Table
//               striped
//               bordered
//               hover
//               responsive
//               className="shadow-lg bg-white text-center"
//             >
//               <thead className="table-dark">
//                 <tr style={{ fontSize: "14px" }}>
//                   <th>Vendor Name</th>
//                   <th>Category</th>
//                   <th>City</th>

//                   <th>Status</th>
//                   <th>Rating</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredVendors.map((vendor) => (
//                   <tr
//                     key={vendor.id}
//                     style={{ cursor: "pointer", fontSize: "12px" }}
//                     onClick={() => {
//                       setSelectedVendor(vendor);
//                       setCoinsBalance(Number(vendor.coins || 0));
//                     }}
//                   >
//                     <td>{vendor.name}</td>
//                     <td>{vendor.category}</td>
//                     <td>{vendor.city}</td>

//                     <td>
//                       <Badge
//                         bg={vendor.status === "Live" ? "success" : "warning"}
//                       >
//                         {vendor.status}
//                       </Badge>
//                     </td>
//                     <td>
//                       <FaStar className="text-warning" /> {vendor.rating}
//                     </td>
//                     <td>
//                       <Button
//                         variant="outline-primary"
//                         size="sm"
//                         href={`tel:${vendor.phone}`}
//                       >
//                         <FaPhone />
//                       </Button>
//                       <Button
//                         variant="outline-secondary"
//                         size="sm"
//                         className="ms-2"
//                         onClick={(ev) => {
//                           ev.stopPropagation(); // prevent row click navigation
//                           openEditVendorModal(vendor);
//                         }}
//                       >
//                         <FaCog />
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//             {/* Pagination header */}
//             <div className="d-flex justify-content-between align-items-center mb-2">
//               <small className="text-muted">
//                 Showing{" "}
//                 <strong>
//                   {(safePage - 1) * PAGE_SIZE + 1}–
//                   {Math.min(safePage * PAGE_SIZE, serverPagination.total)}
//                 </strong>{" "}
//                 of <strong>{serverPagination.total}</strong>
//               </small>

//               <Pagination className="mb-0">
//                 <Pagination.First
//                   onClick={() => goToPage(1)}
//                   disabled={safePage === 1}
//                 />
//                 <Pagination.Prev
//                   onClick={() => goToPage(safePage - 1)}
//                   disabled={safePage === 1}
//                 />
//                 {
//                   // Build a compact window of page numbers
//                   Array.from({ length: totalPages })
//                     .slice(
//                       Math.max(0, safePage - 3),
//                       Math.min(totalPages, safePage + 2)
//                     )
//                     .map((_, i, arr) => {
//                       const pageNum = Math.max(1, safePage - 2) + i;
//                       return (
//                         <Pagination.Item
//                           key={pageNum}
//                           active={pageNum === safePage}
//                           onClick={() => goToPage(pageNum)}
//                         >
//                           {pageNum}
//                         </Pagination.Item>
//                       );
//                     })
//                 }
//                 <Pagination.Next
//                   onClick={() => goToPage(safePage + 1)}
//                   disabled={safePage === totalPages}
//                 />
//                 <Pagination.Last
//                   onClick={() => goToPage(totalPages)}
//                   disabled={safePage === totalPages}
//                 />
//               </Pagination>
//             </div>
//           </>
//         ) : (
//           <div className="vendor-details">
//             <Button
//               variant="white"
//               className="mb-3"
//               onClick={() => setSelectedVendor(null)}
//               style={{ fontSize: "14px", borderColor: "black" }}
//             >
//               <FaArrowLeft /> Back to List
//             </Button>
//             {console.log("selectedVendor", selectedVendor)}
//             {/* ===== Location + Actions Bar ===== */}
//             <Card
//               className="mb-3 shadow-sm"
//               style={{
//                 borderRadius: 14,
//                 border: "1px solid #eee",
//                 background: "#fff",
//               }}
//             >
//               <Card.Body className="py-3">
//                 <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
//                   {/* Left: Location */}
//                   <div style={{ minWidth: 0 }}>
//                     <div className="d-flex align-items-center gap-2 mb-1">
//                       <FaMapMarkerAlt />
//                       <span className="fw-semibold" style={{ fontSize: 14 }}>
//                         Location Coordinates
//                       </span>
//                       <Badge bg="light" text="dark" style={{ fontSize: 11 }}>
//                         Geo
//                       </Badge>
//                     </div>

//                     <div className="d-flex flex-wrap gap-2">
//                       <div
//                         style={{
//                           padding: "8px 12px",
//                           borderRadius: 10,
//                           background: "#f8f9fa",
//                           border: "1px solid #eee",
//                           fontSize: 12,
//                         }}
//                       >
//                         <span className="text-muted me-1">Lat:</span>
//                         <span className="fw-semibold">
//                           {selectedVendor?.lat
//                             ? Number(selectedVendor.lat)
//                             : "N/A"}
//                         </span>
//                       </div>

//                       <div
//                         style={{
//                           padding: "8px 12px",
//                           borderRadius: 10,
//                           background: "#f8f9fa",
//                           border: "1px solid #eee",
//                           fontSize: 12,
//                         }}
//                       >
//                         <span className="text-muted me-1">Lng:</span>
//                         <span className="fw-semibold">
//                           {selectedVendor?.long
//                             ? Number(selectedVendor.long)
//                             : "N/A"}
//                         </span>
//                       </div>
//                     </div>

//                     <div className="text-muted mt-2" style={{ fontSize: 12 }}>
//                       Tip: Coordinates are auto-filled from the map picker.
//                     </div>
//                   </div>

//                   {/* Right: Actions */}
//                   <div className="d-flex align-items-center gap-2 ms-md-auto">
//                     <Button
//                       variant="outline-dark"
//                       onClick={() => openEditVendorModal(selectedVendor)}
//                       style={{
//                         fontSize: 12,
//                         borderRadius: 10,
//                         padding: "8px 12px",
//                         borderColor: "black",
//                       }}
//                     >
//                       <FaCog className="me-2" />
//                       Edit Vendor
//                     </Button>

//                     <Button
//                       variant="dark"
//                       onClick={() => {
//                         if (!selectedVendor?.lat || !selectedVendor?.long) {
//                           return alert("Coordinates missing.");
//                         }
//                         window.open(
//                           `https://www.google.com/maps?q=${selectedVendor.lat},${selectedVendor.long}`,
//                           "_blank"
//                         );
//                       }}
//                       style={{
//                         fontSize: 12,
//                         borderRadius: 10,
//                         padding: "8px 12px",
//                       }}
//                     >
//                       <FaMapMarkerAlt className="me-2" />
//                       Open in Maps
//                     </Button>
//                   </div>
//                 </div>
//               </Card.Body>
//             </Card>

//             <Card className="shadow-sm p-4 rounded">
//               <div className="d-flex justify-content-between align-items-center mb-3">
//                 <h4 className="fw-bold" style={{ fontSize: "16px" }}>
//                   {selectedVendor.name}
//                 </h4>
//                 <Badge
//                   bg={selectedVendor.status === "Live" ? "success" : "warning"}
//                   className="px-3 py-2"
//                 >
//                   {selectedVendor.status}
//                 </Badge>
//               </div>
//               <Row className="mb-3">
//                 <Col md={4} className="text-center">
//                   <Image
//                     src={selectedVendor.profileImage}
//                     roundedCircle
//                     width={120}
//                     height={120}
//                     className="border p-1"
//                     alt="Vendor Profile"
//                   />
//                   <p className="mt-2 text-muted" style={{ fontSize: "12px" }}>
//                     {selectedVendor.category}
//                   </p>
//                 </Col>
//                 <Col md={8}>
//                   <Table borderless>
//                     <tbody style={{ fontSize: "12px" }}>
//                       <tr>
//                         <td>
//                           <strong>City:</strong>
//                         </td>
//                         <td>{selectedVendor.city}</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <strong>Service Area:</strong>
//                         </td>
//                         <td>{selectedVendor.serviceArea}</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <strong>Working Since:</strong>
//                         </td>
//                         <td>
//                           {selectedVendor.workingSince} (
//                           {new Date().getFullYear() -
//                             selectedVendor.workingSince}{" "}
//                           years)
//                         </td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <strong>Capacity:</strong>
//                         </td>
//                         <td>{selectedVendor.capacity} jobs at a time</td>
//                       </tr>
//                       <tr>
//                         <td>
//                           <strong>Date of Birth:</strong>
//                         </td>
//                         <td>{selectedVendor.dob}</td>
//                       </tr>
//                     </tbody>
//                   </Table>
//                 </Col>
//               </Row>
//               <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
//                 <div>
//                   <Button
//                     variant="outline-black"
//                     size="sm"
//                     href={`tel:${selectedVendor.phone}`}
//                     className="me-2"
//                     style={{ cursor: "pointer", borderColor: "black" }}
//                   >
//                     <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
//                       <FaPhone className="me-1" />
//                       {selectedVendor.phone}
//                     </p>
//                   </Button>
//                 </div>
//                 <div>
//                   <p className="mb-0">
//                     <strong>Rating:</strong> <FaStar className="text-warning" />{" "}
//                     {selectedVendor.rating}
//                   </p>
//                 </div>
//               </div>
//               <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
//                 Financial Details
//               </h5>
//               <Table bordered className="bg-light" style={{ fontSize: "12px" }}>
//                 <tbody>
//                   <tr>
//                     <td>
//                       <strong>Aadhar No.</strong>
//                     </td>
//                     <td>{selectedVendor.aadhar}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>PAN No.</strong>
//                     </td>
//                     <td>{selectedVendor.pan}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Bank Name:</strong>
//                     </td>
//                     <td>{selectedVendor.bank}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>IFSC Code:</strong>
//                     </td>
//                     <td>{selectedVendor.ifsc}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Account No.:</strong>
//                     </td>
//                     <td>{selectedVendor.account}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>GST:</strong>
//                     </td>
//                     <td>{selectedVendor.gst}</td>
//                   </tr>
//                 </tbody>
//               </Table>
//               <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
//                 Coins Wallet
//               </h5>
//               <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
//                 <p className="mb-0" style={{ fontSize: "14px" }}>
//                   <strong>Coins Balance:</strong> {coinsBalance} coins
//                 </p>
//                 <div className="d-flex align-items-center gap-2">
//                   <Form.Control
//                     type="number"
//                     min={1}
//                     step={1}
//                     value={coinDelta}
//                     onChange={(e) => setCoinDelta(e.target.value)}
//                     style={{ width: 120, fontSize: "12px" }}
//                     placeholder="Coins"
//                   />
//                   <Button
//                     variant="outline-dark"
//                     size="sm"
//                     onClick={handleAddCoinsAPI}
//                     className="me-2"
//                     style={{ borderColor: "black" }}
//                   >
//                     Add Coins
//                   </Button>
//                   <Button
//                     variant="outline-danger"
//                     size="sm"
//                     onClick={handleReduceCoinsAPI}
//                   >
//                     Reduce Coins
//                   </Button>
//                 </div>
//               </div>

//               <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
//                 Vendor Documents
//               </h5>

//               <Row className="g-3">
//                 {[
//                   {
//                     label: "Aadhaar Front",
//                     url: selectedVendor?.docs?.aadhaarFront,
//                   },
//                   {
//                     label: "Aadhaar Back",
//                     url: selectedVendor?.docs?.aadhaarBack,
//                   },
//                   {
//                     label: "Aadhaar (Single)",
//                     url: selectedVendor?.docs?.aadhaarSingle,
//                   },
//                   { label: "PAN", url: selectedVendor?.docs?.pan },
//                   {
//                     label: "Other / Police Verification",
//                     url: selectedVendor?.docs?.other,
//                   },
//                 ]
//                   .filter((d) => d.url) // ✅ show only uploaded
//                   .map((doc) => (
//                     <Col md={4} key={doc.label}>
//                       <Card className="shadow-sm" style={{ borderRadius: 12 }}>
//                         <Card.Body>
//                           <div
//                             className="fw-semibold mb-2"
//                             style={{ fontSize: 12 }}
//                           >
//                             {doc.label}
//                           </div>

//                           <Image
//                             src={doc.url}
//                             alt={doc.label}
//                             thumbnail
//                             style={{
//                               width: "100%",
//                               height: 160,
//                               objectFit: "cover",
//                               cursor: "pointer",
//                             }}
//                             onClick={() => window.open(doc.url, "_blank")}
//                           />

//                           <div
//                             className="text-muted mt-2"
//                             style={{ fontSize: 11 }}
//                           >
//                             Click to view
//                           </div>
//                         </Card.Body>
//                       </Card>
//                     </Col>
//                   ))}

//                 {/* ✅ If nothing uploaded */}
//                 {(!selectedVendor?.docs ||
//                   (!selectedVendor?.docs?.aadhaarFront &&
//                     !selectedVendor?.docs?.aadhaarBack &&
//                     !selectedVendor?.docs?.aadhaarSingle &&
//                     !selectedVendor?.docs?.pan &&
//                     !selectedVendor?.docs?.other)) && (
//                   <Col>
//                     <div className="text-muted" style={{ fontSize: 12 }}>
//                       No vendor documents uploaded.
//                     </div>
//                   </Col>
//                 )}
//               </Row>

//               <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
//                 Manage Team
//               </h5>

//               <Card className="team-card mt-2">
//                 <div className="team-card-header">
//                   <div style={{ fontWeight: 700, fontSize: 13 }}>
//                     Team Members
//                   </div>

//                   <Button
//                     variant="light"
//                     size="sm"
//                     onClick={() => setShowAddMemberModal(true)}
//                     style={{ borderRadius: 10, fontWeight: 700 }}
//                   >
//                     <FaUserPlus className="me-1" /> Add Member
//                   </Button>
//                 </div>

//                 {(selectedVendor?.team?.length ?? 0) === 0 ? (
//                   <div className="p-3 text-muted" style={{ fontSize: 12 }}>
//                     No team members yet.
//                   </div>
//                 ) : (
//                   (selectedVendor.team || []).map((m) => {
//                     const initials =
//                       (m?.name || "NA")
//                         .split(" ")
//                         .slice(0, 1)
//                         .map((x) => x[0]?.toUpperCase())
//                         .join("") || "NA";

//                     const leaves = m?.markedLeaves || [];
//                     const showLeaves = leaves.slice(0, 2);

//                     return (
//                       <div className="team-row" key={m._id}>
//                         {/* Name */}
//                         <div className="team-name">
//                           <div className="avatar">{initials}</div>

//                           <div className="name-text">
//                             <div
//                               className="primary"
//                               onClick={() => {
//                                 setSelectedTeamMember(m);
//                                 setShowMemberDetailsModal(true);
//                               }}
//                               title={m.name}
//                             >
//                               {m.name}
//                             </div>
//                             <div className="secondary">
//                               {m.mobileNumber || "-"}
//                             </div>
//                           </div>
//                         </div>

//                         {/* Leaves */}
//                         <div>
//                           {leaves.length === 0 ? (
//                             <span
//                               className="text-muted"
//                               style={{ fontSize: 12 }}
//                             >
//                               No leaves
//                             </span>
//                           ) : (
//                             <>
//                               {showLeaves.map((d) => (
//                                 <span className="leave-chip" key={d}>
//                                   <FaCalendarAlt />
//                                   {normalizeLeave(d)}
//                                 </span>
//                               ))}
//                               {leaves.length > 2 && (
//                                 <span className="leave-chip">
//                                   +{leaves.length - 2} more
//                                 </span>
//                               )}

//                               <Button
//                                 variant="outline-dark"
//                                 size="sm"
//                                 className="ms-1"
//                                 onClick={() => {
//                                   setSelectedTeamMember(m);
//                                   setShowMemberLeavesModal(true);
//                                 }}
//                                 style={{ borderRadius: 10 }}
//                               >
//                                 View
//                               </Button>
//                             </>
//                           )}
//                         </div>

//                         {/* Actions */}
//                         <div className="actions-wrap">
//                           <Button
//                             variant="outline-secondary"
//                             size="sm"
//                             onClick={() => openEditMemberModal(m)}
//                             style={{ borderRadius: 10 }}
//                           >
//                             Edit
//                           </Button>

//                           <Button
//                             variant="outline-danger"
//                             size="sm"
//                             onClick={() => {
//                               try {
//                                 const ok = window.confirm(
//                                   `Are you sure you want to remove ${
//                                     m?.name || "this member"
//                                   }?`
//                                 );
//                                 if (!ok) return;

//                                 removeTeamMemberAPI(m._id);
//                               } catch (err) {
//                                 console.error("remove confirm error:", err);
//                               }
//                             }}
//                             style={{ borderRadius: 10 }}
//                           >
//                             Remove
//                           </Button>

//                           <Button
//                             variant="outline-dark"
//                             size="sm"
//                             onClick={() => {
//                               setSelectedTeamMember(m);
//                               setShowMemberDocsModal(true);
//                             }}
//                             style={{ borderRadius: 10 }}
//                           >
//                             View Docs
//                           </Button>
//                         </div>
//                       </div>
//                     );
//                   })
//                 )}
//               </Card>

//               {/* ================= Vendor Ratings ================= */}
//               <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
//                 Vendor Ratings
//               </h5>

//               <Card
//                 className="mt-2 shadow-sm"
//                 style={{ borderRadius: 14, border: "1px solid #eee" }}
//               >
//                 <Card.Body>
//                   <div className="d-flex justify-content-between align-items-center mb-2">
//                     <div style={{ fontWeight: 800, fontSize: 13 }}>
//                       Latest Feedback (Max 50)
//                     </div>
//                     {/*
//                     <Button
//                       size="sm"
//                       variant="outline-dark"
//                       onClick={() => {
//                         try {
//                           if (!selectedVendor?.id) return;
//                           fetchVendorRatings(selectedVendor.id);
//                         } catch (e) {
//                           console.error("refresh ratings error:", e);
//                         }
//                       }}
//                       style={{ borderRadius: 10 }}
//                     >
//                       Refresh
//                     </Button> */}
//                   </div>

//                   {ratingsLoading ? (
//                     <div className="text-muted" style={{ fontSize: 12 }}>
//                       Loading ratings...
//                     </div>
//                   ) : ratingsError ? (
//                     <div className="text-danger" style={{ fontSize: 12 }}>
//                       {ratingsError}
//                     </div>
//                   ) : vendorRatings.length === 0 ? (
//                     <div className="text-muted" style={{ fontSize: 12 }}>
//                       No ratings found for this vendor.
//                     </div>
//                   ) : (
//                     <Table
//                       bordered
//                       hover
//                       responsive
//                       className="mb-0"
//                       style={{ fontSize: 12 }}
//                     >
//                       <thead className="table-light">
//                         <tr>
//                           <th style={{ width: 180 }}>Customer</th>
//                           <th style={{ width: 90 }}>Rating</th>
//                           <th>Feedback</th>
//                           <th style={{ width: 170 }}>Booking ID</th>
//                           <th style={{ width: 140 }}>Service</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {vendorRatings.map((r) => (
//                           <tr key={r?._id}>
//                             <td className="fw-semibold">
//                               {r?.customerName || "-"}
//                             </td>

//                             <td>
//                               <FaStar className="text-warning" />{" "}
//                               {Number(r?.rating || 0)}
//                             </td>

//                             <td>{r?.feedback?.trim?.() ? r.feedback : "-"}</td>

//                             <td style={{ fontFamily: "monospace" }}>
//                               {r?.bookingId || "-"}
//                             </td>

//                             <td>{prettyServiceType(r?.serviceType)}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </Table>
//                   )}
//                 </Card.Body>
//               </Card>

//               {/* <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
//                 Mark Leaves
//               </h5>
//               <Card className="p-3 bg-light">
//                 <Calendar onChange={setLeaveDates} value={leaveDates} />
//               </Card>
//               <div className="mt-4 text-muted text-end">
//                 <FaCalendarAlt className="me-2" />
//                 <span>Last Login: {selectedVendor.lastLogin}</span>
//               </div> */}
//             </Card>
//           </div>
//         )}

//         <Modal
//           show={showAddVendorModal}
//           onHide={() => {
//             setShowAddVendorModal(false);
//             setIsEditingVendor(false);
//             setEditingVendorId(null);
//           }}
//           size="lg"
//         >
//           <Modal.Header closeButton>
//             <Modal.Title style={{ fontSize: "16px" }}>
//               {isEditingVendor ? "Edit Vendor" : "Add New Vendor"}
//             </Modal.Title>
//           </Modal.Header>
//           <Modal.Body>
//             <Form
//               onSubmit={isEditingVendor ? handleUpdateVendor : handleSubmit}
//             >
//               <h5 className="mb-3">Basic Information</h5>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Name</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="vendorName"
//                       value={formData.vendorName}
//                       onChange={handleInputChange}
//                       placeholder="Enter Name"
//                       required
//                     />
//                     {errors.vendorName && (
//                       <Form.Text className="text-danger">
//                         {errors.vendorName}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Phone Number</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="mobileNumber"
//                       value={formData.mobileNumber}
//                       onChange={handleInputChange}
//                       placeholder="Enter Phone Number"
//                       required
//                     />
//                     {errors.mobileNumber && (
//                       <Form.Text className="text-danger">
//                         {errors.mobileNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Profile Photo</Form.Label>
//                     <Form.Control
//                       type="file"
//                       name="profileImage"
//                       onChange={handleFileChange}
//                     />
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Date of Birth</Form.Label>
//                     <Form.Control
//                       type="date"
//                       name="dateOfBirth"
//                       value={formData.dateOfBirth}
//                       onChange={handleInputChange}
//                       required
//                     />
//                     {errors.dateOfBirth && (
//                       <Form.Text className="text-danger">
//                         {errors.dateOfBirth}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Working Since (Year)</Form.Label>
//                     <Form.Control
//                       type="number"
//                       name="yearOfWorking"
//                       value={formData.yearOfWorking}
//                       onChange={handleInputChange}
//                       placeholder="Enter Year"
//                       required
//                     />
//                     {errors.yearOfWorking && (
//                       <Form.Text className="text-danger">
//                         {errors.yearOfWorking}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>City</Form.Label>
//                     <Form.Select
//                       name="city"
//                       value={formData.city}
//                       onChange={handleInputChange}
//                       required
//                     >
//                       <option>Select City</option>
//                       <option>Bengaluru</option>
//                       <option>Pune</option>
//                     </Form.Select>
//                     {errors.city && (
//                       <Form.Text className="text-danger">
//                         {errors.city}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Service Type</Form.Label>
//                     <Form.Select
//                       name="serviceType"
//                       value={formData.serviceType}
//                       onChange={handleInputChange}
//                       required
//                     >
//                       <option>Select Service</option>
//                       {/* {services
//                         .filter((s) => s !== "All Services")
//                         .map((s) => (
//                           <option key={s} value={s}>
//                             {s}
//                           </option>
//                         ))} */}
//                       <option>House Painting</option>
//                       <option>Deep Cleaning</option>
//                     </Form.Select>
//                     {errors.serviceType && (
//                       <Form.Text className="text-danger">
//                         {errors.serviceType}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Capacity (Jobs at a time)</Form.Label>
//                     <Form.Control
//                       type="number"
//                       name="capacity"
//                       value={formData.capacity}
//                       onChange={handleInputChange}
//                       placeholder="Enter Capacity"
//                       required
//                     />
//                     {errors.capacity && (
//                       <Form.Text className="text-danger">
//                         {errors.capacity}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Service Area</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="serviceArea"
//                       value={formData.serviceArea}
//                       readOnly
//                       placeholder="Auto-filled from location"
//                     />

//                     {errors.serviceArea && (
//                       <Form.Text className="text-danger">
//                         {errors.serviceArea}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <h5 className="mt-4 mb-3">Address Details</h5>
//               <Row className="align-items-end">
//                 <Col md={8}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Location</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="location"
//                       value={formData.location}
//                       placeholder="Click to pick on map"
//                       readOnly
//                       onClick={() => setShowAddressPicker(true)}
//                     />
//                     {errors.location && (
//                       <Form.Text className="text-danger">
//                         {errors.location}
//                       </Form.Text>
//                     )}
//                     <Form.Text className="text-muted">
//                       <FaMapMarkerAlt className="me-1" />
//                       Uses Google Maps (autocomplete + draggable pin)
//                     </Form.Text>
//                   </Form.Group>
//                 </Col>
//               </Row>
//               {geocodingError && (
//                 <div className="text-danger mb-3">{geocodingError}</div>
//               )}
//               <h5 className="mt-4 mb-3">Identity Verification</h5>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Aadhar Card Number</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="aadhaarNumber"
//                       value={formData.aadhaarNumber}
//                       onChange={handleInputChange}
//                       placeholder="Enter Aadhar No."
//                       maxLength={12}
//                       required
//                     />
//                     {errors.aadhaarNumber && (
//                       <Form.Text className="text-danger">
//                         {errors.aadhaarNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Upload Aadhar (Front Image)</Form.Label>
//                     <Form.Control
//                       type="file"
//                       name="aadhaarfrontImage"
//                       onChange={handleFileChange}
//                     />
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>PAN Card Number</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="panNumber"
//                       value={formData.panNumber}
//                       onChange={handleInputChange}
//                       placeholder="Enter PAN No."
//                       required
//                     />
//                     {errors.panNumber && (
//                       <Form.Text className="text-danger">
//                         {errors.panNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Upload PAN Card</Form.Label>
//                     <Form.Control
//                       type="file"
//                       name="panImage"
//                       onChange={handleFileChange}
//                     />
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Form.Group className="mb-3">
//                 <Form.Label>Upload Aadhar (Back Image)</Form.Label>
//                 <Form.Control
//                   type="file"
//                   name="aadhaarbackImage"
//                   onChange={handleFileChange}
//                 />
//               </Form.Group>
//               <Form.Group className="mb-3">
//                 <Form.Label>Others / Police Verification</Form.Label>
//                 <Form.Control
//                   type="file"
//                   name="otherPolicy"
//                   onChange={handleFileChange}
//                 />
//               </Form.Group>

//               <h5 className="mt-4 mb-3">Financial Details</h5>

//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Bank Account Number</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="accountNumber"
//                       value={formData.accountNumber}
//                       onChange={handleInputChange}
//                       placeholder="Enter Bank Account No."
//                       required
//                     />
//                     {errors.accountNumber && (
//                       <Form.Text className="text-danger">
//                         {errors.accountNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>IFSC Code</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="ifscCode"
//                       value={formData.ifscCode}
//                       onChange={handleInputChange}
//                       placeholder="Enter IFSC Code"
//                       required
//                     />
//                     {errors.ifscCode && (
//                       <Form.Text className="text-danger">
//                         {errors.ifscCode}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Bank Name</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="bankName"
//                       value={formData.bankName}
//                       onChange={handleInputChange}
//                       placeholder="Enter Bank Name"
//                       required
//                     />
//                     {errors.bankName && (
//                       <Form.Text className="text-danger">
//                         {errors.bankName}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Name in Bank</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="holderName"
//                       value={formData.holderName}
//                       onChange={handleInputChange}
//                       placeholder="Enter Name as per Bank"
//                       required
//                     />
//                     {errors.holderName && (
//                       <Form.Text className="text-danger">
//                         {errors.holderName}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Account Type</Form.Label>
//                     <Form.Select
//                       name="accountType"
//                       value={formData.accountType}
//                       onChange={handleInputChange}
//                       required
//                     >
//                       <option>Select Account Type</option>
//                       <option>Savings</option>
//                       <option>Current</option>
//                     </Form.Select>
//                     {errors.accountType && (
//                       <Form.Text className="text-danger">
//                         {errors.accountType}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>GST</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="gstNumber"
//                       value={formData.gstNumber}
//                       onChange={handleInputChange}
//                       placeholder="Enter GST No."
//                     />
//                     {errors.gstNumber && (
//                       <Form.Text className="text-danger">
//                         {errors.gstNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Modal.Footer>
//                 <Button variant="primary" type="submit">
//                   {isEditingVendor ? "Update Vendor" : "Save Vendor"}
//                 </Button>
//                 <Button
//                   variant="secondary"
//                   onClick={() => setShowAddVendorModal(false)}
//                 >
//                   Cancel
//                 </Button>
//               </Modal.Footer>
//             </Form>
//           </Modal.Body>
//         </Modal>

//         <Modal
//           show={showAddMemberModal}
//           onHide={() => {
//             setShowAddMemberModal(false);
//             setIsEditingMember(false);
//             setEditingMemberId(null);
//           }}
//           size="lg"
//         >
//           <Modal.Header closeButton>
//             <Modal.Title style={{ fontSize: "16px" }}>
//               {isEditingMember ? "Edit Team Member" : "Add Team Member"}
//             </Modal.Title>
//           </Modal.Header>
//           <Modal.Body>
//             <Form
//               onSubmit={
//                 isEditingMember ? handleMemberUpdate : handleMemberSubmit
//               }
//             >
//               <h5 className="mb-3">Basic Information</h5>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Name</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="name"
//                       value={memberFormData.name}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter Name"
//                       required
//                     />
//                     {memberErrors.name && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.name}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Phone Number</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="mobileNumber"
//                       value={memberFormData.mobileNumber}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter Phone Number"
//                       required
//                     />
//                     {memberErrors.mobileNumber && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.mobileNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Upload Aadhaar (Front)</Form.Label>
//                     <Form.Control
//                       type="file"
//                       name="aadhaarfrontImage"
//                       onChange={handleMemberFileChange}
//                     />
//                   </Form.Group>

//                   <Form.Group className="mb-3">
//                     <Form.Label>Upload Aadhaar (Back)</Form.Label>
//                     <Form.Control
//                       type="file"
//                       name="aadhaarbackImage"
//                       onChange={handleMemberFileChange}
//                     />
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Date of Birth</Form.Label>
//                     <Form.Control
//                       type="date"
//                       name="dateOfBirth"
//                       value={memberFormData.dateOfBirth}
//                       onChange={handleMemberInputChange}
//                       required
//                     />
//                     {memberErrors.dateOfBirth && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.dateOfBirth}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>City</Form.Label>
//                     <Form.Select
//                       name="city"
//                       value={memberFormData.city}
//                       onChange={handleMemberInputChange}
//                       required
//                     >
//                       <option>Select City</option>
//                       {/* {cities
//                         .filter((c) => c !== "All Cities")
//                         .map((c) => (
//                           <option key={c} value={c}>
//                             {c}
//                           </option>
//                         ))} */}
//                       <option>Bengaluru</option>
//                       <option>Pune</option>
//                     </Form.Select>
//                     {memberErrors.city && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.city}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Service Type</Form.Label>
//                     <Form.Select
//                       name="serviceType"
//                       value={memberFormData.serviceType}
//                       onChange={handleMemberInputChange}
//                       required
//                     >
//                       <option>Select Service</option>
//                       <option>House Painting</option>
//                       <option>Deep Cleaning</option>
//                     </Form.Select>
//                     {memberErrors.serviceType && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.serviceType}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Service Area</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="serviceArea"
//                       value={memberFormData.serviceArea}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter Service Area"
//                       required
//                     />
//                     {memberErrors.serviceArea && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.serviceArea}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <h5 className="mt-4 mb-3">Address Details</h5>
//               <Row className="align-items-end">
//                 <Col md={8}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Location</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="location"
//                       value={memberFormData.location}
//                       placeholder="Click to pick on map"
//                       readOnly
//                       onClick={() => setShowMemberAddressPicker(true)}
//                     />
//                     <Form.Text className="text-muted">
//                       <FaMapMarkerAlt className="me-1" />
//                       Uses Google Maps (autocomplete + draggable pin)
//                     </Form.Text>
//                     {memberErrors.location && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.location}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <h5 className="mt-4 mb-3">Identity Verification</h5>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Aadhar Card Number</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="aadhaarNumber"
//                       value={memberFormData.aadhaarNumber}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter Aadhar No."
//                       required
//                     />
//                     {memberErrors.aadhaarNumber && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.aadhaarNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>

//                   <Form.Group className="mb-3">
//                     <Form.Label>Upload Aadhaar (Front Image)</Form.Label>
//                     <Form.Control
//                       type="file"
//                       name="aadhaarfrontImage"
//                       onChange={handleMemberFileChange}
//                     />
//                   </Form.Group>

//                   <Form.Group className="mb-3">
//                     <Form.Label>Upload Aadhaar (Back Image)</Form.Label>
//                     <Form.Control
//                       type="file"
//                       name="aadhaarbackImage"
//                       onChange={handleMemberFileChange}
//                     />
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>PAN Card Number</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="panNumber"
//                       value={memberFormData.panNumber}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter PAN No."
//                       required
//                     />
//                     {memberErrors.panNumber && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.panNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Upload PAN Card</Form.Label>
//                     <Form.Control
//                       type="file"
//                       name="panImage"
//                       onChange={handleMemberFileChange}
//                     />
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Form.Group className="mb-3">
//                 <Form.Label>Others / Police Verification</Form.Label>
//                 <Form.Control
//                   type="file"
//                   name="otherPolicy"
//                   onChange={handleMemberFileChange}
//                 />
//               </Form.Group>
//               <h5 className="mt-4 mb-3">Financial Details</h5>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Bank Account Number</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="accountNumber"
//                       value={memberFormData.accountNumber}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter Bank Account No."
//                       required
//                     />
//                     {memberErrors.accountNumber && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.accountNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>IFSC Code</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="ifscCode"
//                       value={memberFormData.ifscCode}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter IFSC Code"
//                       required
//                     />
//                     {memberErrors.ifscCode && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.ifscCode}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Bank Name</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="bankName"
//                       value={memberFormData.bankName}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter Bank Name"
//                       required
//                     />
//                     {memberErrors.bankName && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.bankName}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Name in Bank</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="holderName"
//                       value={memberFormData.holderName}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter Name as per Bank"
//                       required
//                     />
//                     {memberErrors.holderName && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.holderName}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Row>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Account Type</Form.Label>
//                     <Form.Select
//                       name="accountType"
//                       value={memberFormData.accountType}
//                       onChange={handleMemberInputChange}
//                       required
//                     >
//                       <option>Select Account Type</option>
//                       <option>Savings</option>
//                       <option>Current</option>
//                     </Form.Select>
//                     {memberErrors.accountType && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.accountType}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//                 <Col md={6}>
//                   <Form.Group className="mb-3">
//                     <Form.Label>GST</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="gstNumber"
//                       value={memberFormData.gstNumber}
//                       onChange={handleMemberInputChange}
//                       placeholder="Enter GST No."
//                     />
//                     {memberErrors.gstNumber && (
//                       <Form.Text className="text-danger">
//                         {memberErrors.gstNumber}
//                       </Form.Text>
//                     )}
//                   </Form.Group>
//                 </Col>
//               </Row>
//               <Modal.Footer>
//                 <Button variant="primary" type="submit">
//                   {isEditingMember ? "Update Member" : "Add Member"}
//                 </Button>
//                 <Button
//                   variant="secondary"
//                   onClick={() => setShowAddMemberModal(false)}
//                 >
//                   Cancel
//                 </Button>
//               </Modal.Footer>
//             </Form>
//           </Modal.Body>
//         </Modal>

//         <Modal
//           show={showMemberDetailsModal}
//           onHide={() => setShowMemberDetailsModal(false)}
//           size="lg"
//         >
//           <Modal.Header closeButton>
//             <Modal.Title style={{ fontSize: "16px" }}>
//               Team Member Details
//             </Modal.Title>
//           </Modal.Header>
//           <Modal.Body>
//             {selectedTeamMember ? (
//               <Table bordered size="sm" style={{ fontSize: "13px" }}>
//                 <tbody>
//                   <tr>
//                     <td>
//                       <strong>Name</strong>
//                     </td>
//                     <td>{selectedTeamMember.name}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Mobile</strong>
//                     </td>
//                     <td>{selectedTeamMember.mobileNumber}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Date of Birth</strong>
//                     </td>
//                     <td>{selectedTeamMember.dateOfBirth}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>City</strong>
//                     </td>
//                     <td>{selectedTeamMember.city}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Service Type</strong>
//                     </td>
//                     <td>{selectedTeamMember.serviceType}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Service Area</strong>
//                     </td>
//                     <td>{selectedTeamMember.serviceArea}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Aadhar Number</strong>
//                     </td>
//                     <td>{selectedTeamMember.aadhaarNumber}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>PAN Number</strong>
//                     </td>
//                     <td>{selectedTeamMember.panNumber}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Bank Name</strong>
//                     </td>
//                     <td>{selectedTeamMember.bankName}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Account Number</strong>
//                     </td>
//                     <td>{selectedTeamMember.accountNumber}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>IFSC Code</strong>
//                     </td>
//                     <td>{selectedTeamMember.ifscCode}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>GST Number</strong>
//                     </td>
//                     <td>{selectedTeamMember.gstNumber || "NA"}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <strong>Address</strong>
//                     </td>
//                     <td>
//                       {selectedTeamMember.location} <br />
//                     </td>
//                   </tr>
//                 </tbody>
//               </Table>
//             ) : (
//               <p>No details available.</p>
//             )}

//             {selectedTeamMember && (
//               <div className="mt-3">
//                 <h6 className="fw-semibold" style={{ fontSize: 13 }}>
//                   Marked Leaves (Read-only)
//                 </h6>

//                 {selectedTeamMember.markedLeaves?.length ? (
//                   <ReadOnlyLeavesCalendar
//                     markedLeaves={selectedTeamMember.markedLeaves}
//                   />
//                 ) : (
//                   <div className="text-muted" style={{ fontSize: 12 }}>
//                     No leaves marked for this member.
//                   </div>
//                 )}
//               </div>
//             )}
//           </Modal.Body>
//         </Modal>

//         <AddressPickerModal
//           show={showAddressPicker}
//           onHide={() => setShowAddressPicker(false)}
//           initialAddress={formData.location}
//           initialLatLng={
//             formData.latitude &&
//             formData.longitude &&
//             !isNaN(formData.latitude) &&
//             !isNaN(formData.longitude)
//               ? {
//                   lat: parseFloat(formData.latitude),
//                   lng: parseFloat(formData.longitude),
//                 }
//               : null
//           }
//           onSelect={(sel) =>
//             setFormData((prev) => ({
//               ...prev,
//               location: sel.formattedAddress,
//               serviceArea: sel.formattedAddress, // ✅ ADD THIS LINE
//               latitude: String(sel.lat),
//               longitude: String(sel.lng),
//             }))
//           }
//         />

//         <AddressPickerModal
//           show={showMemberAddressPicker}
//           onHide={() => setShowMemberAddressPicker(false)}
//           initialAddress={memberFormData.location}
//           initialLatLng={
//             memberFormData.latitude &&
//             memberFormData.longitude &&
//             !isNaN(memberFormData.latitude) &&
//             !isNaN(memberFormData.longitude)
//               ? {
//                   lat: parseFloat(memberFormData.latitude),
//                   lng: parseFloat(memberFormData.longitude),
//                 }
//               : null
//           }
//           onSelect={(sel) =>
//             setMemberFormData((prev) => ({
//               ...prev,
//               location: sel.formattedAddress,
//               serviceArea: sel.formattedAddress, // ✅ auto-fill
//               latitude: String(sel.lat),
//               longitude: String(sel.lng),
//             }))
//           }
//         />

//         <TeamMemberDocsModal
//           show={showMemberDocsModal}
//           onHide={() => setShowMemberDocsModal(false)}
//           member={selectedTeamMember}
//         />
//         <TeamMemberLeavesModal
//           show={showMemberLeavesModal}
//           onHide={() => setShowMemberLeavesModal(false)}
//           member={selectedTeamMember}
//         />
//       </Container>
//     </>
//   );
// };

// export default VendorsDashboard;
