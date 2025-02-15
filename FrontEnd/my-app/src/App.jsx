
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css"; // Import the CSS file

const App = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    regno: "",
    phone_no: "",
  });

  const [markdown, setMarkdown] = useState("");

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Send data to Flask API
      const response = await fetch("http://127.0.0.1:5000/generate-markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Markdown file generated:", data.file_path);

      // Fetch the generated Markdown content
      fetchMarkdown();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Fetch the markdown content from Flask
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
      <h1>User Details Form</h1>
      <form onSubmit={handleSubmit}>
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
        <button type="submit">Generate Markdown</button>
      </form>

      <h2>Generated Markdown</h2>
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default App;
