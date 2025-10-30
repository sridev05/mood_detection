from PIL import Image
from typing import Tuple
import numpy as np

def preprocess_image(image: Image.Image, target_size: Tuple[int, int]) -> np.ndarray:
    image = image.resize(target_size, Image.Resampling.LANCZOS)
    array = np.array(image).astype(np.float32) / 255.0

    if array.ndim == 2:
        array = np.expand_dims(array, axis=-1)

    if array.shape[-1] == 1:
        array = np.repeat(array, 3, axis=-1)

    array = np.transpose(array, (2, 0, 1))  # HWC → CHW
    return array
