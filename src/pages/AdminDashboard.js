import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/AdminDashboard.css";

const AdminDashboard = () => {
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dealerSearch, setDealerSearch] = useState("");
  const [installerSearch, setInstallerSearch] = useState("");
  const [dealerPage, setDealerPage] = useState(1);
  const [installerPage, setInstallerPage] = useState(1);
  const itemsPerPage = 3;
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    } else {
      const fetchAdminData = async () => {
        try {
          // Fetch Quotations from Quotation_form
          const quotationsSnapshot = await getDocs(collection(db, "Quotation_form"));
          const quotationsData = quotationsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setQuotations(quotationsData);

          

          // Fetch Orders
          const ordersSnapshot = await getDocs(collection(db, "orders"));
          setOrders(
            ordersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );

          // Fetch Dealers from "users" Collection
          const dealersSnapshot = await getDocs(collection(db, "users"));
          setDealers(
            dealersSnapshot.docs
              .filter((doc) => doc.data().role === "Dealer")
              .map((doc) => ({ id: doc.id, ...doc.data() }))
          );

          // Fetch Installers from "users" Collection
          const installersSnapshot = await getDocs(collection(db, "users"));
          setInstallers(
            installersSnapshot.docs
              .filter((doc) => doc.data().role === "Installer")
              .map((doc) => ({ id: doc.id, ...doc.data() }))
          );

          // Generate Reports for Orders
          const reportData = {
            totalOrders: ordersSnapshot.docs.length,
            completedOrders: ordersSnapshot.docs.filter(
              (doc) => doc.data().status === "Completed"
            ).length,
            pendingOrders: ordersSnapshot.docs.filter(
              (doc) => doc.data().status === "Pending"
            ).length,
            approvedOrders: ordersSnapshot.docs.filter(
              (doc) => doc.data().status === "Approved"
            ).length,
          };
          setReports(reportData);
        } catch (err) {
          console.error("Error fetching admin data:", err);
          setError("An error occurred while fetching data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      fetchAdminData();
    }
  }, [navigate]);

  const handleApproveInstaller = async (installerId) => {
    try {
      await updateDoc(doc(db, "users", installerId), { status: "Approved" });
      setInstallers((prev) =>
        prev.map((installer) =>
          installer.id === installerId ? { ...installer, status: "Approved" } : installer
        )
      );
    } catch (err) {
      console.error("Error approving installer:", err);
    }
  };


  // Filtering Logic
  const filteredDealers = dealers.filter(
    (dealer) =>
      dealer.name.toLowerCase().includes(dealerSearch.toLowerCase()) ||
      dealer.email.toLowerCase().includes(dealerSearch.toLowerCase())
  );
  const filteredInstallers = installers.filter(
    (installer) =>
      installer.name.toLowerCase().includes(installerSearch.toLowerCase()) ||
      installer.email.toLowerCase().includes(installerSearch.toLowerCase())
  );

  // Pagination Logic
  const paginatedDealers = filteredDealers.slice(
    (dealerPage - 1) * itemsPerPage,
    dealerPage * itemsPerPage
  );
  const paginatedInstallers = filteredInstallers.slice(
    (installerPage - 1) * itemsPerPage,
    installerPage * itemsPerPage
  );

  const handlePageChange = (setter, page) => {
    setter(page);
  };

  // Calculate quotation stats
  const calculateQuotationStats = () => {
    const totalQuotations = quotations.length;
    const approvedQuotations = quotations.filter((quotation) => quotation.status === "Approved").length;
    const pendingQuotations = quotations.filter((quotation) => quotation.product?.status === "Pending").length;
    const totalEstimatedAmount = quotations.reduce((total, quotation) => total + (parseFloat(quotation.estimatePrice || 0)), 0);

    return {
      totalQuotations,
      approvedQuotations,
      pendingQuotations,
      totalEstimatedAmount,
    };
  };

  const { totalQuotations, approvedQuotations, pendingQuotations, totalEstimatedAmount } = calculateQuotationStats();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
          {/* Quotation and Order Management */}
          <div className="dashboard-section">
            <h3>Quotations and Orders</h3>
            <p><strong>Total Quotations:</strong> {totalQuotations}</p>
            <p><strong>Approved:</strong> {approvedQuotations}</p>
            <p><strong>Pending:</strong> {pendingQuotations}</p>
            <p><strong>Total Estimated Amount:</strong> ₹{totalEstimatedAmount.toFixed(2)}</p>
           
          </div>

          {/* Dealer Management */}
          <div className="dashboard-section">
        <h3>Dealer Management</h3>
        <input
          type="text"
          placeholder="Search dealers..."
          value={dealerSearch}
          onChange={(e) => setDealerSearch(e.target.value)}
        />
        {paginatedDealers.map((dealer) => (
          <div key={dealer.id} className="user-card">
            <p><strong>Dealer Name:</strong> {dealer.name}</p>
            <p><strong>Email:</strong> {dealer.email}</p>
            <p><strong>Referral ID:</strong> {dealer.referralId}</p>
          </div>
        ))}
       <div className="pagination">
  <button
    onClick={() => handlePageChange(setDealerPage, dealerPage - 1)}
    disabled={dealerPage === 1}
    className="pagination-button"
  >
    Previous
  </button>
  {Array.from(
    { length: Math.ceil(filteredDealers.length / itemsPerPage) },
    (_, i) => (
      <button
        key={i}
        onClick={() => handlePageChange(setDealerPage, i + 1)}
        className={`pagination-button ${dealerPage === i + 1 ? "active" : ""}`}
      >
        {i + 1}
      </button>
    )
  )}
  <button
    onClick={() => handlePageChange(setDealerPage, dealerPage + 1)}
    disabled={dealerPage === Math.ceil(filteredDealers.length / itemsPerPage)}
    className="pagination-button"
  >
    Next
  </button>
</div>

      </div>

          {/* Installer Management */}
          <div className="dashboard-section">
        <h3>Installer Management</h3>
        <input
          type="text"
          placeholder="Search installers..."
          value={installerSearch}
          onChange={(e) => setInstallerSearch(e.target.value)}
        />
        {paginatedInstallers.map((installer) => (
          <div key={installer.id} className="user-card">
            <p><strong>Installer Name:</strong> {installer.name}</p>
            <p><strong>Email:</strong> {installer.email}</p>
            <p><strong>Referral ID:</strong> {installer.referralId}</p>
          </div>
        ))}
        <div className="pagination">
  <button
    onClick={() => handlePageChange(setInstallerPage, installerPage - 1)}
    disabled={installerPage === 1}
    className="pagination-button"
  >
    Previous
  </button>
  {Array.from(
    { length: Math.ceil(filteredInstallers.length / itemsPerPage) },
    (_, i) => (
      <button
        key={i}
        onClick={() => handlePageChange(setInstallerPage, i + 1)}
        className={`pagination-button ${installerPage === i + 1 ? "active" : ""}`}
      >
        {i + 1}
      </button>
    )
  )}
  <button
    onClick={() => handlePageChange(setInstallerPage, installerPage + 1)}
    disabled={installerPage === Math.ceil(filteredInstallers.length / itemsPerPage)}
    className="pagination-button"
  >
    Next
  </button>
</div>

      </div>

          {/* Reports */}
          <div className="dashboard-section">
            <h3>Reports</h3>
            <p><strong>Total Orders:</strong> {reports.totalOrders}</p>
            <p><strong>Completed Orders:</strong> {reports.completedOrders}</p>
            <p><strong>Pending Orders:</strong> {reports.pendingOrders}</p>
            <p><strong>Approved Orders:</strong> {reports.approvedOrders}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
