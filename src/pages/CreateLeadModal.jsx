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
  const [isEditing, setIsEditing] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customPackage, setCustomPackage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddress, setShowAddress] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // 👇 NEW STATES
  const [existingUser, setExistingUser] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const navigate = useNavigate();
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
    bookingAmount: "",
    packages: [],
    selectedPackage: "",
    coordinates: { lat: 0, lng: 0 },
    formName: "admin panel",
    createdDate: "",
    createdTime: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [originalTotal, setOriginalTotal] = useState(0); // keep pre-discount total
  const [discountMode, setDiscountMode] = useState("percent"); // 'percent' or 'amount'
  const [discountValue, setDiscountValue] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);

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

  const isTimeSelectionEnabled = leadData.googleAddress && leadData.city;

  useEffect(() => {
    if (!leadData.googleAddress) return;

    const addr = leadData.googleAddress.toLowerCase();
    let detectedCity = "";

    if (addr.includes("bengaluru")) detectedCity = "Bengaluru";
    else if (addr.includes("mysuru")) detectedCity = "Mysuru";
    else if (addr.includes("pune")) detectedCity = "Pune";
    else detectedCity = "";

    if (detectedCity && leadData.city !== detectedCity) {
      setLeadData((prev) => ({ ...prev, city: detectedCity }));
    }
  }, [leadData.googleAddress]);

  useEffect(() => {
    console.log("leadData", leadData);
  }, [leadData]);

  // ----------------------------------------------------------
  // 🟢 NEW FUNCTION — Fetch existing user by phone number
  // ----------------------------------------------------------
  const fetchExistingUser = async (mobile) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/user/finding-user-exist/mobilenumber`,
        { mobileNumber: mobile }
      );

      if (response.data?.isNewUser === false) {
        const user = response.data.data;
        setExistingUser(user);

        const addr = user.savedAddress || {};

        // Autofill details from API
        setLeadData((prev) => ({
          ...prev,
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

        toast.success("Existing user loaded");
      } else {
        // New user → clear previous autofill
        setExistingUser(null);
        setLeadData((prev) => ({
          ...prev,
          name: "",
          googleAddress: "",
          houseNo: "",
          landmark: "",
          city: "",
        }));
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // -----------------------------
    // FIRST: handle serviceType API
    // -----------------------------
    if (name === "serviceType") {
      sanitizedValue = value;

      if (value === "House Painting") {
        try {
          const response = await axios.get(`${BASE_URL}/service/latest`);
          const siteVisitCharge = response.data.data.siteVisitCharge || 0;

          setLeadData((prev) => ({
            ...prev,
            serviceType: value,
            bookingAmount: siteVisitCharge,
          }));
        } catch (err) {
          console.error("Error fetching site visit charge:", err);
        }
      } else if (value === "Deep Cleaning") {
        try {
          const response = await axios.get(
            `${BASE_URL}/deeppackage/deep-cleaning-packages`
          );

          setCategories(
            response?.data?.data ||
              response?.data?.packages ||
              response?.data ||
              []
          );

          // reset Deep Cleaning selections
          setSelectedSubCategory("");
          setOriginalTotal(0);
          setDiscountApplied(false);
          setDiscountValue("");

          setLeadData((prev) => ({
            ...prev,
            serviceType: value,
            selectedPackage: "",
            totalAmount: 0,
            bookingAmount: 0,
            packages: [],
          }));
        } catch (err) {
          console.error("Error fetching deep cleaning packages:", err);
        }
      }

      return; // stop here
    }

    // -----------------------------
    // CONTACT NUMBER (debounce)
    // -----------------------------
    if (name === "contact") {
      sanitizedValue = value.replace(/\D/g, "").slice(0, 10);

      setLeadData((prev) => ({ ...prev, contact: sanitizedValue }));

      if (typingTimeout) clearTimeout(typingTimeout);

      if (sanitizedValue.length === 10) {
        const timeout = setTimeout(() => {
          fetchExistingUser(sanitizedValue);
        }, 1000);
        setTypingTimeout(timeout);
      }

      return; // STOP ONLY CONTACT
    }

    // -----------------------------
    // For name field when existing user
    // -----------------------------
    if (name === "name" && existingUser) return;

    if (name === "name") {
      sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    setLeadData((prev) => ({ ...prev, [name]: sanitizedValue }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, sanitizedValue),
    }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Customer Name is required";
        if (value.length > 50) return "Name must be 50 characters or less";
        if (!/^[a-zA-Z\s]+$/.test(value))
          return "Name must contain only letters and spaces";
        return "";

      case "contact":
        if (!value.trim()) return "Phone Number is required";
        if (!/^\d{10}$/.test(value))
          return "Phone Number must be exactly 10 digits";
        return "";

      case "googleAddress":
        if (!value.trim()) return "Address is required";
        return "";

      case "city":
        if (!value) return "City is required";
        return "";

      case "houseNo":
        if (!value.trim()) return "House Number is required";
        if (value.length > 50)
          return "House Number must be 50 characters or less";
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
        if (leadData.serviceType === "Deep Cleaning" && value === "")
          return "Total Amount is required";
        return "";

      default:
        return "";
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);

    setLeadData((prev) => ({
      ...prev,
      totalAmount: (prev.totalAmount || 0) + category.totalAmount,
      bookingAmount: Math.round(
        ((prev.totalAmount || 0) + category.totalAmount) * 0.2
      ),
    }));
  };

  const addPackage = () => {
    const { selectedPackage, packages } = leadData;
    if (selectedPackage && !packages.includes(selectedPackage)) {
      const selectedCategory = categories.find(
        (pkg) => pkg._id === selectedPackage
      );
      if (selectedCategory) {
        const newTotal =
          (leadData.totalAmount || 0) + selectedCategory.totalAmount;
        setOriginalTotal(newTotal);
        // reset any previous discount when packages change
        setDiscountApplied(false);
        setDiscountValue("");
        setLeadData((prevState) => ({
          ...prevState,
          packages: [...prevState.packages, selectedCategory],
          totalAmount: newTotal,
          // booking amount is 20% of total (after discount if applied)
          bookingAmount: Math.round(newTotal * 0.2),
          selectedPackage: "",
        }));
      }
    }
  };

  const removePackage = (pkgToRemove) => {
    setLeadData((prevState) => ({
      ...prevState,
      packages: prevState.packages.filter((pkg) => pkg._id !== pkgToRemove._id),
      totalAmount: (prevState.totalAmount || 0) - pkgToRemove.totalAmount,
      bookingAmount: Math.round(
        ((prevState.totalAmount || 0) - pkgToRemove.totalAmount) * 0.2
      ),
    }));
    // update original total and clear discount
    setOriginalTotal((orig) =>
      Math.max(0, (orig || leadData.totalAmount || 0) - pkgToRemove.totalAmount)
    );
    setDiscountApplied(false);
    setDiscountValue("");
  };

  // Unique subcategories (category field) from fetched packages
  const uniqueDeepCategories = () => {
    if (!Array.isArray(categories)) return [];
    return [...new Set(categories.map((c) => c.category).filter(Boolean))];
  };

  const applyDiscount = () => {
    const total = Number(originalTotal || leadData.totalAmount || 0);
    if (!total || total <= 0) return;
    let discounted = total;
    const val = Number(discountValue || 0);
    if (!val || val <= 0) return;

    if (discountMode === "percent") {
      discounted = total - (total * val) / 100;
    } else {
      discounted = total - val;
    }
    if (discounted < 0) discounted = 0;

    setLeadData((prev) => ({
      ...prev,
      totalAmount: Math.round(discounted),
      bookingAmount: Math.round(discounted * 0.2),
    }));
    setDiscountApplied(true);
  };

  const clearDiscount = () => {
    const total = Number(originalTotal || leadData.totalAmount || 0);
    setLeadData((prev) => ({
      ...prev,
      totalAmount: Math.round(total),
      bookingAmount: Math.round(total * 0.2),
    }));
    setDiscountApplied(false);
    setDiscountValue("");
    setDiscountMode("percent");
  };

  const addCustomPackage = () => {
    const trimmed = customPackage.trim();
    const error = validateField("customPackage", trimmed);
    if (error) {
      setErrors((prev) => ({ ...prev, customPackage: error }));
      return;
    }
    if (
      trimmed &&
      !leadData.packages.includes(trimmed) &&
      leadData.packages.length < 2
    ) {
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

  const handleTimeSelection = () => {
    if (!isTimeSelectionEnabled) {
      return;
    }
    setShowTime(true);
  };

  // handleSave updated only for customerId injection
  const handleSave = async () => {
    const required = [
      "name",
      "contact",
      "houseNo",
      "serviceType",
      "slotDate",
      "slotTime",
      "googleAddress",
      "bookingAmount",
    ];

    if (leadData.serviceType === "Deep Cleaning") {
      required.push("totalAmount");
    }

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
      setIsSaving(true);

      const now = new Date().toISOString();

      const serviceArray =
        leadData.serviceType === "House Painting"
          ? [
                {
                  category: "House Painting",
                  serviceName: "House Painters & Waterproofing",
                  price: Number(leadData.bookingAmount || 0),
                  quantity: 1,
                  teamMembersRequired: 0, // consistent schema (house painting typically no teamMembers by default)
                },
              ]
          : leadData.packages.map((pkg) => ({
              category: "Deep Cleaning",
              subCategory: pkg.category,
              serviceName: pkg.name,
              price: Number(pkg.totalAmount || 0),
              quantity: 1,
              teamMembersRequired: Number(pkg.teamMembers || 1),
            }));

      // 🟢 Updated customer object
      // Ensure we have sensible numeric totals to send in payload
      const computedPackageTotal =
        leadData.packages && leadData.packages.length
          ? leadData.packages.reduce(
              (s, p) => s + Number(p.totalAmount || 0),
              0
            )
          : 0;

      const finalTotalToSend = Number(
        leadData.totalAmount || computedPackageTotal || 0
      );
      const bookingAmountToSend = Number(leadData.bookingAmount || 0);

      const bookingData = {
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

        service: serviceArray,

        bookingDetails: {
          // siteVisitCharges only applies for House Painting
          siteVisitCharges:
            leadData.serviceType === "House Painting" ? bookingAmountToSend : 0,
          paymentMethod: "None",
          // Send the admin-chosen bookingAmount and final totals explicitly
          bookingAmount: bookingAmountToSend,
          // finalTotal is the amount payable for the booking (after any discount)
          finalTotal: finalTotalToSend,
          paidAmount: 0,
     
        },

        address: {
          houseFlatNumber: leadData.houseNo || "",
          streetArea: leadData.googleAddress || "",
          landMark: leadData.landmark || "",
          city: leadData.city || "",
          location: {
            type: "Point",
            coordinates: [
              leadData.coordinates.lng || 0,
              leadData.coordinates.lat || 0,
            ],
          },
        },

        selectedSlot: {
          slotDate: leadData.slotDate,
          slotTime: leadData.slotTime,
        },

        formName: "admin panel",
        isEnquiry: leadData.bookingAmount > 0 ? true : false, // ✅ FIXED HERE
      };
      console.log("bookingData to send:", bookingData);
      await axios.post(
        `${BASE_URL}/bookings/create-admin-booking`,
        bookingData
      );

      toast.success(
        `${
          leadData.bookingAmount == 0
            ? "Lead created successfully!"
            : " Enquiry created successfully!"
        }`,
        {
          autoClose: 1500,
          onClose: () => {
            onClose();
            navigate("/");
            setIsSaving(false);
            // window.location.reload();
          },
        }
      );
    } catch (err) {
      console.error(err);
      setError("Failed to create booking. Try again.");
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.headerContainer}>
          <h6 style={styles.heading}>Create New Lead/Enquiry</h6>
          <FaTimes style={styles.closeIcon} onClick={onClose} />
        </div>

        <div style={styles.modalContent}>
          {error && (
            <div style={{ color: "red", marginBottom: 10, fontSize: 12 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ color: "green", marginBottom: 10, fontSize: 12 }}>
              {success}
            </div>
          )}

          <div>
            <input
              type="text"
              name="contact"
              placeholder="Customer Phone No."
              style={styles.input}
              onChange={handleChange}
              value={leadData.contact}
            />
            {errors.contact && (
              <div
                style={{
                  color: "red",
                  fontSize: 12,
                  marginTop: -6,
                  marginBottom: 6,
                }}
              >
                {errors.contact}
              </div>
            )}
          </div>

          <div>
            <input
              type="text"
              name="name"
              placeholder="Customer Name"
              style={styles.input}
              onChange={handleChange}
              value={leadData.name}
              readOnly={!!existingUser}
            />
            {errors.name && (
              <div
                style={{
                  color: "red",
                  fontSize: 12,
                  marginTop: -6,
                  marginBottom: 6,
                }}
              >
                {errors.name}
              </div>
            )}
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
            {errors.googleAddress && (
              <div
                style={{
                  color: "red",
                  fontSize: 12,
                  marginTop: -6,
                  marginBottom: 6,
                }}
              >
                {errors.googleAddress}
              </div>
            )}
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
            {errors.houseNo && (
              <div
                style={{
                  color: "red",
                  fontSize: 12,
                  marginTop: -6,
                  marginBottom: 6,
                }}
              >
                {errors.houseNo}
              </div>
            )}
          </div>

          <div>
            <div
              onClick={handleTimeSelection}
              style={{
                ...styles.input,
                display: "flex",
                alignItems: "center",
                cursor: isTimeSelectionEnabled ? "pointer" : "not-allowed",
                color: leadData.slotDate && leadData.slotTime ? "#111" : "#777",
                background: isTimeSelectionEnabled ? "#fff" : "#f5f5f5",
                opacity: isTimeSelectionEnabled ? 1 : 0.6,
                border: isTimeSelectionEnabled
                  ? "1px solid #ccc"
                  : "1px solid #ddd",
              }}
            >
              {leadData.slotDate && leadData.slotTime
                ? `${leadData.slotTime}, ${leadData.slotDate}`
                : isTimeSelectionEnabled
                ? "Select service start date & time"
                : "Fill address and city first to select time"}
            </div>
            {!isTimeSelectionEnabled && (
              <div
                style={{
                  color: "#666",
                  fontSize: 11,
                  marginTop: -8,
                  marginBottom: 6,
                  fontStyle: "italic",
                }}
              >
                Please fill address and city to enable time selection
              </div>
            )}
            {(errors.slotDate || errors.slotTime) && (
              <div
                style={{
                  color: "red",
                  fontSize: 12,
                  marginTop: -6,
                  marginBottom: 6,
                }}
              >
                {errors.slotDate || errors.slotTime}
              </div>
            )}
          </div>

          <div>
            <input
              type="text"
              name="city"
              placeholder="Detected City"
              value={leadData.city || ""}
              style={{
                ...styles.input,
                backgroundColor: "#f9f9f9",
                color: "#555",
                cursor: "not-allowed",
              }}
              readOnly
              disabled
            />
            {errors.city && (
              <div
                style={{
                  color: "red",
                  fontSize: 12,
                  marginTop: -6,
                  marginBottom: 6,
                }}
              >
                {errors.city}
              </div>
            )}
          </div>

          <div>
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
            {errors.serviceType && (
              <div
                style={{
                  color: "red",
                  fontSize: 12,
                  marginTop: -6,
                  marginBottom: 6,
                }}
              >
                {errors.serviceType}
              </div>
            )}
          </div>

          {leadData.serviceType === "Deep Cleaning" && (
            <div style={styles.packageSelectionContainer}>
              <div>
                {/* Subcategory selector (category field in API) */}
                <select
                  onChange={(e) => {
                    setSelectedSubCategory(e.target.value);
                    // reset selected package when subcategory changes
                    setLeadData((prev) => ({ ...prev, selectedPackage: "" }));
                  }}
                  value={selectedSubCategory || ""}
                  style={styles.input}
                >
                  <option value="" disabled>
                    Select Subcategory
                  </option>
                  {uniqueDeepCategories().map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <div style={styles.packageSelectorContainer}>
                  <select
                    onChange={(e) =>
                      setLeadData((prev) => ({
                        ...prev,
                        selectedPackage: e.target.value,
                      }))
                    }
                    value={leadData.selectedPackage || ""}
                    style={styles.selectBox}
                    disabled={!selectedSubCategory}
                  >
                    <option value="" disabled>
                      Select Package
                    </option>
                    {categories
                      .filter((c) => c.category === selectedSubCategory)
                      .map((category) => (
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
            </div>
          )}

          {leadData.serviceType === "Deep Cleaning" && (
            <div style={styles.selectedPackagesContainer}>
              <ul style={styles.packageList}>
                {leadData.packages.map((pkg) => (
                  <li key={pkg._id} style={styles.packageItem}>
                    <span style={styles.packageName}>
                      {pkg.name} - ₹{pkg.totalAmount}
                    </span>
                    <FaTimes
                      style={styles.removeIcon}
                      onClick={() => removePackage(pkg)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {leadData.serviceType === "Deep Cleaning" && (
            <>
              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Total Amount
              </label>
              {!isEditing ? (
                <div
                  onClick={toggleEdit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    marginBottom: 10,
                  }}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
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
              {errors.totalAmount && (
                <div
                  style={{
                    color: "red",
                    fontSize: 12,
                    marginTop: -6,
                    marginBottom: 6,
                  }}
                >
                  {errors.totalAmount}
                </div>
              )}
            </>
          )}

          {/* Discount controls for Deep Cleaning */}
          {leadData.serviceType === "Deep Cleaning" && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              {/* <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <strong>Total:</strong>
                <span>₹{leadData.totalAmount || 0}</span>
                <strong style={{ marginLeft: 12 }}>Booking (20%):</strong>
                <span>₹{leadData.bookingAmount || 0}</span>
              </div> */}

              {!discountApplied ? (
                <div style={styles.discountContainer}>
                  <select
                    value={discountMode}
                    onChange={(e) => setDiscountMode(e.target.value)}
                    style={styles.discountModeSelect}
                  >
                    <option value="percent">% Discount</option>
                    <option value="amount">Fixed Amount</option>
                  </select>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={
                      discountMode === "percent" ? "eg. 10" : "eg. 200"
                    }
                    style={styles.discountInput}
                  />
                  <button onClick={applyDiscount} style={styles.discountButton}>
                    Apply Discount
                  </button>
                </div>
              ) : (
                <div style={styles.discountAppliedContainer}>
                  <span style={styles.discountAppliedText}>
                    Discount applied:{" "}
                    {discountMode === "percent"
                      ? `${discountValue}%`
                      : `₹${discountValue}`}
                  </span>
                  <button
                    onClick={clearDiscount}
                    style={styles.removeDiscountButton}
                  >
                    <MdCancel />
                  </button>
                </div>
              )}
            </div>
          )}

          {(leadData.serviceType === "Deep Cleaning" ||
            leadData.serviceType === "House Painting") && (
            <>
              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Booking Amount
              </label>
              <input
                type="text"
                name="bookingAmount"
                placeholder="Booking Amount"
                value={leadData.bookingAmount}
                style={styles.input}
                onChange={handleChange}
              />
              {errors.bookingAmount && (
                <div
                  style={{
                    color: "red",
                    fontSize: 12,
                    marginTop: -6,
                    marginBottom: 6,
                  }}
                >
                  {errors.bookingAmount}
                </div>
              )}
            </>
          )}

          {leadData.serviceType === "Deep Cleaning" && (
            <>
              <label style={{ fontSize: 12, fontWeight: 600 }}>
                Amount yet to pay
              </label>
              <p style={styles.input}>
                {leadData.totalAmount - leadData.bookingAmount}
              </p>
            </>
          )}
          <div style={styles.actions}>
            <button style={styles.buttonConfirm} onClick={handleSave}>
              {isSaving ? "Saving..." : "Save"}
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
              city: sel.city || p.city,
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

      <ToastContainer
        position="top-right"
        autoClose={1500}
        style={{ marginTop: "40px" }}
      />
    </div>
  );
};

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
    width: "560px",
    maxWidth: "90vw",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },
  heading: {
    fontSize: "16px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "12px",
    whiteSpace: "nowrap",
  },
  headerContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  modalContent: {
    maxHeight: "70vh",
    overflowY: "auto",
    paddingRight: "10px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "20px",
    marginTop: 0,
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
  closeIcon: {
    cursor: "pointer",
    fontSize: "18px",
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
    whiteSpace: "normal",
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
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "14px",
    color: "#333",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
  },
  packageName: {
    flex: 1,
    wordBreak: "break-word",
    whiteSpace: "normal",
  },
  removeIcon: {
    cursor: "pointer",
    color: "#d9534f",
    fontSize: "11px",
    transition: "color 0.3s ease",
  },
  removeIconHover: {
    color: "#c9302c",
  },
  discountContainer: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  discountModeSelect: {
    padding: 8,
    borderRadius: 4,
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    fontSize: 13,
  },
  discountInput: {
    padding: 8,
    width: 140,
    borderRadius: 4,
    border: "1px solid #ddd",
    fontSize: 13,
  },
  discountButton: {
    padding: "4px 12px",
    backgroundColor: "#0d6efd",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
  },
  discountAppliedContainer: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    // marginTop: 8,
  },
  discountAppliedText: {
    fontSize: 14,
  },
  removeDiscountButton: {
    padding: "6px",
    backgroundColor: "transparent",
    color: "#dc3545",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
};

export default CreateLeadModal;

// mine 14-11-25
// import { useEffect, useState } from "react";
// import { FaTimes } from "react-icons/fa";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { BASE_URL } from "../utils/config";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";

// const CreateLeadModal = ({ onClose }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [showCustomInput, setShowCustomInput] = useState(false);
//   const [customPackage, setCustomPackage] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [showAddress, setShowAddress] = useState(false);
//   const [showTime, setShowTime] = useState(false);

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

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);

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
//     console.log("leadData.city: ", leadData.city);
//     console.log("addr: ", addr);

//     let detectedCity = "";

//     if (addr.includes("bengaluru")) {
//       detectedCity = "Bengaluru";
//     } else if (addr.includes("mysuru")) {
//       detectedCity = "Mysuru";
//     } else if (addr.includes("pune")) {
//       detectedCity = "Pune";
//     } else {
//       detectedCity = "";
//     }

//     if (detectedCity && leadData.city !== detectedCity) {
//       setLeadData((prev) => ({ ...prev, city: detectedCity }));
//     }
//   }, [leadData.googleAddress]);

//   useEffect(() => {
//     console.log("leadData", leadData);
//   }, [leadData]);

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
//         if (value && !/^\d+(\.\d{1,2})?$/.test(value))
//           return "Total Amount must be a valid number";
//         if (parseFloat(value) < 0) return "Total Amount cannot be negative";
//         return "";

//       case "bookingAmount":
//         if (
//           (leadData.serviceType === "Deep Cleaning" ||
//             leadData.serviceType === "House Painting") &&
//           value === ""
//         ) {
//           return "Booking Amount is required";
//         }
//         if (value && !/^\d+(\.\d{1,2})?$/.test(value)) {
//           return "Booking Amount must be a valid number";
//         }
//         if (parseFloat(value) < 0) {
//           return "Booking Amount cannot be negative";
//         }
//         return "";

//       case "customPackage":
//         if (value && value.length > 100)
//           return "Custom Package must be 100 characters or less";
//         return "";

//       default:
//         return "";
//     }
//   };

//   const handleChange = async (e) => {
//     const { name, value } = e.target;
//     let sanitizedValue = value;

//     if (name === "name") {
//       sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
//     } else if (name === "contact") {
//       sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
//     }

//     if (name === "serviceType" && value === "House Painting") {
//       try {
//         const response = await axios.get(
//           `${BASE_URL}/service/latest`
//         );
//         const siteVisitCharge = response.data.data.siteVisitCharge || 0;
//         setLeadData((prev) => ({
//           ...prev,
//           [name]: value,
//           bookingAmount: siteVisitCharge,
//         }));
//       } catch (error) {
//         console.error("Error fetching site visit charge:", error);
//       }
//     } else if (name === "serviceType" && value === "Deep Cleaning") {
//       try {
//         const response = await axios.get(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`
//         );
//         setCategories(response.data.data);
//         setLeadData((prev) => ({
//           ...prev,
//           [name]: value,
//           selectedPackage: "",
//           totalAmount: 0,
//           bookingAmount: 0,
//           packages: [],
//         }));
//       } catch (error) {
//         console.error("Error fetching deep cleaning packages:", error);
//       }
//     } else if (name === "selectedPackage") {
//       const selectedPackage = categories.find((pkg) => pkg._id === value);
//       if (selectedPackage) {
//         setLeadData((prev) => ({
//           ...prev,
//           selectedPackage: value,
//           totalAmount: prev.totalAmount + selectedPackage.totalAmount,
//           bookingAmount: prev.bookingAmount + selectedPackage.bookingAmount,
//         }));
//       }
//     }

