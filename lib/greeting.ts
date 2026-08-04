const MORNING = [
  "Good morning, ", "Wakey wakey, ", "Rise and shine, ", "Hope you slept well, ",
  "Top of the morning, ", "What a lovely morning, ", "It’s a brand new day, ",
  "The sun’s up, ", "Early bird vibes, ", "Starting the day fresh, ",
];
const AFTERNOON = [
  "Good afternoon, ", "Hey there, ", "How’s your day going, ", "Nice to see you this afternoon, ",
  "Hope you're having a chill day, ", "Sun’s still up, ", "Taking a little break, ",
  "What’s happening, ", "Hope the vibe is good, ",
];
const EVENING = [
  "Good evening, ", "Hope you had a great day, ", "Kicking back yet, ", "Unwinding time, ",
  "What’s the plan tonight, ", "Evening’s looking good, ", "Settle in and relax, ",
  "How’s the night shaping up, ",
];
const NIGHT = [
  "Still up, ", "Late night check-in, ", "Burning the midnight oil, ", "Can’t sleep, ",
  "Quiet night, isn’t it, ", "The stars are out, ", "Night owl mode, ",
  "The night’s still young, ", "Rest can wait, ", "Chilling in the dark, ",
];

function pick(list: string[]) {
  return list[Math.floor(Math.random() * list.length)];
}

export function getGreeting(now = new Date()) {
  // Matches the legacy app's Europe/London-based greeting.
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/London" }).format(now)
  );

  if (hour >= 5 && hour < 12) return pick(MORNING);
  if (hour >= 12 && hour < 17) return pick(AFTERNOON);
  if (hour >= 17 && hour < 21) return pick(EVENING);
  return pick(NIGHT);
}

export function firstNameFrom(fullName: string | null | undefined) {
  const first = (fullName ?? "").trim().split(" ")[0];
  return first || "friend";
}
