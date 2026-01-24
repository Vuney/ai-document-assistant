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
# NLTK Setup (AGRESSIVE FIX)
# =====================
# Kita buat folder lokal agar NLTK tidak bingung mencari data
nltk_data_dir = os.path.join(os.getcwd(), 'nltk_data')
os.makedirs(nltk_data_dir, exist_ok=True)
nltk.data.path.append(nltk_data_dir)

# Daftar resource yang WAJIB ada untuk sumy dan paraphraser
def setup_nltk():
    resources = ['punkt', 'punkt_tab', 'wordnet', 'omw-1.4', 'stopwords']
    for res in resources:
        try:
            # Download ke folder lokal project
            nltk.download(res, download_dir=nltk_data_dir, quiet=True)
        except Exception as e:
            print(f"Gagal download {res}: {e}")

setup_nltk()

# =====================
# Document Processing
# =====================
def extract_text(file_obj):
    if file_obj is None:
        return ""
    
    # Handle path file baik dari Gradio Web maupun API Next.js
    file_path = file_obj if isinstance(file_obj, str) else file_obj.name
    text = ""
    
    try:
        if file_path.endswith('.pdf'):
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif file_path.endswith('.docx'):
            doc = Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
    except Exception as e:
        return f"Error membaca file: {str(e)}"
            
    return text.strip()

# =====================
# AI Logic Functions
# =====================
def summarize_process(input_text, file_obj, sentences):
    # Utamakan teks input, jika kosong baru cek file
    text = input_text if input_text and input_text.strip() else extract_text(file_obj)
    
    if not text or len(text) < 10:
        return "Mohon masukkan teks atau unggah file dokumen yang valid."

    try:
        # Sumy butuh tokenizer english
        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = LsaSummarizer(Stemmer("english"))
        summarizer.stop_words = get_stop_words("english")

        summary = summarizer(parser.document, int(sentences))
        return " ".join(str(s) for s in summary)
    except Exception as e:
        return f"Gagal meringkas: {str(e)}. Pastikan bahasa teks didukung."

def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ")
            if name.lower() != word.lower():
                synonyms.add(name)
    return list(synonyms)

def paraphrase_process(input_text, file_obj):
    text = input_text if input_text and input_text.strip() else extract_text(file_obj)
    
    if not text:
        return "Mohon masukkan teks atau unggah file dokumen."

    try:
        words = word_tokenize(text)
        new_words = []

        for word in words:
            if word.isalpha() and random.random() < 0.3:
                synonyms = get_synonyms(word)
                new_words.append(random.choice(synonyms) if synonyms else word)
            else:
                new_words.append(word)

        return " ".join(new_words)
    except Exception as e:
        return f"Gagal parafrase: {str(e)}"

# =====================
# Gradio UI
# =====================
with gr.Blocks(title="AI Document Assistant", theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🧠 AI Document Assistant")
    
    with gr.Tab("Summarizer"):
        with gr.Row():
            with gr.Column():
                input_text = gr.Textbox(lines=8, label="Input Teks Manual")
                input_file = gr.File(label="Atau Unggah PDF/Docx", file_types=[".pdf", ".docx"])
                sentence_count = gr.Slider(3, 20, value=5, step=1, label="Jumlah Kalimat")
                btn_sum = gr.Button("🚀 Jalankan Ringkasan", variant="primary")
            with gr.Column():
                output_summary = gr.Textbox(lines=15, label="Hasil Ringkasan")
        
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
        
        btn_para.click(
            paraphrase_process, 
            inputs=[input_para_text, input_para_file], 
            outputs=output_para,
            api_name="paraphrase"
        )

# Launch tanpa parameter port khusus agar Hugging Face yang mengatur
if __name__ == "__main__":
    demo.launch()