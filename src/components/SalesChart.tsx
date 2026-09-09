import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export type SalesChartDatum = {
  name: string;
  total: number;
};

const formatTick = (number: number) => {
  if (number > 1000000000) {
    return `${(number / 1000000000).toString()} Miliar`;
  }
  if (number > 1000000) {
    return `${(number / 1000000).toString()} Juta`;
  }
  if (number > 1000) {
    return `${(number / 1000).toString()} Ribu`;
  }
  return number.toString();
};

// Dipisah dari pages/index.tsx supaya recharts (chunk ±390 kB mentah bersama lodash dan d3)
// bisa dimuat lewat next/dynamic, bukan ikut bundel awal dashboard.
export const SALES_CHART_HEIGHT = 308;

function SalesChart({ data }: { data: SalesChartDatum[] }): JSX.Element {
  return (
    <ResponsiveContainer width="100%" height={SALES_CHART_HEIGHT}>
      <LineChart data={data}>
        <XAxis dataKey="name" />
        <YAxis
          tickFormatter={formatTick}
          style={{
            fontSize: 10,
          }}
        />
        <Line type="monotone" dataKey="total" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default SalesChart;
