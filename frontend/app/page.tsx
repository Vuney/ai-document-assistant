// frontend/app/page.tsx

"use client";

import { useState, ChangeEvent, FormEvent } from 'react';

// Tipe data untuk fitur yang aktif
type Feature = 'summarizer' | 'paraphraser';
// Tipe baru untuk mode input Summarizer
type SummarizerInputMode = 'file' | 'text';

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<Feature>('summarizer');
  // State untuk mode input Summarizer
  const [summarizerMode, setSummarizerMode] = useState<SummarizerInputMode>('file');

  const [file, setFile] = useState<File | null>(null);
  const [summaryLength, setSummaryLength] = useState<string>("5"); // Default 5 kalimat
  const [originalText, setOriginalText] = useState<string>(""); // Teks untuk Paraphraser & Summarizer (mode text)
  const [paraphrasedText, setParaphrasedText] = useState<string>("");

  // States untuk hasil umum
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<string>(''); // State untuk notifikasi copy

  // Handler untuk perubahan file
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  // Fungsi untuk membersihkan hasil sebelumnya
  const clearResults = () => {
    setSummary("");
    setParaphrasedText("");
    setError("");
    setCopySuccess(''); // Reset notifikasi copy
    // Reset input juga saat ganti tab
    setFile(null);
    setOriginalText("");
  };

  // Fungsi untuk menyalin teks hasil parafrasa
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paraphrasedText);
      setCopySuccess('Teks berhasil disalin!');
      setTimeout(() => setCopySuccess(''), 2000); // Hilangkan notifikasi setelah 2 detik
    } catch (err) {
      setCopySuccess('Gagal menyalin teks.');
    }
  };

  // Handler saat form disubmit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Clear only error and copy success, keep results until new ones arrive
    setError("");
    setCopySuccess('');

    try {
      // Logika untuk fitur Summarizer
      if (activeFeature === 'summarizer') {
        const formData = new FormData();
        formData.append('sentences_count', summaryLength);

        // Cek mode input dan validasi
        if (summarizerMode === 'file') {
          if (!file) {
            throw new Error("Silakan unggah file terlebih dahulu.");
          }
          formData.append('file', file);
        } else { // Mode 'text'
          if (!originalText.trim()) {
            throw new Error("Silakan masukkan teks yang ingin diringkas.");
          }
          formData.append('text', originalText);
        }

        const response = await fetch('http://localhost:5001/api/summarize', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal meringkas.');
        const data = await response.json();
        setSummary(data.summary);
        setParaphrasedText(""); // Clear paraphrased text if any

      // Logika untuk fitur Paraphraser
      } else if (activeFeature === 'paraphraser') {
         if (!originalText.trim()) {
            throw new Error("Silakan masukkan teks yang ingin diparafrasakan.");
          }
          const response = await fetch('http://localhost:5001/api/paraphrase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: originalText }),
          });
          if (!response.ok) throw new Error((await response.json()).error || 'Gagal memparafrasakan.');
          const data = await response.json();
          setParaphrasedText(data.paraphrased_text);
          setSummary(""); // Clear summary if any
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Pastikan server backend berjalan.");
      // Clear previous results on error
      setSummary("");
      setParaphrasedText("");
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk merender bagian input form secara dinamis
  const renderInputForm = () => {
    if (activeFeature === 'summarizer') {
      return (
        <>
          {/* Pilihan Mode Input */}
          <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Sumber Teks</label>
             <div className="flex space-x-4">
               <label className="flex items-center cursor-pointer">
                 <input type="radio" name="summarizerMode" value="file" checked={summarizerMode === 'file'} onChange={() => setSummarizerMode('file')} className="mr-2"/> Unggah File
               </label>
               <label className="flex items-center cursor-pointer">
                 <input type="radio" name="summarizerMode" value="text" checked={summarizerMode === 'text'} onChange={() => setSummarizerMode('text')} className="mr-2"/> Tempel Teks
               </label>
             </div>
          </div>

          {/* Input File (muncul jika mode 'file') */}
          {summarizerMode === 'file' && (
            <div className="mb-6">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Unggah Dokumen Anda (.pdf atau .docx)
              </label>
              <input type="file" id="file-upload" accept=".pdf,.docx" onChange={handleFileChange} className="input-file-style"/>
            </div>
          )}

          {/* Input Teks (muncul jika mode 'text') */}
          {summarizerMode === 'text' && (
             <div className="mb-6">
              <label htmlFor="original-text-summarizer" className="block text-sm font-medium text-gray-700 mb-2">Tempel Teks Anda di Sini</label>
              <textarea
                id="original-text-summarizer"
                rows={8}
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Masukkan teks yang ingin diringkas..."
                className="input-textarea-style"
              ></textarea>
            </div>
          )}

          {/* Pilihan Panjang Ringkasan */}
          <div className="mb-6">
            <label htmlFor="summary-length" className="block text-sm font-medium text-gray-700 mb-2">Panjang Ringkasan</label>
            <select id="summary-length" value={summaryLength} onChange={(e) => setSummaryLength(e.target.value)} className="input-select-style">
              <option value="3">Pendek (3 kalimat)</option>
              <option value="5">Sedang (5 kalimat)</option>
              <option value="10">Panjang (10 kalimat)</option>
              <option value="15">Panjang (15 kalimat)</option>
              <option value="20">Panjang (20 kalimat)</option>
            </select>
          </div>
        </>
      );
    }
    // Input Paraphraser
    if (activeFeature === 'paraphraser') {
      return (
        <div className="mb-6">
          <label htmlFor="original-text-paraphraser" className="block text-sm font-medium text-gray-700 mb-2">Tempel Teks Asli (Maks 1000 karakter)</label>
          <textarea
            id="original-text-paraphraser"
            rows={8}
            maxLength={1000}
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Masukkan kalimat atau paragraf yang ingin Anda tulis ulang di sini..."
            className="input-textarea-style"
          ></textarea>
        </div>
      );
    }
  };

  // Fungsi untuk merender bagian hasil secara dinamis
  const renderResult = () => {
    // Tampilkan loading state
    if (isLoading) {
      return <div className="text-gray-500 text-center py-10">AI sedang bekerja, mohon tunggu... <br/> {activeFeature === 'paraphraser' && 'Proses parafrasa mungkin memakan waktu 1-2 menit.'}</div>;
    }
    // Tampilkan error jika ada
    if (error) {
      return <div className="text-red-600 bg-red-100 p-4 rounded-md border border-red-200">{error}</div>;
    }
    // Tampilkan hasil Summarizer
    if (summary && activeFeature === 'summarizer') {
      return (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Hasil Ringkasan</h2>
          <div className="prose prose-sm max-w-none text-gray-800 text-justify bg-gray-50 p-4 rounded-md border">
            <p>{summary}</p>
          </div>
        </div>
      );
    }
    // Tampilkan hasil Paraphraser (dengan layout 2 kolom)
    if (paraphrasedText && activeFeature === 'paraphraser') {
      return (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">Hasil Parafrasa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom Teks Asli */}
            <div>
              <h3 className="text-base font-semibold text-gray-600 mb-2">Teks Asli</h3>
              <div className="text-gray-700 text-sm p-4 border rounded-md h-48 overflow-y-auto bg-gray-50 whitespace-pre-wrap break-words">
                 {originalText}
              </div>
            </div>
            {/* Kolom Hasil Parafrasa */}
            <div>
              <h3 className="text-base font-semibold text-blue-600 mb-2">Hasil AI</h3>
              <div className="text-gray-800 text-sm p-4 bg-blue-50 border border-blue-200 rounded-md h-48 overflow-y-auto whitespace-pre-wrap break-words">
                 {paraphrasedText}
              </div>
              {/* Tombol Copy */}
              <button
                onClick={copyToClipboard}
                className="mt-3 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded inline-flex items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Salin Hasil
              </button>
              {copySuccess && <span className="ml-2 text-xs text-green-600 font-medium">{copySuccess}</span>}
            </div>
          </div>
        </div>
      );
    }
    // Tampilkan placeholder jika belum ada input/hasil
    return <div className="text-center text-gray-400 pt-16 text-sm">Hasil akan muncul di sini setelah Anda memproses input.</div>;
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-100 font-sans">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">AI Document Assistant</h1>
          <p className="text-base md:text-lg text-gray-600 mt-2">
            Meringkas dan memparafrasakan teks dengan cerdas.
          </p>
        </header>

        {/* --- STYLING TAMBAHAN UNTUK INPUT DAN TAB --- */}
        <style jsx global>{`
          .input-file-style {
             display: block; width: 100%; font-size: 0.875rem; color: #4b5563; /* gray-600 */
             padding: 0.5rem 1rem; border-radius: 9999px; border-width: 1px; border-color: #d1d5db; /* gray-300 */
             background-color: #f9fafb; /* gray-50 */ cursor: pointer;
          }
          .input-file-style::file-selector-button { /* Styling specific to the button part */
             margin-right: 0.75rem; padding: 0.5rem 1rem; border-radius: 9999px; border-width: 0px;
             font-size: 0.875rem; font-weight: 600; background-color: #eff6ff; /* blue-50 */ color: #1d4ed8; /* blue-700 */
          }
          .input-file-style:hover::file-selector-button { background-color: #dbeafe; /* blue-100 */ }
          .input-select-style { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: white; appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem;}
          .input-textarea-style { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; line-height: 1.5; }
          .tab-button {
             padding: 0.5rem 1.5rem; font-weight: 600; font-size: 0.875rem; border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem;
             transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1); border-bottom: 2px solid transparent; margin-bottom: -1px; /* Overlap border */
          }
          .tab-button.active { color: #2563eb; /* blue-600 */ border-bottom-color: #2563eb; }
          .tab-button:not(.active) { color: #6b7280; /* gray-500 */ }
          .tab-button:not(.active):hover { color: #1f2937; /* gray-800 */ background-color: #f3f4f6; /* gray-100 */}
          .button-primary { /* Consistent button style */
            width: 100%; background-color: #2563eb; /* blue-600 */ color: white; font-weight: 700;
            padding: 0.75rem 1rem; border-radius: 0.375rem; transition: background-color 150ms;
          }
          .button-primary:hover { background-color: #1d4ed8; /* blue-700 */ }
          .button-primary:disabled { background-color: #9ca3af; /* gray-400 */ cursor: not-allowed; }
          /* Add whitespace-pre-wrap to handle line breaks in textareas/results */
          .whitespace-pre-wrap { white-space: pre-wrap; }
          .break-words { word-break: break-word; } /* Ensure long words/links wrap */
        `}</style>

        {/* --- Tombol Pilihan Fitur (Tab) --- */}
        <div className="flex justify-center mb-8 border-b border-gray-300">
            <button
                onClick={() => { setActiveFeature('summarizer'); clearResults(); }}
                className={`tab-button ${activeFeature === 'summarizer' ? 'active' : ''}`}
            >
                Summarizer
            </button>
            <button
                onClick={() => { setActiveFeature('paraphraser'); clearResults(); }}
                className={`tab-button ${activeFeature === 'paraphraser' ? 'active' : ''}`}
            >
                Paraphraser
            </button>
        </div>

        {/* --- Area Konten Utama --- */}
        <div className="grid grid-cols-1 gap-8">
          {/* Bagian Input */}
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-700 capitalize">{activeFeature}</h2>
            <form onSubmit={handleSubmit}>
              {renderInputForm()} {/* Input form dinamis */}
              <button
                type="submit"
                disabled={isLoading}
                className="button-primary" // Gunakan class styling
              >
                {isLoading ? 'Memproses...' : 'Proses Sekarang'}
              </button>
            </form>
          </div>

          {/* Bagian Hasil (muncul jika ada hasil, loading, atau error) */}
          {(isLoading || error || summary || paraphrasedText) && (
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
              {renderResult()} {/* Hasil dinamis */}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}