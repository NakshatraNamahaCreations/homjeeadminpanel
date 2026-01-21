// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import { Button } from "react-bootstrap";
// import { FaArrowLeft, FaCopy, FaChevronDown, FaChevronUp } from "react-icons/fa";

// const QuoteDetails = () => {
//   const { id } = useParams(); // quote id from route
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [quote, setQuote] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [errMsg, setErrMsg] = useState("");

//   const [openRooms, setOpenRooms] = useState({}); // roomName -> boolean

//   // helpers
//   const asNum = (v) => {
//     try {
//       const n = Number(v);
//       return Number.isFinite(n) ? n : 0;
//     } catch (e) {
//       return 0;
//     }
//   };

//   const money = (v) => {
//     try {
//       return asNum(v).toLocaleString("en-IN");
//     } catch (e) {
//       return "0";
//     }
//   };

//   const toUpperAmPm = (s) => {
//     try {
//       return String(s || "").replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
//     } catch (e) {
//       return s;
//     }
//   };

//   const fmtDT = (iso) => {
//     try {
//       if (!iso) return "N/A";
//       const d = new Date(iso);
//       if (isNaN(d.getTime())) return "N/A";
//       return toUpperAmPm(
//         d
//           .toLocaleString("en-GB", {
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//             hour: "2-digit",
//             minute: "2-digit",
//             hour12: true,
//           })
//           .replace(",", "")
//       );
//     } catch (e) {
//       return "N/A";
//     }
//   };

//   const copyText = async (txt) => {
//     try {
//       if (!txt) return;
//       await navigator.clipboard.writeText(String(txt));
//     } catch (e) {
//       console.error("copyText error:", e);
//       alert("Copy failed");
//     }
//   };

//   const statusPill = (status) => {
//     try {
//       const s = String(status || "").toLowerCase().trim();
//       if (s === "finalized") return { bg: "#e7f6ee", bd: "#20c997", tx: "#198754" };
//       if (s === "created") return { bg: "#e7f0ff", bd: "#0d6efd", tx: "#0d6efd" };
//       if (s === "locked") return { bg: "#fff3cd", bd: "#ffc107", tx: "#856404" };
//       return { bg: "#f1f3f5", bd: "#ced4da", tx: "#495057" };
//     } catch (e) {
//       return { bg: "#f1f3f5", bd: "#ced4da", tx: "#495057" };
//     }
//   };

//   // fetch quote
//   const fetchQuote = async () => {
//     try {
//       setLoading(true);
//       setErrMsg("");

//       const quoteId = id || location?.state?.quoteId;
//       if (!quoteId) {
//         setErrMsg("Missing quote id");
//         setLoading(false);
//         return;
//       }

//       const res = await fetch(`http://localhost:9000/api/quotations/get-quotes/${quoteId}`);
//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data?.message || "Failed to fetch quote");
//       }

//       const q = data?.data || null;
//       setQuote(q);

//       // default open first room
//       const firstRoom = q?.lines?.[0]?.roomName;
//       if (firstRoom) {
//         setOpenRooms({ [firstRoom]: true });
//       }
//     } catch (e) {
//       console.error("fetchQuote error:", e);
//       setErrMsg(e.message || "Failed to fetch quote");
//       setQuote(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     try {
//       fetchQuote();
//     } catch (e) {
//       console.error(e);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   const totals = quote?.totals || {};
//   const discount = quote?.discount || {};
//   const isLocked = !!quote?.locked;

//   const pill = useMemo(() => {
//     try {
//       if (isLocked) return statusPill("locked");
//       return statusPill(quote?.status);
//     } catch (e) {
//       return statusPill("created");
//     }
//   }, [quote?.status, isLocked]);

//   const toggleRoom = (roomName) => {
//     try {
//       setOpenRooms((p) => ({ ...p, [roomName]: !p?.[roomName] }));
//     } catch (e) {
//       console.error("toggleRoom error:", e);
//     }
//   };

