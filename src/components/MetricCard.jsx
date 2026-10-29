export default function MetricCard({ label, value, delta, positive = true }) {
  return (
    <article className="card metric-card">
      <p className="metric-label">{label}</p>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
        <span className={`metric-delta ${positive ? 'positive' : 'negative'}`}>{delta}</span>
      </div>
    </article>
  );
}
