import React, { useEffect, useState, useRef } from "react";
import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import AddressPickerModal from "./AddressPickerModal";
import TimePickerModal from "./TimePickerModal";
import { BASE_URL } from "../utils/config";
import { ImCancelCircle } from "react-icons/im";
import { FaCheck } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";

const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

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
  const [currentBackendFinal, setCurrentBackendFinal] = useState(0); // Add this

  const [serverBookingAmount, setServerBookingAmount] = useState(0);

  // AYTP + refund for lead mode only
  const [amountYetToPay, setAmountYetToPay] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);

  // House painting fields
  const [siteVisitCharges, setSiteVisitCharges] = useState(0);
  const [firstPaid, setFirstPaid] = useState(false);
  const [secondPaid, setSecondPaid] = useState(false);
  const [finalPaid, setFinalPaid] = useState(false);

  const [firstAmount, setFirstAmount] = useState(0);
  const [secondAmount, setSecondAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const isHousePaintingService = services.some(
    (s) => s.category?.toLowerCase() === "house painting"
  );

  // Refs to track service changes
  const serviceUpdatesRef = useRef(new Set());
  const initialLoadRef = useRef(true);

  // -------------------------------------------
  // LOAD ENQUIRY — restore EXACT old lead-mode AYTP logic
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
        normalizePhone(enquiry?.contact) || customer?.phone || ""
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
        };
      });

      setServices(loadedServices);
      setInitialServiceCount(service?.length || 0);

      // Backend totals
      const backendOriginal = Number(bookingDetails?.originalTotalAmount || 0);
      const backendFinal = Number(
        bookingDetails?.finalTotal ?? bookingDetails?.originalTotalAmount ?? 0
      );
      const backendPaid = Number(bookingDetails?.paidAmount || 0);
      const backendBooking = Number(bookingDetails?.bookingAmount || 0);

      setOriginalFinalTotal(backendOriginal);
      setServerFinalTotal(backendFinal);
      setCurrentBackendFinal(backendFinal); // Set current backend final
      setDraftFinalTotal(String(backendFinal));
      setPaidAmount(String(backendPaid));
      setServerBookingAmount(backendBooking);

      // House painting information
      const isHP = (service || []).some(
        (it) => it.category?.toLowerCase() === "house painting"
      );
      const svc = Number(bookingDetails?.siteVisitCharges || 0);
      setSiteVisitCharges(svc);

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

      // ---------------------------------------------------
      // AYTP CALCULATION (RESTORED) — ONLY FOR LEAD MODE
      // ---------------------------------------------------
      if (leadMode) {
        if (isHP) {
          // House painting installment logic - SIMPLIFIED
          const FT = backendFinal;

          // SIMPLIFIED LOGIC: No refund calculation before final payment
          if (!firstPaid) {
            setAmountYetToPay(Math.round(FT * 0.4));
            setRefundAmount(0);
          } else if (firstPaid && !secondPaid) {
            setAmountYetToPay(Math.round(FT * 0.4));
            setRefundAmount(0);
          } else if (firstPaid && secondPaid && !finalPaid) {
            setAmountYetToPay(Math.round(FT * 0.2));
            setRefundAmount(0);
          } else {
            // Only after final payment, check for any balance
            const totalPaid = firstAmount + secondAmount + finalAmount;
            const aytp = FT - totalPaid;
            if (aytp < 0) {
              setRefundAmount(Math.abs(aytp));
              setAmountYetToPay(0);
            } else {
              setRefundAmount(0);
              setAmountYetToPay(aytp);
            }
          }
        } else {
          // Deep cleaning AYTP = finalTotal - paid (NO REFUND before final payment)
          const FT = backendFinal;
          const firstPaidStatus =
            bookingDetails?.firstPayment?.status === "paid";
          const finalPaidStatus =
            bookingDetails?.finalPayment?.status === "paid";

          if (!firstPaidStatus) {
            // First payment not made yet - AYTP is the first installment
            const firstInstallment = Math.round(FT * 0.2); // 20% booking amount
            setAmountYetToPay(firstInstallment);
            setRefundAmount(0);
          } else if (firstPaidStatus && !finalPaidStatus) {
            // First payment done, final payment pending
            const totalPaid = Number(bookingDetails?.firstPayment?.amount || 0);
            const aytp = FT - totalPaid;
            setAmountYetToPay(aytp > 0 ? aytp : 0);
            setRefundAmount(0); // No refund before final payment
          } else {
            // Both payments done
            const totalPaid =
              Number(bookingDetails?.firstPayment?.amount || 0) +
              Number(bookingDetails?.finalPayment?.amount || 0);
            const aytp = FT - totalPaid;
            if (aytp < 0) {
              setRefundAmount(Math.abs(aytp));
              setAmountYetToPay(0);
            } else {
              setRefundAmount(0);
              setAmountYetToPay(aytp);
            }
          }
        }
      }
    } catch (err) {
      console.error("Load enquiry error:", err);
    }

    // Reset initial load flag after first load
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
          `${BASE_URL}/deeppackage/deep-cleaning-packages`
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
  // Helper: compute house painting display amounts (used in leadMode)
  // ---------------------------------------
  const computeHousePaintingDisplay = (
    finalTotalValue,
    siteVisitChargesValue,
    flagsAndAmounts
  ) => {
    const FT = Number(finalTotalValue || 0);
    const SV = Number(siteVisitChargesValue || 0);

    const firstPaidFlag = !!flagsAndAmounts.firstPaid;
    const secondPaidFlag = !!flagsAndAmounts.secondPaid;
    const finalPaidFlag = !!flagsAndAmounts.finalPaid;

    const fAmt = Number(flagsAndAmounts.firstAmount || 0);
    const sAmt = Number(flagsAndAmounts.secondAmount || 0);
    const fnAmt = Number(flagsAndAmounts.finalAmount || 0);

    const slab40 = Math.round(FT * 0.4);
    const slab20 = Math.round(FT * 0.2);

    let paidDisplay = 0;
    let aytp = 0;
    let refund = 0;

    if (!firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
      paidDisplay = SV;
      aytp = slab40;
    } else if (firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
      paidDisplay = fAmt;
      aytp = slab40;
    } else if (firstPaidFlag && secondPaidFlag && !finalPaidFlag) {
      paidDisplay = fAmt + sAmt;
      aytp = slab20;
    } else if (firstPaidFlag && secondPaidFlag && finalPaidFlag) {
      paidDisplay = fAmt + sAmt + fnAmt;
      aytp = 0;
      // Only calculate refund if ALL payments are done
      if (paidDisplay > FT) refund = paidDisplay - FT;
    } else {
      paidDisplay = SV;
      aytp = slab40;
    }

    return { paidDisplay, aytp, refund, slab40, slab20 };
  };

  // ---------------------------------------
  // ADD SERVICE - SIMPLE ADDITION
  // ---------------------------------------
  const addService = () => {
    setServices((prev) => {
      const next = [
        ...prev,
        {
          category: "Deep Cleaning",
          subCategory: "",
          serviceName: "",
          price: "",
          bookingAmount: "",
        },
      ];
      return next;
    });
  };

  // ---------------------------------------
  // REMOVE SERVICE - COMPLETELY ATOMIC VERSION
  // ---------------------------------------
  const removeService = (idx) => {
    if (services.length === 1) {
      alert("At least one service must remain in the booking.");
      return;
    }

    // Create a copy of current services
    const currentServices = [...services];
    const serviceToRemove = currentServices[idx];
    const removedPrice = Number(serviceToRemove?.price || 0);

    // Calculate new values BEFORE any state updates
    const newServices = currentServices.filter((_, i) => i !== idx);
    const newFinalTotal = Math.max(0, serverFinalTotal - removedPrice);

    let newBookingAmount = serverBookingAmount;
    let newAmountYetToPay = amountYetToPay;
    let newRefundAmount = refundAmount;

    // Calculate booking amount for enquiry mode
    if (!leadMode) {
      newBookingAmount = Math.round(newFinalTotal * 0.2);
    }

    // For lead mode, calculate AYTP/refund
    if (leadMode) {
      const hpFlag = newServices.some(
        (s) => (s.category || "").toLowerCase() === "house painting"
      );

      if (!hpFlag) {
        // For non-house painting services in lead mode - UPDATED LOGIC
        if (!firstPaid) {
          // First payment not made yet
          const firstInstallment = Math.round(newFinalTotal * 0.2);
          newAmountYetToPay = firstInstallment;
          newRefundAmount = 0;
        } else if (firstPaid && !finalPaid) {
          // First payment done, final pending
          const aytp = newFinalTotal - Number(paidAmount || 0);
          newAmountYetToPay = aytp > 0 ? aytp : 0;
          newRefundAmount = 0;
        } else {
          // Both payments done
          const aytp = newFinalTotal - Number(paidAmount || 0);
          if (aytp < 0) {
            newRefundAmount = Math.abs(aytp);
            newAmountYetToPay = 0;
          } else {
            newRefundAmount = 0;
            newAmountYetToPay = aytp;
          }
        }
      } else {
        // For house painting in lead mode
        const computed = computeHousePaintingDisplay(
          newFinalTotal,
          siteVisitCharges,
          {
            firstPaid,
            secondPaid,
            finalPaid,
            firstAmount,
            secondAmount,
            finalAmount,
          }
        );
        if (computed.refund > 0) {
          newRefundAmount = computed.refund;
          newAmountYetToPay = 0;
        } else {
          newRefundAmount = 0;
          newAmountYetToPay = computed.aytp;
        }
      }
    }

    // Update ALL states in one synchronous batch
    // This prevents any intermediate re-renders that might trigger onServiceChange
    setServices(newServices);
    setServerFinalTotal(newFinalTotal);

    if (!leadMode) {
      setServerBookingAmount(newBookingAmount);
    }

    if (leadMode) {
      setAmountYetToPay(newAmountYetToPay);
      setRefundAmount(newRefundAmount);
    }
  };

  // ---------------------------------------
  // ON SERVICE CHANGE - FIXED VERSION
  // This now handles price changes correctly without double counting
  // ---------------------------------------
  const onServiceChange = (
    idx,
    field,
    value,
    isFromServiceSelection = false
  ) => {
    setServices((prev) => {
      const copy = [...prev];
      const oldPrice = Number(copy[idx]?.price || 0);

      // Update the field
      copy[idx] = {
        ...copy[idx],
        [field]: field === "price" && value === "" ? "" : value,
      };

      // Handle price field changes
      if (field === "price") {
        const newPrice = Number(value || 0);

        // Calculate the actual difference
        const priceDifference = newPrice - oldPrice;

        // Only update if there's a change AND we're not in the initial load
        if (priceDifference !== 0 && !initialLoadRef.current) {
          setServerFinalTotal((prevTotal) => {
            const newTotal = Number(prevTotal || 0) + priceDifference;

            // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of newTotal
            if (!leadMode) {
              const bookingAmt = Math.round(newTotal * 0.2);
              setServerBookingAmount(bookingAmt);
            }

            // If leadMode, recalc AYTP/refund - UPDATE THIS SECTION
            if (leadMode) {
              const hpFlag = copy.some(
                (s) => (s.category || "").toLowerCase() === "house painting"
              );

              if (!hpFlag) {
                // Deep cleaning - no refund before final payment
                if (!firstPaid) {
                  // First payment not made yet
                  const firstInstallment = Math.round(newTotal * 0.2);
                  setAmountYetToPay(firstInstallment);
                  setRefundAmount(0);
                } else if (firstPaid && !finalPaid) {
                  // First payment done, final pending
                  const totalPaid = Number(paidAmount || 0);
                  const aytp = newTotal - totalPaid;
                  setAmountYetToPay(aytp > 0 ? aytp : 0);
                  setRefundAmount(0);
                } else {
                  // Both payments done
                  const totalPaid = Number(paidAmount || 0);
                  const aytp = newTotal - totalPaid;
                  if (aytp < 0) {
                    setRefundAmount(Math.abs(aytp));
                    setAmountYetToPay(0);
                  } else {
                    setRefundAmount(0);
                    setAmountYetToPay(aytp);
                  }
                }
              }
            }

            return newTotal;
          });
        }
      }

      return copy;
    });
  };

  // ---------------------------------------
  // HANDLE SERVICE SELECTION FROM DROPDOWN
  // This ensures price is only added once when service is selected
  // ---------------------------------------
  const handleServiceSelection = (idx, selectedServiceName) => {
    // Find the selected service from deepList
    const selectedService = deepList.find(
      (item) =>
        item.name === selectedServiceName ||
        item.serviceName === selectedServiceName
    );

    if (selectedService) {
      const newPrice = Number(
        selectedService.totalAmount || selectedService.price || 0
      );
      const bookingAmount = Number(selectedService.bookingAmount || 0);

      // Get current service price before update
      const currentPrice = Number(services[idx]?.price || 0);

      // Calculate the difference
      const priceDifference = newPrice - currentPrice;

      // Update the service
      setServices((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          serviceName: selectedServiceName,
          price: String(newPrice),
          bookingAmount: String(bookingAmount),
        };
        return copy;
      });

      // Only update serverFinalTotal if there's a price difference AND we're not in initial load
      if (priceDifference !== 0 && !initialLoadRef.current) {
        setServerFinalTotal((prevTotal) => {
          const newTotal = Number(prevTotal || 0) + priceDifference;

          // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of newTotal
          if (!leadMode) {
            const bookingAmt = Math.round(newTotal * 0.2);
            setServerBookingAmount(bookingAmt);
          }

          // If leadMode, recalc AYTP/refund - UPDATE THIS SECTION TOO
          if (leadMode) {
            const hpFlag = services.some(
              (s) => (s.category || "").toLowerCase() === "house painting"
            );
            if (!hpFlag) {
              // Deep cleaning - no refund before final payment
              if (!firstPaid) {
                // First payment not made yet
                const firstInstallment = Math.round(newTotal * 0.2);
                setAmountYetToPay(firstInstallment);
                setRefundAmount(0);
              } else if (firstPaid && !finalPaid) {
                // First payment done, final pending
                const totalPaid = Number(paidAmount || 0);
                const aytp = newTotal - totalPaid;
                setAmountYetToPay(aytp > 0 ? aytp : 0);
                setRefundAmount(0);
              } else {
                // Both payments done
                const totalPaid = Number(paidAmount || 0);
                const aytp = newTotal - totalPaid;
                if (aytp < 0) {
                  setRefundAmount(Math.abs(aytp));
                  setAmountYetToPay(0);
                } else {
                  setRefundAmount(0);
                  setAmountYetToPay(aytp);
                }
              }
            }
          }

          return newTotal;
        });
      }
    }
  };
  // Effect to handle AYTP calculation for non-house-painting services
  useEffect(() => {
    if (!services || services.length === 0 || initialLoadRef.current) return;

    // If house painting service present, AYTP logic uses slabs, handled in below effect
    if (!leadMode) {
      // For enquiry mode, calculate booking amount as 20% of serverFinalTotal
      const bookingAmt = Math.round(serverFinalTotal * 0.2);
      setServerBookingAmount(bookingAmt);
      return;
    }

    // For leadMode and non-house-painting, recalc AYTP as finalTotal - paid
    const hpFlag = services.some(
      (s) => (s.category || "").toLowerCase() === "house painting"
    );
    if (!hpFlag) {
      const aytp = Number(serverFinalTotal || 0) - Number(paidAmount || 0);
      if (aytp < 0) {
        setRefundAmount(Math.abs(aytp));
        setAmountYetToPay(0);
      } else {
        setRefundAmount(0);
        setAmountYetToPay(aytp);
      }
    }
  }, [services, leadMode, serverFinalTotal, paidAmount]);

  // ---------------------------------------
  // House painting AYTP recalculation for lead mode when relevant values change
  // ---------------------------------------
  useEffect(() => {
    if (!leadMode || initialLoadRef.current) return;

    const hpFlag = services.some(
      (s) => (s.category || "").toLowerCase() === "house painting"
    );
    if (!hpFlag) return;

    // Use computeHousePaintingDisplay to set amountYetToPay and refund
    const computed = computeHousePaintingDisplay(
      serverFinalTotal,
      siteVisitCharges,
      {
        firstPaid,
        secondPaid,
        finalPaid,
        firstAmount,
        secondAmount,
        finalAmount,
      }
    );

    if (computed.refund > 0) {
      setRefundAmount(computed.refund);
      setAmountYetToPay(0);
    } else {
      setRefundAmount(0);
      setAmountYetToPay(computed.aytp);
    }
  }, [
    leadMode,
    services,
    serverFinalTotal,
    siteVisitCharges,
    firstPaid,
    secondPaid,
    finalPaid,
    firstAmount,
    secondAmount,
    finalAmount,
  ]);
  // ---------------------------------------
  // Manual Final Total edit apply (when admin edits final total via input)
  // ---------------------------------------
  const applyManualFinalTotal = () => {
    const manualValue = Number(draftFinalTotal || 0);

    if (!Number.isFinite(manualValue) || manualValue < 0) {
      alert("Final total must be a positive number");
      return;
    }

    setServerFinalTotal(manualValue);

    // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of manualValue
    if (!leadMode) {
      const bookingAmt = Math.round(manualValue * 0.2);
      setServerBookingAmount(bookingAmt);
    }

    // If leadMode, recalc AYTP/refund with simplified logic
    if (leadMode) {
      const hpFlag = services.some(
        (s) => (s.category || "").toLowerCase() === "house painting"
      );
      if (!hpFlag) {
        // Deep cleaning - no refund before final payment
        const firstPaidStatus = firstPaid; // Use the state
        const finalPaidStatus = finalPaid;

        if (!firstPaidStatus) {
          // First payment not made yet
          const firstInstallment = Math.round(manualValue * 0.2);
          setAmountYetToPay(firstInstallment);
          setRefundAmount(0);
        } else if (firstPaidStatus && !finalPaidStatus) {
          // First payment done, final pending
          const totalPaid = Number(paidAmount || 0);
          const aytp = manualValue - totalPaid;
          setAmountYetToPay(aytp > 0 ? aytp : 0);
          setRefundAmount(0);
        } else {
          // Both payments done
          const totalPaid = Number(paidAmount || 0);
          const aytp = manualValue - totalPaid;
          if (aytp < 0) {
            setRefundAmount(Math.abs(aytp));
            setAmountYetToPay(0);
          } else {
            setRefundAmount(0);
            setAmountYetToPay(aytp);
          }
        }
      } else {
        // House painting - simplified logic
        const computed = computeHousePaintingDisplay(
          manualValue,
          siteVisitCharges,
          {
            firstPaid,
            secondPaid,
            finalPaid,
            firstAmount,
            secondAmount,
            finalAmount,
          }
        );

        // Only show refund if final payment is done
        if (firstPaid && secondPaid && finalPaid && computed.refund > 0) {
          setRefundAmount(computed.refund);
          setAmountYetToPay(0);
        } else {
          setRefundAmount(0);
          setAmountYetToPay(computed.aytp);
        }
      }
    }

    setEditingFinal(false);
  };

  // ---------------------------------------
  // Address & Slot handlers (used by address/time modals)
  // ---------------------------------------
  const handleAddressSelect = (addressObj) => {
    if (!addressObj) return;
    const { houseFlatNumber, streetArea, landmark, latLng } = addressObj;
    setHouseFlatNumber(houseFlatNumber || "");
    setStreetArea(streetArea || "");
    setLandMark(landmark || "");
    if (latLng && latLng.lat != null && latLng.lng != null) {
      setLocation({
        type: "Point",
        coordinates: [latLng.lng, latLng.lat],
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

  // ---------------------------------------
  // Payment Summary UI (leadMode shows AYTP/refund; enquiry hides AYTP/refund)
  // ---------------------------------------
  // const PaymentSummarySection = () => {
  //   // Calculate total change (difference between current and original)
  //   const totalChange = serverFinalTotal - originalFinalTotal;

  //   return (
  //     <div
  //       className="mt-3 p-3"
  //       style={{
  //         background: "#f8f9fa",
  //         borderRadius: 8,
  //         border: "1px solid #e3e3e3",
  //       }}
  //     >
  //       <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

  //       {/* Show original amount ALWAYS */}
  //       <div className="d-flex justify-content-between mb-1">
  //         <span>Original Total Amount:</span>
  //         <strong>₹{originalFinalTotal}</strong>
  //       </div>

  //       {/* Show total change */}
  //       {totalChange !== 0 && (
  //         <div className="d-flex justify-content-between mb-2">
  //           <span>Total Change:</span>
  //           <strong
  //             style={{ color: totalChange < 0 ? "red" : "green" }}
  //           >
  //             {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
  //           </strong>
  //         </div>
  //       )}

  //       {/* House painting enquiry: site visit only */}
  //       {isHousePaintingService && !leadMode ? (
  //         <div className="d-flex justify-content-between mb-2">
  //           <span>Site Visit Charges:</span>
  //           <strong>₹{siteVisitCharges}</strong>
  //         </div>
  //       ) : (
  //         <>
  //           {/* Final Total display & manual edit */}
  //           <div
  //             className="d-flex justify-content-between mb-2"
  //             style={{ alignItems: "center" }}
  //           >
  //             <span> {totalChange ? "New Total Amount:": "Total Amount:"}</span>

  //             {editingFinal ? (
  //               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  //                 <Form.Control
  //                   type="number"
  //                   size="sm"
  //                   value={draftFinalTotal}
  //                   onChange={(e) => setDraftFinalTotal(e.target.value)}
  //                   style={{ width: 120 }}
  //                 />
  //                 <div
  //                   style={{ color: "#007a0a", cursor: "pointer" }}
  //                   onClick={applyManualFinalTotal}
  //                   title="Apply"
  //                 >
  //                   <FaCheck />
  //                 </div>
  //                 <div
  //                   style={{ color: "#d40000", cursor: "pointer" }}
  //                   onClick={() => {
  //                     setDraftFinalTotal(String(serverFinalTotal));
  //                     setEditingFinal(false);
  //                   }}
  //                   title="Cancel"
  //                 >
  //                   <ImCancelCircle />
  //                 </div>
  //               </div>
  //             ) : (
  //               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
  //                 <strong style={{ color: "#007a0a" }}>
  //                   ₹{serverFinalTotal}
  //                 </strong>
  //                 <span
  //                   style={{ cursor: "pointer", color: "#7F6663" }}
  //                   onClick={() => {
  //                     setDraftFinalTotal(String(serverFinalTotal));
  //                     setEditingFinal(true);
  //                   }}
  //                   title="Edit final total"
  //                 >
  //                   <FaEdit />
  //                 </span>
  //               </div>
  //             )}
  //           </div>

  //           {/* Booking amount — 20% of final total for enquiry mode */}
  //           {leadMode != true && (
  //             <div className="d-flex justify-content-between mb-2">
  //               <span>Booking Amount (20% of Final Total):</span>
  //               <strong>₹{serverBookingAmount}</strong>
  //             </div>
  //           )}

  //           {/* Paid amount */}
  //           <div className="d-flex justify-content-between mb-2">
  //             <span>Amount Paid:</span>
  //             <strong>₹{paidAmount}</strong>
  //           </div>

  //           {/* Lead mode only — show AYTP or refund */}
  //           {leadMode && (
  //             <>
  //               {refundAmount > 0 ? (
  //                 <div className="d-flex justify-content-between mt-2">
  //                   <span style={{ color: "red" }}>Refund Amount:</span>
  //                   <strong style={{ color: "red" }}>₹{refundAmount}</strong>
  //                 </div>
  //               ) : (
  //                 <div className="d-flex justify-content-between mt-2">
  //                   <span>Amount Yet To Paid:</span>
  //                   <strong>₹{amountYetToPay}</strong>
  //                 </div>
  //               )}
  //             </>
  //           )}

  //           {/* House painting installments — leadMode only */}
  //           {leadMode && isHousePaintingService && serverFinalTotal > 0 && (
  //             <div
  //               className="d-flex justify-content-between mt-2"
  //               style={{ fontSize: 12 }}
  //             >
  //               <span className="text-muted">Current Installment:</span>

  //               <strong>
  //                 {!firstPaid
  //                   ? "1st Installment (40%)"
  //                   : firstPaid && !secondPaid
  //                   ? "2nd Installment (40%)"
  //                   : firstPaid && secondPaid && !finalPaid
  //                   ? "Final Installment (20%)"
  //                   : "Completed"}
  //               </strong>
  //             </div>
  //           )}
  //         </>
  //       )}
  //     </div>
  //   );
  // };

  const PaymentSummarySection = () => {
    const totalChange = serverFinalTotal - originalFinalTotal;

    const isDeepCleaning = services.some(
      (s) => s.category?.toLowerCase() === "deep cleaning"
    );

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

        {/* =========================
          1. HOUSE PAINTING ENQUIRY
      ========================== */}
        {isHousePaintingService && !leadMode && (
          <>
            <div className="d-flex justify-content-between mb-2">
              <span>Site Visit Charges:</span>
              <strong>₹{siteVisitCharges}</strong>
            </div>
          </>
        )}

        {/* =========================
          2. DEEP CLEANING ENQUIRY
      ========================== */}
        {isDeepCleaning && !isHousePaintingService && !leadMode && (
          <>
            {/* Original Amount */}
            <div className="d-flex justify-content-between mb-1">
              <span>Original Total Amount:</span>
              <strong>₹{originalFinalTotal}</strong>
            </div>

            {/* Total Change */}
            {totalChange !== 0 && (
              <div className="d-flex justify-content-between mb-2">
                <span>Total Change:</span>
                <strong style={{ color: totalChange < 0 ? "red" : "green" }}>
                  {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
                </strong>
              </div>
            )}

            {/* Final Total (editable for enquiry also) */}
            <div
              className="d-flex justify-content-between mb-2"
              style={{ alignItems: "center" }}
            >
              <span>{totalChange ? "New Total Amount:" : "Total Amount:"}</span>

              {editingFinal ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ color: "#007a0a" }}>
                    ₹{serverFinalTotal}
                  </strong>
                  <FaEdit
                    style={{ cursor: "pointer", color: "#7F6663" }}
                    onClick={() => {
                      setDraftFinalTotal(String(serverFinalTotal));
                      setEditingFinal(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Booking Amount → ALWAYS SHOW THIS IN ENQUIRY */}
            <div className="d-flex justify-content-between mb-2">
              <span>Booking Amount (20% of Final Total):</span>
              <strong>₹{serverBookingAmount}</strong>
            </div>
          </>
        )}

        {/* =========================
          3. LEAD MODE (unchanged)
      ========================== */}
        {leadMode && (
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

            {/* Final total editable (existing logic stays untouched) */}
            <div
              className="d-flex justify-content-between mb-2"
              style={{ alignItems: "center" }}
            >
              <span>{totalChange ? "New Total Amount:" : "Total Amount:"}</span>

              {editingFinal ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ color: "#007a0a" }}>
                    ₹{serverFinalTotal}
                  </strong>
                  <FaEdit
                    style={{ cursor: "pointer", color: "#7F6663" }}
                    onClick={() => {
                      setDraftFinalTotal(String(serverFinalTotal));
                      setEditingFinal(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Lead mode original AYTP / refund */}
            <div className="d-flex justify-content-between mb-2">
              <span>Amount Paid:</span>
              <strong>₹{paidAmount}</strong>
            </div>

            {refundAmount > 0 ? (
              <div className="d-flex justify-content-between mt-2">
                <span style={{ color: "red" }}>Refund Amount:</span>
                <strong style={{ color: "red" }}>₹{refundAmount}</strong>
              </div>
            ) : (
              <div className="d-flex justify-content-between mt-2">
                <span>Amount Yet To Paid:</span>
                <strong>₹{amountYetToPay}</strong>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // -------------------------------------------------------
  // HANDLE SAVE
  // -------------------------------------------------------
  const handleSave = async () => {
    if (!enquiry?.bookingId) return;

    // Basic Validation
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
            `Service ${i + 1}: Valid price required for Deep Cleaning`
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

      const normalizedServices = services.map((s) => ({
        category: s.category,
        subCategory: s.subCategory,
        serviceName: s.serviceName,
        price: Number(s.price || 0),
        quantity: 1,
        teamMembersRequired: 0,
        bookingAmount: Number(s.bookingAmount || 0),
      }));

      // ------------------------------
      // Calculate price change details
      // Compare with current backend final (not original)
      // ------------------------------
      const adjustmentAmount = Math.abs(serverFinalTotal - currentBackendFinal);
      const scopeType =
        serverFinalTotal > currentBackendFinal ? "Added" : "Reduced";

      // Determine approvedBy based on scopeType
      const approvedBy = scopeType === "Added" ? "customer" : "admin";

      const currentTime = new Date().toISOString();

      // Price change object - only if there's an adjustment
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

      // ------------------------------
      // build bookingDetailsPayload
      // ------------------------------
      let bookingDetailsPayload = {
        finalTotal: serverFinalTotal,
        bookingAmount: serverBookingAmount,
        paidAmount: Number(paidAmount),
        // Include price change if there's an adjustment
        ...(priceChange && { priceChange }),
      };

      if (leadMode) {
        bookingDetailsPayload.amountYetToPay = amountYetToPay;

        // House painting: include site visit
        if (isHousePaintingService) {
          bookingDetailsPayload.siteVisitCharges = siteVisitCharges;
        }
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

      console.log("Final Payload:", finalPayload);

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
          <div className="d-flex justify-content-between mb-2">
            <h6 className="mb-0">Preferred Slot</h6>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowTimeModal(true)}
            >
              Change Date & Slot
            </Button>
          </div>

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
                        )
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
          bookingId={enquiry?.bookingId}
        />
      )}
    </>
  );
};

export default EditEnquiryModal;

// import React, { useEffect, useState, useRef } from "react";
// import { Modal, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
// import AddressPickerModal from "./AddressPickerModal";
// import TimePickerModal from "./TimePickerModal";
// import { BASE_URL } from "../utils/config";
// import { ImCancelCircle } from "react-icons/im";
// import { FaCheck } from "react-icons/fa6";
// import { FaEdit } from "react-icons/fa";

// const normalizePhone = (s = "") => s.replace(/[^\d]/g, "").replace(/^91/, "");

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
//   const [currentBackendFinal, setCurrentBackendFinal] = useState(0); // Add this

//   const [serverBookingAmount, setServerBookingAmount] = useState(0);

//   // AYTP + refund for lead mode only
//   const [amountYetToPay, setAmountYetToPay] = useState(0);
//   const [refundAmount, setRefundAmount] = useState(0);

//   // House painting fields
//   const [siteVisitCharges, setSiteVisitCharges] = useState(0);
//   const [firstPaid, setFirstPaid] = useState(false);
//   const [secondPaid, setSecondPaid] = useState(false);
//   const [finalPaid, setFinalPaid] = useState(false);

//   const [firstAmount, setFirstAmount] = useState(0);
//   const [secondAmount, setSecondAmount] = useState(0);
//   const [finalAmount, setFinalAmount] = useState(0);

//   const isHousePaintingService = services.some(
//     (s) => s.category?.toLowerCase() === "house painting"
//   );

//   // Refs to track service changes
//   const serviceUpdatesRef = useRef(new Set());
//   const initialLoadRef = useRef(true);

//   // -------------------------------------------
//   // LOAD ENQUIRY — restore EXACT old lead-mode AYTP logic
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
//         normalizePhone(enquiry?.contact) || customer?.phone || ""
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
//         };
//       });

//       setServices(loadedServices);
//       setInitialServiceCount(service?.length || 0);

//       // Backend totals
//       const backendOriginal = Number(bookingDetails?.originalTotalAmount || 0);
//       const backendFinal = Number(
//         bookingDetails?.finalTotal ?? bookingDetails?.originalTotalAmount ?? 0
//       );
//       const backendPaid = Number(bookingDetails?.paidAmount || 0);
//       const backendBooking = Number(bookingDetails?.bookingAmount || 0);

//       setOriginalFinalTotal(backendOriginal);
//       setServerFinalTotal(backendFinal);
//       setCurrentBackendFinal(backendFinal); // Set current backend final
//       setDraftFinalTotal(String(backendFinal));
//       setPaidAmount(String(backendPaid));
//       setServerBookingAmount(backendBooking);

//       // House painting information
//       const isHP = (service || []).some(
//         (it) => it.category?.toLowerCase() === "house painting"
//       );
//       const svc = Number(bookingDetails?.siteVisitCharges || 0);
//       setSiteVisitCharges(svc);

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

//       // ---------------------------------------------------
//       // AYTP CALCULATION (RESTORED) — ONLY FOR LEAD MODE
//       // ---------------------------------------------------
//       if (leadMode) {
//         if (isHP) {
//           // House painting installment logic
//           const FT = backendFinal;

//           if (!firstPaid) {
//             setAmountYetToPay(Math.round(FT * 0.4));
//             setRefundAmount(0);
//           } else if (firstPaid && !secondPaid) {
//             setAmountYetToPay(Math.round(FT * 0.4));
//             setRefundAmount(0);
//           } else if (firstPaid && secondPaid && !finalPaid) {
//             setAmountYetToPay(Math.round(FT * 0.2));
//             setRefundAmount(0);
//           } else {
//             const totalPaid = firstAmount + secondAmount + finalAmount;
//             const diff = FT - totalPaid;
//             if (diff < 0) {
//               setRefundAmount(Math.abs(diff));
//               setAmountYetToPay(0);
//             } else {
//               setRefundAmount(0);
//               setAmountYetToPay(diff);
//             }
//           }
//         } else {
//           // Deep cleaning AYTP = finalTotal - paid
//           const aytp = backendFinal - backendPaid;
//           if (aytp < 0) {
//             setRefundAmount(Math.abs(aytp));
//             setAmountYetToPay(0);
//           } else {
//             setRefundAmount(0);
//             setAmountYetToPay(aytp);
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Load enquiry error:", err);
//     }

//     // Reset initial load flag after first load
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
//           `${BASE_URL}/deeppackage/deep-cleaning-packages`
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
//   // Helper: compute house painting display amounts (used in leadMode)
//   // ---------------------------------------
//   const computeHousePaintingDisplay = (
//     finalTotalValue,
//     siteVisitChargesValue,
//     flagsAndAmounts
//   ) => {
//     const FT = Number(finalTotalValue || 0);
//     const SV = Number(siteVisitChargesValue || 0);

//     const firstPaidFlag = !!flagsAndAmounts.firstPaid;
//     const secondPaidFlag = !!flagsAndAmounts.secondPaid;
//     const finalPaidFlag = !!flagsAndAmounts.finalPaid;

//     const fAmt = Number(flagsAndAmounts.firstAmount || 0);
//     const sAmt = Number(flagsAndAmounts.secondAmount || 0);
//     const fnAmt = Number(flagsAndAmounts.finalAmount || 0);

//     const slab40 = Math.round(FT * 0.4);
//     const slab20 = Math.round(FT * 0.2);

//     let paidDisplay = 0;
//     let aytp = 0;
//     let refund = 0;

//     if (!firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = SV;
//       aytp = slab40;
//     } else if (firstPaidFlag && !secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt;
//       aytp = slab40;
//     } else if (firstPaidFlag && secondPaidFlag && !finalPaidFlag) {
//       paidDisplay = fAmt + sAmt;
//       aytp = slab20;
//     } else if (firstPaidFlag && secondPaidFlag && finalPaidFlag) {
//       paidDisplay = fAmt + sAmt + fnAmt;
//       aytp = 0;
//       if (paidDisplay > FT) refund = paidDisplay - FT;
//     } else {
//       paidDisplay = SV;
//       aytp = slab40;
//     }

//     return { paidDisplay, aytp, refund, slab40, slab20 };
//   };

//   // ---------------------------------------
//   // ADD SERVICE - SIMPLE ADDITION
//   // ---------------------------------------
//   const addService = () => {
//     setServices((prev) => {
//       const next = [
//         ...prev,
//         {
//           category: "Deep Cleaning",
//           subCategory: "",
//           serviceName: "",
//           price: "",
//           bookingAmount: "",
//         },
//       ];
//       return next;
//     });
//   };

//   // ---------------------------------------
//   // REMOVE SERVICE - COMPLETELY ATOMIC VERSION
//   // ---------------------------------------
//   const removeService = (idx) => {
//     if (services.length === 1) {
//       alert("At least one service must remain in the booking.");
//       return;
//     }

//     // Create a copy of current services
//     const currentServices = [...services];
//     const serviceToRemove = currentServices[idx];
//     const removedPrice = Number(serviceToRemove?.price || 0);

//     // Calculate new values BEFORE any state updates
//     const newServices = currentServices.filter((_, i) => i !== idx);
//     const newFinalTotal = Math.max(0, serverFinalTotal - removedPrice);

//     let newBookingAmount = serverBookingAmount;
//     let newAmountYetToPay = amountYetToPay;
//     let newRefundAmount = refundAmount;

//     // Calculate booking amount for enquiry mode
//     if (!leadMode) {
//       newBookingAmount = Math.round(newFinalTotal * 0.2);
//     }

//     // For lead mode, calculate AYTP/refund
//     if (leadMode) {
//       const hpFlag = newServices.some(
//         (s) => (s.category || "").toLowerCase() === "house painting"
//       );

//       if (!hpFlag) {
//         // For non-house painting services in lead mode
//         const aytp = newFinalTotal - Number(paidAmount || 0);
//         if (aytp < 0) {
//           newRefundAmount = Math.abs(aytp);
//           newAmountYetToPay = 0;
//         } else {
//           newRefundAmount = 0;
//           newAmountYetToPay = aytp;
//         }
//       } else {
//         // For house painting in lead mode
//         const computed = computeHousePaintingDisplay(
//           newFinalTotal,
//           siteVisitCharges,
//           {
//             firstPaid,
//             secondPaid,
//             finalPaid,
//             firstAmount,
//             secondAmount,
//             finalAmount,
//           }
//         );
//         if (computed.refund > 0) {
//           newRefundAmount = computed.refund;
//           newAmountYetToPay = 0;
//         } else {
//           newRefundAmount = 0;
//           newAmountYetToPay = computed.aytp;
//         }
//       }
//     }

//     // Update ALL states in one synchronous batch
//     // This prevents any intermediate re-renders that might trigger onServiceChange
//     setServices(newServices);
//     setServerFinalTotal(newFinalTotal);

//     if (!leadMode) {
//       setServerBookingAmount(newBookingAmount);
//     }

//     if (leadMode) {
//       setAmountYetToPay(newAmountYetToPay);
//       setRefundAmount(newRefundAmount);
//     }
//   };

//   // ---------------------------------------
//   // ON SERVICE CHANGE - FIXED VERSION
//   // This now handles price changes correctly without double counting
//   // ---------------------------------------
//   const onServiceChange = (
//     idx,
//     field,
//     value,
//     isFromServiceSelection = false
//   ) => {
//     setServices((prev) => {
//       const copy = [...prev];
//       const oldPrice = Number(copy[idx]?.price || 0);

//       // Update the field
//       copy[idx] = {
//         ...copy[idx],
//         [field]: field === "price" && value === "" ? "" : value,
//       };

//       // Handle price field changes
//       if (field === "price") {
//         const newPrice = Number(value || 0);

//         // Calculate the actual difference
//         const priceDifference = newPrice - oldPrice;

//         // Only update if there's a change AND we're not in the initial load
//         if (priceDifference !== 0 && !initialLoadRef.current) {
//           setServerFinalTotal((prevTotal) => {
//             const newTotal = Number(prevTotal || 0) + priceDifference;

//             // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of newTotal
//             if (!leadMode) {
//               const bookingAmt = Math.round(newTotal * 0.2);
//               setServerBookingAmount(bookingAmt);
//             }

//             // If leadMode, recalc AYTP/refund
//             if (leadMode) {
//               const hpFlag = copy.some(
//                 (s) => (s.category || "").toLowerCase() === "house painting"
//               );
//               if (!hpFlag) {
//                 const aytp = newTotal - Number(paidAmount || 0);
//                 if (aytp < 0) {
//                   setRefundAmount(Math.abs(aytp));
//                   setAmountYetToPay(0);
//                 } else {
//                   setRefundAmount(0);
//                   setAmountYetToPay(aytp);
//                 }
//               }
//             }

//             return newTotal;
//           });
//         }
//       }

//       return copy;
//     });
//   };

//   // ---------------------------------------
//   // HANDLE SERVICE SELECTION FROM DROPDOWN
//   // This ensures price is only added once when service is selected
//   // ---------------------------------------
//   const handleServiceSelection = (idx, selectedServiceName) => {
//     // Find the selected service from deepList
//     const selectedService = deepList.find(
//       (item) =>
//         item.name === selectedServiceName ||
//         item.serviceName === selectedServiceName
//     );

//     if (selectedService) {
//       const newPrice = Number(
//         selectedService.totalAmount || selectedService.price || 0
//       );
//       const bookingAmount = Number(selectedService.bookingAmount || 0);

//       // Get current service price before update
//       const currentPrice = Number(services[idx]?.price || 0);

//       // Calculate the difference
//       const priceDifference = newPrice - currentPrice;

//       // Update the service
//       setServices((prev) => {
//         const copy = [...prev];
//         copy[idx] = {
//           ...copy[idx],
//           serviceName: selectedServiceName,
//           price: String(newPrice),
//           bookingAmount: String(bookingAmount),
//         };
//         return copy;
//       });

//       // Only update serverFinalTotal if there's a price difference AND we're not in initial load
//       if (priceDifference !== 0 && !initialLoadRef.current) {
//         setServerFinalTotal((prevTotal) => {
//           const newTotal = Number(prevTotal || 0) + priceDifference;

//           // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of newTotal
//           if (!leadMode) {
//             const bookingAmt = Math.round(newTotal * 0.2);
//             setServerBookingAmount(bookingAmt);
//           }

//           // If leadMode, recalc AYTP/refund
//           if (leadMode) {
//             const hpFlag = services.some(
//               (s) => (s.category || "").toLowerCase() === "house painting"
//             );
//             if (!hpFlag) {
//               const aytp = newTotal - Number(paidAmount || 0);
//               if (aytp < 0) {
//                 setRefundAmount(Math.abs(aytp));
//                 setAmountYetToPay(0);
//               } else {
//                 setRefundAmount(0);
//                 setAmountYetToPay(aytp);
//               }
//             }
//           }

//           return newTotal;
//         });
//       }
//     }
//   };

//   // Effect to handle AYTP calculation for non-house-painting services
//   useEffect(() => {
//     if (!services || services.length === 0 || initialLoadRef.current) return;

//     // If house painting service present, AYTP logic uses slabs, handled in below effect
//     if (!leadMode) {
//       // For enquiry mode, calculate booking amount as 20% of serverFinalTotal
//       const bookingAmt = Math.round(serverFinalTotal * 0.2);
//       setServerBookingAmount(bookingAmt);
//       return;
//     }

//     // For leadMode and non-house-painting, recalc AYTP as finalTotal - paid
//     const hpFlag = services.some(
//       (s) => (s.category || "").toLowerCase() === "house painting"
//     );
//     if (!hpFlag) {
//       const aytp = Number(serverFinalTotal || 0) - Number(paidAmount || 0);
//       if (aytp < 0) {
//         setRefundAmount(Math.abs(aytp));
//         setAmountYetToPay(0);
//       } else {
//         setRefundAmount(0);
//         setAmountYetToPay(aytp);
//       }
//     }
//   }, [services, leadMode, serverFinalTotal, paidAmount]);

//   // ---------------------------------------
//   // House painting AYTP recalculation for lead mode when relevant values change
//   // ---------------------------------------
//   useEffect(() => {
//     if (!leadMode || initialLoadRef.current) return;

//     const hpFlag = services.some(
//       (s) => (s.category || "").toLowerCase() === "house painting"
//     );
//     if (!hpFlag) return;

//     // Use computeHousePaintingDisplay to set amountYetToPay and refund
//     const computed = computeHousePaintingDisplay(
//       serverFinalTotal,
//       siteVisitCharges,
//       {
//         firstPaid,
//         secondPaid,
//         finalPaid,
//         firstAmount,
//         secondAmount,
//         finalAmount,
//       }
//     );

//     if (computed.refund > 0) {
//       setRefundAmount(computed.refund);
//       setAmountYetToPay(0);
//     } else {
//       setRefundAmount(0);
//       setAmountYetToPay(computed.aytp);
//     }
//   }, [
//     leadMode,
//     services,
//     serverFinalTotal,
//     siteVisitCharges,
//     firstPaid,
//     secondPaid,
//     finalPaid,
//     firstAmount,
//     secondAmount,
//     finalAmount,
//   ]);
//   // ---------------------------------------
//   // Manual Final Total edit apply (when admin edits final total via input)
//   // ---------------------------------------
//   const applyManualFinalTotal = () => {
//     const manualValue = Number(draftFinalTotal || 0);

//     if (!Number.isFinite(manualValue) || manualValue < 0) {
//       alert("Final total must be a positive number");
//       return;
//     }

//     setServerFinalTotal(manualValue);

//     // If we're in enquiry mode (not leadMode), calculate booking amount as 20% of manualValue
//     if (!leadMode) {
//       const bookingAmt = Math.round(manualValue * 0.2);
//       setServerBookingAmount(bookingAmt);
//     }

//     // If leadMode, recalc AYTP/refund
//     if (leadMode) {
//       const hpFlag = services.some(
//         (s) => (s.category || "").toLowerCase() === "house painting"
//       );
//       if (!hpFlag) {
//         const aytp = manualValue - Number(paidAmount || 0);
//         if (aytp < 0) {
//           setRefundAmount(Math.abs(aytp));
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(aytp);
//         }
//       } else {
//         const computed = computeHousePaintingDisplay(
//           manualValue,
//           siteVisitCharges,
//           {
//             firstPaid,
//             secondPaid,
//             finalPaid,
//             firstAmount,
//             secondAmount,
//             finalAmount,
//           }
//         );
//         if (computed.refund > 0) {
//           setRefundAmount(computed.refund);
//           setAmountYetToPay(0);
//         } else {
//           setRefundAmount(0);
//           setAmountYetToPay(computed.aytp);
//         }
//       }
//     }

//     setEditingFinal(false);
//   };

//   // ---------------------------------------
//   // Address & Slot handlers (used by address/time modals)
//   // ---------------------------------------
//   const handleAddressSelect = (addressObj) => {
//     if (!addressObj) return;
//     const { houseFlatNumber, streetArea, landmark, latLng } = addressObj;
//     setHouseFlatNumber(houseFlatNumber || "");
//     setStreetArea(streetArea || "");
//     setLandMark(landmark || "");
//     if (latLng && latLng.lat != null && latLng.lng != null) {
//       setLocation({
//         type: "Point",
//         coordinates: [latLng.lng, latLng.lat],
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

//   // ---------------------------------------
//   // Payment Summary UI (leadMode shows AYTP/refund; enquiry hides AYTP/refund)
//   // ---------------------------------------
//   // const PaymentSummarySection = () => {
//   //   // Calculate total change (difference between current and original)
//   //   const totalChange = serverFinalTotal - originalFinalTotal;

//   //   return (
//   //     <div
//   //       className="mt-3 p-3"
//   //       style={{
//   //         background: "#f8f9fa",
//   //         borderRadius: 8,
//   //         border: "1px solid #e3e3e3",
//   //       }}
//   //     >
//   //       <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//   //       {/* Show original amount ALWAYS */}
//   //       <div className="d-flex justify-content-between mb-1">
//   //         <span>Original Total Amount:</span>
//   //         <strong>₹{originalFinalTotal}</strong>
//   //       </div>

//   //       {/* Show total change */}
//   //       {totalChange !== 0 && (
//   //         <div className="d-flex justify-content-between mb-2">
//   //           <span>Total Change:</span>
//   //           <strong
//   //             style={{ color: totalChange < 0 ? "red" : "green" }}
//   //           >
//   //             {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
//   //           </strong>
//   //         </div>
//   //       )}

//   //       {/* House painting enquiry: site visit only */}
//   //       {isHousePaintingService && !leadMode ? (
//   //         <div className="d-flex justify-content-between mb-2">
//   //           <span>Site Visit Charges:</span>
//   //           <strong>₹{siteVisitCharges}</strong>
//   //         </div>
//   //       ) : (
//   //         <>
//   //           {/* Final Total display & manual edit */}
//   //           <div
//   //             className="d-flex justify-content-between mb-2"
//   //             style={{ alignItems: "center" }}
//   //           >
//   //             <span> {totalChange ? "New Total Amount:": "Total Amount:"}</span>

//   //             {editingFinal ? (
//   //               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//   //                 <Form.Control
//   //                   type="number"
//   //                   size="sm"
//   //                   value={draftFinalTotal}
//   //                   onChange={(e) => setDraftFinalTotal(e.target.value)}
//   //                   style={{ width: 120 }}
//   //                 />
//   //                 <div
//   //                   style={{ color: "#007a0a", cursor: "pointer" }}
//   //                   onClick={applyManualFinalTotal}
//   //                   title="Apply"
//   //                 >
//   //                   <FaCheck />
//   //                 </div>
//   //                 <div
//   //                   style={{ color: "#d40000", cursor: "pointer" }}
//   //                   onClick={() => {
//   //                     setDraftFinalTotal(String(serverFinalTotal));
//   //                     setEditingFinal(false);
//   //                   }}
//   //                   title="Cancel"
//   //                 >
//   //                   <ImCancelCircle />
//   //                 </div>
//   //               </div>
//   //             ) : (
//   //               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//   //                 <strong style={{ color: "#007a0a" }}>
//   //                   ₹{serverFinalTotal}
//   //                 </strong>
//   //                 <span
//   //                   style={{ cursor: "pointer", color: "#7F6663" }}
//   //                   onClick={() => {
//   //                     setDraftFinalTotal(String(serverFinalTotal));
//   //                     setEditingFinal(true);
//   //                   }}
//   //                   title="Edit final total"
//   //                 >
//   //                   <FaEdit />
//   //                 </span>
//   //               </div>
//   //             )}
//   //           </div>

//   //           {/* Booking amount — 20% of final total for enquiry mode */}
//   //           {leadMode != true && (
//   //             <div className="d-flex justify-content-between mb-2">
//   //               <span>Booking Amount (20% of Final Total):</span>
//   //               <strong>₹{serverBookingAmount}</strong>
//   //             </div>
//   //           )}

//   //           {/* Paid amount */}
//   //           <div className="d-flex justify-content-between mb-2">
//   //             <span>Amount Paid:</span>
//   //             <strong>₹{paidAmount}</strong>
//   //           </div>

//   //           {/* Lead mode only — show AYTP or refund */}
//   //           {leadMode && (
//   //             <>
//   //               {refundAmount > 0 ? (
//   //                 <div className="d-flex justify-content-between mt-2">
//   //                   <span style={{ color: "red" }}>Refund Amount:</span>
//   //                   <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//   //                 </div>
//   //               ) : (
//   //                 <div className="d-flex justify-content-between mt-2">
//   //                   <span>Amount Yet To Paid:</span>
//   //                   <strong>₹{amountYetToPay}</strong>
//   //                 </div>
//   //               )}
//   //             </>
//   //           )}

//   //           {/* House painting installments — leadMode only */}
//   //           {leadMode && isHousePaintingService && serverFinalTotal > 0 && (
//   //             <div
//   //               className="d-flex justify-content-between mt-2"
//   //               style={{ fontSize: 12 }}
//   //             >
//   //               <span className="text-muted">Current Installment:</span>

//   //               <strong>
//   //                 {!firstPaid
//   //                   ? "1st Installment (40%)"
//   //                   : firstPaid && !secondPaid
//   //                   ? "2nd Installment (40%)"
//   //                   : firstPaid && secondPaid && !finalPaid
//   //                   ? "Final Installment (20%)"
//   //                   : "Completed"}
//   //               </strong>
//   //             </div>
//   //           )}
//   //         </>
//   //       )}
//   //     </div>
//   //   );
//   // };

//   const PaymentSummarySection = () => {
//   const totalChange = serverFinalTotal - originalFinalTotal;

//   const isDeepCleaning = services.some(
//     (s) => s.category?.toLowerCase() === "deep cleaning"
//   );

//   return (
//     <div
//       className="mt-3 p-3"
//       style={{
//         background: "#f8f9fa",
//         borderRadius: 8,
//         border: "1px solid #e3e3e3",
//       }}
//     >
//       <h6 style={{ marginBottom: 10 }}>Payment Summary</h6>

//       {/* =========================
//           1. HOUSE PAINTING ENQUIRY
//       ========================== */}
//       {isHousePaintingService && !leadMode && (
//         <>
//           <div className="d-flex justify-content-between mb-2">
//             <span>Site Visit Charges:</span>
//             <strong>₹{siteVisitCharges}</strong>
//           </div>
//         </>
//       )}

//       {/* =========================
//           2. DEEP CLEANING ENQUIRY
//       ========================== */}
//       {isDeepCleaning && !isHousePaintingService && !leadMode && (
//         <>
//           {/* Original Amount */}
//           <div className="d-flex justify-content-between mb-1">
//             <span>Original Total Amount:</span>
//             <strong>₹{originalFinalTotal}</strong>
//           </div>

//           {/* Total Change */}
//           {totalChange !== 0 && (
//             <div className="d-flex justify-content-between mb-2">
//               <span>Total Change:</span>
//               <strong style={{ color: totalChange < 0 ? "red" : "green" }}>
//                 {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
//               </strong>
//             </div>
//           )}

//           {/* Final Total (editable for enquiry also) */}
//           <div
//             className="d-flex justify-content-between mb-2"
//             style={{ alignItems: "center" }}
//           >
//             <span>{totalChange ? "New Total Amount:" : "Total Amount:"}</span>

//             {editingFinal ? (
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Form.Control
//                   type="number"
//                   size="sm"
//                   value={draftFinalTotal}
//                   onChange={(e) => setDraftFinalTotal(e.target.value)}
//                   style={{ width: 120 }}
//                 />
//                 <FaCheck
//                   style={{ cursor: "pointer", color: "green" }}
//                   onClick={applyManualFinalTotal}
//                 />
//                 <ImCancelCircle
//                   style={{ cursor: "pointer", color: "red" }}
//                   onClick={() => {
//                     setDraftFinalTotal(String(serverFinalTotal));
//                     setEditingFinal(false);
//                   }}
//                 />
//               </div>
//             ) : (
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <strong style={{ color: "#007a0a" }}>
//                   ₹{serverFinalTotal}
//                 </strong>
//                 <FaEdit
//                   style={{ cursor: "pointer", color: "#7F6663" }}
//                   onClick={() => {
//                     setDraftFinalTotal(String(serverFinalTotal));
//                     setEditingFinal(true);
//                   }}
//                 />
//               </div>
//             )}
//           </div>

//           {/* Booking Amount → ALWAYS SHOW THIS IN ENQUIRY */}
//           <div className="d-flex justify-content-between mb-2">
//             <span>Booking Amount (20% of Final Total):</span>
//             <strong>₹{serverBookingAmount}</strong>
//           </div>
//         </>
//       )}

//       {/* =========================
//           3. LEAD MODE (unchanged)
//       ========================== */}
//       {leadMode && (
//         <>
//           <div className="d-flex justify-content-between mb-1">
//             <span>Original Total Amount:</span>
//             <strong>₹{originalFinalTotal}</strong>
//           </div>

//           {totalChange !== 0 && (
//             <div className="d-flex justify-content-between mb-2">
//               <span>Total Change:</span>
//               <strong style={{ color: totalChange < 0 ? "red" : "green" }}>
//                 {totalChange < 0 ? "-" : "+"}₹{Math.abs(totalChange)}
//               </strong>
//             </div>
//           )}

//           {/* Final total editable (existing logic stays untouched) */}
//           <div
//             className="d-flex justify-content-between mb-2"
//             style={{ alignItems: "center" }}
//           >
//             <span>{totalChange ? "New Total Amount:" : "Total Amount:"}</span>

//             {editingFinal ? (
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Form.Control
//                   type="number"
//                   size="sm"
//                   value={draftFinalTotal}
//                   onChange={(e) => setDraftFinalTotal(e.target.value)}
//                   style={{ width: 120 }}
//                 />
//                 <FaCheck
//                   style={{ cursor: "pointer", color: "green" }}
//                   onClick={applyManualFinalTotal}
//                 />
//                 <ImCancelCircle
//                   style={{ cursor: "pointer", color: "red" }}
//                   onClick={() => {
//                     setDraftFinalTotal(String(serverFinalTotal));
//                     setEditingFinal(false);
//                   }}
//                 />
//               </div>
//             ) : (
//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <strong style={{ color: "#007a0a" }}>
//                   ₹{serverFinalTotal}
//                 </strong>
//                 <FaEdit
//                   style={{ cursor: "pointer", color: "#7F6663" }}
//                   onClick={() => {
//                     setDraftFinalTotal(String(serverFinalTotal));
//                     setEditingFinal(true);
//                   }}
//                 />
//               </div>
//             )}
//           </div>

//           {/* Lead mode original AYTP / refund */}
//           <div className="d-flex justify-content-between mb-2">
//             <span>Amount Paid:</span>
//             <strong>₹{paidAmount}</strong>
//           </div>

//           {refundAmount > 0 ? (
//             <div className="d-flex justify-content-between mt-2">
//               <span style={{ color: "red" }}>Refund Amount:</span>
//               <strong style={{ color: "red" }}>₹{refundAmount}</strong>
//             </div>
//           ) : (
//             <div className="d-flex justify-content-between mt-2">
//               <span>Amount Yet To Paid:</span>
//               <strong>₹{amountYetToPay}</strong>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

//   // -------------------------------------------------------
//   // HANDLE SAVE
//   // -------------------------------------------------------
//   const handleSave = async () => {
//     if (!enquiry?.bookingId) return;

//     // Basic Validation
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
//             `Service ${i + 1}: Valid price required for Deep Cleaning`
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

//       const normalizedServices = services.map((s) => ({
//         category: s.category,
//         subCategory: s.subCategory,
//         serviceName: s.serviceName,
//         price: Number(s.price || 0),
//         quantity: 1,
//         teamMembersRequired: 0,
//         bookingAmount: Number(s.bookingAmount || 0),
//       }));

//       // ------------------------------
//       // Calculate price change details
//       // Compare with current backend final (not original)
//       // ------------------------------
//       const adjustmentAmount = Math.abs(serverFinalTotal - currentBackendFinal);
//       const scopeType =
//         serverFinalTotal > currentBackendFinal ? "Added" : "Reduced";

//       // Determine approvedBy based on scopeType
//       const approvedBy = scopeType === "Added" ? "customer" : "admin";

//       const currentTime = new Date().toISOString();

//       // Price change object - only if there's an adjustment
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

//       // ------------------------------
//       // build bookingDetailsPayload
//       // ------------------------------
//       let bookingDetailsPayload = {
//         finalTotal: serverFinalTotal,
//         bookingAmount: serverBookingAmount,
//         paidAmount: Number(paidAmount),
//         // Include price change if there's an adjustment
//         ...(priceChange && { priceChange }),
//       };

//       if (leadMode) {
//         bookingDetailsPayload.amountYetToPay = amountYetToPay;

//         // House painting: include site visit
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

//       console.log("Final Payload:", finalPayload);

//       // const endpoint = leadMode
//       //   ? `${BASE_URL}/bookings/update-user-booking/${enquiry.bookingId}`
//       //   : `${BASE_URL}/bookings/update-user-enquiry/${enquiry.bookingId}`;

//       // const res = await fetch(endpoint, {
//       //   method: "PUT",
//       //   headers: { "Content-Type": "application/json" },
//       //   body: JSON.stringify(finalPayload),
//       // });

//       // const data = await res.json();
//       // if (!res.ok) throw new Error(data?.message || "Update failed.");

//       // onUpdated?.(data.booking);
//       // onClose();
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
//           <div className="d-flex justify-content-between mb-2">
//             <h6 className="mb-0">Address *</h6>
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => setShowAddressModal(true)}
//             >
//               Change Address
//             </Button>
//           </div>

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
//           <div className="d-flex justify-content-between mb-2">
//             <h6 className="mb-0">Preferred Slot</h6>
//             <Button
//               variant="outline-secondary"
//               size="sm"
//               onClick={() => setShowTimeModal(true)}
//             >
//               Change Date & Slot
//             </Button>
//           </div>

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
//                         )
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
//           bookingId={enquiry?.bookingId}
//         />
//       )}
//     </>
//   );
// };

// export default EditEnquiryModal;
