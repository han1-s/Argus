import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header/Header';
import { Footer } from '../components/Footer/Footer.tsx';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.body.classList.contains('reduce-animations');
    const targets = Array.from(mainRef.current?.querySelectorAll<HTMLElement>(
      '.home-hero, .home-section, .home-responsibility-section, .home-final-cta, .sm-hero, .sm-section, .sm-final-cta, .section-block, .download-box-card, .updates-box-card, .settings-content-card, .settings-sidebar',
    ) ?? []);

    if (reducedMotion || !('IntersectionObserver' in window)) return;

    targets.forEach((target) => target.classList.add('scroll-reveal-pending'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('scroll-reveal-pending');
        entry.target.classList.add('scroll-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

    const revealWithoutMotion = () => {
      if (!document.body.classList.contains('reduce-animations')) return;
      observer.disconnect();
      targets.forEach((target) => target.classList.remove('scroll-reveal-pending', 'scroll-revealed'));
    };

    targets.forEach((target) => observer.observe(target));
    window.addEventListener('argus-preferences-changed', revealWithoutMotion);
    return () => {
      observer.disconnect();
      window.removeEventListener('argus-preferences-changed', revealWithoutMotion);
      targets.forEach((target) => target.classList.remove('scroll-reveal-pending', 'scroll-revealed'));
    };
  }, [location.key]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.body.classList.contains('reduce-animations');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content" ref={mainRef}>
        <div key={location.key} className="route-page-transition">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};
