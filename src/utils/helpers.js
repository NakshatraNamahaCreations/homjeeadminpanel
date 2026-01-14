// components/utils/helpers.js
export const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const isIgnoreValue = (v) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

export const dateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const normalizeLeave = (d) => String(d || "").split("T")[0]; // keeps YYYY-MM-DD

export const normalizeMember = (m) => ({
  _id: m._id,
  name: m.name || "",
  mobileNumber: String(m.mobileNumber ?? ""),
  dateOfBirth: m.dateOfBirth || "",
  city: m.city || "",
  serviceType: m.serviceType || "",
  serviceArea: m.serviceArea || "",
  profileImage: m.profileImage || "",
  aadhaarNumber: m.documents?.aadhaarNumber || "",
  panNumber: m.documents?.panNumber || "",
  docs: {
    aadhaarFront: m.documents?.aadhaarfrontImage || m.documents?.aadhaarFrontImage || "",
    aadhaarBack: m.documents?.aadhaarbackImage || m.documents?.aadhaarBackImage || "",
    pan: m.documents?.panImage || "",
    other: m.documents?.otherPolicy || "",
  },
  accountNumber: m.bankDetails?.accountNumber || "",
  ifscCode: m.bankDetails?.ifscCode || "",
  bankName: m.bankDetails?.bankName || "",
  holderName: m.bankDetails?.holderName || "",
  accountType: m.bankDetails?.accountType || "",
  gstNumber: m.bankDetails?.gstNumber || "",
  location: m.address?.location || "",
  latitude: m.address?.latitude,
  longitude: m.address?.longitude,
  markedLeaves: Array.isArray(m.markedLeaves)
    ? m.markedLeaves.map(normalizeLeave)
    : [],
});

export const prettyServiceType = (s) => {
  try {
    if (!s) return "-";
    return String(s)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch (e) {
    console.error("prettyServiceType error:", e);
    return "-";
  }
};

// Vendor Form Validation
export const validateVendorForm = (formData) => {
  const newErrors = {};

  // Vendor Name: Required and should only contain alphabets and spaces
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!formData.vendorName) {
    newErrors.vendorName = "Vendor name is required.";
  } else if (!nameRegex.test(formData.vendorName)) {
    newErrors.vendorName =
      "Vendor name must contain only alphabets and spaces.";
  }

  // Mobile Number: Required and should be exactly 10 digits
  const mobileNumberRegex = /^[0-9]{10}$/;
  if (!formData.mobileNumber) {
    newErrors.mobileNumber = "Phone number is required.";
  } else if (!mobileNumberRegex.test(formData.mobileNumber)) {
    newErrors.mobileNumber = "Phone number must be 10 digits.";
  }

  // Date of Birth: Required
  if (!formData.dateOfBirth)
    newErrors.dateOfBirth = "Date of birth is required.";

  // Year of Working: Required and must be a valid number
  if (!formData.yearOfWorking)
    newErrors.yearOfWorking = "Year of working is required.";
  else if (isNaN(formData.yearOfWorking))
    newErrors.yearOfWorking = "Year of working must be a valid number.";

  // City: Required
  if (!formData.city) newErrors.city = "City is required.";

  // Service Type: Required
  if (!formData.serviceType)
    newErrors.serviceType = "Service type is required.";

  // Capacity: Required and must be a valid number
  if (!formData.capacity) newErrors.capacity = "Capacity is required.";
  else if (isNaN(formData.capacity))
    newErrors.capacity = "Capacity must be a valid number.";

  // Service Area: Required
  if (!formData.serviceArea)
    newErrors.serviceArea = "Service area is required.";

  // Aadhar Number: Required and must be exactly 12 digits
  const aadhaarRegex = /^[0-9]{12}$/;
  if (!formData.aadhaarNumber) {
    newErrors.aadhaarNumber = "Aadhar number is required.";
  } else if (!aadhaarRegex.test(formData.aadhaarNumber)) {
    newErrors.aadhaarNumber = "Aadhar number must be 12 digits.";
  }

  // PAN Number: Required and must follow the PAN format (XXXXX9999X)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!formData.panNumber) {
    newErrors.panNumber = "PAN number is required.";
  } else if (!panRegex.test(formData.panNumber)) {
    newErrors.panNumber = "PAN number is invalid.";
  }

  // Account Number: Required and must be numeric
  if (!formData.accountNumber) {
    newErrors.accountNumber = "Account number is required.";
  } else if (!/^[0-9]+$/.test(formData.accountNumber)) {
    newErrors.accountNumber = "Account number must be numeric.";
  }

  // IFSC Code: Required and must follow the format (4 alphabets + 7 digits)
  const ifscRegex = /^[A-Za-z]{4}[0-9]{7}$/;
  if (!formData.ifscCode) {
    newErrors.ifscCode = "IFSC code is required.";
  } else if (!ifscRegex.test(formData.ifscCode)) {
    newErrors.ifscCode = "Invalid IFSC code.";
  }

  // Bank Name: Required
  if (!formData.bankName) newErrors.bankName = "Bank name is required.";

  // Holder Name: Required
  if (!formData.holderName) newErrors.holderName = "Holder name is required.";

  // Account Type: Required
  if (!formData.accountType)
    newErrors.accountType = "Account type is required.";

  // GST Number: If provided, must be valid
  if (formData.gstNumber && formData.gstNumber.trim() !== "") {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(formData.gstNumber)) {
      newErrors.gstNumber = "Invalid GST number format";
    }
  }

  // Location: Required
  if (!formData.location) newErrors.location = "Location is required.";

  // Latitude: Required and must be a valid number
  if (!formData.latitude || isNaN(formData.latitude))
    newErrors.latitude = "Latitude is required.";

  // Longitude: Required and must be a valid number
  if (!formData.longitude || isNaN(formData.longitude))
    newErrors.longitude = "Longitude is required.";

  return newErrors;
};

