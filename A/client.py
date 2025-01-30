import requests
import numpy as np

BASED_URL = {
    "clement" : "http://localhost:5000",
    "raph" : "http://localhost:5000",
    "diane" : "http://localhost:5000",
}

model_weights = {model:1 for model in BASED_URL}
predictions = []

def consensus_prediction(data):
    global predictions
    predictions = []

    # Get the prediction
    for model_name, url in BASED_URL.items():
        response = requests.post(url + "/predict", json=data)
        if response.status_code == 200:
            predictions.append((model_name, response.json().get("prediction")))

    if not predictions:
        return None

    # Calculate the weighted consensus
    consensus = np.zeros(len(predictions[0][1]))
    for model_name, prediction in predictions:
        consensus += np.array(prediction) * model_weights[model_name]

    update_weight(np.argmax(consensus))
    return np.argmax(consensus)


def update_weight(real_prediction, alpha=0.1):
    global model_weights

    for model_name, prediction in predictions:
        predicted_class = np.argmax(prediction)

        if predicted_class == real_prediction:
            model_weights[model_name] *= (1 + alpha)
        else:
            model_weights[model_name] *= (1 - alpha)

    total_weight = sum(model_weights.values())
    if total_weight > 0:
        model_weights = {model: weight / total_weight for model, weight in model_weights.items()}


if __name__ == '__main__':
    data = {
        "model_name": "iris_model",
        "features": [5.1, 3.5, 1.4, 0.2]  
    }

    predicted_class = consensus_prediction(data)
    print(f"Prediction of the consensus : {predicted_class}")
    print(f"New weights : {model_weights}")