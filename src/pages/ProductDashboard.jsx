// import React, { useState, useEffect } from "react";
// import { Table, Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
// import { FaPlus, FaEdit, FaTrash, FaStar } from "react-icons/fa";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useNavigate } from "react-router-dom";

// const API_BASE = "https://homjee-backend.onrender.com";

// const productTypes = [
//   "Paints",
//   "Texture",
//   "Chemical Waterproofing",
//   "Terrace Waterproofing",
//   "Tile Grouting",
//   "POP",
//   "Wood Polish",
//   "Packages",
// ];

// const ProductsDashboard = () => {
//   const [city, setCity] = useState("All Cities");
//   const navigate = useNavigate();
//   const [category, setCategory] = useState("All Categories");
//   const [showModal, setShowModal] = useState(false);
//   const [selectedProductType, setSelectedProductType] = useState("");
//   const [editingProduct, setEditingProduct] = useState(null);
//   const [productsByType, setProductsByType] = useState({});
//   const [savedPricing, setSavedPricing] = useState(null);
//   const [siteVisitCharge, setSiteVisitCharge] = useState("");
//   const [vendorCoins, setVendorCoins] = useState("");
//   const [puttyPrice, setPuttyPrice] = useState("");

//   // fetch pricing config
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch(`${API_BASE}/api/service/latest`);
//         const result = await res.json();
//         if (res.ok) setSavedPricing(result.data);
//       } catch (e) {
//         console.error("Failed to fetch pricing:", e);
//       }
//     })();
//   }, []);

//   // fetch all product lists per type
//   useEffect(() => {
//     (async () => {
//       try {
//         const productsData = {};
//         for (const type of productTypes) {
//           const res = await fetch(
//             `${API_BASE}/api/products/get-products-by-type?productType=${encodeURIComponent(type)}`
//           );
//           const result = await res.json();
//           productsData[type] = res.ok ? result.data || [] : [];
//         }
//         setProductsByType(productsData);
//       } catch (e) {
//         console.error("Failed to fetch products:", e);
//       }
//     })();
//   }, []);

//   const handlePricingSave = async () => {
//     if (!siteVisitCharge || !vendorCoins || !puttyPrice) {
//       alert("Please enter all values");
//       return;
//     }
//     try {
//       const res = await fetch(`${API_BASE}/api/service/create`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           siteVisitCharge: Number(siteVisitCharge),
//           vendorCoins: Number(vendorCoins),
//           puttyPrice: Number(puttyPrice),
//         }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         alert("Saved successfully");
//         setSavedPricing(data.data);
//         setSiteVisitCharge("");
//         setVendorCoins("");
//         setPuttyPrice("");
//       } else {
//         alert(data.message || "Something went wrong");
//       }
//     } catch (e) {
//       console.error("Error saving pricing:", e);
//       alert("Server error");
//     }
//   };

//   // Save or update product (paint or package)
//   const handleSave = async (product) => {
//     try {
//       let payload;
//       let endpoint;

//       if (product.productType === "Packages") {
//         payload = {
//           packageName: product.name,
//           details: product.details.map((d) => ({
//             itemName: d.itemName,
//             paintName: d.paintName,
//             paintPrice: Number(d.paintPrice) || 0,
//             category: d.category,
//             paintType: d.paintType,
//             includePuttyOnFresh: !!d.includePuttyOnFresh,
//             includePuttyOnRepaint: !!d.includePuttyOnRepaint,
//           })),
//         };
//         endpoint = editingProduct ? `update-package/${editingProduct._id}` : "add-package";
//       } else {
//         payload = {
//           productType: product.productType,
//           name: product.name,
//           price: Number(product.price) || 0,
//           description: product.description || "",
//           isSpecial: product.type === "Special",
//           type: product.type || "Normal",
//           includePuttyOnFresh:
//             (product.type || "Normal") === "Normal" &&
//             product.productType === "Paints",
//           includePuttyOnRepaint: false,
//         };
//         endpoint = editingProduct ? `update-paint/${editingProduct._id}` : "add-paint";
//       }

//       const method = editingProduct ? "PUT" : "POST";
//       const res = await fetch(`${API_BASE}/api/products/${endpoint}`, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();

//       if (res.ok) {
//         const updated = await fetch(
//           `${API_BASE}/api/products/get-products-by-type?productType=${encodeURIComponent(product.productType)}`
//         ).then((r) => r.json());
//         setProductsByType((prev) => ({
//           ...prev,
//           [product.productType]: updated.data || [],
//         }));
//         alert(editingProduct ? "Product updated successfully" : "Product added successfully");
//       } else {
//         alert(data.message || "Something went wrong");
//       }
//     } catch (e) {
//       console.error("Error saving product:", e);
//       alert("Server error");
//     } finally {
//       setShowModal(false);
//       setEditingProduct(null);
//     }
//   };

