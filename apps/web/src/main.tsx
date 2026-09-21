import { createRoot } from 'react-dom/client';

import { Demo } from './pages/Demo.js';

import '@taqaddum/design-tokens/tokens.css';
import '../../../packages/ui/src/components/components.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(<Demo />);
