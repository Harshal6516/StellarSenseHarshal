import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const App = () => {
  const [formData, setFormData] = useState({
    param1: "",
    param2: "",
    param3: "",
    param4: "",
    param5: "",
    param6: "",
    param7: "",
    param8: "",
    param9: "",
    param10: ""
  });

  const paramLabels = {
    param1: "U_Filter",
    param2: "G_Filter",
    param3: "R_Filter",
    param4: "I_Filter",
    param5: "Z_Filter",
    param6: "GR_Color",
    param7: "RI_Color",
    param8: "UG_Color",
    param9: "PetroR50_R",
    param10: "PetroR90_R"
  };

  const [particles, setParticles] = useState(createParticles());
  const [markdown, setMarkdown] = useState("");
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const value = e.target.value.replace(/[^0-9.-]/g, '');
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const submitFormData = new FormData();
      
      // Append parameters in correct order
      Object.keys(formData).forEach(key => {
        submitFormData.append(key, formData[key]);
      });

      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        submitFormData.append("image", blob, "image.jpg");
      }

      const response = await fetch("http://127.0.0.1:5000/predict-galaxy", {
        method: "POST",
        body: submitFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setMarkdown(data.markdown);
    } catch (error) {
      setError(error.message);
      console.error("Error processing request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  };

  return (
    <div className="abc">
      <h1>
        <span id="stellar">STELLAR</span>SENSE
      </h1>

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

      {image && (
        <div className="uploaded-image-container">
          <img src={image} alt="Uploaded preview" className="uploaded-image" />
        </div>
      )}

      <div className="content-container">
        <h2>Galaxy Analysis</h2>
        <form onSubmit={handleSubmit}>
          <div className="inputs-grid">
            {Object.keys(formData).map((key) => (
              <div key={key} className="input-field">
                <label htmlFor={key}>{paramLabels[key]}</label>
                <input
                  id={key}
                  name={key}
                  type="number"
                  step="any"
                  value={formData[key]}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />
              </div>
            ))}
          </div>
          <div className="upload-container">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="upload-button"
              required 
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Analyze Galaxy"}
          </button>
        </form>

        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        {markdown && (
          <div className="markdown-container">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;