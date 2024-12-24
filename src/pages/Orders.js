import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import "../styles/components/OrdersPage.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTime, setFilterTime] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          throw new Error("User not logged in.");
        }

        const ordersRef = collection(db, "Quotation_form");
        const q = query(ordersRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        const fetchedOrders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (event) => {
    setFilterStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleTimeChange = (event) => {
    setFilterTime(event.target.value);
    setCurrentPage(1);
  };

  const filterByTime = (timestamp) => {
    const now = new Date();
    const orderDate = new Date(timestamp);

    switch (filterTime) {
      case "Last 30 days":
        return now - orderDate <= 30 * 24 * 60 * 60 * 1000;
      case "2023":
        return orderDate.getFullYear() === 2023;
      case "2022":
        return orderDate.getFullYear() === 2022;
      case "2021":
        return orderDate.getFullYear() === 2021;
      case "2020":
        return orderDate.getFullYear() === 2020;
      case "Older":
        return orderDate.getFullYear() < 2020;
      default:
        return true;
    }
  };

  const filteredOrders = orders
    .filter(
      (order) =>
        (order.orderNumber?.toString().includes(searchQuery) ||
          order.clientName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterStatus === "All" || order.status === filterStatus) &&
        filterByTime(order.timestamp)
    )
    .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  const totalPages = Math.ceil(
    orders.filter(
      (order) =>
        (order.orderNumber?.toString().includes(searchQuery) ||
          order.clientName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (filterStatus === "All" || order.status === filterStatus) &&
        filterByTime(order.timestamp)
    ).length / ordersPerPage
  );

  return (
    <div className="orders-page">
      <h1>Your Orders</h1>
      <div className="controls">
        <input
          type="text"
          placeholder="Search by order number or client name"
          value={searchQuery}
          onChange={handleSearch}
          className="search-bar"
        />
        <select value={filterStatus} onChange={handleStatusChange} className="filter-dropdown">
          <option value="All">All Status</option>
          <option value="Delivered to admin">Delivered to Admin</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <select value={filterTime} onChange={handleTimeChange} className="filter-dropdown">
          <option value="All">All Time</option>
          <option value="Last 30 days">Last 30 Days</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
          <option value="2021">2021</option>
          <option value="2020">2020</option>
          <option value="Older">Older</option>
        </select>
      </div>
      {loading ? (
        <p>Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <h2>Order #{order.orderNumber}</h2>
              <p><strong>Product:</strong> {order.product?.productName || "N/A"}</p>
              <p><strong>Dimensions:</strong> {order.product?.height} ft x {order.product?.width} ft</p>
              <p><strong>Additional Requirements:</strong> {order.product?.additionalRequirements || "None"}</p>
              <p><strong>City:</strong> {order.city}</p>
              <p><strong>Postal Code:</strong> {order.postalCode}</p>
              <p><strong>Client Name:</strong> {order.clientName}</p>
              <p><strong>Email:</strong> {order.clientEmail}</p>
              <p><strong>Phone:</strong> {order.clientPhone}</p>
              <p><strong>Timestamp:</strong> {new Date(order.timestamp).toLocaleString()}</p>
              <p>
        <strong>Status:</strong> {order.status || "Delivered to admin"}
      </p>
      <p>
        <strong>Estimated Price:</strong> ₹{order.estimatePrice || 0}.00
      </p>
      <p>
        <strong>Comission:</strong> ₹{order.commissionValue || 0}.00
      </p>
      <p>
        <strong>Comission Percentage(%):</strong> {order.commissionPercentage || 0}%
      </p>
      <p>
        <strong>Payment Status:</strong> {order.paymentStatus || 0}
      </p>
            </div>
          ))}
        </div>
      )}
      <div className="pagination">
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index + 1)}
            className={currentPage === index + 1 ? "active" : ""}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
