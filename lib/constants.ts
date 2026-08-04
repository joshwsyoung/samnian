export const PRICE_LEVELS = ["£", "££", "£££"] as const;
export type PriceLevel = (typeof PRICE_LEVELS)[number];

export const SLOTS = ["12:00", "13:00", "14:00", "18:00", "19:00", "20:00"] as const;
export type Slot = (typeof SLOTS)[number];

// The legacy app hardcoded this same short list in profile.php.
export const CITIES = ["Marlow", "London", "Bristol", "Durban SA"] as const;

export const PASSWORD_PATTERN = "^(?=.*[A-Z])(?=.*\\d).{8,}$";
export const PASSWORD_HINT =
  "Password must be at least 8 characters long, with at least one uppercase letter and one number";
