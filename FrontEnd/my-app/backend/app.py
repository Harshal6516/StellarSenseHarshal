from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from React

def generate_markdown(name, age, regno, phone_no):
    content = f"""# User Details

#Name: {name}
#Age: {age}
#Reg No: {regno}
#Phone No: {phone_no}
"""
    
    with open("user_details.md", "w") as file:
        file.write(content)
    
    return "user_details.md"

# API to process form data and generate markdown
@app.route('/generate-markdown', methods=['POST'])
def generate():
    try:
        data = request.json
        name = data.get('name')
        age = data.get('age')
        regno = data.get('regno')
        phone_no = data.get('phone_no')

        # Generate the markdown file
        markdown_file = generate_markdown(name, age, regno, phone_no)

        return jsonify({"file_path": markdown_file})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# API to fetch markdown content
@app.route('/get-markdown', methods=['GET'])
def get_markdown():
    try:
        with open("user_details.md", "r") as file:
            content = file.read()
        return jsonify({"markdown": content})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
