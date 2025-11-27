
import React from "react";
import EditEnquiryModal from "./EditEnquiryModal";

const EditLeadModal = ({ show, onClose, booking, enquiry, onUpdated, title }) => {
  const source = booking || enquiry || null;

  if (!source) return null;

  // Build an 'enquiry' shape that EditEnquiryModal expects.
  // Normalize the raw booking to the enquiry shape EditEnquiryModal expects.
  const originalRaw = source.raw || source;

  // Normalize service entries to the form the EditEnquiryModal expects.
  // Reason: some leads (Deep Cleaning) store subcategory in `category` and service name in `name`.
  const normalizedServices = (originalRaw?.service || source?.service || []).map((s) => {
    // defensive helpers
    const rawItem = s || {};
    const rawCategory = (rawItem.category || "").toString();
    const rawSubCategory = (rawItem.subCategory || rawItem.subcategory || "").toString();
    const rawName = (rawItem.serviceName || rawItem.name || rawItem.service || "").toString();

    // Heuristic: If an item has `name` and `category` but serviceName/subCategory are missing,
    // and category doesn't look like 'House Painting', treat it as Deep Cleaning-package shape.
    const looksLikeDeepPackage = !!rawItem.name && !rawItem.serviceName && !rawItem.subCategory;

    const category = rawItem.category || rawItem.serviceCategory || (looksLikeDeepPackage ? "Deep Cleaning" : "");
    const subCategory = rawItem.subCategory || rawItem.subcategory || (looksLikeDeepPackage ? rawCategory : rawSubCategory);
    const serviceName = rawItem.serviceName || rawItem.name || rawItem.service || rawName;

    // Price fallbacks
    const price = rawItem.price ?? rawItem.totalAmount ?? rawItem.amount ?? rawItem.priceEstimate ?? "";
    const bookingAmount = rawItem.bookingAmount ?? rawItem.booking ?? rawItem.booking_amt ?? "";

    return {
      category: category || "",
      subCategory: subCategory || "",
      serviceName: serviceName || "",
      price: price !== undefined && price !== null ? String(price) : "",
      bookingAmount: bookingAmount !== undefined && bookingAmount !== null ? String(bookingAmount) : "",
    };
  });

  const enquiryShape = {
    bookingId: source._id || source.bookingId || source.id,
    contact: source.customer?.phone || source.contact || "",
    formName: source.formName || source.raw?.formName || "",
    // Put original complete object under `raw` so the modal can read bookingDetails/service/address as before
    raw: { ...originalRaw, service: normalizedServices },
  };
  // Debug helper: log transformed enquiry when modal opens — useful when modal appears blank
  // (helps verify that the wrapper received a valid booking and the shape matches EditEnquiryModal expectations)
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("EditLeadModal -> enquiryShape:", enquiryShape);
    // eslint-disable-next-line no-console
    console.debug("EditLeadModal -> normalized services:", enquiryShape.raw?.service || []);
  }

  return (
    <EditEnquiryModal
      show={show}
      onClose={onClose}
      enquiry={enquiryShape}
      // signal EditEnquiryModal that this is editing a Lead (not a plain enquiry)
      leadMode={true}
      onUpdated={onUpdated}
      title={title || "Edit Lead"}
    />
  );
};

export default EditLeadModal;
