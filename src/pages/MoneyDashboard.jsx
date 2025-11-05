// import React, { useState } from "react";
// import { Modal, Button, Table, Form, Container, Row, Col, Card } from "react-bootstrap";
// import { FaArrowUp, FaArrowDown } from "react-icons/fa";
// import { CSVLink } from "react-csv";

// const MoneyDashboard = () => {
//   const [showModal, setShowModal] = useState(false);
//   const [payments, setPayments] = useState([
//     {
//       date: "2025-02-12 10:30 AM",
//       customer: "John Doe",
//       vendor: "Vendor A",
//       context: "Booking Payment",
//       paymentId: "PAY12345",
//       amount: "2000",
//       service: "House Painting",
//       status: "Paid",
//       city: "bengaluru",
//     },
//     {
//       date: "2025-02-11 02:45 PM",
//       customer: "Jane Smith",
//       vendor: "Vendor B",
//       context: "Second Partial Payment",
//       paymentId: "PAY12346",
//       amount: "5500",
//       service: "Deep Cleaning",
//       status: "Pending",
//       city: "Mumbai",
//     },
//     {
//       date: "2025-02-10 01:15 PM",
//       customer: "Michael Johnson",
//       vendor: "Vendor C",
//       context: "Advance Payment",
//       paymentId: "PAY12347",
//       amount: "8000",
//       service: "Home Renovation",
//       status: "Pending",
//       city: "Mumbai",
//     }
//   ]);
//   const [filters, setFilters] = useState({ city: "", service: "", period: "" });
//   const [formData, setFormData] = useState({
//     type: "customer", // Default selection
//     name: "",
//     phone: "",
//     amount: "",
//     service: "",
//     city: "",
//     context: "others",
//   });

//   const [filter, setFilter] = useState("paid");

//   const filteredPayments = payments.filter((payment) =>
//     filter === "paid" ? payment.status === "Paid" : payment.status === "Pending"
//   );

//   const totalSales = 5000000;
//   const pendingAmount = 1200000;
//   const trendUp = true;

//   const handleInputChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const generatePaymentLink = () => {
//     const newPayment = {
//       date: new Date().toLocaleString(),
//       customer: formData.name,
//       vendor: "Vendor Name",
//       context: formData.comment,
//       paymentId: Math.random().toString(36).substr(2, 9),
//       amount: formData.amount,
//       service: formData.service,
//     };
//     setPayments([...payments, newPayment]);
//     setShowModal(false);
//   };


//   return (
//     <Container className="mt-4" style={{marginLeft:"", fontFamily:'Poppins, sans-serif'}}>
//       <Row className="mb-3 align-items-center">
//         <Col><h5 className="fw-bold" style={{}}>Money Dashboard</h5></Col>
//         <Col className="d-flex justify-content-end gap-2">
//           <Form.Select className="w-auto" style={{ height: "38px", fontSize:'12px' }} onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
//             <option value="">Select City</option>
//             <option value="Bangalore">Bangalore</option>
//             <option value="Pune">Pune</option>
//           </Form.Select>
//           <Form.Select className="w-auto" style={{ height: "38px", fontSize:'12px' }} onChange={(e) => setFilters({ ...filters, service: e.target.value })}>
//             <option value="">Select Service</option>
//             <option value="House Painting">House Painters & WaterProffing</option>
//             <option value="Deep Cleaning">Deep Cleaning</option>
//             <option value="Deep Cleaning">Home Interior</option>
//             <option value="Deep Cleaning">Packers & Movers</option>
//           </Form.Select>
//           <Form.Select className="w-auto" style={{ height: "38px", fontSize:'12px' }} onChange={(e) => setFilters({ ...filters, period: e.target.value })}>
//             <option value="">Select Period</option>
//             <option value="Last 7 Days">Last 7 Days</option>
//             <option value="Last 30 Days">Last 30 Days</option>
//             <option value="Last 30 Days">This Month</option>
//             <option value="Last 30 Days">Lost Month</option>
//             <option value="Last 30 Days">All Time</option>

//           </Form.Select>
//           <Button 
//     style={{ 
//         whiteSpace: 'nowrap', 
//         color: 'black', 
//         fontSize: '12px', 
//         fontWeight:'700',
//         border: '1px solid #000', 
//         borderRadius: '4px',
//         backgroundColor: 'transparent',
//         outline: 'none',
//         boxShadow: 'none'
//     }} 
//     onClick={() => setShowModal(true)}
// >
//     Create Payment Link
// </Button>

