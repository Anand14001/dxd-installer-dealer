import React, { useState, useEffect } from "react";
import { db } from "../services/firebase"; // Assuming Firebase setup is done
import { collection, getDocs, doc, updateDoc, setDoc, addDoc } from "firebase/firestore";
import "../styles/components/QuotationManagement.css";

const QuotationManagement = () => {
  const [quotations, setQuotations] = useState([]);
  const [allQuotations, setAllQuotations] = useState([]); // Track all quotations
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvedQuotations, setApprovedQuotations] = useState([]); // Track approved/rejected quotations
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(""); // State for payment status filter
  const [statusFilter, setStatusFilter] = useState("");  

  const totalPages = Math.ceil(quotations.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const applyFilters = () => {
    let filteredQuotations = allQuotations;

    if (paymentStatusFilter) {
      filteredQuotations = filteredQuotations.filter(
        (quotation) => quotation.paymentStatus === paymentStatusFilter
      );
    }

    if (statusFilter) {
      filteredQuotations = filteredQuotations.filter(
        (quotation) => quotation.status === statusFilter
      );
    }

    if (searchQuery) {
      filteredQuotations = filteredQuotations.filter((quotation) =>
        String(quotation.orderNumber).toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setQuotations(filteredQuotations);
  };

  useEffect(() => {
    applyFilters();
  }, [paymentStatusFilter, statusFilter, searchQuery]);

  // Get current quotations based on the page
  const indexOfLastQuotation = currentPage * itemsPerPage;
  const indexOfFirstQuotation = indexOfLastQuotation - itemsPerPage;
  const currentQuotations = quotations.slice(indexOfFirstQuotation, indexOfLastQuotation);

  useEffect(() => {
    setCurrentPage(1); // Reset to the first page whenever the quotations change
  }, [quotations]);

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const quotationsSnapshot = await getDocs(collection(db, "Quotation_form"));
        const quotationsData = quotationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          paymentStatus: doc.data().paymentStatus || "Pending", // Default payment status
          ...doc.data(),
        }));
    
        // Sort quotations: non-approved/rejected first, followed by approved/rejected
        const sortedQuotations = quotationsData.sort((a, b) => {
          const statusOrder = (status) => {
            if (status === "Approved" || status === "Rejected") return 1; // Lower priority
            return -1; // Higher priority
          };
          return statusOrder(a.status) - statusOrder(b.status);
        });
    
        setQuotations(sortedQuotations);
        setAllQuotations(sortedQuotations); // Store the original list for resetting the search
        setApprovedQuotations(JSON.parse(localStorage.getItem("approvedQuotations")) || []);
      } catch (err) {
        setError("Error fetching quotations");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    

    fetchQuotations();
  }, []);

  const calculateCommission = (estimatePrice, commissionPercentage) => {
    return (estimatePrice * commissionPercentage) / 100;
  };

  const handleApprove = async (quotationId, estimatePrice, commissionPercentage, paymentStatus = "Pending") => {
    if (!estimatePrice || !commissionPercentage || !paymentStatus) {
      alert("Please fill in all fields before approving.");
      return;
    }

    const commissionValue = calculateCommission(Number(estimatePrice), Number(commissionPercentage));
    try {
      await updateDoc(doc(db, "Quotation_form", quotationId), {
        status: "Approved",
        estimatePrice: Number(estimatePrice),
        commissionPercentage: Number(commissionPercentage),
        commissionValue: Number(commissionValue),
        paymentStatus,
      });

      const quotation = quotations.find((q) => q.id === quotationId); // Find the updated quotation
      const productName = quotation.product?.productName || "Unknown Product";
      const orderNumber = quotation.orderNumber;
      const userId = quotation.userId;
  
      await addDoc(collection(db, "Notification"), {
        message: `Your Quotation #${orderNumber} for ${productName} has been approved.`,
        createdAt: new Date(),
        userId, // Assuming you want to associate the notification with the userId
        orderNumber, // Store order number for reference
        read: "false",
        type:"alert"
      });


      setQuotations((prev) =>
        prev.map((quotation) =>
          quotation.id === quotationId ? { ...quotation, status: "Approved", estimatePrice: Number(estimatePrice),
            commissionPercentage: Number(commissionPercentage),
            commissionValue: Number(commissionValue),
            paymentStatus,
} : quotation
        )
      );
      console.log("Quotation approved successfully!");

    } catch (err) {
        console.error("Error approving quotation:", err);
        alert(err);
      }
    };

    const handleReject = async (quotationId) => {
        try {
          await updateDoc(doc(db, "Quotation_form", quotationId), {
            status: "Rejected",
          });

          const quotation = quotations.find((q) => q.id === quotationId); // Find the updated quotation
          const productName = quotation.product?.productName || "Unknown Product";
          const orderNumber = quotation.orderNumber;
          const userId = quotation.userId;

          await addDoc(collection(db, "Notification"), {
            message: `Your Quotation #${orderNumber} for ${productName} has been Rejected. Please rebiew and resubmit.`,
            createdAt: new Date(),
            userId, // Assuming you want to associate the notification with the userId
            orderNumber, // Store order number for reference
            read: "false",
            type:"alert"
          });
    
          setQuotations((prev) =>
            prev.map((quotation) =>
              quotation.id === quotationId ? { ...quotation, status: "Rejected" } : quotation
            )
          );
          console.log("Quotation rejected successfully!");
        } catch (err) {
          console.error("Error rejecting quotation:", err);
          alert("Error updating the quotation. Please check the console for details.");
        }
      };

  // Search function
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query === "") {
      setQuotations(allQuotations); // Restore the full list when the search is cleared
    } else {
      const filteredQuotations = allQuotations.filter((quotation) => {
        const orderNumber = String(quotation.orderNumber).toLowerCase();
        return orderNumber.includes(query);
      });

      setQuotations(filteredQuotations);
    }
  };

  return (
    <div className="quotation-management-container">
      <div className="quotation-header">
        <h1>Quotation Management</h1>
      </div>

      {/* Search Input */}
      <div className="quotation-search">
        <input
          type="text"
          placeholder="Search by Order Number"
          value={searchQuery}
          onChange={handleSearch}
        />

        <select
          value={paymentStatusFilter}
          onChange={(e) => setPaymentStatusFilter(e.target.value)}
        >
          <option value="">All Payment Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Canceled">Canceled</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
          {currentQuotations.length > 0 ? (
            currentQuotations.map((quotation) => (
              <div key={quotation.id} className="quotation-card">
                <p><strong>Order Number:</strong> {quotation.orderNumber}</p>
                <p><strong>Client Name:</strong> {quotation.clientName}</p>
                <p><strong>Product:</strong> {quotation.product?.productName}</p>
                <p><strong>Height:</strong> {quotation.product?.height} ft</p>
                <p><strong>Width:</strong> {quotation.product?.width} ft</p>
                <p><strong>Postal Code:</strong> {quotation.postalCode}</p>
                <p><strong>Phone:</strong> {quotation.clientPhone}</p>
                <p><strong>User Id: </strong>{quotation.userId}</p>
                <div className="quotation-actions">
                  <div className="estimate-price">
                    <label htmlFor={`estimate-price-${quotation.id}`} className="estimate-price-label">
                      <strong>Estimated Price: </strong>
                    </label>
                    <input
                      type="number"
                      id={`estimate-price-${quotation.id}`}
                      placeholder="Enter Estimate Price"
                      value={quotation.estimatePrice || ""}
                      onChange={(e) => {
                        const updatedQuotations = quotations.map((q) =>
                          q.id === quotation.id ? { ...q, estimatePrice: e.target.value } : q
                        );
                        setQuotations(updatedQuotations);
                      }}
                    />
                  </div>
                  <div className="commission-percentage">
                    <label htmlFor={`commission-percentage-${quotation.id}`} className="commission-percentage-label">
                      <strong>Commission Percentage: </strong>
                    </label>
                    <input
                      type="number"
                      id={`commission-percentage-${quotation.id}`}
                      placeholder="Enter Commission Percentage"
                      value={quotation.commissionPercentage || ""}
                      onChange={(e) => {
                        const updatedQuotations = quotations.map((q) =>
                          q.id === quotation.id ? { ...q, commissionPercentage: e.target.value } : q
                        );
                        setQuotations(updatedQuotations);
                      }}
                    />
                  </div>
                  <p>
                    <strong>Commission Value:</strong>{" "}
                    {calculateCommission(
                      quotation.estimatePrice || 0,
                      quotation.commissionPercentage || 0
                    )}
                  </p>
                  
                  <div className="payment-status">
                    <label htmlFor={`payment-status-${quotation.id}`} className="payment-status-label">
                      <strong>Payment Status: </strong>
                    </label>
                    <select
                      id={`payment-status-${quotation.id}`}
                      value={quotation.paymentStatus || "Pending"}
                      onChange={(e) => {
                        const updatedQuotations = quotations.map((q) =>
                          q.id === quotation.id ? { ...q, paymentStatus: e.target.value } : q
                        );
                        setQuotations(updatedQuotations);
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </div>
                </div>

                <p><strong>Status:</strong> {quotation.status || "Pending"}</p>

                <div className="quotation-status-actions">
                    {quotation.status !== "Approved" && quotation.status !== "Rejected" && (
                        <div className="quotation-status-actions">
                        <button
                            onClick={() =>
                            handleApprove(
                                quotation.id,
                                quotation.estimatePrice,
                                quotation.commissionPercentage,
                                quotation.paymentStatus
                            )
                            }
                        >
                            Approve
                        </button>
                        <button onClick={() => handleReject(quotation.id)}>Reject</button>
                        </div>
                    )}

                    {(quotation.status === "Approved" || quotation.status === "Rejected") && (
                        <div>
                        <p>Notification sent!</p>
                        </div>
                    )}
                    </div>


                
              </div>
            ))
          ) : (
            <p>No quotations found.</p>
          )}
        </div>
      )}
       <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>

        <span>Page {currentPage} of {totalPages}</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default QuotationManagement;
