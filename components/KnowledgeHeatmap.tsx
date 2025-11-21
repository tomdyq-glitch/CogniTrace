import React from 'react';
import { Subject, GlobalStepLog } from '../types';
import { ResponsiveContainer } from 'recharts'; // Still importing container for sizing convenience if needed, but implementing custom SVG

interface KnowledgeHeatmapProps {
  logs: GlobalStepLog[];
  subjects: Subject[];
}

// Color interpolation function to match the reference image (Blue -> Teal -> Green)
// 0.0 -> Dark Blue
// 0.5 -> Teal
// 1.0 -> Light Green
const getHeatmapColor = (value: number): string => {
  // Clamp value
  const v = Math.max(0, Math.min(1, value));
  
  if (v < 0.5) {
    // Blue (#1e3a8a / rgb(30, 58, 138)) to Teal (#2dd4bf / rgb(45, 212, 191))
    // Normalized t 0-1 for first half
    const t = v * 2; 
    const r = Math.round(30 + (45 - 30) * t);
    const g = Math.round(58 + (212 - 58) * t);
    const b = Math.round(138 + (191 - 138) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Teal (#2dd4bf) to Light Green (#a7f3d0 / rgb(167, 243, 208))
    // Normalized t 0-1 for second half
    const t = (v - 0.5) * 2;
    const r = Math.round(45 + (167 - 45) * t);
    const g = Math.round(212 + (243 - 212) * t);
    const b = Math.round(191 + (208 - 191) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export const KnowledgeHeatmap: React.FC<KnowledgeHeatmapProps> = ({ logs, subjects }) => {
  // Dimensions
  const CELL_WIDTH = 16;
  const CELL_HEIGHT = 24;
  const LABEL_WIDTH = 100;
  const MARKER_HEIGHT = 30;
  const MARGIN_TOP = 40;
  const LEGEND_HEIGHT = 40;

  const stepsCount = Math.max(20, logs.length + 2); // Minimum width or actual
  const width = LABEL_WIDTH + stepsCount * CELL_WIDTH + 20;
  const height = MARGIN_TOP + subjects.length * CELL_HEIGHT + LEGEND_HEIGHT;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-4 overflow-hidden flex flex-col">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          知识追踪热力图 (BKT Visualization)
        </h3>
        <div className="flex gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                <span>正确</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full border-2 border-slate-400 box-border"></span>
                <span>错误</span>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
        <svg width={width} height={height} className="font-sans text-xs">
            
            {/* Top Markers: "Exercise attempted" */}
            <g transform={`translate(${LABEL_WIDTH}, 10)`}>
                <text x={-LABEL_WIDTH} y={15} className="fill-slate-700 font-bold text-sm">练习记录:</text>
                {logs.map((log, i) => (
                    <circle
                        key={`marker-${i}`}
                        cx={i * CELL_WIDTH + CELL_WIDTH / 2}
                        cy={10}
                        r={5}
                        // Solid grey for correct, Hollow grey ring for incorrect, matching the reference image style
                        fill={log.isCorrect ? '#64748b' : 'none'} 
                        stroke={'#64748b'}
                        strokeWidth={2}
                    >
                        <title>第 {i+1} 题: {log.activeSubject} ({log.isCorrect ? '正确' : '错误'})</title>
                    </circle>
                ))}
            </g>

            {/* Heatmap Matrix */}
            <g transform={`translate(0, ${MARGIN_TOP})`}>
                {subjects.map((subject, rowIdx) => (
                    <g key={subject} transform={`translate(0, ${rowIdx * CELL_HEIGHT})`}>
                        {/* Row Label */}
                        <text 
                            x={LABEL_WIDTH - 10} 
                            y={CELL_HEIGHT / 2 + 4} 
                            textAnchor="end" 
                            className="fill-slate-600 font-medium text-[11px]"
                        >
                            {subject}
                        </text>

                        {/* Cells */}
                        {logs.map((log, colIdx) => {
                            const mastery = log.masterySnapshot[subject] || 0;
                            const color = getHeatmapColor(mastery);
                            const isUpdated = log.activeSubject === subject;

                            return (
                                <rect
                                    key={`${subject}-${colIdx}`}
                                    x={LABEL_WIDTH + colIdx * CELL_WIDTH}
                                    y={0}
                                    width={CELL_WIDTH - 1} // -1 for grid gap
                                    height={CELL_HEIGHT - 1}
                                    fill={color}
                                    opacity={1}
                                    rx={2}
                                >
                                    <title>{subject}: {(mastery * 100).toFixed(0)}% (第{colIdx+1}步)</title>
                                </rect>
                            );
                        })}
                        
                        {/* Placeholder cells for future steps to fill grid width */}
                        {Array.from({ length: Math.max(0, stepsCount - logs.length) }).map((_, idx) => (
                             <rect
                                key={`placeholder-${subject}-${idx}`}
                                x={LABEL_WIDTH + (logs.length + idx) * CELL_WIDTH}
                                y={0}
                                width={CELL_WIDTH - 1}
                                height={CELL_HEIGHT - 1}
                                fill="#f1f5f9"
                                rx={2}
                            />
                        ))}
                    </g>
                ))}
            </g>

            {/* Color Scale Legend */}
            <g transform={`translate(${width - 150}, ${MARGIN_TOP + subjects.length * CELL_HEIGHT + 20})`}>
                <defs>
                    <linearGradient id="legendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(30, 58, 138)" />
                        <stop offset="50%" stopColor="rgb(45, 212, 191)" />
                        <stop offset="100%" stopColor="rgb(167, 243, 208)" />
                    </linearGradient>
                </defs>
                <text x={-10} y={10} textAnchor="end" className="fill-slate-500 text-[10px]">掌握概率 P(L)</text>
                <rect x={0} y={0} width={100} height={12} fill="url(#legendGradient)" rx={6} />
                <text x={0} y={24} className="fill-slate-400 text-[10px]">0.0</text>
                <text x={100} y={24} textAnchor="end" className="fill-slate-400 text-[10px]">1.0</text>
            </g>
        </svg>
      </div>
    </div>
  );
};