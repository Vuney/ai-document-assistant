# backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import docx
import io
import time
import re

# Import library untuk Summarizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer as Summarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

# Import library untuk AI Paraphraser
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# =========================================================
# MEMUAT MODEL AI PARAFRASER (ENGLISH - PEGASUS)
# =========================================================
print("Memuat model AI Paraphraser (English - Pegasus)...")
EN_MODEL_NAME = 'tuner007/pegasus_paraphrase'

try:
    paraphrase_tokenizer_en = AutoTokenizer.from_pretrained(EN_MODEL_NAME)
    paraphrase_model_en = AutoModelForSeq2SeqLM.from_pretrained(EN_MODEL_NAME)
    print("Model English Paraphraser berhasil dimuat.")
except Exception as e:
    print(f"Gagal memuat model English. Error: {e}")
    paraphrase_tokenizer_en = None
    paraphrase_model_en = None

# =========================================================
# MEMUAT MODEL AI PARAFRASER (INDONESIA)
# =========================================================
print("Memuat model AI Paraphraser (Indonesia)...")
ID_MODEL_NAME = "cahya/t5-base-indonesian-paraphrase"

try:
    paraphrase_tokenizer_id = AutoTokenizer.from_pretrained(ID_MODEL_NAME)
    paraphrase_model_id = AutoModelForSeq2SeqLM.from_pretrained(ID_MODEL_NAME)
    print("Model Indonesia Paraphraser berhasil dimuat.")
except Exception as e:
    print(f"Gagal memuat model Indonesia. Error: {e}")
    paraphrase_tokenizer_id = None
    paraphrase_model_id = None

# =========================================================
# FLASK APP
# =========================================================
app = Flask(__name__)
CORS(app)

# =========================================================
# DETEKSI BAHASA SEDERHANA
# =========================================================
def detect_language(text: str) -> str:
    # Jika mengandung banyak karakter non-ascii → Indonesia
    non_ascii = sum(1 for c in text if ord(c) > 127)
    return "id" if non_ascii > 5 else "en"

# =========================================================
# FUNGSI EKSTRAKSI TEKS DARI FILE
# =========================================================
def extract_text_from_file(file):
    full_text = ""
    filename = file.filename

    if filename.endswith('.pdf'):
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                full_text += text

    elif filename.endswith('.docx'):
        document = docx.Document(io.BytesIO(file.read()))
        for para in document.paragraphs:
            full_text += para.text + "\n"

    else:
        raise ValueError("Tipe file tidak didukung. Harap unggah .pdf atau .docx")

    if not full_text.strip():
        raise ValueError("Tidak ada teks yang bisa dibaca dari file ini.")

    return full_text

# =========================================================
# FUNGSI SUMMARIZER (SUMY - LSA)
# =========================================================
def summarize_text(text, language="english", sentences_count=5):
    parser = PlaintextParser.from_string(text, Tokenizer(language))
    stemmer = Stemmer(language)
    summarizer = Summarizer(stemmer)
    summarizer.stop_words = get_stop_words(language)

    summary_sentences = summarizer(parser.document, sentences_count)
    summary = " ".join([str(sentence) for sentence in summary_sentences])
    return summary

# =========================================================
# FUNGSI PARAPHRASER (AUTO EN / ID)
# =========================================================
def paraphrase_text(text):
    lang = detect_language(text)

    if lang == "id":
        if not paraphrase_model_id:
            raise ValueError("Model parafrasa Bahasa Indonesia tidak tersedia.")

        input_ids = paraphrase_tokenizer_id.encode(
            text, return_tensors="pt", truncation=True, max_length=512
        )
        outputs = paraphrase_model_id.generate(
            input_ids, max_length=512, num_beams=5, early_stopping=True
        )
        return paraphrase_tokenizer_id.decode(outputs[0], skip_special_tokens=True)

    else:
        if not paraphrase_model_en:
            raise ValueError("Model parafrasa English tidak tersedia.")

        input_ids = paraphrase_tokenizer_en.encode(
            text, return_tensors='pt', truncation=True, max_length=1000
        )
        outputs = paraphrase_model_en.generate(
            input_ids, max_length=1000, num_beams=5, early_stopping=True
        )
        return paraphrase_tokenizer_en.decode(outputs[0], skip_special_tokens=True)

# =========================================================
# API ENDPOINT: SUMMARIZER
# =========================================================
@app.route('/api/summarize', methods=['POST'])
def handle_summarize():
    sentences_count = int(request.form.get('sentences_count', 5))

    if 'text' in request.form and request.form.get('text', '').strip():
        full_text = request.form.get('text')
    elif 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Tidak ada file yang dipilih"}), 400
        try:
            full_text = extract_text_from_file(file)
        except Exception as e:
            return jsonify({"error": f"Gagal membaca file: {str(e)}"}), 500
    else:
        return jsonify({"error": "Tidak ada input file atau teks yang diberikan"}), 400

    MAX_WORDS = 2000
    word_count = len(full_text.split())
    if word_count > MAX_WORDS:
        return jsonify({
            "error": f"Teks terlalu panjang (maksimal {MAX_WORDS} kata). Saat ini {word_count} kata."
        }), 400

    try:
        summary_result = summarize_text(
            full_text,
            language="english",
            sentences_count=sentences_count
        )
        return jsonify({"summary": summary_result})
    except Exception as e:
        return jsonify({"error": f"Gagal memproses: {str(e)}"}), 500

# =========================================================
# API ENDPOINT: PARAPHRASER
# =========================================================
@app.route('/api/paraphrase', methods=['POST'])
def handle_paraphrase():
    data = request.get_json()

    if not data or 'text' not in data or not data['text'].strip():
        return jsonify({"error": "Teks tidak ditemukan"}), 400

    original_text = data.get('text')

    if len(original_text) > 1000:
        return jsonify({"error": "Teks terlalu panjang (maks 1000 karakter)"}), 400

    try:
        result = paraphrase_text(original_text)
        return jsonify({"paraphrased_text": result})
    except Exception as e:
        return jsonify({"error": f"Gagal memproses: {str(e)}"}), 500

# =========================================================
# ENTRY POINT
# =========================================================
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)
