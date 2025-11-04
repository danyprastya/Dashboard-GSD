// src/components/AreaCrawlerTrigger.tsx

'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface TriggerResult {
  success: boolean;
  message: string;
  workflowUrl?: string;
  downloadUrl?: string;
}

interface AreaCrawlerTriggerProps {
  areaKey: string; // 'bandung', 'kawasan_corpu', 'priangan_timur', 'priangan_barat'
  areaTitle: string; // Display name
}

// Mapping area key ke area code untuk API
const AREA_CODE_MAP: Record<string, string> = {
  'bandung': 'A',
  'kawasan_corpu': 'B',
  'priangan_timur': 'C',
  'priangan_barat': 'D'
};

export default function AreaCrawlerTrigger({ areaKey, areaTitle }: AreaCrawlerTriggerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriggerResult | null>(null);
  const [targetMonth, setTargetMonth] = useState('Oktober 2025');

  const areaCode = AREA_CODE_MAP[areaKey] || 'A';

  const triggerCrawler = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/trigger-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: areaCode, // Single area
          month: targetMonth,
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Crawler untuk ${areaTitle} berhasil dijalankan! Data akan tersedia dalam 5-10 menit.`,
          workflowUrl: data.workflowUrl,
          downloadUrl: data.downloadUrl
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Gagal menjalankan crawler'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 mt-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Crawl Data {areaTitle}
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Ambil data terbaru dari AppSheet untuk area ini
          </p>
          
          {/* Month Input */}
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
              Target Bulan:
            </label>
            <input
              type="text"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              disabled={loading}
              className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Oktober 2025"
            />
          </div>
        </div>

        {/* Trigger Button */}
        <button
          onClick={triggerCrawler}
          disabled={loading}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
            loading
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Crawling...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Crawl Data
            </>
          )}
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`mt-3 p-3 rounded-md text-sm ${
          result.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">{result.message}</p>
          <div className="flex gap-3 mt-2">
            {result.workflowUrl && (
              <a 
                href={result.workflowUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline text-xs hover:text-blue-800"
              >
                Lihat Progress di GitHub →
              </a>
            )}
            {result.downloadUrl && (
              <a 
                href={result.downloadUrl} 
                download
                className="text-green-600 underline text-xs hover:text-green-800"
              >
                Download CSV →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-400 mt-2">
        💡 Proses crawling membutuhkan waktu 5-10 menit. Hasil akan disimpan dalam format CSV.
      </p>
    </div>
  );
}