//     // Update other fields
//     else {
//       setLeadData((prev) => ({
//         ...prev,
//         [name]: sanitizedValue,
//         packages: name === "serviceType" ? [] : prev.packages,
//         totalAmount: name === "totalAmount" ? value : prev.totalAmount,
//         bookingAmount: name === "bookingAmount" ? value : prev.bookingAmount,
//       }));
//     }

//     setErrors((prev) => ({
//       ...prev,
//       [name]: validateField(name, sanitizedValue),
//     }));
//   };

//   const handleCategorySelect = (category) => {
//     setSelectedCategory(category);

//     setLeadData((prev) => ({
//       ...prev,
//       totalAmount: (prev.totalAmount || 0) + category.totalAmount,
//       bookingAmount: (prev.bookingAmount || 0) + category.bookingAmount,
//     }));
//   };

//   const addPackage = () => {
//     const { selectedPackage, packages } = leadData;
//     if (selectedPackage && !packages.includes(selectedPackage)) {
//       const selectedCategory = categories.find(
//         (pkg) => pkg._id === selectedPackage
//       );
//       if (selectedCategory) {
//         setLeadData((prevState) => ({
//           ...prevState,
//           packages: [...prevState.packages, selectedCategory],
//           totalAmount: prevState.totalAmount + selectedCategory.totalAmount,
//           bookingAmount:
//             prevState.bookingAmount + selectedCategory.bookingAmount,
//           selectedPackage: "",
//         }));
//       }
//     }
//   };

