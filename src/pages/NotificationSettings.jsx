import { useState } from "react";
import { Button, Form, Modal, Container, Row, Col } from "react-bootstrap";

const NotificationSettings = () => {
  const [city, setCity] = useState("All Cities");
  const [service, setService] = useState("All Services");
  const [phoneNumbers, setPhoneNumbers] = useState([ ""]);
  const [enableEnquiryNotification, setEnableEnquiryNotification] = useState(true);
  const [enableBookingNotification, setEnableBookingNotification] = useState(true);
  const [vendorNotifyTime, setVendorNotifyTime] = useState(30);
  const [allVendorsNotifyTime, setAllVendorsNotifyTime] = useState(120);

  const handleAddPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  const handlePhoneChange = (index, value) => {
    const updatedPhones = [...phoneNumbers];
    updatedPhones[index] = value;
    setPhoneNumbers(updatedPhones);
  };

  const handleSaveSettings = () => {
    // alert("Notification settings saved successfully!");
  };

  return (
    <Container className="py-4" style={{marginLeft:'2%'}}>
      <h5 className="fw-bold mb-4">Notification Settings</h5>

      {/* Filters */}
      <Row className="mb-2">
        <Col md={5} className="mb-3">
          <Form.Select value={city} onChange={(e) => setCity(e.target.value)} style={{fontSize:'13px', width:'50%'}}>
            <option>All Cities</option>
            <option>City 1</option>
            <option>City 2</option>
            <option>City 3</option>
          </Form.Select>
          
        </Col>
        <Col md={5} className="mb-3" style={{marginLeft:'-19%'}}>
          <Form.Select value={service} onChange={(e) => setService(e.target.value)} style={{fontSize:'13px', width:'50%'}}>
            <option>All Services</option>
            <option>House Painting</option>
            <option>Deep Cleaning</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Phone Number Input */}
      <div className="mb-4">
        <h4 className="fw-semibold mb-3" style={{fontSize:'14px'}}>Phone Numbers for Notifications</h4>
        {phoneNumbers.map((phone, index) => (
          <Form.Control
            key={index}
            type="text"
            style={{width:'30%'}}
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => handlePhoneChange(index, e.target.value)}
            className="mb-3"
          />
        ))}
        <Button variant="outline-black" style={{borderColor:'black'}} onClick={handleAddPhoneNumber}>+ Add Another</Button>
      </div>

      {/* Notification Triggers */}
      <div className="mb-4">
        <h4 className="fw-semibold mb-3" style={{fontSize:'15px'}}>Notification Triggers</h4>
        <div>
          <Form.Check
            type="checkbox"
            label="Enable WhatsApp notifications for all enquiries"
            checked={enableEnquiryNotification}
            onChange={() => setEnableEnquiryNotification(!enableEnquiryNotification)}
            style={{fontSize:'14px'}}
          />
          <Form.Check
            type="checkbox"
            label="Enable notifications for leads whose booking time is within 2 hours"
            checked={enableBookingNotification}
            onChange={() => setEnableBookingNotification(!enableBookingNotification)}
            style={{fontSize:'14px'}}
          />
        </div>
      </div>

      {/* Lead Notification Rules */}
      <div className="mb-4">
        <h4 className="fw-semibold mb-3" style={{fontSize:'15px'}}>Lead Notification Rules</h4>
        <Form.Group className="mb-3">
          <Form.Label style={{fontSize:'14px'}}><strong>Notify another vendor if lead is unresponded for:</strong></Form.Label>
          <Form.Control
            type="number"
            min="1"
            style={{width:'30%'}}
            value={vendorNotifyTime}
            onChange={(e) => setVendorNotifyTime(e.target.value)}
          />
          <Form.Text className="text-muted">minutes</Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label style={{fontSize:'14px'}}><strong>Notify all vendors if lead is unresponded & booking time is within:</strong></Form.Label>
          <Form.Control
            type="number"
            min="1"
            style={{width:'30%'}}
            value={allVendorsNotifyTime}
            onChange={(e) => setAllVendorsNotifyTime(e.target.value)}
          />
          <Form.Text className="text-muted">minutes</Form.Text>
        </Form.Group>
      </div>

      {/* Save Button */}
      <Button variant="success" onClick={handleSaveSettings}  style={{width:'25%'}} className="">Save Settings</Button>
    </Container>
  );
};

export default NotificationSettings;
