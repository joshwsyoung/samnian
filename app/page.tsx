import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <div className="container mt-5 text-center py-5">
        <h1 className="title mb-3">Samnian</h1>
        <p className="subtitle mb-4">GET SOCIAL</p>
        <p className="lead">A small team helping connect everyone for a great dinner!</p>
        <div className="d-grid gap-3 col-10 col-sm-6 mx-auto my-4">
          <Link href="/register" className="btn">Join In!</Link>
        </div>
      </div>

      <section id="how-it-works" className="bg-light py-5 rounded">
        <div className="container">
          <h2 className="text-center mb-5">How it works</h2>
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-3">
              <div
                className="p-4 rounded shadow-sm h-100 step-card"
                style={{ background: "url('/images/Friends-1.jpg') center/cover no-repeat" }}
              >
                <h3 className="fs-4 mb-2">Take the Test</h3>
                <p className="small">Complete our quick personality quiz (OCEAN model) to help us understand you.</p>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div
                className="p-4 rounded shadow-sm h-100 step-card"
                style={{ background: "url('/images/Friends-2.jpg') center/cover no-repeat" }}
              >
                <h3 className="fs-4 mb-2">Pick Your Events</h3>
                <p className="small">Browse upcoming dinners, pick the ones you fancy, and tell us your budget for each.</p>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div
                className="p-4 rounded shadow-sm h-100 step-card"
                style={{ background: "url('/images/Friends-3.jpg') center/cover no-repeat" }}
              >
                <h3 className="fs-4 mb-2">Get Matched</h3>
                <p className="small">We&rsquo;ll match you with a small group for a great shared meal.</p>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div
                className="p-4 rounded shadow-sm h-100 step-card"
                style={{ background: "url('/images/Friends-1.jpg') center/cover no-repeat" }}
              >
                <h3 className="fs-4 mb-2">Enjoy Dinner</h3>
                <p className="small">Meet new people and enjoy good food and great conversation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container text-center py-5">
        <h2 className="mb-4">Ready to meet your table?</h2>
        <Link href="/register" className="btn">Register &amp; Take the Test</Link>
      </div>
    </>
  );
}