//   // UI
//   if (loading) {
//     return (
//       <div style={{ padding: 16, fontFamily: "'Poppins', sans-serif" }}>
//         <div className="card border-0 shadow-sm">
//           <div className="card-body">
//             <div style={{ fontWeight: 800, fontSize: 14 }}>Loading quote...</div>
//             <div style={{ marginTop: 8, fontSize: 12, color: "#6c757d" }}>
//               Please wait
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (errMsg) {
//     return (
//       <div style={{ padding: 16, fontFamily: "'Poppins', sans-serif" }}>
//         <Button variant="light" size="sm" onClick={() => navigate(-1)}>
//           <FaArrowLeft /> Back
//         </Button>

//         <div className="card border-0 shadow-sm mt-2">
//           <div className="card-body">
//             <div style={{ fontWeight: 900, fontSize: 14, color: "#dc3545" }}>
//               {errMsg}
//             </div>
//             <Button
//               variant="danger"
//               size="sm"
//               className="mt-3"
//               onClick={() => {
//                 try {
//                   fetchQuote();
//                 } catch (e) {
//                   console.error(e);
//                 }
//               }}
//             >
//               Retry
//             </Button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!quote) return null;

//   return (
//     <div style={{ padding: 16, fontFamily: "'Poppins', sans-serif" }}>
//       {/* Top Bar */}
//       <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
//         <Button variant="light" size="sm" onClick={() => navigate(-1)}>
//           <FaArrowLeft /> Back
//         </Button>

//         <div style={{ fontSize: 14, fontWeight: 900 }}>Quotation Details</div>

//         <div style={{ marginLeft: "auto" }}>
//           <span
//             style={{
//               padding: "6px 12px",
//               borderRadius: 999,
//               background: pill.bg,
//               border: `1px solid ${pill.bd}`,
//               color: pill.tx,
//               fontSize: 12,
//               fontWeight: 900,
//             }}
//           >
//             {isLocked ? "LOCKED" : (quote?.status || "—").toUpperCase()}
//           </span>
//         </div>
//       </div>

//       {/* Header Card */}
//       <div className="card border-0 shadow-sm" style={{ borderRadius: 14, marginBottom: 12 }}>
//         <div className="card-body" style={{ padding: 14 }}>
//           <div
//             style={{
//               display: "flex",
//               flexWrap: "wrap",
//               gap: 12,
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//             }}
//           >
//             <div style={{ minWidth: 240 }}>
//               <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 800 }}>
//                 Quote No
//               </div>

//               <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <div style={{ fontSize: 14, fontWeight: 900, color: "#111" }}>
//                   {quote?.quoteNo || "—"}
//                 </div>
//                 {quote?.quoteNo ? (
//                   <FaCopy
//                     title="Copy Quote No"
//                     style={{ cursor: "pointer", color: "#dc3545" }}
//                     onClick={() => copyText(quote.quoteNo)}
//                   />
//                 ) : null}
//               </div>

//               <div style={{ marginTop: 8, fontSize: 12, color: "#6c757d" }}>
//                 Created: <strong style={{ color: "#111" }}>{fmtDT(quote?.createdAt)}</strong>
//               </div>

//             </div>

//             <div style={{ minWidth: 220, textAlign: "right" }}>

//               <div style={{ marginTop: 8, fontSize: 12, color: "#6c757d", fontWeight: 800 }}>
//                 Days
//               </div>
//               <div style={{ fontSize: 14, fontWeight: 900, color: "#111" }}>
//                 {asNum(quote?.days)} day{asNum(quote?.days) > 1 ? "s" : ""}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Totals Summary */}
//       <div className="card border-0 shadow-sm" style={{ borderRadius: 14, marginBottom: 12 }}>
//         <div className="card-body" style={{ padding: 14 }}>
//           <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
//             <div style={{ fontSize: 14, fontWeight: 900 }}>Summary</div>

//             <div style={{ textAlign: "right" }}>
//               <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 800 }}>Grand Total</div>
//               <div style={{ fontSize: 16, fontWeight: 900, color: "#dc3545" }}>
//                 ₹{money(totals?.grandTotal)}
//               </div>
//             </div>
//           </div>

//           <div
//             style={{
//               marginTop: 12,
//               display: "grid",
//               gridTemplateColumns: "repeat(4, 1fr)",
//               gap: 10,
//             }}
//           >
//             {[
//               { label: "Interior", value: totals?.interior },
//               { label: "Exterior", value: totals?.exterior },
//               { label: "Others", value: totals?.others },
//               { label: "Additional", value: totals?.additionalServices },
//             ].map((it, i) => (
//               <div
//                 key={i}
//                 style={{
//                   border: "1px solid #eef0f3",
//                   borderRadius: 12,
//                   padding: "10px 12px",
//                   background: "#fff",
//                 }}
//               >
//                 <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                   {it.label}
//                 </div>
//                 <div style={{ fontSize: 13, fontWeight: 900, color: "#111" }}>
//                   ₹{money(it.value)}
//                 </div>
//               </div>
//             ))}
//           </div>

//           <div style={{ marginTop: 12, borderTop: "1px dashed #cfd4da" }} />

//           <div
//             style={{
//               marginTop: 12,
//               display: "grid",
//               gridTemplateColumns: "repeat(4, 1fr)",
//               gap: 10,
//             }}
//           >
//             <div style={{ fontSize: 12 }}>
//               <div style={{ color: "#6c757d", fontWeight: 800 }}>Subtotal</div>
//               <div style={{ fontWeight: 900 }}>₹{money(totals?.subtotal)}</div>
//             </div>

//             <div style={{ fontSize: 12 }}>
//               <div style={{ color: "#6c757d", fontWeight: 800 }}>Discount</div>
//               <div style={{ fontWeight: 900 }}>
//                 {String(discount?.type || "").toUpperCase() === "PERCENT"
//                   ? `${asNum(discount?.value)}%`
//                   : `₹${money(discount?.value)}`}
//                 {" "}
//                 <span style={{ color: "#6c757d", fontWeight: 800 }}>
//                   (₹{money(discount?.amount)})
//                 </span>
//               </div>
//             </div>

//             <div style={{ fontSize: 12 }}>
//               <div style={{ color: "#6c757d", fontWeight: 800 }}>Discount Amount</div>
//               <div style={{ fontWeight: 900 }}>₹{money(totals?.discountAmount)}</div>
//             </div>

//             <div style={{ fontSize: 12, textAlign: "right" }}>
//               <div style={{ color: "#6c757d", fontWeight: 800 }}>Final Per Day</div>
//               <div style={{ fontWeight: 900 }}>₹{money(totals?.finalPerDay)}</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Room wise details */}
//       <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
//         <div className="card-body" style={{ padding: 14 }}>
//           <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10 }}>
//             Room Wise Breakdown
//           </div>

//           {Array.isArray(quote?.lines) && quote.lines.length > 0 ? (
//             <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//               {quote.lines.map((line, idx) => {
//                 const roomName = line?.roomName || `Room ${idx + 1}`;
//                 const isOpen = !!openRooms?.[roomName];

//                 const breakdown = Array.isArray(line?.breakdown) ? line.breakdown : [];
//                 const addServices = Array.isArray(line?.additionalServices) ? line.additionalServices : [];

//                 return (
//                   <div
//                     key={`${roomName}-${idx}`}
//                     style={{
//                       border: "1px solid #eef0f3",
//                       borderRadius: 14,
//                       overflow: "hidden",
//                       background: "#fff",
//                     }}
//                   >
//                     {/* Room header */}
//                     <div
//                       onClick={() => toggleRoom(roomName)}
//                       style={{
//                         cursor: "pointer",
//                         padding: "12px 14px",
//                         background: "#fff5f5",
//                         borderBottom: "1px solid #f1f3f5",
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         gap: 10,
//                       }}
//                     >
//                       <div>
//                         <div style={{ fontSize: 13, fontWeight: 900, color: "#111" }}>
//                           {roomName}{" "}
//                           <span style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                             ({line?.sectionType || "—"})
//                           </span>
//                         </div>

//                         <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 800 }}>
//                           Subtotal: ₹{money(line?.subtotal)}{" "}
//                           {line?.additionalTotal ? (
//                             <span style={{ marginLeft: 8 }}>
//                               | Additional: ₹{money(line?.additionalTotal)}
//                             </span>
//                           ) : null}
//                         </div>
//                       </div>

//                       <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                         <div style={{ textAlign: "right" }}>
//                           <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                             Room Total
//                           </div>
//                           <div style={{ fontSize: 13, fontWeight: 900, color: "#111" }}>
//                             ₹{money(asNum(line?.subtotal) + asNum(line?.additionalTotal))}
//                           </div>
//                         </div>

//                         {isOpen ? <FaChevronUp /> : <FaChevronDown />}
//                       </div>
//                     </div>

//                     {/* Room body */}
//                     {isOpen && (
//                       <div style={{ padding: "12px 14px" }}>
//                         {/* Selected Paints */}
//                         <div style={{ marginBottom: 10 }}>
//                           <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
//                             Selected Paints
//                           </div>

//                           <div
//                             style={{
//                               display: "grid",
//                               gridTemplateColumns: "repeat(2, 1fr)",
//                               gap: 10,
//                             }}
//                           >
//                             <div
//                               style={{
//                                 border: "1px solid #eef0f3",
//                                 borderRadius: 12,
//                                 padding: "10px 12px",
//                               }}
//                             >
//                               <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                                 Ceiling
//                               </div>
//                               <div style={{ fontSize: 12, fontWeight: 900 }}>
//                                 {line?.selectedPaints?.ceiling?.name || "—"}
//                               </div>
//                               <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                                 ₹{money(line?.selectedPaints?.ceiling?.price)} / sqft
//                               </div>
//                             </div>

//                             <div
//                               style={{
//                                 border: "1px solid #eef0f3",
//                                 borderRadius: 12,
//                                 padding: "10px 12px",
//                               }}
//                             >
//                               <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                                 Wall
//                               </div>
//                               <div style={{ fontSize: 12, fontWeight: 900 }}>
//                                 {line?.selectedPaints?.wall?.name || "—"}
//                               </div>
//                               <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                                 ₹{money(line?.selectedPaints?.wall?.price)} / sqft
//                               </div>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Breakdown table */}
//                         <div style={{ marginBottom: 12 }}>
//                           <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
//                             Base Breakdown
//                           </div>

//                           {breakdown.length === 0 ? (
//                             <div style={{ fontSize: 12, color: "#6c757d" }}>No base items.</div>
//                           ) : (
//                             <div style={{ border: "1px solid #eef0f3", borderRadius: 12, overflow: "hidden" }}>
//                               <div
//                                 style={{
//                                   display: "grid",
//                                   gridTemplateColumns: "1.3fr 1fr 0.8fr 1fr 1fr",
//                                   background: "#f8f9fa",
//                                   padding: "10px 12px",
//                                   fontSize: 11,
//                                   fontWeight: 900,
//                                   color: "#6c757d",
//                                   borderBottom: "1px solid #eef0f3",
//                                 }}
//                               >
//                                 <div>Type</div>
//                                 <div>Mode</div>
//                                 <div>Sqft</div>
//                                 <div>Unit Price</div>
//                                 <div style={{ textAlign: "right" }}>Price</div>
//                               </div>

//                               {breakdown.map((b, bi) => (
//                                 <div
//                                   key={bi}
//                                   style={{
//                                     display: "grid",
//                                     gridTemplateColumns: "1.3fr 1fr 0.8fr 1fr 1fr",
//                                     padding: "10px 12px",
//                                     fontSize: 12,
//                                     borderBottom: bi === breakdown.length - 1 ? "none" : "1px solid #f1f3f5",
//                                   }}
//                                 >
//                                   <div style={{ fontWeight: 900, color: "#111" }}>
//                                     {b?.type || "—"}
//                                     <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                                       {b?.paintName || ""}
//                                     </div>
//                                   </div>
//                                   <div style={{ color: "#6c757d", fontWeight: 800 }}>{b?.mode || "—"}</div>
//                                   <div style={{ fontWeight: 900 }}>{asNum(b?.sqft)}</div>
//                                   <div style={{ fontWeight: 900 }}>₹{money(b?.unitPrice)}</div>
//                                   <div style={{ textAlign: "right", fontWeight: 900 }}>₹{money(b?.price)}</div>
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>

//                         {/* Additional services */}
//                         <div>
//                           <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>
//                             Additional Services
//                           </div>

//                           {addServices.length === 0 ? (
//                             <div style={{ fontSize: 12, color: "#6c757d" }}>No additional services.</div>
//                           ) : (
//                             <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
//                               {addServices.map((a, ai) => (
//                                 <div
//                                   key={ai}
//                                   style={{
//                                     border: "1px solid #eef0f3",
//                                     borderRadius: 14,
//                                     padding: "12px 12px",
//                                     background: "#fff",
//                                   }}
//                                 >
//                                   <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
//                                     <div>
//                                       <div style={{ fontSize: 13, fontWeight: 900, color: "#111" }}>
//                                         {a?.serviceType || "Service"}{" "}
//                                         <span style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                                           ({a?.surfaceType || "—"})
//                                         </span>
//                                       </div>

//                                       <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 800 }}>
//                                         {a?.materialName || "—"}
//                                       </div>

//                                       <div style={{ marginTop: 6, fontSize: 12, color: "#6c757d", fontWeight: 800 }}>
//                                         Area: <strong style={{ color: "#111" }}>{asNum(a?.areaSqft)} sqft</strong>
//                                         {"  "} | Unit: <strong style={{ color: "#111" }}>₹{money(a?.unitPrice)}</strong>
//                                         {"  "} | With Paint:{" "}
//                                         <strong style={{ color: "#111" }}>
//                                           {a?.withPaint ? "YES" : "NO"}
//                                         </strong>
//                                       </div>

//                                       {(a?.customName || a?.customNote) && (
//                                         <div style={{ marginTop: 6, fontSize: 12 }}>
//                                           {a?.customName ? (
//                                             <div>
//                                               <span style={{ color: "#6c757d", fontWeight: 800 }}>Name:</span>{" "}
//                                               <strong>{a.customName}</strong>
//                                             </div>
//                                           ) : null}
//                                           {a?.customNote ? (
//                                             <div>
//                                               <span style={{ color: "#6c757d", fontWeight: 800 }}>Note:</span>{" "}
//                                               <strong>{a.customNote}</strong>
//                                             </div>
//                                           ) : null}
//                                         </div>
//                                       )}
//                                     </div>

//                                     <div style={{ textAlign: "right" }}>
//                                       <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
//                                         Total
//                                       </div>
//                                       <div style={{ fontSize: 14, fontWeight: 900, color: "#dc3545" }}>
//                                         ₹{money(a?.total)}
//                                       </div>
//                                     </div>
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>

//                         {/* Room footer totals */}
//                         <div style={{ marginTop: 12, borderTop: "1px dashed #cfd4da" }} />
//                         <div
//                           style={{
//                             marginTop: 12,
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             gap: 12,
//                           }}
//                         >
//                           <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 900 }}>
//                             Room Total
//                           </div>
//                           <div style={{ fontSize: 14, fontWeight: 900, color: "#111" }}>
//                             ₹{money(asNum(line?.subtotal) + asNum(line?.additionalTotal))}
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           ) : (
//             <div style={{ fontSize: 12, color: "#6c757d" }}>No room lines found.</div>
//           )}
//         </div>
//       </div>

//       {/* bottom spacer */}
//       <div style={{ height: 20 }} />
//     </div>
//   );
// };

// export default QuoteDetails;

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import {
  FaArrowLeft,
  FaCopy,
  FaChevronDown,
  FaChevronUp,
  FaRegCalendarAlt,
  FaRegClock,
  FaFileInvoice,
  FaLayerGroup,
} from "react-icons/fa";

/* =========================
   Helpers
========================= */
const asNum = (v) => {
  try {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const money = (v) => {
  try {
    return asNum(v).toLocaleString("en-IN");
  } catch {
    return "0";
  }
};

const toUpperAmPm = (s) => {
  try {
    return String(s || "").replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
  } catch {
    return s;
  }
};

const fmtDT = (iso) => {
  try {
    if (!iso) return "N/A";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "N/A";
    return toUpperAmPm(
      d
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", ""),
    );
  } catch {
    return "N/A";
  }
};

const copyText = async (txt) => {
  try {
    if (!txt) return;
    await navigator.clipboard.writeText(String(txt));
  } catch (e) {
    console.error("copyText error:", e);
    alert("Copy failed");
  }
};

const getPill = (status, locked) => {
  try {
    if (locked)
      return { label: "LOCKED", bg: "#FFF3CD", bd: "#FFE69C", tx: "#664D03" };

    const s = String(status || "")
      .toLowerCase()
      .trim();
    if (s === "finalized")
      return {
        label: "FINALIZED",
        bg: "#D1E7DD",
        bd: "#A3CFBB",
        tx: "#0F5132",
      };
    if (s === "created")
      return { label: "CREATED", bg: "#CFE2FF", bd: "#9EC5FE", tx: "#084298" };

    return {
      label: (status || "—").toUpperCase(),
      bg: "#E9ECEF",
      bd: "#DEE2E6",
      tx: "#495057",
    };
  } catch {
    return { label: "—", bg: "#E9ECEF", bd: "#DEE2E6", tx: "#495057" };
  }
};

/* =========================
   UI Components
========================= */
const InfoChip = ({ icon, label, value, onCopy }) => {
  try {
    return (
      <div
        style={{
          border: "1px solid #eef0f3",
          borderRadius: 12,
          padding: "10px 12px",
          background: "#fff",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ marginTop: 2, color: "#6c757d" }}>{icon}</div>
          <div>
            <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 700 }}>
              {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#111" }}>
              {value}
            </div>
          </div>
        </div>

        {onCopy ? (
          <FaCopy
            title="Copy"
            style={{ cursor: "pointer", color: "#dc3545", marginTop: 4 }}
            onClick={onCopy}
          />
        ) : null}
      </div>
    );
  } catch (e) {
    console.error("InfoChip error:", e);
    return null;
  }
};

const StatCard = ({ label, value, accent }) => {
  try {
    return (
      <div
        style={{
          border: "1px solid #eef0f3",
          borderRadius: 14,
          padding: "12px 12px",
          background: "#fff",
        }}
      >
        <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: accent ? "#dc3545" : "#111",
            marginTop: 2,
          }}
        >
          ₹{money(value)}
        </div>
      </div>
    );
  } catch (e) {
    console.error("StatCard error:", e);
    return null;
  }
};

