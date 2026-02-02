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

  /* --------------------------------------------------
     SLOT ENABLE RULES (CRITICAL)
  -------------------------------------------------- */
  const isTimeSelectionEnabled =
    !!leadData.googleAddress &&
    !!leadData.city &&
    (leadData.serviceType === "House Painting" ||
      (leadData.serviceType === "Deep Cleaning" &&
        leadData.packages.length > 0));

  /* -----------------------------------------------------------
     Detect City From Address
  ------------------------------------------------------------ */
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
        console.log("price config", res?.data?.data);
      } catch (error) {
        console.error("Error fetching latest service:", error);
      }
    };

    fetchLatestService();
  }, []);

  /* --------------------------------------------------
     FETCH EXISTING USER
  -------------------------------------------------- */
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

  /* --------------------------------------------------
     INPUT HANDLER
  -------------------------------------------------- */
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

  /* -----------------------------------------------------------
     Get Unique Categories for Deep Cleaning
  ------------------------------------------------------------ */
  const uniqueDeepCategories = () => {
    return [...new Set(categories.map((c) => c.category))];
  };

  /* --------------------------------------------------
     ADD / REMOVE PACKAGES
  -------------------------------------------------- */
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
      // ✅ RESET SLOT
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
      // ✅ RESET SLOT
      slotDate: "",
      slotTime: "",
    }));
  };

  /* -----------------------------------------------------------
     Apply Discount
  ------------------------------------------------------------ */
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

  /* -----------------------------------------------------------
     Clear Discount
  ------------------------------------------------------------ */
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

  /* -----------------------------------------------------------
     SAVE
  ------------------------------------------------------------ */
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
      console.log("p", leadData.packages);
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

                // ✅ already present
                teamMembersRequired: p.teamMembers,
                coinDeduction: p.coinsForVendor || 0,

                // ✅ ADD THESE TWO
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
      console.log("booking payload", payload);

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

  /* -----------------------------------------------------------
     UI
  ------------------------------------------------------------ */
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h6>Create New Lead / Enquiry</h6>
          <FaTimes style={styles.close} onClick={onClose} />
        </div>

        <div style={styles.content}>
          {/* PHONE */}
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

          {/* NAME */}
          <input
            type="text"
            name="name"
            placeholder="Customer Name"
            style={styles.input}
            readOnly={!!existingUser}
            onChange={handleChange}
            value={leadData.name}
          />

          {/* ADDRESS */}
          <input
            type="text"
            placeholder="Google Address (click to pick)"
            style={{ ...styles.input, cursor: "pointer" }}
            onClick={() => setShowAddress(true)}
            readOnly
            value={leadData.googleAddress}
          />

          {/* HOUSE NO */}
          <input
            type="text"
            name="houseNo"
            placeholder="House No."
            style={styles.input}
            onChange={handleChange}
            value={leadData.houseNo}
          />

          {/* LANDMARK */}
          <input
            type="text"
            name="landmark"
            placeholder="Landmark"
            style={styles.input}
            onChange={handleChange}
            value={leadData.landmark}
          />

          {/* CITY */}
          <input
            type="text"
            placeholder="Detected City"
            style={{ ...styles.input, background: "#eee" }}
            readOnly
            value={leadData.city}
          />

          {/* SLOT SELECTION */}
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

          {/* SERVICE TYPE */}
          <select
            name="serviceType"
            style={styles.input}
            onChange={async (e) => {
              const val = e.target.value;

              // 🔥 ALWAYS invalidate slot on service change
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
                const res = await axios.get(
                  `${BASE_URL}/deeppackage/deep-cleaning-packages`,
                );
                setCategories(res.data.data || []);
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

      {/* ADDRESS PICKER */}
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
          onSelect={(sel) =>
            setLeadData((p) => ({
              ...p,
              googleAddress: sel.streetArea,
              houseNo: sel.houseFlatNumber || p.houseNo,
              landmark: sel.landMark || p.landmark,
              coordinates: {
                lat: sel.latLng?.lat || 0,
                lng: sel.latLng?.lng || 0,
              },
              city: sel.city || p.city,
              slotDate: "",
              slotTime: "",
            }))
          }
        />
      )}

      {/* TIME PICKER */}
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

/* -----------------------------------------------------------
   Styles
------------------------------------------------------------ */
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
  contentScroll: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
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
//   const [isEditing, setIsEditing] = useState(false);
//   const [showCustomInput, setShowCustomInput] = useState(false);
//   const [customPackage, setCustomPackage] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [showAddress, setShowAddress] = useState(false);
//   const [showTime, setShowTime] = useState(false);

