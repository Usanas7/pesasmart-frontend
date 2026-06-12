import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function SignIn() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, pin }),
      });
      const data = await res.json();
      if (data.status === "success") navigate("/dashboard");
      else setError(data.message || "Something went wrong");
    } catch {
      setError("Could not reach the server");
    }
  }

  return (
    <div className="card">
      <h2>Sign In</h2>
      <p className="subtitle">Group organiser login</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Phone number</label>
        <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="078 123 4567" required />
        <label>PIN</label>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter your PIN" required />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}

export default SignIn;