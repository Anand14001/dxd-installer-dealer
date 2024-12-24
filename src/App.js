import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigation } from "react-router-dom";
import Login from "./pages/login.js";
import Signup from "./pages/signup.js";
import AdminDashboard from "./pages/AdminDashboard.js";
import DealerDashboard from "./pages/DealerDashboard.js";
import InstallerDashboard from "./pages/InstallerDashboard.js";
import NotificationsPage from "./pages/NotificationsPage.js";
import ReferralPage from "./pages/ReferralPage.js";
import { useEffect, useState } from "react";
import { auth, db } from "./services/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import './App.css';
import ProductPage from "./pages/ProductPage.js";
import ProductDetailsPage from "./pages/ProductDetails.js";
import OrdersPage from "./pages/Orders.js";
import QuotationManagement from "./pages/Quotations.js";
import RewardsPage from "./pages/RewardPage.js";
import ProjectPage from "./pages/ProjectPage.js";
import AssignmentPage from "./pages/Assignment.js";
import ProjectStatusPage from "./pages/ProjectStatusPage.js";
import ProjectRequestPage from "./pages/projectRequestPage.js";

const Navbar = ({userRole, handleLogout}) => {
  const location = useLocation(); // Get the current location
  const isActive = (path) => location.pathname === path;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userRole) {
      const notificationsQuery = query(
        collection(db, "Notification"),
        where("userId", "==", auth.currentUser?.uid),
        where("read", "==", "false")
      );
  
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        setUnreadCount(snapshot.size); // Count unread notifications
      });
  
      return () => unsubscribe(); // Cleanup on unmount
    }
  }, [userRole]);


  return(
    <nav className="navbar">
      <ul className="nav-list">
        {userRole === "Admin" && (
          <>
            <li className={`navbar-item ${isActive("/admin-dashboard") ? "active" : ""}`}><Link to="/admin-dashboard">Dashboard</Link></li>
            <li className="navbar-item"><Link to="/Quotation-management">Quotations</Link></li>
            <li className="navbar-item"><Link to="/project-request">Project Requests</Link></li>
            <li className="navbar-item"><Link to="/products">Products</Link></li>
         
          </>
        )}

        {userRole === "Dealer" && (
          <>
            <li className={`navbar-item ${isActive("/dealer-dashboard") ? "active" : ""}`}><Link to="/dealer-dashboard">Dashboard</Link></li>
            <li className="navbar-item"><Link to="">Quotations</Link></li>
            <li className="navbar-item"><Link to="/referral">Referral</Link></li>
            <li className="navbar-item"><Link to="/reward">Rewards</Link></li>
            <li className="navbar-item"><Link to="/products">Products</Link></li>
            <li className="navbar-item"><Link to="/Orders">Orders</Link></li>
   
          </>
        )}

        {userRole === "Installer" && (
          <>
          <li className={`navbar-item ${isActive("/installer-dashboard") ? "active" : ""}`}><Link to="/installer-dashboard">Dashboard</Link></li>
          <li className="navbar-item"><Link to="/project">Projects</Link></li>
          <li className="navbar-item"><Link to="/status">My Projects</Link></li>
          <li className="navbar-item"><Link to="/assignment">Assignments</Link></li>
          </>
        )}

      {(userRole === "Admin" || userRole === "Dealer" || userRole === "Installer") && (
          <li className="navbar-item">
            <Link to="/notifications">
              <span className="notification-icon">🔔</span>
              {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
            </Link>
          </li>
        )}

        {!userRole && (
          <>
            <li className={`navbar-item ${isActive("/login") ? "active" : ""}`}><Link to="/login">Login</Link></li>
            <li className={`navbar-item ${isActive("/signup") ? "active" : ""}`}><Link to="/signup">Signup</Link></li>
          </>
        )}

      </ul>

      {(userRole === "Admin" || userRole === "Dealer" || userRole === "Installer") && (
        <button className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
      )}
    </nav>
  )

}


function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await auth.signOut();
    window.location.reload(); // Or use navigation to redirect to the login page
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            console.error("No user document found!");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <div>
        <p>Loading...</p>
      </div>
    );

  const getDashboardRoute = () => {
    switch (userRole) {
      case "Admin":
        return "/admin-dashboard";
      case "Dealer":
        return "/dealer-dashboard";
      case "Installer":
        return "/installer-dashboard";
      default:
        return "/login";
    }
  };

  return (
    <Router>
      <Navbar userRole={userRole} handleLogout={handleLogout} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={userRole ? <Navigate to={getDashboardRoute()} /> : <Login />} />
        <Route path="/signup" element={userRole ? <Navigate to={getDashboardRoute()} /> : <Signup />} />

        {/* Role-Based Routes */}
        {userRole === "Admin" && (
          <>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/Quotation-management" element={<QuotationManagement/>}/>
            <Route path="/project-request" element={<ProjectRequestPage/>} />
            <Route path="/products" element={<ProductPage/>} />
            <Route path="/product-details/:productId" element={<ProductDetailsPage />} />
          </>
        )}
        {userRole === "Dealer" && (
          <>
            <Route path="/dealer-dashboard" element={<DealerDashboard />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/referral" element={<ReferralPage/>}/>
            <Route path="/Products" element={<ProductPage/>}/>
            <Route path="/product-details/:productId" element={<ProductDetailsPage />} />
            <Route path="/Orders" element={<OrdersPage/>}/>
            <Route path="/reward" element={<RewardsPage/>}/>
          </>
        )}
        {userRole === "Installer" && (
          <>
            <Route path="/installer-dashboard" element={<InstallerDashboard />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/project" element={<ProjectPage/>} />
            <Route path="/assignment" element={<AssignmentPage/>}/>
            <Route path="/status" element={<ProjectStatusPage/>}/>
          </>
        )}

        {/* Redirect Routes */}
        <Route path="/" element={<Navigate to={getDashboardRoute()} />} />
        <Route path="*" element={<Navigate to={getDashboardRoute()} />} />
      </Routes>
    </Router>
  );
}

export default App;