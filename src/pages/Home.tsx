import React, { useEffect, useState } from 'react';
import '../styles/Home.css';
import Logo from '../assets/Vector.png';
import WelcomeImage from '../assets/Mask group.png'; // ← add your uploaded image here

export const Home: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setShowWelcome(true), 500); // small delay before transition
          return 100;
        }
        return prev + 2;
      });
    }, 60);
    return () => clearInterval(timer);
  }, []);

  if (showWelcome) {
    return (
      <div className="welcome-container">
        <button className="back-btn">
          <span className="arrow"></span>
        </button>

        <div className="welcome-image-section">
          <img src={WelcomeImage} alt="Yoga Pose" className="welcome-hero" />
        </div>

        <div className="welcome-content">
          <h2 className="welcome-heading">Welcome to Nirvaana Yoga</h2>
          <p className="welcome-subtext">
            Set your goals for a personalized experience—or skip and start your free yoga journey.
            Relax, focus, and grow daily.
          </p>

          <div className="welcome-actions">
            <button className="btn-primary" onClick={() => window.history.pushState(null, '', '/personalised-details')}>Personalised</button>
            <button className="btn-outline" onClick={() => window.history.pushState(null, '', '/free-content')}>Free Content</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-logo-overlay">
        <img src={Logo} alt="Nirvaana Yoga Logo" className="home-logo" />
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};
