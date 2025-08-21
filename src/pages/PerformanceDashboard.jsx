import { useState } from "react";
import { Table, Button, Form, Modal } from "react-bootstrap";
import { FaCog } from "react-icons/fa";

const PerformanceDashboard = ({ show, onHide }) => {
  const [city, setCity] = useState("All Cities");
  const [selectedService, setSelectedService] = useState("House Painters");
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("housePainting");

  const housePaintingVendors = [
    { name: "Vendor A", totalLeads: 30, responded: 25, responseRate: "83%", surveys: 20, surveyRate: "80%", hirings: 15, hiringRate: "50%", gsv: "₹1,500", projects: 10, rating: "4.7 ★", strikes: 2 },
    { name: "Vendor B", totalLeads: 50, responded: 40, responseRate: "80%", surveys: 35, surveyRate: "87%", hirings: 25, hiringRate: "50%", gsv: "₹1,400", projects: 15, rating: "4.3 ★", strikes: 1 }
  ];

  const deepCleaningVendors = [
    { name: "Vendor X", totalLeads: 40, responded: 35, responseRate: "88%", projectsCompleted: 28, completionRate: "70%", cancelled: 3, cancellationRate: "8%", rating: "4.8 ★", strikes: 1 },
    { name: "Vendor Y", totalLeads: 60, responded: 50, responseRate: "83%", projectsCompleted: 40, completionRate: "67%", cancelled: 5, cancellationRate: "10%", rating: "4.5 ★", strikes: 2 }
  ];


  const housePaintersData = [
    // ["Response %", 0, 80, 85, 90, 100],
    ["Survey %",  75, 80, 85, 95],
    ["Hiring %",  40, 50, 60, 80],
    ["Avg. GSV", "₹10K", "₹15K", "₹20K", "₹25K"],
    ["Rating",  3.5, 4.0, 4.5, 5.0],
    ["Strikes", 20, 10,30, 26]
  ];

  const deepCleaningData = [

    ["Response %", 80, 85, 90, 100],  
    // ["Completion %", 0, 70, 75, 85, 95],
    ["Cancellation %",  10, 8, 5, 2],
    // ["Avg. GSV", "₹10K", "₹15K", "₹20K", "₹25K"],
    ["Rating",  3.0, 3.5, 4.0, 5.0],
    ["Strikes",  3, 2, 1, 0],
  ];
  const kpiData = selectedService === "House Painters" ? housePaintersData : deepCleaningData;

  return (
    <div className="container py-4" style={{ fontFamily:'Poppins, sans-serif'}}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 style={{fontWeight:'bold'}}>Performance Dashboard</h5>
        <div className="d-flex gap-2">
          <Form.Select value={city} onChange={(e) => setCity(e.target.value)} style={{ height: "32px" , fontSize:'13px'}}>
            <option>All Cities</option>
            <option>Bangalore</option>
            <option>Mumbai</option>
          </Form.Select>
          <Button variant="secondary" onClick={() => setShowSettingsModal(true)} style={{whiteSpace:'nowrap', fontSize:'13px'}}>
            <FaCog className="me-2" /> Settings
          </Button>
        </div>
      </div>

{/* House Painting Performance */}
<div className="container py-4">
  <h6 style={{ color: '', fontWeight: 'bold', fontFamily:'Poppins, sans-serif', fontSize:'15px' }}>🏠 House Painting Performance</h6>
  <div className="d-flex gap-3 align-items-center mb-3" style={{marginTop:'2%'}}>
    <div className="d-flex flex-column">
      <div className="border rounded-pill p-2 px-3 mb-2" style={{ background: '', color: '#2b4eff', fontWeight: 'bold', cursor:'pointer', fontSize:'14px' }}>
        Total Leads: 102
      </div>
      <div className="border rounded-pill p-2 px-3 mb-2" style={{ background: '', color: '#198754', fontWeight: 'bold', cursor:'pointer', fontSize:'14px' }}>
        Avg. GSV: ₹27,500
      </div>
      <div className="border rounded-pill p-2 px-3" style={{ background: '', color: '#198754', fontWeight: 'bold' , cursor:'pointer', fontSize:'14px'}}>
        Rating: 4.88 ★
      </div>
    </div>
    {/* <div className="border rounded p-3 text-success text-center shadow-sm" style={{ width: '25%', background: '', color: '#198754', fontWeight: 'bold' , cursor:'pointer', fontSize:'12px'}}>
    Response<br/> 87 Leads <br /> 88 %  
    </div> */}
    <div className="border rounded p-3 text-warning text-center shadow-sm" style={{ width: '25%', background: '', color: '#e6a100', fontWeight: 'bold', cursor:'pointer', fontSize:'12px' }}>
    <span style={{fontSize:'30px'}}>80%</span> <br /> <span>Survey(78)</span> 
    </div>
    <div className="border rounded p-3 text-danger text-center shadow-sm" style={{ width: '25%', background: '', color: '#dc3545', fontWeight: 'bold', cursor:'pointer', fontSize:'12px' }}>
    <span style={{fontSize:'30px'}}>40%</span> <br /> <span>Hiring(78)</span> 

    </div>
  </div>
</div>

{/* Deep Cleaning Performance */}
<div className="container py-4">
  <h6 style={{ color: '', fontWeight: 'bold', fontFamily:'Poppins, sans-serif', fontSize:'15px' }}>🧹 Deep Cleaning Performance</h6>
  <div className="d-flex gap-3 align-items-center mb-3" style={{marginTop:'2%'}}>
    <div className="d-flex flex-column">
      <div className="border rounded-pill p-2 px-3 mb-2" style={{ background: '', color: '#d97706', fontWeight: 'bold', cursor:'pointer', fontSize:'14px' }}>
        Total Leads: 45
      </div>
      <div className="border rounded-pill p-2 px-3 mb-2" style={{ background: '', color: '#198754', fontWeight: 'bold', cursor:'pointer', fontSize:'14px' }}>
        Avg. GSV: ₹4,880
      </div>
      <div className="border rounded-pill p-2 px-3" style={{ background: '', color: '#198754', fontWeight: 'bold' , cursor:'pointer', fontSize:'14px'}}>
        Rating: 4.88 ★
      </div>
    </div>
    <div className="border rounded p-3 text-success text-center shadow-sm" style={{ width: '25%', background: '', color: '#198754', fontWeight: 'bold', cursor:'pointer', fontSize:'12px' }}>
    <span style={{fontSize:'30px'}}>88%</span> <br /> <span>Response(78)</span> 

        </div>
    <div className="border rounded p-3 text-warning text-center shadow-sm" style={{ width: '25%', background: '', color: '#e6a100', fontWeight: 'bold', cursor:'pointer', fontSize:'12px' }}>
    <span style={{fontSize:'30px'}}>75%</span> <br /> <span>Cancellation(78)</span> 

    </div>
   
  </div>
</div>



      {/* Vendor Performance Table */}
      <div>
      <h5 style={{fontSize:'16px'}}>Vendor Performance</h5>
      <div className="mb-3">
        <Button 
          variant={selectedCategory === "housePainting" ? "danger" : "secondary"} 
          onClick={() => setSelectedCategory("housePainting")} 
          className="me-2"
          style={{fontSize:'12px'}}
        >
          House Painting Performance
        </Button>
        <Button 
          variant={selectedCategory === "deepCleaning" ? "danger" : "secondary"} 
          onClick={() => setSelectedCategory("deepCleaning")}
          style={{fontSize:'12px'}}
        >
          Deep Cleaning Performance
        </Button>
      </div>
      {selectedCategory === "housePainting" ? (
        <Table striped bordered hover>
          <thead>
            <tr style={{ fontSize: "12px", textAlign: "center" }}>
              <th>Vendor Name</th>
              <th>Total Leads</th>
              <th>Leads Responded</th>
              <th>Lead Response %</th>
              <th>Surveys</th>
              <th>Survey %</th>
              <th>Hirings</th>
              <th>Hiring %</th>
              <th>GSV</th>
              <th>Projects Completed</th>
              <th>Ratings</th>
              <th>Strikes</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "12px", textAlign: "center" }}>
            {housePaintingVendors.map((vendor, index) => (
              <tr key={index}>
                <td>{vendor.name}</td>
                <td>{vendor.totalLeads}</td>
                <td>{vendor.responded}</td>
                <td>{vendor.responseRate}</td>
                <td>{vendor.surveys}</td>
                <td>{vendor.surveyRate}</td>
                <td>{vendor.hirings}</td>
                <td>{vendor.hiringRate}</td>
                <td>{vendor.gsv}</td>
                <td>{vendor.projects}</td>
                <td>{vendor.rating}</td>
                <td>{vendor.strikes}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr style={{ fontSize: "12px", textAlign: "center" }}>
              <th>Vendor Name</th>
              <th>Total Leads</th>
              <th>Leads Responded</th>
              <th>Lead Response %</th>
              <th>Projects Completed</th>
              <th>Completion %</th>
              <th>Cancelled</th>
              <th>Cancellation %</th>
              <th>Ratings</th>
              <th>Strikes</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "12px", textAlign: "center" }}>
            {deepCleaningVendors.map((vendor, index) => (
              <tr key={index}>
                <td>{vendor.name}</td>
                <td>{vendor.totalLeads}</td>
                <td>{vendor.responded}</td>
                <td>{vendor.responseRate}</td>
                <td>{vendor.projectsCompleted}</td>
                <td>{vendor.completionRate}</td>
                <td>{vendor.cancelled}</td>
                <td>{vendor.cancellationRate}</td>
                <td>{vendor.rating}</td>
                <td>{vendor.strikes}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>

      {/* KPI Parameters Modal */}
      <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '16px' }}>Set KPI Parameters for {selectedService}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mt-3">
          <Form.Check type="radio" name="kpiType" label="House Painters" checked={selectedService === "House Painters"} onChange={() => setSelectedService("House Painters")} />
          <Form.Check type="radio" name="kpiType" label="Deep Cleaning" checked={selectedService === "Deep Cleaning"} onChange={() => setSelectedService("Deep Cleaning")} />
        </div>
        <Table bordered className="mt-3 text-center">
          <thead>
            <tr>
              <th>Metrics</th>
              {/* <th>0</th> */}
              <th style={{ color: 'red' }}>Red</th>
              <th style={{ color: 'orange' }}>Orange</th>
              <th style={{ color: 'yellow' }}>Yellow</th>
              <th style={{ color: 'green' }}>Green</th>
            </tr>
          </thead>
          <tbody>
            {kpiData.map(([metric, ...values], index) => (
              <tr key={index}>
                <td>{metric}</td>
                {values.map((value, idx) => (
                  <td key={idx}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success">Save</Button>
        {/* <Button variant="secondary" onClick={onHide}>Cancel</Button> */}
      </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PerformanceDashboard;
