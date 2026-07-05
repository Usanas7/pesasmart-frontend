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
  const [disputes, setDisputes] = useState([]);
  const [changes, setChanges] = useState([]);
  const [broadcast, setBroadcast] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");

async function loadData() {
    try {
      const [gRes, mRes, dRes, cRes] = await Promise.all([
        fetch(`${API}/api/groups/${groupId}`),
        fetch(`${API}/api/groups/${groupId}/members`),
        fetch(`${API}/api/groups/${groupId}/disputes`),
        fetch(`${API}/api/groups/${groupId}/changes`),
      ]);
      const gData = await gRes.json();
      const mData = await mRes.json();
      const dData = await dRes.json();
      const cData = await cRes.json();
      if (gData.status === "success") setGroup(gData.group);
      if (mData.status === "success") setMembers(mData.members);
      if (dData.status === "success") setDisputes(dData.disputes);
      if (cData.status === "success") setChanges(cData.changes);
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

async function resolveDispute(dispute) {
    const newStatus = dispute.status === "resolved" ? "open" : "resolved";
    try {
      const res = await fetch(`${API}/api/disputes/${dispute.dispute_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.status === "success") loadData();
      else setError(data.message || "Could not update dispute");
    } catch {
      setError("Could not reach the server");
    }
  }

async function decideChange(change, decision) {
    try {
      const res = await fetch(`${API}/api/changes/${change.change_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (data.status === "success") loadData();
      else setError(data.message || "Could not update the request");
    } catch {
      setError("Could not reach the server");
    }
  }

async function sendBroadcast(e) {
    e.preventDefault();
    setBroadcastMsg("");
    setError("");
    try {
      const res = await fetch(`${API}/api/groups/${groupId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcast }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setBroadcast("");
        setBroadcastMsg(`Message sent to ${data.sentTo} member(s).`);
      } else {
        setError(data.message || "Could not send the message");
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

<section className="panel" style={{ marginTop: "24px" }}>
        <h3>Disputes</h3>
        {disputes.length === 0 ? (
          <p className="subtitle">No disputes raised.</p>
        ) : (
          <ul className="group-list">
            {disputes.map((d) => (
              <li key={d.dispute_id}>
                <span>REF#{String(d.dispute_id).padStart(4, "0")} · Week {d.disputed_week} — {d.full_name}{d.momo_txid ? ` · TxID: ${d.momo_txid}` : ""}</span>
                <button
                  type="button"
                  className={d.status === "resolved" ? "status-btn paid" : "status-btn pending"}
                  onClick={() => resolveDispute(d)}
                >
                  {d.status === "resolved" ? "Resolved ✓" : "Mark resolved"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

<section className="panel" style={{ marginTop: "24px" }}>
        <h3>Membership requests</h3>
        {changes.length === 0 ? (
          <p className="subtitle">No membership change requests.</p>
        ) : (
          <ul className="group-list">
            {changes.map((c) => (
              <li key={c.change_id}>
                <span>
                  {c.change_type === "exit"
                    ? `Exit request — ${c.full_name}`
                    : `Phone update — ${c.full_name} → ${c.details}`}
                </span>
                {c.status === "pending" ? (
                  <span style={{ display: "flex", gap: "8px" }}>
                    <button type="button" className="status-btn paid" onClick={() => decideChange(c, "approved")}>Approve</button>
                    <button type="button" className="status-btn pending" onClick={() => decideChange(c, "rejected")}>Reject</button>
                  </span>
) : (
                  <span className={c.status === "approved" ? "status-btn paid" : "status-btn pending"}>
                    {c.status === "approved" ? "Approved ✓" : "Rejected ✗"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

<section className="panel" style={{ marginTop: "24px" }}>
        <h3>Send a group message (SMS)</h3>
        {broadcastMsg && <p className="success-msg">{broadcastMsg}</p>}
        <form onSubmit={sendBroadcast}>
          <label>Message to all active members</label>
          <textarea
            value={broadcast}
            onChange={(e) => setBroadcast(e.target.value)}
            placeholder="Reminder: contributions for this week are due on Friday."
            rows={3}
            required
          />
          <button type="submit">Send SMS</button>
        </form>
      </section>

    </div>
  );
}

export default GroupDetail;