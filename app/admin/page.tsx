import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import "../design-system.css";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <div className="sm-scope container mt-3">
      <div className="sm-page-head">
        <div className="sm-greeting">Welcome, {session.name}.</div>
        <div className="sm-sub">Admin tools.</div>
      </div>

      <div className="sm-quick-row">
        <section className="sm-card">
          <h3 style={{ fontSize: "0.95rem", marginBottom: 12 }}>User management</h3>
          <div className="sm-link-list">
            <Link href="/admin/users" className="sm-link-item">View / edit users</Link>
          </div>
        </section>

        <section className="sm-card">
          <h3 style={{ fontSize: "0.95rem", marginBottom: 12 }}>Match management</h3>
          <div className="sm-link-list">
            <Link href="/admin/matches/new" className="sm-link-item">Create new match</Link>
            <Link href="/admin/matches" className="sm-link-item">View / edit matches</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
