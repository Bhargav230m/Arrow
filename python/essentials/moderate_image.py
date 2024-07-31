from ultralytics import YOLO
import requests
import uuid
import json
import os

def download_image(url, save_path):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
        else:
            print(f"Failed to download image. Status code: {response.status_code}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

def predictNudityProb(model, path):
    conf = []
    predictions = model.predict(source=path, verbose=False)

    for prediction in predictions:
        results = json.loads(prediction.tojson())
        if results:
            for result in results:
                conf.append(result.get("confidence", 0))
            average_confidence = sum(conf) / len(conf) if conf else 0
            return average_confidence
        else:
            return 0

def moderate_image(link: str, model: YOLO) -> object:
    """
    PARAMETERS:
    link - Image Link
    model - The loaded model

    RETURNS:
    obj - An object containing the class probabilities
    """

    try:
        path = f"python/cache/{str(uuid.uuid4())}.jpg"
        download_image(link, path)

        nudityPrediction = predictNudityProb(model, path)

        results = { "offensive": 0, "nudity": 0 }
        results["nudity"] = nudityPrediction

    except Exception as e:
        print(f"An Error Occurred: {e}")

    finally:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Failed to remove temporary file {path}: {e}")

    return results