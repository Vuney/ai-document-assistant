# backend/app.py
import io
import random

from flask import Flask, request, jsonify
from flask_cors import CORS

import nltk
from nltk.corpus import wordnet
from nltk.tokenize import word_tokenize

import PyPDF2
import docx

from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

# =========================
# NLTK SAFE INIT (ONCE)
# =========================
def init_nltk():
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt")

    try:
        nltk.data.find("corpora/wordnet")
    except LookupError:
        nltk.download("wordnet")

init_nltk()

# =========================
# APP INIT
# =========================
app = Flask(__name__)
CORS(app)

# =========================
# Health Check
# =========================
@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "message": "AI Document Assistant Backend Running"
    })

# =========================
# Extract text from file
# =========================
def extract_text(file):
    filename = file.filename.lower()
    text = ""

    if filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        for page in reader.pages:
            if page.extract_text():
                text += page.extract_text()

    elif filename.endswith(".docx"):
        document = docx.Document(io.BytesIO(file.read()))
        for p in document.paragraphs:
            text += p.text + "\n"

    else:
        raise ValueError("File harus PDF atau DOCX")

    if not text.strip():
        raise ValueError("Teks kosong")

    return text

# =========================
# Summarizer (SUMY LSA)
# =========================
def summarize_text(text, sentences=5):
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    stemmer = Stemmer("english")
    summarizer = LsaSummarizer(stemmer)
    summarizer.stop_words = get_stop_words("english")

    summary = summarizer(parser.document, sentences)
    return " ".join(str(s) for s in summary)

# =========================
# Paraphraser (WordNet)
# =========================
def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ")
            if name.lower() != word.lower():
                synonyms.add(name)
    return list(synonyms)

def paraphrase_text(text, replace_prob=0.3):
    words = word_tokenize(text)
    new_words = []

    for word in words:
        if word.isalpha() and random.random() < replace_prob:
            synonyms = get_synonyms(word)
            new_words.append(random.choice(synonyms) if synonyms else word)
        else:
            new_words.append(word)

    return " ".join(new_words)

# =========================
# API: Summarize
# =========================
@app.route("/api/summarize", methods=["POST"])
def summarize():
    try:
        sentences = int(request.form.get("sentences", 5))

        if "text" in request.form and request.form["text"].strip():
            text = request.form["text"]

        elif "file" in request.files:
            text = extract_text(request.files["file"])

        else:
            return jsonify({"error": "Tidak ada teks atau file"}), 400

        if len(text.split()) > 3000:
            return jsonify({"error": "Teks terlalu panjang (maks 3000 kata)"}), 400

        summary = summarize_text(text, sentences)
        return jsonify({"summary": summary})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# API: Paraphrase
# =========================
@app.route("/api/paraphrase", methods=["POST"])
def paraphrase():
    try:
        if "text" in request.form and request.form["text"].strip():
            text = request.form["text"]

        elif "file" in request.files:
            text = extract_text(request.files["file"])

        else:
            return jsonify({"error": "Tidak ada teks atau file"}), 400

        if len(text.split()) > 3000:
            return jsonify({"error": "Teks terlalu panjang (maks 3000 kata)"}), 400

        result = paraphrase_text(text)
        return jsonify({"paraphrase": result})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =========================
# Run (LOCAL ONLY)
# =========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
