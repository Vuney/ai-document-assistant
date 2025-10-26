// frontend/app/ScoreCircle.tsx

"use client";

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ScoreCircleProps {
  score: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
  // Menentukan warna berdasarkan skor
  const getColor = (score: number) => {
    if (score >= 70) return '#22c55e'; // Hijau
    if (score >= 40) return '#f97316'; // Oranye
    return '#ef4444'; // Merah
  };

  return (
    <div style={{ width: 120, height: 120, margin: 'auto' }}>
      <CircularProgressbar
        value={score}
        text={`${score}`}
        styles={buildStyles({
          // Warna untuk lingkaran path
          pathColor: getColor(score),
          // Warna untuk teks di tengah
          textColor: getColor(score),
          // Warna untuk sisa lingkaran (latar belakang)
          trailColor: '#e5e7eb',
          // Warna latar belakang komponen
          backgroundColor: '#3e98c7',
        })}
      />
    </div>
  );
};

export default ScoreCircle;