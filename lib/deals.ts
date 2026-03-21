export interface Deal {
  id: number;
  name: string;
  category: string;
  size: string;
  price: string;
  note: string;
  emoji: string;
}

export const deals: Deal[] = [
  { id: 1, name: "Strawberries", category: "Produce", size: "1 lb Clamshell", price: "$1.99", note: "", emoji: "🍓" },
  { id: 2, name: "Roma Tomatoes", category: "Produce", size: "", price: "$1.29/lb", note: "", emoji: "🍅" },
  { id: 3, name: "Bartlett Pears", category: "Produce", size: "", price: "$0.99/lb", note: "", emoji: "🍐" },
  { id: 4, name: "Eat Smart Salad Kit", category: "Packaged Salad", size: "292-383 g", price: "$3.99", note: "", emoji: "🥗" },
  { id: 5, name: "SeaQuest White Shrimp", category: "Seafood", size: "36-55 ct", price: "$5.50", note: "Save 21%", emoji: "🦐" },
  { id: 6, name: "Lean Ground Lamb", category: "Meat", size: "", price: "$13.00", note: "Halal", emoji: "🥩" },
  { id: 7, name: "Italpasta", category: "Pantry", size: "750 g", price: "$1.50", note: "", emoji: "🍝" },
  { id: 8, name: "Gallo Olive Oil", category: "Pantry", size: "1 L", price: "$8.99", note: "", emoji: "🫒" },
  { id: 9, name: "Kraft Peanut Butter", category: "Pantry", size: "750g-1kg", price: "$6.29", note: "", emoji: "🥜" },
  { id: 10, name: "Medjool Dates", category: "Produce", size: "2 lb Tub", price: "$8.77", note: "", emoji: "🌴" },
  { id: 11, name: "Guard Basmati Rice", category: "Pantry", size: "8 lb", price: "$13.99", note: "", emoji: "🍚" },
  { id: 12, name: "Quaker Chewy Bars", category: "Snacks", size: "120 g", price: "$1.75", note: "Limit 6", emoji: "🍫" },
  { id: 13, name: "Tide Liquid Detergent", category: "Household", size: "1.09-3.4 L", price: "$12.99", note: "", emoji: "🧴" },
  { id: 14, name: "PC Coffee", category: "Beverage", size: "800-930 g", price: "$20.00", note: "Earn 5000 pts", emoji: "☕" },
  { id: 15, name: "Muffin Pan", category: "Kitchenware", size: "12-cup", price: "$5.00", note: "", emoji: "🧁" },
  { id: 16, name: "Armstrong Cheese", category: "Dairy", size: "400-600 g", price: "$6.44", note: "Selected varieties", emoji: "🧀" },
  { id: 17, name: "Wonder Bread", category: "Bakery", size: "450-675 g", price: "$2.49", note: "", emoji: "🍞" },
  { id: 18, name: "Chapman's Ice Cream", category: "Frozen", size: "2 L", price: "$4.99", note: "", emoji: "🍦" },
];

export const categories = ["All", ...Array.from(new Set(deals.map((d) => d.category)))];

export function searchDeals(query: string, category: string): Deal[] {
  return deals.filter((deal) => {
    const matchesCategory = category === "All" || deal.category === category;
    const matchesQuery =
      query === "" ||
      deal.name.toLowerCase().includes(query.toLowerCase()) ||
      deal.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });
}
