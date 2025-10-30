**🎭 Mood Detection**

This project is a web-based AI application that detects human emotions from facial expressions.
It uses a deep learning model (ONNX format) integrated with a FastAPI backend and a responsive HTML/JS frontend.

Users can upload or capture an image, and the system will analyze the face to predict the person’s mood or emotion such as happy, sad, angry, surprised, neutral, etc.

**🚀 Features**

Detects emotions from facial images in real-time

Supports both camera capture and image upload

Lightweight and fast using ONNX Runtime

Deployed easily on Hugging Face Spaces

Interactive and responsive frontend design

**🧠 Tech Stack**

Frontend: HTML5, CSS3, JavaScript
Backend: Python 3, FastAPI, Uvicorn
AI / ML: ONNX Model, ONNX Runtime, NumPy, Pillow

**⚙️ How It Works
**
User uploads or captures an image.

The image is preprocessed using Pillow and NumPy.

The ONNX model runs inference to classify the emotion.

The result (e.g., happy, sad, angry) is displayed instantly.

🌐 Deployment

Deployed using Hugging Face Spaces with a FastAPI backend and static frontend.

