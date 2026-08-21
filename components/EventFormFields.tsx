import { SLOTS } from "@/lib/constants";

type EventDefaults = {
  title?: string;
  restaurantName?: string;
  restaurantUrl?: string | null;
  imageUrl?: string | null;
  address?: string | null;
  description?: string | null;
  eventDate?: string;
  slot?: string;
  capacity?: number | null;
  published?: boolean;
};

/** Shared field set for the admin "new event" and "edit event" forms. */
export default function EventFormFields({ defaults = {} }: { defaults?: EventDefaults }) {
  return (
    <>
      <div className="mb-3">
        <label htmlFor="title" className="form-label">Event title</label>
        <input type="text" className="form-control" id="title" name="title" placeholder="e.g. Wednesday Supper Club" defaultValue={defaults.title} required />
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="restaurant_name" className="form-label">Restaurant name</label>
          <input type="text" className="form-control" id="restaurant_name" name="restaurant_name" defaultValue={defaults.restaurantName} required />
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="restaurant_url" className="form-label">Restaurant website</label>
          <input type="url" className="form-control" id="restaurant_url" name="restaurant_url" placeholder="https://…" defaultValue={defaults.restaurantUrl ?? ""} />
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="image_url" className="form-label">Photo URL</label>
        <input type="url" className="form-control" id="image_url" name="image_url" placeholder="https://…" defaultValue={defaults.imageUrl ?? ""} />
        <div className="form-text">A wide restaurant/food photo — shown on the event card.</div>
      </div>

      <div className="mb-3">
        <label htmlFor="address" className="form-label">Address</label>
        <input type="text" className="form-control" id="address" name="address" defaultValue={defaults.address ?? ""} />
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label">Description</label>
        <textarea className="form-control" id="description" name="description" rows={4} defaultValue={defaults.description ?? ""} />
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label htmlFor="event_date" className="form-label">Date</label>
          <input type="date" className="form-control" id="event_date" name="event_date" defaultValue={defaults.eventDate} required />
        </div>
        <div className="col-md-4 mb-3">
          <label htmlFor="slot" className="form-label">Time slot</label>
          <select className="form-select" id="slot" name="slot" defaultValue={defaults.slot} required>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label htmlFor="capacity" className="form-label">Capacity per table</label>
          <input type="number" className="form-control" id="capacity" name="capacity" min={2} defaultValue={defaults.capacity ?? ""} />
        </div>
      </div>

      <div className="form-check mb-3">
        <input type="checkbox" className="form-check-input" name="published" id="published" defaultChecked={defaults.published} />
        <label className="form-check-label" htmlFor="published">Published (visible to users)</label>
      </div>
    </>
  );
}
