import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/config";
import { Button } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa6";

import { useNavigate } from "react-router-dom";
export default function AdminCleaningCatalogEditor() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Read-only mode: no edits allowed
  const READ_ONLY = true;

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${BASE_URL}/admin/cleaning-catalog/fetch`);
      setConfig(res.data.data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!config) return <div>{error || "No config found"}</div>;

  const categories = Object.keys(config.data || {});

  return (
    <div style={{ padding: 16 }}>
        <Button
          style={{
            borderColor: "black",
            backgroundColor: "transparent",
            color: "black",
            fontSize: "12px",
          }}
          onClick={() => navigate(-1)}
        >
        <FaArrowLeft/>  Back
        </Button>
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
      
        <h2>Website Cleaning Catalog (v{config.version})</h2>

        {/* ✅ Hide save button completely in read-only */}
        {!READ_ONLY ? (
          <button>Save Changes</button>
        ) : (
          <button disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
            Read Only
          </button>
        )}
      </div>

      {error ? (
        <pre
          style={{ background: "#ffecec", padding: 12, whiteSpace: "pre-wrap" }}
        >
          {error}
        </pre>
      ) : null}

      {categories.map((cat) => (
        <div
          key={cat}
          style={{
            marginTop: 18,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <div style={{ padding: 12, background: "#f6f6f6" }}>
            <b>Category Key:</b> {cat} - {(config.data[cat] || []).length}{" "}
            Packages
          </div>

          <div style={{ padding: 12 }}>
            {(config.data[cat] || []).map((pkg, i) => (
              <div
                key={`${cat}-${i}`}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  background: "white",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label>Name</label>
                    <input
                      value={pkg.name || ""}
                      disabled
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label>Price</label>
                    <input
                      type="number"
                      value={pkg.price ?? ""}
                      disabled={READ_ONLY}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label>Duration</label>
                    <input
                      type="number"
                      value={pkg.duration ?? ""}
                      disabled={READ_ONLY}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label>Team Members</label>
                    <input
                      type="number"
                      value={pkg.teamMembers ?? ""}
                      disabled={READ_ONLY}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label>Coins For Vendor</label>
                    <input
                      type="number"
                      value={pkg.coinsForVendor ?? ""}
                      disabled={READ_ONLY}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label>Reviews</label>
                    <input
                      value={pkg.reviews || ""}
                      disabled={READ_ONLY}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div>
                    <label>Details</label>
                    <input
                      value={pkg.details || ""}
                      disabled={READ_ONLY}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label>Extras</label>
                    <input
                      value={pkg.extras || ""}
                      disabled={READ_ONLY}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                {/* ✅ Optional note */}
                {READ_ONLY && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
                    This catalog is read-only. Changes must be done from Deep
                    Cleaning Packages.
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { BASE_URL } from "../utils/config";

// export default function AdminCleaningCatalogEditor() {
//   const [config, setConfig] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");

//   const fetchConfig = async () => {
//     try {
//       setLoading(true);
//       setError("");
//       const res = await axios.get(
//         `${BASE_URL}/admin/cleaning-catalog/fetch`
//       );
//       setConfig(res.data.data);
//     } catch (e) {
//       setError(e?.response?.data?.message || e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchConfig();
//   }, []);

//   const updateField = (categoryKey, index, field, value) => {
//     try {
//       setConfig((prev) => {
//         const next = structuredClone(prev);
//         next.data[categoryKey][index][field] = value;
//         return next;
//       });
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   console.log("config", config?.data);

//   const save = async () => {
//     try {
//       if (!config?.data) return;
//       setSaving(true);
//       setError("");
//       await axios.put(
//         `${BASE_URL}/admin/cleaning-catalog/update?serviceType=deep_cleaning`,
//         {
//           data: config.data,
//         }
//       );
//       await fetchConfig();
//       alert("Saved ✅");
//     } catch (e) {
//       const msg = e?.response?.data?.message || e.message;
//       const errs = e?.response?.data?.errors || [];
//       setError(`${msg}${errs.length ? "\n- " + errs.join("\n- ") : ""}`);
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <div>Loading...</div>;
//   if (!config) return <div>{error || "No config found"}</div>;

//   const categories = Object.keys(config.data || {});

//   return (
//     <div style={{ padding: 16 }}>
//       <div
//         style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
//       >
//         <h2>Cleaning Catalog (v{config.version})</h2>
//         <button onClick={save} disabled={saving}>
//           {saving ? "Saving..." : "Save Changes"}
//         </button>
//       </div>

//       {error ? (
//         <pre
//           style={{ background: "#ffecec", padding: 12, whiteSpace: "pre-wrap" }}
//         >
//           {error}
//         </pre>
//       ) : null}

//       {categories.map((cat) => (
//         <div
//           key={cat}
//           style={{ marginTop: 18, border: "1px solid #ddd", borderRadius: 8 }}
//         >
//           <div style={{ padding: 12, background: "#f6f6f6" }}>
//             <b>Category Key (locked):</b> {cat} -
//             {(config.data[cat] || []).length} Packages
//           </div>

//           <div style={{ padding: 12 }}>
//             {(config.data[cat] || []).map((pkg, i) => (
//               <div
//                 key={`${cat}-${i}`}
//                 style={{
//                   border: "1px solid #eee",
//                   borderRadius: 8,
//                   padding: 12,
//                   marginBottom: 12,
//                   backgroundImage: "white",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "grid",
//                     gridTemplateColumns: "1fr 1fr",
//                     gap: 12,
//                   }}
//                 >
//                   {/* LOCKED: name */}
//                   <div>
//                     <label>Name (locked)</label>
//                     <input
//                       value={pkg.name || ""}
//                       disabled
//                       style={{ width: "100%" }}
//                     />
//                   </div>

//                   {/* EDITABLE: price */}
//                   <div>
//                     <label>Price</label>
//                     <input
//                       type="number"
//                       value={pkg.price ?? ""}
//                       onChange={(e) =>
//                         updateField(cat, i, "price", Number(e.target.value))
//                       }
//                       style={{ width: "100%" }}
//                     />
//                   </div>

//                   {/* LOCKED: duration */}
//                   <div>
//                     <label>Duration</label>
//                     <input
//                       value={pkg.duration ?? ""}
//                       onChange={(e) =>
//                         updateField(cat, i, "duration", Number(e.target.value))
//                       }
//                       //   disabled
//                       style={{ width: "100%" }}
//                     />
//                   </div>

//                   {/* LOCKED: teamMembers */}
//                   <div>
//                     <label>Team Members</label>
//                     <input
//                       value={pkg.teamMembers ?? ""}
//                       onChange={(e) =>
//                         updateField(
//                           cat,
//                           i,
//                           "teamMembers",
//                           Number(e.target.value)
//                         )
//                       }
//                       //   disabled
//                       style={{ width: "100%" }}
//                     />
//                   </div>

//                   {/* EDITABLE: reviews */}
//                   <div>
//                     <label>Reviews</label>
//                     <input
//                       value={pkg.reviews || ""}
//                       onChange={(e) =>
//                         updateField(cat, i, "reviews", e.target.value)
//                       }
//                       style={{ width: "100%" }}
//                     />
//                   </div>

//                   {/* EDITABLE: details */}
//                   <div>
//                     <label>Details</label>
//                     <input
//                       value={pkg.details || ""}
//                       onChange={(e) =>
//                         updateField(cat, i, "details", e.target.value)
//                       }
//                       style={{ width: "100%" }}
//                     />
//                   </div>

//                   {/* EDITABLE: extras */}
//                   <div style={{ gridColumn: "1 / -1" }}>
//                     <label>Extras</label>
//                     <input
//                       value={pkg.extras || ""}
//                       onChange={(e) =>
//                         updateField(cat, i, "extras", e.target.value)
//                       }
//                       style={{ width: "100%" }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }
