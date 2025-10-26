// frontend/app/SkeletonLoader.tsx

"use client";

const SkeletonLoader = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Placeholder untuk Skor */}
      <div className="flex flex-col items-center">
        <div className="h-4 bg-gray-200 rounded-md w-32 mb-4"></div>
        <div className="h-28 w-28 bg-gray-200 rounded-full"></div>
      </div>
      <hr />

      {/* Placeholder untuk Analisis Kata Kunci */}
      <div>
        <div className="h-4 bg-gray-200 rounded-md w-40 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="h-3 bg-green-100 rounded-md w-3/4 mb-2"></div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
              <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          <div>
            <div className="h-3 bg-orange-100 rounded-md w-3/4 mb-2"></div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder untuk Informasi Ditemukan */}
      <hr />
      <div>
        <div className="h-4 bg-gray-200 rounded-md w-36 mb-2"></div>
        <div className="space-y-2 mt-2">
          <div className="h-3 bg-gray-200 rounded-md w-full"></div>
          <div className="h-3 bg-gray-200 rounded-md w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;