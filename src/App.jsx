import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import GroupDetail from "./pages/GroupDetail";

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <span className="brand">PesaSmart</span>
        <div className="nav-links">
          <NavLink to="/" end>Sign In</NavLink>
          <NavLink to="/signup">Sign Up</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </div>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/groups/:groupId" element={<GroupDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;