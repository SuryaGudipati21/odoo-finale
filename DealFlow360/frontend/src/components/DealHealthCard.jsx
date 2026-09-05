// Owner: Sanjay — single alert card, used in DealHealthDashboard
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
      bg: "from-blue-600/20 to-blue-400/10",
      border: "border-blue-500/30",
      text: "text-blue-300",
      icon_bg: "bg-blue-500/20",
      trend_positive: "text-green-400",
      trend_negative: "text-red-400",
    },
    green: {
      bg: "from-green-600/20 to-green-400/10",
      border: "border-green-500/30",
      text: "text-green-300",
      icon_bg: "bg-green-500/20",
      trend_positive: "text-green-400",
      trend_negative: "text-red-400",
    },
    red: {
      bg: "from-red-600/20 to-red-400/10",
      border: "border-red-500/30",
      text: "text-red-300",
      icon_bg: "bg-red-500/20",
      trend_positive: "text-green-400",
      trend_negative: "text-red-400",
    },
    purple: {
      bg: "from-purple-600/20 to-purple-400/10",
      border: "border-purple-500/30",
      text: "text-purple-300",
      icon_bg: "bg-purple-500/20",
      trend_positive: "text-green-400",
      trend_negative: "text-red-400",
    },
    amber: {
      bg: "from-amber-600/20 to-amber-400/10",
      border: "border-amber-500/30",
      text: "text-amber-300",
      icon_bg: "bg-amber-500/20",
      trend_positive: "text-green-400",
      trend_negative: "text-red-400",
    },
  };

  const style = variants[variant] || variants.blue;
  const isPositiveTrend = trend === "up";
  const trendColor = isPositiveTrend ? style.trend_positive : style.trend_negative;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} p-6 backdrop-blur-sm transition-all duration-300 hover:border-opacity-100 ${
        onClick ? "cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transform hover:scale-105" : ""
      }`}
    >
      {/* Animated Background Orb */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>

      {/* Content */}
      <div className="relative z-10 space-y-4">
        {/* Header: Title + Icon */}
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            {title}
          </h3>
          {icon && (
            <div className={`${style.icon_bg} p-2 rounded-lg backdrop-blur-sm`}>
              <span className="text-lg">{icon}</span>
            </div>
          )}
        </div>

        {/* Main Value */}
        <div>
          <p className={`text-4xl font-bold ${style.text} leading-tight`}>
            {value}
          </p>
          {label && (
            <p className="text-xs text-gray-400 mt-2">{label}</p>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && trendValue !== undefined && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <span className={`text-sm font-semibold ${trendColor}`}>
              {isPositiveTrend ? "↑" : "↓"} {Math.abs(trendValue)}%
            </span>
            <span className="text-xs text-gray-400">
              vs last period
            </span>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-r ${style.bg} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
      </div>
    </div>
  );
};

export default DealHealthCard;