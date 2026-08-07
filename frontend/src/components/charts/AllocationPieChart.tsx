import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface PieProps {
  sectorAllocation: Record<string, number>;
}

const COLORS = ['#22c55e', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#64748b'];

export const AllocationPieChart: React.FC<PieProps> = ({ sectorAllocation }) => {
  const data = Object.entries(sectorAllocation).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2))
  }));

  if (data.length === 0) {
    return <div className="text-center text-xs text-slate-500 py-8">No sector data available.</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0f172a" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
            formatter={(val: any) => [`${val}%`, 'Allocation']}
          />
          <Legend formatter={(val: any) => <span className="text-xs text-slate-300 font-medium">{val}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
