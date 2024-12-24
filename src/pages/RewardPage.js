import React, { useEffect, useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "../styles/components/rewardsPage.css";

const RewardsPage = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date");

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setError(null);
    setLoading(true);

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const q = query(collection(db, "Rewards"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const rewardsList = querySnapshot.docs.map((doc) => doc.data());
        setRewards(rewardsList);
      } else {
        setRewards([]);
      }
    } catch (err) {
      console.error("Error fetching rewards:", err.message);
      setError("Failed to load rewards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const sortedRewards = [...rewards].sort((a, b) => {
    if (sortOption === "date") {
      return new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000);
    } else if (sortOption === "status") {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const filteredRewards = sortedRewards.filter((reward) =>
    reward.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rewards-page">
      <h2>Your Rewards</h2>

      {/* Search and Sort Options */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search rewards..."
          value={searchTerm}
          onChange={handleSearch}
        />

        <select value={sortOption} onChange={handleSortChange}>
          <option value="date">Sort by Date</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {loading ? (
        <p>Loading rewards...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : filteredRewards.length === 0 ? (
        <div className="empty-state">
          <p>No rewards available at the moment.</p>
          <img
            src="/path/to/empty-state-illustration.png"
            alt="No Rewards"
          />
        </div>
      ) : (
        <div className="rewards-list">
          {filteredRewards.map((reward, index) => (
            <div key={index} className="reward-item">
              <h4>{reward.message}</h4>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`status ${reward.status.toLowerCase()}`}
                >
                  {reward.status}
                </span>
              </p>
              <p>
                <strong>Coupon Code:</strong> {reward.couponNumber}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(reward.createdAt.seconds * 1000).toLocaleDateString()}
              </p>
              <button onClick={() => alert("Redeem functionality coming soon!")}>
                Redeem Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RewardsPage;
