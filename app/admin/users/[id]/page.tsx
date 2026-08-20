import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { updateUserAction } from "../actions";
import "../../../design-system.css";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [user] = await db().select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) notFound();

  return (
    <div className="sm-scope container mt-3" style={{ maxWidth: 560 }}>
      <div className="sm-page-head">
        <div className="sm-greeting">Edit user</div>
      </div>

      <form action={updateUserAction} className="sm-card">
        <input type="hidden" name="id" value={user.id} />

        <div className="sm-field-stack">
          <div className="sm-field">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" className="sm-input" defaultValue={user.name} required />
          </div>
          <div className="sm-field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" className="sm-input" defaultValue={user.email} required />
          </div>
          <div className="sm-field">
            <label htmlFor="phone">Phone</label>
            <input type="text" id="phone" name="phone" className="sm-input" defaultValue={user.phone ?? ""} />
          </div>
          <div className="sm-field">
            <label htmlFor="age">Age</label>
            <input type="number" id="age" name="age" className="sm-input" defaultValue={user.age ?? ""} />
          </div>
          <div className="sm-field">
            <label htmlFor="city">City</label>
            <input type="text" id="city" name="city" className="sm-input" defaultValue={user.city ?? ""} />
          </div>
          <div className="sm-field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" className="sm-input" defaultValue={user.role}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="sm-actions">
          <button type="submit" className="sm-btn sm-btn-primary">Save changes</button>
          <Link href="/admin/users" className="sm-btn sm-btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
