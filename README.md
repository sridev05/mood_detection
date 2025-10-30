# 🎭 Mood Detection

A **web-based AI application** that detects human emotions from facial expressions using a **deep learning ONNX model** with a **FastAPI backend** and a **responsive frontend** built using HTML, CSS, and JavaScript.

Users can upload or capture an image, and the app predicts the mood or emotion such as **happy**, **sad**, **angry**, **surprised**, or **neutral**.

---

## 🚀 Features
- Detects emotions from facial images in real-time  
- Supports both image upload and camera capture  
- Lightweight and fast inference using **ONNX Runtime**  
- Deployed easily on **Hugging Face Spaces**  
- Clean, interactive, and responsive user interface  

---

## 🧠 Tech Stack
**Frontend:** HTML5, CSS3, JavaScript  
**Backend:** Python 3, FastAPI, Uvicorn  
**AI / ML:** ONNX Model, ONNX Runtime, NumPy, Pillow  

---

## ⚙️ How It Works
1. The user uploads or captures a face image.  
2. The image is preprocessed using Pillow and NumPy.  
3. The ONNX model (`mood_model.onnx`) performs inference to predict the emotion.  
4. The detected mood is displayed instantly on the frontend.  

---

## 🌐 Deployment
This project is deployed using **Hugging Face Spaces**.  
It uses **FastAPI** as the backend service and serves the frontend from the `static/` directory.

