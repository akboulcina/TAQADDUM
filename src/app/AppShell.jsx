import { useApp } from '../context/AppContext.jsx';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import ExecutiveDashboard from '../features/executive-dashboard/ExecutiveDashboard.jsx';
import ModulePlaceholder from './ModulePlaceholder.jsx';

const moduleContracts = {
  portfolio: 'PortfolioTable, PortfolioFilters, PortfolioSummary; props: projects, user, onSelectProject.',
  map: 'AlgeriaProjectMap; props: sites, projects, selectedWilaya, onSelectWilaya.',
  kpi: 'KpiExplorer, TrendCharts, PerformanceMatrix; props: projects, kpis, user.',
  alerts: 'AlertCenter, RiskMatrix, AlertDetail; props: alerts, projects, user.',
  collaboration: 'ConversationPanel, ApprovalQueue, ActivityFeed; props: user, projects, activity.',
  'project-details': 'ProjectHeader, MilestoneTimeline, FinancialPanel, DocumentList; props: project, user.',
  reports: 'ReportLibrary, ReportBuilder, ExportQueue; props: projects, user.'
};

export default function AppShell({ activeRoute, onNavigate, route }) {
  const { t, lang, dir, user } = useApp();
  return (
    <div className="app-shell" dir={dir} lang={lang}>
      <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />
      <div className="main-area">
        <TopBar route={route} />
        <main className="content">
          <div className="demo-banner"><span className="demo-dot" /><span>{t('demo.banner')}</span></div>
          {activeRoute === 'dashboard' ? <ExecutiveDashboard /> : <ModulePlaceholder route={route} contract={moduleContracts[activeRoute]} />}
          <footer className="app-footer">{t('footer.demo')} · {user.role[lang]}</footer>
        </main>
      </div>
    </div>
  );
}
