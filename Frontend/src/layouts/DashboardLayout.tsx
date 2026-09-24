import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer.tsx';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <div key={location.pathname} className="route-transition">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};
