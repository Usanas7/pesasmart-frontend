import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import Layout from "../components/Layout";
import {
  Box, Typography, Button, Card, CardContent, TextField, Alert, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip, Tabs, Tab, Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/Delete";
function computeEndDate(startDate, frequency, cycleLength) {
  if (!startDate || !cycleLength) return null;
  const start = new Date(startDate);
  const periodDays = frequency === "Weekly" ? 7 : 30;
  return new Date(start.getTime() + cycleLength * periodDays * 24 * 60 * 60 * 1000);
}
function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

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
  const [tab, setTab] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [confirm, setConfirm] = useState(null);

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
    } catch { setError("Could not load the group"); }
    setPageLoading(false);
  }

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [groupId]);

  async function handleAddMember() {
    setError("");
    if (!fullName.trim()) { setError("Member name is required"); return; }
    if (!/^\d{9,15}$/.test(phoneNumber.replace(/\D/g, ""))) { setError("Enter a valid phone number"); return; }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/groups/${groupId}/members`, {
        method: "POST", body: JSON.stringify({ fullName, phoneNumber }),
      });
      const data = await res.json();
      if (data.status === "success") { setFullName(""); setPhoneNumber(""); setAddOpen(false); loadData(); }
      else setError(data.message || "Could not add the member");
    } catch { setError("Could not reach the server"); }
    setLoading(false);
  }

  async function toggleContribution(m) {
    const newStatus = m.contribution_status === "paid" ? "pending" : "paid";
    try {
      const res = await apiFetch(`/api/members/${m.member_id}/contribution`, {
        method: "PATCH", body: JSON.stringify({ status: newStatus }),
      });
      if ((await res.json()).status === "success") loadData();
    } catch { setError("Could not reach the server"); }
  }

  async function togglePayout(m) {
    try {
      const res = await apiFetch(`/api/members/${m.member_id}/payout`, {
        method: "PATCH", body: JSON.stringify({ received: !m.payout_received }),
      });
      if ((await res.json()).status === "success") loadData();
    } catch { setError("Could not reach the server"); }
  }

  async function resolveDispute(d) {
    const newStatus = d.status === "resolved" ? "open" : "resolved";
    try {
      const res = await apiFetch(`/api/disputes/${d.dispute_id}`, {
        method: "PATCH", body: JSON.stringify({ status: newStatus }),
      });
      if ((await res.json()).status === "success") loadData();
    } catch { setError("Could not reach the server"); }
  }

  async function decideChange(c, decision) {
    try {
      const res = await apiFetch(`/api/changes/${c.change_id}`, {
        method: "PATCH", body: JSON.stringify({ decision }),
      });
      if ((await res.json()).status === "success") loadData();
    } catch { setError("Could not reach the server"); }
  }

  function handleApprove(c) {
    if (c.change_type === "exit") {
      setConfirm({
        title: "Approve exit request?",
        message: `This will remove ${c.full_name} from the group's active rotation. This can't be undone.`,
        confirmLabel: "Approve exit",
        danger: true,
        onConfirm: () => decideChange(c, "approved"),
      });
    } else {
      decideChange(c, "approved");
    }
  }

  async function doSendBroadcast() {
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

  function handleSendBroadcast() {
    if (!broadcast.trim()) { setError("Message cannot be empty"); return; }
    const activeCount = members.filter((m) => m.status !== "inactive").length;
    setConfirm({
      title: "Send SMS to all members?",
      message: `This will send your message to all ${activeCount} active member(s) of this group.`,
      confirmLabel: "Send SMS",
      danger: false,
      onConfirm: doSendBroadcast,
    });
  }

  async function doDeleteGroup() {
    try {
      const res = await apiFetch(`/api/groups/${groupId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") navigate("/groups");
      else setError(data.message || "Could not delete the group");
    } catch { setError("Could not reach the server"); }
  }

  function handleDeleteGroup() {
    setConfirm({
      title: "Delete this group?",
      message: `This will permanently delete "${group?.name}" and all its members, disputes, and requests. This cannot be undone.`,
      confirmLabel: "Delete group",
      danger: true,
      onConfirm: doDeleteGroup,
    });
  }

  function exportCSV() {
    const endDate = group ? computeEndDate(group.start_date, group.frequency, group.cycle_length) : null;
    const header = ["Position", "Name", "Phone", "Contribution", "Payout", "Status"];
    const rows = members.map((m) => [
      m.rotation_order, m.full_name, m.phone_number,
      m.contribution_status === "paid" ? "Paid" : "Pending",
      m.payout_received ? "Received" : "Not yet",
      m.status === "inactive" ? "Exited" : "Active",
    ]);
    const meta = [
      [`Group:`, group?.name || ""],
      [`Contribution:`, `${group?.contribution_amount || ""} RWF ${group?.frequency || ""}`],
      [`Cycle start:`, fmt(group?.start_date)],
      [`Cycle end:`, fmt(endDate)],
      [],
    ];
    const csv = [...meta, header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(group?.name || "group").replace(/\s+/g, "_")}_members.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    return <Layout active="groups"><Typography color="text.secondary">Loading group...</Typography></Layout>;
  }

  const endDate = group ? computeEndDate(group.start_date, group.frequency, group.cycle_length) : null;
  const summaryItems = summary ? [
    { label: "Round", value: summary.round ? `${summary.round} of ${summary.cycleLength}` : "—" },
    { label: "Contributions", value: `${summary.paid}/${summary.total} paid` },
    { label: "Open disputes", value: summary.openDisputes },
    { label: "Cycle ends", value: fmt(endDate) },
    {
      label: "Next payout",
      value: summary.nextPayoutName
        ? `${summary.nextPayoutName}${summary.nextPayoutDate ? " · " + fmt(summary.nextPayoutDate) : ""}`
        : "Cycle complete",
    },
  ] : [];

  return (
    <Layout active="groups">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/groups")} sx={{ mb: 1 }}>
          Back to groups
        </Button>
        <Button startIcon={<DeleteOutlineIcon />} color="error" onClick={handleDeleteGroup}>
          Delete group
        </Button>
      </Box>

      <Typography variant="h5" fontWeight={800}>{group ? group.name : "Group"}</Typography>
      {group && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {group.contribution_amount} RWF · {group.frequency} · {group.cycle_length} rounds
        </Typography>
      )}

      {summary && (
        <Paper sx={{ p: 2.5, mb: 3, bgcolor: "#F3EEE4", display: "flex", flexWrap: "wrap", gap: 3 }}>
          {summaryItems.map((s) => (
            <Box key={s.label} sx={{ minWidth: 110 }}>
              <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
              <Typography variant="subtitle1" color="primary" fontWeight={700}>{s.value}</Typography>
            </Box>
          ))}
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ borderBottom: "1px solid #F0E9DE", px: 1 }}>
          <Tab label={`Members (${members.filter((m) => m.status !== "inactive").length})`} />
          <Tab label={`Disputes (${disputes.filter((d) => d.status === "open").length})`} />
          <Tab label={`Requests (${changes.filter((c) => c.status === "pending").length})`} />
          <Tab label="Messages" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {tab === 0 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                <Typography variant="h6" fontWeight={700}>Members</Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV} disabled={members.length === 0}>
                    Export CSV
                  </Button>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
                    Add Member
                  </Button>
                </Stack>
              </Box>
              {members.length === 0 ? (
                <Typography color="text.secondary">No members yet. Add the first member.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FBF7F0" }}>
                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Contribution</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Payout</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.map((m) => (
                        <TableRow key={m.member_id} sx={{ opacity: m.status === "inactive" ? 0.5 : 1 }}>
                          <TableCell>{m.rotation_order}</TableCell>
                          <TableCell>
                            {m.full_name}
                            {m.status === "inactive" && <Chip label="exited" size="small" sx={{ ml: 1 }} />}
                          </TableCell>
                          <TableCell>{m.phone_number}</TableCell>
                          <TableCell>
                            {m.status === "inactive" ? "—" : (
                              <Button size="small" variant={m.contribution_status === "paid" ? "contained" : "outlined"}
                                color={m.contribution_status === "paid" ? "success" : "primary"}
                                onClick={() => toggleContribution(m)}>
                                {m.contribution_status === "paid" ? "Paid" : "Mark paid"}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {m.status === "inactive" ? "—" : (
                              <Button size="small" variant={m.payout_received ? "contained" : "outlined"}
                                color={m.payout_received ? "success" : "primary"}
                                onClick={() => togglePayout(m)}>
                                {m.payout_received ? "Received" : "Mark paid out"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Disputes</Typography>
              {disputes.length === 0 ? (
                <Typography color="text.secondary">No disputes raised.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#FBF7F0" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Ref</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Member</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>TxID</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {disputes.map((d) => (
                        <TableRow key={d.dispute_id}>
                          <TableCell>REF#{String(d.dispute_id).padStart(4, "0")}</TableCell>
                          <TableCell>{d.disputed_week}</TableCell>
                          <TableCell>{d.full_name}</TableCell>
                          <TableCell>{d.momo_txid || "—"}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant={d.status === "resolved" ? "contained" : "outlined"}
                              color={d.status === "resolved" ? "success" : "primary"}
                              onClick={() => resolveDispute(d)}>
                              {d.status === "resolved" ? "Resolved" : "Mark resolved"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Membership requests</Typography>
              {changes.length === 0 ? (
                <Typography color="text.secondary">No membership change requests.</Typography>
              ) : (
                <Stack divider={<Divider />} spacing={0}>
                  {changes.map((c) => (
                    <Box key={c.change_id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, flexWrap: "wrap", gap: 1 }}>
                      <Box>
                        <Typography fontWeight={600}>
                          {c.change_type === "exit" ? `Exit request` : `Phone update`} — {c.full_name}
                        </Typography>
                        {c.change_type === "phone_update" && (
                          <Typography variant="body2" color="text.secondary">New number: {c.details}</Typography>
                        )}
                      </Box>
                      {c.status === "approved" ? (
                        <Chip label="Approved" color="success" size="small" />
                      ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button size="small" variant="contained" color="success" onClick={() => handleApprove(c)}>Approve</Button>
                          {c.status !== "rejected"
                            ? <Button size="small" variant="outlined" color="error" onClick={() => decideChange(c, "rejected")}>Reject</Button>
                            : <Chip label="Rejected" size="small" />}
                        </Stack>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {tab === 3 && (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Send a group message (SMS)</Typography>
              {broadcastMsg && <Alert severity="success" sx={{ mb: 2 }}>{broadcastMsg}</Alert>}
              <Stack spacing={2}>
                <TextField label="Message to all active members" value={broadcast}
                  onChange={(e) => setBroadcast(e.target.value)}
                  placeholder="Reminder: contributions for this week are due on Friday."
                  multiline minRows={3} fullWidth />
                <Box><Button variant="contained" onClick={handleSendBroadcast}>Send SMS</Button></Box>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Add a member</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jean Uwimana" fullWidth />
            <TextField label="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0781234567" fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={loading}>
            {loading ? "Adding..." : "Add Member"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{confirm?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirm?.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirm?.danger ? "error" : "primary"}
            onClick={() => { const fn = confirm?.onConfirm; setConfirm(null); if (fn) fn(); }}
          >
            {confirm?.confirmLabel || "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default GroupDetail;