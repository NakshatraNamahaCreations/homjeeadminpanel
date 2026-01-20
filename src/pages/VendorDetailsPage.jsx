// pages/VendorDetailsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { BASE_URL } from "../utils/config";
import { normalizeMember } from "../utils/helpers";
import VendorDetails from "../components/vendor/VendorDetails";
import VendorDocuments from "../components/vendor/VendorsDocuments";
import VendorCoins from "../components/vendor/VendorCoins";
import TeamManagement from "../components/vendor/TeamManagement";
import VendorRatings from "../components/vendor/VendorRatings";
import VendorModal from "../components/vendor/modals/VendorModal";
import TeamMemberModal from "../components/vendor/modals/TeamMemberModal";
import TeamMemberDocsModal from "../components/vendor/modals/TeamMemberDocsModal";
import TeamMemberLeavesModal from "../components/vendor/modals/TeamMemberLeavesModal";
import AddressPickerModal from "../components/vendor/modals/AddressPickerModal";
import MemberDetailsModal from "../components/vendor/modals/MemberDetailsModal";

const VendorDetailsPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [coinDelta, setCoinDelta] = useState(1);
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showMemberAddressPicker, setShowMemberAddressPicker] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [showMemberLeavesModal, setShowMemberLeavesModal] = useState(false);
  const [showMemberDocsModal, setShowMemberDocsModal] = useState(false);

  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [vendorFormData, setVendorFormData] = useState(null);

  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberFormData, setMemberFormData] = useState(null);

  const [vendorRatings, setVendorRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState(null);

  const fetchVendorDetails = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/vendor/get-vendor-by-vendorId/${id}`
      );

      const vendorData = response.data.vendor;

      const detailedVendor = {
        id: vendorData._id,
        name: vendorData.vendor?.vendorName || "",
        profileImage: vendorData.vendor?.profileImage || "",
        category: vendorData.vendor?.serviceType || "",
        city: vendorData.vendor?.city || "",
        status: vendorData.activeStatus ? "Live" : "Inactive",
        rating: 4.5,
        phone: String(vendorData.vendor?.mobileNumber ?? ""),
        capacity: vendorData.vendor?.capacity || "",
        dob: vendorData.vendor?.dateOfBirth || "",
        serviceArea: vendorData.vendor?.serviceArea || "",
        location: vendorData.address?.location || "",
        workingSince: parseInt(vendorData.vendor?.yearOfWorking ?? "0", 10),
        coins: Number(vendorData.wallet?.coins ?? 0),
        lat: vendorData.address?.latitude,
        long: vendorData.address?.longitude,
        aadhar: vendorData.documents?.aadhaarNumber || "",
        pan: vendorData.documents?.panNumber || "",
        account: vendorData.bankDetails?.accountNumber || "",
        ifsc: vendorData.bankDetails?.ifscCode || "",
        bank: vendorData.bankDetails?.bankName || "",
        holderName: vendorData.bankDetails?.holderName || "",
        accountType: vendorData.bankDetails?.accountType || "",
        gst: vendorData.bankDetails?.gstNumber || "",
        docs: {
          aadhaarFront: vendorData.documents?.aadhaarfrontImage || "",
          aadhaarBack: vendorData.documents?.aadhaarbackImage || "",
          pan: vendorData.documents?.panImage || "",
          other: vendorData.documents?.otherPolicy || "",
        },
        team: (vendorData.team || []).map(normalizeMember),
        wallet:(vendorData?.wallet || [])
      };

      setSelectedVendor(detailedVendor);
      setCoinsBalance(Number(detailedVendor.coins || 0));
      setError(null);
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      setError(
        error.response?.data?.message || "Failed to load vendor details"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVendorRatings = useCallback(async (id) => {
    try {
      if (!id) return;

      setRatingsLoading(true);
      setRatingsError(null);

      const { data } = await axios.get(
        `${BASE_URL}/ratings/vendor-ratings/${id}/latest`,
        {
          params: { limit: 50 },
        }
      );

      const list = Array.isArray(data?.data) ? data.data : [];
      setVendorRatings(list);
    } catch (err) {
      console.error("fetchVendorRatings error:", err);
      setRatingsError(
        err?.response?.data?.message || err.message || "Failed to load ratings"
      );
      setVendorRatings([]);
    } finally {
      setRatingsLoading(false);
    }
  }, []);

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

  const openEditMemberModal = (member) => {
    setIsEditingMember(true);
    setEditingMemberId(member._id);

    setMemberFormData({
      name: member.name || "",
      mobileNumber: member.mobileNumber || "",
      dateOfBirth: member.dateOfBirth || "",
      city: member.city || "",
      serviceType: member.serviceType || "",
      serviceArea: member.serviceArea || "",
      aadhaarNumber: member.aadhaarNumber || "",
      panNumber: member.panNumber || "",
      accountNumber: member.accountNumber || "",
      ifscCode: member.ifscCode || "",
      bankName: member.bankName || "",
      holderName: member.holderName || member.name || "",
      accountType: member.accountType || "Savings",
      gstNumber: member.gstNumber || "",
      location: member.location || "",
      latitude: String(member.latitude || ""),
      longitude: String(member.longitude || ""),
    });

    setShowAddMemberModal(true);
  };

  const handleAddCoinsAPI = async () => {
    if (!selectedVendor) return;
    const coins = Number(coinDelta || 0);
    if (coins <= 0) return alert("Enter a positive coin amount.");

    try {
      const { data } = await axios.post(`${BASE_URL}/vendor/add-coin`, {
        vendorId: selectedVendor.id,
        coins,
      });

      const serverCoins = Number(data?.wallet?.coins ?? coinsBalance);
      setCoinsBalance(serverCoins);

      // Update selected vendor
      setSelectedVendor((prev) =>
        prev ? { ...prev, coins: serverCoins } : prev
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add coins");
    }
  };

  const handleReduceCoinsAPI = async () => {
    if (!selectedVendor) return;
    const coins = Number(coinDelta || 0);
    if (coins <= 0) return alert("Enter a positive coin amount.");
    if (coins > coinsBalance) return alert("Insufficient balance.");

    try {
      const { data } = await axios.post(`${BASE_URL}/vendor/reduce-coin`, {
        vendorId: selectedVendor.id,
        coins,
      });

      const serverCoins = Number(data?.wallet?.coins ?? coinsBalance);
      setCoinsBalance(serverCoins);

      // Update selected vendor
      setSelectedVendor((prev) =>
        prev ? { ...prev, coins: serverCoins } : prev
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reduce coins");
    }
  };

  const removeTeamMemberAPI = async (memberId) => {
    if (!selectedVendor) return;

    try {
      const { data } = await axios.post(`${BASE_URL}/vendor/team/remove`, {
        vendorId: selectedVendor.id,
        memberId,
      });

      const normalizedTeam = (data?.team || []).map(normalizeMember);

      // Update selected vendor
      setSelectedVendor((v) => (v ? { ...v, team: normalizedTeam } : v));
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to remove member");
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails(vendorId);
    }
  }, [vendorId, fetchVendorDetails]);

  useEffect(() => {
    if (selectedVendor?.id) {
      fetchVendorRatings(selectedVendor.id);
    }
  }, [selectedVendor?.id, fetchVendorRatings]);

  const handleVendorSuccess = () => {
    // Refresh vendor details after edit
    if (vendorId) {
      fetchVendorDetails(vendorId);
    }
  };

  const handleMemberSuccess = () => {
    // Refresh vendor details after member edit
    if (vendorId) {
      fetchVendorDetails(vendorId);
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div
          style={{
            height: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <div className="loader-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="mt-3 text-muted">Loading Vendor details...</p>

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
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">
          Error: {error}
          <Button
            variant="link"
            onClick={() => navigate("/vendors-list")}
            className="ms-2"
          >
            Back to Vendors List
          </Button>
        </div>
      </Container>
    );
  }

  if (!selectedVendor) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <p>Vendor not found</p>
          <Button onClick={() => navigate("/vendors-list")}>
            Back to Vendors List
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <style>{`
        /* Your existing CSS styles */
        .gmap-dialog {
          max-width: min(1000px, 92vw) !important;
          margin: 1.25rem auto;
        }
        .gmap-content {
          height: 86vh;
          display: flex;
          flex-direction: column;
        }
        .gmap-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .team-card {
          border: 1px solid #eee;
          border-radius: 16px;
          box-shadow: 0 6px 22px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .team-card-header {
          background: #0f172a;
          color: #fff;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .team-row {
          padding: 12px 14px;
          border-top: 1px solid #f0f0f0;
          display: grid;
          grid-template-columns: 1.2fr 1fr 0.9fr;
          gap: 12px;
          align-items: center;
        }
        .team-name {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #f1f5f9;
          border: 1px solid #e5e7eb;
          display: grid;
          place-items: center;
          font-weight: 700;
          color: #0f172a;
          flex: 0 0 auto;
        }
        .name-text {
          min-width: 0;
        }
        .name-text .primary {
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }
        .name-text .secondary {
          font-size: 11px;
          color: #64748b;
        }
        .leave-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          font-size: 11px;
          margin: 0 6px 6px 0;
        }
        .actions-wrap {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .leaves-modal-body {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 14px;
        }
        @media (max-width: 768px) {
          .leaves-modal-body { grid-template-columns: 1fr; }
        }
        .leaves-left {
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 12px;
          background: #fafafa;
        }
        .leaves-right {
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 12px;
          background: #fff;
        }

        .leave-day {
          background: transparent !important;
          color: #111 !important;
          position: relative;
          font-weight: 700;
        }
        .leave-day::after {
          content: "";
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 6px;
          border-radius: 999px;
          background: #111;
        }
      `}</style>

      <Container className="py-4" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="vendor-details">
          <Button
            variant="white"
            className="mb-3"
            onClick={() => navigate("/vendors-list")}
            style={{ fontSize: "14px", borderColor: "black" }}
          >
            <FaArrowLeft /> Back to List
          </Button>

          <VendorDetails
            vendor={selectedVendor}
            onEditVendor={() => openEditVendorModal(selectedVendor)}
          />

          <VendorCoins
            vendor={selectedVendor}
            coinDelta={coinDelta}
            setCoinDelta={setCoinDelta}
            coinsBalance={coinsBalance}
            onAddCoins={handleAddCoinsAPI}
            onReduceCoins={handleReduceCoinsAPI}
          />

          <VendorDocuments vendor={selectedVendor} />

          <TeamManagement
            vendor={selectedVendor}
            onAddMember={() => setShowAddMemberModal(true)}
            onEditMember={openEditMemberModal}
            onViewMemberDetails={(member) => {
              setSelectedTeamMember(member);
              setShowMemberDetailsModal(true);
            }}
            onViewMemberLeaves={(member) => {
              setSelectedTeamMember(member);
              setShowMemberLeavesModal(true);
            }}
            onViewMemberDocs={(member) => {
              setSelectedTeamMember(member);
              setShowMemberDocsModal(true);
            }}
            onRemoveMember={removeTeamMemberAPI}
          />

          <VendorRatings
            vendorId={selectedVendor.id}
            ratings={vendorRatings}
            loading={ratingsLoading}
            error={ratingsError}
          />
        </div>
      </Container>

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

      <TeamMemberModal
        show={showAddMemberModal}
        onHide={() => {
          setShowAddMemberModal(false);
          setIsEditingMember(false);
          setEditingMemberId(null);
          setMemberFormData(null);
        }}
        isEditing={isEditingMember}
        memberId={editingMemberId}
        vendorId={selectedVendor?.id}
        formData={memberFormData}
        onSuccess={handleMemberSuccess}
        onAddressPickerOpen={() => setShowMemberAddressPicker(true)}
      />

      <MemberDetailsModal
        show={showMemberDetailsModal}
        onHide={() => setShowMemberDetailsModal(false)}
        member={selectedTeamMember}
      />

      <TeamMemberDocsModal
        show={showMemberDocsModal}
        onHide={() => setShowMemberDocsModal(false)}
        member={selectedTeamMember}
      />

      <TeamMemberLeavesModal
        show={showMemberLeavesModal}
        onHide={() => setShowMemberLeavesModal(false)}
        member={selectedTeamMember}
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

      <AddressPickerModal
        show={showMemberAddressPicker}
        onHide={() => setShowMemberAddressPicker(false)}
        initialAddress={memberFormData?.location || ""}
        initialLatLng={
          memberFormData?.latitude &&
          memberFormData?.longitude &&
          !isNaN(memberFormData.latitude) &&
          !isNaN(memberFormData.longitude)
            ? {
                lat: parseFloat(memberFormData.latitude),
                lng: parseFloat(memberFormData.longitude),
              }
            : null
        }
        onSelect={(sel) => {
          if (memberFormData) {
            setMemberFormData((prev) => ({
              ...prev,
              location: sel.formattedAddress,
              serviceArea: sel.formattedAddress,
              latitude: String(sel.lat),
              longitude: String(sel.lng),
            }));
          }
        }}
      />
    </>
  );
};

export default VendorDetailsPage;