//   const removePackage = (pkgToRemove) => {
//     setLeadData((prevState) => ({
//       ...prevState,
//       packages: prevState.packages.filter((pkg) => pkg._id !== pkgToRemove._id),
//       totalAmount: prevState.totalAmount - pkgToRemove.totalAmount,
//       bookingAmount: prevState.bookingAmount - pkgToRemove.bookingAmount,
//     }));
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

//   const handleSave = async () => {
//     // Required field validation
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
//       setSuccess("");

//       const now = new Date().toISOString();

//       // -----------------------------
//       // 🔥 NEW SERVICE MAPPING FORMAT
//       // -----------------------------
//       const serviceArray =
//         leadData.serviceType === "House Painting"
//           ? [
//               {
//                 category: "House Painting",
//                 serviceName: "House Painters & Waterproofing",
//                 price: Number(leadData.bookingAmount || 0), // siteVisitCharge
//                 quantity: 1,
//               },
//             ]
//           : leadData.packages.map((pkg) => ({
//               category: "Deep Cleaning",
//               subCategory: pkg.category, // ✅ FIXED (not pkg.subcategory)
//               serviceName: pkg.name, // ✅ FIXED
//               price: Number(pkg.totalAmount || 0),
//               quantity: 1,
//               teamMembersRequired: Number(pkg.teamMembers || 1),
//             }));

