import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  Box, AppBar, Toolbar, Typography, Button, Card, CardContent,
  TextField, Alert, Stack, Divider, List, ListItem, ListItemText,
  Chip, Paper, IconButton
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupsIcon from "@mui/icons-material/Groups";

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("pesasmart_user") || "null");

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [changes, setChanges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    try {
      const [gRes, mRes, dRes, cRes, sRes] = await Promise.all([
        apiFetch(`/api/groups/${groupId}`),
        apiFetch(`/api/groups/${groupId}/members`),
        apiFetch(`/api/groups/${groupId}/disputes`),
        apiFetch(`/api/groups/${groupId}/changes`),
        apiFetch(`/api/groups/${groupId}/summary`),
      ]);
      const gData = await gRes.json();
      const mData = await mRes.json();
      const dData = await dRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();
      if (gData.status === "success") setGroup(gData.group);
      if (mData.status === "success") setMembers(mData.members);
      if (dData.status === "success") setDisputes(dData.disputes);
      if (cData.status === "success") setChanges(cData.changes);
      if (sData.status === "success") setSummary(sData.summary);
    } catch {
      setError("Could not load the group");
    }
    setPageLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [groupId]);

  async function handleAddMember(e) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Member name is required"); return; }
    if (!/^\d{9,15}$/.test(phoneNumber.replace(/\D/g, ""))) { setError("Enter a valid phone number"); return; }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        body: JSON.stringify({ fullName, phoneNumber }),
      });
      const data = await res.json();
      if (data.status === "success") { setFullName(""); setPhoneNumber(""); loadData(); }
      else setError(data.message || "Could not add the member");
    } catch { setError("Could not reach the server"); }
    setLoading(false);
  }

  async function toggleContribution(member) {
    const newStatus = member.contribution_status === "paid" ? "pending" : "paid";
    try {
      const res = await apiFetch(`/api/members/${member.member_id}/contribution`, {
        method: "PATCH", body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.status === "success") loadData();
      else setError(data.message || "Could not update contribution");
    } catch { setError("Could not reach the server"); }
  }

  async function togglePayout(member) {
    try {
      const res = await apiFetch(`/api/members/${member.member_id}/payout`, {
        method: "PATCH", body: JSON.stringify({ received: !member.payout_received }),
      });
      const data = await res.json();
      if (data.status === "success") loadData();
      else setError(data.message || "Could not update payout");
    } catch { setError("Could not reach the server"); }
  }

  async function resolveDispute(dispute) {
    const newStatus = dispute.status === "resolved" ? "open" : "resolved";
    try {
      const res = await apiFetch(`/api/disputes/${dispute.dispute_id}`, {
        method: "PATCH", body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.status === "success") loadData();
      else setError(data.message || "Could not update dispute");
    } catch { setError("Could not reach the server"); }
  }

  async function decideChange(change, decision) {
    try {
      const res = await apiFetch(`/api/changes/${change.change_id}`, {
        method: "PATCH", body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (data.status === "success") loadData();
      else setError(data.message || "Could not update the request");
    } catch { setError("Could not reach the server"); }
  }

  async function sendBroadcast(e) {
    e.preventDefault();
    setBroadcastMsg(""); setError("");
    try {
      const res = await apiFetch(`/api/groups/${groupId}/broadcast`, {
        method: "POST", body: JSON.stringify({ message: broadcast }),
      });
      const data = await res.json();
      if (data.status === "success") { setBroadcast(""); setBroadcastMsg(`Message sent to ${data.sentTo} member(s).`); }
      else setError(data.message || "Could not send the message");
    } catch { setError("Could not reach the server"); }
  }

  if (!user) {
    return (
      <Box sx={{ maxWidth: 420, mx: "auto", mt: 8, px: 2 }}>
        <Card><CardContent sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>Please sign in</Typography>
          <Button variant="contained" onClick={() => navigate("/")}>Go to Sign In</Button>
        </CardContent></Card>
      </Box>
    );
  }

  if (pageLoading) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
        <Typography color="text.secondary">Loading group...</Typography>
      </Box>
    );
  }

  const summaryItems = summary ? [
    { label: "Round", value: summary.round ? `${summary.round} of ${summary.cycleLength}` : "—" },
    { label: "Contributions", value: `${summary.paid}/${summary.total} paid` },
    { label: "Open disputes", value: summary.openDisputes },
    {
      label: "Next payout",
      value: summary.nextPayoutName
        ? `${summary.nextPayoutName}${summary.nextPayoutDate ? " · " + new Date(summary.nextPayoutDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}`
        : "Cycle complete",
    },
  ] : [];

  return (
    <Box>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => navigate("/dashboard")} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <GroupsIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>PesaSmart</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
        <Typography variant="h5" gutterBottom>{group ? group.name : "Group"}</Typography>
        {group && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {group.contribution_amount} RWF · {group.frequency} · {group.cycle_length} rounds
          </Typography>
        )}

        {summary && (
          <Paper sx={{ p: 2.5, mb: 4, bgcolor: "#F3EEE4", display: "flex", flexWrap: "wrap", gap: 3 }}>
            {summaryItems.map((s) => (
              <Box key={s.label} sx={{ minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="subtitle1" color="primary" fontWeight={700}>{s.value}</Typography>
              </Box>
            ))}
          </Paper>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Add a member</Typography>
            <form onSubmit={handleAddMember}>
              <Stack spacing={2.5}>
                <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jean Uwimana" fullWidth required />
                <TextField label="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0781234567" fullWidth required />
                <Button type="submit" variant="contained" disabled={loading}>{loading ? "Adding..." : "Add Member"}</Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Members (in rotation order)</Typography>
            {members.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No members yet. Add the first member above.</Typography>
            ) : (
              <List>
                {members.map((m, i) => (
                  <Box key={m.member_id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem sx={{ opacity: m.status === "inactive" ? 0.5 : 1, flexWrap: "wrap", gap: 1 }}
                      secondaryAction={
                        m.status !== "inactive" ? (
                          <Stack direction="row" spacing={1}>
                            <Button size="small" variant={m.contribution_status === "paid" ? "contained" : "outlined"} color={m.contribution_status === "paid" ? "success" : "primary"} onClick={() => toggleContribution(m)}>
                              {m.contribution_status === "paid" ? "Paid" : "Mark paid"}
                            </Button>
                            <Button size="small" variant={m.payout_received ? "contained" : "outlined"} color={m.payout_received ? "success" : "primary"} onClick={() => togglePayout(m)}>
                              {m.payout_received ? "Payout done" : "Mark paid out"}
                            </Button>
                          </Stack>
                        ) : null
                      }
                    >
                      <ListItemText primary={`${m.rotation_order}. ${m.full_name}`} secondary={m.phone_number} />
                      {m.status === "inactive" && <Chip label="exited" size="small" sx={{ ml: 1 }} />}
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Disputes</Typography>
            {disputes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No disputes raised.</Typography>
            ) : (
              <List>
                {disputes.map((d, i) => (
                  <Box key={d.dispute_id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem
                      secondaryAction={
                        <Button size="small" variant={d.status === "resolved" ? "contained" : "outlined"} color={d.status === "resolved" ? "success" : "primary"} onClick={() => resolveDispute(d)}>
                          {d.status === "resolved" ? "Resolved" : "Mark resolved"}
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={`REF#${String(d.dispute_id).padStart(4, "0")} · Week ${d.disputed_week} — ${d.full_name}`}
                        secondary={d.momo_txid ? `TxID: ${d.momo_txid}` : null}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Membership requests</Typography>
            {changes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No membership change requests.</Typography>
            ) : (
              <List>
                {changes.map((c, i) => (
                  <Box key={c.change_id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem
                      secondaryAction={
                        c.status === "approved" ? (
                          <Chip label="Approved" color="success" size="small" />
                        ) : (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Button size="small" variant="contained" color="success" onClick={() => decideChange(c, "approved")}>Approve</Button>
                            {c.status !== "rejected"
                              ? <Button size="small" variant="outlined" color="error" onClick={() => decideChange(c, "rejected")}>Reject</Button>
                              : <Chip label="Rejected" size="small" />}
                          </Stack>
                        )
                      }
                    >
                      <ListItemText
                        primary={c.change_type === "exit" ? `Exit request — ${c.full_name}` : `Phone update — ${c.full_name}`}
                        secondary={c.change_type === "phone_update" ? `New number: ${c.details}` : null}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Send a group message (SMS)</Typography>
            {broadcastMsg && <Alert severity="success" sx={{ mb: 2 }}>{broadcastMsg}</Alert>}
            <form onSubmit={sendBroadcast}>
              <Stack spacing={2}>
                <TextField
                  label="Message to all active members"
                  value={broadcast}
                  onChange={(e) => setBroadcast(e.target.value)}
                  placeholder="Reminder: contributions for this week are due on Friday."
                  multiline
                  minRows={3}
                  fullWidth
                  required
                />
                <Button type="submit" variant="contained">Send SMS</Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default GroupDetail;