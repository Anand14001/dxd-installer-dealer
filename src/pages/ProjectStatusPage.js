import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase"; // Import Firestore
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";
import "../styles/components/projectStatusPage.css"; // Assuming you have styles for the page

const ProjectStatusPage = () => {
  const [requestedProjects, setRequestedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workStatusOptionsVisible, setWorkStatusOptionsVisible] = useState(null);
 


  useEffect(() => {
    const fetchRequestedProjects = async () => {
      try {
        // Query Firestore for projects in the "Project_request" collection
        const currentUserUid = auth.currentUser.uid
        const q = query(
          collection(db, "Project_request"),
          where("installerId", "==", currentUserUid) // Assuming 'currentUserUid' is the logged-in user's UID
        );
        const querySnapshot = await getDocs(q);

        // Map the results to an array
        const projectList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRequestedProjects(projectList);
      } catch (error) {
        console.error("Error fetching requested projects: ", error);
        setError("Failed to load your projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestedProjects();
  }, []); // Assuming the user is logged in, and their UID is passed

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "assigned-status"; // Green color
      case "Pending":
        return "pending-status"; // Orange color
      case "Rejected":
        return "rejected-status"; // Red color
      default:
        return "default-status"; // Default gray
    }
  };

  const handleWorkStatusChange = async (projectId, newStatus) => {
    const projectRef = doc(db, "Project_request", projectId);
    await updateDoc(projectRef, {
      workStatus: newStatus,
    });
    setRequestedProjects(
      requestedProjects.map((project) =>
        project.id === projectId ? { ...project, workStatus: newStatus } : project
      )
    );
    setWorkStatusOptionsVisible(null); // Close options after selection
  };

  const handleNotifyAdmin = async (projectId) => {
    const adminId = "4RdT9OAyUZVK7q5cy16yy71tVMl2"; // Admin's UID
    const project = requestedProjects.find((project) => project.id === projectId);
    if (!project) {
      alert("Project not found.");
      return;
    }
  
    try {
      const currentTimestamp = new Date();
  
      await addDoc(collection(db, "Notification"), {
        message: `A new project request for "${project.projectName}" has been submitted by "${project.installerName}" and is now under review. Please review the request and take appropriate action.`,
        userId: adminId,
        createdAt: currentTimestamp,
        read: "false",
        type: "alert",
      });
  
      const projectRef = doc(db, "Project_request", projectId);
      await updateDoc(projectRef, {
        lastNotificationTime: currentTimestamp,
      });
  
      // Update the local state immediately
      setRequestedProjects((prevProjects) =>
        prevProjects.map((proj) =>
          proj.id === projectId
            ? { ...proj, lastNotificationTime: currentTimestamp }
            : proj
        )
      );
  
      alert("Admin has been notified successfully.");
    } catch (error) {
      console.log("Error sending notification: ", error);
      alert("Error sending notification: " + error.message);
    }
  };
  

  const isNotifyDisabled = (lastNotificationTime) => {
    if (!lastNotificationTime) return false;
  
    const currentTime = new Date();
    const notificationTime =
      lastNotificationTime instanceof Date
        ? lastNotificationTime // Already a JavaScript Date
        : lastNotificationTime.toDate(); // Convert Firestore Timestamp to Date
  
    const timeDifference = (currentTime - notificationTime) / (1000 * 60 * 60); // Time difference in hours
  
    return timeDifference < 12; // Disable if less than 12 hours
  };
  
  
  



  return (
    <div className="project-status-page">
      <h1>Project Status</h1>

      {loading ? (
        <p>Loading your project requests...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : requestedProjects.length === 0 ? (
        <p>No projects requested yet.</p>
      ) : (
        <div className="projects-grid">
          {requestedProjects.map((project) => (
            <div key={project.id} className="project-card">
              <h3 className="project-title">{project.projectName}</h3>
              <p className={`status ${getStatusColor(project.status)}`}>
                <strong>Status:</strong> {project.status || "Pending"}
              </p>
              <p>
                <strong>Request ID:</strong> {project.requestId}
              </p>
              <p>
                <strong>Requested At:</strong> {project.createdAt?.toDate().toLocaleString() || "N/A"}
              </p>
              <div className="project-details">
                <p>
                  <strong>Category:</strong> {project.category || "N/A"}
                </p>
                <p>
                  <strong>Installer Name:</strong> {project.installerName || "N/A"}
                </p>
                <p>
                  <strong>Installer ID:</strong> {project.installerId || "N/A"}
                </p>
              </div>

              {/* Action buttons based on project status */}
              {project.status === "Pending" && (
                <button
                  className="notify-admin-button"
                  onClick={() => handleNotifyAdmin(project.id)}
                  disabled={isNotifyDisabled(project.lastNotificationTime)}
                >
                  Notify Admin
                </button>
              )}
{project.status === "Assigned" && (
                <div className="work-status-container">
                  {/* Work Status Button */}
                  <button
                    className="work-status-button"
                    onClick={() =>
                      setWorkStatusOptionsVisible(
                        workStatusOptionsVisible === project.id ? null : project.id
                      )
                    }
                  >
                    {project.workStatus || "Work Status"}
                  </button>

                  {/* Show work status options when the button is clicked */}
                  {workStatusOptionsVisible === project.id && (
                    <div className="work-status-options">
                      <button
                        className="work-status-option"
                        onClick={() => handleWorkStatusChange(project.id, "Installation Started")}
                      >
                        Installation Started
                      </button>
                      <button
                        className="work-status-option"
                        onClick={() => handleWorkStatusChange(project.id, "Ongoing")}
                      >
                        Ongoing
                      </button>
                      <button
                        className="work-status-option"
                        onClick={() => handleWorkStatusChange(project.id, "Completed")}
                      >
                        Completed
                      </button>
                    </div>
                  )}
                </div>
              )}

              {project.status === "Rejected" && (
                <button
                  className="delete-request-button"
                >
                  Delete Request
                </button>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectStatusPage;
