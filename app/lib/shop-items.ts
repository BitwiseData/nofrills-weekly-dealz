export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
  coinPrice: number;
  regularPrice: string;
  savings: string;
  badge?: string;
  inStock: boolean;
}

export const shopItems: ShopItem[] = [
  { id: "1",  name: "Strawberries 1 lb",      emoji: "🍓", category: "Produce",  coinPrice: 200, regularPrice: "$3.99", savings: "Save $2.00", badge: "Popular", inStock: true  },
  { id: "2",  name: "Whole Milk 2 L",          emoji: "🥛", category: "Dairy",    coinPrice: 400, regularPrice: "$5.49", savings: "Save $3.49",              inStock: true  },
  { id: "3",  name: "Large Eggs 1 Dozen",      emoji: "🥚", category: "Dairy",    coinPrice: 350, regularPrice: "$5.99", savings: "Save $3.99", badge: "Hot",     inStock: true  },
  { id: "4",  name: "Basmati Rice 8 lb",       emoji: "🍚", category: "Pantry",   coinPrice: 800, regularPrice: "$19.99",savings: "Save $6.00",              inStock: true  },
  { id: "5",  name: "Sourdough Bread 675 g",   emoji: "🍞", category: "Bakery",   coinPrice: 300, regularPrice: "$4.49", savings: "Save $2.49",              inStock: true  },
  { id: "6",  name: "Mixed Nuts 1 lb",         emoji: "🥜", category: "Snacks",   coinPrice: 600, regularPrice: "$9.99", savings: "Save $4.99", badge: "New",     inStock: true  },
  { id: "7",  name: "Chapman's Ice Cream 2 L", emoji: "🍦", category: "Frozen",   coinPrice: 500, regularPrice: "$7.99", savings: "Save $3.00",              inStock: false },
  { id: "8",  name: "Peanut Butter 750 g",     emoji: "🫙", category: "Pantry",   coinPrice: 350, regularPrice: "$6.29", savings: "Save $2.79",              inStock: true  },
  { id: "9",  name: "Orange Juice 1.75 L",     emoji: "🍊", category: "Beverage", coinPrice: 450, regularPrice: "$6.99", savings: "Save $3.99",              inStock: true  },
  { id: "10", name: "Rotisserie Chicken",       emoji: "🍗", category: "Meat",     coinPrice: 900, regularPrice: "$13.99",savings: "Save $5.99", badge: "Limited", inStock: true  },
  { id: "11", name: "Roma Tomatoes 2 lb",       emoji: "🍅", category: "Produce",  coinPrice: 180, regularPrice: "$2.99", savings: "Save $1.49",              inStock: true  },
  { id: "12", name: "Greek Yogurt 750 g",       emoji: "🫙", category: "Dairy",    coinPrice: 400, regularPrice: "$6.49", savings: "Save $3.49",              inStock: true  },
  { id: "13", name: "Lean Ground Beef 1 lb",   emoji: "🥩", category: "Meat",     coinPrice: 700, regularPrice: "$10.99",savings: "Save $4.99",              inStock: true  },
  { id: "14", name: "Baby Spinach 142 g",       emoji: "🥬", category: "Produce",  coinPrice: 250, regularPrice: "$3.99", savings: "Save $2.49",              inStock: true  },
  { id: "15", name: "Cheddar Cheese 400 g",    emoji: "🧀", category: "Dairy",    coinPrice: 500, regularPrice: "$7.99", savings: "Save $3.55", badge: "Popular", inStock: true  },
];

export const shopCategories = ["All", ...Array.from(new Set(shopItems.map((i) => i.category))).sort()];
