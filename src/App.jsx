import { useState } from 'react';
import AppShell from './app/AppShell.jsx';
import { getRoute } from './app/routes.jsx';

export default function App() {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const route = getRoute(activeRoute);

  return <AppShell activeRoute={activeRoute} onNavigate={setActiveRoute} route={route} />;
}
