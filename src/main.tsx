import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// NOTE: Auth providers are intentionally NOT mounted here.
//
// CustomerAuthProvider is mounted inside the customer Layout
// (src/components/layout/Layout.tsx), scoped to the customer route tree.
// AdminAuthProvider is mounted around the admin routes only
// (src/App.tsx). Keeping them out of this top-level render tree, and
// scoped to their own route subtrees, is what keeps the two sessions
// structurally isolated instead of merely "not currently interfering".
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
