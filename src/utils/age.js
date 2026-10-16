// Birthday-aware age: increments automatically every year.
export function calcAge(birthDate, now = new Date()) {
  const m = String(birthDate || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  let age = now.getFullYear() - y;
  const beforeBirthday =
    now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

// Display age: prefer birthDate (auto-incrementing), fall back to stored age.
export function displayAge(user) {
  if (!user) return null;
  const fromBirth = calcAge(user.birthDate);
  if (fromBirth != null) return fromBirth;
  return user.age ?? null;
}