//   // Delete product
//   const handleDelete = async (type, index) => {
//     try {
//       const productId = productsByType[type][index]._id;
//       const endpoint = type === "Packages" ? "delete-package" : "delete-paint";
//       const res = await fetch(`${API_BASE}/api/products/${endpoint}/${productId}`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setProductsByType((prev) => {
//           const updated = [...prev[type]];
//           updated.splice(index, 1);
//           return { ...prev, [type]: updated };
//         });
//         alert("Product deleted successfully");
//       } else {
//         alert(data.message || "Something went wrong");
//       }
//     } catch (e) {
//       console.error("Error deleting product:", e);
//       alert("Server error");
//     }
//   };

//   // IMPORTANT FIX: don't overwrite paint.type; set productType instead
//   const handleEdit = (type, index) => {
//     const prod = productsByType[type][index];
//     setEditingProduct({
//       ...prod,
//       productType: type, // keep section in productType
//       index,
//       _id: prod._id,
//     });
//     setSelectedProductType(type);
//     setShowModal(true);
//   };

//   const handleDragEnd = (result) => {
//     if (!result.destination) return;
//     const sourceType = result.source.droppableId;
//     const reordered = Array.from(productsByType[sourceType]);
//     const [moved] = reordered.splice(result.source.index, 1);
//     reordered.splice(result.destination.index, 0, moved);
//     setProductsByType((prev) => ({ ...prev, [sourceType]: reordered }));
//   };

//   return (
//     <Container className="py-4">
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h5 className="fw-bold">Product Dashboard</h5>
//         <div className="d-flex gap-2">
//           <Form.Select
//             value={city}
//             onChange={(e) => setCity(e.target.value)}
//             style={{ height: "36px", fontSize: "12px" }}
//           >
//             <option>City</option>
//             <option>Bangalore</option>
//             <option>Mumbai</option>
//           </Form.Select>
//           <Form.Select
//             value={category}
//             onChange={(e) => {
//               const selected = e.target.value;
//               setCategory(selected);
//               if (selected === "Deep Cleaning") navigate("/deep-cleaning-dashboard");
//             }}
//             style={{ height: "36px", fontSize: "12px" }}
//           >
//             <option>House Painting</option>
//             <option>Deep Cleaning</option>
//           </Form.Select>
//         </div>
//       </div>

//       <h5 className="fw-semibold mb-3" style={{ fontSize: "18px" }}>
//         Product Pricing Configuration
//       </h5>
//       <Row className="mb-4 align-items-center">
//         <Col md={3}>
//           <Form.Control
//             type="number"
//             placeholder="Site Visit Charge (₹)"
//             style={{ fontSize: "12px" }}
//             value={siteVisitCharge}
//             onChange={(e) => setSiteVisitCharge(e.target.value)}
//           />
//         </Col>
//         <Col md={3}>
//           <Form.Control
//             type="number"
//             placeholder="Vendor Coins Needed"
//             style={{ fontSize: "12px" }}
//             value={vendorCoins}
//             onChange={(e) => setVendorCoins(e.target.value)}
//           />
//         </Col>
//         <Col md={3}>
//           <Form.Control
//             type="number"
//             placeholder="Putty Price (₹)"
//             style={{ fontSize: "12px" }}
//             value={puttyPrice}
//             onChange={(e) => setPuttyPrice(e.target.value)}
//           />
//         </Col>
//         <Col md={3}>
//           <Button
//             variant="success"
//             style={{
//               borderColor: "black",
//               backgroundColor: "transparent",
//               color: "black",
//               fontSize: "14px",
//               width: "100%",
//             }}
//             onClick={handlePricingSave}
//           >
//             Save
//           </Button>
//         </Col>
//       </Row>

//       {savedPricing && (
//         <Row className="mb-3">
//           <Col md={4}>
//             <div style={{ fontSize: "13px", fontWeight: "bold" }}>
//               Site Visit Charge Saved: ₹{savedPricing.siteVisitCharge}
//             </div>
//           </Col>
//           <Col md={4}>
//             <div style={{ fontSize: "13px", fontWeight: "bold" }}>
//               Vendor Coins Needed: {savedPricing.vendorCoins}
//             </div>
//           </Col>
//           <Col md={4}>
//             <div style={{ fontSize: "13px", fontWeight: "bold" }}>
//               Putty Price Saved: ₹{savedPricing.puttyPrice}
//             </div>
//           </Col>
//         </Row>
//       )}

