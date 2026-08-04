import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <div className="container mt-5">
      <h2>Welcome, Admin {session.name}!</h2>

      <div className="row mt-4">
        <div className="col-md-6">
          <h4>User Management</h4>
          <ul className="list-group">
            <li className="list-group-item"><Link href="/admin/users">View/Edit Users</Link></li>
          </ul>
        </div>

        <div className="col-md-6">
          <h4>Match Management</h4>
          <ul className="list-group">
            <li className="list-group-item"><Link href="/admin/matches/new">Create New Match</Link></li>
            <li className="list-group-item"><Link href="/admin/matches">View / Edit Matches</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
