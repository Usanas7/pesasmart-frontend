import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import Layout from "../components/Layout";
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Stack, Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("pesasmart_user") || "null");

  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          apiFetch(`/api/groups?createdBy=${user.user_id}`),
          apiFetch(`/api/stats?createdBy=${user.user_id}`),
        ]);
        const gData = await gRes.json();
        const sData = await sRes.json();
        if (gData.status === "success") setGroups(gData.groups);
        if (sData.status === "success") setStats(sData.stats);
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line
  }, []);

  const statItems = [
    { label: "Groups", value: stats ? stats.groups : "—" },
    { label: "Members", value: stats ? stats.members : "—" },
    { label: "Open disputes", value: stats ? stats.open_disputes : "—" },
    { label: "Pending requests", value: stats ? stats.pending_requests : "—" },
  ];

  const needsAttention =
    stats && (Number(stats.open_disputes) > 0 || Number(stats.pending_requests) > 0);

  return (
    <Layout active="dashboard">
      <Typography variant="h5" fontWeight={800}>Welcome back, {user?.full_name?.split(" ")[0]}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Here's an overview of your Ikimina groups
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
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

      {needsAttention && (
        <Card sx={{ mb: 3, bgcolor: "#FFF6E9", border: "1px solid #F3D9A6" }}>
          <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WarningAmberIcon sx={{ color: "warning.main" }} />
            <Typography variant="body2">
              You have {Number(stats.open_disputes) > 0 && `${stats.open_disputes} open dispute(s)`}
              {Number(stats.open_disputes) > 0 && Number(stats.pending_requests) > 0 && " and "}
              {Number(stats.pending_requests) > 0 && `${stats.pending_requests} pending request(s)`} to review.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>Recent groups</Typography>
        <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate("/groups")}>
          View all
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Card><CardContent sx={{ textAlign: "center", py: 5 }}>
          <Typography color="text.secondary" gutterBottom>No groups yet.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/groups")}>
            Create your first group
          </Button>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent>
            <Stack divider={<Divider />} spacing={0}>
              {groups.slice(0, 5).map((g) => (
                <Box key={g.group_id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
                  <Box>
                    <Typography fontWeight={600}>{g.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{g.contribution_amount} RWF · {g.frequency}</Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/groups/${g.group_id}`)}>Manage</Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}

export default Dashboard;