//       <DragDropContext onDragEnd={handleDragEnd}>
//         {productTypes.map((type) => (
//           <div key={type}>
//             <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
//               <h6 className="fw-bold">{type} Products</h6>
//               <Button
//                 variant=""
//                 onClick={() => {
//                   setEditingProduct(null);
//                   setSelectedProductType(type);
//                   setShowModal(true);
//                 }}
//                 style={{
//                   height: "30px",
//                   fontSize: "12px",
//                   borderColor: "black",
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 <FaPlus style={{ fontSize: "10px" }} /> Add {type} Product
//               </Button>
//             </div>

//             <Table striped bordered hover responsive>
//               <thead style={{ fontSize: "14px", textAlign: "center" }}>
//                 <tr>
//                   <th>Product Name</th>
//                   {type === "Packages" ? (
//                     <>
//                       <th>Package Price</th>
//                       <th>Interior Ceiling Paint</th>
//                       <th>Interior Walls Paint</th>
//                       <th>Exterior Ceiling Paint</th>
//                       <th>Exterior Walls Paint</th>
//                       <th>Others Paint</th>
//                     </>
//                   ) : (
//                     <>
//                       <th>Price</th>
//                       <th>Description</th>
//                       <th>Paint Type</th>
//                     </>
//                   )}
//                   <th>Actions</th>
//                 </tr>
//               </thead>

//               <Droppable droppableId={type} isDropDisabled={false}>
//                 {(provided) => (
//                   <tbody
//                     ref={provided.innerRef}
//                     {...provided.droppableProps}
//                     style={{ fontSize: "12px", textAlign: "center" }}
//                   >
//                     {(productsByType[type] || []).map((product, idx) => (
//                       <Draggable
//                         key={`${type}-${product._id}`}
//                         draggableId={`${type}-${product._id}`}
//                         index={idx}
//                       >
//                         {(providedDrag) => (
//                           <tr
//                             ref={providedDrag.innerRef}
//                             {...providedDrag.draggableProps}
//                             {...providedDrag.dragHandleProps}
//                           >
//                             <td>
//                               {product.type === "Special" && type === "Paints" && (
//                                 <FaStar className="text-warning me-2" />
//                               )}
//                               {type === "Packages" ? product.packageName : product.name}
//                             </td>

//                             {type === "Packages" ? (
//                               <>
//                                 <td>₹{product.packagePrice}</td>
//                                 <td>{product.details.find(d => d.category === "Interior" && d.itemName === "Ceiling")?.paintName || ""}</td>
//                                 <td>{product.details.find(d => d.category === "Interior" && d.itemName === "Walls")?.paintName || ""}</td>
//                                 <td>{product.details.find(d => d.category === "Exterior" && d.itemName === "Ceiling")?.paintName || ""}</td>
//                                 <td>{product.details.find(d => d.category === "Exterior" && d.itemName === "Walls")?.paintName || ""}</td>
//                                 <td>{product.details.find(d => d.category === "Others" && d.itemName === "Others")?.paintName || ""}</td>
//                               </>
//                             ) : (
//                               <>
//                                 <td>₹{product.price}</td>
//                                 <td>{product.description}</td>
//                                 <td>{product.type}</td>
//                               </>
//                             )}

//                             <td>
//                               <Button variant="" className="me-1" onClick={() => handleEdit(type, idx)}>
//                                 <FaEdit />
//                               </Button>
//                               <Button variant="" onClick={() => handleDelete(type, idx)}>
//                                 <FaTrash />
//                               </Button>
//                             </td>
//                           </tr>
//                         )}
//                       </Draggable>
//                     ))}
//                     {provided.placeholder}
//                   </tbody>
//                 )}
//               </Droppable>
//             </Table>
//           </div>
//         ))}
//       </DragDropContext>

//       <ProductModal
//         show={showModal}
//         onClose={() => setShowModal(false)}
//         onSave={handleSave}
//         productTypes={productTypes}
//         selectedProductType={selectedProductType}
//         setSelectedProductType={setSelectedProductType}
//         editingProduct={editingProduct}
//       />
//     </Container>
//   );
// };

// const ProductModal = ({
//   show,
//   onClose,
//   onSave,
//   productTypes,
//   selectedProductType,
//   setSelectedProductType,
//   editingProduct,
// }) => {
//   const [product, setProduct] = useState({
//     name: "",
//     description: "",
//     price: "",
//     type: "Normal",
//     productType: selectedProductType || "",
//     details: [
//       { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//       { itemName: "Walls", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//       { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//       { itemName: "Walls", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//       { itemName: "Others", paintName: "", paintPrice: 0, category: "Others", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//     ],
//   });

