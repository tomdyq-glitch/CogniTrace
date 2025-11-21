import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { SkillState } from '../types';

interface KnowledgeGraphProps {
  skills: Record<string, SkillState>;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ skills }) => {
  const data = Object.values(skills).map((skill: SkillState) => ({
    subject: skill.subject,
    mastery: Math.round(skill.masteryLevel * 100),
    fullMark: 100,
  }));

  return (
    <div className="h-64 w-full bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">当前知识掌握状态</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="掌握度"
            dataKey="mastery"
            stroke="#6366f1"
            strokeWidth={2}
            fill="#6366f1"
            fillOpacity={0.3}
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, '掌握度']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#4338ca', fontWeight: 600 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};