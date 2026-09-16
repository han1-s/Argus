import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Download as DownloadIcon, Info } from 'lucide-react';

export const Home: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    { title: 'Segurança Digital', src: '/assets/img/img1.jpg' },
    { title: 'Análise de Produtividade', src: '/assets/img/img2.jpg' },
    { title: 'Visão Operacional Centralizada', src: '/assets/img/img3.jpg' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="page-wrapper hero-wrapper">
      <section className="hero-content">
        <div className="title-wrapper">
          <h1 className="glow-title title-pulse-anim">Argus</h1>
          <span className="subtitle">Segurança e Análise Digital</span>
        </div>

        <p className="description">
          O Argus é uma solução inteligente para monitorar o uso de computadores em empresas,
          acompanhando sites e aplicativos utilizados e gerando dados e relatórios que auxiliam no controle
          e na análise da produtividade.
        </p>

        <div className="action-buttons">
          <Link to="/download" className="btn btn-primary">
            <DownloadIcon size={18} /> Baixar Agente
          </Link>
          <Link to="/saiba-mais" className="btn btn-secondary">
            <Info size={18} /> Saiba mais
          </Link>
        </div>
      </section>

      <section className="hero-carousel">
        <div className="carousel-frame border-glow">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              className={`slide ${activeSlide === index ? 'active' : ''}`}
            >
              <img src={slide.src} alt={slide.title} />
              <div className="slide-overlay" />
            </div>
          ))}
          <div className="carousel-badge">
            <Shield size={16} /> {slides[activeSlide].title}
          </div>
          <div className="carousel-indicators">
            {slides.map((slide, index) => (
              <button
                key={slide.title}
                className={`indicator ${activeSlide === index ? 'active' : ''}`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Exibir ${slide.title}`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};