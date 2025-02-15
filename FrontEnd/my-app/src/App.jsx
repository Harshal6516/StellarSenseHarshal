import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const App = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    regno: "",
    phone_no: "",
  });

  const [markdown, setMarkdown] = useState("");
  const [particles, setParticles] = useState(createParticles());

  function createParticles() {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 0.05 + 0.1,
      opacity: Math.random() * 0.3 + 0.5,
    }));
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prevParticles) =>
        prevParticles.map((particle) => ({
          ...particle,
          y: particle.y - particle.speed,
          ...(particle.y < 0 ? { y: 100, x: Math.random() * 100 } : {}),
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:5000/generate-markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      console.log("Markdown file generated:", data.file_path);
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
    <div>
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

      <div className="content-container">
        <h1>User Details Form</h1>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="grid-container">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Name"
              required
            />
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter Age"
              required
            />
            <input
              type="text"
              name="regno"
              value={formData.regno}
              onChange={handleChange}
              placeholder="Enter Reg No"
              required
            />
            <input
              type="text"
              name="phone_no"
              value={formData.phone_no}
              onChange={handleChange}
              placeholder="Enter Phone No"
              required
            />
          </div>
          <button type="submit">Generate Markdown</button>
        </form>

        {markdown && (
          <div className="markdown-container">
            <h2>Generated Markdown</h2>
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;