//   const [allPaints, setAllPaints] = useState([]);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch(`${API_BASE}/api/products/get-all-paints`);
//         const result = await res.json();
//         if (res.ok) {
//           setAllPaints(result.paints || []);
//         } else {
//           console.error("Failed to fetch paints:", result.message);
//         }
//       } catch (e) {
//         console.error("Error fetching paints:", e);
//       }
//     })();
//   }, []);

//   // when opening modal / changing edit target, populate fields
//   useEffect(() => {
//     if (editingProduct) {
//       const isPackage =
//         editingProduct.productType === "Packages" ||
//         selectedProductType === "Packages";

//       setProduct({
//         name: isPackage ? editingProduct.packageName || "" : editingProduct.name || "",
//         description: editingProduct.description || "",
//         price: isPackage ? "" : editingProduct.price ?? "",
//         // IMPORTANT: use stored paint.type ("Normal" | "Special"), not section type
//         type: editingProduct.type || "Normal",
//         productType: editingProduct.productType || selectedProductType || "",
//         details: editingProduct.details
//           ? editingProduct.details.map((d) => ({ ...d }))
//           : [
//               { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//               { itemName: "Walls", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//               { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//               { itemName: "Walls", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//               { itemName: "Others", paintName: "", paintPrice: 0, category: "Others", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//             ],
//       });
//     } else {
//       setProduct({
//         name: "",
//         description: "",
//         price: "",
//         type: "Normal",
//         productType: selectedProductType || "",
//         details: [
//           { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//           { itemName: "Walls", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//           { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//           { itemName: "Walls", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//           { itemName: "Others", paintName: "", paintPrice: 0, category: "Others", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
//         ],
//       });
//     }
//   }, [editingProduct, selectedProductType, show]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "productType") {
//       setProduct((prev) => ({ ...prev, productType: value, type: "Normal" }));
//       setSelectedProductType(value);
//       return;
//     }

//     if (name.startsWith("details.paintName")) {
//       const index = parseInt(name.split(".")[2], 10);
//       const selectedPaint = allPaints.find((p) => p.name === value);
//       const updated = [...product.details];
//       updated[index] = {
//         ...updated[index],
//         paintName: value,
//         paintPrice: selectedPaint ? selectedPaint.price : 0,
//         paintType: selectedPaint ? selectedPaint.type : "Normal",
//         includePuttyOnFresh: selectedPaint ? selectedPaint.includePuttyOnFresh : true,
//         includePuttyOnRepaint: selectedPaint ? selectedPaint.includePuttyOnRepaint : false,
//       };
//       setProduct((prev) => ({ ...prev, details: updated }));
//       return;
//     }

//     setProduct((prev) => ({ ...prev, [name]: value }));
//   };

//   return (
//     <Modal show={show} onHide={onClose} centered size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>{editingProduct ? "Edit Product" : "Add Product"}</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {/* If you want to switch section here, uncomment:
//         <Form.Select
//           className="mb-2"
//           name="productType"
//           value={product.productType}
//           onChange={handleChange}
//         >
//           <option value="">-- Select Product Type --</option>
//           {productTypes.map((type) => (
//             <option key={type} value={type}>{type}</option>
//           ))}
//         </Form.Select>
//         */}

//         <Form.Control
//           className="mb-2"
//           placeholder={product.productType === "Packages" ? "Package Name" : "Product Name"}
//           name="name"
//           value={product.name}
//           onChange={handleChange}
//         />

//         {product.productType === "Packages" ? (
//           <>
//             {product.details.map((detail, idx) => (
//               <div key={idx} className="mb-2">
//                 <Form.Label>{detail.category} {detail.itemName}</Form.Label>
//                 <Form.Select
//                   name={`details.paintName.${idx}`}
//                   value={detail.paintName}
//                   onChange={handleChange}
//                 >
//                   <option value="">-- Select Paint --</option>
//                   {allPaints.map((p) => (
//                     <option key={p._id} value={p.name}>
//                       {p.name}
//                     </option>
//                   ))}
//                 </Form.Select>
//               </div>
//             ))}
//           </>
//         ) : (
//           <>
//             <Form.Control
//               className="mb-2"
//               type="number"
//               placeholder="Price"
//               name="price"
//               value={product.price}
//               onChange={handleChange}
//             />
//             <Form.Control
//               className="mb-2"
//               placeholder="Description"
//               name="description"
//               value={product.description}
//               onChange={handleChange}
//             />
//             {product.productType === "Paints" && (
//               <Form.Select
//                 className="mb-2"
//                 name="type"
//                 value={product.type}
//                 onChange={handleChange}
//               >
//                 <option value="Normal">Normal</option>
//                 <option value="Special">Special</option>
//               </Form.Select>
//             )}
//           </>
//         )}
//       </Modal.Body>
//       <Modal.Footer>
//         <Button
//           variant="success"
//           onClick={() => onSave(product)}
//           disabled={!product.productType || !product.name || (product.productType !== "Packages" && !product.price)}
//         >
//           Save
//         </Button>
//         <Button variant="secondary" onClick={onClose}>
//           Cancel
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default ProductsDashboard;



