import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({ title, value, trend, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${colors[color]} transition-colors`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}