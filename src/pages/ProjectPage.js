import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import "../styles/components/projectPage.css";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 2;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(
          collection(db, "Quotation_form"),
          where("status", "==", "Approved")
        );
        const querySnapshot = await getDocs(q);

        const projectList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProjects(projectList);
        setFilteredProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects: ", error);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleRequestProject = async (project) => {
    try {
      const currentUser = auth.currentUser;
  
      if (!currentUser) {
        alert("You must be logged in to request a project.");
        return;
      }
  
      // Check if the user has already requested the project
      const requestQuery = query(
        collection(db, "Project_request"),
        where("installerId", "==", currentUser.uid),
        where("projectName", "==", project.product?.productName),
        where("status", "==", "Pending") // Ensure it's a pending request
      );
  
      const requestSnapshot = await getDocs(requestQuery);
  
      if (!requestSnapshot.empty) {
        alert("You have already requested this project.");
        return;
      }
  
      // Fetch installer details
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        alert("Installer details not found. Please contact support.");
        return;
      }
  
      const userData = userDoc.data();
  
      // Prepare request data
      const requestData = {
        projectName: project.product?.productName,
        features: project.product?.features || {},
        requestId: `REQ-${Date.now()}`,
        installerId: currentUser.uid,
        installerName: userData.name,
        installerEmail: userData.email,
        referralId: userData.referralId,
        createdAt: Timestamp.now(),
        status: "Pending",
        category: project.product?.category || "unknown",
        height: project.product?.height,
        width: project.product?.width,
        clientName: project.clientName,
        clientPhone: project.clientPhone,
        clientEmail: project.clientEmail,
        clientCity: project.city,
      };
  
      // Add the new request
      await addDoc(collection(db, "Project_request"), requestData);
  
      // Add notification
      await addDoc(collection(db, "Notification"), {
        message: `Your project request for ${project.product?.productName} has been successfully submitted and is now under review by the admin. You will be notified once the status is updated. Thank you for your submission!`,
        createdAt: new Date(),
        read: "false",
        type: "alert",
        userId: currentUser.uid,
      });
  
      alert("Project request successfully submitted to admin!");
    } catch (error) {
      console.error("Error creating project request:", error);
      alert(error);
    }
  };
  

  


  // Handle Search
  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    let filtered = projects.filter(
      (project) =>
        project.clientName?.toLowerCase().includes(lowercasedSearchTerm) ||
        project.product?.productName?.toLowerCase().includes(lowercasedSearchTerm)
    );
    
    // Apply city filter
    if (cityFilter) {
      filtered = filtered.filter((project) => project.city === cityFilter);
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        (project) => project.product?.category === categoryFilter
      );
    }



    setFilteredProjects(filtered);
  }, [searchTerm, cityFilter, categoryFilter,  projects]);

  // Pagination logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  return (
    <div>
      <h1>Available Projects</h1>

      {/* Search and Filter */}
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Search by client or product"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">All Cities</option>
          {[...new Set(projects.map((project) => project.city))].map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {[...new Set(projects.map((project) => project.product?.category))].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        
      </div>

      {/* Project List */}
      {loading ? (
        <p>Loading projects...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : currentProjects.length === 0 ? (
        <p>No projects available at the moment.</p>
      ) : (
        <div className="project-list">
          {currentProjects.map((project) => (
            <div key={project.id} className="project-item">
              <h3>Order #{project.orderNumber}</h3>
              <p>
                <strong>Client Name:</strong> {project.clientName}
              </p>
              <p>
                <strong>City:</strong> {project.city}
              </p>
              <p>
                <strong>Postal Code:</strong> {project.postalCode}
              </p>
              <p>
                <strong>Contact:</strong> {project.clientPhone}
              </p>
              <div className="product-details">
                <h4>Product: {project.product?.productName}</h4>
                <p>
                  <strong>Category:</strong> {project.product?.category}
                </p>
                <p>
                  <strong>Dimensions:</strong> {project.product?.width} x {project.product?.height}
                </p>
                <p>
                  <strong>Color:</strong>{" "}
                  {project.product?.features?.colorOptions || "No color options."}
                </p>
              </div>

              <div className="additional-details">
                <strong>Features:</strong>
                <ul>
                  {project.product?.features
                    ? Object.entries(project.product.features).map(([key, value], index) => (
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
                      ))
                    : <li>No features listed.</li>}
                </ul>
              </div>
              <button 
              className="request-project-button"
              onClick={() => handleRequestProject(project)}>
                Request Project
              </button>
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
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProjectsPage;