//       // -----------------------------------------
//       // 🔥 FINAL UPDATED BOOKING DATA PAYLOAD
//       // -----------------------------------------
//       const bookingData = {
//         customer: {
//           // customerId: `CUST-${Date.now()}`,
//           phone: leadData.contact,
//           name: leadData.name,
//         },

//         service: serviceArray,

//         bookingDetails: {
//           bookingDate: now,
//           bookingTime: leadData.slotTime,
//           siteVisitCharges:
//             leadData.serviceType === "House Painting"
//               ? Number(leadData.bookingAmount || 0)
//               : 0,
//           paymentMethod: "UPI",
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
//         isEnquiry: false,
//       };

//       console.log("bookingData", bookingData);
//       // -----------------------------------------
//       // 🔥 SEND API REQUEST
//       // -----------------------------------------
//       await axios.post(`${BASE_URL}/bookings/create-user-booking`, bookingData);

//       toast.success("Lead created successfully!", {
//         position: "top-right",
//         autoClose: 1500,
//         onClose: () => {
//           onClose();
//           window.location.reload();
//         },
//       });
//     } catch (err) {
//       console.error("Error creating booking:", err);
//       setError(
//         err.response?.data?.message ||
//           "Failed to create booking. Please try again."
//       );
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
//               <div style={styles.packageSelectorContainer}>
//                 <select
//                   onChange={(e) =>
//                     setLeadData((prev) => ({
//                       ...prev,
//                       selectedPackage: e.target.value,
//                     }))
//                   }
//                   value={leadData.selectedPackage || ""}
//                   style={styles.selectBox}
//                 >
//                   <option value="" disabled>
//                     Select Package
//                   </option>
//                   {categories.map((category) => (
//                     <option key={category._id} value={category._id}>
//                       {category.name} - ₹{category.totalAmount}
//                     </option>
//                   ))}
//                 </select>
//                 <button onClick={addPackage} style={styles.addButton}>
//                   +
//                 </button>
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