//   // 👇 NEW STATES
//   const [existingUser, setExistingUser] = useState(null);
//   const [typingTimeout, setTypingTimeout] = useState(null);

//   const navigate = useNavigate();
//   const [leadData, setLeadData] = useState({
//     name: "",
//     contact: "",
//     googleAddress: "",
//     city: "",
//     houseNo: "",
//     landmark: "",
//     serviceType: "",
//     timeSlot: "",
//     slotDate: "",
//     slotTime: "",
//     totalAmount: "",
//     bookingAmount: "",
//     packages: [],
//     selectedPackage: "",
//     coordinates: { lat: 0, lng: 0 },
//     formName: "admin panel",
//     createdDate: "",
//     createdTime: "",
//   });

//   const [isSaving, setIsSaving] = useState(false);

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedSubCategory, setSelectedSubCategory] = useState("");
//   const [originalTotal, setOriginalTotal] = useState(0); // keep pre-discount total
//   const [discountMode, setDiscountMode] = useState("percent"); // 'percent' or 'amount'
//   const [discountValue, setDiscountValue] = useState("");
//   const [discountApplied, setDiscountApplied] = useState(false);

//   const [errors, setErrors] = useState({
//     name: "",
//     contact: "",
//     googleAddress: "",
//     city: "",
//     houseNo: "",
//     serviceType: "",
//     slotDate: "",
//     slotTime: "",
//     totalAmount: "",
//     bookingAmount: "",
//     customPackage: "",
//   });

//   const isTimeSelectionEnabled = leadData.googleAddress && leadData.city;

//   useEffect(() => {
//     if (!leadData.googleAddress) return;

//     const addr = leadData.googleAddress.toLowerCase();
//     let detectedCity = "";

//     if (addr.includes("bengaluru")) detectedCity = "Bengaluru";
//     else if (addr.includes("mysuru")) detectedCity = "Mysuru";
//     else if (addr.includes("pune")) detectedCity = "Pune";
//     else detectedCity = "";

//     if (detectedCity && leadData.city !== detectedCity) {
//       setLeadData((prev) => ({ ...prev, city: detectedCity }));
//     }
//   }, [leadData.googleAddress]);

//   useEffect(() => {
//     console.log("leadData", leadData);
//   }, [leadData]);

//   // ----------------------------------------------------------
//   // 🟢 NEW FUNCTION — Fetch existing user by phone number
//   // ----------------------------------------------------------
//   const fetchExistingUser = async (mobile) => {
//     try {
//       const response = await axios.post(
//         `${BASE_URL}/user/finding-user-exist/mobilenumber`,
//         { mobileNumber: mobile }
//       );

//       if (response.data?.isNewUser === false) {
//         const user = response.data.data;
//         setExistingUser(user);

//         const addr = user.savedAddress || {};

//         // Autofill details from API
//         setLeadData((prev) => ({
//           ...prev,
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

//         toast.success("Existing user loaded");
//       } else {
//         // New user → clear previous autofill
//         setExistingUser(null);
//         setLeadData((prev) => ({
//           ...prev,
//           name: "",
//           googleAddress: "",
//           houseNo: "",
//           landmark: "",
//           city: "",
//         }));
//       }
//     } catch (err) {
//       console.error("Error fetching user:", err);
//     }
//   };

//   const handleChange = async (e) => {
//     const { name, value } = e.target;
//     let sanitizedValue = value;

//     // -----------------------------
//     // FIRST: handle serviceType API
//     // -----------------------------
//     if (name === "serviceType") {
//       sanitizedValue = value;

//       if (value === "House Painting") {
//         try {
//           const response = await axios.get(`${BASE_URL}/service/latest`);
//           const siteVisitCharge = response.data.data.siteVisitCharge || 0;

//           setLeadData((prev) => ({
//             ...prev,
//             serviceType: value,
//             bookingAmount: siteVisitCharge,
//           }));
//         } catch (err) {
//           console.error("Error fetching site visit charge:", err);
//         }
//       } else if (value === "Deep Cleaning") {
//         try {
//           const response = await axios.get(
//             `${BASE_URL}/deeppackage/deep-cleaning-packages`
//           );

//           setCategories(
//             response?.data?.data ||
//               response?.data?.packages ||
//               response?.data ||
//               []
//           );

//           // reset Deep Cleaning selections
//           setSelectedSubCategory("");
//           setOriginalTotal(0);
//           setDiscountApplied(false);
//           setDiscountValue("");

