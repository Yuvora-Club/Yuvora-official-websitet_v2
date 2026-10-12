const MEMBERS = [
  {
    id: 1,
    name: "Rishit Manchala",
    role: "Leader",
    email: "rishithmanchala989@gmail.com",
  },
  {
    id: 2,
    name: "Adarsh Kumar Darsh",
    role: "Co-Leader",
    email: "adarsh.dps.2020@gmail.com",
  },
  {
    id: 3,
    name: "Sampreeth Reddy Nandela",
    role: "Co-Leader",
    email: "nandelasampreethreddy@gmail.com",
  },
  {
    id: 4,
    name: "Rachit Mucherla",
    role: "Co-Leader",
    email: "rachitmucherla20@gmail.com",
  },
  {
    id: 5,
    name: "Yojit Gopani",
    role: "Co-Leader",
    email: "yojitgd7@gmail.com",
  },
  {
    id: 6,
    name: "Guru Charan Garikiparti",
    role: "Co-Leader",
    email: "mrgurucharan23@gmail.com",
  },
];

const AVATAR_BG = [
  "#E9DFB8",
  "#D4E2C8",
  "#F3D2D2",
  "#CBD8BD",
  "#F3D2B8",
  "#D9CFC0",
];

function initialsOf(name) {
  const letters = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return letters || "✿";
}

function MemberCard({ member, tint }) {
  const name = (member.name || "").trim();
  const role = (member.role || "").trim();
  const email = (member.email || "").trim();

  return (
    <article className="member-card reveal">
      <div className="member-top">
        <span
          className="member-avatar"
          style={{ background: tint }}
          aria-hidden="true"
        >
          {initialsOf(name)}
        </span>

        <div style={{ minWidth: 0 }}>
          <h3>{name}</h3>
          {role ? <p className="member-role">{role}</p> : null}
        </div>
      </div>

      {email ? (
        <div className="member-socials">
          <a
            className="member-contact"
            href={`mailto:${email}?subject=${encodeURIComponent(
              `Hello ${name} — Yuvora`,
            )}`}
            aria-label={`Contact ${name} by email`}
          >
            Contact ✉
          </a>
        </div>
      ) : (
        <p className="member-pending">✿ Member details coming soon</p>
      )}
    </article>
  );
}

export default function MembersPage() {
  return (
    <section className="wrap members-page">
      <div className="sec-head reveal">
        <span className="sec-no">❧ 09 — crew</span>

        <h2>
          Meet Our <em>Members</em>
        </h2>

        <p>
          The students behind Yuvora — the ones who book the grounds, run the
          workshops and light the terrace.{" "}
          <b>Say hello, join a grove, grow with us.</b>
        </p>
      </div>

      <div className="members-grid">
        {MEMBERS.map((member, index) => (
          <MemberCard
            key={member.id}
            member={member}
            tint={AVATAR_BG[index % AVATAR_BG.length]}
          />
        ))}
      </div>

      <div className="note-bar reveal">
        <b>CREW DIRECTORY →</b>
        <span>
          Meet the students growing Yuvora. Reach out to a crew member using the
          contact button on their card.
        </span>
      </div>

      <div className="members-cta reveal">
        <a className="btn btn-clay" href="/#join">
          Claim your seed pass ✿
        </a>

        <a className="btn btn-paper" href="/">
          ← Back to sunlight
        </a>
      </div>
    </section>
  );
}
