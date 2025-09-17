
import { createRoot } from 'react-dom/client'
import { Root } from './Root.tsx'
import './index.css'
import './utils/debugUtils'

createRoot(document.getElementById("root")!).render(<Root />);
