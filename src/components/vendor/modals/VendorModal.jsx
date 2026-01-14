// components/modals/VendorModal.jsx
import React, { useState, useEffect } from "react";
import { Modal, Form, Row, Col, Button } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import VendorForm from "../forms/VendorForm";
import { validateVendorForm } from "../../../utils/helpers";
import axios from "axios";
import { BASE_URL } from "../../../utils/config";

const VendorModal = ({
  show,
  onHide,
  isEditing = false,
  vendorId = null,
  formData: initialFormData = null,
  onSuccess,
  onAddressPickerOpen,
}) => {
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

  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState({
    profileImage: null,
    aadhaarfrontImage: null,
    aadhaarbackImage: null,
    panImage: null,
    otherPolicy: null,
  });
  const [loading, setLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);

  useEffect(() => {
    if (isEditing && initialFormData) {
      setFormData(initialFormData);
    } else if (!isEditing) {
      // Reset form for new vendor
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
        aadhaarfrontImage: null,
        aadhaarbackImage: null,
        panImage: null,
        otherPolicy: null,
      });
    }
  }, [isEditing, initialFormData, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    setFiles((prev) => ({ ...prev, [name]: fileList[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateVendorForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    if (!formData.latitude || !formData.longitude || isNaN(formData.latitude) || isNaN(formData.longitude)) {
      alert("Please select a valid location using the map picker.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();

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

      if (isEditing && vendorId) {
        fd.append("vendor", JSON.stringify(vendor));
        fd.append("documents", JSON.stringify(documents));
        fd.append("bankDetails", JSON.stringify(bankDetails));
        fd.append("address", JSON.stringify(address));

        const appendIfFile = (key, val) => {
          if (val && val instanceof File) fd.append(key, val);
        };

        appendIfFile("profileImage", files.profileImage);
        appendIfFile("aadhaarfrontImage", files.aadhaarfrontImage);
        appendIfFile("aadhaarbackImage", files.aadhaarbackImage);
        appendIfFile("panImage", files.panImage);
        appendIfFile("otherPolicy", files.otherPolicy);

        await axios.put(
          `${BASE_URL}/vendor/update-vendor/${vendorId}`,
          fd,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        alert("Vendor updated successfully!");
      } else {
        fd.append("vendor", JSON.stringify(vendor));
        fd.append("documents", JSON.stringify(documents));
        fd.append("bankDetails", JSON.stringify(bankDetails));
        fd.append("address", JSON.stringify(address));

        if (files.profileImage) fd.append("profileImage", files.profileImage);
        if (files.aadhaarbackImage) fd.append("aadhaarbackImage", files.aadhaarbackImage);
        if (files.aadhaarfrontImage) fd.append("aadhaarfrontImage", files.aadhaarfrontImage);
        if (files.panImage) fd.append("panImage", files.panImage);
        if (files.otherPolicy) fd.append("otherPolicy", files.otherPolicy);

        await axios.post(`${BASE_URL}/vendor/create-vendor`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Vendor created successfully!");
      }

      onSuccess();
      onHide();
    } catch (error) {
      console.error("Error saving vendor:", error);
      alert(
        "Failed to save vendor: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "16px" }}>
          {isEditing ? "Edit Vendor" : "Add New Vendor"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <VendorForm
            formData={formData}
            errors={errors}
            files={files}
            onInputChange={handleInputChange}
            onFileChange={handleFileChange}
            onAddressPickerOpen={onAddressPickerOpen}
            geocodingError={geocodingError}
          />
          <Modal.Footer>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Vendor" : "Save Vendor"}
            </Button>
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default VendorModal;