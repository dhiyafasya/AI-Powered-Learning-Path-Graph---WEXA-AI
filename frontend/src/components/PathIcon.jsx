import { Code2, LineChart, Server, Route } from 'lucide-react';

const MAP = {
  code: Code2,
  'chart-line': LineChart,
  server: Server,
};

export default function PathIcon({ icon, size = 20, ...rest }) {
  const Icon = MAP[icon] || Route;
  return <Icon size={size} {...rest} />;
}
