import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Button,
  Table,
  Form,
  Container,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { CSVLink } from "react-csv";
import axios from "axios";
import { BASE_URL } from "../utils/config";

const MoneyDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [overallCoinsIncome, setOverallCoinsIncome] = useState(0);
  const [overallCoinSold, setOverallCoinSold] = useState(0);

  const [manualPayments, setManualPayments] = useState([]);
  const [filter, setFilter] = useState("paid"); // paid | pending | refund
  const [paymentMode, setPaymentMode] = useState("booking"); // booking | manual
  const [loading, setLoading] = useState(true);

  const [payingId, setPayingId] = useState(""); // ✅ track pay now loading
  const [errors, setErrors] = useState({ phone: "" });
// ✅ Cities (API)
const [cities, setCities] = useState([]);
const [citiesLoading, setCitiesLoading] = useState(false);

  const [filters, setFilters] = useState({
    service: "All Services",
    city: "All Cities",
  });

  const [customDate, setCustomDate] = useState({ start: "", end: "" });

  const [formData, setFormData] = useState({
    type: "customer",
    name: "",
    phone: "",
    amount: "",
    service: "",
    city: "",
    context: "others",
  });

  const [totalSales, setTotalSales] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [onlineAmount, setOnlineAmount] = useState(0);

  /* ======================================================
        HELPERS
  ====================================================== */

  const fetchCities = async () => {
  try {
    setCitiesLoading(true);

    // ✅ your endpoint (based on what you shared)
    const res = await axios.get(`${BASE_URL}/city/city-list`);

    const list = Array.isArray(res?.data?.data) ? res.data.data : [];

    // normalize to string array
    const names = list
      .map((x) => String(x?.city || "").trim())
      .filter(Boolean);

    // remove duplicates
    const unique = Array.from(new Set(names));

    setCities(unique);
  } catch (err) {
    console.error("fetchCities error:", err);
    setCities([]);
  } finally {
    setCitiesLoading(false);
  }
};
  const isHousePainting = (serviceType) => {
    try {
      return String(serviceType || "").toLowerCase() === "house_painting";
    } catch (e) {
      console.error("isHousePainting error:", e);
      return false;
    }
  };

  const isCancelled = (status = "") => {
    try {
      return String(status || "")
        .toLowerCase()
        .includes("cancelled");
    } catch (e) {
      console.error("isCancelled error:", e);
      return false;
    }
  };

  const isInstallmentTx = (tx) => {
    try {
      const inst = String(tx?.installment || "").toLowerCase();
      return ["first", "second", "final"].includes(inst);
    } catch (e) {
      console.error("isInstallmentTx error:", e);
      return false;
    }
  };

  const isSiteVisitTx = (p, tx) => {
    try {
      if (!isHousePainting(p?.serviceType)) return false;

      const purpose = String(tx?.purpose || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");

      // ✅ if purpose says site visit, it is site visit (even if installment missing)
      return purpose === "site_visit";
    } catch (e) {
      console.error("isSiteVisitTx error:", e);
      return false;
    }
  };

  const isBookingMoneyTx = (p, tx) => {
    try {
      return isInstallmentTx(tx) || isSiteVisitTx(p, tx);
    } catch (e) {
      console.error("isBookingMoneyTx error:", e);
      return false;
    }
  };

  const fmt = (d) => {
    try {
      return d ? new Date(d).toLocaleString("en-GB") : "-";
    } catch (e) {
      console.error("fmt error:", e);
      return "-";
    }
  };

  const getCustomerCell = (p) => {
    try {
      if (!p?.customer) return "-";
      return (
        <>
          {p.customer.name}
          <br />(<span style={{ fontSize: "10px" }}>{p.customer.phone}</span>)
        </>
      );
    } catch (e) {
      console.error("getCustomerCell error:", e);
      return "-";
    }
  };

  const getCustomerText = (p) => {
    // ✅ for CSV
    try {
      const name = p?.customer?.name || "";
      const phone = p?.customer?.phone || "";
      if (!name && !phone) return "-";
      if (!phone) return name;
      return `${name} (${phone})`;
    } catch (e) {
      console.error("getCustomerText error:", e);
      return "-";
    }
  };

  const getServiceStr = (p) => {
    try {
      return (p?.service || [])
        .map((s) => s?.serviceName || s?.category)
        .filter(Boolean)
        .join(", ");
    } catch (e) {
      console.error("getServiceStr error:", e);
      return "-";
    }
  };

  const getOrderId = (p) => {
    try {
      return p?.bookingDetails?.booking_id || p?._id || "-";
    } catch (e) {
      console.error("getOrderId error:", e);
      return "-";
    }
  };

  const getVendorName = (p) => {
    try {
      return p?.assignedProfessional?.name || "-";
    } catch (e) {
      console.error("getVendorName error:", e);
      return "-";
    }
  };

  const getCity = (p) => {
    try {
      return p?.address?.city || "-";
    } catch (e) {
      console.error("getCity error:", e);
      return "-";
    }
  };

  const getInstallmentTarget = (b, key) => {
    try {
      const node = b?.[key] || {};
      return Number(node?.requestedAmount ?? node?.amount ?? 0);
    } catch (e) {
      console.error("getInstallmentTarget error:", e);
      return 0;
    }
  };

  const sumTx = (txs, predicate) => {
    try {
      return (txs || []).reduce((sum, tx) => {
        if (!predicate(tx)) return sum;
        const amt = Number(tx?.amount || 0);
        return sum + (amt > 0 ? amt : 0);
      }, 0);
    } catch (e) {
      console.error("sumTx error:", e);
      return 0;
    }
  };

  const lastTxDate = (txs, predicate) => {
    try {
      let last = null;
      (txs || []).forEach((tx) => {
        if (!predicate(tx)) return;
        const at = tx?.at || tx?.paidAt || null;
        if (!at) return;
        const dt = new Date(at);
        if (!last || dt > new Date(last)) last = at;
      });
      return last;
    } catch (e) {
      console.error("lastTxDate error:", e);
      return null;
    }
  };

  const sumByMethod = (items, predicate, getMethodFn = (x) => x?.method) => {
    try {
      let cash = 0;
      let online = 0;

      (items || []).forEach((item) => {
        if (!predicate(item)) return;
        const amt = Number(item?.amount || 0);
        if (!(amt > 0)) return;

        const m = String(getMethodFn(item) || "")
          .toLowerCase()
          .trim();
        if (m === "cash") cash += amt;
        else online += amt;
      });

      return { cash, online };
    } catch (e) {
      console.error("sumByMethod error:", e);
      return { cash: 0, online: 0 };
    }
  };

  const getManualMethod = (m) => {
    try {
      return (
        m?.payment?.method ||
        m?.payment?.paymentMethod ||
        m?.paymentMethod ||
        m?.method ||
        m?.mode ||
        ""
      );
    } catch (e) {
      console.error("getManualMethod error:", e);
      return "";
    }
  };

  const computeBookingTotals = (p) => {
    try {
      const b = p?.bookingDetails || {};
      const txs = Array.isArray(p?.payments) ? p.payments : [];

      const siteVisitCharges = isHousePainting(p?.serviceType)
        ? Number(b.siteVisitCharges || 0)
        : 0;

      const firstTarget = getInstallmentTarget(b, "firstPayment");
      const secondTarget = getInstallmentTarget(b, "secondPayment");
      const finalTarget = getInstallmentTarget(b, "finalPayment");

      const installmentTarget = firstTarget + secondTarget + finalTarget;

      const paidFirst = sumTx(
        txs,
        (tx) =>
          String(tx?.installment || "").toLowerCase() === "first" &&
          !isSiteVisitTx(p, tx),
      );

      const paidSecond = sumTx(
        txs,
        (tx) =>
          String(tx?.installment || "").toLowerCase() === "second" &&
          !isSiteVisitTx(p, tx),
      );

      const paidFinal = sumTx(
        txs,
        (tx) =>
          String(tx?.installment || "").toLowerCase() === "final" &&
          !isSiteVisitTx(p, tx),
      );

      const installmentPaid = paidFirst + paidSecond + paidFinal;
      const installmentPending = Math.max(
        installmentTarget - installmentPaid,
        0,
      );

      const rawSiteVisitPaid = sumTx(txs, (tx) => isSiteVisitTx(p, tx));
      const paidSiteVisit =
        siteVisitCharges > 0 ? Math.min(rawSiteVisitPaid, siteVisitCharges) : 0;
      const siteVisitPending = Math.max(siteVisitCharges - paidSiteVisit, 0);

      const overallPaid = installmentPaid + paidSiteVisit;
      const overallPending = installmentPending + siteVisitPending;

      const splitBooking = sumByMethod(
        txs,
        (tx) => isBookingMoneyTx(p, tx),
        (tx) => tx?.method,
      );

      return {
        targets: {
          first: firstTarget,
          second: secondTarget,
          final: finalTarget,
          siteVisit: siteVisitCharges,
          installmentTarget,
        },
        paid: {
          first: paidFirst,
          second: paidSecond,
          final: paidFinal,
          siteVisit: paidSiteVisit,
          installmentPaid,
          overallPaid,
        },
        remaining: {
          first: Math.max(firstTarget - paidFirst, 0),
          second: Math.max(secondTarget - paidSecond, 0),
          final: Math.max(finalTarget - paidFinal, 0),
          siteVisit: siteVisitPending,
          installmentPending,
          overallPending,
        },
        bookingCash: splitBooking.cash,
        bookingOnline: splitBooking.online,
      };
    } catch (e) {
      console.error("computeBookingTotals error:", e);
      return {
        targets: {
          first: 0,
          second: 0,
          final: 0,
          siteVisit: 0,
          installmentTarget: 0,
        },
        paid: {
          first: 0,
          second: 0,
          final: 0,
          siteVisit: 0,
          installmentPaid: 0,
          overallPaid: 0,
        },
        remaining: {
          first: 0,
          second: 0,
          final: 0,
          siteVisit: 0,
          installmentPending: 0,
          overallPending: 0,
        },
        bookingCash: 0,
        bookingOnline: 0,
      };
    }
  };

  /* ======================================================
        API CALLS
  ====================================================== */

  const fetchManualPayments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/manual-payment/`);
      setManualPayments(res.data.data || []);
    } catch (err) {
      console.error("Manual Payment Fetch Error:", err);
      setManualPayments([]);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/bookings/get-all-leads`, {
        params: {
          service: filters.service === "All Services" ? "" : filters.service,
          city: filters.city === "All Cities" ? "" : filters.city,
          startDate: customDate.start || "",
          endDate: customDate.end || "",
        },
      });

      setPayments(res.data.allLeads || []);
    } catch (err) {
      console.error("Booking Payment Fetch Error:", err);
      setPayments([]);
    }
  };
  const fetchOverallIncomfromcoins = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/wallet/overall-coin-sold`);
      setOverallCoinsIncome(Number(res?.data?.data?.grandTotal || 0));
    } catch (err) {
      console.error("Error Fetching overall Coins:", err);
      setOverallCoinsIncome(0);
    }
  };
  const fetchOverallCoinsSold = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/vendor/overall-coin-sold`);
      setOverallCoinSold(Number(res?.data?.total || 0));
    } catch (err) {
      console.error("Error Fetching overall Coins:", err);
      setOverallCoinSold(0);
    }
  };

  // ✅ DIRECT CALL: mark manual payment paid (method=cash, providerRef auto)
  const markManualPaid = async (payment) => {
    try {
      const id = payment?._id;
      if (!id) {
        alert("Payment ID not found");
        return;
      }

      const yes = window.confirm("Mark this manual payment as PAID?");
      if (!yes) return;

      setPayingId(id);

      const now = new Date();
      const providerRef = `manual-pay-${now
        .toISOString()
        .replace(/[:.]/g, "")}`;

      const res = await axios.put(
        `${BASE_URL}/manual-payment/mark-paid/${id}`,
        {
          method: "Cash",
          providerRef,
        },
      );

      if (res?.data?.success === false) {
        alert(res?.data?.message || "Failed to mark as paid");
        return;
      }

      // alert("Payment marked as paid ✅");
      await fetchManualPayments();
    } catch (err) {
      console.error("markManualPaid error:", err);
      alert(err?.response?.data?.message || "Error marking payment as paid");
    } finally {
      setPayingId("");
    }
  };

  /* ======================================================
        LOAD BOTH (once)
  ====================================================== */
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchManualPayments(),
          fetchPayments(),
          fetchOverallIncomfromcoins(),
          fetchOverallCoinsSold(),
           fetchCities(), 
        ]);
      } catch (e) {
        console.error("Initial load error", e);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchOverallIncomfromcoins();
  }, [manualPayments]);

  /* ======================================================
        TOTALS (UPDATED)
  ====================================================== */
  useEffect(() => {
    try {
      let overallPaidTotal = 0;
      let overallPendingTotal = 0;

      let cash = 0;
      let online = 0;

      (payments || []).forEach((p) => {
        const b = p?.bookingDetails || {};
        if (isCancelled(b.status)) return;

        const t = computeBookingTotals(p);

        overallPaidTotal += Number(t.paid.overallPaid || 0);
        overallPendingTotal += Number(t.remaining.overallPending || 0);

        cash += Number(t.bookingCash || 0);
        online += Number(t.bookingOnline || 0);
      });

      const manualPaidList = (manualPayments || []).filter(
        (m) => m.payment?.status === "Paid",
      );

      const manualPending = (manualPayments || [])
        .filter((m) => m.payment?.status === "Pending")
        .reduce((sum, m) => sum + Number(m.amount || 0), 0);

      const manualPaid = manualPaidList.reduce(
        (sum, m) => sum + Number(m.amount || 0),
        0,
      );

      const manualSplit = sumByMethod(
        manualPaidList,
        () => true,
        (m) => getManualMethod(m),
      );

      cash += Number(manualSplit.cash || 0);
      online += Number(manualSplit.online || 0);

      setTotalSales(overallPaidTotal + manualPaid);
      setPendingAmount(overallPendingTotal + manualPending);
      setCashAmount(cash);
      setOnlineAmount(online);
    } catch (e) {
      console.error("Totals calculation error:", e);
      setTotalSales(0);
      setPendingAmount(0);
      setCashAmount(0);
      setOnlineAmount(0);
    }
  }, [payments, manualPayments]);

  /* ======================================================
        SEARCH
  ====================================================== */
  const handleSearch = async () => {
    try {
      setLoading(true);
      await fetchPayments();
    } catch (e) {
      console.error("handleSearch error:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
        BOOKING ROWS
  ====================================================== */
  const bookingPaidRows = useMemo(() => {
    try {
      const rows = [];

      (payments || []).forEach((p) => {
        const b = p?.bookingDetails || {};
        if (isCancelled(b.status)) return;

        const txs = Array.isArray(p?.payments) ? p.payments : [];
        const totals = computeBookingTotals(p);

        const customer = getCustomerCell(p);

        const customerName = p?.customer?.name || "-";
        const customerPhone = p?.customer?.phone || "-";

        const vendor = getVendorName(p);
        const orderId = getOrderId(p);
        const service = getServiceStr(p);
        const city = getCity(p);

        const pushStage = (
          label,
          paid,
          target,
          remaining,
          predicateForLastDate,
        ) => {
          try {
            if (!(paid > 0)) return;

            const lastAt = lastTxDate(txs, predicateForLastDate);

            rows.push({
              date: fmt(lastAt || b.bookingDate || p.createdDate),
              customer,
              customerName,
              customerPhone,

              orderId,
              vendor,
              paymentId: "N/A",
              stage: label,
              paid: Number(paid || 0),
              total: Number(target || 0),
              remaining: Number(remaining || 0),
              service,
              city,
            });
          } catch (e) {
            console.error("pushStage error:", e);
          }
        };

        pushStage(
          "First Installment",
          totals.paid.first,
          totals.targets.first,
          totals.remaining.first,
          (tx) =>
            String(tx?.installment || "").toLowerCase() === "first" &&
            !isSiteVisitTx(p, tx),
        );

        pushStage(
          "Second Installment",
          totals.paid.second,
          totals.targets.second,
          totals.remaining.second,
          (tx) =>
            String(tx?.installment || "").toLowerCase() === "second" &&
            !isSiteVisitTx(p, tx),
        );

        pushStage(
          "Final Installment",
          totals.paid.final,
          totals.targets.final,
          totals.remaining.final,
          (tx) =>
            String(tx?.installment || "").toLowerCase() === "final" &&
            !isSiteVisitTx(p, tx),
        );

        if (Number(totals.targets.siteVisit || 0) > 0) {
          const sitePaid = Number(totals.paid.siteVisit || 0);
          const siteRemain = Number(totals.remaining.siteVisit || 0);

          if (sitePaid > 0) {
            const lastAt = lastTxDate(txs, (tx) => isSiteVisitTx(p, tx));

            rows.push({
              date: fmt(lastAt || b.bookingDate || p.createdDate),
              customer,
              customerName,
              customerPhone,

              orderId,
              vendor,
              paymentId: "N/A",
              stage: "Site Visit",
              paid: sitePaid,
              total: Number(totals.targets.siteVisit || 0),
              remaining: siteRemain,
              service,
              city,
            });
          }
        }
      });

      rows.sort((a, b) => new Date(b.date) - new Date(a.date));
      return rows;
    } catch (err) {
      console.error("bookingPaidRows error:", err);
      return [];
    }
  }, [payments]);

  const bookingPendingRows = useMemo(() => {
    try {
      const rows = [];

      (payments || []).forEach((p) => {
        const b = p?.bookingDetails || {};
        if (isCancelled(b.status)) return;

        const totals = computeBookingTotals(p);
        const due = Number(totals.remaining.overallPending || 0);
        if (!(due > 0)) return;

        const customer = getCustomerCell(p);
        const vendor = getVendorName(p);
        const orderId = getOrderId(p);
        const service = getServiceStr(p);
        const city = getCity(p);

        const date = p?.selectedSlot
          ? `${p.selectedSlot.slotDate} ${p.selectedSlot.slotTime}`
          : b.bookingDate
            ? fmt(b.bookingDate)
            : fmt(p.createdDate);

        const customerName = p?.customer?.name || "-";
        const customerPhone = p?.customer?.phone || "-";

        rows.push({
          date,
          customer,
          customerName,
          customerPhone,
          orderId,
          vendor,
          paymentId: "N/A",
          amountDue: due,
          service,
          city,
        });
      });

      rows.sort((a, b) => {
        const da = new Date(a.date).getTime() || 0;
        const db = new Date(b.date).getTime() || 0;
        return db - da;
      });

      return rows;
    } catch (err) {
      console.error("bookingPendingRows error:", err);
      return [];
    }
  }, [payments]);

  const bookingRefundRows = useMemo(() => {
    try {
      const rows = [];

      const isCancelledExact = (status) => {
        try {
          const s = String(status || "").toLowerCase();
          return (
            s === "cancelled" ||
            s === "admin cancelled" ||
            s === "customer cancelled"
          );
        } catch (e) {
          console.error("isCancelledExact error:", e);
          return false;
        }
      };

      (payments || []).forEach((p) => {
        try {
          const b = p.bookingDetails || {};
          const refundAmount = Number(b.refundAmount || 0);
          const paidAmount = Number(b.paidAmount || 0);

          if (!isCancelledExact(b.status)) return;
          if (!(refundAmount > 0)) return;

          const customer = getCustomerCell(p);
          const vendor = getVendorName(p);
          const orderId = getOrderId(p);
          const service = getServiceStr(p);
          const city = getCity(p);

          const dt =
            b.cancelApprovedAt ||
            (Array.isArray(p.payments) && p.payments[0]?.at) ||
            p.createdDate ||
            b.bookingDate ||
            null;

          const customerName = p?.customer?.name || "-";
          const customerPhone = p?.customer?.phone || "-";

          rows.push({
            date: fmt(dt),
            customer,
            customerName,
            customerPhone,

            orderId,
            vendor,
            paymentId: b.paymentLink?.providerRef || "N/A",
            amountPaid: paidAmount,
            amountRefund: refundAmount,
            service,
            city,
          });
        } catch (e) {
          console.error("bookingRefundRows item error:", e);
        }
      });

      rows.sort((a, b) => new Date(b.date) - new Date(a.date));
      return rows;
    } catch (err) {
      console.error("bookingRefundRows error:", err);
      return [];
    }
  }, [payments]);

  /* ======================================================
        ✅ CURRENT TABLE CSV (NEW)
        - Exports ONLY the currently visible table
  ====================================================== */
  const currentCsvData = useMemo(() => {
    try {
      // BOOKING
      if (paymentMode === "booking") {
        if (filter === "paid") {
          return (bookingPaidRows || []).map((r) => ({
            "Date & Time": r.date,
            "Customer Name": r.customerName,
            "Customer Phone": r.customerPhone,
            "Order Id": r.orderId,
            Vendor: r.vendor,
            "Payment ID": r.paymentId,
            Stage: r.stage,
            "Paid Amount": r.paid,
            "Stage Total": r.total,
            Remaining: r.remaining,
            Service: r.service,
            City: r.city,
          }));
        }

        if (filter === "pending") {
          return (bookingPendingRows || []).map((r) => ({
            "Date & Time": r.date,
            "Customer Name": r.customerName,
            "Customer Phone": r.customerPhone,
            "Order Id": r.orderId,
            Vendor: r.vendor,
            "Payment ID": r.paymentId,
            "Overall Due": r.amountDue,
            Service: r.service,
            City: r.city,
          }));
        }

        // refund
        return (bookingRefundRows || []).map((r) => ({
          "Date & Time": r.date,
          "Customer Name": r.customerName,
          "Customer Phone": r.customerPhone,
          "Order Id": r.orderId,
          Vendor: r.vendor,
          "Payment ID": r.paymentId,
          Status: "Refund",
          "Paid Amount": r.amountPaid,
          "Refund Amount": r.amountRefund,
          Service: r.service,
          City: r.city,
        }));
      }

      // MANUAL
      const list = (manualPayments || []).filter((m) =>
        filter === "paid"
          ? m.payment?.status === "Paid"
          : m.payment?.status === "Pending",
      );

      return list.map((m) => ({
        "Date & Time": fmt(m.createdAt),
        Customer: `${m.name || ""} (${m.phone || ""})`.trim() || "-",
        "Payment Link": m.payment?.url || "-",
        Amount: Number(m.amount || 0),
        Service: m.service || "-",
        City: m.city || "-",
        Status: m.payment?.status || "-",
      }));
    } catch (e) {
      console.error("currentCsvData error:", e);
      return [];
    }
  }, [
    paymentMode,
    filter,
    bookingPaidRows,
    bookingPendingRows,
    bookingRefundRows,
    manualPayments,
  ]);

  const csvFileName = useMemo(() => {
    try {
      const mode = paymentMode === "booking" ? "booking" : "manual";
      const f = filter || "paid";
      const ts = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      return `${mode}-${f}-${ts}.csv`;
    } catch (e) {
      console.error("csvFileName error:", e);
      return "payments.csv";
    }
  }, [paymentMode, filter]);

  /* ======================================================
        FORM VALIDATION
  ====================================================== */
  const handleInputChange = (e) => {
    try {
      const { name, value } = e.target;

      if (name === "phone") {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 10) return;

        setFormData((prev) => ({ ...prev, phone: value }));
        setErrors((prev) => ({
          ...prev,
          phone: value.length === 10 ? "" : "Phone must be 10 digits",
        }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    } catch (err) {
      console.error("handleInputChange error:", err);
    }
  };

  const generatePaymentLink = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/manual-payment/`, formData);
      // alert("Payment Link: " + res.data.data.payment.url);
      setShowModal(false);
      await fetchManualPayments();
    } catch (err) {
      console.error("generatePaymentLink error:", err);
      alert("Error creating link");
    }
  };

  const tableCols = useMemo(() => {
    try {
      if (paymentMode === "manual") return filter === "pending" ? 7 : 6;
      if (filter === "pending") return 8;
      if (filter === "refund") return 9;
      return 9;
    } catch (e) {
      console.error("tableCols error:", e);
      return 9;
    }
  }, [paymentMode, filter]);

  return (
    <Container className="mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
      <h5 className="fw-bold">Money Dashboard</h5>

      {/* FILTER BAR */}
      <div className="mb-3 d-flex justify-content-end gap-2">
        <Form.Select
  className="w-auto"
  style={{ height: 38, fontSize: 12 }}
  value={filters.city}
  onChange={(e) => {
    try {
      setFilters({ ...filters, city: e.target.value });
    } catch (err) {
      console.error("set city filter error:", err);
    }
  }}
>
  <option value="All Cities">All Cities</option>

  {citiesLoading ? (
    <option disabled>Loading cities...</option>
  ) : cities.length === 0 ? (
    <option disabled>No cities found</option>
  ) : (
    cities.map((c) => (
      <option key={c} value={c}>
        {c}
      </option>
    ))
  )}
</Form.Select>

        <Form.Select
          className="w-auto"
          style={{ height: 38, fontSize: 12 }}
          value={filters.service}
          onChange={(e) => {
            try {
              setFilters({ ...filters, service: e.target.value });
            } catch (err) {
              console.error("set service filter error:", err);
            }
          }}
        >
          <option>All Services</option>
          <option>House Painting</option>
          <option>Deep Cleaning</option>
        </Form.Select>

        <input
          type="date"
          value={customDate.start}
          onChange={(e) => {
            try {
              setCustomDate({ ...customDate, start: e.target.value });
            } catch (err) {
              console.error("set start date error:", err);
            }
          }}
          style={{ fontSize: 12 }}
        />

        <input
          type="date"
          value={customDate.end}
          onChange={(e) => {
            try {
              setCustomDate({ ...customDate, end: e.target.value });
            } catch (err) {
              console.error("set end date error:", err);
            }
          }}
          style={{ fontSize: 12 }}
        />

        <Button
          onClick={handleSearch}
          style={{
            border: "1px solid black",
            background: "white",
            color: "black",
            fontSize: 12,
          }}
        >
          Search
        </Button>

        <Button
          onClick={() => setShowModal(true)}
          style={{
            border: "1px solid black",
            background: "white",
            color: "black",
            fontSize: 12,
          }}
        >
          Create Payment Link
        </Button>
      </div>

      {/* SUMMARY CARDS */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold">
              Total Sales: ₹{Number(totalSales || 0).toLocaleString()}
            </h6>
            <p style={{ fontSize: 12 }}>
              Online Payment: ₹{Number(onlineAmount || 0).toLocaleString()}
            </p>
            <p style={{ fontSize: 12 }}>
              Cash Payment: ₹{Number(cashAmount || 0).toLocaleString()}
            </p>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold">
              Amount Yet to Be Collected: ₹
              {Number(pendingAmount || 0).toLocaleString()}
            </h6>
            <p style={{ fontSize: 12 }}>Coins Sold: ₹{overallCoinSold}</p>
            <p style={{ fontSize: 12 }}>
              Income from Coins: ₹
              {Number(overallCoinsIncome || 0).toLocaleString()}
            </p>
          </Card>
        </Col>
      </Row>

      {/* TABS */}
      <div style={styles.paymentTabs}>
        <div
          onClick={() => {
            try {
              setPaymentMode("booking");
              setFilter("paid");
            } catch (err) {
              console.error("set paymentMode booking error:", err);
            }
          }}
          style={{
            ...styles.paymentTab,
            ...(paymentMode === "booking" ? styles.paymentTabActive : {}),
          }}
        >
          Booking Payments
        </div>

        <div
          onClick={() => {
            try {
              setPaymentMode("manual");
              setFilter("paid");
            } catch (err) {
              console.error("set paymentMode manual error:", err);
            }
          }}
          style={{
            ...styles.paymentTab,
            ...(paymentMode === "manual" ? styles.paymentTabActive : {}),
          }}
        >
          Manual Payments
        </div>
      </div>

      {/* PAID/PENDING TOGGLE */}
      <div className="mb-3">
        <button
          className={`btn ${
            filter === "paid" ? "btn-dark text-white" : "btn-outline-dark"
          }`}
          onClick={() => setFilter("paid")}
          style={{ fontSize: 12, marginRight: 8 }}
        >
          Paid List
        </button>

        <button
          className={`btn ${
            filter === "pending" ? "btn-dark text-white" : "btn-outline-dark"
          }`}
          onClick={() => setFilter("pending")}
          style={{ fontSize: 12, marginRight: 8 }}
        >
          Pending List
        </button>

        {paymentMode === "booking" && (
          <button
            className={`btn ${
              filter === "refund" ? "btn-dark text-white" : "btn-outline-dark"
            }`}
            onClick={() => setFilter("refund")}
            style={{ fontSize: 12 }}
          >
            Refund List
          </button>
        )}
      </div>

      {/* TABLE */}
      <Table striped bordered hover>
        <thead>
          {paymentMode === "booking" ? (
            filter === "pending" ? (
              <tr style={{ fontSize: 12 }}>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Order Id</th>
                <th>Vendor</th>
                <th>Payment ID</th>
                <th>Overall Due</th>
                <th style={{ width: "30%" }}>Service</th>
                <th>City</th>
              </tr>
            ) : filter === "refund" ? (
              <tr style={{ fontSize: 12 }}>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Order Id</th>
                <th>Vendor</th>
                <th>Payment ID</th>
                <th>Status</th>
                <th>Paid / Refund</th>
                <th style={{ width: "25%" }}>Service</th>
                <th>City</th>
              </tr>
            ) : (
              <tr style={{ fontSize: 12 }}>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Order Id</th>
                <th>Vendor</th>
                <th>Payment ID</th>
                <th>Stage</th>
                <th>Paid</th>
                <th style={{ width: "25%" }}>Service</th>
                <th>City</th>
              </tr>
            )
          ) : (
            <tr style={{ fontSize: 12 }}>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Service</th>
              <th>City</th>
              {filter === "pending" && <th>Action</th>}
            </tr>
          )}
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={tableCols} className="text-center p-4">
                Loading...
              </td>
            </tr>
          ) : paymentMode === "booking" ? (
            <>
              {filter === "paid" ? (
                bookingPaidRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableCols} className="text-center p-4">
                      No Records Found
                    </td>
                  </tr>
                ) : (
                  bookingPaidRows.map((r, i) => (
                    <tr key={i} style={{ fontSize: 12 }}>
                      <td>{r.date}</td>
                      <td>{r.customer}</td>
                      <td>{r.orderId}</td>
                      <td>{r.vendor}</td>
                      <td>{r.paymentId}</td>
                      <td>{r.stage}</td>
                      <td>₹{Number(r.paid || 0).toLocaleString()}</td>
                      <td>{r.service}</td>
                      <td>{r.city}</td>
                    </tr>
                  ))
                )
              ) : filter === "pending" ? (
                bookingPendingRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableCols} className="text-center p-4">
                      No Records Found
                    </td>
                  </tr>
                ) : (
                  bookingPendingRows.map((r, i) => (
                    <tr key={i} style={{ fontSize: 12 }}>
                      <td>{r.date}</td>
                      <td>{r.customer}</td>
                      <td>{r.orderId}</td>
                      <td>{r.vendor}</td>
                      <td>{r.paymentId}</td>
                      <td>₹{Number(r.amountDue || 0).toLocaleString()}</td>
                      <td>{r.service}</td>
                      <td>{r.city}</td>
                    </tr>
                  ))
                )
              ) : filter === "refund" ? (
                bookingRefundRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableCols} className="text-center p-4">
                      No Refund Records Found
                    </td>
                  </tr>
                ) : (
                  bookingRefundRows.map((r, i) => (
                    <tr key={i} style={{ fontSize: 12 }}>
                      <td>{r.date}</td>
                      <td>{r.customer}</td>
                      <td>{r.orderId}</td>
                      <td>{r.vendor}</td>
                      <td>{r.paymentId}</td>
                      <td>Refund</td>
                      <td>
                        <div>
                          Paid: ₹{Number(r.amountPaid || 0).toLocaleString()}
                        </div>
                        <div>
                          Refund: ₹
                          {Number(r.amountRefund || 0).toLocaleString()}
                        </div>
                      </td>
                      <td>{r.service}</td>
                      <td>{r.city}</td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan={tableCols} className="text-center p-4">
                    No Records Found
                  </td>
                </tr>
              )}
            </>
          ) : (
            <>
              {manualPayments.length === 0 ? (
                <tr>
                  <td colSpan={tableCols} className="text-center p-4">
                    No Records Found
                  </td>
                </tr>
              ) : (
                manualPayments
                  .filter((m) =>
                    filter === "paid"
                      ? m.payment?.status === "Paid"
                      : m.payment?.status === "Pending",
                  )
                  .map((m, i) => (
                    <tr key={i} style={{ fontSize: 12 }}>
                      <td>{fmt(m.createdAt)}</td>
                      <td>
                        {m.name} ({m.phone})
                      </td>
                      <td>
                        <a
                          href={m.payment?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Link
                        </a>
                      </td>
                      <td>₹{Number(m.amount || 0).toLocaleString()}</td>
                      <td>{m.service}</td>
                      <td>{m.city}</td>

                      {filter === "pending" && (
                        <td>
                          <Button
                            size="sm"
                            variant="success"
                            disabled={payingId === m._id}
                            onClick={() => markManualPaid(m)}
                          >
                            {payingId === m._id ? "Paying..." : "Pay Now"}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))
              )}
            </>
          )}
        </tbody>
      </Table>

      {/* ✅ Export ONLY current table */}
      <CSVLink
        data={currentCsvData}
        filename={csvFileName}
        className="btn btn-success mt-3"
        style={{ fontSize: 12 }}
      >
        Export CSV
      </CSVLink>

      {/* CREATE PAYMENT LINK MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Payment Link</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Check
                inline
                label="Customer"
                name="type"
                value="customer"
                type="radio"
                checked={formData.type === "customer"}
                onChange={handleInputChange}
              />
              <Form.Check
                inline
                label="Vendor"
                name="type"
                value="vendor"
                type="radio"
                checked={formData.type === "vendor"}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control name="name" required onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Phone *</Form.Label>
              <Form.Control
                name="phone"
                value={formData.phone}
                maxLength={10}
                inputMode="numeric"
                required
                style={{ borderColor: errors.phone ? "red" : "" }}
                onChange={handleInputChange}
              />
              {errors.phone && (
                <small style={{ color: "red" }}>{errors.phone}</small>
              )}
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Amount *</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                required
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Service *</Form.Label>
              <Form.Select name="service" required onChange={handleInputChange}>
                <option value="">Select Service</option>
                <option>House Painting</option>
                <option>Deep Cleaning</option>
                <option>Interior</option>
                <option>Packers & Movers</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>City *</Form.Label>
            <Form.Select name="city" required onChange={handleInputChange}>
  <option value="">Select City</option>

  {citiesLoading ? (
    <option disabled>Loading cities...</option>
  ) : cities.length === 0 ? (
    <option disabled>No cities found</option>
  ) : (
    cities.map((c) => (
      <option key={c} value={c}>
        {c}
      </option>
    ))
  )}
</Form.Select>

            </Form.Group>

            {formData.type === "vendor" && (
              <Form.Group className="mt-3">
                <Form.Label>Context *</Form.Label>
                <Form.Check
                  label="Others"
                  type="radio"
                  name="context"
                  value="others"
                  onChange={handleInputChange}
                />
                <Form.Check
                  label="Coins"
                  type="radio"
                  name="context"
                  value="coins"
                  onChange={handleInputChange}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            style={{
              borderColor: "black",
              color: "black",
              background: "white",
            }}
            onClick={generatePaymentLink}
          >
            Generate Payment Link
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

const styles = {
  paymentTabs: { display: "flex", gap: 10, marginBottom: 14 },
  paymentTab: {
    padding: "10px 14px",
    border: "1px solid #ddd",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 12,
    background: "#fff",
  },
  paymentTabActive: { background: "#111", color: "#fff", borderColor: "#111" },
};

export default MoneyDashboard;

//working
// import React, { useState, useEffect, useMemo } from "react";
// import {
//   Modal,
//   Button,
//   Table,
//   Form,
//   Container,
//   Row,
//   Col,
//   Card,
// } from "react-bootstrap";
// import { FaArrowUp } from "react-icons/fa";
// import { CSVLink } from "react-csv";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";

// const MoneyDashboard = () => {
//   const [showModal, setShowModal] = useState(false);
//   const [payments, setPayments] = useState([]);
//   const [manualPayments, setManualPayments] = useState([]);
//   const [filter, setFilter] = useState("paid");
//   const [paymentMode, setPaymentMode] = useState("booking");
//   const [hoverTab, setHoverTab] = useState("");
//   const [loading, setLoading] = useState(true);

//   const [errors, setErrors] = useState({ phone: "" });

//   const [filters, setFilters] = useState({
//     service: "All Services",
//     city: "All Cities",
//   });

//   const [customDate, setCustomDate] = useState({ start: "", end: "" });

//   const [formData, setFormData] = useState({
//     type: "customer",
//     name: "",
//     phone: "",
//     amount: "",
//     service: "",
//     city: "",
//     context: "others",
//   });

//   const [totalSales, setTotalSales] = useState(0);
//   const [pendingAmount, setPendingAmount] = useState(0);
//   const [cashAmount, setCashAmount] = useState(0);
//   const [onlineAmount, setOnlineAmount] = useState(0);

//   /* ======================================================
//         API CALLS
//   ====================================================== */

//   const fetchManualPayments = async () => {
//     try {
//       const res = await axios.get(`${BASE_URL}/manual-payment/`);
//       setManualPayments(res.data.data || []);
//     } catch (err) {
//       console.error("Manual Payment Fetch Error:", err);
//       setManualPayments([]);
//     }
//   };

//   const fetchPayments = async () => {
//     try {
//       const res = await axios.get(`${BASE_URL}/bookings/get-all-leads`, {
//         params: {
//           service: filters.service === "All Services" ? "" : filters.service,
//           city: filters.city === "All Cities" ? "" : filters.city,
//           startDate: customDate.start || "",
//           endDate: customDate.end || "",
//         },
//       });

//       setPayments(res.data.allLeads || []);
//     } catch (err) {
//       console.error("Booking Payment Fetch Error:", err);
//       setPayments([]);
//     }
//   };

//   /* ======================================================
//         LOAD BOTH (once)
//   ====================================================== */
//   useEffect(() => {
//     const loadAll = async () => {
//       try {
//         setLoading(true);
//         await Promise.all([fetchManualPayments(), fetchPayments()]);
//       } catch (e) {
//         console.error("Initial load error", e);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadAll();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   /* ======================================================
//         Recalculate totals whenever lists change
//   ====================================================== */
//   useEffect(() => {
//     calculateTotals(payments, manualPayments);
//   }, [payments, manualPayments]);

//   /* ======================================================
//         TOTALS CALCULATION
//   ====================================================== */
//   const calculateManualPaid = (list) => {
//     return list
//       .filter((m) => m.payment?.status === "Paid")
//       .reduce((sum, m) => sum + Number(m.amount || 0), 0);
//   };

//   const calculateManualPending = (list) => {
//     return list
//       .filter((m) => m.payment?.status === "Pending")
//       .reduce((sum, m) => sum + Number(m.amount || 0), 0);
//   };

//   const calculateTotals = (bookingList, manualList) => {
//     let bookingPaid = 0;
//     let bookingPending = 0;
//     let cashCalc = 0;
//     let onlineCalc = 0;

//     bookingList.forEach((item) => {
//       const b = item.bookingDetails || {};
//       const status = String(b.status || "").toLowerCase();

//       const paidAmount = Number(b.paidAmount || 0);
//       const refundAmount = Number(b.refundAmount || 0);
//       const finalTotal = Number(b.finalTotal || 0);
//       const paymentMethod = b.paymentMethod || "";

//       const netPaid = Math.max(paidAmount - refundAmount, 0);

//       const isCancelled = status.includes("cancelled");

//       /* ---------- CANCELLED BOOKINGS ---------- */
//       if (isCancelled) {
//         bookingPaid += netPaid;

//         if (paymentMethod === "Cash") cashCalc += netPaid;
//         if (paymentMethod === "UPI") onlineCalc += netPaid;

//         return;
//       }

//       /* ---------- ACTIVE BOOKINGS ---------- */
//       bookingPaid += netPaid;
//       bookingPending += Math.max(finalTotal - paidAmount, 0);

//       if (paymentMethod === "Cash") cashCalc += netPaid;
//       if (paymentMethod === "UPI") onlineCalc += netPaid;
//     });

//     /* ---------- MANUAL PAYMENTS ---------- */
//     const manualPaid = calculateManualPaid(manualList);
//     const manualPending = calculateManualPending(manualList);

//     setTotalSales(bookingPaid + manualPaid);
//     setPendingAmount(bookingPending + manualPending);
//     setCashAmount(cashCalc);
//     setOnlineAmount(onlineCalc);
//   };

//   /* ======================================================
//         SEARCH
//   ====================================================== */
//   const handleSearch = async () => {
//     await fetchPayments();
//   };

//   /* ======================================================
//         BUILD BOOKING PAID & PENDING ROWS
//         - Paid: installment-wise rows (first/second/final) where installment.status === 'paid'
//         - Pending: one row per booking where amountYetToPay > 0 (show total pending)
//   ====================================================== */

//   const bookingPaidRows = useMemo(() => {
//     try {
//       const rows = [];

//       payments.forEach((p) => {
//         const b = p.bookingDetails || {};
//         const customer = p.customer ? (
//           <>
//             {p.customer.name}
//             <br />(<span style={{ fontSize: "10px" }}>{p.customer.phone}</span>)
//           </>
//         ) : (
//           "-"
//         );

//         const vendor = p.assignedProfessional?.name || "-";
//         const orderId = b.booking_id || p._id || "-";
//         const service = (p.service || [])
//           .map((s) => s.serviceName || s.category)
//           .join(", ");
//         const city = p.address?.city || "-";

//         // Prepare a set of installment payment amounts to avoid duplicates
//         const installmentAmounts = new Set();

//         const pushInstallment = (inst) => {
//           if (!inst) return;
//           if (String(inst.status).toLowerCase() === "paid") {
//             const amt = Number(inst.amount || 0);
//             installmentAmounts.add(amt);

//             const paidAt =
//               inst.paidAt || inst.at || b.bookingDate || p.createdDate;

//             rows.push({
//               date: paidAt ? new Date(paidAt).toLocaleString("en-GB") : "-",
//               customer,
//               orderId,
//               vendor,
//               paymentId: "N/A",
//               amount: amt,
//               service,
//               city,
//             });
//           }
//         };

//         pushInstallment(b.firstPayment);
//         pushInstallment(b.secondPayment);
//         pushInstallment(b.finalPayment);

//         // Now add payments[] history ONLY if amount not already included
//         if (Array.isArray(p.payments)) {
//           p.payments.forEach((hist) => {
//             const amt = Number(hist.amount || 0);
//             if (amt > 0 && !installmentAmounts.has(amt)) {
//               const date = hist.at || hist.paidAt || p.createdDate;
//               rows.push({
//                 date: date ? new Date(date).toLocaleString("en-GB") : "-",
//                 customer,
//                 orderId,
//                 vendor,
//                 paymentId: "N/A",
//                 amount: amt,
//                 service,
//                 city,
//               });
//             }
//           });
//         }
//       });

//       // Sort rows by date descending
//       rows.sort((a, b) => new Date(b.date) - new Date(a.date));

//       return rows;
//     } catch (err) {
//       console.error("bookingPaidRows error:", err);
//       return [];
//     }
//   }, [payments]);

//   const bookingPendingRows = useMemo(() => {
//     try {
//       const rows = payments
//         .filter((p) => Number(p.bookingDetails?.amountYetToPay || 0) > 0)
//         .map((p) => {
//           const b = p.bookingDetails || {};
//           const customer = p.customer ? (
//             <>
//               {p.customer.name}
//               <br />(
//               <span style={{ fontSize: "10px" }}>{p.customer.phone}</span>)
//             </>
//           ) : (
//             "-"
//           );
//           const vendor = p.assignedProfessional?.name || "-";
//           const orderId = b.booking_id || p._id || "-";
//           const service = (p.service || [])
//             .map((s) => s.serviceName || s.category)
//             .join(", ");
//           const city = p.address?.city || "-";
//           const date = p.selectedSlot
//             ? `${p.selectedSlot.slotDate} ${p.selectedSlot.slotTime}`
//             : b.bookingDate
//             ? new Date(b.bookingDate).toLocaleString("en-GB")
//             : "-";

//           return {
//             date,
//             customer,
//             orderId,
//             vendor,
//             paymentId: "N/A",
//             amountDue: Number(b.amountYetToPay || 0),
//             service,
//             city,
//           };
//         });

//       // sort by date descending
//       rows.sort((a, b) => {
//         const da = new Date(a.date).getTime() || 0;
//         const db = new Date(b.date).getTime() || 0;
//         return db - da;
//       });

//       return rows;
//     } catch (err) {
//       console.error("bookingPendingRows error:", err);
//       return [];
//     }
//   }, [payments]);

//   /* ======================================================
//         ✅ REFUND ROWS (Cancelled + refundAmount > 0 only)
//         - show paidAmount and refundAmount
//   ====================================================== */
//   const bookingRefundRows = useMemo(() => {
//     try {
//       const rows = [];

//       const isCancelled = (status) => {
//         try {
//           const s = String(status || "").toLowerCase();
//           return (
//             s === "cancelled" ||
//             s === "admin cancelled" ||
//             s === "customer cancelled"
//           );
//         } catch (e) {
//           console.error("isCancelled error:", e);
//           return false;
//         }
//       };

//       payments.forEach((p) => {
//         try {
//           const b = p.bookingDetails || {};
//           const refundAmount = Number(b.refundAmount || 0);
//           const paidAmount = Number(b.paidAmount || 0);

//           if (!isCancelled(b.status)) return;
//           if (!(refundAmount > 0)) return;

//           const customer = p.customer ? (
//             <>
//               {p.customer.name}
//               <br />(
//               <span style={{ fontSize: "10px" }}>{p.customer.phone}</span>)
//             </>
//           ) : (
//             "-"
//           );

//           const vendor = p.assignedProfessional?.name || "-";
//           const orderId = b.booking_id || p._id || "-";
//           const service = (p.service || [])
//             .map((s) => s.serviceName || s.category)
//             .join(", ");
//           const city = p.address?.city || "-";

//           const dt =
//             b.cancelApprovedAt ||
//             (Array.isArray(p.payments) && p.payments[0]?.at) ||
//             p.createdDate ||
//             b.bookingDate ||
//             null;

//           rows.push({
//             date: dt ? new Date(dt).toLocaleString("en-GB") : "-",
//             customer,
//             orderId,
//             vendor,
//             paymentId: b.paymentLink?.providerRef || "N/A",
//             amountPaid: paidAmount,
//             amountRefund: refundAmount,
//             service,
//             city,
//           });
//         } catch (e) {
//           console.error("bookingRefundRows item error:", e);
//         }
//       });

//       rows.sort((a, b) => new Date(b.date) - new Date(a.date));
//       return rows;
//     } catch (err) {
//       console.error("bookingRefundRows error:", err);
//       return [];
//     }
//   }, [payments]);

//   /* ======================================================
//         CSV EXPORT (bookings only) - use bookingPaidRows
//   ====================================================== */
//   const csvData = bookingPaidRows.map((r) => ({
//     "Date & Time": r.date,
//     Customer: r.customer,
//     "Order Id": r.orderId,
//     Vendor: r.vendor,
//     "Payment ID": r.paymentId,
//     Amount: r.amount,
//     Service: r.service,
//     City: r.city,
//   }));

//   /* ======================================================
//         FORM VALIDATION
//   ====================================================== */
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "phone") {
//       if (!/^\d*$/.test(value)) return;
//       if (value.length > 10) return;

//       setFormData((prev) => ({ ...prev, phone: value }));
//       setErrors((prev) => ({
//         ...prev,
//         phone: value.length === 10 ? "" : "Phone must be 10 digits",
//       }));

//       return;
//     }

//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const generatePaymentLink = async () => {
//     try {
//       const res = await axios.post(`${BASE_URL}/manual-payment/`, formData);

//       alert("Payment Link: " + res.data.data.payment.url);
//       setShowModal(false);
//       // refetch manual payments so new link appears
//       await fetchManualPayments();
//     } catch (err) {
//       console.error(err);
//       alert("Error creating link");
//     }
//   };

//   /* ======================================================
//         DATE/TIME FORMATTER
//   ====================================================== */
//   const formatSlotDateTime = (payment) => {
//     const slot = payment.selectedSlot;
//     if (slot) return `${slot.slotDate} ${slot.slotTime}`;

//     const bDate = payment.bookingDetails?.bookingDate;
//     return bDate ? new Date(bDate).toLocaleString("en-GB") : "-";
//   };

//   const installmentsSum = (payment) => {
//     const b = payment.bookingDetails || {};
//     return (
//       Number(b.firstPayment?.amount || 0) +
//       Number(b.secondPayment?.amount || 0) +
//       Number(b.finalPayment?.amount || 0)
//     );
//   };

//   /* ======================================================
//         RENDER UI
//   ====================================================== */
//   return (
//     <Container className="mt-4" style={{ fontFamily: "Poppins, sans-serif" }}>
//       <h5 className="fw-bold">Money Dashboard</h5>

//       {/* FILTER BAR */}
//       <div className="mb-3 d-flex justify-content-end gap-2">
//         <Form.Select
//           className="w-auto"
//           style={{ height: 38, fontSize: 12 }}
//           value={filters.city}
//           onChange={(e) => setFilters({ ...filters, city: e.target.value })}
//         >
//           <option>All Cities</option>
//           <option>Bengaluru</option>
//           <option>Pune</option>
//         </Form.Select>

//         <Form.Select
//           className="w-auto"
//           style={{ height: 38, fontSize: 12 }}
//           value={filters.service}
//           onChange={(e) => setFilters({ ...filters, service: e.target.value })}
//         >
//           <option>All Services</option>
//           <option>House Painting</option>
//           <option>Deep Cleaning</option>
//         </Form.Select>

//         <input
//           type="date"
//           value={customDate.start}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, start: e.target.value })
//           }
//           style={{ fontSize: 12 }}
//         />

//         <input
//           type="date"
//           value={customDate.end}
//           onChange={(e) =>
//             setCustomDate({ ...customDate, end: e.target.value })
//           }
//           style={{ fontSize: 12 }}
//         />

//         <Button
//           onClick={handleSearch}
//           style={{
//             border: "1px solid black",
//             background: "white",
//             color: "black",
//             fontSize: 12,
//           }}
//         >
//           Search
//         </Button>

//         <Button
//           onClick={() => setShowModal(true)}
//           style={{
//             border: "1px solid black",
//             background: "white",
//             color: "black",
//             fontSize: 12,
//           }}
//         >
//           Create Payment Link
//         </Button>
//       </div>

//       {/* SUMMARY CARDS */}
//       <Row className="mb-4">
//         <Col md={6}>
//           <Card className="p-3 shadow-sm">
//             <h6 className="fw-bold">
//               Total Sales: ₹{totalSales.toLocaleString()}
//             </h6>
//             <p style={{ fontSize: 12 }}>
//               Online Payment: ₹{onlineAmount.toLocaleString()}
//             </p>
//             <p style={{ fontSize: 12 }}>
//               Cash Payment: ₹{cashAmount.toLocaleString()}
//             </p>
//           </Card>
//         </Col>

//         <Col md={6}>
//           <Card className="p-3 shadow-sm">
//             <h6 className="fw-bold">
//               Amount Yet to Be Collected: ₹{pendingAmount.toLocaleString()}
//             </h6>
//             <p style={{ fontSize: 12 }}>Coins Sold: ₹0</p>
//             <p style={{ fontSize: 12 }}>Income from Coins: ₹0</p>
//           </Card>
//         </Col>
//       </Row>

//       {/* TABS */}
//       <div style={styles.paymentTabs}>
//         <div
//           onClick={() => setPaymentMode("booking")}
//           style={{
//             ...styles.paymentTab,
//             ...(paymentMode === "booking" ? styles.paymentTabActive : {}),
//           }}
//         >
//           Booking Payments
//         </div>

//         <div
//           onClick={() => setPaymentMode("manual")}
//           style={{
//             ...styles.paymentTab,
//             ...(paymentMode === "manual" ? styles.paymentTabActive : {}),
//           }}
//         >
//           Manual Payments
//         </div>
//       </div>

//       {/* PAID/PENDING TOGGLE */}
//       <div className="mb-3">
//         <button
//           className={`btn ${
//             filter === "paid" ? "btn-dark text-white" : "btn-outline-dark"
//           }`}
//           onClick={() => setFilter("paid")}
//           style={{ fontSize: 12, marginRight: 8 }}
//         >
//           Paid List
//         </button>

//         <button
//           className={`btn ${
//             filter === "pending" ? "btn-dark text-white" : "btn-outline-dark"
//           }`}
//           onClick={() => setFilter("pending")}
//           style={{ fontSize: 12, marginRight: 8 }}
//         >
//           Pending List
//         </button>
//         {paymentMode === "booking" && (
//           <button
//             className={`btn ${
//               filter === "refund" ? "btn-dark text-white" : "btn-outline-dark"
//             }`}
//             onClick={() => setFilter("refund")}
//             style={{ fontSize: 12 }}
//           >
//             Refund List
//           </button>
//         )}
//       </div>

//       {/* TABLE */}
//       <Table striped bordered hover>
//         <thead>
//           {paymentMode === "booking" ? (
//             <tr style={{ fontSize: 12 }}>
//               <th>Date & Time</th>
//               <th>Customer</th>
//               <th>Order Id</th>
//               <th>Vendor</th>
//               <th>Payment ID</th>
//               <th>Amount</th>
//               <th style={{ width: "30%" }}>Service</th>
//               <th>City</th>
//             </tr>
//           ) : (
//             <tr style={{ fontSize: 12 }}>
//               <th>Date & Time</th>
//               <th>Customer</th>
//               <th>Payment ID</th>
//               <th>Amount</th>
//               <th>Service</th>
//               <th>City</th>
//             </tr>
//           )}
//         </thead>
//         <tbody>
//           {loading ? (
//             <tr>
//               <td colSpan={8} style={{ padding: "60px 0" }}>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     flexDirection: "column",
//                   }}
//                 >
//                   <div className="loader-dots">
//                     <span></span>
//                     <span></span>
//                     <span></span>
//                   </div>
//                   <p className="mt-3 text-muted">Loading payment details...</p>

//                   <style>{`
//             .loader-dots span {
//               width: 10px;
//               height: 10px;
//               margin: 0 4px;
//               background: #DC3545;
//               border-radius: 50%;
//               display: inline-block;
//               animation: pulse 1s infinite alternate;
//             }

//             .loader-dots span:nth-child(2) {
//               animation-delay: 0.2s;
//             }

//             .loader-dots span:nth-child(3) {
//               animation-delay: 0.4s;
//             }

//             @keyframes pulse {
//               0% { transform: scale(1); opacity: 0.5; }
//               100% { transform: scale(1.6); opacity: 1; }
//             }
//           `}</style>
//                 </div>
//               </td>
//             </tr>
//           ) : paymentMode === "booking" ? (
//             <>
//               {filter === "paid" ? (
//                 bookingPaidRows.length === 0 ? (
//                   <tr>
//                     <td colSpan={8} className="text-center p-4">
//                       No Records Found
//                     </td>
//                   </tr>
//                 ) : (
//                   bookingPaidRows.map((r, i) => (
//                     <tr key={i} style={{ fontSize: 12 }}>
//                       <td>{r.date}</td>
//                       <td>{r.customer}</td>
//                       <td>{r.orderId}</td>
//                       <td>{r.vendor}</td>
//                       <td>{r.paymentId}</td>
//                       <td>₹{r.amount}</td>
//                       <td>{r.service}</td>
//                       <td>{r.city}</td>
//                     </tr>
//                   ))
//                 )
//               ) : filter === "pending" ? (
//                 bookingPendingRows.length === 0 ? (
//                   <tr>
//                     <td colSpan={8} className="text-center p-4">
//                       No Records Found
//                     </td>
//                   </tr>
//                 ) : (
//                   bookingPendingRows.map((r, i) => (
//                     <tr key={i} style={{ fontSize: 12 }}>
//                       <td>{r.date}</td>
//                       <td>{r.customer}</td>
//                       <td>{r.orderId}</td>
//                       <td>{r.vendor}</td>
//                       <td>{r.paymentId}</td>
//                       <td>₹{r.amountDue}</td>
//                       <td>{r.service}</td>
//                       <td>{r.city}</td>
//                     </tr>
//                   ))
//                 )
//               ) : filter === "refund" ? (
//                 bookingRefundRows.length === 0 ? (
//                   <tr>
//                     <td colSpan={8} className="text-center p-4">
//                       No Refund Records Found
//                     </td>
//                   </tr>
//                 ) : (
//                   bookingRefundRows.map((r, i) => (
//                     <tr key={i} style={{ fontSize: 12 }}>
//                       <td>{r.date}</td>
//                       <td>{r.customer}</td>
//                       <td>{r.orderId}</td>
//                       <td>{r.vendor}</td>
//                       <td>{r.paymentId}</td>
//                       <td>
//                         <div>Paid: ₹{Number(r.amountPaid || 0)}</div>
//                         <div>Refund: ₹{Number(r.amountRefund || 0)}</div>
//                       </td>
//                       <td>{r.service}</td>
//                       <td>{r.city}</td>
//                     </tr>
//                   ))
//                 )
//               ) : (
//                 <tr>
//                   <td colSpan={8} className="text-center p-4">
//                     No Records Found
//                   </td>
//                 </tr>
//               )}
//             </>
//           ) : (
//             <>
//               {manualPayments.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="text-center p-4">
//                     No Records Found
//                   </td>
//                 </tr>
//               ) : (
//                 manualPayments
//                   .filter((m) =>
//                     filter === "paid"
//                       ? m.payment?.status === "Paid"
//                       : m.payment?.status === "Pending"
//                   )
//                   .map((m, i) => (
//                     <tr key={i} style={{ fontSize: 12 }}>
//                       <td>{new Date(m.createdAt).toLocaleString("en-GB")}</td>
//                       <td>
//                         {m.name} ({m.phone})
//                       </td>
//                       <td>
//                         <a
//                           href={m.payment?.url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                         >
//                           Open Link
//                         </a>
//                       </td>
//                       <td>₹{m.amount}</td>
//                       <td>{m.service}</td>
//                       <td>{m.city}</td>
//                     </tr>
//                   ))
//               )}
//             </>
//           )}
//         </tbody>
//       </Table>

//       <CSVLink
//         data={csvData}
//         filename={`${filter}-payments.csv`}
//         className="btn btn-success mt-3"
//         style={{ fontSize: 12 }}
//       >
//         Export CSV
//       </CSVLink>

//       {/* CREATE PAYMENT LINK MODAL */}
//       <Modal show={showModal} onHide={() => setShowModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Create Payment Link</Modal.Title>
//         </Modal.Header>

//         <Modal.Body>
//           <Form>
//             <Form.Group>
//               <Form.Check
//                 inline
//                 label="Customer"
//                 name="type"
//                 value="customer"
//                 type="radio"
//                 checked={formData.type === "customer"}
//                 onChange={handleInputChange}
//               />

//               <Form.Check
//                 inline
//                 label="Vendor"
//                 name="type"
//                 value="vendor"
//                 type="radio"
//                 checked={formData.type === "vendor"}
//                 onChange={handleInputChange}
//               />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Name *</Form.Label>
//               <Form.Control name="name" required onChange={handleInputChange} />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Phone *</Form.Label>
//               <Form.Control
//                 name="phone"
//                 value={formData.phone}
//                 maxLength={10}
//                 inputMode="numeric"
//                 required
//                 style={{ borderColor: errors.phone ? "red" : "" }}
//                 onChange={handleInputChange}
//               />
//               {errors.phone && (
//                 <small style={{ color: "red" }}>{errors.phone}</small>
//               )}
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Amount *</Form.Label>
//               <Form.Control
//                 type="number"
//                 name="amount"
//                 required
//                 onChange={handleInputChange}
//               />
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>Service *</Form.Label>
//               <Form.Select name="service" required onChange={handleInputChange}>
//                 <option value="">Select Service</option>
//                 <option>House Painting</option>
//                 <option>Deep Cleaning</option>
//                 <option>Interior</option>
//                 <option>Packers & Movers</option>
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mt-3">
//               <Form.Label>City *</Form.Label>
//               <Form.Select name="city" required onChange={handleInputChange}>
//                 <option value="">Select City</option>
//                 <option>Bengaluru</option>
//                 <option>Pune</option>
//               </Form.Select>
//             </Form.Group>

//             {formData.type === "vendor" && (
//               <Form.Group className="mt-3">
//                 <Form.Label>Context *</Form.Label>
//                 <Form.Check
//                   label="Others"
//                   type="radio"
//                   name="context"
//                   value="others"
//                   onChange={handleInputChange}
//                 />
//                 <Form.Check
//                   label="Coins"
//                   type="radio"
//                   name="context"
//                   value="coins"
//                   onChange={handleInputChange}
//                 />
//               </Form.Group>
//             )}
//           </Form>
//         </Modal.Body>

//         <Modal.Footer>
//           <Button
//             style={{
//               borderColor: "black",
//               color: "black",
//               background: "white",
//             }}
//             onClick={generatePaymentLink}
//           >
//             Generate Payment Link
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// /* ======================================================
//       TAB STYLES
// ====================================================== */
// const styles = {
//   paymentTabs: {
//     display: "flex",
//     gap: 12,
//     borderBottom: "2px solid #eee",
//     marginBottom: 10,
//   },
//   paymentTab: {
//     padding: "8px 16px",
//     cursor: "pointer",
//     fontSize: 13,
//     fontWeight: 600,
//   },
//   paymentTabActive: {
//     background: "black",
//     color: "white",
//     borderBottom: "2px solid black",
//   },
// };

// export default MoneyDashboard;
