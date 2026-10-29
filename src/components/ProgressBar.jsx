export default function ProgressBar({ value, tone = 'brand' }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={safeValue} aria-valuemin="0" aria-valuemax="100">
      <div className={`progress-fill ${tone}`} style={{ width: `${safeValue}%` }} />
    </div>
  );
}
