// components/forms/VendorForm.jsx
import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";

const VendorForm = ({
  formData,
  errors,
  files,
  onInputChange,
  onFileChange,
  onAddressPickerOpen,
  geocodingError,
}) => {
  return (
    <>
      <h5 className="mb-3">Basic Information</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="vendorName"
              value={formData.vendorName}
              onChange={onInputChange}
              placeholder="Enter Name"
              required
              isInvalid={!!errors.vendorName}
            />
            <Form.Control.Feedback type="invalid">
              {errors.vendorName}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={onInputChange}
              placeholder="Enter Phone Number"
              required
              isInvalid={!!errors.mobileNumber}
            />
            <Form.Control.Feedback type="invalid">
              {errors.mobileNumber}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Profile Photo</Form.Label>
            <Form.Control
              type="file"
              name="profileImage"
              onChange={onFileChange}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Date of Birth</Form.Label>
            <Form.Control
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={onInputChange}
              required
              isInvalid={!!errors.dateOfBirth}
            />
            <Form.Control.Feedback type="invalid">
              {errors.dateOfBirth}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Working Since (Year)</Form.Label>
            <Form.Control
              type="number"
              name="yearOfWorking"
              value={formData.yearOfWorking}
              onChange={onInputChange}
              placeholder="Enter Year"
              required
              isInvalid={!!errors.yearOfWorking}
            />
            <Form.Control.Feedback type="invalid">
              {errors.yearOfWorking}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>City</Form.Label>
            <Form.Select
              name="city"
              value={formData.city}
              onChange={onInputChange}
              required
              isInvalid={!!errors.city}
            >
              <option value="">Select City</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Pune">Pune</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Chennai">Chennai</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.city}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Service Type</Form.Label>
            <Form.Select
              name="serviceType"
              value={formData.serviceType}
              onChange={onInputChange}
              required
              isInvalid={!!errors.serviceType}
            >
              <option value="">Select Service</option>
              <option value="House Painting">House Painting</option>
              <option value="Deep Cleaning">Deep Cleaning</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Pest Control">Pest Control</option>
              <option value="AC Service">AC Service</option>
              <option value="Car Wash">Car Wash</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.serviceType}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Capacity (Jobs at a time)</Form.Label>
            <Form.Control
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={onInputChange}
              placeholder="Enter Capacity"
              required
              isInvalid={!!errors.capacity}
            />
            <Form.Control.Feedback type="invalid">
              {errors.capacity}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Service Area</Form.Label>
            <Form.Control
              type="text"
              name="serviceArea"
              value={formData.serviceArea}
              readOnly
              placeholder="Auto-filled from location"
              isInvalid={!!errors.serviceArea}
            />
            <Form.Control.Feedback type="invalid">
              {errors.serviceArea}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <h5 className="mt-4 mb-3">Address Details</h5>
      <Row className="align-items-end">
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={formData.location}
              placeholder="Click to pick on map"
              readOnly
              onClick={onAddressPickerOpen}
              isInvalid={!!errors.location}
            />
            <Form.Control.Feedback type="invalid">
              {errors.location}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              <FaMapMarkerAlt className="me-1" />
              Uses Google Maps (autocomplete + draggable pin)
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Latitude</Form.Label>
            <Form.Control
              type="text"
              name="latitude"
              value={formData.latitude}
              readOnly
              isInvalid={!!errors.latitude}
            />
            <Form.Control.Feedback type="invalid">
              {errors.latitude}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Longitude</Form.Label>
            <Form.Control
              type="text"
              name="longitude"
              value={formData.longitude}
              readOnly
              isInvalid={!!errors.longitude}
            />
            <Form.Control.Feedback type="invalid">
              {errors.longitude}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      {geocodingError && (
        <div className="text-danger mb-3">{geocodingError}</div>
      )}

      <h5 className="mt-4 mb-3">Identity Verification</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Aadhar Card Number</Form.Label>
            <Form.Control
              type="text"
              name="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={onInputChange}
              placeholder="Enter Aadhar No."
              maxLength={12}
              required
              isInvalid={!!errors.aadhaarNumber}
            />
            <Form.Control.Feedback type="invalid">
              {errors.aadhaarNumber}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Upload Aadhar (Front Image)</Form.Label>
            <Form.Control
              type="file"
              name="aadhaarfrontImage"
              onChange={onFileChange}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>PAN Card Number</Form.Label>
            <Form.Control
              type="text"
              name="panNumber"
              value={formData.panNumber}
              onChange={onInputChange}
              placeholder="Enter PAN No."
              required
              isInvalid={!!errors.panNumber}
            />
            <Form.Control.Feedback type="invalid">
              {errors.panNumber}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Upload PAN Card</Form.Label>
            <Form.Control
              type="file"
              name="panImage"
              onChange={onFileChange}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Upload Aadhar (Back Image)</Form.Label>
            <Form.Control
              type="file"
              name="aadhaarbackImage"
              onChange={onFileChange}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Others / Police Verification</Form.Label>
            <Form.Control
              type="file"
              name="otherPolicy"
              onChange={onFileChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <h5 className="mt-4 mb-3">Financial Details</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Bank Account Number</Form.Label>
            <Form.Control
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={onInputChange}
              placeholder="Enter Bank Account No."
              required
              isInvalid={!!errors.accountNumber}
            />
            <Form.Control.Feedback type="invalid">
              {errors.accountNumber}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>IFSC Code</Form.Label>
            <Form.Control
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={onInputChange}
              placeholder="Enter IFSC Code"
              required
              isInvalid={!!errors.ifscCode}
            />
            <Form.Control.Feedback type="invalid">
              {errors.ifscCode}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Bank Name</Form.Label>
            <Form.Control
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={onInputChange}
              placeholder="Enter Bank Name"
              required
              isInvalid={!!errors.bankName}
            />
            <Form.Control.Feedback type="invalid">
              {errors.bankName}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name in Bank</Form.Label>
            <Form.Control
              type="text"
              name="holderName"
              value={formData.holderName}
              onChange={onInputChange}
              placeholder="Enter Name as per Bank"
              required
              isInvalid={!!errors.holderName}
            />
            <Form.Control.Feedback type="invalid">
              {errors.holderName}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Account Type</Form.Label>
            <Form.Select
              name="accountType"
              value={formData.accountType}
              onChange={onInputChange}
              required
              isInvalid={!!errors.accountType}
            >
              <option value="">Select Account Type</option>
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
              <option value="Salary">Salary</option>
              <option value="Fixed Deposit">Fixed Deposit</option>
              <option value="Recurring Deposit">Recurring Deposit</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.accountType}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>GST Number (Optional)</Form.Label>
            <Form.Control
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={onInputChange}
              placeholder="Enter GST No."
            />
            {errors.gstNumber && (
              <Form.Text className="text-danger">
                {errors.gstNumber}
              </Form.Text>
            )}
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default VendorForm;