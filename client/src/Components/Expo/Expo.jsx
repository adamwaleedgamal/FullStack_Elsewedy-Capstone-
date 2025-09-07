import React from 'react';
import './Expo.css';

const Expo = () => {
  const expoInfo = {
    title: "Annual Capstone Project Expo",
    status: "coming-soon",
    daysUntil: 45,
  };

  return (
    <div className="expo">
      <div className="coming-soon-wrapper">
        <h1 className="expo-title">{expoInfo.title}</h1>
        {expoInfo.status === 'coming-soon' && (
          <div className="coming-soon-line">
            <div className="hourglass red"></div>
            <h2 className="coming-soon-text">
              Coming Soon – {expoInfo.daysUntil} days until the event
            </h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expo;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead
