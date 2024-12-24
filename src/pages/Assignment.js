import React, { useEffect, useState } from "react";
import { db } from "../services/firebase"; // Import Firestore
import { collection, query, where, getDocs } from "firebase/firestore";
import "../styles/components/assignmentPage.css"; // Assuming you have styles for the assignment page

const AssignmentPage = () => {
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // For search functionality
  const [categoryFilter, setCategoryFilter] = useState(""); // For filter functionality
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 2;

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      try {
        // Query Firestore for projects in the "Project_request" collection with status "Assigned"
        const q = query(
          collection(db, "Project_request"),
          where("status", "==", "Assigned")
        );
        const querySnapshot = await getDocs(q);

        // Map the results to an array
        const projectList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAssignedProjects(projectList);
        setFilteredProjects(projectList);
      } catch (error) {
        console.error("Error fetching assigned projects: ", error);
        setError("Failed to load assigned projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedProjects();
  }, []);

  // Handle Search
  useEffect(() => {
    let filtered = assignedProjects.filter(
      (project) =>
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.installerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.referralId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((project) => project.category === categoryFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, categoryFilter, assignedProjects]);

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  return (
    <div>
      <h1>Assigned Projects</h1>

      {/* Search and Filter */}
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Search by project name, installer, or referral ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {[...new Set(assignedProjects.map((project) => project.category))].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading assigned projects...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : currentProjects.length === 0 ? (
        <p>No projects assigned yet.</p>
      ) : (
        <div className="assigned-projects-list">
          {currentProjects.map((project) => (
            <div key={project.id} className="project-item">
              <h3>Request ID: {project.requestId}</h3>
              <p>
                <strong>Project Name:</strong> {project.projectName}
              </p>
              <p>
                <strong>Installer Name:</strong> {project.installerName}
              </p>
              <p>
                <strong>Installer Email:</strong> {project.installerEmail}
              </p>
              <p>
                <strong>Referral ID:</strong> {project.referralId}
              </p>
              <p>
                <strong>Created At:</strong> {project.createdAt.toDate().toLocaleString()}
              </p>
              <div className="product-details">
                <h4>Product: {project.projectName || "N/A"}</h4>
                <p>
                  <strong>Category:</strong> {project.category || "N/A"}
                </p>
                <p>
                  <strong>Dimensions:</strong> Width: {project.width || "N/A"}ft x Height: {project.height || "N/A"}ft
                </p>
              </div>

              {/* Displaying all features dynamically */}
              {project.features && Object.keys(project.features).length > 0 && (
                <div className="additional-details">
                  <h4>Features:</h4>
                  <ul>
                    {Object.entries(project.features).map(([key, value], index) => (
                      <li key={index}>
                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
                        {Array.isArray(value) ? (
                          <ul>
                            {value.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          value
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button
          className="prev-button"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={currentPage === index + 1 ? "active" : ""}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button
          className="next-button"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AssignmentPage;
