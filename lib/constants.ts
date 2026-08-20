export const PRICE_TIERS = [
  { value: "broke", label: "I'm broke", range: "£0 per head" },
  { value: "modest", label: "Let's not break the bank", range: "£30–£50 per head" },
  { value: "fun", label: "Let's have some fun", range: "£50–£80 per head" },
  { value: "baller", label: "A fool and their money are fun to go out with", range: "£200+ per head" },
] as const;
export type PriceTier = (typeof PRICE_TIERS)[number]["value"];
export const PRICE_TIER_VALUES = PRICE_TIERS.map((t) => t.value) as PriceTier[];

export function priceTierLabel(tier: string): string {
  return PRICE_TIERS.find((t) => t.value === tier)?.label ?? tier;
}

export function priceTierRange(tier: string): string {
  return PRICE_TIERS.find((t) => t.value === tier)?.range ?? "";
}

export const SLOTS = ["12:00", "13:00", "14:00", "18:00", "19:00", "20:00"] as const;
export type Slot = (typeof SLOTS)[number];

// The legacy app hardcoded this same short list in profile.php.
export const CITIES = ["London", "Marlow", "Bristol", "Durban SA"] as const;

export const PASSWORD_PATTERN = "^(?=.*[A-Z])(?=.*\\d).{8,}$";
export const PASSWORD_HINT =
  "Password must be at least 8 characters long, with at least one uppercase letter and one number";