//           setLeadData((prev) => ({
//             ...prev,
//             serviceType: value,
//             selectedPackage: "",
//             totalAmount: 0,
//             bookingAmount: 0,
//             packages: [],
//           }));
//         } catch (err) {
//           console.error("Error fetching deep cleaning packages:", err);
//         }
//       }

//       return; // stop here
//     }

//     // -----------------------------
//     // CONTACT NUMBER (debounce)
//     // -----------------------------
//     if (name === "contact") {
//       sanitizedValue = value.replace(/\D/g, "").slice(0, 10);

//       setLeadData((prev) => ({ ...prev, contact: sanitizedValue }));

//       if (typingTimeout) clearTimeout(typingTimeout);

//       if (sanitizedValue.length === 10) {
//         const timeout = setTimeout(() => {
//           fetchExistingUser(sanitizedValue);
//         }, 1000);
//         setTypingTimeout(timeout);
//       }

//       return; // STOP ONLY CONTACT
//     }

//     // -----------------------------
//     // For name field when existing user
//     // -----------------------------
//     if (name === "name" && existingUser) return;

//     if (name === "name") {
//       sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
//     }

//     setLeadData((prev) => ({ ...prev, [name]: sanitizedValue }));

//     setErrors((prev) => ({
//       ...prev,
//       [name]: validateField(name, sanitizedValue),
//     }));
//   };

//   const validateField = (name, value) => {
//     switch (name) {
//       case "name":
//         if (!value.trim()) return "Customer Name is required";
//         if (value.length > 50) return "Name must be 50 characters or less";
//         if (!/^[a-zA-Z\s]+$/.test(value))
//           return "Name must contain only letters and spaces";
//         return "";

//       case "contact":
//         if (!value.trim()) return "Phone Number is required";
//         if (!/^\d{10}$/.test(value))
//           return "Phone Number must be exactly 10 digits";
//         return "";

//       case "googleAddress":
//         if (!value.trim()) return "Address is required";
//         return "";

//       case "city":
//         if (!value) return "City is required";
//         return "";

//       case "houseNo":
//         if (!value.trim()) return "House Number is required";
//         if (value.length > 50)
//           return "House Number must be 50 characters or less";
//         return "";

//       case "serviceType":
//         if (!value) return "Service Type is required";
//         return "";

//       case "slotDate":
//         if (!value) return "Service Date is required";
//         return "";

//       case "slotTime":
//         if (!value) return "Service Time is required";
//         return "";

//       case "totalAmount":
//         if (leadData.serviceType === "Deep Cleaning" && value === "")
//           return "Total Amount is required";
//         return "";

//       default:
//         return "";
//     }
//   };

//   const handleCategorySelect = (category) => {
//     setSelectedCategory(category);

//     setLeadData((prev) => ({
//       ...prev,
//       totalAmount: (prev.totalAmount || 0) + category.totalAmount,
//       bookingAmount: Math.round(
//         ((prev.totalAmount || 0) + category.totalAmount) * 0.2
//       ),
//     }));
//   };

//   const addPackage = () => {
//     const { selectedPackage, packages } = leadData;
//     if (selectedPackage && !packages.includes(selectedPackage)) {
//       const selectedCategory = categories.find(
//         (pkg) => pkg._id === selectedPackage
//       );
//       if (selectedCategory) {
//         const newTotal =
//           (leadData.totalAmount || 0) + selectedCategory.totalAmount;
//         setOriginalTotal(newTotal);
//         // reset any previous discount when packages change
//         setDiscountApplied(false);
//         setDiscountValue("");
//         setLeadData((prevState) => ({
//           ...prevState,
//           packages: [...prevState.packages, selectedCategory],
//           totalAmount: newTotal,
//           // booking amount is 20% of total (after discount if applied)
//           bookingAmount: Math.round(newTotal * 0.2),
//           selectedPackage: "",
//         }));
//       }
//     }
//   };

//   const removePackage = (pkgToRemove) => {
//     setLeadData((prevState) => ({
//       ...prevState,
//       packages: prevState.packages.filter((pkg) => pkg._id !== pkgToRemove._id),
//       totalAmount: (prevState.totalAmount || 0) - pkgToRemove.totalAmount,
//       bookingAmount: Math.round(
//         ((prevState.totalAmount || 0) - pkgToRemove.totalAmount) * 0.2
//       ),
//     }));
//     // update original total and clear discount
//     setOriginalTotal((orig) =>
//       Math.max(0, (orig || leadData.totalAmount || 0) - pkgToRemove.totalAmount)
//     );
//     setDiscountApplied(false);
//     setDiscountValue("");
//   };

