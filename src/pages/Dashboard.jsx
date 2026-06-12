function Dashboard() {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p className="subtitle">Overview of your Ikimina groups</p>

      <div className="stat-cards">
        <div className="stat-card"><span className="stat-number">2</span><span className="stat-label">Groups</span></div>
        <div className="stat-card"><span className="stat-number">1</span><span className="stat-label">Open disputes</span></div>
        <div className="stat-card"><span className="stat-number">18</span><span className="stat-label">Members</span></div>
      </div>

      <section className="panel">
        <h3>Your groups</h3>
        <ul className="group-list">
          <li><span>Kimironko Traders Ikimina</span><span className="badge">Active</span></li>
          <li><span>Nyabugogo Vendors Circle</span><span className="badge">Active</span></li>
        </ul>
      </section>
    </div>
  );
}

export default Dashboard;