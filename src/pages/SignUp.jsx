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
    try {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phoneNumber, pin }),
      });
      const data = await res.json();
if (data.status === "success") {
        localStorage.setItem("pesasmart_user", JSON.stringify(data.user));
        navigate("/dashboard");
      }
            else setError(data.message || "Something went wrong");
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
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Choose a PIN" required />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

export default SignUp;