//   // Unique subcategories (category field) from fetched packages
//   const uniqueDeepCategories = () => {
//     if (!Array.isArray(categories)) return [];
//     return [...new Set(categories.map((c) => c.category).filter(Boolean))];
//   };

//   const applyDiscount = () => {
//     const total = Number(originalTotal || leadData.totalAmount || 0);
//     if (!total || total <= 0) return;
//     let discounted = total;
//     const val = Number(discountValue || 0);
//     if (!val || val <= 0) return;

//     if (discountMode === "percent") {
//       discounted = total - (total * val) / 100;
//     } else {
//       discounted = total - val;
//     }
//     if (discounted < 0) discounted = 0;

//     setLeadData((prev) => ({
//       ...prev,
//       totalAmount: Math.round(discounted),
//       bookingAmount: Math.round(discounted * 0.2),
//     }));
//     setDiscountApplied(true);
//   };

//   const clearDiscount = () => {
//     const total = Number(originalTotal || leadData.totalAmount || 0);
//     setLeadData((prev) => ({
//       ...prev,
//       totalAmount: Math.round(total),
//       bookingAmount: Math.round(total * 0.2),
//     }));
//     setDiscountApplied(false);
//     setDiscountValue("");
//     setDiscountMode("percent");
//   };

//   const addCustomPackage = () => {
//     const trimmed = customPackage.trim();
//     const error = validateField("customPackage", trimmed);
//     if (error) {
//       setErrors((prev) => ({ ...prev, customPackage: error }));
//       return;
//     }
//     if (
//       trimmed &&
//       !leadData.packages.includes(trimmed) &&
//       leadData.packages.length < 2
//     ) {
//       setLeadData((prevState) => ({
//         ...prevState,
//         packages: [...prevState.packages, trimmed],
//       }));
//       setCustomPackage("");
//       setShowCustomInput(false);
//       setErrors((prev) => ({ ...prev, customPackage: "" }));
//     }
//   };

//   const toggleEdit = () => setIsEditing(!isEditing);

//   const handleTimeSelection = () => {
//     if (!isTimeSelectionEnabled) {
//       return;
//     }
//     setShowTime(true);
//   };

//   // handleSave updated only for customerId injection
//   const handleSave = async () => {
//     const required = [
//       "name",
//       "contact",
//       "houseNo",
//       "serviceType",
//       "slotDate",
//       "slotTime",
//       "googleAddress",
//       "bookingAmount",
//     ];

//     if (leadData.serviceType === "Deep Cleaning") {
//       required.push("totalAmount");
//     }

//     const newErrors = {};
//     let hasError = false;

//     required.forEach((field) => {
//       const error = validateField(field, leadData[field]);
//       newErrors[field] = error;
//       if (error) hasError = true;
//     });

//     setErrors(newErrors);

//     if (hasError) {
//       setError("Please fix all errors before submitting.");
//       return;
//     }

//     try {
//       setError("");
//       setIsSaving(true);

//       const now = new Date().toISOString();

//       const serviceArray =
//         leadData.serviceType === "House Painting"
//           ? [
//                 {
//                   category: "House Painting",
//                   serviceName: "House Painters & Waterproofing",
//                   price: Number(leadData.bookingAmount || 0),
//                   quantity: 1,
//                   teamMembersRequired: 0, // consistent schema (house painting typically no teamMembers by default)
//                 },
//               ]
//           : leadData.packages.map((pkg) => ({
//               category: "Deep Cleaning",
//               subCategory: pkg.category,
//               serviceName: pkg.name,
//               price: Number(pkg.totalAmount || 0),
//               quantity: 1,
//               teamMembersRequired: Number(pkg.teamMembers || 1),
//             }));

//       // 🟢 Updated customer object
//       // Ensure we have sensible numeric totals to send in payload
//       const computedPackageTotal =
//         leadData.packages && leadData.packages.length
//           ? leadData.packages.reduce(
//               (s, p) => s + Number(p.totalAmount || 0),
//               0
//             )
//           : 0;

//       const finalTotalToSend = Number(
//         leadData.totalAmount || computedPackageTotal || 0
//       );
//       const bookingAmountToSend = Number(leadData.bookingAmount || 0);

//       const bookingData = {
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

//         service: serviceArray,

//         bookingDetails: {
//           // siteVisitCharges only applies for House Painting
//           siteVisitCharges:
//             leadData.serviceType === "House Painting" ? bookingAmountToSend : 0,
//           paymentMethod: "None",
//           // Send the admin-chosen bookingAmount and final totals explicitly
//           bookingAmount: bookingAmountToSend,
//           // finalTotal is the amount payable for the booking (after any discount)
//           finalTotal: finalTotalToSend,
//           paidAmount: 0,