const SectionTitle = ({ title, right }) => {
  try {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 900, color: "#111" }}>
          {title}
        </div>
        {right ? right : null}
      </div>
    );
  } catch (e) {
    console.error("SectionTitle error:", e);
    return null;
  }
};

const RoomAccordion = ({ line, isOpen, onToggle }) => {
  try {
    const breakdown = Array.isArray(line?.breakdown) ? line.breakdown : [];
    const add = Array.isArray(line?.additionalServices)
      ? line.additionalServices
      : [];
    const roomTotal = asNum(line?.subtotal) + asNum(line?.additionalTotal);

    return (
      <div
        style={{
          border: "1px solid #eef0f3",
          borderRadius: 14,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {/* Header */}
        <button
          type="button"
          onClick={onToggle}
          style={{
            width: "100%",
            border: "none",
            background: "#ffffff",
            padding: "14px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#111" }}>
              {line?.roomName || "Room"}{" "}
              <span style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
                • {line?.sectionType || "—"}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#6c757d",
                fontWeight: 700,
                marginTop: 3,
              }}
            >
              Base: ₹{money(line?.subtotal)}{" "}
              {asNum(line?.additionalTotal) > 0 ? (
                <span>• Additional: ₹{money(line?.additionalTotal)}</span>
              ) : null}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}>
                Room Total
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#111" }}>
                ₹{money(roomTotal)}
              </div>
            </div>
            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        </button>

        {/* Body */}
        {isOpen && (
          <div style={{ padding: 14, borderTop: "1px solid #f1f3f5" }}>
            {/* Selected paints */}
            <div
              style={{
                border: "1px solid #eef0f3",
                borderRadius: 14,
                padding: 12,
                background: "#f8f9fa",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
                Selected Paints
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 10,
                    border: "1px solid #eef0f3",
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}
                  >
                    Ceiling
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, marginTop: 2 }}>
                    {line?.selectedPaints?.ceiling?.name || "—"}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}
                  >
                    ₹{money(line?.selectedPaints?.ceiling?.price)} / sqft
                  </div>
                </div>

                <div
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: 10,
                    border: "1px solid #eef0f3",
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}
                  >
                    Wall
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, marginTop: 2 }}>
                    {line?.selectedPaints?.wall?.name || "—"}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#6c757d", fontWeight: 800 }}
                  >
                    ₹{money(line?.selectedPaints?.wall?.price)} / sqft
                  </div>
                </div>
              </div>
            </div>

            {/* Base breakdown */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
                Base Breakdown
              </div>

              {breakdown.length === 0 ? (
                <div style={{ fontSize: 12, color: "#6c757d" }}>
                  No base items.
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #eef0f3",
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "10px 12px",
                      display: "grid",
                      gridTemplateColumns: "1.3fr 0.8fr 0.6fr 0.8fr 0.8fr",
                      fontSize: 11,
                      fontWeight: 900,
                      color: "#6c757d",
                      borderBottom: "1px solid #eef0f3",
                    }}
                  >
                    <div>Type</div>
                    <div>Mode</div>
                    <div>Sqft</div>
                    <div>Unit</div>
                    <div style={{ textAlign: "right" }}>Price</div>
                  </div>

                  {breakdown.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 12px",
                        display: "grid",
                        gridTemplateColumns: "1.3fr 0.8fr 0.6fr 0.8fr 0.8fr",
                        fontSize: 12,
                        borderBottom:
                          i === breakdown.length - 1
                            ? "none"
                            : "1px solid #f1f3f5",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 900, color: "#111" }}>
                        {b?.type || "—"}
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6c757d",
                            fontWeight: 800,
                          }}
                        >
                          {b?.paintName || ""}
                        </div>
                      </div>
                      <div style={{ color: "#6c757d", fontWeight: 800 }}>
                        {b?.mode || "—"}
                      </div>
                      <div style={{ fontWeight: 900 }}>{asNum(b?.sqft)}</div>
                      <div style={{ fontWeight: 900 }}>
                        ₹{money(b?.unitPrice)}
                      </div>
                      <div style={{ textAlign: "right", fontWeight: 900 }}>
                        ₹{money(b?.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional services */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>
                Additional Services
              </div>

              {add.length === 0 ? (
                <div style={{ fontSize: 12, color: "#6c757d" }}>
                  No additional services.
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {add.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        border: "1px solid #eef0f3",
                        borderRadius: 14,
                        padding: 12,
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 900,
                              color: "#111",
                            }}
                          >
                            {a?.serviceType || "Service"}{" "}
                            <span
                              style={{
                                fontSize: 11,
                                color: "#6c757d",
                                fontWeight: 800,
                              }}
                            >
                              • {a?.surfaceType || "—"}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: "#6c757d",
                              fontWeight: 800,
                              marginTop: 2,
                            }}
                          >
                            {a?.materialName || "—"}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: "#6c757d",
                              fontWeight: 800,
                              marginTop: 6,
                            }}
                          >
                            Area:{" "}
                            <strong style={{ color: "#111" }}>
                              {asNum(a?.areaSqft)} sqft
                            </strong>{" "}
                            • Unit:{" "}
                            <strong style={{ color: "#111" }}>
                              ₹{money(a?.unitPrice)}
                            </strong>{" "}
                            • With Paint:{" "}
                            <strong style={{ color: "#111" }}>
                              {a?.withPaint ? "YES" : "NO"}
                            </strong>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6c757d",
                              fontWeight: 800,
                            }}
                          >
                            Total
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 900,
                              color: "#dc3545",
                            }}
                          >
                            ₹{money(a?.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 14, borderTop: "1px dashed #cfd4da" }} />
            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 900 }}>
                Room Total
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#111" }}>
                ₹{money(roomTotal)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (e) {
    console.error("RoomAccordion error:", e);
    return null;
  }
};

