import pickle
from ultralytics import YOLO

def load_models():
    try:
        # YOLOv8 - Image Filter
        nudityDetection = YOLO("python/models/ImageFilter/NudityDetection/nudity_detection.pt")

        return {
            "ImageFilter": {
                "NudityDetection": {
                    "model": nudityDetection
                }
            }
        }

    except FileNotFoundError as e:
        print(f"File not found: {e.filename}")
    except pickle.UnpicklingError as e:
        print(f"Error unpickling file: {e}")
    except KeyError as e:
        print(f"Missing key in hyperparameters: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

    return None
