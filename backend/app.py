# backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import docx
import io
import time

# Import library untuk Summarizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer as Summarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

# Import library untuk AI Paraphraser
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# --- MEMUAT MODEL AI PARAFRASA ---
print("Memuat model AI Paraphraser (Pegasus)...")
MODEL_NAME = 'tuner007/pegasus_paraphrase'
try:
    paraphrase_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    paraphrase_model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    print("Model AI Paraphraser berhasil dimuat.")
except Exception as e:
    print(f"Gagal memuat model. Error: {e}")
    paraphrase_tokenizer = None
    paraphrase_model = None

app = Flask(__name__)
CORS(app)

# Fungsi ekstraksi teks (tetap sama)
def extract_text_from_file(file):
    full_text = ""
    filename = file.filename
    if filename.endswith('.pdf'):
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
        for page in pdf_reader.pages:
            full_text += page.extract_text()
    elif filename.endswith('.docx'):
        document = docx.Document(io.BytesIO(file.read()))
        for para in document.paragraphs:
            full_text += para.text + "\n"
    else:
        raise ValueError("Tipe file tidak didukung. Harap unggah .pdf atau .docx")
    if not full_text.strip():
        raise ValueError("Tidak ada teks yang bisa dibaca dari file ini.")
    return full_text

# Fungsi Summarizer (tetap sama)
def summarize_text(text, language="english", sentences_count=5):
    parser = PlaintextParser.from_string(text, Tokenizer(language))
    stemmer = Stemmer(language)
    summarizer = Summarizer(stemmer)
    summarizer.stop_words = get_stop_words(language)
    summary_sentences = summarizer(parser.document, sentences_count)
    summary = " ".join([str(sentence) for sentence in summary_sentences])
    return summary

# Fungsi Paraphraser (tetap sama)
def paraphrase_text(text, num_return_sequences=1):
    if not paraphrase_model or not paraphrase_tokenizer:
        raise ValueError("Model parafrasa tidak berhasil dimuat.")
    input_ids = paraphrase_tokenizer.encode(text, return_tensors='pt', max_length=1000, truncation=True)
    outputs = paraphrase_model.generate(
        input_ids, max_length=1000, num_beams=5,
        num_return_sequences=num_return_sequences, early_stopping=True
    )
    paraphrased_text = paraphrase_tokenizer.decode(outputs[0], skip_special_tokens=True)
    return paraphrased_text

# --- API ENDPOINT #1: SUMMARIZER (DIPERBARUI UNTUK MENERIMA TEKS LANGSUNG) ---
@app.route('/api/summarize', methods=['POST'])
def handle_summarize():
    sentences_count = int(request.form.get('sentences_count', 5))
    
    # --- PERUBAHAN LOGIKA DI SINI ---
    # Cek apakah ada input 'text' (dari textarea) ATAU 'file' (dari upload)
    if 'text' in request.form and request.form.get('text', '').strip():
        full_text = request.form.get('text')
    elif 'file' in request.files:
        file = request.files['file']
        if file.filename == '': return jsonify({"error": "Tidak ada file yang dipilih"}), 400
        try:
             full_text = extract_text_from_file(file)
        except Exception as e:
             return jsonify({"error": f"Gagal membaca file: {str(e)}"}), 500
    else:
        return jsonify({"error": "Tidak ada input file atau teks yang diberikan"}), 400
    # --- AKHIR PERUBAHAN LOGIKA ---

    try:
        summary_result = summarize_text(full_text, language="english", sentences_count=sentences_count)
        return jsonify({"summary": summary_result})
    except Exception as e:
        return jsonify({"error": f"Gagal memproses: {str(e)}"}), 500

# API Endpoint Paraphraser (tetap sama)
@app.route('/api/paraphrase', methods=['POST'])
def handle_paraphrase():
    data = request.get_json()
    if 'text' not in data or not data['text'].strip():
        return jsonify({"error": "Teks tidak ditemukan"}), 400
    try:
        original_text = data.get('text')
        paraphrased_result = paraphrase_text(original_text)
        return jsonify({"paraphrased_text": paraphrased_result})
    except Exception as e:
        return jsonify({"error": f"Gagal memproses: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)