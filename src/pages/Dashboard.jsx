import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("pesasmart_user") || "null");

  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [frequency, setFrequency] = useState("Weekly");
  const [cycleLength, setCycleLength] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");

  async function loadGroups() {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/groups?createdBy=${user.user_id}`);
      const data = await res.json();
      if (data.status === "success") setGroups(data.groups);
    } catch {
      setError("Could not load your groups");
    }
  }

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line
  }, []);

  function handleLogout() {
    localStorage.removeItem("pesasmart_user");
    localStorage.removeItem("pesasmart_token");
    navigate("/");
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Group name is required"); return; }
    if (isNaN(contributionAmount) || Number(contributionAmount) <= 0) { setError("Enter a valid contribution amount"); return; }
    if (isNaN(cycleLength) || Number(cycleLength) < 1) { setError("Enter a valid cycle length"); return; }
    if (!startDate) { setError("Please choose a start date"); return; }

    setLoading(true);
    try {
      const res = await apiFetch(`/api/groups`, {
        method: "POST",
        body: JSON.stringify({
          name,
          contributionAmount,
          frequency,
          cycleLength,
          startDate,
          createdBy: user.user_id,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setName("");
        setContributionAmount("");
        setCycleLength("");
        setFrequency("Weekly");
        setStartDate("");
        loadGroups();
      } else {
        setError(data.message || "Could not create the group");
      }
    } catch {
      setError("Could not reach the server");
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="card">
        <h2>Please sign in</h2>
        <p className="subtitle">You need to sign in to manage your groups.</p>
        <button onClick={() => navigate("/")}>Go to Sign In</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard</h2>
        <button type="button" className="logout-btn" onClick={handleLogout}>Log out</button>
      </div>
      <p className="subtitle">Welcome, {user.full_name} — manage your Ikimina groups</p>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-number">{groups.length}</span>
          <span className="stat-label">Groups</span>
        </div>
      </div>

      <section className="panel">
        <h3>Create a new group</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleCreate}>
          <label>Group name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kimironko Traders Ikimina" required />
          <label>Contribution amount (RWF)</label>
          <input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="5000" required />
          <label>Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
          <label>Cycle length (number of members / rounds)</label>
          <input type="number" value={cycleLength} onChange={(e) => setCycleLength(e.target.value)} placeholder="10" required />
          <label>Start date (first payout date)</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Group"}</button>
        </form>
      </section>

      <section className="panel" style={{ marginTop: "24px" }}>
        <h3>Your groups</h3>
        {groups.length === 0 ? (
          <p className="subtitle">No groups yet. Create your first one above.</p>
        ) : (
          <ul className="group-list">
            {groups.map((g) => (
              <li key={g.group_id}>
                <span>{g.name} — {g.contribution_amount} RWF / {g.frequency}</span>
                <Link to={`/groups/${g.group_id}`} className="manage-link">Manage →</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Dashboard;