//           <div style={styles.actions}>
//             <button style={styles.buttonConfirm} onClick={handleSave}>
//               Save
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
//     fontSize: "16px",
//     transition: "color 0.3s ease",
//   },
//   removeIconHover: {
//     color: "#c9302c",
//   },
// };

// export default CreateLeadModal;

// mine new 13-11-25
// import { useEffect, useState } from "react";
// import { FaTimes } from "react-icons/fa";
// import axios from "axios";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { BASE_URL } from "../utils/config";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";

// const CreateLeadModal = ({ onClose }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [showCustomInput, setShowCustomInput] = useState(false);
//   const [customPackage, setCustomPackage] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [showAddress, setShowAddress] = useState(false);
//   const [showTime, setShowTime] = useState(false);

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
//     bookingAmount: "0",
//     packages: [],
//     selectedPackage: "",
//     coordinates: { lat: 0, lng: 0 },
//     formName: "admin panel",
//     createdDate: "",
//     createdTime: "",
//   });

//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState(null);

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

//   const packagePrices = {
//     "Basic Package": "1000",
//     "Standard Package": "2000",
//     "Premium Package": "3000",
//   };

//   const isTimeSelectionEnabled = leadData.googleAddress && leadData.city;

//   useEffect(() => {
//     if (!leadData.googleAddress) return;

