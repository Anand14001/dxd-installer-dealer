import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { getDoc, doc, collection, getDocs, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import "../styles/components/InstallerDashboard.css"; // Import the CSS file

const InstallerDashboard = () => {
  const [installerName, setInstallerName] = useState("");
  const [projects, setProjects] = useState([]);
  const [visibleProjects, setVisibleProjects] = useState([]);  // State for visible projects
  const [showAllProjects, setShowAllProjects] = useState(false);  // State to toggle showing all projects
  const [notifications, setNotifications] = useState([]);
  const [projectStatusCounts, setProjectStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [requestedProjects, setRequestedProjects] = useState([]);


  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/login");
    } else {
      const fetchInstallerData = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const { name } = userDoc.data();
            setInstallerName(name);

            const projectsSnapshot = await getDocs(
              collection(db, "Project_request")
            );
            const projectList = projectsSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(project => project.installerId === auth.currentUser.uid);

            setProjects(projectList);

            // Set the first two projects initially
            setVisibleProjects(projectList.slice(0, 2));

            // Calculate project status counts
            const statusCounts = projectList.reduce((counts, project) => {
              counts[project.status] = (counts[project.status] || 0) + 1;
              return counts;
            }, {});
            setProjectStatusCounts(statusCounts);

            const notificationsSnapshot = await getDocs(
              collection(db, "Notification")
            );
            const notificationsList = notificationsSnapshot.docs
              .map(doc => doc.data())
              .filter(notification => notification.userId === auth.currentUser.uid);
            setNotifications(notificationsList);
          } else {
            setError("No user data found.");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("An error occurred while fetching data. Please try again later.");
        } finally {
          setLoading(false);
        }
      };

      fetchInstallerData();
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

  const refreshProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Project_request"));
      const refreshedProjects = [];
      querySnapshot.forEach(doc => {
        refreshedProjects.push({ id: doc.id, ...doc.data() });
      });
      setProjects(refreshedProjects); // Update the state with refreshed data
      console.log("Projects refreshed:", refreshedProjects);
    } catch (err) {
      console.error("Error refreshing projects:", err);
    }
  };
  

  const handleStatusSelect = async (projectId, newStatus) => {
    try {
      await updateDoc(doc(db, "Project_request", projectId), { workStatus: newStatus });
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId ? { ...project, workStatus: newStatus } : project
        )
      );
      setShowStatusOptions(false);
      window.location.reload();
    } catch (err) {
      console.error("Error updating project status:", err);
    }
  };

   // Function to handle Work Status update
   const handleWorkStatusChange = async (projectId, newStatus) => {
    const projectRef = doc(db, "Project_request", projectId);
    await updateDoc(projectRef, {
      workStatus: newStatus,
    });
  };

  // Function to handle deleting the request
  const handleDeleteRequest = async (projectId) => {
    const projectRef = doc(db, "Project_request", projectId);
    await deleteDoc(projectRef);
    // Optionally, update the UI to remove the deleted request
    setRequestedProjects(requestedProjects.filter((project) => project.id !== projectId));
  };

  // Function to notify admin (placeholder function)
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

  

  const handleStatusButtonClick = (projectId) => {
    setSelectedProjectId(projectId);
    setShowStatusOptions(true);
  };

  const ProjectItem = ({ project }) => (
    <div className="project-item">
      <h5><strong>Project:</strong> {project.projectName}</h5>
      <h4>Client Details</h4>
      <p><strong>Client Name:</strong> {project.clientName || "N/A"}</p>
      <p><strong>Client Phone:</strong> {project.clientPhone || "N/A"}</p>
      <p><strong>Client Email:</strong> {project.clientEmail || "N/A"}</p>
      <p><strong>Client location:</strong> {project.clientCity || "N/A"}</p>
      <h4>Installer Details</h4>
      <p><strong>Installer Name:</strong> {project.installerName || "N/A"}</p>
      <p><strong>Installer Name:</strong> {project.installerName || "N/A"}</p>
      <p><strong>Status:</strong> {project.status || "Pending"}</p>
      <div className="project-actions">
      {project.status === "Assigned" && (
        <>
          <button
            className="status-button"
            onClick={() => handleStatusButtonClick(project.id)} // Open status options for this project
          >
            {project.workStatus || "Update Work Status"}
          </button>
          {selectedProjectId === project.id && showStatusOptions && (
            <div className="status-options">
              <button onClick={() => handleStatusSelect(project.id, "Installation Started")}>
                Installation Started
              </button>
              <button onClick={() => handleStatusSelect(project.id, "On-Going")}>
                On-Going
              </button>
              <button onClick={() => handleStatusSelect(project.id, "Completed")}>
                Completed
              </button>
            </div>
          )}
          </>
        )}
      {/* Show Notify Admin button only if status is "Pending" */}
      {project.status === "Pending" && (
        <button
          className="notify-admin-button"
          onClick={() => handleNotifyAdmin(project.id)}
          disabled={isNotifyDisabled(project.lastNotificationTime)}
        >
          Notify Admin
        </button>
      )}
      </div>
      
    </div>
  );

  const handleViewAllProjects = () => {
    setShowAllProjects(true);
    setVisibleProjects(projects);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Installer Dashboard</h1>
      </div>
      {loading ? (
        <p className="loading">Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div>
          <h2>Welcome, {installerName}</h2>

          

          {/* Projects Section */}
          <div className="dashboard-section projects-section">
            <h3>My Projects</h3>
            <div className="container1">
              {visibleProjects.length > 0 ? (
                visibleProjects.map(project => (
                  <ProjectItem key={project.id} project={project} />
                ))
              ) : (
                <p>No projects assigned.</p>
              )}
              {!showAllProjects && (
              <button className="view-all-button" onClick={() => navigate('/status')}>
                View All Projects
              </button>
            )}
            </div>
            
          </div>

          {/* Project Status Section */}
          <div className="dashboard-section project-status-section">
            <h3>Project Summary</h3>
            <div className="status-summary">
            <p>Total Projects: {projects.length}</p>
              {Object.keys(projectStatusCounts).length > 0 ? (
                Object.entries(projectStatusCounts).map(([status, count]) => (
                  <p key={status}><strong>{status}:</strong> {count}</p>
                ))
              ) : (
                <p>No projects available to display status.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallerDashboard;