/* =========================
   Main Page
========================= */
const QuoteDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [openRooms, setOpenRooms] = useState({});

  const fetchQuote = async () => {
    try {
      setLoading(true);
      setErrMsg("");

      const quoteId = id || location?.state?.quoteId;
      if (!quoteId) {
        setErrMsg("Missing quote id");
        return;
      }

      const res = await fetch(
        `http://localhost:9000/api/quotations/get-quotes/${quoteId}`,
      );
      const json = await res.json();

      if (!res.ok) throw new Error(json?.message || "Failed to fetch quote");

      const q = json?.data || null;
      setQuote(q);

      const first = q?.lines?.[0]?.roomName;
      if (first) setOpenRooms({ [first]: true });
    } catch (e) {
      console.error("fetchQuote error:", e);
      setQuote(null);
      setErrMsg(e?.message || "Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      fetchQuote();
    } catch (e) {
      console.error(e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const pill = useMemo(() => {
    try {
      return getPill(quote?.status, !!quote?.locked);
    } catch {
      return getPill("created", false);
    }
  }, [quote?.status, quote?.locked]);

  const toggleRoom = (roomName) => {
    try {
      setOpenRooms((p) => ({ ...p, [roomName]: !p?.[roomName] }));
    } catch (e) {
      console.error("toggleRoom error:", e);
    }
  };

  /* ====== Loading / Error ====== */
  if (loading) {
    return (
      <div style={{ padding: 16, fontFamily: "'Poppins', sans-serif" }}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <div className="card-body">
            <div style={{ fontWeight: 900 }}>Loading quotation...</div>
            <div style={{ fontSize: 12, color: "#6c757d", marginTop: 4 }}>
              Fetching quote details
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (errMsg) {
    return (
      <div style={{ padding: 16, fontFamily: "'Poppins', sans-serif" }}>
        <Button variant="light" size="sm" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </Button>

        <div
          className="card border-0 shadow-sm mt-2"
          style={{ borderRadius: 14 }}
        >
          <div className="card-body">
            <div style={{ fontWeight: 900, color: "#dc3545" }}>{errMsg}</div>
            <Button
              variant="danger"
              size="sm"
              className="mt-3"
              onClick={fetchQuote}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const totals = quote?.totals || {};
  const discount = quote?.discount || {};
  const isLocked = !!quote?.locked;

  return (
    <div style={{  fontFamily: "'Poppins', sans-serif" }}>
      {/* Page header */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: 14, marginBottom: 12 }}
      >
        <div className="card-body" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Button variant="light" size="sm" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Back
            </Button>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#111" }}>
                Quotation Details
              </div>
              <div style={{ fontSize: 12, color: "#6c757d", fontWeight: 700 }}>
                Quote No:{" "}
                <span style={{ color: "#111" }}>{quote?.quoteNo || "—"}</span>
              </div>
            </div>

            <div style={{ marginLeft: "auto" }}>
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: pill.bg,
                  border: `1px solid ${pill.bd}`,
                  color: pill.tx,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {pill.label == "LOCKED" ? "Finalized Quote" : pill.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="row g-3">
        {/* LEFT: Room-wise */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <div className="card-body" style={{ padding: 14 }}>
              <SectionTitle
                title="Room Wise Details"
                right={
                  <span
                    style={{ fontSize: 12, color: "#6c757d", fontWeight: 800 }}
                  >
                    {Array.isArray(quote?.lines) ? quote.lines.length : 0} Rooms
                  </span>
                }
              />

              {Array.isArray(quote?.lines) && quote.lines.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {quote.lines.map((line, idx) => {
                    const name = line?.roomName || `Room ${idx + 1}`;
                    const open = !!openRooms?.[name];

                    return (
                      <RoomAccordion
                        key={`${name}-${idx}`}
                        line={line}
                        isOpen={open}
                        onToggle={() => toggleRoom(name)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#6c757d" }}>
                  No room lines found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Sticky summary */}
        <div className="col-12 col-lg-4">
          <div style={{ position: "sticky", top: 12 }}>
            {/* Meta */}
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: 14, marginBottom: 12 }}
            >
              <div className="card-body" style={{ padding: 14 }}>
                <SectionTitle title="Quote Info" />

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <InfoChip
                    icon={<FaFileInvoice />}
                    label="Quote No"
                    value={quote?.quoteNo || "—"}
                    onCopy={
                      quote?.quoteNo ? () => copyText(quote.quoteNo) : null
                    }
                  />

                  <InfoChip
                    icon={<FaRegCalendarAlt />}
                    label="Created At"
                    value={fmtDT(quote?.createdAt)}
                  />

                  {/* <InfoChip
                    icon={<FaRegClock />}
                    label="Updated At"
                    value={fmtDT(quote?.updatedAt)}
                  /> */}

                  <InfoChip
                    icon={<FaLayerGroup />}
                    label="Days"
                    value={`${asNum(quote?.days)} day${asNum(quote?.days) > 1 ? "s" : ""}`}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: 14 }}
            >
              <div className="card-body" style={{ padding: 14 }}>
                <SectionTitle
                  title="Summary"
                  right={
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6c757d",
                          fontWeight: 800,
                        }}
                      >
                        Grand Total
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color: "#dc3545",
                        }}
                      >
                        ₹{money(totals?.grandTotal)}
                      </div>
                    </div>
                  }
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <StatCard label="Interior" value={totals?.interior} />
                  <StatCard label="Exterior" value={totals?.exterior} />
                  <StatCard label="Others" value={totals?.others} />
                  <StatCard
                    label="Additional"
                    value={totals?.additionalServices}
                  />
                </div>

                <div
                  style={{
                    borderTop: "1px dashed #cfd4da",
                    marginTop: 14,
                    marginBottom: 12,
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#6c757d", fontWeight: 800 }}>
                      Subtotal
                    </span>
                    <span style={{ fontWeight: 900, color: "#111" }}>
                      ₹{money(totals?.subtotal)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#6c757d", fontWeight: 800 }}>
                      Discount
                    </span>
                    <span style={{ fontWeight: 900, color: "#111" }}>
                      {String(discount?.type || "").toUpperCase() === "PERCENT"
                        ? `${asNum(discount?.value)}%`
                        : `₹${money(discount?.value)}`}{" "}
                      <span style={{ color: "#6c757d", fontWeight: 800 }}>
                        (₹{money(discount?.amount)})
                      </span>
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#6c757d", fontWeight: 800 }}>
                      Discount Amount
                    </span>
                    <span style={{ fontWeight: 900, color: "#111" }}>
                      ₹{money(totals?.discountAmount)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#6c757d", fontWeight: 800 }}>
                      Final Per Day
                    </span>
                    <span style={{ fontWeight: 900, color: "#111" }}>
                      ₹{money(totals?.finalPerDay)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
};

export default QuoteDetails;