//     const addr = leadData.googleAddress.toLowerCase();
//     console.log("leadData.city: ", leadData.city);
//     console.log("addr: ", addr);

//     let detectedCity = "";

//     if (addr.includes("bengaluru")) {
//       detectedCity = "Bengaluru";
//     } else if (addr.includes("mysuru")) {
//       detectedCity = "Mysuru";
//     } else if (addr.includes("pune")) {
//       detectedCity = "Pune";
//     } else {
//       detectedCity = "";
//     }

//     if (detectedCity && leadData.city !== detectedCity) {
//       setLeadData((prev) => ({ ...prev, city: detectedCity }));
//     }
//   }, [leadData.googleAddress]);

//   useEffect(() => {
//     console.log("leadData", leadData);
//   }, [leadData]);
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
//         if (value && !/^\d+(\.\d{1,2})?$/.test(value))
//           return "Total Amount must be a valid number";
//         if (parseFloat(value) < 0) return "Total Amount cannot be negative";
//         return "";

//       case "bookingAmount":
//         if (
//           (leadData.serviceType === "Deep Cleaning" ||
//             leadData.serviceType === "House Painting") &&
//           value === ""
//         ) {
//           return "Booking Amount is required";
//         }
//         if (value && !/^\d+(\.\d{1,2})?$/.test(value)) {
//           return "Booking Amount must be a valid number";
//         }
//         if (parseFloat(value) < 0) {
//           return "Booking Amount cannot be negative";
//         }
//         return "";

