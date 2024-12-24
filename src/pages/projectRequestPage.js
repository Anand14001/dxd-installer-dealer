import React, { useEffect, useState } from "react";
import { db } from "../services/firebase"; // Import Firestore
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import "../styles/components/projectRequestPage.css"; // Add your styles here

const ProjectRequestPage = () => {
  const [projectRequests, setProjectRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectRequests = async () => {
      try {
        const q = query(collection(db, "Project_request"));
        const querySnapshot = await getDocs(q);

        // Map the results to an array
        const projects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProjectRequests(projects);
        setFilteredRequests(projects);
      } catch (error) {
        console.error("Error fetching project requests: ", error);
        setError("Failed to load project requests. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjectRequests();
  }, []);

  // Handle Search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = projectRequests.filter((project) =>
      project.projectName?.toLowerCase().includes(term)
    );
    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page
  };

  // Handle Filter by Status
  const handleFilter = (e) => {
    const status = e.target.value;
    setFilterStatus(status);

    const filtered = projectRequests.filter((project) =>
      status ? project.status === status : true
    );
    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page
  };

  // Paginate filtered requests
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Handle Pagination
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleAssign = async (projectId) => {
    try {
      // Get the project document
      const projectRef = doc(db, "Project_request", projectId);
      const projectSnapshot = await getDoc(projectRef);
  
      if (!projectSnapshot.exists()) {
        alert("Project not found.");
        return;
      }
  
      const projectData = projectSnapshot.data();
  
      // Update the status of the project
      await updateDoc(projectRef, { status: "Assigned" });
  
      // Add a notification for the installer
      await addDoc(collection(db, "Notification"), {
        message: `Congratulations! Your request for '${projectData.projectName}' has been approved by the admin!`,
        userId: projectData.installerId,
        read: "false",
        createdAt: new Date(),
      });
  
      // Update the UI
      setProjectRequests((prevProjects) =>
        prevProjects.map((proj) =>
          proj.id === projectId ? { ...proj, status: "Assigned" } : proj
        )
      );
  
      alert("Project assigned successfully.");
    } catch (error) {
      console.error("Error assigning project: ", error);
      alert(error.message || "Failed to assign project.");
    }
  };
  

  const handleReject = async (projectId) => {
    try {
      const projectRef = doc(db, "Project_request", projectId);
      await updateDoc(projectRef, { status: "Rejected" });
      setProjectRequests((prevProjects) =>
        prevProjects.map((proj) =>
          proj.id === projectId ? { ...proj, status: "Rejected" } : proj
        )
      );
      alert("Project rejected successfully.");
    } catch (error) {
      console.error("Error rejecting project: ", error);
      alert("Failed to reject project.");
    }
  };

  return (
    <div className="project-request-page">
      <h1>Project Requests</h1>

      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Search by project name..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <select value={filterStatus} onChange={handleFilter}>
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Assigned">Assigned</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p>Loading project requests...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : filteredRequests.length === 0 ? (
        <p>No project requests found.</p>
      ) : (
        <div>
          <div className="project-grid">
            {currentItems.map((project) => (
              <div
                key={project.id}
                className={`project-card ${project.status?.toLowerCase()}-status`}
              >
                <h2>{project.projectName || "Unnamed Project"}</h2>
                <p>
                  <strong>Status:</strong> {project.status || "Pending"}
                </p>
                <p>
                  <strong>Category:</strong> {project.category || "N/A"}
                </p>

                <p>
                <strong>Requested At:</strong>{" "}
                {project.createdAt?.toDate().toLocaleString() || "N/A"}
              </p>
              <p>
                <strong>Installer Name:</strong> {project.installerName || "N/A"}
              </p>
              <p>
                <strong>Installer Email:</strong> {project.installerEmail || "N/A"}
              </p>
              <p>
                <strong>Height:</strong> {project.height || "N/A"}
              </p>
              <p>
                <strong>Width:</strong> {project.width || "N/A"}
              </p>
              <p>
                <strong>Color Options:</strong> {project.features?.colorOptions || "N/A"}
              </p>
              <p>
                <strong>Operation:</strong>{" "}
                {project.features?.operation?.join(", ") || "N/A"}
              </p>
              <p>
                <strong>Accessories:</strong>{" "}
                {project.features?.accessories?.join(", ") || "N/A"}
              </p>
              <p>
                <strong>Additional Features:</strong>{" "}
                {project.features?.additionalFeatures?.join(", ") || "N/A"}
              </p>
              <p>
                <strong>Additional Items:</strong>{" "}
                {project.features?.additionalItems?.join(", ") || "N/A"}
              </p>

                {/* Other fields */}
                <div className="button-group">
                  <button
                    className="assign-button"
                    onClick={() => handleAssign(project.id)}
                    disabled={project.status === "Assigned"}
                  >
                    Assign
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => handleReject(project.id)}
                    disabled={project.status === "Rejected"}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="pagination1">
                <button
                    className="pagination-button1"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                    key={index + 1}
                    className={`pagination-button1 ${
                        currentPage === index + 1 ? "active" : ""
                    }`}
                    onClick={() => paginate(index + 1)}
                    >
                    {index + 1}
                    </button>
                ))}

                <button
                    className="pagination-button1"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
                </div>

        </div>
      )}
    </div>
  );
};

export default ProjectRequestPage;
