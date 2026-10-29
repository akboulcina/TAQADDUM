import { useApp } from '../../context/AppContext.jsx';
import PageHeader from '../../app/PageHeader.jsx';
import MetricCard from '../../components/MetricCard.jsx';
import PortfolioHealth from './components/PortfolioHealth.jsx';
import BudgetPerformance from './components/BudgetPerformance.jsx';
import AlgeriaMapPreview from './components/AlgeriaMapPreview.jsx';
import PriorityProjects from './components/PriorityProjects.jsx';
import ExecutiveAlerts from './components/ExecutiveAlerts.jsx';
import { executiveKpis, executiveAlerts } from '../../data/dashboard.js';
import { projects } from '../../data/projects.js';
import './ExecutiveDashboard.css';

export default function ExecutiveDashboard() {
  const { t, lang, user } = useApp();
  return (
    <>
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} actions={
        <>
          <button type="button" className="button">{t('action.export')}</button>
          <button type="button" className="button primary">{t('action.report')}</button>
        </>
      } />
      <p className="role-context"><strong>{user.name}</strong> · {user.role[lang]} — {user.focus[lang]}</p>
      <section className="kpi-grid">
        {executiveKpis.map((kpi) => <MetricCard key={kpi.id} label={t(kpi.labelKey)} value={kpi.value} delta={kpi.delta} positive={kpi.positive} />)}
      </section>
      <section className="dashboard-grid">
        <PortfolioHealth projects={projects} />
        <BudgetPerformance projects={projects} />
      </section>
      <section className="dashboard-grid">
        <AlgeriaMapPreview projects={projects} />
        <ExecutiveAlerts alerts={executiveAlerts} />
      </section>
      <PriorityProjects projects={projects} />
    </>
  );
}
