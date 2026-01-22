import os
import nltk
import random
import gradio as gr
from nltk.corpus import wordnet
from nltk.tokenize import word_tokenize

# Library untuk dokumen
from PyPDF2 import PdfReader
from docx import Document

# Library untuk summarizer
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

# =====================
# NLTK Setup (Fix for Hugging Face)
# =====================
# Langsung download ke direktori default agar sistem NLTK otomatis menemukannya
nltk.download('punkt')
nltk.download('punkt_tab')  # Ini yang paling penting untuk memperbaiki error di screenshot kamu
nltk.download('wordnet')
nltk.download('omw-1.4')

# =====================
# Document Processing
# =====================
def extract_text(file_obj):
    if file_obj is None:
        return ""
    
    file_path = file_obj.name
    text = ""
    
    if file_path.endswith('.pdf'):
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    elif file_path.endswith('.docx'):
        doc = Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    else:
        # Jika file teks biasa atau lainnya
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
            
    return text.strip()

# =====================
# AI Logic Functions
# =====================
def summarize_process(input_text, file_obj, sentences):
    # Gabungkan teks input manual dan teks dari file
    text = input_text if input_text.strip() else extract_text(file_obj)
    
    if not text:
        return "Mohon masukkan teks atau unggah file dokumen."

    try:
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        stemmer = Stemmer("english")
        summarizer = LsaSummarizer(stemmer)
        summarizer.stop_words = get_stop_words("english")

        summary = summarizer(parser.document, int(sentences))
        return " ".join(str(s) for s in summary)
    except Exception as e:
        return f"Error saat meringkas: {str(e)}"

def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ")
            if name.lower() != word.lower():
                synonyms.add(name)
    return list(synonyms)

def paraphrase_process(input_text, file_obj):
    text = input_text if input_text.strip() else extract_text(file_obj)
    
    if not text:
        return "Mohon masukkan teks atau unggah file dokumen."

    words = word_tokenize(text)
    new_words = []

    for word in words:
        if word.isalpha() and random.random() < 0.3:
            synonyms = get_synonyms(word)
            new_words.append(random.choice(synonyms) if synonyms else word)
        else:
            new_words.append(word)

    return " ".join(new_words)

# =====================
# Gradio UI
# =====================
with gr.Blocks(title="AI Document Assistant", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🧠 AI Document Assistant")
    gr.Markdown("Tool profesional untuk Meringkas (Summarize) dan Memparafrase dokumen PDF/Docx.")

    with gr.Tab("Summarizer"):
        with gr.Row():
            with gr.Column():
                input_text = gr.Textbox(lines=8, label="Input Teks Manual")
                input_file = gr.File(label="Atau Unggah PDF/Docx", file_types=[".pdf", ".docx"])
                sentence_count = gr.Slider(3, 20, value=5, step=1, label="Jumlah Kalimat Ringkasan")
                btn_sum = gr.Button("🚀 Jalankan Ringkasan", variant="primary")
            with gr.Column():
                output_summary = gr.Textbox(lines=15, label="Hasil Ringkasan")
        
        # Link API untuk Next.js
        btn_sum.click(
            summarize_process, 
            inputs=[input_text, input_file, sentence_count], 
            outputs=output_summary,
            api_name="summarize"
        )

    with gr.Tab("Paraphraser"):
        with gr.Row():
            with gr.Column():
                input_para_text = gr.Textbox(lines=8, label="Input Teks Manual")
                input_para_file = gr.File(label="Atau Unggah PDF/Docx", file_types=[".pdf", ".docx"])
                btn_para = gr.Button("🔄 Jalankan Parafrase", variant="primary")
            with gr.Column():
                output_para = gr.Textbox(lines=15, label="Hasil Parafrasa")
        
        # Link API untuk Next.js
        btn_para.click(
            paraphrase_process, 
            inputs=[input_para_text, input_para_file], 
            outputs=output_para,
            api_name="paraphrase"
        )

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)