import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  Calendar, 
  Flame, 
  Sparkles, 
  Layers, 
  HelpCircle, 
  Zap, 
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { DailyActivity } from '../types';

interface StudyHeatmapD3Props {
  activities: DailyActivity[];
  currentWeek: number;
  onSimulateActivity?: () => void;
}

export const StudyHeatmapD3: React.FC<StudyHeatmapD3Props> = ({
  activities,
  currentWeek,
  onSimulateActivity,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<'weekly-expanded' | 'multi-week'>('weekly-expanded');
  const [hoveredDay, setHoveredDay] = useState<DailyActivity | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Compute stats defensively
  const safeActivities = Array.isArray(activities) ? activities : [];
  const currentWeekDays = safeActivities.filter((a) => a.weekOffset === 0);
  const totalWeeklyInteractions = currentWeekDays.reduce((acc, a) => acc + (a.totalInteractions || 0), 0);
  const totalWeeklyMinutes = currentWeekDays.reduce((acc, a) => acc + (a.studyMinutes || 0), 0);
  
  const peakDay = currentWeekDays.length > 0 
    ? [...currentWeekDays].sort((a, b) => b.totalInteractions - a.totalInteractions)[0]
    : null;

  // D3 Render Effect
  useEffect(() => {
    if (!svgRef.current || safeActivities.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const containerWidth = containerRef.current?.clientWidth || 700;
    
    // Color scale for interactions
    // 0 = dark slate, low = indigo, medium = bright violet, high = electric indigo, peak = emerald
    const colorScale = d3.scaleThreshold<number, string>()
      .domain([1, 10, 25, 45])
      .range([
        '#1e293b', // 0: empty
        '#3730a3', // 1-9: light
        '#4f46e5', // 10-24: medium
        '#6366f1', // 25-44: high
        '#10b981', // 45+: peak
      ]);

    if (viewMode === 'weekly-expanded') {
      // 7-day prominent card-style calendar bar
      const days = activities.filter((a) => a.weekOffset === 0);
      const margin = { top: 30, right: 20, bottom: 40, left: 20 };
      const width = Math.max(containerWidth, 600);
      const height = 180;

      svg.attr('viewBox', `0 0 ${width} ${height}`)
         .attr('width', '100%')
         .attr('height', height);

      const cellWidth = (width - margin.left - margin.right) / 7 - 10;
      const cellHeight = 90;

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      // Draw each day of the week
      days.forEach((d, i) => {
        const x = i * (cellWidth + 10);
        const y = 15;
        const fillColor = colorScale(d.totalInteractions);

        // Day container group
        const dayG = g.append('g')
          .attr('class', 'day-group cursor-pointer')
          .on('mouseenter', (event) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltipPos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top - 10,
              });
            }
            setHoveredDay(d);
          })
          .on('mousemove', (event) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltipPos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top - 10,
              });
            }
          })
          .on('mouseleave', () => {
            setHoveredDay(null);
            setTooltipPos(null);
          });

        // Top day name label
        dayG.append('text')
          .attr('x', x + cellWidth / 2)
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('fill', d.dayOfWeek === 'Wed' || d.dayOfWeek === 'Thu' ? '#c7d2fe' : '#94a3b8')
          .attr('font-size', '12px')
          .attr('font-weight', '600')
          .text(d.dayOfWeek);

        // Date pill text (e.g., Oct 21)
        const dateObj = new Date(d.date);
        const dateStr = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : d.date;

        dayG.append('text')
          .attr('x', x + cellWidth / 2)
          .attr('y', 11)
          .attr('text-anchor', 'middle')
          .attr('fill', '#64748b')
          .attr('font-size', '10px')
          .text(dateStr);

        // Contribution Box Rect with D3 Transition animation
        const rect = dayG.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', cellWidth)
          .attr('height', 0) // start at 0 for animation
          .attr('rx', 10)
          .attr('ry', 10)
          .attr('fill', fillColor)
          .attr('stroke', d.totalInteractions > 30 ? '#818cf8' : '#334155')
          .attr('stroke-width', d.totalInteractions > 30 ? 1.5 : 1)
          .attr('opacity', 0.9);

        rect.transition()
          .duration(500)
          .delay(i * 60)
          .attr('height', cellHeight);

        // Volume count badge inside cell
        dayG.append('text')
          .attr('x', x + cellWidth / 2)
          .attr('y', y + cellHeight / 2 - 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '18px')
          .attr('font-weight', '800')
          .text(d.totalInteractions);

        dayG.append('text')
          .attr('x', x + cellWidth / 2)
          .attr('y', y + cellHeight / 2 + 14)
          .attr('text-anchor', 'middle')
          .attr('fill', d.totalInteractions > 0 ? '#e0e7ff' : '#64748b')
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .text(d.totalInteractions === 1 ? 'action' : 'actions');

        // Minutes studied badge
        if (d.studyMinutes > 0) {
          dayG.append('text')
            .attr('x', x + cellWidth / 2)
            .attr('y', y + cellHeight - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#a5b4fc')
            .attr('font-size', '10px')
            .text(`${d.studyMinutes}m`);
        }
      });

    } else {
      // Multi-Week Matrix View (Classic GitHub calendar layout for 8 weeks)
      const margin = { top: 25, right: 20, bottom: 20, left: 45 };
      const numWeeks = 8;
      const numDays = 7;
      const cellSize = 16;
      const cellGap = 4;
      const width = margin.left + numWeeks * (cellSize + cellGap) + margin.right + 40;
      const height = margin.top + numDays * (cellSize + cellGap) + margin.bottom;

      svg.attr('viewBox', `0 0 ${width} ${height}`)
         .attr('width', '100%')
         .attr('height', height);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Row labels
      dayLabels.forEach((label, idx) => {
        if (idx % 2 === 1) { // Show Mon, Wed, Fri for clean look
          g.append('text')
            .attr('x', -8)
            .attr('y', idx * (cellSize + cellGap) + cellSize / 2 + 4)
            .attr('text-anchor', 'end')
            .attr('fill', '#64748b')
            .attr('font-size', '10px')
            .attr('font-weight', '500')
            .text(label);
        }
      });

      // Week headers (Wk 1 to Wk 8)
      for (let w = 0; w < numWeeks; w++) {
        g.append('text')
          .attr('x', w * (cellSize + cellGap) + cellSize / 2)
          .attr('y', -8)
          .attr('text-anchor', 'middle')
          .attr('fill', w === numWeeks - 1 ? '#818cf8' : '#64748b')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .text(`W${w + 1}`);
      }

      // Render cells
      activities.forEach((act) => {
        // weekOffset goes from -(numWeeks-1) to 0
        const weekCol = (act.weekOffset ?? 0) + (numWeeks - 1);
        if (weekCol < 0 || weekCol >= numWeeks) return;
        const row = act.dayIndex % 7;

        const x = weekCol * (cellSize + cellGap);
        const y = row * (cellSize + cellGap);
        const fillColor = colorScale(act.totalInteractions);

        g.append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', cellSize)
          .attr('height', cellSize)
          .attr('rx', 3)
          .attr('ry', 3)
          .attr('fill', fillColor)
          .attr('stroke', '#334155')
          .attr('stroke-width', 0.8)
          .attr('class', 'cursor-pointer hover:stroke-indigo-400')
          .on('mouseenter', (event) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltipPos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top - 10,
              });
            }
            setHoveredDay(act);
          })
          .on('mousemove', (event) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              setTooltipPos({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top - 10,
              });
            }
          })
          .on('mouseleave', () => {
            setHoveredDay(null);
            setTooltipPos(null);
          });
      });
    }

  }, [activities, viewMode]);

  return (
    <div ref={containerRef} className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
      
      {/* Heatmap Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Study Activity Heatmap</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                D3 Calendar Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Daily flashcard reviews, quizzes, and slide interactions across the week
            </p>
          </div>
        </div>

        {/* View Toggle & Simulate Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setViewMode('weekly-expanded')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewMode === 'weekly-expanded'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              This Week Focus
            </button>
            <button
              onClick={() => setViewMode('multi-week')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                viewMode === 'multi-week'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              8-Week Matrix
            </button>
          </div>

          {onSimulateActivity && (
            <button
              onClick={onSimulateActivity}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              title="Add study session interactions to today's cell"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Log Practice</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas for D3 Heatmap */}
      <div className="w-full overflow-x-auto py-2">
        <svg ref={svgRef} className="w-full select-none" />
      </div>

      {/* Interactive Tooltip Overlay */}
      {hoveredDay && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-950 border border-indigo-500/40 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[210px]"
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="font-bold text-white">{hoveredDay.dayOfWeek}, {hoveredDay.date}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              {hoveredDay.totalInteractions > 40 ? 'Peak Day 🔥' : hoveredDay.totalInteractions > 15 ? 'High 👍' : 'Active'}
            </span>
          </div>

          <div className="space-y-1 text-slate-300 pt-0.5">
            <div className="flex items-center justify-between text-indigo-300 font-bold">
              <span>Total Activity:</span>
              <span>{hoveredDay.totalInteractions} interactions</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                Flashcards Reviewed:
              </span>
              <span className="text-white font-medium">{hoveredDay.flashcardsCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-violet-400" />
                Quiz Qs Answered:
              </span>
              <span className="text-white font-medium">{hoveredDay.quizQuestionsCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Estimated Time:
              </span>
              <span className="text-white font-medium">{hoveredDay.studyMinutes} mins</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row: Key Metrics & Heatmap Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
        
        {/* Quick Highlights */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Weekly Volume: <strong className="text-white">{totalWeeklyInteractions}</strong> interactions</span>
          </span>
          {peakDay && (
            <span className="flex items-center gap-1.5 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Busiest: <strong className="text-amber-300">{peakDay.dayOfWeek} ({peakDay.totalInteractions})</strong></span>
            </span>
          )}
          <span className="text-slate-500 hidden md:inline">
            • {totalWeeklyMinutes} total study minutes
          </span>
        </div>

        {/* D3 Intensity Legend */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[11px] text-slate-500 mr-1">Less</span>
          <div className="w-3.5 h-3.5 rounded bg-[#1e293b] border border-slate-700" title="0 actions" />
          <div className="w-3.5 h-3.5 rounded bg-[#3730a3]" title="1-9 actions" />
          <div className="w-3.5 h-3.5 rounded bg-[#4f46e5]" title="10-24 actions" />
          <div className="w-3.5 h-3.5 rounded bg-[#6366f1]" title="25-44 actions" />
          <div className="w-3.5 h-3.5 rounded bg-[#10b981]" title="45+ peak actions" />
          <span className="text-[11px] text-slate-500 ml-1">More</span>
        </div>

      </div>

    </div>
  );
};
