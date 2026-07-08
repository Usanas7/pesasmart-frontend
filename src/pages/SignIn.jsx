import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Stack } from "@mui/material";

const API = import.meta.env.VITE_API_URL;

function SignIn() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!/^\d{5}$/.test(pin)) {
      setError("PIN must be exactly 5 digits");
      return;
    }
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, pin }),
      });
      const data = await res.json();
      if (data.status === "success") {
        localStorage.setItem("pesasmart_user", JSON.stringify(data.user));
        localStorage.setItem("pesasmart_token", data.token);
        navigate("/dashboard");
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch {
      setError("Could not reach the server");
    }
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 6, px: 2 }}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Welcome back</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to manage your Ikimina groups
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="078 123 4567"
                fullWidth
                required
              />
              <TextField
                label="PIN"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                inputProps={{ inputMode: "numeric", maxLength: 5 }}
                placeholder="5-digit PIN"
                fullWidth
                required
              />
              <Button type="submit" variant="contained" size="large" fullWidth>
                Sign In
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default SignIn;