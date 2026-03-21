import { Deal } from "@/lib/deals";

export default function DealCard({ deal }: { deal: Deal }) {
  return (
    <div
      className="deal-card bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-2 border border-gray-100 hover:border-green-200"
    >
      {/* Emoji */}
      <div className="text-4xl text-center">{deal.emoji}</div>

      {/* Category badge */}
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full self-start"
        style={{ background: "#e8f5e2", color: "#003d28" }}
      >
        {deal.category}
      </span>

      {/* Name */}
      <h3 className="font-semibold text-gray-800 text-sm leading-tight">{deal.name}</h3>

      {/* Size */}
      {deal.size && (
        <p className="text-xs text-gray-400">{deal.size}</p>
      )}

      {/* Price */}
      <p
        className="text-lg font-bold mt-auto"
        style={{ color: "#003d28" }}
      >
        {deal.price}
      </p>

      {/* Special note */}
      {deal.note && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full text-center"
          style={{ background: "#fea319", color: "white" }}
        >
          {deal.note}
        </span>
      )}
    </div>
  );
}
