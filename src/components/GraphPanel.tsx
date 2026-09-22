import React, { useState, useMemo } from "react";
import { Solve } from "../types";
import { calculateTimeSeries, calculateHistogram } from "../lib/graphStats";
import { LineChart } from "./charts/LineChart";
import { HistogramChart } from "./charts/HistogramChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GraphPanelProps {
  solves: Solve[];
  precision?: 2 | 3;
}

type TabType = "trend" | "distribution";
type RangeType = "50" | "100" | "all";

export const GraphPanel: React.FC<GraphPanelProps> = ({
  solves,
  precision = 3,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("trend");
  const [rangeFilter, setRangeFilter] = useState<RangeType>("100");
  const [showAo5, setShowAo5] = useState(true);
  const [showAo12, setShowAo12] = useState(true);

  // Filter solves by selected range
  const filteredSolves = useMemo(() => {
    if (rangeFilter === "50") return solves.slice(0, 50);
    if (rangeFilter === "100") return solves.slice(0, 100);
    return solves;
  }, [solves, rangeFilter]);

  // Compute graph data
  const timeSeriesPoints = useMemo(() => {
    return calculateTimeSeries(filteredSolves);
  }, [filteredSolves]);

  const histogramData = useMemo(() => {
    return calculateHistogram(filteredSolves, 10, precision);
  }, [filteredSolves, precision]);

  return (
    <div className="h-full flex flex-col border-1.5 border-sumi/10 dark:border-white/10 rounded-lg bg-sumi/[0.02] dark:bg-white/[0.02] overflow-hidden">
      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b-1.5 border-sumi/10 dark:border-white/10 bg-sumi/[0.02] dark:bg-white/[0.02] select-none">
        {/* Left: Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as TabType)}
        >
          <TabsList className="h-7 bg-transparent p-0 gap-1">
            <TabsTrigger value="trend" className="h-6 px-2 text-xs">
              Trend
            </TabsTrigger>
            <TabsTrigger value="distribution" className="h-6 px-2 text-xs">
              Distribution
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right: Controls (Series toggles & Range selector) */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {/* Line Chart specific toggles */}
          {activeTab === "trend" && (
            <div className="flex items-center gap-1 pr-1.5 border-r-1.5 border-sumi/10 dark:border-white/10">
              <button
                onClick={() => setShowAo5((v) => !v)}
                title="Toggle ao5 line"
                className={`px-1.5 py-0.5 rounded border-1.5 transition-colors font-semibold cursor-pointer ${
                  showAo5
                    ? "border-vermilion bg-vermilion/10 text-vermilion"
                    : "border-sumi/10 dark:border-white/10 text-sumi/30 dark:text-paper/30 hover:border-sumi/30"
                }`}
              >
                ao5
              </button>
              <button
                onClick={() => setShowAo12((v) => !v)}
                title="Toggle ao12 line"
                className={`px-1.5 py-0.5 rounded border-1.5 transition-colors font-semibold cursor-pointer ${
                  showAo12
                    ? "border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9]"
                    : "border-sumi/10 dark:border-white/10 text-sumi/30 dark:text-paper/30 hover:border-sumi/30"
                }`}
              >
                ao12
              </button>
            </div>
          )}

          {/* Range Filter */}
          <div className="flex items-center rounded border-1.5 border-sumi/10 dark:border-white/10 p-0.5 bg-paper dark:bg-paper-dark">
            {(["50", "100", "all"] as RangeType[]).map((r) => (
              <button
                key={r}
                onClick={() => setRangeFilter(r)}
                className={`px-1.5 py-0.5 rounded text-[11px] transition-colors uppercase cursor-pointer ${
                  rangeFilter === r
                    ? "bg-sumi/10 dark:bg-white/10 font-bold text-sumi dark:text-paper"
                    : "text-sumi/40 dark:text-paper/40 hover:text-sumi dark:hover:text-paper"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 p-2 min-h-0 relative">
        {solves.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center font-mono text-xs text-sumi/40 dark:text-paper/40">
            No solves recorded yet. Complete a solve to see chart!
          </div>
        ) : activeTab === "trend" ? (
          <LineChart
            points={timeSeriesPoints}
            showAo5={showAo5}
            showAo12={showAo12}
            precision={precision}
          />
        ) : (
          <HistogramChart
            histogram={histogramData}
            precision={precision}
          />
        )}
      </div>
    </div>
  );
};
