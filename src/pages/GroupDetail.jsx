import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("pesasmart_user") || "null");

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [gRes, mRes] = await Promise.all([
        fetch(`${API}/api/groups/${groupId}`),
        fetch(`${API}/api/groups/${groupId}/members`),
      ]);
      const gData = await gRes.json();
      const mData = await mRes.json();
      if (gData.status === "success") setGroup(gData.group);
      if (mData.status === "success") setMembers(mData.members);
    } catch {
      setError("Could not load the group");
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [groupId]);

  async function handleAddMember(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phoneNumber }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setFullName("");
        setPhoneNumber("");
        loadData();
      } else {
        setError(data.message || "Could not add the member");
      }
    } catch {
      setError("Could not reach the server");
    }
    setLoading(false);
  }

async function toggleContribution(member) {
    const newStatus = member.contribution_status === "paid" ? "pending" : "paid";
    try {
      const res = await fetch(`${API}/api/members/${member.member_id}/contribution`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.status === "success") {
        loadData();
      } else {
        setError(data.message || "Could not update contribution");
      }
    } catch {
      setError("Could not reach the server");
    }
  }

  if (!user) {
    return (
      <div className="card">
        <h2>Please sign in</h2>
        <button onClick={() => navigate("/")}>Go to Sign In</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Link to="/dashboard" className="manage-link">← Back to dashboard</Link>
      <h2 style={{ marginTop: "12px" }}>{group ? group.name : "Group"}</h2>
      {group && (
        <p className="subtitle">
          {group.contribution_amount} RWF / {group.frequency} · {group.cycle_length} rounds
        </p>
      )}

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-number">{members.length}</span>
          <span className="stat-label">Members</span>
        </div>
      </div>

      <section className="panel">
        <h3>Add a member</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleAddMember}>
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jean Uwimana" required />
          <label>Phone number</label>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0781234567" required />
          <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Member"}</button>
        </form>
      </section>

      <section className="panel" style={{ marginTop: "24px" }}>
        <h3>Members (in rotation order)</h3>
        {members.length === 0 ? (
          <p className="subtitle">No members yet. Add the first member above.</p>
        ) : (
          <ul className="group-list">
            {members.map((m) => (
              <li key={m.member_id}>
                <span>{m.rotation_order}. {m.full_name} ({m.phone_number})</span>
                <button
                  type="button"
                  className={m.contribution_status === "paid" ? "status-btn paid" : "status-btn pending"}
                  onClick={() => toggleContribution(m)}
                >
                  {m.contribution_status === "paid" ? "Paid ✓" : "Mark paid"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default GroupDetail;