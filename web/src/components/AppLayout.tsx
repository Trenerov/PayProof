import { Outlet, Link } from "react-router-dom";

export const AppLayout = () => (
  <div className="shell">
    <header className="topbar">
      <Link to="/" className="brand">
        PayProof
      </Link>
      <p className="tagline">OP_NET payment pages with live confirmation tracking</p>
    </header>
    <main className="content">
      <Outlet />
    </main>
  </div>
);
