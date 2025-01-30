from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np

app = Flask(__name__)

# Load TensorFlow models globally to avoid reloading them on every request
MODEL_PATHS = {
    "iris_model": "iris_model.keras"
}

loaded_models = {
    name: tf.keras.models.load_model(path) for name, path in MODEL_PATHS.items()
}

def predict_model(model_name, features):
    # Check if the specified model exists
    if model_name not in loaded_models:
        return {"error": f"Model '{model_name}' not found."}

    try:
        # Convert the features to a proper numpy format
        features_array = np.array(features).reshape(1, -1)  # Ensure 2D shape

        # Make a prediction
        prediction = loaded_models[model_name].predict(features_array)

        # Process the prediction result (e.g., use argmax if it's classification)
        result = prediction[0].tolist()  # Convert to list for JSON serialization

        return {"prediction": result}
    except Exception as e:
        return {"error": str(e)}

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    # Validate the incoming data
    if not data:
        return jsonify({"error": "No input data provided."}), 400

    model_name = data.get('model_name')
    features = data.get('features')

    if not model_name or not features:
        return jsonify({"error": "'model_name' and 'features' are required."}), 400

    # Get the model response
    response = predict_model(model_name, features)

    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)