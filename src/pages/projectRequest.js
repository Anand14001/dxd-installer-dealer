import React, { useEffect, useState } from "react";
import { db } from "../services/firebase"; // Import Firestore
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import "../styles/components/projectRequestPage.css"; // Add your styles here

const ProjectRequestPage = () => {
  const [projects, setProjects] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedInstaller, setSelectedInstaller] = useState("");
  const [deadline, setDeadline] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Approved");
  const [instructions, setInstructions] = useState({}); // Store instructions for each project
  const [selectedInstruction, setSelectedInstruction] = useState(null); // For editing an instruction
  const [instructionText, setInstructionText] = useState(""); // To store the text input for instructions
  const [showInstructionModal, setShowInstructionModal] = useState(false);


  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 10;


  const handleAddInstruction = (projectId) => {
    setSelectedProject(projectId);
    setInstructionText(""); // Clear the input field
    setShowInstructionModal(true);
    setSelectedInstruction(null); // No instruction selected for adding
  };

  const handleEditInstruction = (projectId, instruction) => {
    setSelectedProject(projectId);
    setInstructionText(instruction); // Pre-populate the input field with the existing instruction
    setShowInstructionModal(true);
    setSelectedInstruction(instruction); // Mark as editing
  };

  const handleSubmitInstruction = async () => {
    if (!instructionText.trim()) {
      alert("Instruction is required.");
      return;
    }

    const projectRef = doc(db, "Quotation_form", selectedProject);

    await updateDoc(projectRef, {
      installerInstructions: instructionText,
    });

    setInstructions((prev) => ({
      ...prev,
      [selectedProject]: instructionText,
    }));

    alert("Instruction saved successfully!");
    setShowInstructionModal(false); // Close modal
    setSelectedProject(null);
    setInstructionText(""); // Clear input field
  };

  const closeInstructionModal = () => {
    setShowInstructionModal(false);
    setSelectedProject(null);
    setInstructionText(""); // Clear input field
  };


  // Fetch projects and related user details
  useEffect(() => {
    const fetchProjects = async () => {
      const q = query(
        collection(db, "Quotation_form"),
        where("status", "==", selectedStatus)
      );
      const querySnapshot = await getDocs(q);

      const projectData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const project = { id: doc.id, ...doc.data() };

          // Fetch user details (Dealer) using userId
          if (project.userId) {
            const userQuery = query(collection(db, "users"), where("uid", "==", project.userId));
            const userSnapshot = await getDocs(userQuery);
            const user = userSnapshot.docs[0]?.data();
            if (user) {
              project.dealer = user; // Attach dealer details to the project
            }
          }
          return project;
        })
      );

      setProjects(projectData);
    };

    const fetchInstallers = async () => {
      const q = query(collection(db, "users"), where("role", "==", "Installer"));
      const querySnapshot = await getDocs(q);
      const installerData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInstallers(installerData);
    };

    fetchProjects();
    fetchInstallers();
  }, [selectedStatus]);

  // Assign a project to an installer
  const handleAssign = (projectId) => {
    setSelectedProject(projectId);
    setShowAssignModal(true);
  };

  const confirmAssignment = async () => {
    if (selectedInstaller && selectedProject) {
      // Find the selected installer's details
      const installer = installers.find((inst) => inst.id === selectedInstaller);

      if (!installer) {
        alert("Installer details not found.");
        return;
      }

      const projectRef = doc(db, "Quotation_form", selectedProject);

      await updateDoc(projectRef, {
        Installer: "Assigned",
        assignedTo: selectedInstaller,
        assignedInstallerName: installer.name,
        assignedInstallerEmail: installer.email,
        installationDeadline: deadline,
      });

      alert("Project assigned successfully!");
      setShowAssignModal(false);
      setSelectedProject(null);
      setSelectedInstaller("");
      setDeadline("");

      // Refresh projects
      setProjects((prev) => prev.filter((p) => p.id !== selectedProject));
    } else {
      alert("Please select an installer.");
    }
  };

  // Pagination Logic
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Move to the previous page
  const prevPage = () => setCurrentPage(currentPage - 1);

  // Move to the next page
  const nextPage = () => setCurrentPage(currentPage + 1);

  // Search and Filter Logic
  const filteredProjects = currentProjects.filter((project) => {
    return (
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.product?.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.dealer && project.dealer.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="project-request-page">
      <h1>Project Requests</h1>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search projects by project name, dealer or client"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
<div className="filter-status">
<label>Filter by Status: </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          {/* Add more statuses as needed */}
        </select>
        </div>
      </div>


      <table className="project-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Client Details</th>
            <th>Dealer Details</th>
            <th>Project</th>
            <th>Features</th>
            <th>Actions</th>
            <th>Installer Details</th>
            <th>Deadline</th>
            <th>Instructions</th>

          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr key={project.id}>
              <td>{project.id}</td>
              <td>
                <strong>Client Name: </strong>{project.clientName} <br />
                <strong>Client Phone: </strong>{project.clientPhone} <br />
                <strong>Client city: </strong>{project.city} <br />
              </td>
              <td>
                {project.dealer ? (
                  <>
                    <strong>Dealer name: </strong>{project.dealer.name} <br />
                    <strong>Dealer ID: </strong>{project.dealer.uid} <br />
                    <strong>Dealer mail: </strong>{project.dealer.email} <br />
                  </>
                ) : (
                  "No dealer details"
                )}
              </td>
              <td>{project.product?.productName}</td>
              <td>
                {project.product?.features
                  ? Object.entries(project.product.features).map(([key, value], index) => (
                      <div key={index}>
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
                      </div>
                    ))
                  : <strong>No features listed.</strong>}
              </td>
              <td>
                <button
                  className="assign-btn"
                  onClick={() => handleAssign(project.id)}
                >
                  Assign
                </button>
              </td>

              <td>
                {project.Installer === "Assigned" && project.assignedTo ? (
                  installers.find((installer) => installer.id === project.assignedTo) ? (
                    <>
                      <strong>Installer name: </strong>{installers.find((installer) => installer.id === project.assignedTo).name}, 
                      <strong>Installer ID: </strong>{installers.find((installer) => installer.id === project.assignedTo).uid}
                    </>
                  ) : (
                    "Installer details not found"
                  )
                ) : (
                  "No installer assigned yet"
                )}
              </td>

              <td>
            {project.installationDeadline ? project.installationDeadline : "No deadline set"}
            </td>

            <td>
                {project.instructions ? (
                    <div>
                        <ul>
                            <li>{project.installerInstructions || null}</li>
                        </ul>
                  <button onClick={() => handleEditInstruction(project.id, project.instructions)}>
                   Add Instruction
                  </button>
                  </div>
                ) : (
                  <button onClick={() => handleAddInstruction(project.id)}>Add Instruction</button>
                )}
              </td>


            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button
          onClick={nextPage}
          disabled={currentPage === Math.ceil(projects.length / projectsPerPage)}
        >
          Next
        </button>
      </div>

      {showInstructionModal && (
  <div className="modal">
    <div className="modal-content">
      <h2>{selectedInstruction ? "Edit Instruction" : "Add Instruction"}</h2>
      <textarea
        value={instructionText}
        onChange={(e) => setInstructionText(e.target.value)}
        placeholder="Enter instructions"
        required
      />
      <div className="modal-actions">
        <button className="confirm-btn" onClick={handleSubmitInstruction}>
          {selectedInstruction ? "Update Instruction" : "Add Instruction"}
        </button>
        <button className="cancel-btn" onClick={closeInstructionModal}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


      {showAssignModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Assign Installer</h2>
            <select
              value={selectedInstaller}
              onChange={(e) => setSelectedInstaller(e.target.value)}
            >
              <option value="">Select Installer</option>
              {installers.map((installer) => (
                <option key={installer.id} value={installer.id}>
                  {installer.name} ({installer.email})
                </option>
              ))}
            </select>

            <div>
                <label>Set Deadline:</label>
                <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                />
            </div>

            <div className="modal-actions">
              <button className="confirm-btn" onClick={confirmAssignment}>
                Confirm
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectRequestPage;
