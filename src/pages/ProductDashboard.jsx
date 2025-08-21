import React, { useState, useEffect } from "react";
import { Table, Container, Row, Col, Form, Modal, Button } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaStar } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";

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

  // Fetch pricing configuration
  useEffect(() => {
    const fetchSavedPricing = async () => {
      try {
        const res = await fetch("https://homjee-backend.onrender.com/api/service/latest");
        const result = await res.json();
        if (res.ok) {
          setSavedPricing(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch pricing:", error);
      }
    };

    fetchSavedPricing();
  }, []);

  // Fetch products for all product types
useEffect(() => {
  const fetchProducts = async () => {
    try {
      const productsData = {};
      for (const type of productTypes) {
        const res = await fetch(
          `https://homjee-backend.onrender.com/api/products/get-products-by-type?productType=${encodeURIComponent(type)}`
        );
        const result = await res.json();
        productsData[type] = res.ok ? (result.data || []) : [];
      }
      setProductsByType(productsData);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };
  fetchProducts();
}, []);


  // Save pricing configuration
  const handlePricingSave = async () => {
    if (!siteVisitCharge || !vendorCoins || !puttyPrice) {
      alert("Please enter all values");
      return;
    }

    try {
      const response = await fetch("https://homjee-backend.onrender.com/api/service/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteVisitCharge: Number(siteVisitCharge),
          vendorCoins: Number(vendorCoins),
          puttyPrice: Number(puttyPrice),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Saved successfully");
        setSavedPricing(data.data);
        setSiteVisitCharge("");
        setVendorCoins("");
        setPuttyPrice("");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Error saving pricing:", err);
      alert("Server error");
    }
  };

  // Save or update product
  const handleSave = async (product) => {
    try {
      const payload = {
        productType: product.productType,
        name: product.name,
        price: Number(product.price),
        description: product.description,
        isSpecial:product.type === 'Normal' ? false : true,
        type: product.type || "Normal",
        ...(product.productType === "Packages" && {
          interiorCeiling: product.interiorCeiling || "",
          interiorWalls: product.interiorWalls || "",
          exteriorCeiling: product.exteriorCeiling || "",
          exteriorWalls: product.exteriorWalls || "",
          others: product.others || "",
        }),
      };

      let response;
      if (editingProduct) {
        // Update existing product
        response = await fetch(
          `https://homjee-backend.onrender.com/api/products/${product.productType}/${editingProduct._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Create new product
        response = await fetch("https://homjee-backend.onrender.com/api/products/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (response.ok) {
        // Update local state with the latest products
       const updatedProducts = await fetch(
  `https://homjee-backend.onrender.com/api/products/get-products-by-type?productType=${encodeURIComponent(product.productType)}`
).then((res) => res.json());

        setProductsByType((prev) => ({
          ...prev,
          [product.productType]: updatedProducts.data || [],
        }));
        alert(editingProduct ? "Product updated successfully" : "Product added successfully");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Server error");
    }
    setShowModal(false);
    setEditingProduct(null);
  };

  // Delete product
  const handleDelete = async (type, index) => {
    try {
      const productId = productsByType[type][index]._id;
      const response = await fetch(
        `https://homjee-backend.onrender.com/api/products/${type}/${productId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setProductsByType((prev) => {
          const updated = [...prev[type]];
          updated.splice(index, 1);
          return { ...prev, [type]: updated };
        });
        alert("Product deleted successfully");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Server error");
    }
  };

  const handleEdit = (type, index) => {
  setEditingProduct({ type, index });
  setSelectedProductType(type);
  setShowModal(true);
};


  // Handle drag-and-drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const sourceType = result.source.droppableId;
    const reordered = Array.from(productsByType[sourceType]);
    const [movedItem] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, movedItem);
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
              if (selected === "Deep Cleaning") {
                navigate("/deep-cleaning-dashboard");
              }
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
        {productTypes.map((type, index) => (
          <div key={index}>
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
                      {/* {type === "Paints" && (
                        <>
                          <th>Paint Type</th>
                          <th>Putty on Fresh</th>
                          <th>Putty on Repaint</th>
                        </>
                      )} */}
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
                        {(provided) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <td>
                              {product.type === "Special" && type === "Paints" && (
                                <FaStar className="text-warning me-2" />
                              )}
                              {product.name}
                            </td>
                            {type === "Packages" ? (
                              <>
                                <td>{product.interiorCeiling}</td>
                                <td>{product.interiorWalls}</td>
                                <td>{product.exteriorCeiling}</td>
                                <td>{product.exteriorWalls}</td>
                                <td>{product.others}</td>
                              </>
                            ) : (
                              <>
                                <td>₹{product.price}</td>
                                <td>{product.description}</td>
                                 <td>{product.type}</td>
                                {/* {type === "Paints" && (
                                  <>
                                    <td>{product.type}</td>
                                    <td>{product.includePuttyOnFresh ? "Yes" : "No"}</td>
                                    <td>{product.includePuttyOnRepaint ? "Yes" : "No"}</td>
                                  </>
                                )} */}
                              </>
                            )}
                            <td>
                              <Button
                                variant=""
                                className="me-1"
                                onClick={() => handleEdit(type, idx)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant=""
                                onClick={() => handleDelete(type, idx)}
                              >
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
        editingProduct={
          editingProduct ? productsByType[editingProduct.type][editingProduct.index] : null
        }
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
    price: "",
    description: "",
    type: "Normal",
    productType: selectedProductType || "",
    includePuttyOnFresh: false,
    includePuttyOnRepaint: false,
    interiorCeiling: "",
    interiorWalls: "",
    exteriorCeiling: "",
    exteriorWalls: "",
    others: "",
  });
  const [paintNames, setPaintNames] = useState([]);


  useEffect(() => {
    if (selectedProductType === "Packages") {
      const fetchPaintNames = async () => {
        try {
          const res = await fetch("https://homjee-backend.onrender.com/api/products/paints/names");
          const result = await res.json();
          if (res.ok) {
            setPaintNames(result.data || []);
          } else {
            console.error("Failed to fetch paint names:", result.message);
          }
        } catch (error) {
          console.error("Error fetching paint names:", error);
        }
      };
      fetchPaintNames();
    }
  }, [selectedProductType]);


  useEffect(() => {
    if (editingProduct) {
      setProduct({ ...editingProduct });
    } else {
      setProduct({
        name: "",
        price: "",
        description: "",
        type: "Normal",
        productType: selectedProductType || "",
        includePuttyOnFresh: selectedProductType === "Paints",
        includePuttyOnRepaint: false,
        interiorCeiling: "",
        interiorWalls: "",
        exteriorCeiling: "",
        exteriorWalls: "",
        others: "",
      });
    }
  }, [editingProduct, show, selectedProductType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "type" && product.productType === "Paints") {
      // Set type and let backend handle includePutty fields
      setProduct({ ...product, type: value });
    } else if (name === "productType") {
      setProduct({
        ...product,
        productType: value,
        type: "Normal",
        includePuttyOnFresh: value === "Paints",
        includePuttyOnRepaint: false,
      });
      setSelectedProductType(value);
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

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
            {[
              "interiorCeiling",
              "interiorWalls",
              "exteriorCeiling",
              "exteriorWalls",
              "others",
            ].map((key, idx) => (
              <Form.Select
                key={idx}
                className="mb-2"
                name={key}
                value={product[key]}
                onChange={handleChange}
              >
                <option value="">-- Select {key.replace(/([A-Z])/g, " $1")} Paint --</option>
                {paintNames.map((paintName) => (
                  <option key={paintName} value={paintName}>
                    {paintName}
                  </option>
                ))}
              </Form.Select>
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
            {product.productType === "Paints" && (
              <>
                <Form.Select
                  className="mb-2"
                  name="type"
                  value={product.type}
                  onChange={handleChange}
                >
                  <option value="Normal">Normal</option>
                  <option value="Special">Special</option>
                </Form.Select>
              </>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" onClick={() => onSave(product)}>
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