//         </Col>
//       </Row>

//       <Row className="mb-4">
//         <Col md={6}>
//           <Card className="p-3 shadow-sm">
//             <h6 className="fw-bold" style={{fontSize:'14px'}}>Total Sales: ₹{totalSales.toLocaleString()} <span className="fw-bold " style={{color:'green'}}>{trendUp ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +10%</span></h6>
//             <p style={{fontSize:'12px', marginBottom:'1%'}}>Online Payment Received :2,43,878 <span className="fw-bold " style={{color:'green'}}>{trendUp ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +15%</span></p>
//             <p style={{fontSize:'12px'}}>Cash Payment Received :2,430 <span className="fw-bold " style={{color:'green'}}>{trendUp ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +20%</span></p>
//           </Card>
//         </Col>
//         <Col md={6}>
//           <Card className="p-3 shadow-sm">
//             <h6 className="fw-bold"  style={{fontSize:'14px'}}>Amount Yet to Be Collected: ₹{pendingAmount.toLocaleString()} <span className="fw-bold" style={{color:'green'}}>{trendUp ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +5%</span></h6>
//             <p style={{fontSize:'12px', marginBottom:'1%'}}>Coins sold :265 <span className="fw-bold" style={{color:'green'}}>{trendUp ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +5%</span> </p>
//             <p style={{fontSize:'12px'}}>Income from Coins Sale :2635 <span className="fw-bold" style={{color:'green'}}>{trendUp ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +5%</span> </p>
//           </Card>
//         </Col>
//       </Row>

//       <div>
//       <h4 className="fw-bold" style={{fontSize:"14px"}}>Payments List</h4>
//       <div className="mb-3">
//     <button
//         className={`btn ${filter === "paid" ? "btn-dark text-white" : "btn-outline-dark"} me-2`}
//         onClick={() => setFilter("paid")}
//         style={{ fontSize: '12px' }}
//     >
//         Paid List
//     </button>

//     <button
//         className={`btn ${filter === "pending" ? "btn-dark text-white" : "btn-outline-dark"}`}
//         onClick={() => setFilter("pending")}
//         style={{ fontSize: '12px' }}
//     >
//         Pending List
//     </button>
// </div>

//       <Table striped bordered hover>
//         <thead>
//           <tr style={{fontSize:'12px'}}>
//             <th>Date & Time</th>
//             <th>Customer</th>
//             <th>Order Id</th>
//             <th>Vendor</th>
//             <th>Context</th>
//             <th>Payment ID</th>
//             <th>Amount</th>
//             <th>Service</th>
//             <th>City</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredPayments.map((payment, index) => (
//             <tr key={index} style={{fontSize:'12px'}}>
//               <td>{payment.date}</td>
//               <td>{payment.customer}</td>
//               <td>223ASFR</td>
//               <td>{payment.vendor}</td>
//               <td>{payment.context}</td>
//               <td>{payment.paymentId}</td>
//               <td>₹{payment.amount}</td>
//               <td>{payment.service}</td>
//               <td>{payment.city}</td>
//             </tr>
//           ))}
//         </tbody>
//       </Table>
//       <CSVLink data={filteredPayments} filename={`${filter}-payments.csv`} className="btn btn-success mt-3" style={{fontSize:"12px"}}>
//         Export to CSV
//       </CSVLink>
//     </div>

//     <Modal show={showModal} onHide={() => setShowModal(false)}>
//       <Modal.Header closeButton>
//         <Modal.Title style={{fontSize:'16px'}}>Create Payment Link</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form>
//           {/* Customer / Vendor Toggle */}
//           <Form.Group className="mb-3">
//             <Form.Check
//               inline
//               label="Customer"
//               type="radio"
//               name="type"
//               value="customer"
//               checked={formData.type === "customer"}
//               onChange={handleInputChange}
//             />
//             <Form.Check
//               inline
//               label="Vendor"
//               type="radio"
//               name="type"
//               value="vendor"
//               checked={formData.type === "vendor"}
//               onChange={handleInputChange}
//             />
//           </Form.Group>

