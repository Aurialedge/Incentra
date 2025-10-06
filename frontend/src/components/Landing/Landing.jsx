import React, { useEffect, useState, useRef } from 'react';
import './landing.css'
// CSS Styles
import Login from '../Login/Login'
import logo from '../../../public/logo.png';
import { useNavigate } from 'react-router-dom';
// Animated Background Component
const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="background">
      <div
        className="gradient-circle-1"
        style={{
          transform: `translate(calc(-50% + ${mousePosition.x}px), calc(-50% + ${mousePosition.y}px))`
        }}
      />
      <div
        className="gradient-circle-2"
        style={{
          transform: `translate(calc(-50% + ${-mousePosition.x}px), calc(-50% + ${-mousePosition.y}px))`
        }}
      />
    </div>
  );
};

// Navbar Component
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };


const navigate = useNavigate();
  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="logo">
          <img src={logo} alt="" />
        </div>
        <div className="nav-links">
          <button className="nav-link">Home</button>
          <button className="nav-link" onClick={() => scrollToSection('features')}>Features</button>
          <button className="nav-link">About</button>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Login / Signup</button>
        </div>
      </div>
    </nav>
  );
};

// Hero Component
const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="gradient-text">Grab</span> Your Financial Future
            </h1>
            <p className="hero-subtitle">
              Take control of your finances with our powerful, AI-driven platform.
              Get real-time insights and make smarter financial decisions.
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary">
                Get Started Free
                <span className="btn-arrow">→</span>
              </button>
              <button className="btn btn-secondary" onClick={scrollToFeatures}>
                Learn More
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">74%+</div>
                <div className="stat-label">market share</div>
              </div>
              <div className="stat">
                <div className="stat-number">23%</div>
                <div className="stat-label">Year on year Growth</div>
              </div>
              <div className="stat">
                <div className="stat-number">42M+</div>
                <div className="stat-label">Monthly transaction</div>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card">
              <div className="card-content">
                <div className="card-icon">📈</div>
                <h4>Track Your Progress</h4>
                <p>Monitor your financial growth in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={`feature-card ${isVisible ? 'visible' : ''}`}
    >
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
};

// Features Component
const Features = () => {
  const features = [
    {
      icon: '🔒',
      title: 'Bank-Grade Security',
      description: 'Your data is encrypted with military-grade security protocols.'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Experience real-time updates and instant insights.'
    },
    {
      icon: '🤖',
      title: 'AI-Powered',
      description: 'Get personalized financial advice powered by advanced AI.'
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Detailed reports and analytics to track your progress.'
    },
    {
      icon: '🌐',
      title: 'Cross-Platform',
      description: 'Access your data anywhere, anytime, on any device.'
    },
    {
      icon: '🎯',
      title: 'Goal Tracking',
      description: 'Set and achieve your financial goals with ease.'
    }
  ];

  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-subtitle">Features</span>
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <p className="section-description">
            Powerful features designed to help you take control of your financial future.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <span className="gradient-text">Grab</span>
            </div>
            <p className="footer-description">
              Empowering your financial journey with cutting-edge technology.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Twitter">
                🐦
              </a>
              <a href="#" className="social-link" aria-label="Facebook">
                📘
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                💼
              </a>
              <a href="#" className="social-link" aria-label="GitHub">
                🐙
              </a>
            </div>
          </div>
          <div>
            <h3 className="footer-links-title">Product</h3>
            <a href="#" className="footer-link">Features</a>
            <a href="#" className="footer-link">Pricing</a>
            <a href="#" className="footer-link">Updates</a>
            <a href="#" className="footer-link">Roadmap</a>
          </div>
          <div>
            <h3 className="footer-links-title">Company</h3>
            <a href="#" className="footer-link">About Us</a>
            <a href="#" className="footer-link">Careers</a>
            <a href="#" className="footer-link">Blog</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
          <div className="footer-newsletter">
            <h3 className="footer-links-title">Stay Updated</h3>
            <p>Subscribe to our newsletter for the latest updates.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
                required
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Grab. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#" className="footer-legal-link">Privacy Policy</a>
            <a href="#" className="footer-legal-link">Terms of Service</a>
            <a href="#" className="footer-legal-link">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Landing = () => {
  return (
    <div className="app">
      <AnimatedBackground />
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}

export default Landing;