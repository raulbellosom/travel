import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ActivityAreaChart = ({ data, viewsLabel, leadsLabel }) => (
  <ResponsiveContainer width="99%" height={280}>
    <AreaChart
      data={data}
      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
    >
      <defs>
        <linearGradient id="colorVistas" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid
        strokeDasharray="3 3"
        vertical={false}
        stroke="#cbd5e1"
        opacity={0.2}
      />
      <XAxis
        dataKey="name"
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#64748b", fontSize: 12 }}
        dy={10}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#64748b", fontSize: 12 }}
      />
      <Tooltip
        contentStyle={{
          borderRadius: "12px",
          border: "none",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }}
        itemStyle={{ fontWeight: 600 }}
      />
      <Area
        type="monotone"
        dataKey="vistas"
        name={viewsLabel}
        stroke="#0ea5e9"
        strokeWidth={3}
        fillOpacity={1}
        fill="url(#colorVistas)"
      />
      <Area
        type="monotone"
        dataKey="leads"
        name={leadsLabel}
        stroke="#10b981"
        strokeWidth={3}
        fillOpacity={1}
        fill="url(#colorLeads)"
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default ActivityAreaChart;