//         },

//         address: {
//           houseFlatNumber: leadData.houseNo || "",
//           streetArea: leadData.googleAddress || "",
//           landMark: leadData.landmark || "",
//           city: leadData.city || "",
//           location: {
//             type: "Point",
//             coordinates: [
//               leadData.coordinates.lng || 0,
//               leadData.coordinates.lat || 0,
//             ],
//           },
//         },

//         selectedSlot: {
//           slotDate: leadData.slotDate,
//           slotTime: leadData.slotTime,
//         },

//         formName: "admin panel",
//         isEnquiry: leadData.bookingAmount > 0 ? true : false, // ✅ FIXED HERE
//       };
//       console.log("bookingData to send:", bookingData);
//       await axios.post(
//         `${BASE_URL}/bookings/create-admin-booking`,
//         bookingData
//       );

//       toast.success(
//         `${
//           leadData.bookingAmount == 0
//             ? "Lead created successfully!"
//             : " Enquiry created successfully!"
//         }`,
//         {
//           autoClose: 1500,
//           onClose: () => {
//             onClose();
//             navigate("/");
//             setIsSaving(false);
//             // window.location.reload();
//           },
//         }
//       );
//     } catch (err) {
//       console.error(err);
//       setError("Failed to create booking. Try again.");
//     }
//   };

//   return (
//     <div style={styles.modalOverlay}>
//       <div style={styles.modal}>
//         <div style={styles.headerContainer}>
//           <h6 style={styles.heading}>Create New Lead/Enquiry</h6>
//           <FaTimes style={styles.closeIcon} onClick={onClose} />
//         </div>

//         <div style={styles.modalContent}>
//           {error && (
//             <div style={{ color: "red", marginBottom: 10, fontSize: 12 }}>
//               {error}
//             </div>
//           )}
//           {success && (
//             <div style={{ color: "green", marginBottom: 10, fontSize: 12 }}>
//               {success}
//             </div>
//           )}

//           <div>
//             <input
//               type="text"
//               name="contact"
//               placeholder="Customer Phone No."
//               style={styles.input}
//               onChange={handleChange}
//               value={leadData.contact}
//             />
//             {errors.contact && (
//               <div
//                 style={{
//                   color: "red",
//                   fontSize: 12,
//                   marginTop: -6,
//                   marginBottom: 6,
//                 }}
//               >
//                 {errors.contact}
//               </div>
//             )}
//           </div>

//           <div>
//             <input
//               type="text"
//               name="name"
//               placeholder="Customer Name"
//               style={styles.input}
//               onChange={handleChange}
//               value={leadData.name}
//               readOnly={!!existingUser}
//             />
//             {errors.name && (
//               <div
//                 style={{
//                   color: "red",
//                   fontSize: 12,
//                   marginTop: -6,
//                   marginBottom: 6,
//                 }}
//               >
//                 {errors.name}
//               </div>
//             )}
//           </div>

//           <div>
//             <input
//               type="text"
//               name="googleAddress"
//               placeholder="Google Address (click to pick)"
//               style={{ ...styles.input, cursor: "pointer" }}
//               onClick={() => setShowAddress(true)}
//               value={leadData.googleAddress}
//               readOnly
//             />
//             {errors.googleAddress && (
//               <div
//                 style={{
//                   color: "red",
//                   fontSize: 12,
//                   marginTop: -6,
//                   marginBottom: 6,
//                 }}
//               >
//                 {errors.googleAddress}
//               </div>
//             )}
//           </div>

//           <div>
//             <input
//               type="text"
//               name="houseNo"
//               placeholder="House No."
//               style={styles.input}
//               onChange={handleChange}
//               value={leadData.houseNo}
//             />
//             {errors.houseNo && (
//               <div
//                 style={{
//                   color: "red",
//                   fontSize: 12,
//                   marginTop: -6,
//                   marginBottom: 6,
//                 }}
//               >
//                 {errors.houseNo}
//               </div>
//             )}
//           </div>

