import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { updateUserAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [user] = await db().select().from(users).where(eq(users.id, Number(id))).limit(1);
  if (!user) notFound();

  return (
    <div className="container mt-5">
      <h2>Edit User</h2>
      <form action={updateUserAction} className="mt-4">
        <input type="hidden" name="id" value={user.id} />

        <div className="mb-3">
          <label className="form-label">Name</label>
          <input type="text" name="name" className="form-control" defaultValue={user.name} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" name="email" className="form-control" defaultValue={user.email} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Phone</label>
          <input type="text" name="phone" className="form-control" defaultValue={user.phone ?? ""} />
        </div>

        <div className="mb-3">
          <label className="form-label">Age</label>
          <input type="number" name="age" className="form-control" defaultValue={user.age ?? ""} />
        </div>

        <div className="mb-3">
          <label className="form-label">City</label>
          <input type="text" name="city" className="form-control" defaultValue={user.city ?? ""} />
        </div>

        <div className="mb-3">
          <label className="form-label">Role</label>
          <select name="role" className="form-select" defaultValue={user.role}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button type="submit" className="btn btn-success">Save Changes</button>{" "}
        <Link href="/admin/users" className="btn btn-secondary">Cancel</Link>
      </form>
    </div>
  );
}
