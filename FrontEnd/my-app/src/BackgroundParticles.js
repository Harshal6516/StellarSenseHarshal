import React, { useEffect, useState } from "react";
import "./BackgroundParticles.css"; // Import styles for particles

const BackgroundParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const createParticles = () => {
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.1 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
      }));
      setParticles(newParticles);
    };

    const animateParticles = () => {
      setParticles((prevParticles) =>
        prevParticles.map((particle) => ({
          ...particle,
          y: particle.y - particle.speed,
          ...(particle.y < 0
            ? { y: 100, x: Math.random() * 100 }
            : {}),
        }))
      );
    };

    createParticles();
    const intervalId = setInterval(animateParticles, 50);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="particles-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundParticles;