//           <div>
//             <div
//               onClick={handleTimeSelection}
//               style={{
//                 ...styles.input,
//                 display: "flex",
//                 alignItems: "center",
//                 cursor: isTimeSelectionEnabled ? "pointer" : "not-allowed",
//                 color: leadData.slotDate && leadData.slotTime ? "#111" : "#777",
//                 background: isTimeSelectionEnabled ? "#fff" : "#f5f5f5",
//                 opacity: isTimeSelectionEnabled ? 1 : 0.6,
//                 border: isTimeSelectionEnabled
//                   ? "1px solid #ccc"
//                   : "1px solid #ddd",
//               }}
//             >
//               {leadData.slotDate && leadData.slotTime
//                 ? `${leadData.slotTime}, ${leadData.slotDate}`
//                 : isTimeSelectionEnabled
//                 ? "Select service start date & time"
//                 : "Fill address and city first to select time"}
//             </div>
//             {!isTimeSelectionEnabled && (
//               <div
//                 style={{
//                   color: "#666",
//                   fontSize: 11,
//                   marginTop: -8,
//                   marginBottom: 6,
//                   fontStyle: "italic",
//                 }}
//               >
//                 Please fill address and city to enable time selection
//               </div>
//             )}
//             {(errors.slotDate || errors.slotTime) && (
//               <div
//                 style={{
//                   color: "red",
//                   fontSize: 12,
//                   marginTop: -6,
//                   marginBottom: 6,
//                 }}
//               >
//                 {errors.slotDate || errors.slotTime}
//               </div>
//             )}
//           </div>

//           <div>
//             <input
//               type="text"
//               name="city"
//               placeholder="Detected City"
//               value={leadData.city || ""}
//               style={{
//                 ...styles.input,
//                 backgroundColor: "#f9f9f9",
//                 color: "#555",
//                 cursor: "not-allowed",
//               }}
//               readOnly
//               disabled
//             />
//             {errors.city && (
//               <div
//                 style={{
//                   color: "red",
//                   fontSize: 12,
//                   marginTop: -6,
//                   marginBottom: 6,
//                 }}
//               >
//                 {errors.city}
//               </div>
//             )}
//           </div>

//           <div>
//             <select
//               name="serviceType"
//               style={styles.input}
//               onChange={handleChange}
//               value={leadData.serviceType || ""}
//             >
//               <option value="" disabled>
//                 Select Service
//               </option>
//               <option value="House Painting">House Painting</option>
//               <option value="Deep Cleaning">Deep Cleaning</option>
//             </select>
//             {errors.serviceType && (
//               <div
//                 style={{
//                   color: "red",
//                   fontSize: 12,
//                   marginTop: -6,
//                   marginBottom: 6,
//                 }}
//               >
//                 {errors.serviceType}
//               </div>
//             )}
//           </div>

//           {leadData.serviceType === "Deep Cleaning" && (
//             <div style={styles.packageSelectionContainer}>
//               <div>
//                 {/* Subcategory selector (category field in API) */}
//                 <select
//                   onChange={(e) => {
//                     setSelectedSubCategory(e.target.value);
//                     // reset selected package when subcategory changes
//                     setLeadData((prev) => ({ ...prev, selectedPackage: "" }));
//                   }}
//                   value={selectedSubCategory || ""}
//                   style={styles.input}
//                 >
//                   <option value="" disabled>
//                     Select Subcategory
//                   </option>
//                   {uniqueDeepCategories().map((cat) => (
//                     <option key={cat} value={cat}>
//                       {cat}
//                     </option>
//                   ))}
//                 </select>

//                 <div style={styles.packageSelectorContainer}>
//                   <select
//                     onChange={(e) =>
//                       setLeadData((prev) => ({
//                         ...prev,
//                         selectedPackage: e.target.value,
//                       }))
//                     }
//                     value={leadData.selectedPackage || ""}
//                     style={styles.selectBox}
//                     disabled={!selectedSubCategory}
//                   >
//                     <option value="" disabled>
//                       Select Package
//                     </option>
//                     {categories
//                       .filter((c) => c.category === selectedSubCategory)
//                       .map((category) => (
//                         <option key={category._id} value={category._id}>
//                           {category.name} - ₹{category.totalAmount}
//                         </option>
//                       ))}
//                   </select>

