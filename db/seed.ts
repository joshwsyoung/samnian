/**
 * Seeds `interests`, `personality_tests`, and a handful of dummy `events`.
 *
 * `interests` and `personality_tests` had no seed data in the legacy repo
 * (they were populated directly in the old production database, which we
 * didn't migrate — see README). These are reasonable starter sets in the
 * same shape the app expects; edit freely, this is just enough to make the
 * app usable.
 *
 * The events are clearly-labelled placeholders — swap in real restaurants,
 * addresses, and photos before going live. They're dated on the next few
 * Wednesdays so they always show up as "upcoming" on /events.
 *
 * Run with: npm run db:seed
 */
import "dotenv/config";
import { db } from "@/lib/db";
import { events, interests, personalityTests } from "./schema";

const INTERESTS = [
  "Cooking", "Hiking", "Travel", "Reading", "Live Music", "Film & TV",
  "Photography", "Yoga", "Cycling", "Board Games", "Wine Tasting",
  "Art & Design", "Technology", "Gaming", "Football", "Running",
  "Gardening", "Volunteering", "Comedy", "Theatre",
];

const LIKERT = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];

const QUESTIONS: { question: string; trait: "O" | "C" | "E" | "A" | "N"; reverse: boolean }[] = [
  // Openness
  { question: "I have a vivid imagination.", trait: "O", reverse: false },
  { question: "I enjoy trying new and unusual foods.", trait: "O", reverse: false },
  { question: "I have a rich vocabulary and enjoy learning new words.", trait: "O", reverse: false },
  { question: "I prefer routine over variety.", trait: "O", reverse: true },
  { question: "I am curious about many different things.", trait: "O", reverse: false },
  // Conscientiousness
  { question: "I like to keep my things tidy and organized.", trait: "C", reverse: false },
  { question: "I follow a schedule and plan things in advance.", trait: "C", reverse: false },
  { question: "I often leave my belongings lying around.", trait: "C", reverse: true },
  { question: "I pay close attention to details.", trait: "C", reverse: false },
  { question: "I get chores done right away.", trait: "C", reverse: false },
  // Extraversion
  { question: "I feel comfortable around people.", trait: "E", reverse: false },
  { question: "I start conversations easily.", trait: "E", reverse: false },
  { question: "I prefer to stay in the background at social events.", trait: "E", reverse: true },
  { question: "I enjoy being the center of attention.", trait: "E", reverse: false },
  { question: "I find it hard to approach others.", trait: "E", reverse: true },
  // Agreeableness
  { question: "I am interested in other people's problems.", trait: "A", reverse: false },
  { question: "I sympathize with others' feelings.", trait: "A", reverse: false },
  { question: "I am not really interested in others.", trait: "A", reverse: true },
  { question: "I take time out for others.", trait: "A", reverse: false },
  { question: "I find it easy to insult people.", trait: "A", reverse: true },
  // Neuroticism
  { question: "I get stressed out easily.", trait: "N", reverse: false },
  { question: "I worry about things.", trait: "N", reverse: false },
  { question: "I am relaxed most of the time.", trait: "N", reverse: true },
  { question: "I get irritated easily.", trait: "N", reverse: false },
  { question: "I seldom feel blue.", trait: "N", reverse: true },
];

/** The next 4 Wednesdays from today, as "YYYY-MM-DD" strings. */
function nextFourWednesdays(): [string, string, string, string] {
  const d = new Date();
  d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7 || 7)); // next Wednesday
  const dates = [0, 1, 2, 3].map((i) => {
    const wed = new Date(d);
    wed.setDate(wed.getDate() + i * 7);
    return wed.toISOString().slice(0, 10);
  });
  return dates as [string, string, string, string];
}

function dummyEvents() {
  const [w1, w2, w3, w4] = nextFourWednesdays();
  return [
    {
      title: "Wednesday Supper Club",
      restaurantName: "[Placeholder] The Riverside Table",
      restaurantUrl: "https://example.com",
      imageUrl: "/images/dinner-cheers-riverside.jpg",
      address: "Southbank, London",
      description:
        "PLACEHOLDER EVENT — swap in a real restaurant, address, and photo before this goes live. A relaxed riverside spot, good for a first dinner with new faces.",
      eventDate: w1,
      slot: "19:00" as const,
      capacity: 6,
      published: true,
    },
    {
      title: "Midweek Meetup",
      restaurantName: "[Placeholder] Shoreditch Kitchen",
      restaurantUrl: "https://example.com",
      imageUrl: "/images/dinner-diner-friends.jpg",
      address: "Shoreditch, London",
      description:
        "PLACEHOLDER EVENT — swap in a real restaurant, address, and photo before this goes live. Small plates, big conversations.",
      eventDate: w2,
      slot: "18:00" as const,
      capacity: 6,
      published: true,
    },
    {
      title: "Long Table Dinner",
      restaurantName: "[Placeholder] Borough Bistro",
      restaurantUrl: "https://example.com",
      imageUrl: "/images/dinner-fine-dining.jpg",
      address: "Borough, London",
      description:
        "PLACEHOLDER EVENT — swap in a real restaurant, address, and photo before this goes live. A proper sit-down dinner for people who like to linger.",
      eventDate: w3,
      slot: "19:00" as const,
      capacity: 8,
      published: true,
    },
    {
      title: "Sunday-Feel Wednesday Roast",
      restaurantName: "[Placeholder] Marylebone Roast House",
      restaurantUrl: "https://example.com",
      imageUrl: "/images/dinner-seafood-shack.jpg",
      address: "Marylebone, London",
      description:
        "PLACEHOLDER EVENT — swap in a real restaurant, address, and photo before this goes live. Roast dinner energy on a Wednesday, because why not.",
      eventDate: w4,
      slot: "18:00" as const,
      capacity: 6,
      published: false,
    },
  ];
}

async function main() {
  const client = db();

  const existingInterests = await client.select().from(interests).limit(1);
  if (existingInterests.length === 0) {
    await client.insert(interests).values(INTERESTS.map((name) => ({ name })));
    console.log(`Seeded ${INTERESTS.length} interests.`);
  } else {
    console.log("Interests already seeded, skipping.");
  }

  const existingQuestions = await client.select().from(personalityTests).limit(1);
  if (existingQuestions.length === 0) {
    await client.insert(personalityTests).values(
      QUESTIONS.map((q) => ({
        question: q.question,
        trait: q.trait,
        reverse: q.reverse,
        options: LIKERT,
        answerType: "single" as const,
        required: true,
        active: true,
      }))
    );
    console.log(`Seeded ${QUESTIONS.length} OCEAN questions.`);
  } else {
    console.log("Personality test questions already seeded, skipping.");
  }

  const existingEvents = await client.select().from(events).limit(1);
  if (existingEvents.length === 0) {
    const toInsert = dummyEvents();
    await client.insert(events).values(toInsert);
    console.log(`Seeded ${toInsert.length} placeholder events — replace these with real restaurants before launch.`);
  } else {
    console.log("Events already seeded, skipping.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
