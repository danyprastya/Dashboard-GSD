// src/components/CrawlerTrigger.tsx

'use client';

import { useState } from 'react';

interface TriggerResult {
  success: boolean;
  message: string;
  workflowUrl?: string;
}

export default function CrawlerTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TriggerResult | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['A', 'B', 'C', 'D']);
  const [targetMonth, setTargetMonth] = useState('Oktober 2025');

  const triggerCrawler = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Trigger GitHub Actions via API
      const response = await fetch('/api/trigger-crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          areas: selectedAreas.join(','),
          month: targetMonth,
          crawl_mode: 'all'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: 'Crawler triggered successfully! Check workflow status on GitHub Actions.',
          workflowUrl: data.workflowUrl
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to trigger crawler'
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

  const toggleArea = (area: string) => {
    setSelectedAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md">
      <h2 className="text-xl font-bold mb-4">Manual Crawler Trigger</h2>
      
      {/* Area Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Areas:</label>
        <div className="flex gap-2">
          {['A', 'B', 'C', 'D'].map(area => (
            <button
              key={area}
              onClick={() => toggleArea(area)}
              disabled={loading}
              className={`px-4 py-2 rounded transition-colors ${
                selectedAreas.includes(area)
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Area {area}
            </button>
          ))}
        </div>
      </div>

      {/* Month Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Target Month:</label>
        <input
          type="text"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="e.g., Oktober 2025"
        />
      </div>

      {/* Trigger Button */}
      <button
        onClick={triggerCrawler}
        disabled={loading || selectedAreas.length === 0}
        className={`w-full py-3 rounded font-medium transition-colors ${
          loading || selectedAreas.length === 0
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            Triggering...
          </span>
        ) : (
          '🚀 Trigger Crawler'
        )}
      </button>

      {/* Result Display */}
      {result && (
        <div className={`mt-4 p-4 rounded ${
          result.success 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">{result.message}</p>
          {result.workflowUrl && (
            <a 
              href={result.workflowUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm mt-2 inline-block hover:text-blue-800"
            >
              View on GitHub →
            </a>
          )}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 mt-4">
        💡 This will trigger a GitHub Actions workflow to crawl the selected areas.
        The process may take 5-15 minutes depending on data volume.
      </p>
    </div>
  );
}