from flask import Flask, request, jsonify
import os
import cv2  # Example: Using OpenCV for processing
import torch  # Example: Using PyTorch for an ML model
from flask_cors import CORS  # Import CORS

app = Flask(__name__)  # Only one instance
CORS(app)  # Enable CORS for all routes

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Create an "img" folder inside the same directory as this Python file
UPLOAD_FOLDER = os.path.join(BASE_DIR, "img")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Ensure the folder exists

@app.route("/upload-image", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    image = request.files["image"]
    image_path = os.path.join(UPLOAD_FOLDER, image.filename)
    image.save(image_path)  # Save image in "img" folder

    # Pass image to the model
    result = process_image(image_path)

    return jsonify({"message": "Image uploaded successfully", "image_path": image_path, "model_result": result})

def process_image(image_path):
    """ Example: Load image & pass it to a deep learning model """
    img = cv2.imread(image_path)  # Load image
    # Example: Convert image to tensor for a PyTorch model
    tensor_img = torch.tensor(img).float().unsqueeze(0)  # Modify as per your model
    # Example: Fake model output (Replace with actual model prediction)
    model_output = {"prediction": "Galaxy Detected", "confidence": 0.95}
    return model_output

# ✅ New endpoint to generate Markdown from form data
@app.route("/generate-markdown", methods=["POST"])
def generate_markdown():
    try:
        data = request.json  # Get JSON data from React frontend
        if not data:
            return jsonify({"error": "No data received"}), 400
        
        print("Received Data:", data)  # Debugging Log in Flask Console

        # Convert form data to Markdown format
        markdown_content = "## Generated Markdown\n\n"
        for key, value in data.items():
            markdown_content += f"#: {value}\n\n"

        print("Generated Markdown:", markdown_content)  # Debugging Log in Flask Console
        return jsonify({"markdown": markdown_content})  # Return Markdown content

    except Exception as e:
        print("Error in /generate-markdown:", str(e))  # Debugging Log in Flask Console
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
