import React, { useEffect, useState } from "react";
import { Table, Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaStar, FaGripVertical } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/config";
import axios from "axios";

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

const finishingTypes = [
  "Texture",
  "Chemical Waterproofing",
  "Terrace Waterproofing",
  "Tile Grouting",
  "POP",
  "Wood Polish",
];

const ProductsDashboard = () => {
  const [city, setCity] = useState("");
  const [cities, setCities] = useState([]);
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

  // Fetch city list
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/city/city-list`);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setCities(list);
        if (list.length > 0) setCity(list[0]?.city || "");
      } catch (err) {
        console.error("Error fetching city list:", err);
        setCities([]);
        setCity("");
      }
    };
    fetchCities();
  }, []);

  // Fetch pricing config
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${BASE_URL}/service/latest`);
        const result = await res.json();
        if (res.ok) setSavedPricing(result.data);
      } catch (e) {
        console.error("Failed to fetch pricing:", e);
      }
    };
    run();
  }, []);

  const fetchData = async () => {
    try {
      const productsData = {};
      
      // Initialize empty arrays for each product type
      productTypes.forEach((t) => (productsData[t] = []));

      // 1) Paints by city (should return sorted by order)
      const paintsRes = await fetch(
        `${BASE_URL}/products/get-products-by-type?productType=${encodeURIComponent(
          "Paints"
        )}&city=${encodeURIComponent(city)}`
      );
      const paintsResult = await paintsRes.json();
      if (paintsRes.ok) productsData["Paints"] = paintsResult.data || [];

      // 2) Packages by city (should return sorted by order)
      const packagesRes = await fetch(
        `${BASE_URL}/products/get-products-by-type?productType=${encodeURIComponent(
          "Packages"
        )}&city=${encodeURIComponent(city)}`
      );
      const packagesResult = await packagesRes.json();
      if (packagesRes.ok) productsData["Packages"] = packagesResult.data || [];

      // 3) Finishing types by city (fetch all finishing then split by type)
      const finishingRes = await fetch(
        `${BASE_URL}/products/get-all-finishing-paints?city=${encodeURIComponent(city)}`
      );
      const finishingResult = await finishingRes.json();
      if (finishingRes.ok && Array.isArray(finishingResult.data)) {
        // Group finishing paints by their productType
        finishingResult.data.forEach((p) => {
          if (productTypes.includes(p.productType)) {
            productsData[p.productType].push(p);
          }
        });
        
        // Sort each finishing type by order
        finishingTypes.forEach(type => {
          if (productsData[type]) {
            productsData[type].sort((a, b) => a.order - b.order);
          }
        });
      }

      setProductsByType(productsData);
    } catch (e) {
      console.error("Failed to fetch products:", e);
    }
  };

  useEffect(() => {
    if (!city) return;
    fetchData();
  }, [city]);

  const handlePricingSave = async () => {
    try {
      if (siteVisitCharge === "" || vendorCoins === "" || puttyPrice === "") {
        alert("Please enter all values");
        return;
      }

      const res = await fetch(`${BASE_URL}/service/create`, {
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

  const handleSave = async (product) => {
    try {
      let payload;
      let endpoint;
      const method = editingProduct ? "PUT" : "POST";

      if (product.productType === "Packages") {
        payload = {
          packageName: product.name,
          details: (product.details || []).map((d) => ({
            itemName: d.itemName,
            paintName: d.paintName || "",
            paintPrice: Number(d.paintPrice) || 0,
            category: d.category,
            includePuttyOnFresh: !!d.includePuttyOnFresh,
            includePuttyOnRepaint: !!d.includePuttyOnRepaint,
            city: product.city || "",
          })),
        };

        endpoint = editingProduct
          ? `update-package/${editingProduct._id}`
          : "add-package";
      } else if (finishingTypes.includes(product.productType)) {
        payload = {
          paintName: product.name,
          paintPrice: Number(product.price) || 0,
          description: product.description || "",
          productType: product.productType,
          paintType: product.type || "Normal",
          city: product.city || "",
        };

        endpoint = editingProduct
          ? `update-finishing-paint/${editingProduct._id}`
          : "add-finishing-paints";
      } else {
        payload = {
          productType: product.productType,
          name: product.name,
          price: Number(product.price) || 0,
          description: product.description || "",
          isSpecial: product.type === "Special",
          type: product.type || "Normal",
          includePuttyOnFresh:
            product.type === "Normal" && product.productType === "Paints",
          includePuttyOnRepaint: false,
          city: product.city || "",
        };

        endpoint = editingProduct
          ? `update-paint/${editingProduct._id}`
          : "add-paint";
      }

      const res = await fetch(`${BASE_URL}/products/${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Something went wrong");
        return;
      }

      await fetchData();
    } catch (e) {
      console.error("Error saving product:", e);
      alert("Server error");
    } finally {
      setShowModal(false);
      setEditingProduct(null);
    }
  };

  const handleDelete = async (type, index) => {
    try {
      const productId = productsByType[type][index]._id;

      const endpoint =
        type === "Packages"
          ? "delete-package"
          : finishingTypes.includes(type)
          ? "delete-finishing-paint"
          : "delete-paint";

      const res = await fetch(`${BASE_URL}/products/${endpoint}/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Something went wrong");
        return;
      }

      // Update local state
      setProductsByType((prev) => {
        const updated = [...(prev[type] || [])];
        updated.splice(index, 1);
        return { ...prev, [type]: updated };
      });
    } catch (e) {
      console.error("Error deleting product:", e);
      alert("Server error");
    }
  };

  const handleEdit = (type, index) => {
    try {
      const prod = productsByType[type][index];

      const pkgCity =
        type === "Packages" ? prod?.details?.[0]?.city || "" : prod?.city || "";

      setEditingProduct({
        ...prod,
        productType: type,
        name: type === "Packages" ? prod.packageName : prod.paintName || prod.name,
        price: prod.paintPrice || prod.price,
        type: prod.paintType || prod.type || "Normal",
        city: pkgCity || city || "",
        index,
        _id: prod._id,
      });

      setSelectedProductType(type);
      setShowModal(true);
    } catch (e) {
      console.error("handleEdit error:", e);
    }
  };

  // ✅ Drag and Drop Functions
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // If dropped outside the list or in the same position
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }

    const sourceType = source.droppableId;
    const destType = destination.droppableId;

    // Only allow reordering within the same category
    if (sourceType !== destType) {
      console.log("Cannot move between different categories");
      return;
    }

    // Create a copy of the current items
    const currentItems = [...(productsByType[sourceType] || [])];
    
    // Remove the dragged item
    const [removed] = currentItems.splice(source.index, 1);
    
    // Insert it at the new position
    currentItems.splice(destination.index, 0, removed);

    // Update state immediately (optimistic update)
    setProductsByType(prev => ({
      ...prev,
      [sourceType]: currentItems
    }));

    // Send update to backend
    try {
      const orderedIds = currentItems.map(item => item._id);
      
      const response = await fetch(`${BASE_URL}/products/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: city,
          productType: sourceType,
          orderedIds: orderedIds
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save order");
      }

      console.log("Order saved successfully:", result);
    } catch (error) {
      console.error("Error saving order:", error);
      
      // Revert to original order if backend update fails
      await fetchData();
      alert("Failed to save the new order. Please try again.");
    }
  };

  const getPkgPaintName = (product, category, itemName) => {
    return (
      product?.details?.find(
        (d) => d.category === category && d.itemName === itemName
      )?.paintName || "-"
    );
  };

  const showPaintTypeColumn = (type) => type === "Paints";

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold">Product Dashboard</h5>

        <div className="d-flex gap-2">
          <Form.Select
            value={city || ""}
            onChange={(e) => setCity(e.target.value)}
            style={{ height: "36px", fontSize: "12px" }}
          >
            {cities.map((c) => (
              <option key={c?._id} value={c?.city || ""}>
                {c?.city || ""}
              </option>
            ))}
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

      {/* Drag and Drop Context */}
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
                  <th style={{ width: "50px" }}>Drag</th>
                  <th>Product Name</th>

                  {type === "Packages" ? (
                    <>
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
                      {showPaintTypeColumn(type) && <th>Paint</th>}
                    </>
                  )}

                  <th>Actions</th>
                </tr>
              </thead>

              <Droppable droppableId={type}>
                {(provided, snapshot) => (
                  <tbody
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? '#f8f9fa' : 'inherit',
                    }}
                  >
                    {(productsByType[type] || []).map((product, index) => (
                      <Draggable
                        key={`${type}-${product._id}`}
                        draggableId={`${type}-${product._id}`}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              backgroundColor: snapshot.isDragging ? '#e9ecef' : 'inherit',
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            <td
                              {...provided.dragHandleProps}
                              style={{
                                cursor: 'grab',
                                textAlign: 'center',
                                verticalAlign: 'middle'
                              }}
                            >
                              <FaGripVertical />
                            </td>
                            <td>
                              {product.type === "Special" && type === "Paints" && (
                                <FaStar className="text-warning me-2" />
                              )}
                              {type === "Packages"
                                ? product.packageName
                                : product.paintName || product.name}
                            </td>

                            {type === "Packages" ? (
                              <>
                                <td>{getPkgPaintName(product, "Interior", "Ceiling")}</td>
                                <td>{getPkgPaintName(product, "Interior", "Walls")}</td>
                                <td>{getPkgPaintName(product, "Exterior", "Ceiling")}</td>
                                <td>{getPkgPaintName(product, "Exterior", "Walls")}</td>
                                <td>{getPkgPaintName(product, "Others", "Others")}</td>
                              </>
                            ) : (
                              <>
                                <td>₹{product.paintPrice || product.price}</td>
                                <td>{product.description}</td>
                                {showPaintTypeColumn(type) && (
                                  <td>{product.paintType || product.type}</td>
                                )}
                              </>
                            )}

                            <td>
                              <Button
                                variant=""
                                className="me-1"
                                onClick={() => handleEdit(type, index)}
                              >
                                <FaEdit />
                              </Button>
                              <Button variant="" onClick={() => handleDelete(type, index)}>
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
        selectedProductType={selectedProductType}
        setSelectedProductType={setSelectedProductType}
        editingProduct={editingProduct}
        cities={cities}
        selectedCity={city}
      />
    </Container>
  );
};

const ProductModal = ({
  show,
  onClose,
  onSave,
  selectedProductType,
  setSelectedProductType,
  editingProduct,
  cities,
  selectedCity,
}) => {
  const [product, setProduct] = useState({
    city: selectedCity || "",
    name: "",
    description: "",
    price: "",
    type: "Normal",
    productType: selectedProductType || "",
    details: [
      { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Interior", includePuttyOnFresh: true, includePuttyOnRepaint: false },
      { itemName: "Walls", paintName: "", paintPrice: 0, category: "Interior", includePuttyOnFresh: true, includePuttyOnRepaint: false },
      { itemName: "Ceiling", paintName: "", paintPrice: 0, category: "Exterior", includePuttyOnFresh: true, includePuttyOnRepaint: false },
      { itemName: "Walls", paintName: "", paintPrice: 0, category: "Exterior", includePuttyOnFresh: true, includePuttyOnRepaint: false },
      { itemName: "Others", paintName: "", paintPrice: 0, category: "Others", includePuttyOnFresh: true, includePuttyOnRepaint: false },
    ],
  });

  const [paintsList, setPaintsList] = useState([]);
  const [loadingPaints, setLoadingPaints] = useState(false);

  const isPackages = product.productType === "Packages";
  const isPaints = product.productType === "Paints";

  useEffect(() => {
    const fetchPaints = async () => {
      try {
        if (!show) return;
        if (!isPackages) return;
        if (!product.city) {
          setPaintsList([]);
          return;
        }

        setLoadingPaints(true);

        const res = await fetch(
          `${BASE_URL}/products/get-products-by-type?productType=${encodeURIComponent(
            "Paints"
          )}&city=${encodeURIComponent(product.city)}`
        );

        const result = await res.json();

        if (res.ok && Array.isArray(result?.data)) {
          setPaintsList(result.data);
        } else {
          setPaintsList([]);
        }
      } catch (e) {
        console.error("Error fetching Paints list:", e);
        setPaintsList([]);
      } finally {
        setLoadingPaints(false);
      }
    };

    fetchPaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, isPackages, product.city]);

  useEffect(() => {
    try {
      if (editingProduct) {
        const isPackage = editingProduct.productType === "Packages";
        const pkgCity = isPackage ? editingProduct?.details?.[0]?.city : editingProduct.city;

        setProduct((prev) => ({
          ...prev,
          city: pkgCity || "",
          name: isPackage
            ? editingProduct.packageName || ""
            : editingProduct.paintName || editingProduct.name || "",
          description: editingProduct.description || "",
          price: isPackage ? "" : editingProduct.paintPrice || editingProduct.price || "",
          type: editingProduct.paintType || editingProduct.type || "Normal",
          productType: editingProduct.productType || selectedProductType || "",
          details: editingProduct.details ? editingProduct.details.map((d) => ({ ...d })) : prev.details,
        }));
      } else {
        setProduct((prev) => ({
          ...prev,
          city: selectedCity || "",
          name: "",
          description: "",
          price: "",
          type: "Normal",
          productType: selectedProductType || "",
        }));
      }
    } catch (e) {
      console.error("Modal hydrate error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct, selectedProductType, show, selectedCity]);

  const handleChange = (e) => {
    try {
      const { name, value } = e.target;

      if (name === "productType") {
        setProduct((prev) => ({ ...prev, productType: value, type: "Normal" }));
        setSelectedProductType(value);
        return;
      }

      if (name === "city") {
        setProduct((prev) => ({
          ...prev,
          city: value,
          details:
            prev.productType === "Packages"
              ? prev.details.map((d) => ({
                  ...d,
                  paintName: "",
                  paintPrice: 0,
                  includePuttyOnFresh: true,
                  includePuttyOnRepaint: false,
                }))
              : prev.details,
        }));
        return;
      }

      if (name.startsWith("details.paintName")) {
        const index = parseInt(name.split(".")[2], 10);

        const selectedPaint =
          paintsList.find((p) => (p?.name || p?.paintName) === value) || null;

        const updated = [...product.details];
        updated[index] = {
          ...updated[index],
          paintName: value,
          paintPrice: Number(selectedPaint?.price ?? selectedPaint?.paintPrice ?? 0) || 0,
          includePuttyOnFresh:
            typeof selectedPaint?.includePuttyOnFresh === "boolean"
              ? selectedPaint.includePuttyOnFresh
              : true,
          includePuttyOnRepaint:
            typeof selectedPaint?.includePuttyOnRepaint === "boolean"
              ? selectedPaint.includePuttyOnRepaint
              : false,
        };

        setProduct((prev) => ({ ...prev, details: updated }));
        return;
      }

      setProduct((prev) => ({ ...prev, [name]: value }));
    } catch (err) {
      console.error("handleChange error:", err);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editingProduct ? "Edit Product" : "Add Product"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Select className="mb-2" name="city" value={product.city || ""} onChange={handleChange}>
          <option value="">Select City</option>
          {Array.isArray(cities) &&
            cities.map((c) => (
              <option key={c?._id} value={c?.city || ""}>
                {c?.city || ""}
              </option>
            ))}
        </Form.Select>

        <Form.Control
          className="mb-2"
          placeholder={product.productType === "Packages" ? "Package Name" : "Product Name"}
          name="name"
          value={product.name}
          onChange={handleChange}
        />

        {isPackages ? (
          <>
            {product.details.map((detail, idx) => (
              <div key={idx} className="mb-2">
                <Form.Label>
                  {detail.category} {detail.itemName}
                </Form.Label>

                <Form.Select
                  name={`details.paintName.${idx}`}
                  value={detail.paintName || ""}
                  onChange={handleChange}
                  disabled={!product.city}
                >
                  <option value="">
                    {loadingPaints ? "Loading paints..." : "-- Select Paint Product --"}
                  </option>

                  {paintsList.map((p) => {
                    const nm = p?.name || p?.paintName || "";
                    if (!nm) return null;
                    return (
                      <option key={p?._id || nm} value={nm}>
                        {nm}
                      </option>
                    );
                  })}
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

            {isPaints && (
              <Form.Select className="mb-2" name="type" value={product.type} onChange={handleChange}>
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
          disabled={
            !product.productType ||
            !product.name ||
            !product.city ||
            (!isPackages && !product.price) ||
            (isPackages && product.details.some((d) => !d.paintName))
          }
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





// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Table,
//   Container,
//   Row,
//   Col,
//   Form,
//   Modal,
//   Button,
// } from "react-bootstrap";
// import { FaPlus, FaEdit, FaTrash, FaStar } from "react-icons/fa";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
// import { useNavigate } from "react-router-dom";
// import { BASE_URL } from "../utils/config";
// import axios from "axios";

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

// const finishingTypes = [
//   "Texture",
//   "Chemical Waterproofing",
//   "Terrace Waterproofing",
//   "Tile Grouting",
//   "POP",
//   "Wood Polish",
// ];

// const ProductsDashboard = () => {
//   const [city, setCity] = useState("");
//   const [cities, setCities] = useState([]);

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

//   // Fetch city list
//   useEffect(() => {
//     const fetchCities = async () => {
//       try {
//         const res = await axios.get(`${BASE_URL}/city/city-list`);
//         const list = Array.isArray(res?.data?.data) ? res.data.data : [];
//         setCities(list);
//         if (list.length > 0) setCity(list[0]?.city || "");
//       } catch (err) {
//         console.error("Error fetching city list:", err);
//         setCities([]);
//         setCity("");
//       }
//     };
//     fetchCities();
//   }, []);

//   // Fetch pricing config
//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch(`${BASE_URL}/service/latest`);
//         const result = await res.json();
//         if (res.ok) setSavedPricing(result.data);
//       } catch (e) {
//         console.error("Failed to fetch pricing:", e);
//       }
//     })();
//   }, []);

//   const fectchData = async () => {
//     try {
//       const productsData = {};
//       productTypes.forEach((t) => (productsData[t] = []));

//       // 1) Paints by city
//       const paintsRes = await fetch(
//         `${BASE_URL}/products/get-products-by-type?productType=${encodeURIComponent(
//           "Paints",
//         )}&city=${encodeURIComponent(city)}`,
//       );
//       const paintsResult = await paintsRes.json();
//       if (paintsRes.ok) productsData["Paints"] = paintsResult.data || [];

//       // 2) Packages by city
//       const packagesRes = await fetch(
//         `${BASE_URL}/products/get-products-by-type?productType=${encodeURIComponent(
//           "Packages",
//         )}&city=${encodeURIComponent(city)}`,
//       );
//       const packagesResult = await packagesRes.json();
//       if (packagesRes.ok) productsData["Packages"] = packagesResult.data || [];

//       // 3) Finishing types by city (fetch all finishing then split)
//       const finishingRes = await fetch(
//         `${BASE_URL}/products/get-all-finishing-paints?city=${encodeURIComponent(
//           city,
//         )}`,
//       );
//       const finishingResult = await finishingRes.json();
//       if (finishingRes.ok && Array.isArray(finishingResult.data)) {
//         finishingResult.data.forEach((p) => {
//           if (productTypes.includes(p.productType)) {
//             productsData[p.productType].push(p);
//           }
//         });
//       }

//       setProductsByType(productsData);
//     } catch (e) {
//       console.error("Failed to fetch products:", e);
//     }
//   };
//   // ✅ Fetch all products BY CITY (initial + when city changes)
//   useEffect(() => {
//     if (!city) return;
//     fectchData();
//   }, [city]);

//   const handlePricingSave = async () => {
//     if (siteVisitCharge === "" || vendorCoins === "" || puttyPrice === "") {
//       alert("Please enter all values");
//       return;
//     }

//     try {
//       const res = await fetch(`${BASE_URL}/service/create`, {
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

//   // ✅ Save or update product
//   const handleSave = async (product) => {
//     try {
//       let payload;
//       let endpoint;
//       const method = editingProduct ? "PUT" : "POST";

//       if (product.productType === "Packages") {
//         payload = {
//           packageName: product.name,
//           details: (product.details || []).map((d) => ({
//             itemName: d.itemName,
//             paintName: d.paintName,
//             paintPrice: Number(d.paintPrice) || 0,
//             category: d.category,
//             paintType: d.paintType || "Normal",
//             includePuttyOnFresh: !!d.includePuttyOnFresh,
//             includePuttyOnRepaint: !!d.includePuttyOnRepaint,
//             city: product.city || "", // ✅ store city inside details
//           })),
//         };

//         endpoint = editingProduct
//           ? `update-package/${editingProduct._id}`
//           : "add-package";
//       } else if (finishingTypes.includes(product.productType)) {
//         payload = {
//           paintName: product.name,
//           paintPrice: Number(product.price) || 0,
//           description: product.description || "",
//           productType: product.productType,
//           paintType: product.type || "Normal",
//           city: product.city || "",
//         };

//         endpoint = editingProduct
//           ? `update-finishing-paint/${editingProduct._id}`
//           : "add-finishing-paints";
//       } else {
//         payload = {
//           productType: product.productType,
//           name: product.name,
//           price: Number(product.price) || 0,
//           description: product.description || "",
//           isSpecial: product.type === "Special",
//           type: product.type || "Normal",
//           includePuttyOnFresh:
//             product.type === "Normal" && product.productType === "Paints",
//           includePuttyOnRepaint: false,
//           city: product.city || "",
//         };

//         endpoint = editingProduct
//           ? `update-paint/${editingProduct._id}`
//           : "add-paint";
//       }

//       const res = await fetch(`${BASE_URL}/products/${endpoint}`, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         alert(data.message || "Something went wrong");
//         return;
//       }

//       // ✅ Refresh lists by city (no reload)
//       // simplest: trigger refetch by re-setting city (same value)
//       setCity((prev) => prev);
//       fectchData()
//     } catch (e) {
//       console.error("Error saving product:", e);
//       alert("Server error");
//     } finally {
//       setShowModal(false);
//       setEditingProduct(null);
//     }
//   };

//   const handleDelete = async (type, index) => {
//     try {
//       const productId = productsByType[type][index]._id;

//       const endpoint =
//         type === "Packages"
//           ? "delete-package"
//           : finishingTypes.includes(type)
//             ? "delete-finishing-paint"
//             : "delete-paint";

//       const res = await fetch(`${BASE_URL}/products/${endpoint}/${productId}`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         alert(data.message || "Something went wrong");
//         return;
//       }

//       setProductsByType((prev) => {
//         const updated = [...(prev[type] || [])];
//         updated.splice(index, 1);
//         return { ...prev, [type]: updated };
//       });

//     } catch (e) {
//       console.error("Error deleting product:", e);
//       alert("Server error");
//     }
//   };

//   const handleEdit = (type, index) => {
//     const prod = productsByType[type][index];

//     // Packages city is inside details[0].city
//     const pkgCity =
//       type === "Packages" ? prod?.details?.[0]?.city || "" : prod?.city || "";

//     setEditingProduct({
//       ...prod,
//       productType: type,
//       name:
//         type === "Packages" ? prod.packageName : prod.paintName || prod.name,
//       price: prod.paintPrice || prod.price,
//       type: prod.paintType || prod.type || "Normal",
//       city: pkgCity || city || "",
//       index,
//       _id: prod._id,
//     });

//     setSelectedProductType(type);
//     setShowModal(true);
//   };

//   // ✅ Drag & Drop FIX (style must be applied on <tr>)
//   const handleDragEnd = (result) => {
//     if (!result.destination) return;

//     const sourceType = result.source.droppableId;
//     if (result.destination.droppableId !== sourceType) return;

//     setProductsByType((prev) => {
//       const reordered = Array.from(prev[sourceType] || []);
//       const [moved] = reordered.splice(result.source.index, 1);
//       reordered.splice(result.destination.index, 0, moved);
//       return { ...prev, [sourceType]: reordered };
//     });
//   };

//   // ✅ column visibility: paintType ONLY for Paints
//   const showPaintTypeColumn = (type) => type === "Paints";

//   return (
//     <Container className="py-4">
//       <div className="d-flex justify-content-between align-items-center mb-4">
//         <h5 className="fw-bold">Product Dashboard</h5>

//         <div className="d-flex gap-2">
//           <Form.Select
//             value={city || ""}
//             onChange={(e) => setCity(e.target.value)}
//             style={{ height: "36px", fontSize: "12px" }}
//           >
//             {cities.map((c) => (
//               <option key={c?._id} value={c?.city || ""}>
//                 {c?.city || ""}
//               </option>
//             ))}
//           </Form.Select>

//           <Form.Select
//             value={category}
//             onChange={(e) => {
//               const selected = e.target.value;
//               setCategory(selected);
//               if (selected === "Deep Cleaning")
//                 navigate("/deep-cleaning-dashboard");
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
//                       {showPaintTypeColumn(type) && <th>Paint Type</th>}
//                     </>
//                   )}

//                   <th>Actions</th>
//                 </tr>
//               </thead>

//               <Droppable droppableId={type}>
//                 {(provided) => (
//                   <tbody ref={provided.innerRef} {...provided.droppableProps}>
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
//                             style={{
//                               ...providedDrag.draggableProps.style, // ✅ REQUIRED for DnD in table
//                               textAlign: "center",
//                               fontSize: "12px",
//                             }}
//                           >
//                             <td>
//                               {product.type === "Special" &&
//                                 type === "Paints" && (
//                                   <FaStar className="text-warning me-2" />
//                                 )}
//                               {type === "Packages"
//                                 ? product.packageName
//                                 : product.paintName || product.name}
//                             </td>

//                             {type === "Packages" ? (
//                               <>
//                                 <td>₹{product.packagePrice}</td>
//                                 <td>
//                                   {product.details?.find(
//                                     (d) =>
//                                       d.category === "Interior" &&
//                                       d.itemName === "Ceiling",
//                                   )?.paintName || ""}
//                                 </td>
//                                 <td>
//                                   {product.details?.find(
//                                     (d) =>
//                                       d.category === "Interior" &&
//                                       d.itemName === "Walls",
//                                   )?.paintName || ""}
//                                 </td>
//                                 <td>
//                                   {product.details?.find(
//                                     (d) =>
//                                       d.category === "Exterior" &&
//                                       d.itemName === "Ceiling",
//                                   )?.paintName || ""}
//                                 </td>
//                                 <td>
//                                   {product.details?.find(
//                                     (d) =>
//                                       d.category === "Exterior" &&
//                                       d.itemName === "Walls",
//                                   )?.paintName || ""}
//                                 </td>
//                                 <td>
//                                   {product.details?.find(
//                                     (d) =>
//                                       d.category === "Others" &&
//                                       d.itemName === "Others",
//                                   )?.paintName || ""}
//                                 </td>
//                               </>
//                             ) : (
//                               <>
//                                 <td>₹{product.paintPrice || product.price}</td>
//                                 <td>{product.description}</td>
//                                 {showPaintTypeColumn(type) && (
//                                   <td>{product.paintType || product.type}</td>
//                                 )}
//                               </>
//                             )}

//                             <td>
//                               <Button
//                                 variant=""
//                                 className="me-1"
//                                 onClick={() => handleEdit(type, idx)}
//                               >
//                                 <FaEdit />
//                               </Button>
//                               <Button
//                                 variant=""
//                                 onClick={() => handleDelete(type, idx)}
//                               >
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
//         cities={cities}
//         selectedCity={city}
//       />
//     </Container>
//   );
// };

// const ProductModal = ({
//   show,
//   onClose,
//   onSave,
//   selectedProductType,
//   setSelectedProductType,
//   editingProduct,
//   cities,
//   selectedCity,
// }) => {
//   const [product, setProduct] = useState({
//     city: selectedCity || "", // ✅ default city
//     name: "",
//     description: "",
//     price: "",
//     type: "Normal",
//     productType: selectedProductType || "",
//     details: [
//       {
//         itemName: "Ceiling",
//         paintName: "",
//         paintPrice: 0,
//         category: "Interior",
//         paintType: "Normal",
//         includePuttyOnFresh: true,
//         includePuttyOnRepaint: false,
//       },
//       {
//         itemName: "Walls",
//         paintName: "",
//         paintPrice: 0,
//         category: "Interior",
//         paintType: "Normal",
//         includePuttyOnFresh: true,
//         includePuttyOnRepaint: false,
//       },
//       {
//         itemName: "Ceiling",
//         paintName: "",
//         paintPrice: 0,
//         category: "Exterior",
//         paintType: "Normal",
//         includePuttyOnFresh: true,
//         includePuttyOnRepaint: false,
//       },
//       {
//         itemName: "Walls",
//         paintName: "",
//         paintPrice: 0,
//         category: "Exterior",
//         paintType: "Normal",
//         includePuttyOnFresh: true,
//         includePuttyOnRepaint: false,
//       },
//       {
//         itemName: "Others",
//         paintName: "",
//         paintPrice: 0,
//         category: "Others",
//         paintType: "Normal",
//         includePuttyOnFresh: true,
//         includePuttyOnRepaint: false,
//       },
//     ],
//   });

//   const [allPaints, setAllPaints] = useState([]);

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await fetch(
//           `${BASE_URL}/products/get-all-finishing-paints`,
//         );
//         const result = await res.json();
//         if (res.ok) setAllPaints(result.data || []);
//       } catch (e) {
//         console.error("Error fetching finishing paints:", e);
//       }
//     })();
//   }, []);

//   useEffect(() => {
//     if (editingProduct) {
//       const isPackage = editingProduct.productType === "Packages";
//       const pkgCity = isPackage
//         ? editingProduct?.details?.[0]?.city
//         : editingProduct.city;

//       setProduct({
//         city: pkgCity || "",
//         name: isPackage
//           ? editingProduct.packageName || ""
//           : editingProduct.paintName || editingProduct.name || "",
//         description: editingProduct.description || "",
//         price: isPackage
//           ? ""
//           : editingProduct.paintPrice || editingProduct.price || "",
//         type: editingProduct.paintType || editingProduct.type || "Normal",
//         productType: editingProduct.productType || selectedProductType || "",
//         details: editingProduct.details
//           ? editingProduct.details.map((d) => ({ ...d }))
//           : product.details,
//       });
//     } else {
//       setProduct((prev) => ({
//         ...prev,
//         city: selectedCity || "",
//         name: "",
//         description: "",
//         price: "",
//         type: "Normal",
//         productType: selectedProductType || "",
//       }));
//     }
//   }, [editingProduct, selectedProductType, show, selectedCity]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "productType") {
//       setProduct((prev) => ({ ...prev, productType: value, type: "Normal" }));
//       setSelectedProductType(value);
//       return;
//     }

//     if (name === "city") {
//       setProduct((prev) => ({ ...prev, city: value }));
//       return;
//     }

//     if (name.startsWith("details.paintName")) {
//       const index = parseInt(name.split(".")[2], 10);
//       const selectedPaint = allPaints.find((p) => p.paintName === value);

//       const updated = [...product.details];
//       updated[index] = {
//         ...updated[index],
//         paintName: value,
//         paintPrice: selectedPaint ? selectedPaint.paintPrice : 0,
//         paintType: selectedPaint ? selectedPaint.paintType : "Normal",
//         includePuttyOnFresh: selectedPaint
//           ? selectedPaint.includePuttyOnFresh
//           : true,
//         includePuttyOnRepaint: selectedPaint
//           ? selectedPaint.includePuttyOnRepaint
//           : false,
//       };

//       setProduct((prev) => ({ ...prev, details: updated }));
//       return;
//     }

//     setProduct((prev) => ({ ...prev, [name]: value }));
//   };

//   const isPackages = product.productType === "Packages";
//   const isPaints = product.productType === "Paints";

//   return (
//     <Modal show={show} onHide={onClose} centered size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>
//           {editingProduct ? "Edit Product" : "Add Product"}
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Form.Select
//           className="mb-2"
//           name="city"
//           value={product.city || ""}
//           onChange={handleChange}
//         >
//           <option value="">Select City</option>
//           {Array.isArray(cities) &&
//             cities.map((c) => (
//               <option key={c?._id} value={c?.city || ""}>
//                 {c?.city || ""}
//               </option>
//             ))}
//         </Form.Select>

//         <Form.Control
//           className="mb-2"
//           placeholder={isPackages ? "Package Name" : "Product Name"}
//           name="name"
//           value={product.name}
//           onChange={handleChange}
//         />

//         {isPackages ? (
//           <>
//             {product.details.map((detail, idx) => (
//               <div key={idx} className="mb-2">
//                 <Form.Label>
//                   {detail.category} {detail.itemName}
//                 </Form.Label>
//                 <Form.Select
//                   name={`details.paintName.${idx}`}
//                   value={detail.paintName}
//                   onChange={handleChange}
//                 >
//                   <option value="">-- Select Paint --</option>
//                   {allPaints.map((p) => (
//                     <option key={p._id} value={p.paintName}>
//                       {p.paintName}
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

//             {/* ✅ ONLY for Paints show Normal/Special selector */}
//             {isPaints && (
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
//           disabled={
//             !product.productType ||
//             !product.name ||
//             !product.city ||
//             (!isPackages && !product.price)
//           }
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


