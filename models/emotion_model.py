import onnxruntime as ort
import numpy as np
import os
from typing import List, Dict, Optional

class GenericONNXModel:
    def __init__(self, model_path: str = "models/model.onnx", labels: Optional[List[str]] = None):
        self.model_path = model_path
        self.session = None
        self.input_shape = None
        self.input_name = None
        self.labels = labels
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at {self.model_path}")

        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        self.session = ort.InferenceSession(self.model_path, providers=providers)

        input_info = self.session.get_inputs()[0]
        self.input_name = input_info.name
        self.input_shape = input_info.shape

        print(f"[INFO] Loaded ONNX model: {self.model_path}")
        print(f"[INFO] Input name: {self.input_name}")
        print(f"[INFO] Input shape: {self.input_shape}")

    def predict(self, image: np.ndarray) -> List[Dict]:
        if self.session is None:
            raise RuntimeError("ONNX session not initialized")

        if len(image.shape) == 3:
            image = np.expand_dims(image, axis=0)
        image = image.astype(np.float32)

        outputs = self.session.run(None, {self.input_name: image})
        predictions = outputs[0].squeeze()

        # Auto softmax if multiple values
        if len(predictions.shape) > 0 and predictions.shape[0] > 1:
            predictions = self._softmax(predictions)

        results = []
        for i, score in enumerate(predictions):
            label = self.labels[i] if self.labels and i < len(self.labels) else f"Class_{i}"
            results.append({
                "label": label,
                "confidence": float(score),
                "percentage": f"{score * 100:.2f}%"
            })

        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results

    def _softmax(self, x):
        e_x = np.exp(x - np.max(x))
        return e_x / e_x.sum()

    def get_model_info(self):
        return {
            "input_shape": self.input_shape,
            "labels": self.labels
        }
