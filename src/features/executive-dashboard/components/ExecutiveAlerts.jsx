import { useApp } from '../../../context/AppContext.jsx';
import ChartCard from '../../../components/ChartCard.jsx';

export default function ExecutiveAlerts({ alerts }) {
  const { t } = useApp();
  return (
    <ChartCard title={t('alerts.title')} subtitle={t('alerts.subtitle')} action={<button type="button" className="link-button">{t('alerts.viewAll')}</button>}>
      <div className="alert-list">
        {alerts.map((alert) => (
          <article key={alert.id} className={`alert-item ${alert.severity}`}>
            <span />
            <div>
              <h3 className="alert-title">{alert.title}</h3>
              <p className="alert-detail">{alert.detail}</p>
              <div className="alert-meta"><span>{alert.project}</span><span>{alert.owner}</span><span>{alert.date}</span></div>
            </div>
          </article>
        ))}
      </div>
    </ChartCard>
  );
}
