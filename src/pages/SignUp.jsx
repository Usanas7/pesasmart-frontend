import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function SignUp() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!/^\d{9,15}$/.test(phoneNumber.replace(/\D/g, ""))) {
      setError("Enter a valid phone number");
      return;
    }
    if (!/^\d{5}$/.test(pin)) {
      setError("PIN must be exactly 5 digits");
      return;
    }

    try {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phoneNumber, pin }),
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
    <div className="card">
      <h2>Create an Account</h2>
      <p className="subtitle">Register as a group organiser</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Christelle Usanase" required />
        <label>Phone number</label>
        <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="078 123 4567" required />
        <label>PIN</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={5}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="Choose a 5-digit PIN"
          required
        />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

export default SignUp;