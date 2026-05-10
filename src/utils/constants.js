export const CATEGORIES = ["All", "Coffee & Milk Tea", "Soda & Milk", "Matcha", "Snack & Rice Meal"];
export const NO_SIZE_CATEGORIES = ["Snack & Rice Meal"];
export const SIZES = [
  { label: "Tall",   priceAdd: 0  },
  { label: "Grande", priceAdd: 15 },
  { label: "Venti",  priceAdd: 25 },
];
export const ADDONS = [
  { id: "extra_shot",     label: "Extra Shot",     price: 20 },
  { id: "oat_milk",       label: "Oat Milk",       price: 15 },
  { id: "extra_syrup",    label: "Extra Syrup",     price: 10 },
  { id: "whipped_cream",  label: "Whipped Cream",   price: 15 },
  { id: "tapioca_pearls", label: "Tapioca Pearls",  price: 10 },
];
export const PICKUP_SLOTS = [
  "8:00 AM","8:30 AM","9:00 AM","9:30 AM",
  "10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM",
  "2:00 PM","2:30 PM","3:00 PM","3:30 PM",
  "4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM",
];
export const SERVICE_FEE = 10;
export const LOYALTY_POINTS_PER_PESO = 0.1;
export const LOYALTY_GOAL = 500;
export const TAX_RATE = 0.12;