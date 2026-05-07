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
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState("All Cities"); // ✅ will be set after API

  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const PAGE_SIZE = 10;

  // const fetchVendors = async (page = 1) => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const response = await axios.get(`${BASE_URL}/vendor/get-all-vendor`, {
  //       params: {
  //         page,
  //         limit: PAGE_SIZE,
  //       },
  //     });

  //     const { vendor, pagination } = response.data;

  //     const fetchedVendors = vendor.map((vendor) => ({
  //       id: vendor._id,
  //       name: vendor.vendor.vendorName,
  //       profileImage: vendor.vendor.profileImage,
  //       category: vendor.vendor.serviceType,
  //       city: vendor.vendor.city,
  //       status: vendor.activeStatus ? "Live" : "Inactive",
  //       rating: 4.5,
  //       phone: String(vendor.vendor.mobileNumber ?? ""),
  //       capacity: vendor.vendor.capacity,
  //       dob: vendor.vendor.dateOfBirth,
  //       serviceArea: vendor.vendor?.serviceArea,
  //       location: vendor.address?.location || "",
  //       workingSince: parseInt(vendor.vendor?.yearOfWorking ?? "0", 10),
  //       coins: Number(vendor.wallet?.coins ?? 0),
  //       lat: vendor.address?.latitude,
  //       long: vendor.address?.longitude,
  //       aadhar: vendor.documents?.aadhaarNumber || "",
  //       pan: vendor.documents?.panNumber || "",
  //       account: vendor.bankDetails?.accountNumber || "",
  //       ifsc: vendor.bankDetails?.ifscCode || "",
  //       bank: vendor.bankDetails?.bankName || "",
  //       holderName: vendor.bankDetails?.holderName || "",
  //       accountType: vendor.bankDetails?.accountType || "",
  //       gst: vendor.bankDetails?.gstNumber || "",
  //       docs: {
  //         aadhaarFront:
  //           vendor.documents?.aadhaarfrontImage ||
  //           vendor.documents?.aadhaarFrontImage ||
  //           "",
  //         aadhaarBack:
  //           vendor.documents?.aadhaarbackImage ||
  //           vendor.documents?.aadhaarBackImage ||
  //           "",
  //         pan: vendor.documents?.panImage || "",
  //         other: vendor.documents?.otherPolicy || "",
  //       },
  //       team: (vendor.team || []).map(normalizeMember),
  //     }));

  //     setVendors(fetchedVendors);

  //     if (pagination) {
  //       setServerPagination(pagination);
  //     }

  //     return fetchedVendors;
  //   } catch (error) {
  //     console.error("Error fetching vendors:", error);
  //     setError(error.response?.data?.message || error.message);
  //     return [];
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/city/city-list`);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];

        setCities(list);

        // ✅ default select = first city from API response
        if (list.length > 0) {
          setCity(list[0]?.city || "");
          fetchVendors(1, { city: list[0]?.city || "" }); // ✅ optional: auto-load vendors for first city
        } else {
          setCity("");
        }
      } catch (err) {
        console.error("Error fetching city list:", err);
        setCities([]);
        setCity("");
      }
    };

    fetchCities();
  }, []);

  const fetchVendors = async (page = 1, overrideFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${BASE_URL}/vendor/get-all-vendor`, {
        params: {
          page,
          limit: PAGE_SIZE,

          // ✅ filters
          city: overrideFilters.city ?? city,
          serviceType: overrideFilters.service ?? service,
          search: overrideFilters.search ?? search,
        },
      });

      const { vendor, pagination } = response.data;

      const fetchedVendors = vendor.map((vendor) => ({
        id: vendor._id,
        name: vendor.vendor.vendorName,
        profileImage: vendor.vendor.profileImage,
        category: vendor.vendor.serviceType,
        city: vendor.vendor.city,
        // Derived status from backend: live | low_coins |
        // team_unavailable | archived. statusLabel/statusColor are
        // ready-to-render display strings.
        status: vendor.status || "live",
        statusLabel: vendor.statusLabel || "Live",
        statusColor: vendor.statusColor || "#28a745",
        isArchived: vendor.isArchived === true,
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

      if (pagination) setServerPagination(pagination);

      return fetchedVendors;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError(error.response?.data?.message || error.message);
      setVendors([]);
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

  // const filteredVendors = vendors.filter((vendor) => {
  //   const matchesCity = city === "All Cities" || vendor.city === city;
  //   const matchesStatus = status === "All Statuses" || vendor.status === status;
  //   const matchesService = service === "All Services" || vendor.category === service;
  //   return matchesCity && matchesStatus && matchesService;
  // });
  const filteredVendors = vendors; // ✅ already filtered by backend

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
              onChange={(e) => {
                const v = e.target.value;
                setCity(v);
                fetchVendors(1, { city: v });
              }}
              style={{ height: "34px", fontSize: "12px" }}
            >
              <option>All Cities</option>

              {cities.map((c) => (
                <option key={c?._id} value={c?.city}>
                  {c?.city}
                </option>
              ))}
            </Form.Select>
            <Form.Select
              value={service}
              onChange={(e) => {
                const v = e.target.value;
                setService(v);
                fetchVendors(1, { service: v });
              }}
              style={{ height: "34px", fontSize: "12px" }}
            >
              {[
                "All Services",
                "House Painting",
                "Deep Cleaning",
                "House Interiors",
                "Packers & Movers",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Form.Select>
            <Form.Control
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Vendor name"
              style={{ height: "34px", fontSize: "12px", width: "220px" }}
            />
            <Button
              variant="dark"
              size="sm"
              onClick={() => fetchVendors(1, { search })}
            >
              Search
            </Button>

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
            vendorFormData?.latitude &&
            vendorFormData?.longitude &&
            !isNaN(vendorFormData.latitude) &&
            !isNaN(vendorFormData.longitude)
              ? {
                  lat: parseFloat(vendorFormData.latitude),
                  lng: parseFloat(vendorFormData.longitude),
                }
              : null
          }
          onSelect={(sel) => {
            if (vendorFormData) {
              setVendorFormData((prev) => ({
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