import React, { useState, useEffect } from "react";
import { Table, Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaStar } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://homjee-backend.onrender.com";
// const API_BASE = "http://localhost:9000";


const productTypes = [
  "Paints",
  "Texture",
  "Chemical Waterproofing",
  "Terrace Waterproofing",
  "Tile Grouting",
  "POP",
  "Wood Polish",
  "Packages",
];

const ProductsDashboard = () => {
  const [city, setCity] = useState("All Cities");
  const navigate = useNavigate();
  const [category, setCategory] = useState("All Categories");
  const [showModal, setShowModal] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [productsByType, setProductsByType] = useState({});
  const [savedPricing, setSavedPricing] = useState(null);
  const [siteVisitCharge, setSiteVisitCharge] = useState("");
  const [vendorCoins, setVendorCoins] = useState("");
  const [puttyPrice, setPuttyPrice] = useState("");

  // Fetch pricing config
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/service/latest`);
        const result = await res.json();
        if (res.ok) setSavedPricing(result.data);
      } catch (e) {
        console.error("Failed to fetch pricing:", e);
      }
    })();
  }, []);

  // Fetch all products, including finishing paints
  useEffect(() => {
    (async () => {
      try {
        const productsData = {};
        // Initialize empty arrays for each product type
        productTypes.forEach((type) => {
          productsData[type] = [];
        });

        // Fetch finishing paints
        const finishingRes = await fetch(`${API_BASE}/api/products/get-all-finishing-paints`);
        const finishingResult = await finishingRes.json();
        if (finishingRes.ok && finishingResult.data) {
          // Group finishing paints by productType
          finishingResult.data.forEach((paint) => {
            if (productTypes.includes(paint.productType)) {
              productsData[paint.productType].push(paint);
            }
          });
        }

        // Fetch packages separately
        const packagesRes = await fetch(
          `${API_BASE}/api/products/get-products-by-type?productType=${encodeURIComponent("Packages")}`
        );
        const packagesResult = await packagesRes.json();
        if (packagesRes.ok) {
          productsData["Packages"] = packagesResult.data || [];
        }

        // Fetch paints separately
        const paintsRes = await fetch(
          `${API_BASE}/api/products/get-products-by-type?productType=${encodeURIComponent("Paints")}`
        );
        const paintsResult = await paintsRes.json();
        if (paintsRes.ok) {
          productsData["Paints"] = paintsResult.data || [];
        }

        setProductsByType(productsData);
      } catch (e) {
        console.error("Failed to fetch products:", e);
      }
    })();
  }, []);

  const handlePricingSave = async () => {
    if (!siteVisitCharge || !vendorCoins || !puttyPrice) {
      alert("Please enter all values");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/service/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteVisitCharge: Number(siteVisitCharge),
          vendorCoins: Number(vendorCoins),
          puttyPrice: Number(puttyPrice),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Saved successfully");
        setSavedPricing(data.data);
        setSiteVisitCharge("");
        setVendorCoins("");
        setPuttyPrice("");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (e) {
      console.error("Error saving pricing:", e);
      alert("Server error");
    }
  };

  // Save or update product (paint, finishing paint, or package)
  const handleSave = async (product) => {
    try {
      let payload;
      let endpoint;
      let method = editingProduct ? "PUT" : "POST";

      const finishingTypes = [
        "Texture",
        "Chemical Waterproofing",
        "Terrace Waterproofing",
        "Tile Grouting",
        "POP",
        "Wood Polish",
      ];

      if (product.productType === "Packages") {
        payload = {
          packageName: product.name,
          details: product.details.map((d) => ({
            itemName: d.itemName,
            paintName: d.paintName,
            paintPrice: Number(d.paintPrice) || 0,
            category: d.category,
            paintType: d.paintType,
            includePuttyOnFresh: !!d.includePuttyOnFresh,
            includePuttyOnRepaint: !!d.includePuttyOnRepaint,
          })),
        };
        endpoint = editingProduct ? `update-package/${editingProduct._id}` : "add-package";
      } else if (finishingTypes.includes(product.productType)) {
        payload = {
          paintName: product.name,
          paintPrice: Number(product.price) || 0,
          description: product.description || "",
          productType: product.productType,
          paintType: product.type || "Normal",
        };
        endpoint = editingProduct ? `update-finishing-paint/${editingProduct._id}` : "add-finishing-paints";
      } else {
        payload = {
          productType: product.productType,
          name: product.name,
          price: Number(product.price) || 0,
          description: product.description || "",
          isSpecial: product.type === "Special",
          type: product.type || "Normal",
          includePuttyOnFresh: product.type === "Normal" && product.productType === "Paints",
          includePuttyOnRepaint: false,
        };
        endpoint = editingProduct ? `update-paint/${editingProduct._id}` : "add-paint";
      }

      const res = await fetch(`${API_BASE}/api/products/${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        // Refresh products for the specific productType
        const updated = await fetch(
          `${API_BASE}/api/products/get-products-by-type?productType=${encodeURIComponent(product.productType)}`
        ).then((r) => r.json());
        setProductsByType((prev) => ({
          ...prev,
          [product.productType]: updated.data || [],
        }));
        alert(editingProduct ? "Product updated successfully" : "Product added successfully");
        window.location.reload();

      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (e) {
      console.error("Error saving product:", e);
      alert("Server error");
    } finally {
      setShowModal(false);
      setEditingProduct(null);
    }
  };

  // Delete product
  const handleDelete = async (type, index) => {
    try {
      const productId = productsByType[type][index]._id;
      const finishingTypes = [
        "Texture",
        "Chemical Waterproofing",
        "Terrace Waterproofing",
        "Tile Grouting",
        "POP",
        "Wood Polish",
      ];
      const endpoint = type === "Packages" ? "delete-package" : finishingTypes.includes(type) ? "delete-finishing-paint" : "delete-paint";
      const res = await fetch(`${API_BASE}/api/products/${endpoint}/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setProductsByType((prev) => {
          const updated = [...prev[type]];
          updated.splice(index, 1);
          return { ...prev, [type]: updated };
        });
        alert("Product deleted successfully");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (e) {
      console.error("Error deleting product:", e);
      alert("Server error");
    }
  };

  // Edit product
  const handleEdit = (type, index) => {
    const prod = productsByType[type][index];
    setEditingProduct({
      ...prod,
      productType: type,
      name: type === "Packages" ? prod.packageName : prod.paintName || prod.name,
      price: prod.paintPrice || prod.price,
      type: prod.paintType || prod.type || "Normal",
      index,
      _id: prod._id,
    });
    setSelectedProductType(type);
    setShowModal(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const sourceType = result.source.droppableId;
    const reordered = Array.from(productsByType[sourceType]);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setProductsByType((prev) => ({ ...prev, [sourceType]: reordered }));
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold">Product Dashboard</h5>
        <div className="d-flex gap-2">
          <Form.Select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ height: "36px", fontSize: "12px" }}
          >
            <option>City</option>
            <option>Bangalore</option>
            <option>Mumbai</option>
          </Form.Select>
          <Form.Select
            value={category}
            onChange={(e) => {
              const selected = e.target.value;
              setCategory(selected);
              if (selected === "Deep Cleaning") navigate("/deep-cleaning-dashboard");
            }}
            style={{ height: "36px", fontSize: "12px" }}
          >
            <option>House Painting</option>
            <option>Deep Cleaning</option>
          </Form.Select>
        </div>
      </div>

      <h5 className="fw-semibold mb-3" style={{ fontSize: "18px" }}>
        Product Pricing Configuration
      </h5>
      <Row className="mb-4 align-items-center">
        <Col md={3}>
          <Form.Control
            type="number"
            placeholder="Site Visit Charge (₹)"
            style={{ fontSize: "12px" }}
            value={siteVisitCharge}
            onChange={(e) => setSiteVisitCharge(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Control
            type="number"
            placeholder="Vendor Coins Needed"
            style={{ fontSize: "12px" }}
            value={vendorCoins}
            onChange={(e) => setVendorCoins(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Control
            type="number"
            placeholder="Putty Price (₹)"
            style={{ fontSize: "12px" }}
            value={puttyPrice}
            onChange={(e) => setPuttyPrice(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Button
            variant="success"
            style={{
              borderColor: "black",
              backgroundColor: "transparent",
              color: "black",
              fontSize: "14px",
              width: "100%",
            }}
            onClick={handlePricingSave}
          >
            Save
          </Button>
        </Col>
      </Row>

      {savedPricing && (
        <Row className="mb-3">
          <Col md={4}>
            <div style={{ fontSize: "13px", fontWeight: "bold" }}>
              Site Visit Charge Saved: ₹{savedPricing.siteVisitCharge}
            </div>
          </Col>
          <Col md={4}>
            <div style={{ fontSize: "13px", fontWeight: "bold" }}>
              Vendor Coins Needed: {savedPricing.vendorCoins}
            </div>
          </Col>
          <Col md={4}>
            <div style={{ fontSize: "13px", fontWeight: "bold" }}>
              Putty Price Saved: ₹{savedPricing.puttyPrice}
            </div>
          </Col>
        </Row>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        {productTypes.map((type) => (
          <div key={type}>
            <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
              <h6 className="fw-bold">{type} Products</h6>
              <Button
                variant=""
                onClick={() => {
                  setEditingProduct(null);
                  setSelectedProductType(type);
                  setShowModal(true);
                }}
                style={{
                  height: "30px",
                  fontSize: "12px",
                  borderColor: "black",
                  whiteSpace: "nowrap",
                }}
              >
                <FaPlus style={{ fontSize: "10px" }} /> Add {type} Product
              </Button>
            </div>

            <Table striped bordered hover responsive>
              <thead style={{ fontSize: "14px", textAlign: "center" }}>
                <tr>
                  <th>Product Name</th>
                  {type === "Packages" ? (
                    <>
                      <th>Package Price</th>
                      <th>Interior Ceiling Paint</th>
                      <th>Interior Walls Paint</th>
                      <th>Exterior Ceiling Paint</th>
                      <th>Exterior Walls Paint</th>
                      <th>Others Paint</th>
                    </>
                  ) : (
                    <>
                      <th>Price</th>
                      <th>Description</th>
                      <th>Paint Type</th>
                    </>
                  )}
                  <th>Actions</th>
                </tr>
              </thead>

              <Droppable droppableId={type} isDropDisabled={false}>
                {(provided) => (
                  <tbody
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{ fontSize: "12px", textAlign: "center" }}
                  >
                    {(productsByType[type] || []).map((product, idx) => (
                      <Draggable
                        key={`${type}-${product._id}`}
                        draggableId={`${type}-${product._id}`}
                        index={idx}
                      >
                        {(providedDrag) => (
                          <tr
                            ref={providedDrag.innerRef}
                            {...providedDrag.draggableProps}
                            {...providedDrag.dragHandleProps}
                          >
                            <td>
                              {product.type === "Special" && type === "Paints" && (
                                <FaStar className="text-warning me-2" />
                              )}
                              {type === "Packages" ? product.packageName : product.paintName || product.name}
                            </td>

                            {type === "Packages" ? (
                              <>
                                <td>₹{product.packagePrice}</td>
                                <td>{product.details?.find(d => d.category === "Interior" && d.itemName === "Ceiling")?.paintName || ""}</td>
                                <td>{product.details?.find(d => d.category === "Interior" && d.itemName === "Walls")?.paintName || ""}</td>
                                <td>{product.details?.find(d => d.category === "Exterior" && d.itemName === "Ceiling")?.paintName || ""}</td>
                                <td>{product.details?.find(d => d.category === "Exterior" && d.itemName === "Walls")?.paintName || ""}</td>
                                <td>{product.details?.find(d => d.category === "Others" && d.itemName === "Others")?.paintName || ""}</td>
                              </>
                            ) : (
                              <>
                                <td>₹{product.paintPrice || product.price}</td>
                                <td>{product.description}</td>
                                <td>{product.paintType || product.type}</td>
                              </>
                            )}

                            <td>
                              <Button variant="" className="me-1" onClick={() => handleEdit(type, idx)}>
                                <FaEdit />
                              </Button>
                              <Button variant="" onClick={() => handleDelete(type, idx)}>
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </tbody>
                )}
              </Droppable>
            </Table>
          </div>
        ))}
      </DragDropContext>

      <ProductModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        productTypes={productTypes}
        selectedProductType={selectedProductType}
        setSelectedProductType={setSelectedProductType}
        editingProduct={editingProduct}
      />
    </Container>
  );
};

const ProductModal = ({
  show,
  onClose,
  onSave,
  productTypes,
  selectedProductType,
  setSelectedProductType,
  editingProduct,
}) => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    type: "Normal",
    productType: selectedProductType || "",
    details: [
      { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
      { itemName: "Walls", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
      { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
      { itemName: "Walls", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
      { itemName: "Others", paintName: "", paintPrice: 0, category: "Others", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
    ],
  });

  const [allPaints, setAllPaints] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products/get-all-finishing-paints`);
        const result = await res.json();
        if (res.ok) {
          setAllPaints(result.data || []);
        } else {
          console.error("Failed to fetch finishing paints:", result.message);
        }
      } catch (e) {
        console.error("Error fetching finishing paints:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (editingProduct) {
      const isPackage = editingProduct.productType === "Packages";
      const isFinishing = [
        "Texture",
        "Chemical Waterproofing",
        "Terrace Waterproofing",
        "Tile Grouting",
        "POP",
        "Wood Polish",
      ].includes(editingProduct.productType);

      setProduct({
        name: isPackage ? editingProduct.packageName || "" : editingProduct.paintName || editingProduct.name || "",
        description: editingProduct.description || "",
        price: isPackage ? "" : (editingProduct.paintPrice || editingProduct.price || ""),
        type: editingProduct.paintType || editingProduct.type || "Normal",
        productType: editingProduct.productType || selectedProductType || "",
        details: editingProduct.details
          ? editingProduct.details.map((d) => ({ ...d }))
          : [
              { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
              { itemName: "Walls", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
              { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
              { itemName: "Walls", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
              { itemName: "Others", paintName: "", paintPrice: 0, category: "Others", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
            ],
      });
    } else {
      setProduct({
        name: "",
        description: "",
        price: "",
        type: "Normal",
        productType: selectedProductType || "",
        details: [
          { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
          { itemName: "Walls", paintName: "", paintPrice: 0, category: "Interior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
          { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
          { itemName: "Walls", paintName: "", paintPrice: 0, category: "Exterior", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
          { itemName: "Others", paintName: "", paintPrice: 0, category: "Others", paintType: "Normal", includePuttyOnFresh: true, includePuttyOnRepaint: false },
        ],
      });
    }
  }, [editingProduct, selectedProductType, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "productType") {
      setProduct((prev) => ({ ...prev, productType: value, type: "Normal" }));
      setSelectedProductType(value);
      return;
    }

    if (name.startsWith("details.paintName")) {
      const index = parseInt(name.split(".")[2], 10);
      const selectedPaint = allPaints.find((p) => p.paintName === value);
      const updated = [...product.details];
      updated[index] = {
        ...updated[index],
        paintName: value,
        paintPrice: selectedPaint ? selectedPaint.paintPrice : 0,
        paintType: selectedPaint ? selectedPaint.paintType : "Normal",
        includePuttyOnFresh: selectedPaint ? selectedPaint.includePuttyOnFresh : true,
        includePuttyOnRepaint: selectedPaint ? selectedPaint.includePuttyOnRepaint : false,
      };
      setProduct((prev) => ({ ...prev, details: updated }));
      return;
    }

    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const finishingTypes = [
    "Texture",
    "Chemical Waterproofing",
    "Terrace Waterproofing",
    "Tile Grouting",
    "POP",
    "Wood Polish",
  ];

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editingProduct ? "Edit Product" : "Add Product"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
    

        <Form.Control
          className="mb-2"
          placeholder={product.productType === "Packages" ? "Package Name" : "Product Name"}
          name="name"
          value={product.name}
          onChange={handleChange}
        />

        {product.productType === "Packages" ? (
          <>
            {product.details.map((detail, idx) => (
              <div key={idx} className="mb-2">
                <Form.Label>{detail.category} {detail.itemName}</Form.Label>
                <Form.Select
                  name={`details.paintName.${idx}`}
                  value={detail.paintName}
                  onChange={handleChange}
                >
                  <option value="">-- Select Paint --</option>
                  {allPaints.map((p) => (
                    <option key={p._id} value={p.paintName}>
                      {p.paintName}
                    </option>
                  ))}
                </Form.Select>
              </div>
            ))}
          </>
        ) : (
          <>
            <Form.Control
              className="mb-2"
              type="number"
              placeholder="Price"
              name="price"
              value={product.price}
              onChange={handleChange}
            />
            <Form.Control
              className="mb-2"
              placeholder="Description"
              name="description"
              value={product.description}
              onChange={handleChange}
            />
            {product.productType === "Paints"  && (
              <Form.Select
                className="mb-2"
                name="type"
                value={product.type}
                onChange={handleChange}
              >
                <option value="Normal">Normal</option>
                <option value="Special">Special</option>
              </Form.Select>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="success"
          onClick={() => onSave(product)}
          disabled={!product.productType || !product.name || (product.productType !== "Packages" && !product.price)}
        >
          Save
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductsDashboard;