//       case "customPackage":
//         if (value && value.length > 100)
//           return "Custom Package must be 100 characters or less";
//         return "";

//       default:
//         return "";
//     }
//   };

//   const handleChange = async (e) => {
//     const { name, value } = e.target;
//     let sanitizedValue = value;

//     if (name === "name") {
//       sanitizedValue = value.replace(/[^a-zA-Z\s]/g, "");
//     } else if (name === "contact") {
//       sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
//     }

//     if (name === "serviceType" && value === "House Painting") {
//       try {
//         const response = await axios.get(
//           "https://homjee-backend.onrender.com/api/service/latest"
//         );
//         const siteVisitCharge = response.data.data.siteVisitCharge || "0";
//         setLeadData((prev) => ({
//           ...prev,
//           [name]: value,
//           bookingAmount: siteVisitCharge,
//         }));
//       } catch (error) {
//         console.error("Error fetching site visit charge:", error);
//       }
//     } else if (name === "serviceType" && value === "Deep Cleaning") {
//       try {
//         const response = await axios.get(
//           "https://homjee-backend.onrender.com/api/deeppackage/deep-cleaning-packages"
//         );
//         setCategories(response.data.data);
//         setLeadData((prev) => ({
//           ...prev,
//           [name]: value,
//           selectedPackage: "",
//           totalAmount: 0,
//           bookingAmount: 0,
//           packages: [],
//         }));
//       } catch (error) {
//         console.error("Error fetching deep cleaning packages:", error);
//       }
//     } else if (name === "selectedPackage") {
//       const selectedPackage = categories.find((pkg) => pkg._id === value);
//       if (selectedPackage) {
//         setLeadData((prev) => ({
//           ...prev,
//           selectedPackage: value,
//           totalAmount: prev.totalAmount + selectedPackage.totalAmount,
//           bookingAmount: prev.bookingAmount + selectedPackage.bookingAmount,
//         }));
//       }
//     }

//     // Update other fields
//     else {
//       setLeadData((prev) => ({
//         ...prev,
//         [name]: sanitizedValue,
//         packages: name === "serviceType" ? [] : prev.packages,
//         totalAmount: name === "totalAmount" ? value : prev.totalAmount,
//         bookingAmount: name === "bookingAmount" ? value : prev.bookingAmount,
//       }));
//     }