//                   <button onClick={addPackage} style={styles.addButton}>
//                     +
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {leadData.serviceType === "Deep Cleaning" && (
//             <div style={styles.selectedPackagesContainer}>
//               <ul style={styles.packageList}>
//                 {leadData.packages.map((pkg) => (
//                   <li key={pkg._id} style={styles.packageItem}>
//                     <span style={styles.packageName}>
//                       {pkg.name} - ₹{pkg.totalAmount}
//                     </span>
//                     <FaTimes
//                       style={styles.removeIcon}
//                       onClick={() => removePackage(pkg)}
//                     />
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {leadData.serviceType === "Deep Cleaning" && (
//             <>
//               <label style={{ fontSize: 12, fontWeight: 600 }}>
//                 Total Amount
//               </label>
//               {!isEditing ? (
//                 <div
//                   onClick={toggleEdit}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     cursor: "pointer",
//                     marginBottom: 10,
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
//                     marginBottom: 10,
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
//               {errors.totalAmount && (
//                 <div
//                   style={{
//                     color: "red",
//                     fontSize: 12,
//                     marginTop: -6,
//                     marginBottom: 6,
//                   }}
//                 >
//                   {errors.totalAmount}
//                 </div>
//               )}
//             </>
//           )}

//           {/* Discount controls for Deep Cleaning */}
//           {leadData.serviceType === "Deep Cleaning" && (
//             <div style={{ marginTop: 12, marginBottom: 12 }}>
//               {/* <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                 <strong>Total:</strong>
//                 <span>₹{leadData.totalAmount || 0}</span>
//                 <strong style={{ marginLeft: 12 }}>Booking (20%):</strong>
//                 <span>₹{leadData.bookingAmount || 0}</span>
//               </div> */}

//               {!discountApplied ? (
//                 <div style={styles.discountContainer}>
//                   <select
//                     value={discountMode}
//                     onChange={(e) => setDiscountMode(e.target.value)}
//                     style={styles.discountModeSelect}
//                   >
//                     <option value="percent">% Discount</option>
//                     <option value="amount">Fixed Amount</option>
//                   </select>
//                   <input
//                     type="number"
//                     value={discountValue}
//                     onChange={(e) => setDiscountValue(e.target.value)}
//                     placeholder={
//                       discountMode === "percent" ? "eg. 10" : "eg. 200"
//                     }
//                     style={styles.discountInput}
//                   />
//                   <button onClick={applyDiscount} style={styles.discountButton}>
//                     Apply Discount
//                   </button>
//                 </div>
//               ) : (
//                 <div style={styles.discountAppliedContainer}>
//                   <span style={styles.discountAppliedText}>
//                     Discount applied:{" "}
//                     {discountMode === "percent"
//                       ? `${discountValue}%`
//                       : `₹${discountValue}`}
//                   </span>
//                   <button
//                     onClick={clearDiscount}
//                     style={styles.removeDiscountButton}
//                   >
//                     <MdCancel />
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}

//           {(leadData.serviceType === "Deep Cleaning" ||
//             leadData.serviceType === "House Painting") && (
//             <>
//               <label style={{ fontSize: 12, fontWeight: 600 }}>
//                 Booking Amount
//               </label>
//               <input
//                 type="text"
//                 name="bookingAmount"
//                 placeholder="Booking Amount"
//                 value={leadData.bookingAmount}
//                 style={styles.input}
//                 onChange={handleChange}
//               />
//               {errors.bookingAmount && (
//                 <div
//                   style={{
//                     color: "red",
//                     fontSize: 12,
//                     marginTop: -6,
//                     marginBottom: 6,
//                   }}
//                 >
//                   {errors.bookingAmount}
//                 </div>
//               )}
//             </>
//           )}

//           {leadData.serviceType === "Deep Cleaning" && (
//             <>
//               <label style={{ fontSize: 12, fontWeight: 600 }}>
//                 Amount yet to pay
//               </label>
//               <p style={styles.input}>
//                 {leadData.totalAmount - leadData.bookingAmount}
//               </p>
//             </>
//           )}
//           <div style={styles.actions}>
//             <button style={styles.buttonConfirm} onClick={handleSave}>
//               {isSaving ? "Saving..." : "Save"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {showAddress && (
//         <AddressPickerModal
//           initialAddress={leadData.googleAddress}
//           initialLatLng={
//             leadData.coordinates.lat
//               ? { lat: leadData.coordinates.lat, lng: leadData.coordinates.lng }
//               : undefined
//           }
//           onClose={() => setShowAddress(false)}
//           onSelect={(sel) =>
//             setLeadData((p) => ({
//               ...p,
//               googleAddress: sel.formattedAddress,
//               houseNo: sel.houseFlatNumber || p.houseNo,
//               landmark: sel.landmark || p.landmark,
//               coordinates: { lat: sel.lat, lng: sel.lng },
//               city: sel.city || p.city,
//             }))
//           }
//         />
//       )}

//       {showTime && (
//         <TimePickerModal
//           onClose={() => setShowTime(false)}
//           onSelect={(sel) =>
//             setLeadData((p) => ({
//               ...p,
//               timeSlot: sel.isoLocal,
//               slotDate: sel.slotDate,
//               slotTime: sel.slotTime,
//             }))
//           }
//         />
//       )}

//       <ToastContainer
//         position="top-right"
//         autoClose={1500}
//         style={{ marginTop: "40px" }}
//       />
//     </div>
//   );
// };

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
//     width: "560px",
//     maxWidth: "90vw",
//     maxHeight: "80vh",
//     display: "flex",
//     flexDirection: "column",
//     boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
//     overflow: "hidden",
//   },
//   heading: {
//     fontSize: "16px",
//     fontWeight: "bold",
//     textAlign: "center",
//     marginBottom: "12px",
//     whiteSpace: "nowrap",
//   },
//   headerContainer: {
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: "12px",
//   },
//   modalContent: {
//     maxHeight: "70vh",
//     overflowY: "auto",
//     paddingRight: "10px",
//     backgroundColor: "#fff",
//     borderRadius: "8px",
//     padding: "20px",
//     marginTop: 0,
//     scrollbarWidth: "none",
//     msOverflowStyle: "none",
//   },
//   "@global": {
//     ".modalContent::-webkit-scrollbar": { display: "none" },
//   },
//   input: {
//     width: "100%",
//     padding: "10px",
//     marginBottom: "10px",
//     borderRadius: "5px",
//     fontSize: "12px",
//     border: "1px solid #ccc",
//     background: "#fff",
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
//   closeIcon: {
//     cursor: "pointer",
//     fontSize: "18px",
//   },
//   packageSelectionContainer: {
//     marginBottom: "20px",
//   },
//   label: {
//     fontSize: "14px",
//     fontWeight: "bold",
//     marginBottom: "10px",
//     color: "#333",
//   },
//   packageSelectorContainer: {
//     display: "flex",
//     alignItems: "center",
//     gap: "10px",
//   },
//   selectBox: {
//     flex: 1,
//     padding: "8px 12px",
//     fontSize: "14px",
//     borderRadius: "4px",
//     border: "1px solid #ddd",
//     backgroundColor: "#fff",
//     color: "#333",
//     cursor: "pointer",
//     whiteSpace: "normal",
//   },
//   addButton: {
//     padding: "8px 12px",
//     backgroundColor: "#4CAF50",
//     color: "#fff",
//     border: "none",
//     borderRadius: "4px",
//     cursor: "pointer",
//     fontSize: "16px",
//     transition: "background-color 0.3s ease",
//   },
//   addButtonDisabled: {
//     backgroundColor: "#ccc",
//     cursor: "not-allowed",
//   },
//   selectedPackagesContainer: {
//     marginTop: "20px",
//   },
//   packageList: {
//     listStyleType: "none",
//     padding: 0,
//     margin: 0,
//   },
//   packageItem: {
//     backgroundColor: "#f9f9f9",
//     padding: "10px",
//     marginBottom: "10px",
//     borderRadius: "8px",
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     gap: "8px",
//     fontSize: "14px",
//     color: "#333",
//     boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
//   },
//   packageName: {
//     flex: 1,
//     wordBreak: "break-word",
//     whiteSpace: "normal",
//   },
//   removeIcon: {
//     cursor: "pointer",
//     color: "#d9534f",
//     fontSize: "11px",
//     transition: "color 0.3s ease",
//   },
//   removeIconHover: {
//     color: "#c9302c",
//   },
//   discountContainer: {
//     display: "flex",
//     gap: 8,
//     alignItems: "center",
//     marginTop: 8,
//   },
//   discountModeSelect: {
//     padding: 8,
//     borderRadius: 4,
//     border: "1px solid #ddd",
//     backgroundColor: "#fff",
//     fontSize: 13,
//   },
//   discountInput: {
//     padding: 8,
//     width: 140,
//     borderRadius: 4,
//     border: "1px solid #ddd",
//     fontSize: 13,
//   },
//   discountButton: {
//     padding: "4px 12px",
//     backgroundColor: "#0d6efd",
//     color: "#fff",
//     border: "none",
//     borderRadius: 4,
//     cursor: "pointer",
//     fontSize: 12,
//   },
//   discountAppliedContainer: {
//     display: "flex",
//     gap: 12,
//     alignItems: "center",
//     // marginTop: 8,
//   },
//   discountAppliedText: {
//     fontSize: 14,
//   },
//   removeDiscountButton: {
//     padding: "6px",
//     backgroundColor: "transparent",
//     color: "#dc3545",
//     border: "none",
//     borderRadius: 4,
//     cursor: "pointer",
//   },
// };

// export default CreateLeadModal;
