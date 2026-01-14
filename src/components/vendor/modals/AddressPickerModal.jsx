

// full working code
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
import vendor from "../../../assets/vendor.svg";
import "react-calendar/dist/Calendar.css";
import { BASE_URL } from "../../../utils/config";
import { useMemo } from "react";


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
  const [latLng, setLatLng] = useState(
    initialLatLng || { lat: null, lng: null }
  );

  useEffect(() => {
    if (!show) return;

    let map, marker, geocoder;

    const getCurrentPosition = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      });

    const init = async () => {
      try {
        await loadGoogleMaps();

        let start = await getCurrentPosition();
        if (
          !start &&
          initialLatLng &&
          !isNaN(initialLatLng.lat) &&
          !isNaN(initialLatLng.lng)
        ) {
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
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          input,
          {
            fields: ["formatted_address", "geometry"],
          }
        );

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
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
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
            Lat: {latLng.lat ? latLng.lat.toFixed(6) : "N/A"} | Lng:{" "}
            {latLng.lng ? latLng.lng.toFixed(6) : "N/A"}
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

export default AddressPickerModal