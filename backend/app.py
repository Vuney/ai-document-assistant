import nltk
import random
import gradio as gr
from nltk.corpus import wordnet
from nltk.tokenize import word_tokenize

from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer
from sumy.nlp.stemmers import Stemmer
from sumy.utils import get_stop_words

# =====================
# NLTK setup
# =====================
nltk.download("punkt")
nltk.download("wordnet")

# =====================
# Summarizer
# =====================
def summarize_text(text, sentences):
    parser = PlaintextParser.from_string(text, Tokenizer("english"))
    stemmer = Stemmer("english")
    summarizer = LsaSummarizer(stemmer)
    summarizer.stop_words = get_stop_words("english")

    summary = summarizer(parser.document, int(sentences))
    return " ".join(str(s) for s in summary)

# =====================
# Paraphraser
# =====================
def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ")
            if name.lower() != word.lower():
                synonyms.add(name)
    return list(synonyms)

def paraphrase_text(text):
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
with gr.Blocks(title="AI Document Assistant") as demo:
    gr.Markdown("# 🧠 AI Document Assistant")
    gr.Markdown("Meringkas dan memparafrasakan teks dengan cerdas.")

    with gr.Tab("Summarizer"):
        input_text = gr.Textbox(lines=8, label="Masukkan teks")
        sentence_count = gr.Slider(3, 20, value=5, step=1, label="Jumlah Kalimat")
        output_summary = gr.Textbox(lines=6, label="Hasil Ringkasan")
        gr.Button("Ringkas").click(
            summarize_text,
            inputs=[input_text, sentence_count],
            outputs=output_summary
        )

    with gr.Tab("Paraphraser"):
        input_para = gr.Textbox(lines=8, label="Teks Asli")
        output_para = gr.Textbox(lines=8, label="Hasil Parafrasa")
        gr.Button("Parafrase").click(
            paraphrase_text,
            inputs=input_para,
            outputs=output_para
        )

demo.launch(
    server_name="0.0.0.0",
    server_port=7860
)
