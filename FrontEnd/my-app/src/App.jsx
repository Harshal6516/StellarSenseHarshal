import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css"; // Ensure the CSS file has the particle styles

const App = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    regno: "",
    phone_no: "",
  });

  const [markdown, setMarkdown] = useState("");
  const [particles, setParticles] = useState([]);

  const createParticles = () => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.1 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  };

  const animateParticles = () => {
    setParticles((prevParticles) =>
      prevParticles.map((particle) => ({
        ...particle,
        y: particle.y - particle.speed,
        ...(particle.y < 0 ? { y: 100, x: Math.random() * 100 } : {}),
      }))
    );
  };

  useEffect(() => {
    setParticles(createParticles());
    const interval = setInterval(animateParticles, 50);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/generate-markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      await response.json();
      fetchMarkdown();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchMarkdown = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get-markdown");
      const data = await response.json();
      setMarkdown(data.markdown);
    } catch (error) {
      console.error("Error fetching markdown:", error);
    }
  };

  return (
    <div className="app-container">
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

      <h1>🚀 Space Explorer Grid 🌌</h1>
      <div className="grid-container">
        <table>
          <tbody>
            {[...Array(4)].map((_, row) => (
              <tr key={row}>
                {[...Array(4)].map((_, col) => (
                  <td key={col}>
                    <input
                      type="text"
                      name={Object.keys(formData)[row * 4 + col] || ""}
                      placeholder={
                        Object.keys(formData)[row * 4 + col] || "Input"
                      }
                      onChange={handleChange}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleSubmit}>Generate Markdown</button>
      <div className="markdown-container">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default App;
