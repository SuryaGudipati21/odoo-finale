// Owner: Sanjay — single metric card component, used in DealHealthDashboard
// Location: frontend/src/components/DealHealthCard.jsx

import React from "react";

const DealHealthCard = ({ 
  title, 
  value, 
  label, 
  trend, 
  trendValue, 
  icon, 
  variant = "blue",
  onClick
}) => {
  const variants = {
    blue: {
      bg: "from-blue-50/70 via-white to-indigo-50/40",
      border: "border-blue-200/80 hover:border-blue-300",
      text: "text-blue-700",
      icon_bg: "bg-blue-100 text-blue-600",
      trend_positive: "text-blue-600",
      trend_negative: "text-emerald-600",
    },
    green: {
      bg: "from-emerald-50/70 via-white to-green-50/40",
      border: "border-emerald-200/80 hover:border-emerald-300",
      text: "text-emerald-700",
      icon_bg: "bg-emerald-100 text-emerald-600",
      trend_positive: "text-emerald-600",
      trend_negative: "text-red-500",
    },
    red: {
      bg: "from-rose-50/70 via-white to-red-50/40",
      border: "border-rose-200/80 hover:border-rose-300",
      text: "text-rose-700",
      icon_bg: "bg-rose-100 text-rose-600",
      trend_positive: "text-rose-600",
      trend_negative: "text-emerald-600",
    },
    purple: {
      bg: "from-purple-50/70 via-white to-fuchsia-50/40",
      border: "border-purple-200/80 hover:border-purple-300",
      text: "text-purple-700",
      icon_bg: "bg-purple-100 text-purple-600",
      trend_positive: "text-purple-600",
      trend_negative: "text-emerald-600",
    },
    amber: {
      bg: "from-amber-50/70 via-white to-orange-50/40",
      border: "border-amber-200/80 hover:border-amber-300",
      text: "text-amber-700",
      icon_bg: "bg-amber-100 text-amber-600",
      trend_positive: "text-amber-600",
      trend_negative: "text-emerald-600",
    },
  };

  const style = variants[variant] || variants.blue;
  const isPositiveTrend = trend === "up";
  const trendColor = isPositiveTrend ? style.trend_positive : style.trend_negative;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.bg} p-6 shadow-xs hover:shadow-md transition-all duration-200 ${
        onClick ? "cursor-pointer transform hover:-translate-y-0.5" : ""
      }`}
    >
      {/* Subtle Background Glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/40 rounded-full blur-xl pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 space-y-3">
        {/* Header: Title + Icon */}
        <div className="flex items-start justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
          {icon && (
            <div className={`${style.icon_bg} w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs`}>
              <span className="text-base">{icon}</span>
            </div>
          )}
        </div>

        {/* Main Value */}
        <div>
          <p className={`text-3xl font-extrabold ${style.text} tracking-tight leading-tight`}>
            {value}
          </p>
          {label && (
            <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && trendValue !== undefined && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100">
            <span className={`text-xs font-bold ${trendColor}`}>
              {isPositiveTrend ? "↑" : "↓"} {Math.abs(trendValue)}%
            </span>
            <span className="text-xs text-gray-400">
              vs previous period
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealHealthCard;