import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

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

  async function loadGroups() {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/groups?createdBy=${user.user_id}`);
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

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contributionAmount,
          frequency,
          cycleLength,
          createdBy: user.user_id,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setName("");
        setContributionAmount("");
        setCycleLength("");
        setFrequency("Weekly");
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
      <h2>Dashboard</h2>
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
                <span className="badge">{g.cycle_length} rounds</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Dashboard;