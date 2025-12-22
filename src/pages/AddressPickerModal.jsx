import React, { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { BASE_URL } from "../utils/config";

// Utility to load Google Maps API
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
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

const AddressPickerModal = ({
  initialLatLng,
  initialAddress = "",
  onClose,
  onSelect,
  bookingId,
}) => {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const geocoderRef = useRef(null);
  const markerRef = useRef(null);

  const [addr, setAddr] = useState(initialAddress || "");
  const [houseFlat, setHouseFlat] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latLng, setLatLng] = useState(initialLatLng || null);
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [houseFlatError, setHouseFlatError] = useState("");

  // ✅ ADD THIS HERE (RIGHT AFTER STATE DECLARATIONS)
  useEffect(() => {
    if (initialAddress) {
      setAddr(initialAddress);
    }
  }, [initialAddress]);

  const getMissingFields = () => {
    const missing = [];

    if (!houseFlat.trim()) missing.push("houseFlatNumber");
    if (!addr.trim()) missing.push("streetArea");
    if (!city.trim()) missing.push("city");
    if (!latLng?.lat) missing.push("latitude");
    if (!latLng?.lng) missing.push("longitude");

    if (bookingId) {
      if (!bookingId) missing.push("bookingId");
    }

    return missing;
  };

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
    const cleanupFns = [];
    let map, autocomplete, marker, geocoder;

    const reverseGeocode = (pos, formattedAddrFromPlace = null) => {
      if (!geocoderRef.current) return;

      if (markerRef.current) markerRef.current.setPosition(pos);
      if (mapRef.current) {
        mapRef.current.setCenter(pos);
        mapRef.current.setZoom(17);
      }

      if (formattedAddrFromPlace) {
        setAddr(formattedAddrFromPlace);
      }

      // ✅ Always update latLng state
      setLatLng({ lat: pos.lat, lng: pos.lng });

      geocoderRef.current.geocode({ location: pos }, (results, status) => {
        if (status === "OK" && results?.length) {
          const formattedAddress = results[0].formatted_address;
          const addressComponents = results[0].address_components;

          let detectedCity = "";
          let state = "";
          let country = "";

          for (const comp of addressComponents) {
            const types = comp.types;
            if (types.includes("locality")) detectedCity = comp.long_name;
            else if (
              types.includes("administrative_area_level_2") &&
              !detectedCity
            )
              detectedCity = comp.long_name;
            else if (types.includes("administrative_area_level_1"))
              state = comp.long_name;
            else if (types.includes("country")) country = comp.long_name;
          }

          if (detectedCity)
            detectedCity =
              detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1);

          if (!formattedAddrFromPlace && !addr) {
            setAddr(formattedAddress);
          }

          // Set the city from reverse geocoding
          setCity(detectedCity);
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
      mapRef.current = map;

      marker = new window.google.maps.Marker({
        map,
        position: posToUse,
        draggable: true,
      });
      markerRef.current = marker;

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        { fields: ["formatted_address", "geometry"] }
      );

      const ensureAutocompleteZIndex = () => {
        const containers = document.querySelectorAll(".pac-container");
        containers.forEach((el) => {
          el.style.zIndex = "100000";
        });
      };
      ensureAutocompleteZIndex();

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;
        const pos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        // ✅ Update state first
        setLatLng(pos);

        reverseGeocode(pos, place.formatted_address);
      });

      const observer = new MutationObserver(ensureAutocompleteZIndex);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      map.addListener("click", (e) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setLatLng(pos);
        markerRef.current.setPosition(pos);
        reverseGeocode(pos);
      });

      marker.addListener("dragend", () => {
        const pos = {
          lat: markerRef.current.getPosition().lat(),
          lng: markerRef.current.getPosition().lng(),
        };
        setLatLng(pos);
        reverseGeocode(pos);
      });

      if (!initialAddress) reverseGeocode(posToUse);
      cleanupFns.push(() => observer.disconnect());
    };

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
        () => init(initialLatLng || { lat: 12.9716, lng: 77.5946 })
      );
    } else {
      init(initialLatLng || { lat: 12.9716, lng: 77.5946 });
    }
    return () => {
      cleanupFns.forEach((fn) => {
        try {
          fn();
        } catch (err) {
          console.warn("AddressPicker cleanup error:", err);
        }
      });
    };
  }, [initialLatLng, initialAddress]);

  // Updated onSave function to call API directly
  const onSave = async () => {
    if (!validateHouseFlat(houseFlat) || !latLng) return;

    // -------------------------
    // CASE 1: CREATE LEAD — NO bookingId
    // -------------------------
    if (!bookingId) {
      onSelect({
  houseFlatNumber: houseFlat,
  streetArea: addr,          // ✅ KEY FIX
  landMark: landmark,        // ✅ match casing
  city: city,
  latLng: {
    lat: latLng.lat,
    lng: latLng.lng,
  },
});


      onClose();
      return;
    }

    // -------------------------
    // CASE 2: EDIT EXISTING — bookingId available
    // -------------------------
    setSaving(true);

    try {
      if (!latLng || latLng.lat == null || latLng.lng == null) {
        alert("Please pick a location on the map before saving.");
        return;
      }

      const addressPayload = {
        houseFlatNumber: houseFlat,
        streetArea: addr,
        landMark: landmark,
        city,
        location: {
          type: "Point",
          coordinates: [latLng.lng, latLng.lat],
        },
      };

      const res = await fetch(
        `${BASE_URL}/bookings/update-address-slot/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addressPayload }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update address");

      onSelect({
        formattedAddress: addr,
        houseFlatNumber: houseFlat,
        landmark: landmark,
        lat: latLng.lat,
        lng: latLng.lng,
        city: city,
      });

      // alert("Address updated successfully! Please select a new time slot.");
      onClose();
    } catch (err) {
      alert(err.message || "Error updating address");
    } finally {
      setSaving(false);
    }
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
            <div style={addrStyles.addrPreview}>
              {addr || "Move the pin or search…"}
            </div>

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
            {houseFlatError && (
              <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                {houseFlatError}
              </div>
            )}

            <label style={addrStyles.label}>Landmark (Optional)</label>
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Enter Landmark"
              style={addrStyles.input}
            />

            <div style={addrStyles.cityInfo}>
              <strong>Detected City:</strong> {city || "Not detected"}
            </div>

            {/* <div
              style={{
                background: "#ffefef",
                border: "1px solid red",
                padding: 10,
                borderRadius: 8,
                color: "#900",
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              <strong>Validation Check:</strong>
              <div>
                Missing:{" "}
                {getMissingFields().length === 0
                  ? "None ✔ All good"
                  : getMissingFields().join(", ")}
              </div>

              <div style={{ marginTop: 6 }}>
                <strong>Debug:</strong>
                <br />
                houseFlatNumber: {houseFlat || "(empty)"}
                <br />
                streetArea: {addr || "(empty)"}
                <br />
                city: {city || "(empty)"}
                <br />
                lat: {latLng?.lat || "(empty)"}
                <br />
                lng: {latLng?.lng || "(empty)"}
                <br />
                bookingId: {bookingId || "(empty)"}
              </div>
            </div> */}

            <button
              disabled={
                !houseFlat.trim() ||
                !addr.trim() ||
                !city.trim() ||
                !latLng?.lat ||
                !latLng?.lng
              }
              onClick={onSave}
              style={{
                ...addrStyles.saveBtn,
                opacity: getMissingFields().length > 0 ? 0.6 : 1,
                cursor:
                  getMissingFields().length > 0 ? "not-allowed" : "pointer",
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
  sheet: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 800,
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottom: "1px solid #eee",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  mapCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  search: {
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    margin: 16,
    fontSize: 14,
  },
  mapBox: {
    flex: 1,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    overflow: "hidden",
  },
  formCol: {
    width: 300,
    padding: 16,
    borderLeft: "1px solid #eee",
    display: "flex",
    flexDirection: "column",
  },
  addrPreview: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
    minHeight: 60,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    display: "block",
  },
  input: {
    width: "100%",
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  cityInfo: {
    padding: 12,
    backgroundColor: "#e8f5e8",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  saveBtn: {
    padding: 14,
    backgroundColor: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    marginTop: "auto",
  },
};

export default AddressPickerModal;

// import React, { useEffect, useRef, useState } from "react";
// import { FaTimes } from "react-icons/fa";
// import { BASE_URL } from "../utils/config";

// // Utility to load Google Maps API
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
//     s.onload = resolve;
//     s.onerror = reject;
//     document.head.appendChild(s);
//   });

// const AddressPickerModal = ({
//   initialLatLng,
//   initialAddress = "",
//   onClose,
//   onSelect,
//   bookingId,
// }) => {
//   const mapRef = useRef(null);
//   const inputRef = useRef(null);
//   const geocoderRef = useRef(null);
//   const markerRef = useRef(null);

//   const [addr, setAddr] = useState(initialAddress || "");
//   const [houseFlat, setHouseFlat] = useState("");
//   const [landmark, setLandmark] = useState("");
//   const [latLng, setLatLng] = useState(initialLatLng || null);
//   const [city, setCity] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [houseFlatError, setHouseFlatError] = useState("");

//   const getMissingFields = () => {
//     const missing = [];

//     if (!houseFlat.trim()) missing.push("houseFlatNumber");
//     if (!addr.trim()) missing.push("streetArea");
//     if (!city.trim()) missing.push("city");
//     if (!latLng?.lat) missing.push("latitude");
//     if (!latLng?.lng) missing.push("longitude");

//     if (bookingId) {
//       if (!bookingId) missing.push("bookingId");
//     }

//     return missing;
//   };

//   const validateHouseFlat = (value) => {
//     if (!value.trim()) {
//       setHouseFlatError("House/Flat Number is required");
//       return false;
//     }
//     if (value.length > 50) {
//       setHouseFlatError("House/Flat Number must be 50 characters or less");
//       return false;
//     }
//     setHouseFlatError("");
//     return true;
//   };

//   useEffect(() => {
//     const cleanupFns = [];
//     let map, autocomplete, marker, geocoder;

//     const reverseGeocode = (pos, formattedAddrFromPlace = null) => {
//       if (!geocoderRef.current) return;

//       if (markerRef.current) markerRef.current.setPosition(pos);
//       if (mapRef.current) {
//         mapRef.current.setCenter(pos);
//         mapRef.current.setZoom(17);
//       }

//       if (formattedAddrFromPlace) {
//         setAddr(formattedAddrFromPlace);
//       }

//       // ✅ Always update latLng state
//       setLatLng({ lat: pos.lat, lng: pos.lng });

//       geocoderRef.current.geocode({ location: pos }, (results, status) => {
//         if (status === "OK" && results?.length) {
//           const formattedAddress = results[0].formatted_address;
//           const addressComponents = results[0].address_components;

//           let detectedCity = "";
//           let state = "";
//           let country = "";

//           for (const comp of addressComponents) {
//             const types = comp.types;
//             if (types.includes("locality")) detectedCity = comp.long_name;
//             else if (
//               types.includes("administrative_area_level_2") &&
//               !detectedCity
//             )
//               detectedCity = comp.long_name;
//             else if (types.includes("administrative_area_level_1"))
//               state = comp.long_name;
//             else if (types.includes("country")) country = comp.long_name;
//           }

//           if (detectedCity)
//             detectedCity =
//               detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1);

//           if (!formattedAddrFromPlace) setAddr(formattedAddress);

//           // Set the city from reverse geocoding
//           setCity(detectedCity);
//         }
//       });
//     };

//     const init = async (posToUse) => {
//       await loadGoogleMaps();
//       geocoder = new window.google.maps.Geocoder();
//       geocoderRef.current = geocoder;

//       map = new window.google.maps.Map(mapRef.current, {
//         center: posToUse,
//         zoom: 16,
//         streetViewControl: false,
//         mapTypeControl: false,
//       });
//       mapRef.current = map;

//       marker = new window.google.maps.Marker({
//         map,
//         position: posToUse,
//         draggable: true,
//       });
//       markerRef.current = marker;

//       const autocomplete = new window.google.maps.places.Autocomplete(
//         inputRef.current,
//         { fields: ["formatted_address", "geometry"] }
//       );

//       const ensureAutocompleteZIndex = () => {
//         const containers = document.querySelectorAll(".pac-container");
//         containers.forEach((el) => {
//           el.style.zIndex = "100000";
//         });
//       };
//       ensureAutocompleteZIndex();

//       autocomplete.addListener("place_changed", () => {
//         const place = autocomplete.getPlace();
//         if (!place.geometry) return;
//         const pos = {
//           lat: place.geometry.location.lat(),
//           lng: place.geometry.location.lng(),
//         };

//         // ✅ Update state first
//         setLatLng(pos);

//         reverseGeocode(pos, place.formatted_address);
//       });

//       const observer = new MutationObserver(ensureAutocompleteZIndex);
//       observer.observe(document.body, {
//         childList: true,
//         subtree: true,
//       });

//       map.addListener("click", (e) => {
//         const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
//         setLatLng(pos);
//         markerRef.current.setPosition(pos);
//         reverseGeocode(pos);
//       });

//       marker.addListener("dragend", () => {
//         const pos = {
//           lat: markerRef.current.getPosition().lat(),
//           lng: markerRef.current.getPosition().lng(),
//         };
//         setLatLng(pos);
//         reverseGeocode(pos);
//       });

//       if (!initialAddress) reverseGeocode(posToUse);
//       cleanupFns.push(() => observer.disconnect());
//     };

//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const currentPos = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//           };
//           setLatLng(currentPos);
//           init(currentPos);
//         },
//         () => init(initialLatLng || { lat: 12.9716, lng: 77.5946 })
//       );
//     } else {
//       init(initialLatLng || { lat: 12.9716, lng: 77.5946 });
//     }
//     return () => {
//       cleanupFns.forEach((fn) => {
//         try {
//           fn();
//         } catch (err) {
//           console.warn("AddressPicker cleanup error:", err);
//         }
//       });
//     };
//   }, [initialLatLng, initialAddress]);

//   // Updated onSave function to call API directly
//   const onSave = async () => {
//     if (!validateHouseFlat(houseFlat) || !latLng) return;

//     // -------------------------
//     // CASE 1: CREATE LEAD — NO bookingId
//     // -------------------------
//     if (!bookingId) {
//       onSelect({
//         formattedAddress: addr,
//         houseFlatNumber: houseFlat,
//         landmark: landmark,
//         lat: latLng.lat,
//         lng: latLng.lng,
//         city: city,
//       });
//       onClose();
//       return;
//     }

//     // -------------------------
//     // CASE 2: EDIT EXISTING — bookingId available
//     // -------------------------
//     setSaving(true);

//     try {
//       const addressPayload = {
//         houseFlatNumber: houseFlat,
//         streetArea: addr,
//         landMark: landmark,
//         city: city,
//         location: {
//           type: "Point",
//           coordinates: [latLng.lng, latLng.lat],
//         },
//       };

//       const res = await fetch(
//         `${BASE_URL}/bookings/update-address-slot/${bookingId}`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ address: addressPayload }),
//         }
//       );

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Failed to update address");

//       onSelect({
//         formattedAddress: addr,
//         houseFlatNumber: houseFlat,
//         landmark: landmark,
//         lat: latLng.lat,
//         lng: latLng.lng,
//         city: city,
//       });

//       // alert("Address updated successfully! Please select a new time slot.");
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating address");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div style={addrStyles.overlay}>
//       <div style={addrStyles.sheet}>
//         <div style={addrStyles.headerRow}>
//           <h3 style={{ margin: 0, fontSize: 16 }}>Current Location</h3>
//           <FaTimes style={{ cursor: "pointer" }} onClick={onClose} />
//         </div>

//         <div style={addrStyles.body}>
//           <div style={addrStyles.mapCol}>
//             <input
//               ref={inputRef}
//               placeholder="Search location or paste address"
//               style={addrStyles.search}
//             />
//             <div ref={mapRef} style={addrStyles.mapBox} />
//           </div>

//           <div style={addrStyles.formCol}>
//             <div style={addrStyles.addrPreview}>
//               {addr || "Move the pin or search…"}
//             </div>

//             <label style={addrStyles.label}>House/Flat Number *</label>
//             <input
//               value={houseFlat}
//               onChange={(e) => {
//                 setHouseFlat(e.target.value);
//                 validateHouseFlat(e.target.value);
//               }}
//               placeholder="Enter House/Flat Number"
//               style={addrStyles.input}
//             />
//             {houseFlatError && (
//               <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
//                 {houseFlatError}
//               </div>
//             )}

//             <label style={addrStyles.label}>Landmark (Optional)</label>
//             <input
//               value={landmark}
//               onChange={(e) => setLandmark(e.target.value)}
//               placeholder="Enter Landmark"
//               style={addrStyles.input}
//             />

//             <div style={addrStyles.cityInfo}>
//               <strong>Detected City:</strong> {city || "Not detected"}
//             </div>

//             {/* <div
//               style={{
//                 background: "#ffefef",
//                 border: "1px solid red",
//                 padding: 10,
//                 borderRadius: 8,
//                 color: "#900",
//                 marginBottom: 16,
//                 fontSize: 13,
//               }}
//             >
//               <strong>Validation Check:</strong>
//               <div>
//                 Missing:{" "}
//                 {getMissingFields().length === 0
//                   ? "None ✔ All good"
//                   : getMissingFields().join(", ")}
//               </div>

//               <div style={{ marginTop: 6 }}>
//                 <strong>Debug:</strong>
//                 <br />
//                 houseFlatNumber: {houseFlat || "(empty)"}
//                 <br />
//                 streetArea: {addr || "(empty)"}
//                 <br />
//                 city: {city || "(empty)"}
//                 <br />
//                 lat: {latLng?.lat || "(empty)"}
//                 <br />
//                 lng: {latLng?.lng || "(empty)"}
//                 <br />
//                 bookingId: {bookingId || "(empty)"}
//               </div>
//             </div> */}

//             <button
//               disabled={
//                 !houseFlat.trim() ||
//                 !addr.trim() ||
//                 !city.trim() ||
//                 !latLng?.lat ||
//                 !latLng?.lng
//               }
//               onClick={onSave}
//               style={{
//                 ...addrStyles.saveBtn,
//                 opacity: getMissingFields().length > 0 ? 0.6 : 1,
//                 cursor:
//                   getMissingFields().length > 0 ? "not-allowed" : "pointer",
//               }}
//             >
//               {saving ? "Saving…" : "Save and proceed"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const addrStyles = {
//   overlay: {
//     position: "fixed",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 10000,
//   },
//   sheet: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     width: "90%",
//     maxWidth: 800,
//     maxHeight: "90vh",
//     overflow: "hidden",
//     display: "flex",
//     flexDirection: "column",
//   },
//   headerRow: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: 16,
//     borderBottom: "1px solid #eee",
//   },
//   body: {
//     display: "flex",
//     flex: 1,
//     overflow: "hidden",
//   },
//   mapCol: {
//     flex: 1,
//     display: "flex",
//     flexDirection: "column",
//   },
//   search: {
//     padding: 12,
//     border: "1px solid #ddd",
//     borderRadius: 8,
//     margin: 16,
//     fontSize: 14,
//   },
//   mapBox: {
//     flex: 1,
//     margin: 16,
//     marginTop: 0,
//     borderRadius: 8,
//     overflow: "hidden",
//   },
//   formCol: {
//     width: 300,
//     padding: 16,
//     borderLeft: "1px solid #eee",
//     display: "flex",
//     flexDirection: "column",
//   },
//   addrPreview: {
//     backgroundColor: "#f5f5f5",
//     padding: 12,
//     borderRadius: 8,
//     fontSize: 14,
//     marginBottom: 16,
//     minHeight: 60,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: 600,
//     marginBottom: 8,
//     display: "block",
//   },
//   input: {
//     width: "100%",
//     padding: 12,
//     border: "1px solid #ddd",
//     borderRadius: 8,
//     fontSize: 14,
//     marginBottom: 16,
//   },
//   cityInfo: {
//     padding: 12,
//     backgroundColor: "#e8f5e8",
//     borderRadius: 8,
//     fontSize: 14,
//     marginBottom: 16,
//   },
//   saveBtn: {
//     padding: 14,
//     backgroundColor: "#111",
//     color: "#fff",
//     border: "none",
//     borderRadius: 8,
//     fontSize: 14,
//     fontWeight: 600,
//     marginTop: "auto",
//   },
// };

// export default AddressPickerModal;
