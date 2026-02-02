// // components/modals/TeamMemberModal.jsx
// import React, { useState, useEffect } from "react";
// import { Modal, Form, Row, Col, Button } from "react-bootstrap";
// import { FaMapMarkerAlt } from "react-icons/fa";
// import TeamMemberForm from "../forms/TeamMemberForm";
// import { validateTeamMemberForm } from "../../../utils/helpers";
// import axios from "axios";
// import { BASE_URL } from "../../../utils/config";

// const TeamMemberModal = ({
//   show,
//   onHide,
//   isEditing = false,
//   memberId = null,
//   vendorId = null,
//   formData: initialFormData = null,
//   onSuccess,
//   onAddressPickerOpen,
// }) => {
//   const [formData, setFormData] = useState({
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

//   const [errors, setErrors] = useState({});
//   const [files, setFiles] = useState({
//     profileImage: null,
//     aadhaarfrontImage: null,
//     aadhaarbackImage: null,
//     panImage: null,
//     otherPolicy: null,
//   });
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (isEditing && initialFormData) {
//       setFormData(initialFormData);
//     } else if (!isEditing) {
//       // Reset form for new member
//       setFormData({
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
//       setFiles({
//         profileImage: null,
//         aadhaarfrontImage: null,
//         aadhaarbackImage: null,
//         panImage: null,
//         otherPolicy: null,
//       });
//     }
//   }, [isEditing, initialFormData, show]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e) => {
//     const { name, files: fileList } = e.target;
//     setFiles((prev) => ({ ...prev, [name]: fileList[0] }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     const validationErrors = validateTeamMemberForm(formData);
//     if (Object.keys(validationErrors).length > 0) {
//       setErrors(validationErrors);
//       return;
//     }
//     setErrors({});

//     if (!formData.latitude || !formData.longitude || isNaN(formData.latitude) || isNaN(formData.longitude)) {
//       alert("Please select a valid location using the map picker.");
//       return;
//     }

//     try {
//       setLoading(true);

//       const fd = new FormData();
//       if (vendorId) fd.append("vendorId", vendorId);
//       if (isEditing && memberId) fd.append("memberId", memberId);

//       const member = {
//         name: formData.name,
//         mobileNumber: formData.mobileNumber,
//         dateOfBirth: formData.dateOfBirth,
//         city: formData.city,
//         serviceType: formData.serviceType,
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

//       fd.append("member", JSON.stringify(member));
//       fd.append("documents", JSON.stringify(documents));
//       fd.append("bankDetails", JSON.stringify(bankDetails));
//       fd.append("address", JSON.stringify(address));

//       const appendIfFile = (key, val) => {
//         if (val && val instanceof File) fd.append(key, val);
//       };

//       appendIfFile("profileImage", files.profileImage);
//       appendIfFile("aadhaarfrontImage", files.aadhaarfrontImage);
//       appendIfFile("aadhaarbackImage", files.aadhaarbackImage);
//       appendIfFile("panImage", files.panImage);
//       appendIfFile("otherPolicy", files.otherPolicy);

//       const url = isEditing 
//         ? `${BASE_URL}/vendor/team/update`
//         : `${BASE_URL}/vendor/team/add`;

//       const method = isEditing ? "put" : "post";

//       await axios[method](url, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       // alert(`Team member ${isEditing ? "updated" : "added"} successfully!`);
//       onSuccess();
//       onHide();
//     } catch (error) {
//       console.error("Error saving team member:", error);
//       alert(
//         "Failed to save team member: " +
//           (error.response?.data?.message || error.message)
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Modal show={show} onHide={onHide} size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title style={{ fontSize: "16px" }}>
//           {isEditing ? "Edit Team Member" : "Add Team Member"}
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form onSubmit={handleSubmit}>
//           <TeamMemberForm
//             formData={formData}
//             errors={errors}
//             files={files}
//             onInputChange={handleInputChange}
//             onFileChange={handleFileChange}
//             onAddressPickerOpen={onAddressPickerOpen}
//           />
//           <Modal.Footer>
//             <Button variant="primary" type="submit" disabled={loading}>
//               {loading ? "Saving..." : isEditing ? "Update Member" : "Add Member"}
//             </Button>
//             <Button variant="secondary" onClick={onHide} disabled={loading}>
//               Cancel
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal.Body>
//     </Modal>
//   );
// };

// export default TeamMemberModal;


import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import TeamMemberForm from "../forms/TeamMemberForm";
import { validateTeamMemberForm } from "../../../utils/helpers";
import axios from "axios";
import { BASE_URL } from "../../../utils/config";
import AddressPickerModal from "../modals/AddressPickerModal"; // ✅ adjust path

const emptyForm = {
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
};

const TeamMemberModal = ({
  show,
  onHide,
  isEditing = false,
  memberId = null,
  vendorId = null,
  formData: initialFormData = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState({
    profileImage: null,
    aadhaarfrontImage: null,
    aadhaarbackImage: null,
    panImage: null,
    otherPolicy: null,
  });
  const [loading, setLoading] = useState(false);

  // ✅ Address Picker Modal State
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // ✅ stable initialLatLng for modal
  const initialLatLngForPicker = useMemo(() => {
    const lat = Number(formData.latitude);
    const lng = Number(formData.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat && lng) return { lat, lng };
    return undefined;
  }, [formData.latitude, formData.longitude]);

  useEffect(() => {
    if (!show) return;

    if (isEditing && initialFormData) {
      // ✅ IMPORTANT: clone (avoid shared reference / mutation issues)
      setFormData({
        ...emptyForm,
        ...initialFormData,
        latitude:
          initialFormData.latitude ??
          initialFormData?.address?.latitude ??
          "",
        longitude:
          initialFormData.longitude ??
          initialFormData?.address?.longitude ??
          "",
        location:
          initialFormData.location ??
          initialFormData?.address?.location ??
          "",
      });
    } else {
      setFormData(emptyForm);
      setFiles({
        profileImage: null,
        aadhaarfrontImage: null,
        aadhaarbackImage: null,
        panImage: null,
        otherPolicy: null,
      });
      setErrors({});
    }
  }, [show, isEditing, initialFormData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    setFiles((prev) => ({ ...prev, [name]: fileList?.[0] || null }));
  };

  // ✅ This is the key fix
  const handleAddressSelect = ({ placeName, formattedAddress, lat, lng }) => {
    setFormData((prev) => ({
      ...prev,
      location: formattedAddress || placeName || "",
      latitude: lat != null ? String(lat) : "",
      longitude: lng != null ? String(lng) : "",
    }));

    // optional: clear related errors instantly
    setErrors((prev) => {
      const next = { ...prev };
      delete next.location;
      delete next.latitude;
      delete next.longitude;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateTeamMemberForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    const lat = Number(formData.latitude);
    const lng = Number(formData.longitude);
    if (
      !formData.latitude ||
      !formData.longitude ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      alert("Please select a valid location using the map picker.");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      if (vendorId) fd.append("vendorId", vendorId);
      if (isEditing && memberId) fd.append("memberId", memberId);

      const member = {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        dateOfBirth: formData.dateOfBirth,
        city: formData.city,
        serviceType: formData.serviceType,
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
        latitude: lat,
        longitude: lng,
      };

      fd.append("member", JSON.stringify(member));
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

      const url = isEditing
        ? `${BASE_URL}/vendor/team/update`
        : `${BASE_URL}/vendor/team/add`;

      const method = isEditing ? "put" : "post";

      await axios[method](url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess?.();
      onHide?.();
    } catch (error) {
      console.error("Error saving team member:", error);
      alert(
        "Failed to save team member: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "16px" }}>
            {isEditing ? "Edit Team Member" : "Add Team Member"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <TeamMemberForm
              formData={formData}
              errors={errors}
              files={files}
              onInputChange={handleInputChange}
              onFileChange={handleFileChange}
              onAddressPickerOpen={() => setShowAddressPicker(true)} // ✅
            />

            <Modal.Footer>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : isEditing ? "Update Member" : "Add Member"}
              </Button>
              <Button variant="secondary" onClick={onHide} disabled={loading}>
                Cancel
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ✅ Address Picker Modal should live here */}
      <AddressPickerModal
        show={showAddressPicker}
        onHide={() => setShowAddressPicker(false)}
        onSelect={handleAddressSelect} // ✅ updates TeamMemberModal state
        initialAddress={formData.location}
        initialLatLng={initialLatLngForPicker}
      />
    </>
  );
};

export default TeamMemberModal;