//           {/* Common Fields */}
//           <Form.Group className="mb-3">
//             <Form.Label>Name:</Form.Label>
//             <Form.Control type="text" name="name" onChange={handleInputChange} />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Phone No.:</Form.Label>
//             <Form.Control type="text" name="phone" onChange={handleInputChange} />
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>Amount:</Form.Label>
//             <Form.Control type="number" name="amount" onChange={handleInputChange} />
//           </Form.Group>

//           {/* Service & City Dropdowns */}
//           <Form.Group className="mb-3">
//             <Form.Label>Service:</Form.Label>
//             <Form.Select name="service" onChange={handleInputChange}>
//               <option value="">Select Service</option>
//               <option value="House Painting">House Painting</option>
//               <option value="Deep Cleaning">Deep Cleaning</option>
//               <option value="Interior">Interior</option>
//               <option value="Packers & Movers">Packers & Movers</option>
//             </Form.Select>
//           </Form.Group>

//           <Form.Group className="mb-3">
//             <Form.Label>City:</Form.Label>
//             <Form.Select name="city" onChange={handleInputChange}>
//               <option value="">Select City</option>
//               <option value="Bangalore">Bangalore</option>
//               <option value="Pune">Pune</option>
//             </Form.Select>
//           </Form.Group>

//           {/* Context Selection for Vendor */}
//           {formData.type === "vendor" && (
//             <Form.Group className="mb-3">
//               <Form.Label>Context:</Form.Label>
//               <Form.Check
//                 type="radio"
//                 label="Others"
//                 name="context"
//                 value="others"
//                 checked={formData.context === "others"}
//                 onChange={handleInputChange}
//               />
//               <Form.Check
//                 type="radio"
//                 label="Coins"
//                 name="context"
//                 value="coins"
//                 checked={formData.context === "coins"}
//                 onChange={handleInputChange}
//               />
//             </Form.Group>
//           )}
//         </Form>
//       </Modal.Body>
//       <Modal.Footer>

//         <Button style={{color:'black', borderColor:'black', backgroundColor:'white', fontWeight:'600'}} onClick={() => generatePaymentLink(formData)}>
//           Generate Payment Link
//         </Button>
//       </Modal.Footer>
//     </Modal>
//     </Container>
//   );
// };

// export default MoneyDashboard;


import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Container, Row, Col, Card } from "react-bootstrap";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { CSVLink } from "react-csv";

const MoneyDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [filters, setFilters] = useState({ city: "", service: "", period: "" });
  const [formData, setFormData] = useState({
    type: "customer",
    name: "",
    phone: "",
    amount: "",
    service: "",
    city: "",
    context: "others",
  });

  const [filter, setFilter] = useState("paid");
  const [totalSales, setTotalSales] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);

  useEffect(() => {
    // Fetch the payment data from the API
    const fetchPayments = async () => {
      const response = await fetch("https://homjee-backend.onrender.com/api/bookings/get-all-leads");
      const data = await response.json();

      if (data && data.allLeads) {
        setPayments(data.allLeads);
        calculateTotals(data.allLeads);
      }
    };

    fetchPayments();
  }, []);

  const calculateTotals = (payments) => {
    let totalSalesCalc = 0;
    let pendingAmountCalc = 0;
    let cashAmountCalc = 0;
    let upiAmountCalc = 0;

    payments.forEach((payment) => {
      // Extracting price and payment status
      const price = payment.service.reduce((total, service) => total + service.price * service.quantity, 0);
      const paymentStatus = payment.bookingDetails.paymentStatus;
      const paymentMethod = payment.bookingDetails.paymentMethod;
      const paidAmount = payment.bookingDetails.paidAmount || 0;


      if (paymentStatus === "Paid") {
        totalSalesCalc += price;

        // Handle Cash payments
        if (paymentMethod === "Cash") {
          cashAmountCalc += price;
        } else if (paymentMethod === "UPI") {
          upiAmountCalc += paidAmount;
        }
      } else if (paymentStatus === "Unpaid") {
        pendingAmountCalc += price;
      }
    });

    setTotalSales(totalSalesCalc);
    setPendingAmount(pendingAmountCalc);
    setCashAmount(cashAmountCalc);
    setUpiAmount(upiAmountCalc);
  };

  const trendUp = true;
  const filteredPayments = payments.filter((payment) =>
    filter === "paid" ? payment.bookingDetails.paymentStatus === "Paid" : payment.bookingDetails.paymentStatus === "Unpaid"
  );

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generatePaymentLink = () => {
    const newPayment = {
      date: new Date().toLocaleString(),
      customer: formData.name,
      vendor: "Vendor Name",
      context: formData.comment,
      paymentId: Math.random().toString(36).substr(2, 9),
      amount: formData.amount,
      service: formData.service,
    };
    setPayments([...payments, newPayment]);
    setShowModal(false);
  };

  // Prepare CSV Data
  const csvData = filteredPayments.flatMap((payment) =>
    payment.service.map((service) => {
      const serviceAmount = service.price * service.quantity;
      const bookingDate = new Date(payment.bookingDetails.bookingDate);
      const formattedDate = bookingDate.toLocaleDateString('en-GB');
      const formattedTime = bookingDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      return {
        "Date & Time": `${formattedDate} ${formattedTime}`,
        "Customer Name": payment.customer?.name || "",
        "Order ID": payment.bookingDetails?.paymentId || "",
        "Vendor Name": payment.assignedProfessional?.name || "Not Assigned",
        "Context": payment.bookingDetails?.context || "",
        "Payment ID": payment.bookingDetails?.paymentId || "",
        "Amount": serviceAmount,
        "Service": service.category || "",
        "City": payment.address?.landMark || "",
      };
    })
  );

  return (
    <Container className="mt-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Row className="mb-3 align-items-center">
        <Col><h5 className="fw-bold">Money Dashboard</h5></Col>
        <Col className="d-flex justify-content-end gap-2">
          <Form.Select className="w-auto" style={{ height: "38px", fontSize: '12px' }} onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
            <option value="">Select City</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Pune">Pune</option>
          </Form.Select>
          <Form.Select className="w-auto" style={{ height: "38px", fontSize: '12px' }} onChange={(e) => setFilters({ ...filters, service: e.target.value })}>
            <option value="">Select Service</option>
            <option value="House Painting">House Painting</option>
            <option value="Deep Cleaning">Deep Cleaning</option>
            <option value="Interior">Interior</option>
            <option value="Packers & Movers">Packers & Movers</option>
          </Form.Select>
          <Form.Select className="w-auto" style={{ height: "38px", fontSize: '12px' }} onChange={(e) => setFilters({ ...filters, period: e.target.value })}>
            <option value="">Select Period</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="All Time">All Time</option>
          </Form.Select>
          <Button
            style={{
              whiteSpace: 'nowrap',
              color: 'black',
              fontSize: '12px',
              fontWeight: '700',
              border: '1px solid #000',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              outline: 'none',
              boxShadow: 'none'
            }}
            onClick={() => setShowModal(true)}
          >
            Create Payment Link
          </Button>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold" style={{ fontSize: '14px' }}>
              Total Sales: ₹{totalSales.toLocaleString()}
              <span className="fw-bold " style={{ color: 'green' }}>
                {totalSales > 0 ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +10%
              </span>
            </h6>
            <p style={{ fontSize: '12px' }}>Cash Payment: ₹{cashAmount.toLocaleString()}</p>
            <p style={{ fontSize: '12px' }}>UPI Payment: ₹{upiAmount.toLocaleString()}</p>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="p-3 shadow-sm">
            <h6 className="fw-bold" style={{ fontSize: '14px' }}>Amount Yet to Be Collected: ₹{pendingAmount.toLocaleString()}</h6>
            <p style={{ fontSize: '12px', marginBottom: '1%' }}>Coins sold :
              {/* <span className="fw-bold " style={{color:'green'}}>{trendUp ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +15%</span> */}
            </p>
            <p style={{ fontSize: '12px' }}>Income from Coins Sale :
              {/* <span className="fw-bold " style={{color:'green'}}>{trendUp ? <FaArrowUp color="green" /> : <FaArrowDown color="red" />} +20%</span> */}
            </p>
          </Card>
        </Col>
      </Row>

      <div>
        <h4 className="fw-bold" style={{ fontSize: "14px" }}>Payments List</h4>
        <div className="mb-3">
          <button
            className={`btn ${filter === "paid" ? "btn-dark text-white" : "btn-outline-dark"} me-2`}
            onClick={() => setFilter("paid")}
            style={{ fontSize: '12px' }}
          >
            Paid List
          </button>
          <button
            className={`btn ${filter === "pending" ? "btn-dark text-white" : "btn-outline-dark"}`}
            onClick={() => setFilter("pending")}
            style={{ fontSize: '12px' }}
          >
            Pending List
          </button>
        </div>

        <Table striped bordered hover>
          <thead>
            <tr style={{ fontSize: '12px' }}>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Order Id</th>
              <th>Vendor</th>
              <th>Context</th>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Service</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment, index) => {
              const uniqueCategories = [];
              return payment.service.map((service, serviceIndex) => {
                if (!uniqueCategories.includes(service.category)) {
                  uniqueCategories.push(service.category);
                  const serviceAmount = service.price * service.quantity;
                  const bookingDate = new Date(payment.bookingDetails.bookingDate);
                  const formattedDate = bookingDate.toLocaleDateString('en-GB');
                  const formattedTime = bookingDate.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                  return (
                    <tr key={`${index}-${serviceIndex}`} style={{ fontSize: '12px' }}>
                      <td>{formattedDate} {formattedTime}</td>
                      <td>{payment.customer.name}</td>
                      <td>{payment.bookingDetails.paymentId}</td>
                      {/* <td>{payment.service.map((service) => service.serviceName).join(", ")}</td> */}
                      <td>{payment.assignedProfessional ? payment.assignedProfessional.name : 'Not Assigned'}</td>
                      <td>{payment.bookingDetails.context}</td>
                      <td>{payment.bookingDetails.paymentId}</td>
                      <td>₹{serviceAmount.toLocaleString()}</td>
                      <td>{service.category}</td>
                      <td>{payment.address.landMark}</td>
                    </tr>
                  );
                }
                return null;
              });
            })}
          </tbody>
        </Table>

        <CSVLink
          data={csvData}
          filename={`${filter}-payments.csv`}
          className="btn btn-success mt-3"
          style={{ fontSize: "12px" }}
        >
          Export to CSV
        </CSVLink>

      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '16px' }}>Create Payment Link</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Customer / Vendor Toggle */}
            <Form.Group className="mb-3">
              <Form.Check
                inline
                label="Customer"
                type="radio"
                name="type"
                value="customer"
                checked={formData.type === "customer"}
                onChange={handleInputChange}
              />
              <Form.Check
                inline
                label="Vendor"
                type="radio"
                name="type"
                value="vendor"
                checked={formData.type === "vendor"}
                onChange={handleInputChange}
              />
            </Form.Group>

            {/* Common Fields */}
            <Form.Group className="mb-3">
              <Form.Label>Name:</Form.Label>
              <Form.Control type="text" name="name" onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone No.:</Form.Label>
              <Form.Control type="text" name="phone" onChange={handleInputChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Amount:</Form.Label>
              <Form.Control type="number" name="amount" onChange={handleInputChange} />
            </Form.Group>

            {/* Service & City Dropdowns */}
            <Form.Group className="mb-3">
              <Form.Label>Service:</Form.Label>
              <Form.Select name="service" onChange={handleInputChange}>
                <option value="">Select Service</option>
                <option value="House Painting">House Painting</option>
                <option value="Deep Cleaning">Deep Cleaning</option>
                <option value="Interior">Home Interior</option>
                <option value="Packers & Movers">Packers & Movers</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>City:</Form.Label>
              <Form.Select name="city" onChange={handleInputChange}>
                <option value="">Select City</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Pune">Pune</option>
              </Form.Select>
            </Form.Group>

            {/* Context Selection for Vendor */}
            {formData.type === "vendor" && (
              <Form.Group className="mb-3">
                <Form.Label>Context:</Form.Label>
                <Form.Check
                  type="radio"
                  label="Others"
                  name="context"
                  value="others"
                  checked={formData.context === "others"}
                  onChange={handleInputChange}
                />
                <Form.Check
                  type="radio"
                  label="Coins"
                  name="context"
                  value="coins"
                  checked={formData.context === "coins"}
                  onChange={handleInputChange}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button style={{ color: 'black', borderColor: 'black', backgroundColor: 'white', fontWeight: '600' }} onClick={generatePaymentLink}>
            Generate Payment Link
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MoneyDashboard;
