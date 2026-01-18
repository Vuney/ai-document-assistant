from flask import Flask, request, jsonify
from flask_cors import CORS
import nltk

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

app = Flask(__name__)
CORS(app)

# =============================
# Lazy-loaded models (GLOBAL)
# =============================
tokenizer = None
model = None

MODEL_NAME = "google/pegasus-xsum"  # ringan & stabil

def load_model():
    global tokenizer, model
    if tokenizer is None or model is None:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

# =============================
# Health Check
# =============================
@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "Backend running"
    })

# =============================
# Summarize Text
# =============================
@app.route("/summarize", methods=["POST"])
def summarize():
    try:
        data = request.get_json()
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "Text is empty"}), 400

        load_model()

        inputs = tokenizer(
            text,
            truncation=True,
            padding="longest",
            return_tensors="pt"
        )

        with torch.no_grad():
            summary_ids = model.generate(
                inputs["input_ids"],
                max_length=120,
                min_length=40,
                num_beams=4,
                length_penalty=2.0,
                early_stopping=True
            )

        summary = tokenizer.decode(
            summary_ids[0],
            skip_special_tokens=True
        )

        return jsonify({"summary": summary})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
