import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const App = () => {
  const [formData, setFormData] = useState({
    U_Filter: "",
    G_Filter: "",
    R_Filter: "",
    I_Filter: "",
    Z_Filter: "",
    GR_Color: "",
    RI_color: "",
    UG_Color: "",
    PetroR50_R: "",
    PetroR90_R: "",

  });

  const [particles, setParticles] = useState(createParticles());
  const [markdown, setMarkdown] = useState("");
  const [image, setImage] = useState(null);

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

  const handleGenerateMarkdown = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending data to backend:", formData); // Debugging log
  
      const response = await fetch("http://127.0.0.1:5000/generate-markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
      console.log("Received response:", data); // Debugging log
  
      if (response.ok) {
        setMarkdown(data.markdown);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Request Failed:", error);
    }
  };
  
  

  const fetchMarkdown = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/get-markdown");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setMarkdown(data.markdown);
    } catch (error) {
      console.error("Error fetching markdown:", error);
    }
  };
  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
  
      // Send image to backend
      const formData = new FormData();
      formData.append("image", file);
  
      try {
        const response = await fetch("http://127.0.0.1:5000/upload-image", {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log("Model Output:", data.model_result); // Debugging
        alert(`Prediction: ${data.model_result.prediction}, Confidence: ${data.model_result.confidence}`);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };
  

  return (
    <div className="abc">
      <h1>
        <span id="stellar">STELLAR</span>SENSE
      </h1>

      {/* Particles Background */}
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

      {/* Uploaded Image Positioned at Middle Right */}
      {image && (
        <div className="uploaded-image-container">
          <img src={image} alt="Uploaded preview" className="uploaded-image" />
        </div>
      )}

      <div className="content-container">
        <h2>User Details Form</h2>
        <form onSubmit={handleGenerateMarkdown}>
          <div className="inputs-grid">
            {Object.keys(formData).map((key) => (
              <div key={key} className="input-field">
                <label htmlFor={key}>{key.toUpperCase()}</label>
                <input
                  id={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  placeholder={`Enter ${key}`}
                  required
                />
              </div>
            ))}
          </div>
          <div className="upload-container">
            <input type="file" accept="image/*" onChange={handleImageChange} className="upload-button" />
          </div>

          <button type="submit">Generate Markdown</button>
        </form>

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
