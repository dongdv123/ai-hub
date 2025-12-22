import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import MainApp from './features/seo-assistant/MainApp';
import type { AuthUser } from './features/seo-assistant/types';

const App: React.FC = () => {
  // Since authentication is removed, create a default user for the app.
  const defaultUser: AuthUser = {
    id: 1,
    name: 'Internal User',
    role: 'Team Member',
  };

  // Set a consistent background color for the app
  useEffect(() => {
    document.body.style.backgroundColor = '#ffffff'; // plain white
  }, []);

  return (
    <BrowserRouter>
      <MainApp user={defaultUser} />
    </BrowserRouter>
  );
};

export default App;
