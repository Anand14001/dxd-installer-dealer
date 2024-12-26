import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/AdminDashboard.css";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend,ArcElement,PointElement,LineElement, // Import LineElement
} from "chart.js";

// Register chart elements
ChartJS.register(
  CategoryScale,LinearScale,BarElement,Title,Tooltip,Legend,ArcElement,PointElement,LineElement // Register LineElement for the Line chart
);


const AdminDashboard = () => {
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dealerSearch, setDealerSearch] = useState("");
  const [installerSearch, setInstallerSearch] = useState("");
  const [dealerPage, setDealerPage] = useState(1);
  const [installerPage, setInstallerPage] = useState(1);
  const [activityType, setActivityType] = useState("Dealer");
  const [showLogs, setShowLogs] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [updatedDetails, setUpdatedDetails] = useState({ name: "", phoneNumber: "", address: "", companyName: "" });
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  const itemsPerPage = 3;
  
  
  const navigate = useNavigate();

  const handleProfileClick = (user) => {
    setSelectedProfile(user); // Set the profile of the clicked user
    setUpdatedDetails({ // Set the current details for editing
      name: user.name,
      phoneNumber: user.phoneNumber,
      address: user.address,
      companyName: user.companyName,
    });
    setIsModalOpen(true); // Open the modal for editing
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleSaveChanges = async () => {
    try {
      const userRef = doc(db, "users", selectedProfile.uid);
      await updateDoc(userRef, {
        name: updatedDetails.name||null,
        phoneNumber: updatedDetails.phoneNumber || null,
        address: updatedDetails.address|| null,
        companyName: updatedDetails.companyName|| null,
      });
      // Update the user in the local state as well
      setDealers((prevDealers) =>
        prevDealers.map((dealer) =>
          dealer.id === selectedProfile.id ? { ...dealer, ...updatedDetails } : dealer
        )
      );
      setInstallers((prevInstallers) =>
        prevInstallers.map((installer) =>
          installer.id === selectedProfile.id ? { ...installer, ...updatedDetails } : installer
        )
      );
      setIsModalOpen(false); // Close the modal after saving changes
    } catch (err) {
      console.error("Error updating user profile:", err);
      alert(err)
    }
  };


  const handleViewLogs = () => {
    setSelectedLogs(activityLogs);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleShowLogs = () => {
    setShowLogs(!showLogs); // Toggle the visibility of logs
  };

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

          // Fetch Activity Logs for Dealers and Installers
          const activityLogsSnapshot = await getDocs(collection(db, "activity_logs"));
          const activityLogsData = activityLogsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setActivityLogs(activityLogsData);
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


// Filter Activity Logs based on selection
const filteredActivityLogs =
  activityType === "Dealer"
    ? activityLogs.filter((log) =>
        filteredDealers.some((dealer) => dealer.id === log.userId)
      )
    : activityLogs.filter((log) =>
        filteredInstallers.some((installer) => installer.id === log.userId)
      );

// Handle Activity Type Change (Dealer / Installer)
const handleActivityTypeChange = (e) => {
  setActivityType(e.target.value);
  setDealerSearch("");
  setInstallerSearch("");
};

// Pagination for Activity Logs
const activityLogsToDisplay = filteredActivityLogs.slice(
  0,
  itemsPerPage
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
    const rejectedQuotations = quotations.filter((quotations) => quotations.status === "Rejected").length;

    return {
      totalQuotations,
      approvedQuotations,
      pendingQuotations,
      totalEstimatedAmount,
      rejectedQuotations,
    };
  };

  const { totalQuotations, approvedQuotations, pendingQuotations, totalEstimatedAmount, rejectedQuotations } = calculateQuotationStats();

  // Filter Activity Logs for Dealer and Installer
  const dealerActivityLogs = activityLogs.filter((log) => 
    filteredDealers.some((dealer) => dealer.id === log.userId)
  );
  const installerActivityLogs = activityLogs.filter((log) => 
    filteredInstallers.some((installer) => installer.id === log.userId)
  );

  const prepareActivityData = () => {
    const labels = [];
    const counts = [];
    filteredActivityLogs.forEach((log) => {
      const date = new Date(log.timestamp.seconds * 1000).toLocaleDateString();
      if (!labels.includes(date)) {
        labels.push(date);
        counts.push(1);
      } else {
        const index = labels.indexOf(date);
        counts[index] += 1;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: `${activityType} Activity`,
          data: counts,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = prepareActivityData();

  const prepareQuotationPieChartData = () => {
    return {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [
        {
          data: [approvedQuotations, pendingQuotations, rejectedQuotations,],
          backgroundColor: [
            "rgba(0, 128, 0, 0.6)",  // Green for Approved
            "rgba(255, 165, 0, 0.6)",  // Orange for Pending
            "rgba(255, 0, 0, 0.6)",  // Red for Rejected
    
          ],
          borderColor: [
            "rgba(0, 128, 0, 1)",  // Dark Green for Approved
            "rgba(255, 165, 0, 1)",  // Dark Orange for Pending
            "rgba(255, 0, 0, 1)",  // Dark Red for Rejected
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  

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
          <div className="piChart-container">
          <Pie
    data={prepareQuotationPieChartData()}
    options={{
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (tooltipItem) {
              const value = tooltipItem.raw;
              return `${tooltipItem.label}: ${value} (${((value / totalQuotations) * 100).toFixed(2)}%)`;
            },
          },
        },
      },
    }}
  />
  </div>
          <p><strong>Total Quotations:</strong> {totalQuotations}</p>
          <p><strong>Approved:</strong> {approvedQuotations}</p>
          <p><strong>Pending:</strong> {pendingQuotations}</p>
          <p><strong>Rejected:</strong> {rejectedQuotations}</p>
          <p><strong>Total Estimated Amount:</strong> ₹{totalEstimatedAmount.toFixed(2)}</p>
        </div>

           {/* Activity Logs Section - Moved below Quotations */}
        <div className="dashboard-section">
          <div className="dashboard-header">
          <h3>Activity</h3>

          {/* Search Input */}
          <input
            type="text"
            placeholder={`Search ${activityType}s...`}
            value={activityType === "Dealer" ? dealerSearch : installerSearch}
            onChange={(e) => 
              activityType === "Dealer" 
                ? setDealerSearch(e.target.value)
                : setInstallerSearch(e.target.value)
            }
          />

<select value={activityType} onChange={handleActivityTypeChange}>
            <option value="Dealer">Dealer</option>
            <option value="Installer">Installer</option>
          </select>
          </div>

          {/* Graph Display */}
          <div className="chart-container">
          <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    position: "top",
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      autoSkip: false, // Ensures labels don't skip (optional)
                    },
                  },
                  y: {
                    beginAtZero: true, // Ensures y-axis starts at zero
                  },
                },
                barThickness: 50, // Adjust the thickness of the bars (set to desired pixel value)
                maxBarThickness: 100, // (Optional) Limit the maximum thickness
              }}
            />

          </div>

          

          {/* View Logs Link */}
          <div className="view-logs-link">
              <button onClick={handleShowLogs}>
                {showLogs ? "Hide Logs" : "View Logs"}
              </button>
            </div>

{/* Modal for Viewing Activity Logs */}
{/* Modal for Viewing Activity Logs */}
{showLogs && activityLogsToDisplay.length > 0 ? (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Activity Logs</h3>
      {/* Close Button */}
      <button className="close-button" onClick={handleShowLogs}>
        ×
      </button>
      
      <table className="logs-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Email</th>
            <th>Role</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {/* Displaying each log in a row */}
          {activityLogsToDisplay.map((log) => (
            <tr key={log.id}>
              <td>{log.action}</td>
              <td>{log.email}</td>
              <td>{log.role}</td>
              <td>{new Date(log.timestamp.seconds * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        <button
          onClick={() => handlePageChange(setDealerPage, dealerPage - 1)}
          disabled={dealerPage === 1}
          className="pagination-button"
        >
          Previous
        </button>
        {Array.from(
          { length: Math.ceil(filteredActivityLogs.length / itemsPerPage) },
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
          disabled={dealerPage === Math.ceil(filteredActivityLogs.length / itemsPerPage)}
          className="pagination-button"
        >
          Next
        </button>
      </div>
    </div>
  </div>
) : showLogs ? (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Activity Logs</h3>
      <button className="close-button" onClick={handleShowLogs}>
        ×
      </button>
      <p>No activity logs found for {activityType}s.</p>
    </div>
  </div>
) : null}



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
              <div key={dealer.id} className="user-card" onClick={() => handleProfileClick(dealer)}>
                <p><strong>Dealer Name:</strong> {dealer.name}</p>
                <p><strong>Email:</strong> {dealer.email}</p>
                <p><strong>Referral ID:</strong> {dealer.referralId}</p>
              </div>
            ))}
            {/* Pagination for Dealers */}
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
              <div key={installer.id} className="user-card" onClick={() => handleProfileClick(installer)}>
                <p><strong>Installer Name:</strong> {installer.name}</p>
                <p><strong>Email:</strong> {installer.email}</p>
                <p><strong>Referral ID:</strong> {installer.referralId}</p>
              </div>
            ))}
            {/* Pagination for Installers */}
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

           {/* Profile Modal */}
           {isModalOpen && selectedProfile && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Edit Profile</h3>
                <button className="close-button" onClick={handleCloseModal}>
                  ×
                </button>
                <div>
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={updatedDetails.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={updatedDetails.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={updatedDetails.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={updatedDetails.companyName}
                    onChange={handleInputChange}
                  />
                </div>
                <button onClick={handleSaveChanges}>Save Changes</button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
