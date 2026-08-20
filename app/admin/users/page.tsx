import Link from "next/link";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import Flash from "@/components/Flash";
import ConfirmButton from "@/components/ConfirmButton";
import { deleteUserAction } from "./actions";
import "../../design-system.css";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; deleted?: string }>;
}) {
  await requireAdmin();
  const { updated, deleted } = await searchParams;

  const allUsers = await db()
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, age: users.age, city: users.city, role: users.role })
    .from(users);

  return (
    <div className="sm-scope container mt-3">
      <div className="sm-page-head">
        <div className="sm-greeting">Manage users</div>
      </div>

      <Flash success={updated ? "User updated." : deleted ? "User deleted." : undefined} />

      <div className="sm-table-wrap">
        <table className="sm-table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Age</th><th>City</th><th>Role</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.age}</td>
                <td>{u.city}</td>
                <td>
                  <span className={`sm-status-pill ${u.role === "admin" ? "matched" : "unset"}`}>
                    <span className="sm-dot" />{u.role}
                  </span>
                </td>
                <td>
                  <div className="sm-row-actions">
                    <Link href={`/admin/users/${u.id}`} className="sm-btn-xs">Edit</Link>
                    <form action={deleteUserAction}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <ConfirmButton message="Are you sure you want to delete this user?" className="sm-btn-xs sm-danger">
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
