import requests
import numpy as np
import json

BASED_URL = {
    "clement" : "https://7965-89-30-29-68.ngrok-free.app",
    "raph" : "https://0a3d-89-30-29-68.ngrok-free.app",
    "diane" : "https://4471-89-30-29-68.ngrok-free.app",
}

model_weights = {model:1 for model in BASED_URL}
predictions = []
DB_FILE = "database.json"
BASE_BALANCE = 1000

def load_balances():
    try:
        with open(DB_FILE, "r") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {model: BASE_BALANCE for model in BASED_URL} 

def save_balances(balances):
    with open(DB_FILE, "w") as file:
        json.dump(balances, file, indent=4)

balances = load_balances()

def consensus_prediction(data):
    global predictions, balances
    predictions = []

    # Get the prediction
    for model_name, url in BASED_URL.items():
        response = requests.post(url + "/predict", json=data)
        if response.status_code == 200 and balances[model_name]>0:
            predictions.append((model_name, response.json().get("prediction")))

    if not predictions:
        return None

    # Calculate the weighted consensus
    consensus = np.zeros(len(predictions[0][1]))
    for model_name, prediction in predictions:
        consensus += np.array(prediction) * model_weights[model_name]

    return np.argmax(consensus)


def update(real_prediction, alpha=0.1, penalty=50, reward=10):
    global model_weights, balances

    for model_name, prediction in predictions:
        predicted_class = np.argmax(prediction)

        if predicted_class == real_prediction:
            model_weights[model_name] *= (1 + alpha)
            balances[model_name] += reward
        else:
            model_weights[model_name] *= (1 - alpha)
            balances[model_name] -= penalty
            if balances[model_name] <= 0:
                print(f"{model_name} is excluded of the network because it doesn't have sufficient fund.")


    total_weight = sum(model_weights.values())
    if total_weight > 0:
        model_weights = {model: weight / total_weight for model, weight in model_weights.items()}
    
    save_balances(balances)


if __name__ == '__main__':
    data = {
        "model_name": "iris_model",
        "features": [5.1, 3.5, 1.4, 0.2]  
    }

    predicted_class = consensus_prediction(data)
    if predicted_class is not None:
        update(predicted_class)
    print(f"Prediction of the consensus : {predicted_class}")
    print(f"New weights : {model_weights}")
    print(f"New balance : {balances}")