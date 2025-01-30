import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Input
from tensorflow.keras.utils import to_categorical
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import numpy as np

# Download the Iris dataset
data = load_iris()
X = data.data
y = data.target

# Normalize the input data
scaler = StandardScaler()
X = scaler.fit_transform(X)

# Convert the labels to one-hot encoded
y = to_categorical(y, num_classes=3)

# Split into train and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create little neural network
model = Sequential([
    Dense(64, input_shape=(X.shape[1],), activation='relu'),
    Dense(32, activation='relu'),
    Dense(3, activation='softmax') 
])

# Compile the model
model.compile(optimizer='adam',
              loss='categorical_crossentropy',
              metrics=['accuracy'])

# Train the model
model.fit(X_train, y_train, epochs=50, batch_size=8, validation_split=0.1, verbose=1)

# Evaluate the model
loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Loss: {loss:.4f}")
print(f"Test Accuracy: {accuracy:.4f}")

# Save the model
model.save("iris_model.keras")