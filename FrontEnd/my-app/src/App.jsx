import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const App = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    regno: "",
    phone_no: "",
    gag: "",
    abc: "",
    def: "",
    ghi:"",
    jkl:"",
    adn:"",
    ajdfn:"",
    ansdjn:"",
    klko:"",
    kmksdm:"",
    dmfk:"",
    kmdkm:"",
    
  });

  const [markdown, setMarkdown] = useState("");
  const [image, setImage] = useState(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  };
  
  return (
    
    <div class="abc">
      <h1><span id='stellar'>STELLAR</span>SENSE</h1>
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
        <h2>User Details Form</h2>
        <div className="form-image-container">
          <form onSubmit={handleSubmit} className="form-container">
            <div className="grid-container">
              <div className="inputs-grid">
                {Object.keys(formData).map((key) => (
                  <div className="input-field" key={key}>
                    <label htmlFor={key}>{key.toUpperCase()}</label>
                    <input
                      type={key === "age" ? "number" : "text"}
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
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} className="upload-button" />
            
          </form>

          {image && (
            <div className="image-container">
              <h2>Uploaded Image</h2>
              <img src={image} alt="Uploaded preview" className="uploaded-image" />
            </div>
          )}
        </div>
        <button type="submit">Generate Markdown</button>

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
