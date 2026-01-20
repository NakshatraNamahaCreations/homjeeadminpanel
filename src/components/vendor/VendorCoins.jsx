// components/vendor/VendorCoins.jsx
import React from "react";
import { Form, Button } from "react-bootstrap";

const VendorCoins = ({
  vendor,
  coinDelta,
  setCoinDelta,
  coinsBalance,
  onAddCoins,
  onReduceCoins,
}) => {
  console.log("vendor coin component", vendor.wallet.paymentLink);

  return (
    <>
      <h5 className="mt-4 fw-semibold" style={{ fontSize: "14px" }}>
        Coins Wallet
      </h5>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <p className="mb-0" style={{ fontSize: "14px" }}>
          <strong>Coins Balance:</strong> {coinsBalance} coins <br />
          {vendor?.wallet?.paymentLink ? (
            <a
              href={vendor.wallet.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#dc3545",
                textDecoration: "underline",
                wordBreak: "break-all",
              }}
            >
              Recharge link
            </a>
          ) : (
            <span className="text-muted">N/A</span>
          )}
        </p>
        <div className="d-flex align-items-center gap-2">
          <Form.Control
            type="number"
            min={1}
            step={1}
            value={coinDelta}
            onChange={(e) => setCoinDelta(e.target.value)}
            style={{ width: 120, fontSize: "12px" }}
            placeholder="Coins"
          />
          <Button
            variant="outline-dark"
            size="sm"
            onClick={onAddCoins}
            className="me-2"
            style={{ borderColor: "black" }}
          >
            Add Coins
          </Button>
          <Button variant="outline-danger" size="sm" onClick={onReduceCoins}>
            Reduce Coins
          </Button>
        </div>
      </div>
    </>
  );
};

export default VendorCoins;
