/* ===== FILE: EditEnquiryModal.jsx (FULL UPDATED) ===== */
import React, { useEffect, useState, useRef } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import AddressPickerModal from "./AddressPickerModal";
import TimePickerModal from "./TimePickerModal";
import { BASE_URL } from "../utils/config";
import { ImCancelCircle } from "react-icons/im";
import { FaCheck } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";

const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

const ALLOWED_SERVICE_EDIT_STATUSES = [
  "pending",
  "confirmed",
  "rescheduled",
  "customer unreachable",
];

const EditEnquiryModal = ({
  show,
  onClose,
  enquiry,
  onUpdated,
  title,
  leadMode = false,
}) => {
  const [saving, setSaving] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [formName, setFormName] = useState("");

  const [houseFlatNumber, setHouseFlatNumber] = useState("");
  const [streetArea, setStreetArea] = useState("");
  const [landMark, setLandMark] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState(null);

  const [slotDate, setSlotDate] = useState("");
  const [slotTime, setSlotTime] = useState("");

  const [services, setServices] = useState([]);
  const [initialServiceCount, setInitialServiceCount] = useState(0);

  const [status, setStatus] = useState("Pending");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentStatus, setPaymentStatus] = useState("Unpaid");

  const [paidAmount, setPaidAmount] = useState("");

  const [deepList, setDeepList] = useState([]);

  const [editingFinal, setEditingFinal] = useState(false);
  const [draftFinalTotal, setDraftFinalTotal] = useState("");

  const [serverFinalTotal, setServerFinalTotal] = useState(0);
  const [originalFinalTotal, setOriginalFinalTotal] = useState(0);
  const [currentBackendFinal, setCurrentBackendFinal] = useState(0); // backend finalTotal snapshot

  const [serverBookingAmount, setServerBookingAmount] = useState(0);

  // AYTP + refund for lead mode only
  const [amountYetToPay, setAmountYetToPay] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);

  // NEW: show which installment is due + helper note (payment request not sent)
  const [aytpStageLabel, setAytpStageLabel] = useState("");
  const [aytpNote, setAytpNote] = useState("");

  // House painting fields
  const [siteVisitCharges, setSiteVisitCharges] = useState(0);
  const [firstPaid, setFirstPaid] = useState(false);
  const [secondPaid, setSecondPaid] = useState(false);
  const [finalPaid, setFinalPaid] = useState(false);

  const [firstAmount, setFirstAmount] = useState(0);
  const [secondAmount, setSecondAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const [editingSiteVisit, setEditingSiteVisit] = useState(false);
  const [draftSiteVisit, setDraftSiteVisit] = useState("");

  // NEW: snapshot installment objects from backend (used for AYTP rules)
  const [hpPay, setHpPay] = useState({
    first: {},
    second: {},
    final: {},
  });
  const [dcPay, setDcPay] = useState({
    first: {},
    final: {},
  });

  const bookingStatus =
    enquiry?.raw?.bookingDetails?.status || enquiry?.raw?.status || "Pending";

  const isPendingBooking = bookingStatus.toLowerCase() === "pending";

  const canEditServices = ALLOWED_SERVICE_EDIT_STATUSES.includes(
    bookingStatus.toLowerCase(),
  );

  const invalidateSlot = () => {
    if (isPendingBooking) {
      setSlotDate("");
      setSlotTime("");
    }
  };

  const isHousePaintingService = services.some(
    (s) => s.category?.toLowerCase() === "house painting",
  );

  const hasDeepCleaningService = services.some(
    (s) => (s.category || "").toLowerCase() === "deep cleaning",
  );

  const hasUnselectedDeepCleaningService = services.some(
    (s) => s.category?.toLowerCase() === "deep cleaning" && !s.serviceName,
  );

  const hasExistingDeepCleaningServiceFromBackend =
    initialServiceCount > 0 &&
    services.some(
      (s) =>
        s.category?.toLowerCase() === "deep cleaning" && s.serviceName?.trim(),
    );

  const hasServiceBeenModified = services.length !== initialServiceCount;

  // Refs to track service changes
  const serviceUpdatesRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  const deepCleaningPackageIds = services
    .filter((s) => s.category?.toLowerCase() === "deep cleaning")
    .map((s) => {
      const pkg = deepList.find(
        (d) => d.name === s.serviceName || d.serviceName === s.serviceName,
      );
      return pkg?._id;
    })
    .filter(Boolean);

  /* ===========================
     HOISTED HELPERS (USED EARLY)
  ============================ */
  function n(v) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  function normStatus(s) {
    return String(s || "")
      .toLowerCase()
      .trim();
  }

  /**
   * Initial modal load calculation:
   * Use backend payment fields:
   * - Pending => requestedAmount
   * - Partial => remaining
   * - Paid => move to next installment
   * If requestedAmount is 0 (request not sent) => show note + (finalTotal - paidAmount)
   */
  function computeAYTPFromBackendInstallments({
    isHousePainting,
    finalTotal,
    paidAmount,
    hpPay,
    dcPay,
  }) {
    const FT = n(finalTotal);
    const PAID = n(paidAmount);

    if (!(FT > 0)) return { amount: 0, label: "", note: "" };

    const firstP = isHousePainting ? hpPay?.first : dcPay?.first;
    const secondP = isHousePainting ? hpPay?.second : null;
    const finalP = isHousePainting ? hpPay?.final : dcPay?.final;

    const fStatus = normStatus(firstP?.status);
    const sStatus = normStatus(secondP?.status);
    const fnStatus = normStatus(finalP?.status);

    const fReq = n(firstP?.requestedAmount);
    const sReq = n(secondP?.requestedAmount);
    const fnReq = n(finalP?.requestedAmount);

    const fRem = n(firstP?.remaining);
    const sRem = n(secondP?.remaining);
    const fnRem = n(finalP?.remaining);

    const wait = (label) => ({
      amount: 0,
      label,
      note: `Wait for payment request for ${label.toLowerCase()}.`,
    });

    const showPendingOrPartial = ({ status, req, rem, label }) => {
      // pending + requestedAmount>0 => show requestedAmount
      if (status === "pending" && req > 0) {
        return { amount: req, label, note: "" };
      }
      // partial + remaining>0 => show remaining
      if (status === "partial" && rem > 0) {
        return { amount: rem, label, note: "" };
      }
      // otherwise => wait
      return wait(label);
    };

    // ---------------- HOUSE PAINTING (first -> second -> final) ----------------
    if (isHousePainting) {
      // 1) first not paid
      if (fStatus !== "paid") {
        return showPendingOrPartial({
          status: fStatus,
          req: fReq,
          rem: fRem,
          label: "First payment",
        });
      }

      // 2) first paid, second not paid
      if (sStatus !== "paid") {
        return showPendingOrPartial({
          status: sStatus,
          req: sReq,
          rem: sRem,
          label: "Second payment",
        });
      }

      // 3) first+second paid, final not paid
      if (fnStatus !== "paid") {
        return showPendingOrPartial({
          status: fnStatus,
          req: fnReq,
          rem: fnRem,
          label: "Final payment",
        });
      }

      return { amount: 0, label: "All payments completed", note: "" };
    }

    // ---------------- DEEP CLEANING (first -> final) ----------------
    // 1) first not paid
    if (fStatus !== "paid") {
      return showPendingOrPartial({
        status: fStatus,
        req: fReq,
        rem: fRem,
        label: "First payment",
      });
    }

    // 2) first paid, final not paid
    if (fnStatus !== "paid") {
      return showPendingOrPartial({
        status: fnStatus,
        req: fnReq,
        rem: fnRem,
        label: "Final payment",
      });
    }

    return { amount: 0, label: "All payments completed", note: "" };
  }

  /**
   * When finalTotal is edited (frontend) and differs from backend finalTotal:
   * - House painting:
   *   - First not paid => 40% of edited FT
   *   - First paid & second pending => (80% FT - firstRequestedAmount(back-end))
   *   - First+second paid & final pending => (FT - (firstReq + secondReq))
   *   - Any "partial" installment => show (FT - paidAmount)
   *   - If requestedAmount is 0 (request not sent) => show note + (FT - paidAmount)
   *
   * - Deep cleaning:
   *   - First not paid => 20% of edited FT
   *   - First paid & final pending => (FT - firstRequestedAmount(back-end))
   *   - Final partial => (FT - paidAmount)
   *   - If requestedAmount is 0 => show note + (FT - paidAmount)
   */
  function computeAYTPAfterFinalTotalEdit({
    isHousePainting,
    updatedFinalTotal,
    paidAmount, // not used for partial math anymore (as per your new rules)
    hpPay,
    dcPay,
  }) {
    const FT = n(updatedFinalTotal);
    if (!(FT > 0)) return { amount: 0, label: "", note: "" };

    const firstP = isHousePainting ? hpPay?.first : dcPay?.first;
    const secondP = isHousePainting ? hpPay?.second : null;
    const finalP = isHousePainting ? hpPay?.final : dcPay?.final;

    const fStatus = normStatus(firstP?.status);
    const sStatus = normStatus(secondP?.status);
    const fnStatus = normStatus(finalP?.status);

    const firstReq = n(firstP?.requestedAmount);
    const secondReq = n(secondP?.requestedAmount);

    const firstPaidAmt = n(firstP?.amount);
    const secondPaidAmt = n(secondP?.amount);
    const finalPaidAmt = n(finalP?.amount);

    const wait = (label) => ({
      amount: 0,
      label,
      note: `Wait for payment request for ${label.toLowerCase()}.`,
    });

    const clamp0 = (v) => Math.max(0, n(v));

    // ---------------- HOUSE PAINTING ----------------
    if (isHousePainting) {
      // Stage = first (if first not paid)
      if (fStatus !== "paid") {
        const base = Math.round(FT * 0.4);

        if (fStatus === "pending") {
          return { amount: clamp0(base), label: "First payment", note: "" };
        }
        if (fStatus === "partial") {
          return {
            amount: clamp0(base - firstPaidAmt),
            label: "First payment",
            note: "",
          };
        }
        return wait("First payment");
      }

      // Stage = second (first paid, second not paid)
      if (sStatus !== "paid") {
        const base80 = Math.round(FT * 0.8);

        if (sStatus === "pending") {
          return {
            amount: clamp0(base80 - firstReq),
            label: "Second payment",
            note: "",
          };
        }
        if (sStatus === "partial") {
          return {
            amount: clamp0(base80 - (firstReq + secondPaidAmt)),
            label: "Second payment",
            note: "",
          };
        }
        return wait("Second payment");
      }

      // Stage = final (first+second paid, final not paid)
      if (fnStatus !== "paid") {
        if (fnStatus === "pending") {
          return {
            amount: clamp0(FT - (firstReq + secondReq)),
            label: "Final payment",
            note: "",
          };
        }
        if (fnStatus === "partial") {
          return {
            amount: clamp0(FT - (firstReq + secondReq + finalPaidAmt)),
            label: "Final payment",
            note: "",
          };
        }
        return wait("Final payment");
      }

      return { amount: 0, label: "All payments completed", note: "" };
    }

    // ---------------- DEEP CLEANING ----------------
    // Stage = first (if first not paid)
    if (fStatus !== "paid") {
      const base = Math.round(FT * 0.2);

      if (fStatus === "pending") {
        return { amount: clamp0(base), label: "First payment", note: "" };
      }
      if (fStatus === "partial") {
        return {
          amount: clamp0(base - firstPaidAmt),
          label: "First payment",
          note: "",
        };
      }
      return wait("First payment");
    }

    // Stage = final (first paid, final not paid)
    if (fnStatus !== "paid") {
      if (fnStatus === "pending") {
        return {
          amount: clamp0(FT - firstReq),
          label: "Final payment",
          note: "",
        };
      }
      if (fnStatus === "partial") {
        return {
          amount: clamp0(FT - (firstReq + finalPaidAmt)),
          label: "Final payment",
          note: "",
        };
      }
      return wait("Final payment");
    }

    return { amount: 0, label: "All payments completed", note: "" };
  }

  const applyManualSiteVisit = () => {
    const v = Number(draftSiteVisit || 0);

    if (!Number.isFinite(v) || v < 0) {
      alert("Site visit charges must be a valid number");
      return;
    }

    setSiteVisitCharges(v);

    // ✅ keep UI services row in sync (if house painting service exists)
    setServices((prev) =>
      prev.map((s) =>
        (s.category || "").toLowerCase() === "house painting"
          ? { ...s, price: String(v) }
          : s,
      ),
    );

    setEditingSiteVisit(false);
  };

  // -------------------------------------------
  // LOAD ENQUIRY — uses backend installment rules first
  // -------------------------------------------
  useEffect(() => {
    if (!enquiry?.raw) return;

    try {
      const {
        customer,
        address,
        selectedSlot,
        service,
        bookingDetails,
        formName: fm,
      } = enquiry.raw;

      setCustomerName(customer?.name || "");
      setCustomerPhone(
        normalizePhone(enquiry?.contact) || customer?.phone || "",
      );
      setFormName(fm || enquiry?.formName || "");

      setHouseFlatNumber(address?.houseFlatNumber || "");
      setStreetArea(address?.streetArea || "");
      setLandMark(address?.landMark || "");
      setCity(address?.city || "");
      setLocation(address?.location || null);

      setSlotDate(selectedSlot?.slotDate || "");
      setSlotTime(selectedSlot?.slotTime || "");

      // Load services
      const loadedServices = (service || []).map((s) => {
        const raw = s || {};
        const priceVal = raw.price ?? raw.totalAmount ?? raw.amount ?? "";
        return {
          category: raw.category || "Deep Cleaning",
          subCategory: raw.subCategory || "",
          serviceName: raw.serviceName || raw.name || "",
          price: priceVal !== undefined ? String(priceVal) : "",
          bookingAmount: raw.bookingAmount || "",
          packageId: raw.packageId || null,
        };
      });

      setServices(loadedServices);
      setInitialServiceCount(service?.length || 0);

      // Backend totals
      const backendOriginal = Number(bookingDetails?.originalTotalAmount || 0);
      const backendFinal = Number(
        bookingDetails?.finalTotal ?? bookingDetails?.originalTotalAmount ?? 0,
      );
      const backendPaid = Number(bookingDetails?.paidAmount || 0);
      const backendBooking = Number(bookingDetails?.bookingAmount || 0);

      setOriginalFinalTotal(backendOriginal);
      setServerFinalTotal(backendFinal);
      setCurrentBackendFinal(backendFinal);
      setDraftFinalTotal(String(backendFinal));
      setPaidAmount(String(backendPaid));
      setServerBookingAmount(backendBooking);

      // House painting info
      const isHP = (service || []).some(
        (it) => it.category?.toLowerCase() === "house painting",
      );
      const svc = Number(bookingDetails?.siteVisitCharges || 0);
      setSiteVisitCharges(svc);
      setDraftSiteVisit(String(svc || 0));

      const firstP = bookingDetails?.firstPayment || {};
      const secondP = bookingDetails?.secondPayment || {};
      const finalP = bookingDetails?.finalPayment || {};

      // Snapshot payments (for rules)
      setHpPay({
        first: {
          status: firstP?.status,
          requestedAmount: n(firstP?.requestedAmount),
          remaining: n(firstP?.remaining),
          amount: n(firstP?.amount),
        },
        second: {
          status: secondP?.status,
          requestedAmount: n(secondP?.requestedAmount),
          remaining: n(secondP?.remaining),
          amount: n(secondP?.amount),
        },
        final: {
          status: finalP?.status,
          requestedAmount: n(finalP?.requestedAmount),
          remaining: n(finalP?.remaining),
          amount: n(finalP?.amount),
        },
      });

      setDcPay({
        first: {
          status: firstP?.status,
          requestedAmount: n(firstP?.requestedAmount),
          remaining: n(firstP?.remaining),
          amount: n(firstP?.amount),
        },
        final: {
          status: finalP?.status,
          requestedAmount: n(finalP?.requestedAmount),
          remaining: n(finalP?.remaining),
          amount: n(finalP?.amount),
        },
      });

      if (isHP) {
        const fPaid = bookingDetails?.firstPayment?.status === "paid";
        const sPaid = bookingDetails?.secondPayment?.status === "paid";
        const fnPaid = bookingDetails?.finalPayment?.status === "paid";

        setFirstPaid(!!fPaid);
        setSecondPaid(!!sPaid);
        setFinalPaid(!!fnPaid);

        setFirstAmount(Number(bookingDetails?.firstPayment?.amount || 0));
        setSecondAmount(Number(bookingDetails?.secondPayment?.amount || 0));
        setFinalAmount(Number(bookingDetails?.finalPayment?.amount || 0));
      }

      // Lead mode AYTP on initial load: strictly from backend installment fields
      if (leadMode) {
        const calc = computeAYTPFromBackendInstallments({
          isHousePainting: isHP,
          finalTotal: backendFinal,
          paidAmount: backendPaid,
          hpPay: {
            first: firstP,
            second: secondP,
            final: finalP,
          },
          dcPay: {
            first: firstP,
            final: finalP,
          },
        });

        setRefundAmount(0);
        setAmountYetToPay(calc.amount);
        setAytpStageLabel(calc.label);
        setAytpNote(calc.note);
      }
    } catch (err) {
      console.error("Load enquiry error:", err);
    }

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
    }
  }, [enquiry, leadMode]);

  // ---------------------------------------
  // Deep cleaning list fetch
  // ---------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/deeppackage/deep-cleaning-packages`,
        );
        const data = await res.json();
        setDeepList(data?.data || []);
      } catch (err) {
        console.error("Error fetching deep packages:", err);
        setDeepList([]);
      }
    };
    fetchData();
  }, []);

  // ---------------------------------------
  // ADD SERVICE
  // ---------------------------------------
  const addService = () => {
    if (!canEditServices) {
      alert("Service modification is not allowed for this booking status.");
      return;
    }
    setServices((prev) => [
      ...prev,
      {
        category: "Deep Cleaning",
        subCategory: "",
        serviceName: "",
        price: "",
        bookingAmount: "",
      },
    ]);
  };

  // ---------------------------------------
  // REMOVE SERVICE (no AYTP manual calc here; unified effect handles it)
  // ---------------------------------------
  const removeService = (idx) => {
    if (!canEditServices) {
      alert("Service modification is not allowed for this booking status.");
      return;
    }
    invalidateSlot();
    if (services.length === 1) {
      alert("At least one service must remain in the booking.");
      return;
    }

    const currentServices = [...services];
    const serviceToRemove = currentServices[idx];
    const removedPrice = Number(serviceToRemove?.price || 0);

    const newServices = currentServices.filter((_, i) => i !== idx);
    const newFinalTotal = Math.max(0, serverFinalTotal - removedPrice);

    let newBookingAmount = serverBookingAmount;

    if (!leadMode) {
      newBookingAmount = Math.round(newFinalTotal * 0.2);
    }

    setServices(newServices);
    setServerFinalTotal(newFinalTotal);

    if (!leadMode) {
      setServerBookingAmount(newBookingAmount);
    }
  };

  // ---------------------------------------
  // ON SERVICE CHANGE (no AYTP manual calc here; unified effect handles it)
  // ---------------------------------------
  const onServiceChange = (idx, field, value) => {
    if (!canEditServices) return;

    setServices((prev) => {
      const copy = [...prev];
      const oldPrice = Number(copy[idx]?.price || 0);

      copy[idx] = {
        ...copy[idx],
        [field]: field === "price" && value === "" ? "" : value,
      };

      if (field === "subCategory") {
        invalidateSlot();
      }

      if (field === "price") {
        const newPrice = Number(value || 0);
        const priceDifference = newPrice - oldPrice;

        if (priceDifference !== 0 && !initialLoadRef.current) {
          setServerFinalTotal((prevTotal) => {
            const newTotal = Number(prevTotal || 0) + priceDifference;

            if (!leadMode) {
              const bookingAmt = Math.round(newTotal * 0.2);
              setServerBookingAmount(bookingAmt);
            }

            return newTotal;
          });
        }
      }

      return copy;
    });
  };

  // ---------------------------------------
  // HANDLE SERVICE SELECTION FROM DROPDOWN (no AYTP manual calc here; unified effect handles it)
  // ---------------------------------------
  const handleServiceSelection = (idx, selectedServiceName) => {
    if (!canEditServices) {
      alert("Package cannot be changed for this booking status.");
      return;
    }

    invalidateSlot();

    const selectedService = deepList.find(
      (item) =>
        item.name === selectedServiceName ||
        item.serviceName === selectedServiceName,
    );

    if (selectedService) {
      const newPrice = Number(
        selectedService.totalAmount || selectedService.price || 0,
      );

      const currentPrice = Number(services[idx]?.price || 0);
      const priceDifference = newPrice - currentPrice;

      setServices((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          serviceName: selectedServiceName,
          price: String(newPrice),
          packageId: selectedService._id,
        };
        return copy;
      });

      if (priceDifference !== 0 && !initialLoadRef.current) {
        setServerFinalTotal((prevTotal) => {
          const newTotal = Number(prevTotal || 0) + priceDifference;

          if (!leadMode) {
            const bookingAmt = Math.round(newTotal * 0.2);
            setServerBookingAmount(bookingAmt);
          }

          return newTotal;
        });
      }
    }
  };

  // ---------------------------------------
  // Lead mode AYTP recalculation (installment-aware)
  // ---------------------------------------
  useEffect(() => {
    if (!leadMode || initialLoadRef.current) return;
    if (!enquiry?.raw) return;

    const isHP = services.some(
      (s) => (s.category || "").toLowerCase() === "house painting",
    );

    const finalTotalVal = Number(serverFinalTotal || 0);

    if (!(finalTotalVal > 0)) {
      setAmountYetToPay(0);
      setRefundAmount(0);
      setAytpStageLabel("");
      setAytpNote("");
      return;
    }

    const paidVal = n(paidAmount);
    const backendFinalVal = n(currentBackendFinal);

    let result = { amount: 0, label: "", note: "" };

    if (finalTotalVal === backendFinalVal) {
      result = computeAYTPFromBackendInstallments({
        isHousePainting: isHP,
        finalTotal: finalTotalVal,
        paidAmount: paidVal,
        hpPay,
        dcPay,
      });
    } else {
      result = computeAYTPAfterFinalTotalEdit({
        isHousePainting: isHP,
        updatedFinalTotal: finalTotalVal,
        paidAmount: paidVal,
        hpPay,
        dcPay,
      });
    }

    setRefundAmount(0);
    setAmountYetToPay(Number(result.amount || 0));
    setAytpStageLabel(result.label || "");
    setAytpNote(result.note || "");
  }, [
    leadMode,
    services,
    serverFinalTotal,
    paidAmount,
    currentBackendFinal,
    hpPay,
    dcPay,
    enquiry,
  ]);

  // ---------------------------------------
  // Manual Final Total edit apply
  // ---------------------------------------
  const applyManualFinalTotal = () => {
    const manualValue = Number(draftFinalTotal || 0);

    if (!Number.isFinite(manualValue) || manualValue < 0) {
      alert("Final total must be a positive number");
      return;
    }

    setServerFinalTotal(manualValue);

    if (!leadMode) {
      const bookingAmt = Math.round(manualValue * 0.2);
      setServerBookingAmount(bookingAmt);
    }

    // LeadMode: ONLY if edited != backend -> apply your formulas,
    // else show backend installment logic
    if (leadMode) {
      const isHP = services.some(
        (s) => (s.category || "").toLowerCase() === "house painting",
      );

      const backendFT = n(currentBackendFinal);
      const editedFT = manualValue;

      if (editedFT === backendFT) {
        const calc = computeAYTPFromBackendInstallments({
          isHousePainting: isHP,
          finalTotal: backendFT,
          paidAmount: Number(paidAmount || 0),
          hpPay,
          dcPay,
        });

        setAmountYetToPay(calc.amount);
        setRefundAmount(0);
        setAytpStageLabel(calc.label);
        setAytpNote(calc.note);
      } else {
        const calc = computeAYTPAfterFinalTotalEdit({
          isHousePainting: isHP,
          updatedFinalTotal: editedFT,
          paidAmount: Number(paidAmount || 0),
          hpPay,
          dcPay,
        });

        setAmountYetToPay(calc.amount);
        setRefundAmount(0);
        setAytpStageLabel(calc.label);
        setAytpNote(calc.note);
      }
    }

    setEditingFinal(false);
  };

  const handleAddressSelect = (addressObj) => {
    if (!addressObj) return;

    invalidateSlot();

    setHouseFlatNumber(addressObj.houseFlatNumber || "");

    setStreetArea(
      addressObj.streetArea ||
        addressObj.formattedAddress ||
        addressObj.addr ||
        "",
    );

    setLandMark(addressObj.landMark || addressObj.landmark || "");

    setCity(addressObj.city || city || "");

    const lat = addressObj.latLng?.lat ?? addressObj.lat;
    const lng = addressObj.latLng?.lng ?? addressObj.lng;

    if (lat != null && lng != null) {
      setLocation({
        type: "Point",
        coordinates: [lng, lat],
      });
    }
  };

  const handleSlotSelect = ({ slotDate: sd, slotTime: st }) => {
    if (sd) setSlotDate(sd);
    if (st) setSlotTime(st);
  };

  // ---------------------------------------
  // Local UI flags for address/time modals
  // ---------------------------------------
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const canShowFinalTotalEdit =
    Number(serverFinalTotal) > 0 && Number(serverFinalTotal) != paidAmount; // because your rule is leadMode based

  const PaymentSummarySection = () => {
    const totalChange = serverFinalTotal - originalFinalTotal;

    const isDeepCleaning = services.some(
      (s) => s.category?.toLowerCase() === "deep cleaning",
    );

    // Check if the first payment status is paid and matches the requested amount
    const isFirstPaymentComplete =
      enquiry?.raw?.bookingDetails?.firstPayment?.status === "paid" &&
      enquiry?.raw?.bookingDetails?.firstPayment?.amount ===
        enquiry?.raw?.bookingDetails?.firstPayment?.requestedAmount;

    console.log("Enq", enquiry);
    console.log("isFirstPaymentComplete", enquiry?.raw, isFirstPaymentComplete);

    return (
      <div
        className="mt-3 p-3"
        style={{
          background: "#f8f9fa",
          borderRadius: 8,
          border: "1px solid #e3e3e3",
        }}
      >
        <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

        {/* HOUSE PAINTING ENQUIRY */}
        {isHousePaintingService && !leadMode && (
          <div
            className="d-flex justify-content-between mb-2"
            style={{ alignItems: "center" }}
          >
            <span>Site Visit Charges:</span>

            {editingSiteVisit ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Form.Control
                  type="number"
                  size="sm"
                  value={draftSiteVisit}
                  onChange={(e) => setDraftSiteVisit(e.target.value)}
                  style={{ width: 120 }}
                />
                <FaCheck
                  style={{ cursor: "pointer", color: "green" }}
                  onClick={applyManualSiteVisit}
                />
                <ImCancelCircle
                  style={{ cursor: "pointer", color: "red" }}
                  onClick={() => {
                    setDraftSiteVisit(String(siteVisitCharges || 0));
                    setEditingSiteVisit(false);
                  }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong>₹{siteVisitCharges}</strong>
                {canEditServices && (
                  <FaEdit
                    style={{ cursor: "pointer", color: "#7F6663" }}
                    onClick={() => {
                      setDraftSiteVisit(String(siteVisitCharges || 0));
                      setEditingSiteVisit(true);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* DEEP CLEANING ENQUIRY */}
        {isDeepCleaning && !isHousePaintingService && !leadMode && (
          <>
            <div className="d-flex justify-content-between mb-1">
              <span>Original Total Amount:</span>
              <strong>₹{originalFinalTotal}</strong>
            </div>

            {totalChange !== 0 && (
              <div className="d-flex justify-content-between mb-2">
                <span>Total Change:</span>
                <strong style={{ color: totalChange < 0 ? "red" : "green" }}>
                  {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
                </strong>
              </div>
            )}

            <div
              className="d-flex justify-content-between mb-2"
              style={{ alignItems: "center" }}
            >
              <span>{totalChange ? "New Total Amount:" : "Total Amount:"}</span>

              <div>
                {editingFinal ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Form.Control
                      type="number"
                      size="sm"
                      value={draftFinalTotal}
                      onChange={(e) => setDraftFinalTotal(e.target.value)}
                      style={{ width: 120 }}
                    />
                    <FaCheck
                      style={{ cursor: "pointer", color: "green" }}
                      onClick={applyManualFinalTotal}
                    />
                    <ImCancelCircle
                      style={{ cursor: "pointer", color: "red" }}
                      onClick={() => {
                        setDraftFinalTotal(String(serverFinalTotal));
                        setEditingFinal(false);
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <strong style={{ color: "#007a0a" }}>
                      ₹{serverFinalTotal}
                    </strong>

                    {canShowFinalTotalEdit && (
                      <FaEdit
                        style={{ cursor: "pointer", color: "#7F6663" }}
                        onClick={() => {
                          setDraftFinalTotal(String(serverFinalTotal));
                          setEditingFinal(true);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span>Booking Amount (20% of Final Total):</span>
              <strong>₹{serverBookingAmount}</strong>
            </div>
          </>
        )}

        {/* LEAD MODE */}
        {leadMode &&
          (isFirstPaymentComplete ? (
            <>
              <div className="d-flex justify-content-between mb-1">
                <span>Original Total Amount:</span>
                <strong>₹{originalFinalTotal}</strong>
              </div>

              {totalChange !== 0 && (
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Change:</span>
                  <strong style={{ color: totalChange < 0 ? "red" : "green" }}>
                    {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
                  </strong>
                </div>
              )}

              <div
                className="d-flex justify-content-between mb-2"
                style={{ alignItems: "center" }}
              >
                <span>
                  {totalChange ? "New Total Amount:" : "Total Amount:"}
                </span>

                {editingFinal ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Form.Control
                      type="number"
                      size="sm"
                      value={draftFinalTotal}
                      onChange={(e) => setDraftFinalTotal(e.target.value)}
                      style={{ width: 120 }}
                    />
                    <FaCheck
                      style={{ cursor: "pointer", color: "green" }}
                      onClick={applyManualFinalTotal}
                    />
                    <ImCancelCircle
                      style={{ cursor: "pointer", color: "red" }}
                      onClick={() => {
                        setDraftFinalTotal(String(serverFinalTotal));
                        setEditingFinal(false);
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <strong style={{ color: "#007a0a" }}>
                      ₹{serverFinalTotal}
                    </strong>
                    {canShowFinalTotalEdit && (
                      <FaEdit
                        style={{ cursor: "pointer", color: "#7F6663" }}
                        onClick={() => {
                          setDraftFinalTotal(String(serverFinalTotal));
                          setEditingFinal(true);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Amount Paid:</span>
                <strong>₹{paidAmount}</strong>
              </div>

              {aytpNote ? (
                <div
                  className="mb-2"
                  style={{ color: "#b26b00", fontSize: 12 }}
                >
                  {aytpNote}
                </div>
              ) : null}

              {refundAmount > 0 ? (
                <div className="d-flex justify-content-between mt-2">
                  <span style={{ color: "red" }}>Refund Amount:</span>
                  <strong style={{ color: "red" }}>₹{refundAmount}</strong>
                </div>
              ) : (
                <div className="d-flex justify-content-between mt-2">
                  <div>
                    <span>Amount Yet To Pay:</span>
                    <br />
                    {aytpNote == "" && <small>{aytpStageLabel}</small>}
                  </div>
                  <strong>₹{amountYetToPay}</strong>
                </div>
              )}
            </>
          ) : isHousePaintingService && siteVisitCharges > 0 ? (
            <div className="d-flex justify-content-between mb-1">
              <span>Site Visit Charge:</span>
              <strong>₹{siteVisitCharges}</strong>
            </div>
          ) : null)}
      </div>
    );
  };

  // -------------------------------------------------------
  // HANDLE SAVE
  // -------------------------------------------------------
  const handleSave = async () => {
    if (!enquiry?.bookingId) return;

    if (!customerName.trim()) return alert("Customer name is required");
    if (!customerPhone.trim() || customerPhone.length !== 10)
      return alert("Valid phone number is required");

    if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
    if (!streetArea.trim()) return alert("Street/Area is required");
    if (!city.trim()) return alert("City is required");
    if (!location?.coordinates)
      return alert("Location coordinates are required");

    if (!slotDate.trim()) return alert("Slot date is required");
    if (!slotTime.trim()) return alert("Slot time is required");

    if (services.length === 0)
      return alert("At least one service must be added.");

    for (let i = 0; i < services.length; i++) {
      const s = services[i];
      if (!s.category?.trim())
        return alert(`Service ${i + 1}: Category is required`);
      if (s.category.toLowerCase() !== "house painting") {
        if (!s.subCategory?.trim())
          return alert(`Service ${i + 1}: Subcategory is required`);
        if (!s.serviceName?.trim())
          return alert(`Service ${i + 1}: Service Name is required`);
      }
      if (s.category.toLowerCase() === "deep cleaning") {
        if (!s.price || Number(s.price) <= 0)
          return alert(
            `Service ${i + 1}: Valid price required for Deep Cleaning`,
          );
      }
    }

    setSaving(true);

    try {
      const addressPayload = {
        houseFlatNumber,
        streetArea,
        landMark,
        city,
        location: {
          type: "Point",
          coordinates: location.coordinates,
        },
      };

      const slotPayload = {
        slotDate,
        slotTime,
      };

      const normalizedServices = services.map((s) => {
        const deepPkg = deepList.find(
          (d) =>
            d._id === s.packageId ||
            d.name === s.serviceName ||
            d.serviceName === s.serviceName,
        );

        return {
          category: s.category,
          subCategory: s.subCategory,
          serviceName: s.serviceName,

          price: Number(s.price || 0),
          quantity: s.quantity ?? 1,
          coinDeduction: deepPkg?.coinsForVendor ?? 0,

          teamMembersRequired:
            s.teamMembersRequired ?? deepPkg?.teamMembers ?? 0,

          duration: s.duration ?? deepPkg?.durationMinutes ?? 0,

          bookingAmount: s.bookingAmount ?? deepPkg?.bookingAmount ?? 0,

          packageId: s.packageId ?? deepPkg?._id ?? null,
        };
      });

      normalizedServices.forEach((s, idx) => {
        if (
          (s.category || "").toLowerCase() === "deep cleaning" &&
          !s.packageId
        ) {
          throw new Error(`Service ${idx + 1} is missing package mapping`);
        }
      });

      const adjustmentAmount = Math.abs(serverFinalTotal - currentBackendFinal);
      const scopeType =
        serverFinalTotal > currentBackendFinal ? "Added" : "Reduced";
      const approvedBy = scopeType === "Added" ? "customer" : "admin";
      const currentTime = new Date().toISOString();

      let priceChange = null;
      if (adjustmentAmount > 0) {
        priceChange = {
          adjustmentAmount,
          proposedTotal: serverFinalTotal,
          reason: "",
          scopeType,
          status: "approved",
          requestedBy: "admin",
          requestedAt: currentTime,
          approvedBy: approvedBy,
          approvedAt: currentTime,
        };
      }

      let bookingDetailsPayload = {
        finalTotal: serverFinalTotal,
        bookingAmount: serverBookingAmount,
        paidAmount: Number(paidAmount),
        ...(priceChange && { priceChange }),
      };

      // ✅ always send for house painting (both enquiry + lead)
      if (isHousePaintingService) {
        bookingDetailsPayload.siteVisitCharges = Number(siteVisitCharges || 0);
      }

      const finalPayload = {
        customer: {
          name: customerName,
          phone: customerPhone,
          customerId: enquiry?.raw?.customer?.customerId,
        },
        service: normalizedServices,
        bookingDetails: bookingDetailsPayload,
        address: addressPayload,
        selectedSlot: slotPayload,
        formName,
      };

      console.log("final payload", finalPayload);

      const endpoint = leadMode
        ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
        : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Update failed.");

      onUpdated?.(data.booking);
      onClose();
    } catch (err) {
      alert(err.message || "Error updating enquiry.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // MAIN JSX RENDER
  // -------------------------------------------------------
  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="lg"
        centered
        enforceFocus={false}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16 }}>
            {title || "Edit Enquiry"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ fontSize: 13 }}>
          {/* CUSTOMER */}
          <h6 className="mb-2">Customer *</h6>
          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label>Name</Form.Label>
              <Form.Control value={customerName} readOnly size="sm" />
            </Col>

            <Col md={6}>
              <Form.Label>Phone *</Form.Label>
              <InputGroup size="sm">
                <InputGroup.Text>+91</InputGroup.Text>
                <Form.Control value={customerPhone} readOnly />
              </InputGroup>
            </Col>
          </Row>

          {/* ADDRESS SECTION */}
          {isPendingBooking && (
            <div className="d-flex justify-content-between mb-2">
              <h6 className="mb-0">Address *</h6>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowAddressModal(true)}
              >
                Change Address
              </Button>
            </div>
          )}

          <Row className="g-2 mb-3">
            <Col md={4}>
              <Form.Label>House / Flat No.</Form.Label>
              <Form.Control value={houseFlatNumber} readOnly size="sm" />
            </Col>
            <Col md={4}>
              <Form.Label>Street / Area</Form.Label>
              <Form.Control value={streetArea} readOnly size="sm" />
            </Col>
            <Col md={4}>
              <Form.Label>Landmark</Form.Label>
              <Form.Control value={landMark} readOnly size="sm" />
            </Col>
          </Row>

          <Row className="g-2 mb-3">
            <Col md={4}>
              <Form.Label>City</Form.Label>
              <Form.Control value={city} readOnly size="sm" />
            </Col>
          </Row>

          {/* SLOT */}
          {isPendingBooking && (
            <div className="d-flex justify-content-between mb-2">
              <h6 className="mb-0">Preferred Slot</h6>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  if (
                    hasExistingDeepCleaningServiceFromBackend &&
                    !hasServiceBeenModified
                  ) {
                    setShowTimeModal(true);
                    return;
                  }

                  if (hasUnselectedDeepCleaningService) {
                    alert(
                      "Please select a deep cleaning service before choosing a slot.",
                    );
                    return;
                  }

                  if (
                    hasDeepCleaningService &&
                    deepCleaningPackageIds.length === 0
                  ) {
                    alert("Selected service is not linked to a valid package.");
                    return;
                  }

                  setShowTimeModal(true);
                }}
              >
                Change Date & Slot
              </Button>
            </div>
          )}

          <Row className="g-2 mb-3">
            <Col md={6}>
              <Form.Label>Date</Form.Label>
              <Form.Control value={slotDate} readOnly size="sm" />
            </Col>
            <Col md={6}>
              <Form.Label>Time</Form.Label>
              <Form.Control value={slotTime} readOnly size="sm" />
            </Col>
          </Row>

          {/* SERVICES */}
          <div className="d-flex justify-content-between mb-2">
            <h6 className="mb-0">Services</h6>
            {!isHousePaintingService && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={addService}
                disabled={!canEditServices}
              >
                + Add Service
              </Button>
            )}
          </div>

          {services.map((s, idx) => {
            const isDC = s.category?.toLowerCase() === "deep cleaning";
            const isHP = s.category?.toLowerCase() === "house painting";

            const filteredNames = deepList
              .filter((item) => item.category === s.subCategory)
              .map((item) => ({
                label: item.name,
                value: item.name,
                price: item.totalAmount,
                bookingAmount: item.bookingAmount,
              }));

            return (
              <Row key={idx} className="g-2 mb-3 align-items-end">
                <Col md={isHP ? 4 : 3}>
                  <Form.Label className="mb-1">Category *</Form.Label>
                  <Form.Control value={s.category} disabled size="sm" />
                </Col>

                {!isHP && (
                  <Col md={3}>
                    <Form.Label className="mb-1">Subcategory</Form.Label>
                    <Form.Select
                      size="sm"
                      value={s.subCategory}
                      disabled={!canEditServices}
                      onChange={(e) =>
                        onServiceChange(idx, "subCategory", e.target.value)
                      }
                    >
                      <option value="">Select Category *</option>
                      {[...new Set(deepList.map((i) => i.category))].map(
                        (cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ),
                      )}
                    </Form.Select>
                  </Col>
                )}

                {!isHP && (
                  <Col md={3}>
                    <Form.Label className="mb-1">Service Name *</Form.Label>
                    <Form.Select
                      size="sm"
                      value={s.serviceName}
                      disabled={!canEditServices}
                      onChange={(e) => {
                        handleServiceSelection(idx, e.target.value);
                      }}
                    >
                      <option value="">Select Service *</option>
                      {filteredNames.map((i) => (
                        <option key={i.value} value={i.value}>
                          {i.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                )}

                <Col md={isHP ? 4 : 2}>
                  <Form.Label className="mb-1">
                    {isDC ? "Price (₹)" : "Site Visit (₹)"}
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    type="number"
                    value={s.price}
                    onChange={(e) =>
                      onServiceChange(idx, "price", e.target.value)
                    }
                    disabled={true}
                  />
                </Col>

                {!isHP && (
                  <Col md={1} className="text-end">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeService(idx)}
                      disabled={!canEditServices}
                    >
                      ×
                    </Button>
                  </Col>
                )}
              </Row>
            );
          })}

          <Row className="mt-3">
            <Col md={3}>
              <Form.Label>Form Name *</Form.Label>
              <Form.Control value={formName} size="sm" disabled />
            </Col>
          </Row>
        </Modal.Body>

        {/* PAYMENT SUMMARY */}
        {PaymentSummarySection()}

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <AddressPickerModal
          initialAddress={streetArea}
          initialLatLng={
            location
              ? { lat: location.coordinates[1], lng: location.coordinates[0] }
              : undefined
          }
          onClose={() => setShowAddressModal(false)}
          onSelect={handleAddressSelect}
          bookingId={enquiry?.bookingId}
        />
      )}

      {/* TIME MODAL */}
      {showTimeModal && (
        <TimePickerModal
          onClose={() => setShowTimeModal(false)}
          onSelect={handleSlotSelect}
          serviceType={
            hasDeepCleaningService ? "deep_cleaning" : "house_painting"
          }
          packageId={hasDeepCleaningService ? deepCleaningPackageIds : []}
          coordinates={{
            lat: location?.coordinates?.[1],
            lng: location?.coordinates?.[0],
          }}
        />
      )}
    </>
  );
};

export default EditEnquiryModal;

// /* ===== FILE: EditEnquiryModal.jsx (FULL UPDATED working code) ===== */
// import React, { useEffect, useState, useRef } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// import { ImCancelCircle } from "react-icons/im";
// import { FaCheck } from "react-icons/fa6";
// import { FaEdit } from "react-icons/fa";

// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

// const ALLOWED_SERVICE_EDIT_STATUSES = [
//   "pending",
//   "confirmed",
//   "rescheduled",
//   "customer unreachable",
// ];

// const EditEnquiryModal = ({
//   show,
//   onClose,
//   enquiry,
//   onUpdated,
//   title,
//   leadMode = false,
// }) => {
//   const [saving, setSaving] = useState(false);

//   const [customerName, setCustomerName] = useState("");
//   const [customerPhone, setCustomerPhone] = useState("");

//   const [formName, setFormName] = useState("");

//   const [houseFlatNumber, setHouseFlatNumber] = useState("");
//   const [streetArea, setStreetArea] = useState("");
//   const [landMark, setLandMark] = useState("");
//   const [city, setCity] = useState("");
//   const [location, setLocation] = useState(null);

//   const [slotDate, setSlotDate] = useState("");
//   const [slotTime, setSlotTime] = useState("");

//   const [services, setServices] = useState([]);
//   const [initialServiceCount, setInitialServiceCount] = useState(0);

//   const [status, setStatus] = useState("Pending");
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paymentStatus, setPaymentStatus] = useState("Unpaid");

//   const [paidAmount, setPaidAmount] = useState("");

//   const [deepList, setDeepList] = useState([]);

//   const [editingFinal, setEditingFinal] = useState(false);
//   const [draftFinalTotal, setDraftFinalTotal] = useState("");

//   const [serverFinalTotal, setServerFinalTotal] = useState(0);
//   const [originalFinalTotal, setOriginalFinalTotal] = useState(0);
//   const [currentBackendFinal, setCurrentBackendFinal] = useState(0); // backend finalTotal snapshot

//   const [serverBookingAmount, setServerBookingAmount] = useState(0);

//   // AYTP + refund for lead mode only
//   const [amountYetToPay, setAmountYetToPay] = useState(0);
//   const [refundAmount, setRefundAmount] = useState(0);

//   // NEW: show which installment is due + helper note (payment request not sent)
//   const [aytpStageLabel, setAytpStageLabel] = useState("");
//   const [aytpNote, setAytpNote] = useState("");

//   // House painting fields
//   const [siteVisitCharges, setSiteVisitCharges] = useState(0);
//   const [firstPaid, setFirstPaid] = useState(false);
//   const [secondPaid, setSecondPaid] = useState(false);
//   const [finalPaid, setFinalPaid] = useState(false);

//   const [firstAmount, setFirstAmount] = useState(0);
//   const [secondAmount, setSecondAmount] = useState(0);
//   const [finalAmount, setFinalAmount] = useState(0);

//   // NEW: snapshot installment objects from backend (used for AYTP rules)
//   const [hpPay, setHpPay] = useState({
//     first: {},
//     second: {},
//     final: {},
//   });
//   const [dcPay, setDcPay] = useState({
//     first: {},
//     final: {},
//   });

//   const bookingStatus =
//     enquiry?.raw?.bookingDetails?.status || enquiry?.raw?.status || "Pending";

//   const isPendingBooking = bookingStatus.toLowerCase() === "pending";

//   const canEditServices = ALLOWED_SERVICE_EDIT_STATUSES.includes(
//     bookingStatus.toLowerCase(),
//   );

//   const invalidateSlot = () => {
//     if (isPendingBooking) {
//       setSlotDate("");
//       setSlotTime("");
//     }
//   };

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting",
//   );

//   const hasDeepCleaningService = services.some(
//     (s) => (s.category || "").toLowerCase() === "deep cleaning",
//   );

//   const hasUnselectedDeepCleaningService = services.some(
//     (s) => s.category?.toLowerCase() === "deep cleaning" && !s.serviceName,
//   );

//   const hasExistingDeepCleaningServiceFromBackend =
//     initialServiceCount > 0 &&
//     services.some(
//       (s) =>
//         s.category?.toLowerCase() === "deep cleaning" && s.serviceName?.trim(),
//     );

//   const hasServiceBeenModified = services.length !== initialServiceCount;

//   // Refs to track service changes
//   const serviceUpdatesRef = useRef(new Set());
//   const initialLoadRef = useRef(true);

//   const deepCleaningPackageIds = services
//     .filter((s) => s.category?.toLowerCase() === "deep cleaning")
//     .map((s) => {
//       const pkg = deepList.find(
//         (d) => d.name === s.serviceName || d.serviceName === s.serviceName,
//       );
//       return pkg?._id;
//     })
//     .filter(Boolean);

//   /* ===========================
//      HOISTED HELPERS (USED EARLY)
//   ============================ */
//   function n(v) {
//     const x = Number(v);
//     return Number.isFinite(x) ? x : 0;
//   }

//   function normStatus(s) {
//     return String(s || "")
//       .toLowerCase()
//       .trim();
//   }

//   /**
//    * Initial modal load calculation:
//    * Use backend payment fields:
//    * - Pending => requestedAmount
//    * - Partial => remaining
//    * - Paid => move to next installment
//    * If requestedAmount is 0 (request not sent) => show note + (finalTotal - paidAmount)
//    */
//   function computeAYTPFromBackendInstallments({
//     isHousePainting,
//     finalTotal,
//     paidAmount,
//     hpPay,
//     dcPay,
//   }) {
//     const FT = n(finalTotal);
//     const PAID = n(paidAmount);

//     if (!(FT > 0)) return { amount: 0, label: "", note: "" };

//     const firstP = isHousePainting ? hpPay?.first : dcPay?.first;
//     const secondP = isHousePainting ? hpPay?.second : null;
//     const finalP = isHousePainting ? hpPay?.final : dcPay?.final;

//     const fStatus = normStatus(firstP?.status);
//     const sStatus = normStatus(secondP?.status);
//     const fnStatus = normStatus(finalP?.status);

//     const fReq = n(firstP?.requestedAmount);
//     const sReq = n(secondP?.requestedAmount);
//     const fnReq = n(finalP?.requestedAmount);

//     const fRem = n(firstP?.remaining);
//     const sRem = n(secondP?.remaining);
//     const fnRem = n(finalP?.remaining);

//     const wait = (label) => ({
//       amount: 0,
//       label,
//       note: `Wait for payment request for ${label.toLowerCase()}.`,
//     });

//     const showPendingOrPartial = ({ status, req, rem, label }) => {
//       // pending + requestedAmount>0 => show requestedAmount
//       if (status === "pending" && req > 0) {
//         return { amount: req, label, note: "" };
//       }
//       // partial + remaining>0 => show remaining
//       if (status === "partial" && rem > 0) {
//         return { amount: rem, label, note: "" };
//       }
//       // otherwise => wait
//       return wait(label);
//     };

//     // ---------------- HOUSE PAINTING (first -> second -> final) ----------------
//     if (isHousePainting) {
//       // 1) first not paid
//       if (fStatus !== "paid") {
//         return showPendingOrPartial({
//           status: fStatus,
//           req: fReq,
//           rem: fRem,
//           label: "First payment",
//         });
//       }

//       // 2) first paid, second not paid
//       if (sStatus !== "paid") {
//         return showPendingOrPartial({
//           status: sStatus,
//           req: sReq,
//           rem: sRem,
//           label: "Second payment",
//         });
//       }

//       // 3) first+second paid, final not paid
//       if (fnStatus !== "paid") {
//         return showPendingOrPartial({
//           status: fnStatus,
//           req: fnReq,
//           rem: fnRem,
//           label: "Final payment",
//         });
//       }

//       return { amount: 0, label: "All payments completed", note: "" };
//     }

//     // ---------------- DEEP CLEANING (first -> final) ----------------
//     // 1) first not paid
//     if (fStatus !== "paid") {
//       return showPendingOrPartial({
//         status: fStatus,
//         req: fReq,
//         rem: fRem,
//         label: "First payment",
//       });
//     }

//     // 2) first paid, final not paid
//     if (fnStatus !== "paid") {
//       return showPendingOrPartial({
//         status: fnStatus,
//         req: fnReq,
//         rem: fnRem,
//         label: "Final payment",
//       });
//     }

//     return { amount: 0, label: "All payments completed", note: "" };
//   }

//   /**
//    * When finalTotal is edited (frontend) and differs from backend finalTotal:
//    * - House painting:
//    *   - First not paid => 40% of edited FT
//    *   - First paid & second pending => (80% FT - firstRequestedAmount(back-end))
//    *   - First+second paid & final pending => (FT - (firstReq + secondReq))
//    *   - Any "partial" installment => show (FT - paidAmount)
//    *   - If requestedAmount is 0 (request not sent) => show note + (FT - paidAmount)
//    *
//    * - Deep cleaning:
//    *   - First not paid => 20% of edited FT
//    *   - First paid & final pending => (FT - firstRequestedAmount(back-end))
//    *   - Final partial => (FT - paidAmount)
//    *   - If requestedAmount is 0 => show note + (FT - paidAmount)
//    */
//   function computeAYTPAfterFinalTotalEdit({
//     isHousePainting,
//     updatedFinalTotal,
//     paidAmount, // not used for partial math anymore (as per your new rules)
//     hpPay,
//     dcPay,
//   }) {
//     const FT = n(updatedFinalTotal);
//     if (!(FT > 0)) return { amount: 0, label: "", note: "" };

//     const firstP = isHousePainting ? hpPay?.first : dcPay?.first;
//     const secondP = isHousePainting ? hpPay?.second : null;
//     const finalP = isHousePainting ? hpPay?.final : dcPay?.final;

//     const fStatus = normStatus(firstP?.status);
//     const sStatus = normStatus(secondP?.status);
//     const fnStatus = normStatus(finalP?.status);

//     const firstReq = n(firstP?.requestedAmount);
//     const secondReq = n(secondP?.requestedAmount);

//     const firstPaidAmt = n(firstP?.amount);
//     const secondPaidAmt = n(secondP?.amount);
//     const finalPaidAmt = n(finalP?.amount);

//     const wait = (label) => ({
//       amount: 0,
//       label,
//       note: `Wait for payment request for ${label.toLowerCase()}.`,
//     });

//     const clamp0 = (v) => Math.max(0, n(v));

//     // ---------------- HOUSE PAINTING ----------------
//     if (isHousePainting) {
//       // Stage = first (if first not paid)
//       if (fStatus !== "paid") {
//         const base = Math.round(FT * 0.4);

//         if (fStatus === "pending") {
//           return { amount: clamp0(base), label: "First payment", note: "" };
//         }
//         if (fStatus === "partial") {
//           return {
//             amount: clamp0(base - firstPaidAmt),
//             label: "First payment",
//             note: "",
//           };
//         }
//         return wait("First payment");
//       }

//       // Stage = second (first paid, second not paid)
//       if (sStatus !== "paid") {
//         const base80 = Math.round(FT * 0.8);

//         if (sStatus === "pending") {
//           return {
//             amount: clamp0(base80 - firstReq),
//             label: "Second payment",
//             note: "",
//           };
//         }
//         if (sStatus === "partial") {
//           return {
//             amount: clamp0(base80 - (firstReq + secondPaidAmt)),
//             label: "Second payment",
//             note: "",
//           };
//         }
//         return wait("Second payment");
//       }

//       // Stage = final (first+second paid, final not paid)
//       if (fnStatus !== "paid") {
//         if (fnStatus === "pending") {
//           return {
//             amount: clamp0(FT - (firstReq + secondReq)),
//             label: "Final payment",
//             note: "",
//           };
//         }
//         if (fnStatus === "partial") {
//           return {
//             amount: clamp0(FT - (firstReq + secondReq + finalPaidAmt)),
//             label: "Final payment",
//             note: "",
//           };
//         }
//         return wait("Final payment");
//       }

//       return { amount: 0, label: "All payments completed", note: "" };
//     }

//     // ---------------- DEEP CLEANING ----------------
//     // Stage = first (if first not paid)
//     if (fStatus !== "paid") {
//       const base = Math.round(FT * 0.2);

//       if (fStatus === "pending") {
//         return { amount: clamp0(base), label: "First payment", note: "" };
//       }
//       if (fStatus === "partial") {
//         return {
//           amount: clamp0(base - firstPaidAmt),
//           label: "First payment",
//           note: "",
//         };
//       }
//       return wait("First payment");
//     }

//     // Stage = final (first paid, final not paid)
//     if (fnStatus !== "paid") {
//       if (fnStatus === "pending") {
//         return {
//           amount: clamp0(FT - firstReq),
//           label: "Final payment",
//           note: "",
//         };
//       }
//       if (fnStatus === "partial") {
//         return {
//           amount: clamp0(FT - (firstReq + finalPaidAmt)),
//           label: "Final payment",
//           note: "",
//         };
//       }
//       return wait("Final payment");
//     }

//     return { amount: 0, label: "All payments completed", note: "" };
//   }

//   // -------------------------------------------
//   // LOAD ENQUIRY — uses backend installment rules first
//   // -------------------------------------------
//   useEffect(() => {
//     if (!enquiry?.raw) return;

//     try {
//       const {
//         customer,
//         address,
//         selectedSlot,
//         service,
//         bookingDetails,
//         formName: fm,
//       } = enquiry.raw;

//       setCustomerName(customer?.name || "");
//       setCustomerPhone(
//         normalizePhone(enquiry?.contact) || customer?.phone || "",
//       );
//       setFormName(fm || enquiry?.formName || "");

//       setHouseFlatNumber(address?.houseFlatNumber || "");
//       setStreetArea(address?.streetArea || "");
//       setLandMark(address?.landMark || "");
//       setCity(address?.city || "");
//       setLocation(address?.location || null);

//       setSlotDate(selectedSlot?.slotDate || "");
//       setSlotTime(selectedSlot?.slotTime || "");

//       // Load services
//       const loadedServices = (service || []).map((s) => {
//         const raw = s || {};
//         const priceVal = raw.price ?? raw.totalAmount ?? raw.amount ?? "";
//         return {
//           category: raw.category || "Deep Cleaning",
//           subCategory: raw.subCategory || "",
//           serviceName: raw.serviceName || raw.name || "",
//           price: priceVal !== undefined ? String(priceVal) : "",
//           bookingAmount: raw.bookingAmount || "",
//           packageId: raw.packageId || null,
//         };
//       });

//       setServices(loadedServices);
//       setInitialServiceCount(service?.length || 0);

//       // Backend totals
//       const backendOriginal = Number(bookingDetails?.originalTotalAmount || 0);
//       const backendFinal = Number(
//         bookingDetails?.finalTotal ?? bookingDetails?.originalTotalAmount ?? 0,
//       );
//       const backendPaid = Number(bookingDetails?.paidAmount || 0);
//       const backendBooking = Number(bookingDetails?.bookingAmount || 0);

//       setOriginalFinalTotal(backendOriginal);
//       setServerFinalTotal(backendFinal);
//       setCurrentBackendFinal(backendFinal);
//       setDraftFinalTotal(String(backendFinal));
//       setPaidAmount(String(backendPaid));
//       setServerBookingAmount(backendBooking);

//       // House painting info
//       const isHP = (service || []).some(
//         (it) => it.category?.toLowerCase() === "house painting",
//       );
//       const svc = Number(bookingDetails?.siteVisitCharges || 0);
//       setSiteVisitCharges(svc);

//       const firstP = bookingDetails?.firstPayment || {};
//       const secondP = bookingDetails?.secondPayment || {};
//       const finalP = bookingDetails?.finalPayment || {};

//       // Snapshot payments (for rules)
//       setHpPay({
//         first: {
//           status: firstP?.status,
//           requestedAmount: n(firstP?.requestedAmount),
//           remaining: n(firstP?.remaining),
//           amount: n(firstP?.amount),
//         },
//         second: {
//           status: secondP?.status,
//           requestedAmount: n(secondP?.requestedAmount),
//           remaining: n(secondP?.remaining),
//           amount: n(secondP?.amount),
//         },
//         final: {
//           status: finalP?.status,
//           requestedAmount: n(finalP?.requestedAmount),
//           remaining: n(finalP?.remaining),
//           amount: n(finalP?.amount),
//         },
//       });

//       setDcPay({
//         first: {
//           status: firstP?.status,
//           requestedAmount: n(firstP?.requestedAmount),
//           remaining: n(firstP?.remaining),
//           amount: n(firstP?.amount),
//         },
//         final: {
//           status: finalP?.status,
//           requestedAmount: n(finalP?.requestedAmount),
//           remaining: n(finalP?.remaining),
//           amount: n(finalP?.amount),
//         },
//       });

//       if (isHP) {
//         const fPaid = bookingDetails?.firstPayment?.status === "paid";
//         const sPaid = bookingDetails?.secondPayment?.status === "paid";
//         const fnPaid = bookingDetails?.finalPayment?.status === "paid";

//         setFirstPaid(!!fPaid);
//         setSecondPaid(!!sPaid);
//         setFinalPaid(!!fnPaid);

//         setFirstAmount(Number(bookingDetails?.firstPayment?.amount || 0));
//         setSecondAmount(Number(bookingDetails?.secondPayment?.amount || 0));
//         setFinalAmount(Number(bookingDetails?.finalPayment?.amount || 0));
//       }

//       // Lead mode AYTP on initial load: strictly from backend installment fields
//       if (leadMode) {
//         const calc = computeAYTPFromBackendInstallments({
//           isHousePainting: isHP,
//           finalTotal: backendFinal,
//           paidAmount: backendPaid,
//           hpPay: {
//             first: firstP,
//             second: secondP,
//             final: finalP,
//           },
//           dcPay: {
//             first: firstP,
//             final: finalP,
//           },
//         });

//         setRefundAmount(0);
//         setAmountYetToPay(calc.amount);
//         setAytpStageLabel(calc.label);
//         setAytpNote(calc.note);
//       }
//     } catch (err) {
//       console.error("Load enquiry error:", err);
//     }

//     if (initialLoadRef.current) {
//       initialLoadRef.current = false;
//     }
//   }, [enquiry, leadMode]);

//   // ---------------------------------------
//   // Deep cleaning list fetch
//   // ---------------------------------------
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`,
//         );
//         const data = await res.json();
//         setDeepList(data?.data || []);
//       } catch (err) {
//         console.error("Error fetching deep packages:", err);
//         setDeepList([]);
//       }
//     };
//     fetchData();
//   }, []);

//   // ---------------------------------------
//   // ADD SERVICE
//   // ---------------------------------------
//   const addService = () => {
//     if (!canEditServices) {
//       alert("Service modification is not allowed for this booking status.");
//       return;
//     }
//     setServices((prev) => [
//       ...prev,
//       {
//         category: "Deep Cleaning",
//         subCategory: "",
//         serviceName: "",
//         price: "",
//         bookingAmount: "",
//       },
//     ]);
//   };

//   // ---------------------------------------
//   // REMOVE SERVICE (no AYTP manual calc here; unified effect handles it)
//   // ---------------------------------------
//   const removeService = (idx) => {
//     if (!canEditServices) {
//       alert("Service modification is not allowed for this booking status.");
//       return;
//     }
//     invalidateSlot();
//     if (services.length === 1) {
//       alert("At least one service must remain in the booking.");
//       return;
//     }

//     const currentServices = [...services];
//     const serviceToRemove = currentServices[idx];
//     const removedPrice = Number(serviceToRemove?.price || 0);

//     const newServices = currentServices.filter((_, i) => i !== idx);
//     const newFinalTotal = Math.max(0, serverFinalTotal - removedPrice);

//     let newBookingAmount = serverBookingAmount;

//     if (!leadMode) {
//       newBookingAmount = Math.round(newFinalTotal * 0.2);
//     }

//     setServices(newServices);
//     setServerFinalTotal(newFinalTotal);

//     if (!leadMode) {
//       setServerBookingAmount(newBookingAmount);
//     }
//   };

//   // ---------------------------------------
//   // ON SERVICE CHANGE (no AYTP manual calc here; unified effect handles it)
//   // ---------------------------------------
//   const onServiceChange = (idx, field, value) => {
//     if (!canEditServices) return;

//     setServices((prev) => {
//       const copy = [...prev];
//       const oldPrice = Number(copy[idx]?.price || 0);

//       copy[idx] = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };

//       if (field === "subCategory") {
//         invalidateSlot();
//       }

//       if (field === "price") {
//         const newPrice = Number(value || 0);
//         const priceDifference = newPrice - oldPrice;

//         if (priceDifference !== 0 && !initialLoadRef.current) {
//           setServerFinalTotal((prevTotal) => {
//             const newTotal = Number(prevTotal || 0) + priceDifference;

//             if (!leadMode) {
//               const bookingAmt = Math.round(newTotal * 0.2);
//               setServerBookingAmount(bookingAmt);
//             }

//             return newTotal;
//           });
//         }
//       }

//       return copy;
//     });
//   };

//   // ---------------------------------------
//   // HANDLE SERVICE SELECTION FROM DROPDOWN (no AYTP manual calc here; unified effect handles it)
//   // ---------------------------------------
//   const handleServiceSelection = (idx, selectedServiceName) => {
//     if (!canEditServices) {
//       alert("Package cannot be changed for this booking status.");
//       return;
//     }

//     invalidateSlot();

//     const selectedService = deepList.find(
//       (item) =>
//         item.name === selectedServiceName ||
//         item.serviceName === selectedServiceName,
//     );

//     if (selectedService) {
//       const newPrice = Number(
//         selectedService.totalAmount || selectedService.price || 0,
//       );

//       const currentPrice = Number(services[idx]?.price || 0);
//       const priceDifference = newPrice - currentPrice;

//       setServices((prev) => {
//         const copy = [...prev];
//         copy[idx] = {
//           ...copy[idx],
//           serviceName: selectedServiceName,
//           price: String(newPrice),
//           packageId: selectedService._id,
//         };
//         return copy;
//       });

//       if (priceDifference !== 0 && !initialLoadRef.current) {
//         setServerFinalTotal((prevTotal) => {
//           const newTotal = Number(prevTotal || 0) + priceDifference;

//           if (!leadMode) {
//             const bookingAmt = Math.round(newTotal * 0.2);
//             setServerBookingAmount(bookingAmt);
//           }

//           return newTotal;
//         });
//       }
//     }
//   };

//   // ---------------------------------------
//   // Lead mode AYTP recalculation (installment-aware)
//   // ---------------------------------------
//   useEffect(() => {
//     if (!leadMode || initialLoadRef.current) return;
//     if (!enquiry?.raw) return;

//     const isHP = services.some(
//       (s) => (s.category || "").toLowerCase() === "house painting",
//     );

//     const finalTotalVal = Number(serverFinalTotal || 0);

//     if (!(finalTotalVal > 0)) {
//       setAmountYetToPay(0);
//       setRefundAmount(0);
//       setAytpStageLabel("");
//       setAytpNote("");
//       return;
//     }

//     const paidVal = n(paidAmount);
//     const backendFinalVal = n(currentBackendFinal);

//     let result = { amount: 0, label: "", note: "" };

//     if (finalTotalVal === backendFinalVal) {
//       result = computeAYTPFromBackendInstallments({
//         isHousePainting: isHP,
//         finalTotal: finalTotalVal,
//         paidAmount: paidVal,
//         hpPay,
//         dcPay,
//       });
//     } else {
//       result = computeAYTPAfterFinalTotalEdit({
//         isHousePainting: isHP,
//         updatedFinalTotal: finalTotalVal,
//         paidAmount: paidVal,
//         hpPay,
//         dcPay,
//       });
//     }

//     setRefundAmount(0);
//     setAmountYetToPay(Number(result.amount || 0));
//     setAytpStageLabel(result.label || "");
//     setAytpNote(result.note || "");
//   }, [
//     leadMode,
//     services,
//     serverFinalTotal,
//     paidAmount,
//     currentBackendFinal,
//     hpPay,
//     dcPay,
//     enquiry,
//   ]);

//   // ---------------------------------------
//   // Manual Final Total edit apply
//   // ---------------------------------------
//   const applyManualFinalTotal = () => {
//     const manualValue = Number(draftFinalTotal || 0);

//     if (!Number.isFinite(manualValue) || manualValue < 0) {
//       alert("Final total must be a positive number");
//       return;
//     }

//     setServerFinalTotal(manualValue);

//     if (!leadMode) {
//       const bookingAmt = Math.round(manualValue * 0.2);
//       setServerBookingAmount(bookingAmt);
//     }

//     // LeadMode: ONLY if edited != backend -> apply your formulas,
//     // else show backend installment logic
//     if (leadMode) {
//       const isHP = services.some(
//         (s) => (s.category || "").toLowerCase() === "house painting",
//       );

//       const backendFT = n(currentBackendFinal);
//       const editedFT = manualValue;

//       if (editedFT === backendFT) {
//         const calc = computeAYTPFromBackendInstallments({
//           isHousePainting: isHP,
//           finalTotal: backendFT,
//           paidAmount: Number(paidAmount || 0),
//           hpPay,
//           dcPay,
//         });

//         setAmountYetToPay(calc.amount);
//         setRefundAmount(0);
//         setAytpStageLabel(calc.label);
//         setAytpNote(calc.note);
//       } else {
//         const calc = computeAYTPAfterFinalTotalEdit({
//           isHousePainting: isHP,
//           updatedFinalTotal: editedFT,
//           paidAmount: Number(paidAmount || 0),
//           hpPay,
//           dcPay,
//         });

//         setAmountYetToPay(calc.amount);
//         setRefundAmount(0);
//         setAytpStageLabel(calc.label);
//         setAytpNote(calc.note);
//       }
//     }

//     setEditingFinal(false);
//   };

//   const handleAddressSelect = (addressObj) => {
//     if (!addressObj) return;

//     invalidateSlot();

//     setHouseFlatNumber(addressObj.houseFlatNumber || "");

//     setStreetArea(
//       addressObj.streetArea ||
//         addressObj.formattedAddress ||
//         addressObj.addr ||
//         "",
//     );

//     setLandMark(addressObj.landMark || addressObj.landmark || "");

//     setCity(addressObj.city || city || "");

//     const lat = addressObj.latLng?.lat ?? addressObj.lat;
//     const lng = addressObj.latLng?.lng ?? addressObj.lng;

//     if (lat != null && lng != null) {
//       setLocation({
//         type: "Point",
//         coordinates: [lng, lat],
//       });
//     }
//   };

//   const handleSlotSelect = ({ slotDate: sd, slotTime: st }) => {
//     if (sd) setSlotDate(sd);
//     if (st) setSlotTime(st);
//   };

//   // ---------------------------------------
//   // Local UI flags for address/time modals
//   // ---------------------------------------
//   const [showAddressModal, setShowAddressModal] = useState(false);
//   const [showTimeModal, setShowTimeModal] = useState(false);

//   const canShowFinalTotalEdit =
//     Number(serverFinalTotal) > 0 && Number(serverFinalTotal) != paidAmount; // because your rule is leadMode based

//   const PaymentSummarySection = () => {
//     const totalChange = serverFinalTotal - originalFinalTotal;

//     const isDeepCleaning = services.some(
//       (s) => s.category?.toLowerCase() === "deep cleaning",
//     );
//     return (
//       <div
//         className="mt-3 p-3"
//         style={{
//           background: "#f8f9fa",
//           borderRadius: 8,
//           border: "1px solid #e3e3e3",
//         }}
//       >
//         <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//         {/* HOUSE PAINTING ENQUIRY */}
//         {isHousePaintingService && !leadMode && (
//           <>
//             <div className="d-flex justify-content-between mb-2">
//               <span>Site Visit Charges:</span>
//               <strong>₹{siteVisitCharges}</strong>
//             </div>
//           </>
//         )}

//         {/* DEEP CLEANING ENQUIRY */}
//         {isDeepCleaning && !isHousePaintingService && !leadMode && (
//           <>
//             <div className="d-flex justify-content-between mb-1">
//               <span>Original Total Amount:</span>
//               <strong>₹{originalFinalTotal}</strong>
//             </div>

//             {totalChange !== 0 && (
//               <div className="d-flex justify-content-between mb-2">
//                 <span>Total Change:</span>
//                 <strong style={{ color: totalChange < 0 ? "red" : "green" }}>
//                   {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
//                 </strong>
//               </div>
//             )}

//             <div
//               className="d-flex justify-content-between mb-2"
//               style={{ alignItems: "center" }}
//             >
//               <span>{totalChange ? "New Total Amount:" : "Total Amount:"}</span>

//               <div>
//                 {editingFinal ? (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     <Form.Control
//                       type="number"
//                       size="sm"
//                       value={draftFinalTotal}
//                       onChange={(e) => setDraftFinalTotal(e.target.value)}
//                       style={{ width: 120 }}
//                     />
//                     <FaCheck
//                       style={{ cursor: "pointer", color: "green" }}
//                       onClick={applyManualFinalTotal}
//                     />
//                     <ImCancelCircle
//                       style={{ cursor: "pointer", color: "red" }}
//                       onClick={() => {
//                         setDraftFinalTotal(String(serverFinalTotal));
//                         setEditingFinal(false);
//                       }}
//                     />
//                   </div>
//                 ) : (
//                   <div
//                     style={{ display: "flex", alignItems: "center", gap: 8 }}
//                   >
//                     <strong style={{ color: "#007a0a" }}>
//                       ₹{serverFinalTotal}
//                     </strong>

//                     {canShowFinalTotalEdit && (
//                       <FaEdit
//                         style={{ cursor: "pointer", color: "#7F6663" }}
//                         onClick={() => {
//                           setDraftFinalTotal(String(serverFinalTotal));
//                           setEditingFinal(true);
//                         }}
//                       />
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="d-flex justify-content-between mb-2">
//               <span>Booking Amount (20% of Final Total):</span>
//               <strong>₹{serverBookingAmount}</strong>
//             </div>
//           </>
//         )}

//         {/* LEAD MODE */}
//         {leadMode && (
//           <>
//             <div className="d-flex justify-content-between mb-1">
//               <span>Original Total Amount:</span>
//               <strong>₹{originalFinalTotal}</strong>
//             </div>

//             {totalChange !== 0 && (
//               <div className="d-flex justify-content-between mb-2">
//                 <span>Total Change:</span>
//                 <strong style={{ color: totalChange < 0 ? "red" : "green" }}>
//                   {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
//                 </strong>
//               </div>
//             )}

//             <div
//               className="d-flex justify-content-between mb-2"
//               style={{ alignItems: "center" }}
//             >
//               <span>{totalChange ? "New Total Amount:" : "Total Amount:"}</span>

//               {editingFinal ? (
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <Form.Control
//                     type="number"
//                     size="sm"
//                     value={draftFinalTotal}
//                     onChange={(e) => setDraftFinalTotal(e.target.value)}
//                     style={{ width: 120 }}
//                   />
//                   <FaCheck
//                     style={{ cursor: "pointer", color: "green" }}
//                     onClick={applyManualFinalTotal}
//                   />
//                   <ImCancelCircle
//                     style={{ cursor: "pointer", color: "red" }}
//                     onClick={() => {
//                       setDraftFinalTotal(String(serverFinalTotal));
//                       setEditingFinal(false);
//                     }}
//                   />
//                 </div>
//               ) : (
//                 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                   <strong style={{ color: "#007a0a" }}>
//                     ₹{serverFinalTotal}
//                   </strong>
//                   {canShowFinalTotalEdit && (
//                     <FaEdit
//                       style={{ cursor: "pointer", color: "#7F6663" }}
//                       onClick={() => {
//                         setDraftFinalTotal(String(serverFinalTotal));
//                         setEditingFinal(true);
//                       }}
//                     />
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="d-flex justify-content-between mb-2">
//               <span>Amount Paid:</span>
//               <strong>₹{paidAmount}</strong>
//             </div>

//             {/* NEW: Stage label + note */}
//             {/* {aytpStageLabel ? (
//               <div className="d-flex justify-content-between mb-2">
//                 <span>Installment Due:</span>
//                 <strong>{aytpStageLabel}</strong>
//               </div>
//             ) : null} */}

//             {aytpNote ? (
//               <div className="mb-2" style={{ color: "#b26b00", fontSize: 12 }}>
//                 {aytpNote}
//               </div>
//             ) : null}

//             {refundAmount > 0 ? (
//               <div className="d-flex justify-content-between mt-2">
//                 <span style={{ color: "red" }}>Refund Amount:</span>
//                 <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//               </div>
//             ) : (
//               <div className="d-flex justify-content-between mt-2">
//                 <div>
//                   <span>Amount Yet To Pay:</span>
//                   <br />
//                   {aytpNote == "" && <small>{aytpStageLabel}</small>}
//                 </div>
//                 <strong>₹{amountYetToPay}</strong>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     );
//   };

//   // -------------------------------------------------------
//   // HANDLE SAVE
//   // -------------------------------------------------------
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;

//     if (!customerName.trim()) return alert("Customer name is required");
//     if (!customerPhone.trim() || customerPhone.length !== 10)
//       return alert("Valid phone number is required");

//     if (!houseFlatNumber.trim()) return alert("House/Flat number is required");
//     if (!streetArea.trim()) return alert("Street/Area is required");
//     if (!city.trim()) return alert("City is required");
//     if (!location?.coordinates)
//       return alert("Location coordinates are required");

//     if (!slotDate.trim()) return alert("Slot date is required");
//     if (!slotTime.trim()) return alert("Slot time is required");

//     if (services.length === 0)
//       return alert("At least one service must be added.");

//     for (let i = 0; i < services.length; i++) {
//       const s = services[i];
//       if (!s.category?.trim())
//         return alert(`Service ${i + 1}: Category is required`);
//       if (s.category.toLowerCase() !== "house painting") {
//         if (!s.subCategory?.trim())
//           return alert(`Service ${i + 1}: Subcategory is required`);
//         if (!s.serviceName?.trim())
//           return alert(`Service ${i + 1}: Service Name is required`);
//       }
//       if (s.category.toLowerCase() === "deep cleaning") {
//         if (!s.price || Number(s.price) <= 0)
//           return alert(
//             `Service ${i + 1}: Valid price required for Deep Cleaning`,
//           );
//       }
//     }

//     setSaving(true);

//     try {
//       const addressPayload = {
//         houseFlatNumber,
//         streetArea,
//         landMark,
//         city,
//         location: {
//           type: "Point",
//           coordinates: location.coordinates,
//         },
//       };

//       const slotPayload = {
//         slotDate,
//         slotTime,
//       };

//       const normalizedServices = services.map((s) => {
//         const deepPkg = deepList.find(
//           (d) =>
//             d._id === s.packageId ||
//             d.name === s.serviceName ||
//             d.serviceName === s.serviceName,
//         );

//         return {
//           category: s.category,
//           subCategory: s.subCategory,
//           serviceName: s.serviceName,

//           price: Number(s.price || 0),
//           quantity: s.quantity ?? 1,
//           coinDeduction: deepPkg?.coinsForVendor ?? 0,

//           teamMembersRequired:
//             s.teamMembersRequired ?? deepPkg?.teamMembers ?? 0,

//           duration: s.duration ?? deepPkg?.durationMinutes ?? 0,

//           bookingAmount: s.bookingAmount ?? deepPkg?.bookingAmount ?? 0,

//           packageId: s.packageId ?? deepPkg?._id ?? null,
//         };
//       });

//       normalizedServices.forEach((s, idx) => {
//         if (
//           (s.category || "").toLowerCase() === "deep cleaning" &&
//           !s.packageId
//         ) {
//           throw new Error(`Service ${idx + 1} is missing package mapping`);
//         }
//       });

//       const adjustmentAmount = Math.abs(serverFinalTotal - currentBackendFinal);
//       const scopeType =
//         serverFinalTotal > currentBackendFinal ? "Added" : "Reduced";
//       const approvedBy = scopeType === "Added" ? "customer" : "admin";
//       const currentTime = new Date().toISOString();

//       let priceChange = null;
//       if (adjustmentAmount > 0) {
//         priceChange = {
//           adjustmentAmount,
//           proposedTotal: serverFinalTotal,
//           reason: "",
//           scopeType,
//           status: "approved",
//           requestedBy: "admin",
//           requestedAt: currentTime,
//           approvedBy: approvedBy,
//           approvedAt: currentTime,
//         };
//       }

//       let bookingDetailsPayload = {
//         finalTotal: serverFinalTotal,
//         bookingAmount: serverBookingAmount,
//         paidAmount: Number(paidAmount),
//         ...(priceChange && { priceChange }),
//       };

//       if (leadMode) {
//         // ✅ do NOT send amountYetToPay; backend will calculate
//         if (isHousePaintingService) {
//           bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
//         }
//       }

//       const finalPayload = {
//         customer: {
//           name: customerName,
//           phone: customerPhone,
//           customerId: enquiry?.raw?.customer?.customerId,
//         },
//         service: normalizedServices,
//         bookingDetails: bookingDetailsPayload,
//         address: addressPayload,
//         selectedSlot: slotPayload,
//         formName,
//       };

//       const endpoint = leadMode
//         ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
//         : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

//       const res = await fetch(endpoint, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(finalPayload),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Update failed.");

//       onUpdated?.(data.booking);
//       onClose();
//     } catch (err) {
//       alert(err.message || "Error updating enquiry.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   // -------------------------------------------------------
//   // MAIN JSX RENDER
//   // -------------------------------------------------------
//   return (
//     <>
//       <Modal
//         show={show}
//         onHide={onClose}
//         size="lg"
//         centered
//         enforceFocus={false}
//       >
//         <Modal.Header closeButton>
//           <Modal.Title style={{ fontSize: 16 }}>
//             {title || "Edit Enquiry"}
//           </Modal.Title>
//         </Modal.Header>

//         <Modal.Body style={{ fontSize: 13 }}>
//           {/* CUSTOMER */}
//           <h6 className="mb-2">Customer *</h6>
//           <Row className="g-2 mb-3">
//             <Col md={6}>
//               <Form.Label>Name</Form.Label>
//               <Form.Control value={customerName} readOnly size="sm" />
//             </Col>

//             <Col md={6}>
//               <Form.Label>Phone *</Form.Label>
//               <InputGroup size="sm">
//                 <InputGroup.Text>+91</InputGroup.Text>
//                 <Form.Control value={customerPhone} readOnly />
//               </InputGroup>
//             </Col>
//           </Row>

//           {/* ADDRESS SECTION */}
//           {isPendingBooking && (
//             <div className="d-flex justify-content-between mb-2">
//               <h6 className="mb-0">Address *</h6>
//               <Button
//                 variant="outline-secondary"
//                 size="sm"
//                 onClick={() => setShowAddressModal(true)}
//               >
//                 Change Address
//               </Button>
//             </div>
//           )}

//           <Row className="g-2 mb-3">
//             <Col md={4}>
//               <Form.Label>House / Flat No.</Form.Label>
//               <Form.Control value={houseFlatNumber} readOnly size="sm" />
//             </Col>
//             <Col md={4}>
//               <Form.Label>Street / Area</Form.Label>
//               <Form.Control value={streetArea} readOnly size="sm" />
//             </Col>
//             <Col md={4}>
//               <Form.Label>Landmark</Form.Label>
//               <Form.Control value={landMark} readOnly size="sm" />
//             </Col>
//           </Row>

//           <Row className="g-2 mb-3">
//             <Col md={4}>
//               <Form.Label>City</Form.Label>
//               <Form.Control value={city} readOnly size="sm" />
//             </Col>
//           </Row>

//           {/* SLOT */}
//           {isPendingBooking && (
//             <div className="d-flex justify-content-between mb-2">
//               <h6 className="mb-0">Preferred Slot</h6>
//               <Button
//                 variant="outline-secondary"
//                 size="sm"
//                 onClick={() => {
//                   if (
//                     hasExistingDeepCleaningServiceFromBackend &&
//                     !hasServiceBeenModified
//                   ) {
//                     setShowTimeModal(true);
//                     return;
//                   }

//                   if (hasUnselectedDeepCleaningService) {
//                     alert(
//                       "Please select a deep cleaning service before choosing a slot.",
//                     );
//                     return;
//                   }

//                   if (
//                     hasDeepCleaningService &&
//                     deepCleaningPackageIds.length === 0
//                   ) {
//                     alert("Selected service is not linked to a valid package.");
//                     return;
//                   }

//                   setShowTimeModal(true);
//                 }}
//               >
//                 Change Date & Slot
//               </Button>
//             </div>
//           )}

//           <Row className="g-2 mb-3">
//             <Col md={6}>
//               <Form.Label>Date</Form.Label>
//               <Form.Control value={slotDate} readOnly size="sm" />
//             </Col>
//             <Col md={6}>
//               <Form.Label>Time</Form.Label>
//               <Form.Control value={slotTime} readOnly size="sm" />
//             </Col>
//           </Row>

//           {/* SERVICES */}
//           <div className="d-flex justify-content-between mb-2">
//             <h6 className="mb-0">Services</h6>
//             {!isHousePaintingService && (
//               <Button
//                 variant="outline-secondary"
//                 size="sm"
//                 onClick={addService}
//                 disabled={!canEditServices}
//               >
//                 + Add Service
//               </Button>
//             )}
//           </div>

//           {services.map((s, idx) => {
//             const isDC = s.category?.toLowerCase() === "deep cleaning";
//             const isHP = s.category?.toLowerCase() === "house painting";

//             const filteredNames = deepList
//               .filter((item) => item.category === s.subCategory)
//               .map((item) => ({
//                 label: item.name,
//                 value: item.name,
//                 price: item.totalAmount,
//                 bookingAmount: item.bookingAmount,
//               }));

//             return (
//               <Row key={idx} className="g-2 mb-3 align-items-end">
//                 <Col md={isHP ? 4 : 3}>
//                   <Form.Label className="mb-1">Category *</Form.Label>
//                   <Form.Control value={s.category} disabled size="sm" />
//                 </Col>

//                 {!isHP && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Subcategory</Form.Label>
//                     <Form.Select
//                       size="sm"
//                       value={s.subCategory}
//                       disabled={!canEditServices}
//                       onChange={(e) =>
//                         onServiceChange(idx, "subCategory", e.target.value)
//                       }
//                     >
//                       <option value="">Select Category *</option>
//                       {[...new Set(deepList.map((i) => i.category))].map(
//                         (cat) => (
//                           <option key={cat} value={cat}>
//                             {cat}
//                           </option>
//                         ),
//                       )}
//                     </Form.Select>
//                   </Col>
//                 )}

//                 {!isHP && (
//                   <Col md={3}>
//                     <Form.Label className="mb-1">Service Name *</Form.Label>
//                     <Form.Select
//                       size="sm"
//                       value={s.serviceName}
//                       disabled={!canEditServices}
//                       onChange={(e) => {
//                         handleServiceSelection(idx, e.target.value);
//                       }}
//                     >
//                       <option value="">Select Service *</option>
//                       {filteredNames.map((i) => (
//                         <option key={i.value} value={i.value}>
//                           {i.label}
//                         </option>
//                       ))}
//                     </Form.Select>
//                   </Col>
//                 )}

//                 <Col md={isHP ? 4 : 2}>
//                   <Form.Label className="mb-1">
//                     {isDC ? "Price (₹)" : "Site Visit (₹)"}
//                   </Form.Label>
//                   <Form.Control
//                     size="sm"
//                     type="number"
//                     value={s.price}
//                     onChange={(e) =>
//                       onServiceChange(idx, "price", e.target.value)
//                     }
//                     disabled={true}
//                   />
//                 </Col>

//                 {!isHP && (
//                   <Col md={1} className="text-end">
//                     <Button
//                       variant="outline-danger"
//                       size="sm"
//                       onClick={() => removeService(idx)}
//                       disabled={!canEditServices}
//                     >
//                       ×
//                     </Button>
//                   </Col>
//                 )}
//               </Row>
//             );
//           })}

//           <Row className="mt-3">
//             <Col md={3}>
//               <Form.Label>Form Name *</Form.Label>
//               <Form.Control value={formName} size="sm" disabled />
//             </Col>
//           </Row>
//         </Modal.Body>

//         {/* PAYMENT SUMMARY */}
//         {PaymentSummarySection()}

//         <Modal.Footer>
//           <Button variant="secondary" onClick={onClose} disabled={saving}>
//             Cancel
//           </Button>
//           <Button variant="danger" onClick={handleSave} disabled={saving}>
//             {saving ? "Saving..." : "Save Changes"}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* ADDRESS MODAL */}
//       {showAddressModal && (
//         <AddressPickerModal
//           initialAddress={streetArea}
//           initialLatLng={
//             location
//               ? { lat: location.coordinates[1], lng: location.coordinates[0] }
//               : undefined
//           }
//           onClose={() => setShowAddressModal(false)}
//           onSelect={handleAddressSelect}
//           bookingId={enquiry?.bookingId}
//         />
//       )}

//       {/* TIME MODAL */}
//       {showTimeModal && (
//         <TimePickerModal
//           onClose={() => setShowTimeModal(false)}
//           onSelect={handleSlotSelect}
//           serviceType={
//             hasDeepCleaningService ? "deep_cleaning" : "house_painting"
//           }
//           packageId={hasDeepCleaningService ? deepCleaningPackageIds : []}
//           coordinates={{
//             lat: location?.coordinates?.[1],
//             lng: location?.coordinates?.[0],
//           }}
//         />
//       )}
//     </>
//   );
// };

// export default EditEnquiryModal;
