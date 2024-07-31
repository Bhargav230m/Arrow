from flask import Flask, jsonify, request
import logging
from essentials.load_models import load_models
from essentials.moderate_image import moderate_image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Logger")

logger.info("Loading models")
try:
    models = load_models()
    logger.info("Successfully loaded the models")
except Exception as e:
    logger.error(f"Failed to load models: {e}")
    raise

app = Flask("ArrowAutomod")
    
# Route to moderate image
@app.route('/image_moderation', methods=['POST'])
def image_moderation():
    """
    This endpoint is used to classify image.
    
    PARAMETERS:
    link - The image link

    RETURNS:
    obj - The object containing the probabilities
    """

    try:
        data = request.get_json()

        if 'link' not in data:
            return jsonify({'error': 'No image link provided'}), 400
        
        results = moderate_image(data["link"], models["ImageFilter"]["NudityDetection"]["model"])

        return jsonify(results)

    except Exception as e:
        logger.error(f"Error in image moderation: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='localhost', port=3000)
