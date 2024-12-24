import React, { useState } from "react";
import { auth, db } from "../services/firebase"; // Import Firebase instances
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, addDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/components/signup.css"; // Import the CSS file

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Dealer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [referralCode, setReferralCode] = useState(""); // State for referral code
  const [referralDetails, setReferralDetails] = useState(null);

  const navigate = useNavigate();

  // Function to generate a unique referral ID
  const generateReferralId = () => {
    const timestamp = Date.now(); // Current timestamp
    const randomNum = Math.floor(Math.random() * 1000000); // Random number for uniqueness
    return `ref-${timestamp}-${randomNum}`;
  };

  const generateCouponNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit unique number
    return `CPN-${randomNum}`;
  };

  // Function to validate the referral code
  const handleReferralCodeValidation = async (code) => {
    setReferralDetails(null); // Reset referral details
    setError(""); // Reset error message

    if (!code) return; // If no referral code, skip validation

    try {
      // Query Firestore to find the referral code
      const q = query(collection(db, "users"), where("referralId", "==", code));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // If the referral code exists, set the referral details
        const referralData = querySnapshot.docs[0].data();
        setReferralDetails({
          uid: referralData.uid,
          name: referralData.name,
          email: referralData.email,
        });
      } else {
        setError("Invalid referral code. Please check and try again.");
      }
    } catch (err) {
      console.error("Error validating referral code:", err.message);
      setError("Failed to validate referral code. Please try again.");
    }
  };

  // Function to handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Create a new user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate a unique referral ID for the new user
      const referralId = generateReferralId();

      // Add user details to Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        name: name,
        role: role,
        uid: user.uid,
        referralId: referralId, // Save the referral ID
        referrals: [], // Initialize an empty array to store referrals
      });

      // If a valid referral code was provided, update the referring user's data and send a notification
      if (referralDetails) {
        const referringUserRef = doc(db, "users", referralDetails.uid);

        // Update the referring user's referrals array
        await updateDoc(referringUserRef, {
          referrals: arrayUnion(user.uid),
        });

        // Add a notification to the referring user
        await addDoc(collection(db, "Notification"), {
          message: `${name} has joined using your referral code.`,
          createdAt: new Date(),
          userId: referralDetails.uid, // Associate the notification with the referring user's ID
          read: "false",
          type: "alert",
        });

        await addDoc(collection(db, "Rewards"),{
          message:`You’ve earned a one-time reward for referring ${name}.
          Keep referring more users to earn additional rewards for their first orders!`,
          createdAt: new Date(),
          status:"unclaimed",
          type:"Referral",
          userId: referralDetails.uid,
          couponNumber: generateCouponNumber(),
        });

         // Add a reward message for the referred user
         await addDoc(collection(db, "Rewards"), {
          message: `Thank you for signing up using a referral code, ${name}! You’ve earned a Silver-level commission on your first order. Complete your first order to activate your reward benefits!`,
          createdAt: new Date(),
          status: "unclaimed",
          type: "Referral",
          userId: user.uid,
          couponNumber: generateCouponNumber(),
        });

      }

      

      // Add a welcome notification to the new user
      await addDoc(collection(db, "Notification"), {
        message: `Welcome to DXD Dealer-Installer Manager, ${name}! Thank you for joining us and being a part of our growing network.`,
        createdAt: new Date(),
        userId: user.uid, // Associate the notification with the new user's ID
        read: "false",
        type: "info",
      });

      setSuccess("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 2000); // Redirect to login page
    } catch (err) {
      console.error("Signup error:", err.message);
      // Provide a more user-friendly error message
      setError(err.message.includes("email-already")
        ? "This email is already in use. Please try logging in or use a different email."
        : "Failed to create an account. Please try again.");
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup} className="signup-form">
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          required
        />

        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <label>Role:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Dealer">Dealer</option>
          <option value="Installer">Installer</option>
        </select>

        <label>Referral Code (Optional):</label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => {
            setReferralCode(e.target.value);
            handleReferralCodeValidation(e.target.value);
          }}
          placeholder="Enter referral code (if any)"
        />

        {referralDetails && (
          <div className="referral-details">
            <h4>Referral Details:</h4>
            <p>
              <strong>UID:</strong> {referralDetails.uid}
            </p>
            <p>
              <strong>Name:</strong> {referralDetails.name}
            </p>
            <p>
              <strong>Email:</strong> {referralDetails.email}
            </p>
          </div>
        )}

        <button type="submit" className="signup-button">
          Sign Up
        </button>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <p className="link" onClick={() => navigate("/login")}>
          Already have an account? <span>Login</span>
        </p>
      </form>
    </div>
  );
};

export default Signup;
