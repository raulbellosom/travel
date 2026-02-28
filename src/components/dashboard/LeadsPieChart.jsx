import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const LeadsPieChart = ({ data }) => (
  <ResponsiveContainer width="99%" height={250}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={5}
        dataKey="value"
        stroke="none"
      >
        {data.map((entry) => (
          <Cell key={entry.color} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          borderRadius: "8px",
          border: "none",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
        itemStyle={{ color: "#1e293b" }}
      />
    </PieChart>
  </ResponsiveContainer>
);

export default LeadsPieChart;
