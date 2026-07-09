import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import Layout from "../components/Layout";
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField, MenuItem,
  Alert, Stack, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

function computeEndDate(startDate, frequency, cycleLength) {
  if (!startDate || !cycleLength) return null;
  const start = new Date(startDate);
  const periodDays = frequency === "Weekly" ? 7 : 30;
  const end = new Date(start.getTime() + cycleLength * periodDays * 24 * 60 * 60 * 1000);
  return end;
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("pesasmart_user") || "null");

  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [frequency, setFrequency] = useState("Weekly");
  const [cycleLength, setCycleLength] = useState("");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadGroups() {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/groups?createdBy=${user.user_id}`);
      const data = await res.json();
      if (data.status === "success") setGroups(data.groups);
    } catch { setError("Could not load your groups"); }
  }

  async function loadStats() {
    if (!user) return;
    try {
      const res = await apiFetch(`/api/stats?createdBy=${user.user_id}`);
      const data = await res.json();
      if (data.status === "success") setStats(data.stats);
    } catch { /* non-critical */ }
  }

  useEffect(() => {
    loadGroups();
    loadStats();
    // eslint-disable-next-line
  }, []);

  function resetForm() {
    setName(""); setContributionAmount(""); setCycleLength(""); setFrequency("Weekly"); setStartDate(""); setError("");
  }

  async function handleCreate() {
    setError("");
    if (!name.trim()) { setError("Group name is required"); return; }
    if (isNaN(contributionAmount) || Number(contributionAmount) <= 0) { setError("Enter a valid contribution amount"); return; }
    if (isNaN(cycleLength) || Number(cycleLength) < 1) { setError("Enter a valid cycle length"); return; }
    if (!startDate) { setError("Please choose a start date"); return; }

    setLoading(true);
    try {
      const res = await apiFetch(`/api/groups`, {
        method: "POST",
        body: JSON.stringify({ name, contributionAmount, frequency, cycleLength, startDate, createdBy: user.user_id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        resetForm(); setOpen(false); loadGroups(); loadStats();
      } else { setError(data.message || "Could not create the group"); }
    } catch { setError("Could not reach the server"); }
    setLoading(false);
  }

  const statItems = [
    { label: "Groups", value: stats ? stats.groups : groups.length },
    { label: "Members", value: stats ? stats.members : "—" },
    { label: "Open disputes", value: stats ? stats.open_disputes : "—" },
    { label: "Pending requests", value: stats ? stats.pending_requests : "—" },
  ];

  return (
    <Layout active="groups">
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Welcome, {user?.full_name}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setOpen(true); }}>
          Create Group
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4, mt: 1 }}>
        {statItems.map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2.5 }}>
                <Typography variant="h4" color="primary" fontWeight={800}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>Your groups</Typography>
      {groups.length === 0 ? (
        <Card><CardContent sx={{ textAlign: "center", py: 5 }}>
          <Typography color="text.secondary" gutterBottom>No groups yet.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setOpen(true); }}>
            Create your first group
          </Button>
        </CardContent></Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#F3EEE4" }}>
                <TableCell sx={{ fontWeight: 700 }}>Group</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contribution</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Start</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>End</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.group_id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{g.name}</TableCell>
                  <TableCell>{g.contribution_amount} RWF</TableCell>
                  <TableCell><Chip label={g.frequency} size="small" /></TableCell>
                  <TableCell>{fmt(g.start_date)}</TableCell>
                  <TableCell>{fmt(computeEndDate(g.start_date, g.frequency, g.cycle_length))}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => navigate(`/groups/${g.group_id}`)}>
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Create a new group</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kimironko Traders Ikimina" fullWidth />
            <TextField label="Contribution amount (RWF)" type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="5000" fullWidth />
            <TextField label="Frequency" select value={frequency} onChange={(e) => setFrequency(e.target.value)} fullWidth>
              <MenuItem value="Weekly">Weekly</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
            </TextField>
            <TextField label="Cycle length (members / rounds)" type="number" value={cycleLength} onChange={(e) => setCycleLength(e.target.value)} placeholder="10" fullWidth />
            <TextField label="Start date (first payout)" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            {startDate && cycleLength && (
              <Typography variant="body2" color="text.secondary">
                Cycle ends around: {fmt(computeEndDate(startDate, frequency, cycleLength))}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default Dashboard;