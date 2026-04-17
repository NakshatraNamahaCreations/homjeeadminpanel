import { useEffect, useRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";

const GOOGLE_MAPS_API_KEY = "AIzaSyBF48uqsKVyp9P2NlDX-heBJksvvT_8Cqk";

/* ================= SAFE MAPS+PLACES LOADER ================= */
let __googleMapsPlacesPromise = null;

const hasPlaces = () =>
  !!window.google?.maps?.places?.Autocomplete &&
  typeof window.google.maps.places.Autocomplete === "function";

const findMapsScript = () => {
  try {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    return scripts.find((s) =>
      s.src.includes("https://maps.googleapis.com/maps/api/js")
    );
  } catch (e) {
    return null;
  }
};

const loadGoogleMaps = () => {
  if (__googleMapsPlacesPromise) return __googleMapsPlacesPromise;

  __googleMapsPlacesPromise = new Promise((resolve, reject) => {
    try {
      if (hasPlaces()) return resolve();

      const existing = findMapsScript();

      const injectPlacesAddon = () => {
        try {
          if (hasPlaces()) return resolve();

          const addonAlready = document.querySelector(
            'script[data-google="maps-places-addon"]'
          );

          if (addonAlready) {
            addonAlready.addEventListener("load", () => {
              try {
                if (hasPlaces()) resolve();
                else reject(new Error("Places addon loaded but still missing."));
              } catch (e) {
                reject(e);
              }
            });
            addonAlready.addEventListener("error", reject);
            return;
          }

          const addon = document.createElement("script");
          addon.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
          addon.async = true;
          addon.defer = true;
          addon.setAttribute("data-google", "maps-places-addon");
          addon.onload = () => {
            try {
              if (!hasPlaces()) {
                return reject(
                  new Error(
                    "Google Maps loaded but Places library is missing. Enable Places API + Billing."
                  )
                );
              }
              resolve();
            } catch (e) {
              reject(e);
            }
          };
          addon.onerror = reject;
          document.head.appendChild(addon);
        } catch (err) {
          reject(err);
        }
      };

      if (existing) {
        if (window.google?.maps && !hasPlaces()) {
          injectPlacesAddon();
          return;
        }

        const onLoad = () => {
          try {
            if (hasPlaces()) return resolve();
            injectPlacesAddon();
          } catch (e) {
            reject(e);
          }
        };

        existing.addEventListener("load", onLoad);
        existing.addEventListener("error", reject);

        if (window.google?.maps) onLoad();
        return;
      }

      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
      s.async = true;
      s.defer = true;
      s.setAttribute("data-google", "maps");
      s.onload = () => {
        try {
          if (!hasPlaces()) {
            return reject(
              new Error(
                "Google Maps loaded but Places library is missing. Check API key permissions."
              )
            );
          }
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      s.onerror = reject;
      document.head.appendChild(s);
    } catch (err) {
      reject(err);
    }
  });

  return __googleMapsPlacesPromise;
};

/* ================= HELPERS ================= */

const isValidLatLng = (obj) => {
  try {
    const lat = Number(obj?.lat);
    const lng = Number(obj?.lng);
    return (
      obj &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    );
  } catch (e) {
    return false;
  }
};

const ensureAutocompleteZIndex = () => {
  try {
    const containers = document.querySelectorAll(".pac-container");
    containers.forEach((el) => {
      el.style.zIndex = "2147483647";
      el.style.position = "fixed";
    });
  } catch (e) {}
};

const getCurrentPosition = () =>
  new Promise((resolve) => {
    try {
      if (!navigator.geolocation) return resolve(null);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          try {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          } catch (e) {
            resolve(null);
          }
        },
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } catch (e) {
      resolve(null);
    }
  });

/* ================= LOADER UI ================= */

const LoadingDots = ({ text = "Loading current address..." }) => {
  return (
    <div
      style={{
        height: "80vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        background: "rgba(255,255,255,0.85)",
        borderRadius: "12px",
      }}
    >
      <div className="loader-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className="mt-3 text-muted">{text}</p>

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
        .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

/* ================= COMPONENT ================= */

const AddressPickerModal = ({
  show,
  onHide,
  onSelect,
  initialAddress = "",
  initialLatLng,
}) => {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const placesServiceRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [addr, setAddr] = useState(initialAddress || "");
  const [placeName, setPlaceName] = useState("");
  const [latLng, setLatLng] = useState(
    isValidLatLng(initialLatLng)
      ? { lat: Number(initialLatLng.lat), lng: Number(initialLatLng.lng) }
      : { lat: null, lng: null }
  );

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ stop loader only once for initial resolve
  const initialResolvedRef = useRef(false);

  useEffect(() => {
    if (show) setSearchQuery("");
  }, [show]);

  useEffect(() => {
    if (!show || !mapDivRef.current) return;

    let cleanupFns = [];
    let map, marker, geocoder, autocomplete;
    let isMounted = true;

    const stopInitialLoader = () => {
      if (!isMounted) return;
      if (initialResolvedRef.current) return;
      initialResolvedRef.current = true;
      setLoading(false);
    };

    const fetchPlaceName = (placeId) =>
      new Promise((resolve) => {
        try {
          const svc = placesServiceRef.current;
          if (!svc || !placeId) return resolve("");

          svc.getDetails({ placeId, fields: ["name"] }, (place, status) => {
            try {
              if (
                status === window.google.maps.places.PlacesServiceStatus.OK &&
                place?.name
              ) {
                return resolve(place.name);
              }
              resolve("");
            } catch (e) {
              resolve("");
            }
          });
        } catch (e) {
          resolve("");
        }
      });

    const reverseGeocode = (
      pos,
      formattedAddrFromPlace = null,
      nameFromPlace = null,
      stopLoader = false
    ) => {
      try {
        if (!geocoderRef.current) {
          if (stopLoader) stopInitialLoader();
          return;
        }

        if (markerRef.current) markerRef.current.setPosition(pos);
        if (mapRef.current) {
          mapRef.current.setCenter(pos);
          mapRef.current.setZoom(16);
        }

        setLatLng({ lat: pos.lat, lng: pos.lng });

        if (formattedAddrFromPlace) setAddr(formattedAddrFromPlace);
        if (nameFromPlace) setPlaceName(nameFromPlace);

        geocoderRef.current.geocode({ location: pos }, async (results, status) => {
          try {
            if (!isMounted) return;

            if (status === "OK" && results?.[0]) {
              const formatted = results[0].formatted_address || "";
              const pid = results[0].place_id;

              if (!formattedAddrFromPlace) setAddr(formatted);

              const name = await fetchPlaceName(pid);
              setPlaceName(name || nameFromPlace || "");
            }
          } catch (e) {
            console.warn("reverseGeocode callback error:", e);
          } finally {
            if (stopLoader) stopInitialLoader();
          }
        });
      } catch (e) {
        if (stopLoader) stopInitialLoader();
      }
    };

    const init = async () => {
      try {
        initialResolvedRef.current = false;
        setLoading(true);

        // ✅ safety: never keep loader forever
        const safety = setTimeout(() => {
          stopInitialLoader();
        }, 8000);
        cleanupFns.push(() => clearTimeout(safety));

        await loadGoogleMaps();
        if (!isMounted) return;

        let start = null;

        if (isValidLatLng(initialLatLng)) {
          start = {
            lat: Number(initialLatLng.lat),
            lng: Number(initialLatLng.lng),
          };
        } else {
          start = await getCurrentPosition();
        }

        if (!start) start = { lat: 12.9716, lng: 77.5946 };

        geocoder = new window.google.maps.Geocoder();
        geocoderRef.current = geocoder;

        map = new window.google.maps.Map(mapDivRef.current, {
          center: start,
          zoom: isValidLatLng(initialLatLng) ? 16 : 15,
          streetViewControl: false,
          mapTypeControl: false,
        });
        mapRef.current = map;

        placesServiceRef.current = new window.google.maps.places.PlacesService(map);

        marker = new window.google.maps.Marker({
          map,
          position: start,
          draggable: true,
          title: "Drag to exact location",
        });
        markerRef.current = marker;

        setLatLng(start);

        // ✅ STOP LOADER PROPERLY
        if (initialAddress?.trim()) {
          setAddr(initialAddress.trim());
          stopInitialLoader();
        } else {
          reverseGeocode(start, null, null, true);
        }

        // ✅ autocomplete
        if (inputRef.current) {
          autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            fields: ["formatted_address", "geometry", "name", "place_id"],
          });
          autocompleteRef.current = autocomplete;

          ensureAutocompleteZIndex();

          autocomplete.addListener("place_changed", () => {
            try {
              const place = autocomplete.getPlace();
              if (!place?.geometry?.location) return;

              const newPos = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              };

              setSearchQuery(place.formatted_address || place.name || "");

              reverseGeocode(
                newPos,
                place.formatted_address || place.name || "",
                place.name || "",
                false
              );

              ensureAutocompleteZIndex();
            } catch (e) {
              console.warn("place_changed error:", e);
            }
          });

          const observer = new MutationObserver(ensureAutocompleteZIndex);
          observer.observe(document.body, { childList: true, subtree: true });
          cleanupFns.push(() => observer.disconnect());
        }

        marker.addListener("dragend", () => {
          try {
            const pos = marker.getPosition();
            reverseGeocode({ lat: pos.lat(), lng: pos.lng() });
          } catch (e) {}
        });

        map.addListener("click", (e) => {
          try {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            marker.setPosition(newPos);
            reverseGeocode(newPos);
          } catch (e) {}
        });

        setTimeout(() => {
          try {
            window.google.maps.event.trigger(map, "resize");
            map.setCenter(start);
            ensureAutocompleteZIndex();
          } catch (e) {}
        }, 200);
      } catch (err) {
        console.error("❌ Map init failed:", err);
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      try {
        cleanupFns.forEach((fn) => fn());
        if (map) window.google.maps.event.clearInstanceListeners(map);
        if (marker) window.google.maps.event.clearInstanceListeners(marker);
      } catch (e) {}
    };
  }, [show, initialLatLng, initialAddress]);

  const handleUseLocation = () => {
    try {
      if (loading) return;

      if (!latLng?.lat || !latLng?.lng) {
        alert("Please select a valid location on the map.");
        return;
      }

      onSelect({
        placeName: placeName || "",
        formattedAddress: addr,
        lat: latLng.lat,
        lng: latLng.lng,
      });

      onHide();
    } catch (e) {
      alert("Something went wrong while selecting location.");
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      dialogClassName="gmap-dialog"
      contentClassName="gmap-content"
      fullscreen="md-down"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title style={{fontSize:"15px"}}>
          Pick Location{" "}
          <span className="text-muted" style={{ fontWeight: 400 , }}>
            (Google Maps)
          </span>
        </Modal.Title>
      </Modal.Header>

      {/* ✅ make body relative so loader absolute works */}
      <Modal.Body className="gmap-body" style={{ position: "relative" }}>
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={ensureAutocompleteZIndex}
          placeholder="Search new location..."
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            marginBottom: "12px",
          }}
        />

        <div
          ref={mapDivRef}
          style={{
            width: "100%",
            height: "500px",
            borderRadius: "8px",
            border: "1px solid #eee",
            overflow: "hidden",
          }}
        />

        <div
          style={{
            marginTop: "12px",
            padding: "8px",
            border: "1px solid #eee",
            borderRadius: "8px",
            background: "#f8f9fa",
            fontSize: "13px",
          }}
        >
          <strong>Selected:</strong> {placeName ? `${placeName}, ` : ""}
          {addr || "Click map / drag marker / search"}
          <br />
          <span className="text-muted" style={{ fontSize: "12px" }}>
            Lat: {latLng?.lat != null ? Number(latLng.lat).toFixed(6) : "N/A"} |{" "}
            Lng: {latLng?.lng != null ? Number(latLng.lng).toFixed(6) : "N/A"}
          </span>
        </div>

        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
              background: "rgba(255,255,255,0.4)",
            }}
          >
            <LoadingDots text="Loading current address..." />
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleUseLocation} disabled={loading}>
          {loading ? "Please wait..." : "Use this location"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddressPickerModal;


// 22-01-2026
// import { useState, useEffect, useRef } from "react";
// import { Modal, Button } from "react-bootstrap";

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

// const AddressPickerModal = ({ show, onHide, onSelect, initialAddress = "", initialLatLng }) => {
//   const mapRef = useRef(null);
//   const inputRef = useRef(null);
//   const markerRef = useRef(null);
//   const geocoderRef = useRef(null);
//   const autocompleteRef = useRef(null);

//   const [addr, setAddr] = useState(initialAddress || "");
//   const [latLng, setLatLng] = useState(initialLatLng || { lat: null, lng: null });

//   useEffect(() => {
//     if (!show || !mapRef.current) return;

//     let map, marker, geocoder;

//     const getCurrentPosition = () =>
//       new Promise((resolve) => {
//         if (!navigator.geolocation) return resolve(null);
//         navigator.geolocation.getCurrentPosition(
//           (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//           () => resolve(null),
//           { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
//         );
//       });

//     const init = async () => {
//       try {
//         await loadGoogleMaps();

//         let start = null;

//         // 1️⃣ EDIT VENDOR: Use existing coordinates if available
//         if (
//           initialLatLng?.lat &&
//           initialLatLng?.lng &&
//           !isNaN(Number(initialLatLng.lat)) &&
//           !isNaN(Number(initialLatLng.lng))
//         ) {
//           start = { lat: Number(initialLatLng.lat), lng: Number(initialLatLng.lng) };
//         }

//         // 2️⃣ ADD VENDOR: Fetch current position if no initialLatLng
//         if (!start) {
//           start = await getCurrentPosition();
//         }

//         // 3️⃣ Fallback: default India center
//         if (!start) start = { lat: 20.5937, lng: 78.9629 };

//         // Force container height so map is visible
//         mapRef.current.style.minHeight = "500px";
//         mapRef.current.style.height = "500px";

//         geocoder = new window.google.maps.Geocoder();
//         geocoderRef.current = geocoder;

//         map = new window.google.maps.Map(mapRef.current, {
//           center: start,
//           zoom: 13,
//           streetViewControl: false,
//           mapTypeControl: false,
//         });

//         marker = new window.google.maps.Marker({
//           map,
//           position: start,
//           draggable: true,
//           title: "Drag to exact location",
//         });

//         markerRef.current = marker;
//         setLatLng(start); // Set initial lat/lng in React state

//         // Autocomplete search
//         if (inputRef.current) {
//           const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
//             fields: ["formatted_address", "geometry"],
//           });

//           autocomplete.addListener("place_changed", () => {
//             const place = autocomplete.getPlace();
//             if (place.geometry?.location) {
//               const newPos = {
//                 lat: place.geometry.location.lat(),
//                 lng: place.geometry.location.lng(),
//               };
//               setLatLng(newPos);
//               setAddr(place.formatted_address);
//               map.setCenter(newPos);
//               marker.setPosition(newPos);
//             }
//           });

//           autocompleteRef.current = autocomplete;
//         }

//         // Marker drag & map click update
//         const updatePosition = () => {
//           const pos = marker.getPosition();
//           const newPos = { lat: pos.lat(), lng: pos.lng() };
//           setLatLng(newPos);
//           if (geocoder) {
//             geocoder.geocode({ location: newPos }, (results, status) => {
//               if (status === "OK" && results?.[0]) setAddr(results[0].formatted_address);
//             });
//           }
//         };

//         marker.addListener("dragend", updatePosition);
//         map.addListener("click", (e) => {
//           marker.setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
//           updatePosition();
//         });

//         // Force map resize (fix modal display issues)
//         setTimeout(() => {
//           window.google.maps.event.trigger(map, "resize");
//           map.setCenter(start);
//         }, 100);
//       } catch (err) {
//         console.error("❌ Map init failed:", err);
//       }
//     };

//     init();

//     return () => {
//       if (map) window.google.maps.event.clearInstanceListeners(map);
//       if (marker) window.google.maps.event.clearInstanceListeners(marker);
//       if (geocoder) window.google.maps.event.clearInstanceListeners(geocoder);
//     };
//   }, [show, initialLatLng, initialAddress]);

//   const handleUseLocation = () => {
//     if (!latLng.lat || !latLng.lng) {
//       alert("Please select a valid location on the map.");
//       return;
//     }
//     onSelect({ formattedAddress: addr, lat: latLng.lat, lng: latLng.lng });
//     onHide();
//   };

//   return (
//     <Modal show={show} onHide={onHide} centered size="lg" dialogClassName="gmap-dialog" contentClassName="gmap-content" fullscreen="md-down" scrollable>
//       <Modal.Header closeButton>
//         <Modal.Title>
//           Pick Location <span className="text-muted" style={{ fontWeight: 400 }}>(Google Maps)</span>
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body className="gmap-body">
//         <input ref={inputRef} placeholder="Search location or paste address" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "12px" }} />
//         <div ref={mapRef} style={{ width: "100%", height: "500px", borderRadius: "8px", border: "1px solid #eee" }} />
//         <div style={{ marginTop: "12px", padding: "8px", border: "1px solid #eee", borderRadius: "8px", background: "#f8f9fa", fontSize: "13px" }}>
//           <strong>Selected:</strong> {addr || "Click map or search"}
//           <br />
//           <span className="text-muted" style={{ fontSize: "12px" }}>Lat: {latLng.lat?.toFixed(6) || "N/A"} | Lng: {latLng.lng?.toFixed(6) || "N/A"}</span>
//         </div>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide}>Cancel</Button>
//         <Button variant="primary" onClick={handleUseLocation}>Use this location</Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default AddressPickerModal;












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
// import vendor from "../../../assets/vendor.svg";
// import "react-calendar/dist/Calendar.css";
// import { BASE_URL } from "../../../utils/config";
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
//     initialLatLng || { lat: null, lng: null },
//   );

//   useEffect(() => {
//     if (!show || !mapRef.current) return;

//     let map, marker, geocoder;

//     const getCurrentPosition = () =>
//       new Promise((resolve) => {
//         if (!navigator.geolocation) {
//           console.warn("Geolocation not supported");
//           return resolve(null);
//         }
//         navigator.geolocation.getCurrentPosition(
//           (pos) => {
//             const posData = {
//               lat: pos.coords.latitude,
//               lng: pos.coords.longitude,
//             };
//             console.log("✅ GPS success:", posData);
//             resolve(posData);
//           },
//           (err) => {
//             console.warn("❌ GPS failed:", err.message);
//             resolve(null); // Continue without GPS
//           },
//           {
//             enableHighAccuracy: true,
//             timeout: 3000, // Faster timeout
//             maximumAge: 60000,
//           },
//         );
//       });

//     const init = async () => {
//       try {
//         await loadGoogleMaps();

//         // YOUR EXACT PRIORITY (no hardcoded Bengaluru):
//         let start = null;

//         // 1. PRIORITY: Use initialLatLng if valid (Edit case)
//         if (
//           initialLatLng?.lat &&
//           initialLatLng?.lng &&
//           !isNaN(Number(initialLatLng.lat)) &&
//           !isNaN(Number(initialLatLng.lng))
//         ) {
//           start = {
//             lat: Number(initialLatLng.lat),
//             lng: Number(initialLatLng.lng),
//           };
//           console.log("✅ Using initialLatLng:", start);
//         }
//         // 2. ELSE: Try current GPS location (Add case)
//         else {
//           console.log("🔄 Fetching current location...");
//           start = await getCurrentPosition();
//         }

//         // 3. CRITICAL: If still no position, use geocoded address OR default to user's IP location
//         if (!start && initialAddress) {
//           console.log("🔄 Geocoding address:", initialAddress);
//           geocoder = new window.google.maps.Geocoder();
//           const results = await new Promise((resolve) => {
//             geocoder.geocode({ address: initialAddress }, (results, status) => {
//               resolve({ results, status });
//             });
//           });
//           if (
//             results.status === "OK" &&
//             results.results?.[0]?.geometry?.location
//           ) {
//             start = {
//               lat: results.results[0].geometry.location.lat(),
//               lng: results.results[0].geometry.location.lng(),
//             };
//             console.log("✅ Geocoded address:", start);
//           }
//         }

//         // 4. FINAL FAILSAFE: Use browser's last known position or broad India center
//         if (!start) {
//           // Try to get from browser cache or use broad default (not hardcoded city)
//           start = await getCurrentPosition(); // Retry once
//           if (!start) {
//             // Broad India center (12.97° N is India's avg lat)
//             start = { lat: 20.5937, lng: 78.9629 }; // India's geographic center
//             console.log("⚠️ Using India center (GPS failed):", start);
//           }
//         }

//         // FORCE MAP CONTAINER HEIGHT (THIS FIXES INVISIBLE MAP)
//         const mapContainer = mapRef.current;
//         if (mapContainer) {
//           mapContainer.style.minHeight = "500px";
//           mapContainer.style.height = "500px";
//         }

//         map = new window.google.maps.Map(mapRef.current, {
//           center: start,
//           zoom: 13,
//           streetViewControl: false,
//           mapTypeControl: false,
//           fullscreenControl: false,
//         });

//         marker = new window.google.maps.Marker({
//           map,
//           position: start,
//           draggable: true,
//           title: "Drag to exact location",
//         });

//         geocoder = new window.google.maps.Geocoder();

//         // Autocomplete search
//         if (inputRef.current) {
//           const autocomplete = new window.google.maps.places.Autocomplete(
//             inputRef.current,
//             { fields: ["formatted_address", "geometry"] },
//           );
//           autocomplete.addListener("place_changed", () => {
//             const place = autocomplete.getPlace();
//             if (place.geometry?.location) {
//               const newPos = {
//                 lat: place.geometry.location.lat(),
//                 lng: place.geometry.location.lng(),
//               };
//               setLatLng(newPos);
//               setAddr(place.formatted_address);
//               map.setCenter(newPos);
//               marker.setPosition(newPos);
//             }
//           });
//         }

//         // Draggable marker + click
//         marker.addListener("dragend", updatePosition);
//         map.addListener("click", (e) => {
//           const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
//           marker.setPosition(newPos);
//           updatePosition(); // Reuse function
//         });

//         const updatePosition = async () => {
//           const position = marker.getPosition();
//           const newLatLng = { lat: position.lat(), lng: position.lng() };
//           setLatLng(newLatLng);
//           if (geocoder) {
//             geocoder.geocode({ location: newLatLng }, (results, status) => {
//               if (status === "OK" && results?.[0]) {
//                 setAddr(results[0].formatted_address);
//               }
//             });
//           }
//         };

//         // FORCE RESIZE (fixes modal height issues)
//         setTimeout(() => {
//           if (map) {
//             window.google.maps.event.trigger(map, "resize");
//             map.setCenter(start);
//           }
//         }, 150);
//       } catch (error) {
//         console.error("❌ Map init failed:", error);
//       }
//     };

//     init();

//     return () => {
//       // Cleanup
//       if (map) window.google.maps.event.clearInstanceListeners(map);
//       if (marker) window.google.maps.event.clearInstanceListeners(marker);
//       if (geocoder) window.google.maps.event.clearInstanceListeners(geocoder);
//     };
//   }, [show, initialLatLng, initialAddress]);

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

// return (
//   <>
//     {/* <style jsx>{`
//       .gmap-dialog { max-width: 95vw !important; width: 900px !important; margin: 1rem auto !important; }
//       .gmap-content { height: 90vh !important; display: flex; flex-direction: column; }
//       .gmap-body { flex: 1; display: flex; flex-direction: column; min-height: 600px; padding: 1rem; }
//     `}</style> */}
    
//     <Modal
//       show={show}
//       onHide={onHide}
//       centered
//       size="lg"
//       dialogClassName="gmap-dialog"
//       contentClassName="gmap-content"
//       fullscreen="md-down"
//       scrollable
//     >
//       <Modal.Header closeButton>
//         <Modal.Title style={{ fontSize: 16 }}>
//           Pick Location <span className="text-muted" style={{ fontWeight: 400 }}>(Google Maps)</span>
//         </Modal.Title>
//       </Modal.Header>
      
//       <Modal.Body className="gmap-body">
//         {/* FIXED INPUT WIDTH */}
//         <div style={{ marginBottom: "12px" }}>
//           <input
//             ref={inputRef}
//             placeholder="Search location or paste address"
//             style={{
//               width: "100%",           // ← FIXED
//               maxWidth: "100%",
//               padding: "12px",
//               borderRadius: "8px",
//               border: "1px solid #ddd",
//               fontSize: "14px",
//               boxSizing: "border-box",
//             }}
//           />
//         </div>
        
//         {/* MAP CONTAINER */}
//         <div 
//           ref={mapRef} 
//           style={{
//             height: "500px",
//             width: "100%",
//             borderRadius: "12px",
//             border: "1px solid #eee",
//           }}
//         />
        
//         {/* POSITION INFO */}
//         <div
//           className="mt-3 p-3"
//           style={{
//             border: "1px solid #eee",
//             borderRadius: "8px",
//             background: "#f8f9fa",
//             fontSize: "13px",
//           }}
//         >
//           <strong>Selected:</strong> {addr || "Click map or search"}
//           <br />
//           <span className="text-muted" style={{ fontSize: "12px" }}>
//             Lat: {latLng.lat?.toFixed(6) || "N/A"} | Lng: {latLng.lng?.toFixed(6) || "N/A"}
//           </span>
//         </div>
//       </Modal.Body>
      
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide}>Cancel</Button>
//         <Button variant="primary" onClick={handleUseLocation}>Use this location</Button>
//       </Modal.Footer>
//     </Modal>
//   </>
// );

// };

// export default AddressPickerModal;

// full working code
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
// import vendor from "../../../assets/vendor.svg";
// import "react-calendar/dist/Calendar.css";
// import { BASE_URL } from "../../../utils/config";
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

// export default AddressPickerModal
