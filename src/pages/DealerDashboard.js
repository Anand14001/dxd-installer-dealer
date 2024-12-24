import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import {
  getDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/DealerDashboard.css";

const DealerDashboard = () => {
  const [dealerName, setDealerName] = useState("");
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [referralData, setReferralData] = useState({
    referralId: "",
    totalReferrals: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(2); // Set orders per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    if (orders.length > 0) {
      const total = orders.reduce((sum, order) => sum + (order.commissionValue || 0), 0);
      setTotalCommission(total);
    }
  }, [orders]);
  

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    } else {
      const fetchDealerData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const { name, referralId, totalEarnings } = userDoc.data();
            setDealerName(name);
            setEarnings(totalEarnings);

            // Fetch orders
            const ordersQuery = query(
              collection(db, "Quotation_form"),
              where("userId", "==", auth.currentUser.uid)
            );
            const ordersSnapshot = await getDocs(ordersQuery);
            const ordersList = ordersSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setOrders(ordersList);
            setFilteredOrders(ordersList); // Initialize filtered orders

            // Fetch referral data
            const referralsSnapshot = await getDocs(
              collection(db, "referrals")
            );
            const totalReferrals = referralsSnapshot.docs.filter(
              (ref) => ref.data().referrerId === referralId
            ).length;
            setReferralData({ referralId, totalReferrals });
          } else {
            setError("No user data found.");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("An error occurred while fetching data.");
        } finally {
          setLoading(false);
        }
      };

      fetchDealerData();
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    const searchQuery = e.target.value.toLowerCase();
    const filtered = orders.filter((order) => {
      const orderNumber = order.orderNumber?.toString().toLowerCase() || "";
      const productName = order.product?.productName?.toLowerCase() || "";
      return orderNumber.includes(searchQuery) || productName.includes(searchQuery);
    });
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to the first page
  };
  

  // Handle pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const OrderItem = ({ order }) => (
    <div className="order-item">
      <p>
        <strong>Order ID:</strong> #{order.orderNumber || "N/A"}
      </p>
      <p>
        <strong>Product:</strong> {order.product?.productName || "N/A"}
      </p>
      <p>
        <strong>Status:</strong> {order.status || "Delivered to admin"}
      </p>
      <p>
        <strong>Estimated Price:</strong> ₹{order.estimatePrice || 0}.00
      </p>
      <p>
        <strong>Commission:</strong> ₹{order.commissionValue || 0}.00
      </p>
      <p>
        <strong>Commission Percentage(%):</strong> {order.commissionPercentage || 0}%
      </p>
      <p>
        <strong>Payment Status:</strong> {order.paymentStatus || 0}
      </p>
    </div>
  );

  return (
    <div className="dashboard-container1">
      <div className="dashboard-header1">
        <h1>Dealer Dashboard</h1>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div>
          <h2>Welcome, {dealerName}</h2>


          {/* My Orders Section */}
          <div className="dashboard-section1">
            <h3>My Orders</h3>
            <div className="container1">
               {/* Search and Filter */}
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={handleSearch}
            />
            
          </div>
              {currentOrders.length > 0 ? (
                currentOrders.map((order) => <OrderItem key={order.id} order={order} />)
              ) : (
                <p>No orders found.</p>
              )}
            </div>
            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          </div>

          {/* Earnings Section */}
          <div className="dashboard-section1">
            <h3>Earnings</h3>
            <div className="container1">
              <p>
                <strong>Total Earnings:</strong> ₹{totalCommission || 0}
              </p>
            </div>
          </div>

          {/* Referrals Section */}
          <div className="dashboard-section1">
            <h3>Referrals</h3>
            <div className="container1">
              <p>
                <strong>Referral ID:</strong> {referralData.referralId || "N/A"}
              </p>
              <p>
                <strong>Total Referrals:</strong> {referralData.totalReferrals || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerDashboard;