//     setErrors((prev) => ({
//       ...prev,
//       [name]: validateField(name, sanitizedValue),
//     }));
//   };

//   const handleCategorySelect = (category) => {
//     setSelectedCategory(category);

//     setLeadData((prev) => ({
//       ...prev,
//       totalAmount: (prev.totalAmount || 0) + category.totalAmount,
//       bookingAmount: (prev.bookingAmount || 0) + category.bookingAmount,
//     }));
//   };

//   const addPackage = () => {
//     const { selectedPackage, packages } = leadData;
//     if (selectedPackage && !packages.includes(selectedPackage)) {
//       const selectedCategory = categories.find(
//         (pkg) => pkg._id === selectedPackage
//       );
//       if (selectedCategory) {
//         setLeadData((prevState) => ({
//           ...prevState,
//           packages: [...prevState.packages, selectedCategory],
//           totalAmount: prevState.totalAmount + selectedCategory.totalAmount,
//           bookingAmount:
//             prevState.bookingAmount + selectedCategory.bookingAmount,
//           selectedPackage: "",
//         }));
//       }
//     }
//   };

//   const removePackage = (pkgToRemove) => {
//     setLeadData((prevState) => ({
//       ...prevState,
//       packages: prevState.packages.filter((pkg) => pkg._id !== pkgToRemove._id),
//       totalAmount: prevState.totalAmount - pkgToRemove.totalAmount,
//       bookingAmount: prevState.bookingAmount - pkgToRemove.bookingAmount,
//     }));
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
//     if (leadData.serviceType === "Deep Cleaning") required.push("totalAmount");
//     if (
//       leadData.serviceType === "Deep Cleaning" ||
//       leadData.serviceType === "House Painting"
//     )
//       required.push("bookingAmount");

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
//       setSuccess("");

//       const now = new Date();
//       const createdDate = now.toISOString().slice(0, 10);
//       const createdTime = now.toISOString().slice(11, 19);

//       const services = leadData.packages.map((pkg) => ({
//         category: leadData.serviceType,
//         subCategory: pkg,
//         serviceName: pkg,
//         price: packagePrices[pkg] || leadData.totalAmount || 0,
//         quantity: 1,
//       }));

//       const bookingData = {
//         customer: {
//           customerId: `CUST-${Date.now()}`,
//           name: leadData.name,
//           phone: leadData.contact,
//         },
//         service:
//           services.length > 0
//             ? services
//             : [
//                 {
//                   category: leadData.serviceType,
//                   subCategory: leadData.serviceType,
//                   serviceName: leadData.serviceType,
//                   price: leadData.totalAmount || 0,
//                   quantity: 1,
//                 },
//               ],
//         bookingDetails: {
//           bookingDate: new Date().toISOString(),
//           bookingTime: leadData.slotTime,
//           paidAmount: parseFloat(leadData.bookingAmount) || 0,
//           amountYetToPay:
//             parseFloat(leadData.totalAmount || 0) -
//               (parseFloat(leadData.bookingAmount) || 0) || 0,
//         },
//         address: {
//           houseFlatNumber: leadData.houseNo,
//           streetArea: leadData.googleAddress,
//           landMark: leadData.landmark,
//           city: leadData.city,
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
//         isEnquiry: false,
//         formName: "admin panel",
//         createdDate,
//         createdTime,
//       };

//       console.log("bookingData.isEnquiry: ", bookingData.isEnquiry);

//       await axios.post(`${BASE_URL}/bookings/create-user-booking`, bookingData);

//       toast.success("Lead created successfully!", {
//         position: "top-right",
//         autoClose: 1500,
//         onClose: () => {
//           onClose();
//           window.location.reload();
//         },
//       });
//     } catch (err) {
//       console.error("Error creating booking:", err);
//       setError(
//         err.response?.data?.message ||
//           "Failed to create booking. Please try again."
//       );
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
//               name="name"
//               placeholder="Customer Name"
//               style={styles.input}
//               onChange={handleChange}
//               value={leadData.name}
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
//               <div style={styles.packageSelectorContainer}>
//                 <select
//                   onChange={(e) =>
//                     setLeadData((prev) => ({
//                       ...prev,
//                       selectedPackage: e.target.value,
//                     }))
//                   }
//                   value={leadData.selectedPackage || ""}
//                   style={styles.selectBox}
//                 >
//                   <option value="" disabled>
//                     Select Package
//                   </option>
//                   {categories.map((category) => (
//                     <option key={category._id} value={category._id}>
//                       {category.name} - ₹{category.totalAmount}
//                     </option>
//                   ))}
//                 </select>
//                 <button onClick={addPackage} style={styles.addButton}>
//                   +
//                 </button>
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

//           <div style={styles.actions}>
//             <button style={styles.buttonConfirm} onClick={handleSave}>
//               Save
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
//     fontSize: "16px",
//     transition: "color 0.3s ease",
//   },
//   removeIconHover: {
//     color: "#c9302c",
//   },
// };

// export default CreateLeadModal;