// Team Member Form Validation
export const validateTeamMemberForm = (formData) => {
  const newErrors = {};

  // Name: Only alphabets and spaces
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!formData.name) {
    newErrors.name = "Name is required.";
  } else if (!nameRegex.test(formData.name)) {
    newErrors.name = "Name must contain only alphabets and spaces.";
  }

  // Mobile Number: 10 digits
  const mobileNumberRegex = /^[0-9]{10}$/;
  if (!formData.mobileNumber) {
    newErrors.mobileNumber = "Phone number is required.";
  } else if (!mobileNumberRegex.test(formData.mobileNumber)) {
    newErrors.mobileNumber = "Phone number must be 10 digits.";
  }

  // Date of Birth: Required and valid date format
  if (!formData.dateOfBirth) {
    newErrors.dateOfBirth = "Date of birth is required.";
  }

  // City: Required
  if (!formData.city) {
    newErrors.city = "City is required.";
  }

  // Service Type: Required
  if (!formData.serviceType) {
    newErrors.serviceType = "Service type is required.";
  }

  // Service Area: Required
  if (!formData.serviceArea) {
    newErrors.serviceArea = "Service area is required.";
  }

  // Aadhar Number: 12 digits
  const aadhaarRegex = /^[0-9]{12}$/;
  if (!formData.aadhaarNumber) {
    newErrors.aadhaarNumber = "Aadhar number is required.";
  } else if (!aadhaarRegex.test(formData.aadhaarNumber)) {
    newErrors.aadhaarNumber = "Aadhar number must be 12 digits.";
  }

  // PAN Number: PAN format validation
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!formData.panNumber) {
    newErrors.panNumber = "PAN number is required.";
  } else if (!panRegex.test(formData.panNumber)) {
    newErrors.panNumber = "PAN number is invalid.";
  }

  // Bank Account Number: Numeric validation
  if (!formData.accountNumber) {
    newErrors.accountNumber = "Bank account number is required.";
  } else if (!/^[0-9]+$/.test(formData.accountNumber)) {
    newErrors.accountNumber = "Bank account number should be numeric.";
  }

  // IFSC Code: Format validation (4 alphabets + 7 digits)
  const ifscRegex = /^[A-Za-z]{4}[0-9]{7}$/;
  if (!formData.ifscCode) {
    newErrors.ifscCode = "IFSC code is required.";
  } else if (!ifscRegex.test(formData.ifscCode)) {
    newErrors.ifscCode = "Invalid IFSC code.";
  }

  // Bank Name: Required
  if (!formData.bankName) {
    newErrors.bankName = "Bank name is required.";
  }

  // Account Holder Name: Required
  if (!formData.holderName) {
    newErrors.holderName = "Account holder name is required.";
  }

  // Account Type: Required
  if (!formData.accountType) {
    newErrors.accountType = "Account type is required.";
  }

  // GST Number: If provided, it must be valid
  if (formData.gstNumber && formData.gstNumber.trim() !== "") {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(formData.gstNumber)) {
      newErrors.gstNumber = "Invalid GST number format";
    }
  }

  // Location: Required
  if (!formData.location) {
    newErrors.location = "Location is required.";
  }

  // Latitude: Numeric and required
  if (!formData.latitude || isNaN(formData.latitude)) {
    newErrors.latitude = "Latitude is required.";
  }

  // Longitude: Numeric and required
  if (!formData.longitude || isNaN(formData.longitude)) {
    newErrors.longitude = "Longitude is required.";
  }

  return newErrors;
};

// Constants
export const CITIES = [
  "All Cities",
  "Bengaluru",
  "Pune",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
];

export const SERVICES = [
  "All Services",
  "House Painting",
  "Deep Cleaning",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Pest Control",
  "AC Service",
  "Car Wash",
  "Gardening",
  "Home Repair",
];

export const ACCOUNT_TYPES = [
  "Savings",
  "Current",
  "Salary",
  "Fixed Deposit",
  "Recurring Deposit",
];

export const STATUS_TYPES = [
  "All Statuses",
  "Live",
  "Inactive",
  "Low Coins",
  "Capacity Full",
];

// Helper function to format date
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Helper function to calculate years of experience
export const calculateExperience = (yearOfWorking) => {
  if (!yearOfWorking) return 0;
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(yearOfWorking);
};

// Helper function to format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
  }
  return phone;
};

// Helper function to mask sensitive data
export const maskData = (data, visibleChars = 4) => {
  if (!data || data.length <= visibleChars) return data;
  const visiblePart = data.substring(data.length - visibleChars);
  const maskedPart = "*".repeat(data.length - visibleChars);
  return maskedPart + visiblePart;
};

// Helper function to validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to get file extension
export const getFileExtension = (filename) => {
  return filename.split(".").pop().toLowerCase();
};

// Helper function to check if file is an image
export const isImageFile = (filename) => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

// Helper function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};