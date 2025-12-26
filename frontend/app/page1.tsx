// frontend/app/page.tsx

"use client";

import { useState, ChangeEvent, FormEvent } from 'react';
// 1. Import library Toast untuk notifikasi modern
import { Toaster, toast } from 'react-hot-toast';

type Feature = 'summarizer' | 'paraphraser';
type SummarizerInputMode = 'file' | 'text';

export default function Home() {
  const [activeFeature, setActiveFeature] = useState<Feature>('summarizer');
  const [summarizerMode, setSummarizerMode] = useState<SummarizerInputMode>('file');

  const [file, setFile] = useState<File | null>(null);
  const [summaryLength, setSummaryLength] = useState<string>("5");
  const [originalText, setOriginalText] = useState<string>("");
  const [paraphrasedText, setParaphrasedText] = useState<string>("");

  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Kita HAPUS state 'error' dan 'copySuccess' karena sudah diganti Toast

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const clearResults = () => {
    setSummary("");
    setParaphrasedText("");
    setFile(null);
    setOriginalText("");
    // Tidak perlu clear error manual lagi
  };

  // --- FUNGSI BARU: Deskripsi Fitur (Onboarding) ---
  // Menjelaskan fungsi fitur yang sedang aktif kepada pengguna
  const getFeatureDescription = () => {
    if (activeFeature === 'summarizer') {
      return "Gunakan fitur ini untuk meringkas dokumen panjang (PDF/DOCX) atau teks menjadi poin-poin penting secara instan.";
    }
    return "Gunakan fitur ini untuk menulis ulang kalimat atau paragraf dengan gaya bahasa berbeda agar terhindar dari plagiarisme.";
  };

  // --- FUNGSI COPY DENGAN TOAST ---
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(paraphrasedText);
      // Poin 3: Notifikasi Sukses Modern
      toast.success('Teks berhasil disalin ke clipboard!', {
        icon: '📋',
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
    } catch (err) {
      toast.error('Gagal menyalin teks.');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeFeature === 'summarizer') {
        const formData = new FormData();
        formData.append('sentences_count', summaryLength);

        if (summarizerMode === 'file') {
          if (!file) throw new Error("Silakan unggah file terlebih dahulu.");
          formData.append('file', file);
        } else {
          if (!originalText.trim()) throw new Error("Silakan masukkan teks yang ingin diringkas.");
          formData.append('text', originalText);
        }

        const response = await fetch('http://localhost:5001/api/summarize', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal meringkas.');
        
        const data = await response.json();
        setSummary(data.summary);
        setParaphrasedText("");
        // Notifikasi sukses
        toast.success('Dokumen berhasil diringkas!');

      } else if (activeFeature === 'paraphraser') {
         if (!originalText.trim()) throw new Error("Silakan masukkan teks yang ingin diparafrasakan.");
          
          const response = await fetch('http://localhost:5001/api/paraphrase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: originalText }),
          });
          
          if (!response.ok) throw new Error((await response.json()).error || 'Gagal memparafrasakan.');
          
          const data = await response.json();
          setParaphrasedText(data.paraphrased_text);
          setSummary("");
          // Notifikasi sukses
          toast.success('Teks berhasil diparafrasa!');
      }
    } catch (err: any) {
      // Poin 3: Notifikasi Error Modern
      toast.error(err.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputForm = () => {
    if (activeFeature === 'summarizer') {
      return (
        <>
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

          {summarizerMode === 'file' && (
            <div className="mb-6">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
                Unggah Dokumen Anda (.pdf atau .docx)
              </label>
              <input type="file" id="file-upload" accept=".pdf,.docx" onChange={handleFileChange} className="input-file-style"/>
            </div>
          )}

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

          <div className="mb-6">
            <label htmlFor="summary-length" className="block text-sm font-medium text-gray-700 mb-2">Panjang Ringkasan</label>
            <select id="summary-length" value={summaryLength} onChange={(e) => setSummaryLength(e.target.value)} className="input-select-style">
              <option value="3">Pendek (3 kalimat)</option>
              <option value="5">Sedang (5 kalimat)</option>
              <option value="10">Panjang (10 kalimat)</option>
              <option value="15">Sangat Panjang (15 kalimat)</option>
            </select>
          </div>
        </>
      );
    }
    if (activeFeature === 'paraphraser') {
      return (
        <div className="mb-6">
          <label htmlFor="original-text-paraphraser" className="block text-sm font-medium text-gray-700 mb-2">Tempel Teks Asli (Maks 500 karakter)</label>
          <textarea
            id="original-text-paraphraser"
            rows={8}
            maxLength={500}
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Masukkan kalimat atau paragraf yang ingin Anda tulis ulang di sini..."
            className="input-textarea-style"
          ></textarea>
        </div>
      );
    }
  };

  const renderResult = () => {
    if (isLoading) {
      return <div className="text-gray-500 text-center py-10">AI sedang bekerja, mohon tunggu... <br/> {activeFeature === 'paraphraser' && 'Proses parafrasa mungkin memakan waktu 1-2 menit.'}</div>;
    }
    
    // Kita hapus tampilan error block statis karena sudah ada Toast
    
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
    
    if (paraphrasedText && activeFeature === 'paraphraser') {
      return (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">Hasil Parafrasa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-semibold text-gray-600 mb-2">Teks Asli</h3>
              <div className="text-gray-700 text-sm p-4 border rounded-md h-48 overflow-y-auto bg-gray-50 whitespace-pre-wrap break-words">
                 {originalText}
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-blue-600 mb-2">Hasil AI</h3>
              <div className="text-gray-800 text-sm p-4 bg-blue-50 border border-blue-200 rounded-md h-48 overflow-y-auto whitespace-pre-wrap break-words">
                 {paraphrasedText}
              </div>
              <button
                onClick={copyToClipboard}
                className="mt-3 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded inline-flex items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Salin Hasil
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <div className="text-center text-gray-400 pt-16 text-sm">Hasil akan muncul di sini setelah Anda memproses input.</div>;
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-100 font-sans">
      {/* Komponen Toaster wajib ada agar notifikasi muncul */}
      <Toaster position="bottom-center" reverseOrder={false} />

      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">AI Document Assistant</h1>
          <p className="text-base md:text-lg text-gray-600 mt-2">
            Meringkas dan memparafrasakan teks dengan cerdas.
          </p>
        </header>

        <style jsx global>{`
          .input-file-style { display: block; width: 100%; font-size: 0.875rem; color: #4b5563; padding: 0.5rem 1rem; border-radius: 9999px; border-width: 1px; border-color: #d1d5db; background-color: #f9fafb; cursor: pointer; }
          .input-file-style::file-selector-button { margin-right: 0.75rem; padding: 0.5rem 1rem; border-radius: 9999px; border-width: 0px; font-size: 0.875rem; font-weight: 600; background-color: #eff6ff; color: #1d4ed8; }
          .input-file-style:hover::file-selector-button { background-color: #dbeafe; }
          .input-select-style { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; background-color: white; appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem;}
          .input-textarea-style { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; line-height: 1.5; }
          .tab-button { padding: 0.5rem 1.5rem; font-weight: 600; font-size: 0.875rem; border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem; transition: all 150ms; border-bottom: 2px solid transparent; margin-bottom: -1px; }
          .tab-button.active { color: #2563eb; border-bottom-color: #2563eb; background-color: white; }
          .tab-button:not(.active) { color: #6b7280; background-color: #f3f4f6; }
          .tab-button:not(.active):hover { color: #1f2937; background-color: #e5e7eb; }
          .button-primary { width: 100%; background-color: #2563eb; color: white; font-weight: 700; padding: 0.75rem 1rem; border-radius: 0.375rem; transition: background-color 150ms; }
          .button-primary:hover { background-color: #1d4ed8; }
          .button-primary:disabled { background-color: #9ca3af; cursor: not-allowed; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
          .break-words { word-break: break-word; }
        `}</style>

        <div className="flex justify-center mb-4 border-b border-gray-300">
            <button onClick={() => { setActiveFeature('summarizer'); clearResults(); }} className={`tab-button ${activeFeature === 'summarizer' ? 'active' : ''}`}>Summarizer</button>
            <button onClick={() => { setActiveFeature('paraphraser'); clearResults(); }} className={`tab-button ${activeFeature === 'paraphraser' ? 'active' : ''}`}>Paraphraser</button>
        </div>

        {/* Poin 4: Info Box / Onboarding */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start transition-all">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
           <p className="text-sm text-blue-800 leading-relaxed">{getFeatureDescription()}</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-700 capitalize">{activeFeature}</h2>
            <form onSubmit={handleSubmit}>
              {renderInputForm()}
              <button type="submit" disabled={isLoading} className="button-primary">
                {isLoading ? 'Memproses...' : 'Proses Sekarang'}
              </button>
            </form>
          </div>

          {(isLoading || summary || paraphrasedText) && (
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
              {renderResult()}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}