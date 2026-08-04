import Link from "next/link";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import Flash from "@/components/Flash";
import ConfirmButton from "@/components/ConfirmButton";
import { deleteUserAction } from "./actions";

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
    <div className="container mt-5">
      <h2>Manage Users</h2>

      <Flash success={updated ? "User updated." : deleted ? "User deleted." : undefined} />

      <table className="table table-striped mt-4">
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
              <td>{u.role}</td>
              <td>
                <Link href={`/admin/users/${u.id}`} className="btn btn-sm btn-warning">Edit</Link>{" "}
                <form action={deleteUserAction} className="d-inline-block">
                  <input type="hidden" name="user_id" value={u.id} />
                  <ConfirmButton message="Are you sure you want to delete this user?" className="btn btn-sm btn-danger">
                    Delete
                  </ConfirmButton>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
