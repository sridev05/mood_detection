from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
import base64, io, os

from models.emotion_model import GenericONNXModel
from utils.image_processing import preprocess_image

app = FastAPI(title="Generic ONNX Model API", version="1.0.0")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

app.mount("/static", StaticFiles(directory="static"), name="static")

try:
    model_labels = ["angry", "disgust", "fearful", "happy", "neutral", "sad", "surprised"]
    model = GenericONNXModel(model_path="models/mood_model.onnx", labels=model_labels)
except Exception as e:
    print(f"[ERROR] Failed to load model: {e}")
    model = None

@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")

@app.post("/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_data = await file.read()
    image = Image.open(io.BytesIO(image_data)).convert("RGB")

    input_shape = model.input_shape[-2:]
    input_array = preprocess_image(image, input_shape)

    results = model.predict(input_array)
    return JSONResponse(content={"success": True, "results": results})

@app.post("/detect-emotion-base64")
async def detect_emotion_base64(data: dict):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")

    if "image" not in data:
        raise HTTPException(status_code=400, detail="No image provided")

    image_data = base64.b64decode(data["image"].split(",")[1])
    image = Image.open(io.BytesIO(image_data)).convert("RGB")

    input_shape = model.input_shape[-2:]
    input_array = preprocess_image(image, input_shape)

    results = model.predict(input_array)
    return JSONResponse(content={"success": True, "results": results})

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.get("/model-info")
async def model_info():
    if model is None:
        return {"model_loaded": False}
    info = model.get_model_info()
    return {
        "model_loaded": True,
        "input_shape": info["input_shape"],
        "labels": info["labels"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
