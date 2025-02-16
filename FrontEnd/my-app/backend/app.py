from flask import Flask, request, jsonify
import os
import cv2
from flask_cors import CORS
from predictor import predict_galaxy

app = Flask(__name__)
CORS(app)

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "pypacks")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/predict-galaxy", methods=["POST"])
def process_galaxy_prediction():
    try:
        # Get numerical parameters in correct order
        params = [
            float(request.form.get('param1', 0)),  # corresponds to 1.2
            float(request.form.get('param2', 0)),  # corresponds to 2.3
            float(request.form.get('param3', 0)),  # corresponds to 3.4
            float(request.form.get('param4', 0)),  # corresponds to 4.5
            float(request.form.get('param5', 0)),  # corresponds to 5.6
            float(request.form.get('param6', 0)),  # corresponds to 1.1
            float(request.form.get('param7', 0)),  # corresponds to 0.9
            float(request.form.get('param8', 0)),  # corresponds to 0.8
            float(request.form.get('param9', 0)),  # corresponds to 2.5
            float(request.form.get('param10', 0))  # corresponds to 5.0
        ]
        
        # Save image as image.jpg
        if "image" in request.files:
            image = request.files["image"]
            image_path = os.path.join(UPLOAD_FOLDER, "image.jpg")
            image.save(image_path)
            predict_galaxy(*params)
            
            result_path = os.path.join(BASE_DIR, "results.md")
            if not os.path.exists(result_path):
                return jsonify({"error": "Prediction result not generated"}), 500
                
            with open(result_path, 'r') as f:
                markdown_content = f.read()
                
            return jsonify({
                "message": "Prediction completed successfully",
                "markdown": markdown_content
            })
        else:
            return jsonify({"error": "No image uploaded"}), 400

    except ValueError as e:
        return jsonify({"error": f"Invalid numerical value: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Request processing failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)