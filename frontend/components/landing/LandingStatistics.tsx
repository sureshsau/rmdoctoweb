import { StatCard } from "./StatCard";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function LandingStatistics() {
  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Patient Satisfaction Rate */}
          <StatCard
            title="Patient Satisfaction Rate"
            value={98}
            change={8}
            changeDescription="last month"
            icon={<ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />}
          />

          {/* Average Wait Time */}
          <StatCard
            title="Average Wait Time"
            value={15}
            change={-25}
            changeDescription="last week"
            icon={<ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />}
          />
          
          {/* Successful Treatments */}
          <StatCard
            title="Successful Treatments"
            value={96}
            change={2.5}
            changeDescription="last quarter"
            icon={<ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />}
          />
        </div>
      </div>
    </section>
  );
}