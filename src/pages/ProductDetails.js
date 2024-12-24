import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import products from "./Products.json";
import "../styles/components/ProductDetailsPage.css";
import { db, auth } from "../services/firebase";
import { setDoc, doc, collection } from "firebase/firestore";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  // Quotation Form States
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [additionalReq, setAdditionalReq] = useState("");

  const product = products.find((p) => p.id === parseInt(productId, 10));

  if (!product) {
    return <p className="error-message">Product not found</p>;
  }

  const handleSubmitQuotation = async () => {
    const orderNumber = Math.floor(100000 + Math.random() * 900000); // Random Order Number

    const quotationData = {
      clientName,
      clientPhone,
      clientEmail,
      city: clientCity,
      postalCode,
      product: {
        productName: product.name,
        height,
        width,
        additionalRequirements: additionalReq || "",
      },
      userId: auth.currentUser?.uid || "Anonymous",
      orderNumber,
      timestamp: new Date().toISOString(),
    };

    try {
      // Save to Firebase
      const quotationRef = collection(db, "Quotation_form");
      await setDoc(doc(quotationRef, String(orderNumber)), quotationData);

      alert(`Quotation submitted successfully! Order Number: ${orderNumber}`);

      // Reset form fields
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setClientCity("");
      setPostalCode("");
      setHeight("");
      setWidth("");
      setAdditionalReq("");

      // Close the popup
      setShowPopup(false);
    } catch (error) {
      console.error("Error submitting quotation:", error);
      alert("Failed to submit quotation. Please try again.");
    }
  };

  return (
    <div className="product-detail-page">
      <header className="header">
        <button className="back-button" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <h2>Product Details</h2>
      </header>
      <div className="product-detail-container">
        <div className="product-image-container">
          <img src={product.image} alt={product.name} className="product-image" />
        </div>
        <div className="product-info">
          <h1 className="product-name">{product.name}</h1>
          <p className="product-category">Category: {product.category}</p>
          
          {/* Dynamic feature list */}
          <div className="product-features">
            <h3>Features</h3>
            <ul>
              {Object.entries(product.features || {}).map(([key, value]) => (
                <li key={key}>
                  <strong>{key.replace(/([A-Z])/g, " $1")}:</strong>{" "}
                  {Array.isArray(value)
                    ? value.join(", ")
                    : typeof value === "object"
                    ? Object.entries(value)
                        .map(([subKey, subValue]) => `${subKey}: ${subValue}`)
                        .join(", ")
                    : value}
                </li>
              ))}
            </ul>
          </div>
          <button
            className="add-to-cart-button"
            onClick={() => setShowPopup(true)}
          >
            Request a Quote
          </button>
        </div>
      </div>

      {/* Quotation Form Popup */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h2>Quotation Form</h2>
            <div className="form-section">
              <h3>Client Details</h3>
              <label>
                Client Name:
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </label>
              <label>
                Client Email:
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Client Phone:
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  required
                />
              </label>
              <label>
                City:
                <input
                  type="text"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  required
                />
              </label>
              <label>
                Postal Code:
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-section">
              <h3>Product Details</h3>
              <label>
                Selected Product:
                <input type="text" value={product.name} readOnly />
              </label>
              <label>
                Height (ft):
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
              </label>
              <label>
                Width (ft):
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  required
                />
              </label>
              <label>
                Additional Requirements:
                <textarea
                  value={additionalReq}
                  onChange={(e) => setAdditionalReq(e.target.value)}
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                className="close-button"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
              <button
                className="submit-button"
                onClick={handleSubmitQuotation}
              >
                Submit Quotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
