import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  Box, AppBar, Toolbar, Typography, Button, Card, CardContent, Grid,
  TextField, MenuItem, Alert, Stack, Divider, List, ListItem, ListItemText, Chip
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import GroupsIcon from "@mui/icons-material/Groups";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("pesasmart_user") || "null");

  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState(null);
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
    } catch {
      setError("Could not load your groups");
    }
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
        body: JSON.stringify({ name, contributionAmount, frequency, cycleLength, startDate, createdBy: user.user_id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setName(""); setContributionAmount(""); setCycleLength(""); setFrequency("Weekly"); setStartDate("");
        loadGroups(); loadStats();
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
      <Box sx={{ maxWidth: 420, mx: "auto", mt: 8, px: 2 }}>
        <Card><CardContent sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>Please sign in</Typography>
          <Button variant="contained" onClick={() => navigate("/")}>Go to Sign In</Button>
        </CardContent></Card>
      </Box>
    );
  }

  const statItems = [
    { label: "Groups", value: stats ? stats.groups : groups.length },
    { label: "Members", value: stats ? stats.members : "—" },
    { label: "Open disputes", value: stats ? stats.open_disputes : "—" },
    { label: "Pending requests", value: stats ? stats.pending_requests : "—" },
  ];

  return (
    <Box>
      <AppBar position="static" elevation={0} color="primary">
        <Toolbar>
          <GroupsIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>PesaSmart</Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Log out</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
        <Typography variant="h5" gutterBottom>Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Welcome, {user.full_name} — manage your Ikimina groups
        </Typography>

        {/* Stat cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {statItems.map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card>
                <CardContent sx={{ textAlign: "center", py: 2.5 }}>
                  <Typography variant="h4" color="primary">{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Create group */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Create a new group</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleCreate}>
              <Stack spacing={2.5}>
                <TextField label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kimironko Traders Ikimina" fullWidth required />
                <TextField label="Contribution amount (RWF)" type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="5000" fullWidth required />
                <TextField label="Frequency" select value={frequency} onChange={(e) => setFrequency(e.target.value)} fullWidth>
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                </TextField>
                <TextField label="Cycle length (members / rounds)" type="number" value={cycleLength} onChange={(e) => setCycleLength(e.target.value)} placeholder="10" fullWidth required />
                <TextField label="Start date (first payout)" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth required />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? "Creating..." : "Create Group"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* Group list */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Your groups</Typography>
            {groups.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No groups yet. Create your first one above.</Typography>
            ) : (
              <List>
                {groups.map((g, i) => (
                  <Box key={g.group_id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem
                      secondaryAction={
                        <Button variant="outlined" size="small" onClick={() => navigate(`/groups/${g.group_id}`)}>
                          Manage
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={g.name}
                        secondary={`${g.contribution_amount} RWF · ${g.frequency}`}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Dashboard;