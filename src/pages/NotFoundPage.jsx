export default function NotFoundPage({ path }) {
  const trail = path && path !== "/" ? path : "an unsown patch";

  return (
    <section className="wrap lost-page">
      <div className="sec-head reveal">
        <span className="sec-no">✿ field note 404 — unsown patch</span>
        <h2>
          Wandered <em>off the trail?</em>
        </h2>
        <p>
          This patch hasn&apos;t been sown yet — no match, no workshop, no rave
          down this path. <b>The grove is right behind you.</b>
        </p>
      </div>

      <div className="lost-card reveal">
        <div className="lost-seal" aria-hidden="true">
          ✿<br />
          YV
          <br />
          LOST
          <br />
          404
        </div>
        <div className="lost-big" aria-hidden="true">
          4<span>0</span>4
        </div>
        <p className="lost-sub">
          Smells of dust + evening chai that way — come dewy-eyed, leave
          dusty-shoed. Just not down this path.
        </p>
        <div className="lost-trail">
          trail log: nothing planted at <b>{trail}</b> · water: none needed
          <br />
          press a leaf, turn around, walk back to sunlight ↓
        </div>
        <div className="lost-cta">
          <a className="btn btn-clay" href="/">
            Back to sunlight ✿
          </a>
          <a className="btn btn-paper" href="/#play">
            Walk the 6 fields ↓
          </a>
          <a className="btn btn-paper" href="/members">
            Meet the crew →
          </a>
        </div>
      </div>
    </section>
  );
}
