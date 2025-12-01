"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState("BANDUNG");
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  useEffect(() => {
    const roleMatch = document.cookie.match(/userRole=([^;]+)/);
    const role = roleMatch ? roleMatch[1] : "";
    if (role !== "superadmin") router.push("/");
  }, []);

  // Connect to SSE for real-time logs
  useEffect(() => {
    if (!currentRunId) return;

    const eventSource = new EventSource(`http://localhost:4000/crawler-logs/${currentRunId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'log') {
          setLogs((prev) => [...prev, data.message]);
        } else if (data.type === 'batch_start') {
          setLogs((prev) => [...prev, `🔒 Sending batch #${data.batchNumber} (${data.recordCount} records)...`]);
        } else if (data.type === 'batch_complete') {
          setLogs((prev) => [...prev, `✅ Batch #${data.batchNumber} fully sent: ${data.savedCount}/${data.expectedCount}`]);
          setProgress((prev) => ({
            current: prev.current + data.savedCount,
            total: prev.total + data.expectedCount,
            percentage: Math.round(((prev.current + data.savedCount) / (prev.total + data.expectedCount)) * 100)
          }));
        } else if (data.type === 'batch_partial') {
          setLogs((prev) => [...prev, `⚠️ Batch #${data.batchNumber} partially sent: ${data.savedCount}/${data.expectedCount}`]);
        } else if (data.type === 'batch_failed') {
          setLogs((prev) => [...prev, `❌ Batch #${data.batchNumber} failed: ${data.error}`]);
        } else if (data.type === 'complete') {
          setLogs((prev) => [...prev, `\n🎉 Crawling completed!`, `📊 Total: ${data.totalSent} sent, ${data.totalFailed} failed`]);
          setLoading(null);
        } else if (data.type === 'error') {
          setLogs((prev) => [...prev, `❌ Error: ${data.error}`]);
          setLoading(null);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = () => {
      console.log('SSE connection closed');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [currentRunId]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    document.cookie = "isLoggedIn=; path=/; max-age=0";
    document.cookie = "userRole=; path=/; max-age=0";
    router.push("/");
  };

  // Crawl Periode 1-20
  const handleRunCrawlerPeriod1_20 = async () => {
    setLoading("period-1-20");
    setLogs([]);
    setProgress({ current: 0, total: 0, percentage: 0 });
    
    try {
      const res = await fetch("http://localhost:4000/run-crawler-period-1-20", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          area: selectedArea
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success && data.runId) {
        setCurrentRunId(data.runId);
        setLogs([`🚀 Crawler started for ${selectedArea}`, `🆔 Run ID: ${data.runId}`, `📡 Connecting to live logs...`]);
      } else {
        alert(`❌ Error: ${data.error || 'Unknown error'}`);
        setLoading(null);
      }
    } catch (err: any) {
      console.error("Gagal menjalankan crawler periode 1-20:", err);
      alert(`❌ Gagal menjalankan crawler periode 1-20\n\nError: ${err.message}`);
      setLoading(null);
    }
  };

  // Crawl Periode 21-30
  const handleRunCrawlerPeriod21_30 = async () => {
    setLoading("period-21-30");
    try {
      const res = await fetch("http://localhost:4000/run-crawler-period-21-30", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          area: selectedArea
        }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ Error: ${data.error}\n\n${data.hint || ""}`);
      }
    } catch (err: any) {
      console.error("Gagal menjalankan crawler periode 21-30:", err);
      alert(`❌ Gagal menjalankan crawler periode 21-30\n\nError: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  // Crawl Kedua Periode Sequential
  const handleRunCrawlerBoth = async () => {
    setLoading("both");
    try {
      const res = await fetch("http://localhost:4000/run-crawler-both", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: selectedArea }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Gagal menjalankan crawler both:", err);
      alert(`❌ Gagal menjalankan crawler\n\nError: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  // Crawl Semua Area (Periode 1-20)
  const handleRunCrawlerAllAreas = async () => {
    setLoading("all-areas");
    try {
      const res = await fetch("http://localhost:4000/run-crawler-all-areas-period-1-20", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Gagal menjalankan crawler all areas:", err);
      alert(`❌ Gagal menjalankan crawler all areas\n\nError: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-amber-50 via-white to-indigo-50">
      {/* Decorative animated background blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl animate-pulse" />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 md:py-14">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 animate-[pulse_3s_ease-in-out_infinite]">
              <span className="text-2xl">🛠️</span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">SuperAdmin Panel</h1>
              <p className="text-sm text-gray-600">Kelola crawler dengan antarmuka yang lebih nyaman.</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading !== null}
            className="group inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-red-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Logout"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Area Selection & Send to API Toggle */}
          <div className="relative col-span-1 rounded-2xl border border-amber-100 bg-white/80 p-5 shadow-lg shadow-amber-100/50 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">📍</span>
              <h2 className="text-base font-semibold text-gray-800">Pilih Area</h2>
            </div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-gray-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
              disabled={loading !== null}
              aria-label="Pilih Area"
            >
              <option value="BANDUNG">BANDUNG</option>
              <option value="CORPU">CORPU</option>
              <option value="PRIANGAN_BARAT">PRIANGAN BARAT</option>
              <option value="PRIANGAN_TIMUR">PRIANGAN TIMUR</option>
            </select>

            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
              Area aktif: <span className="font-semibold">{selectedArea}</span>
            </div>

            {/* Direct API Mode Info */}
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4 ring-1 ring-green-100">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-green-900">Direct API Mode Active</h3>
                    <p className="mt-1 text-xs text-green-700">
                      Data langsung tersimpan ke database saat crawling (real-time, no CSV intermediary)
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-green-600">
                      <li className="flex items-center gap-2">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        <span>Send per batch 50 records (low timeout risk)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        <span>Auto-retry 3x dengan exponential backoff</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        <span>Manual edit protection (is_manual_edit flag)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        <span>Smart Upsert: Priority-based (APPROVED {'>'}SUBMITTED {'>'}OPEN)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Periode 1-20 */}
            <button
              onClick={handleRunCrawlerPeriod1_20}
              disabled={loading !== null}
              className={`group relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-blue-600 px-5 py-4 text-left text-white shadow-lg transition-all hover:from-indigo-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              {loading === "period-1-20" ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <div>
                    <div className="text-sm opacity-90">Sedang berjalan</div>
                    <div className="text-base font-semibold">Crawling Periode 1-20…</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xl transition-transform group-hover:scale-110">📅</span>
                  <div>
                    <div className="text-sm opacity-90">Periode 1-20</div>
                    <div className="text-base font-semibold">Crawl ({selectedArea})</div>
                  </div>
                </div>
              )}
            </button>

            {/* Periode 21-30 */}
            <button
              onClick={handleRunCrawlerPeriod21_30}
              disabled={loading !== null}
              className={`group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-600 px-5 py-4 text-left text-white shadow-lg transition-all hover:from-emerald-500 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              {loading === "period-21-30" ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <div>
                    <div className="text-sm opacity-90">Sedang berjalan</div>
                    <div className="text-base font-semibold">Crawling Periode 21-30…</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xl transition-transform group-hover:scale-110">📊</span>
                  <div>
                    <div className="text-sm opacity-90">Periode 21-30</div>
                    <div className="text-base font-semibold">Crawl ({selectedArea})</div>
                  </div>
                </div>
              )}
            </button>

            {/* Kedua Periode */}
            <button
              onClick={handleRunCrawlerBoth}
              disabled={loading !== null}
              className={`group relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-600 to-fuchsia-600 px-5 py-4 text-left text-white shadow-lg transition-all hover:from-violet-500 hover:to-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-60 disabled:cursor-not-allowed md:col-span-2`}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              {loading === "both" ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <div>
                    <div className="text-sm opacity-90">Sedang berjalan</div>
                    <div className="text-base font-semibold">Crawling Kedua Periode…</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xl transition-transform group-hover:scale-110">🚀</span>
                  <div>
                    <div className="text-sm opacity-90">Kedua Periode</div>
                    <div className="text-base font-semibold">Crawl ({selectedArea})</div>
                  </div>
                </div>
              )}
            </button>

            {/* Semua Area */}
            <button
              onClick={handleRunCrawlerAllAreas}
              disabled={loading !== null}
              className={`group relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-500 to-orange-500 px-5 py-4 text-left text-white shadow-lg transition-all hover:from-amber-400 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-60 disabled:cursor-not-allowed md:col-span-2`}
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              {loading === "all-areas" ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <div>
                    <div className="text-sm opacity-90">Sedang berjalan</div>
                    <div className="text-base font-semibold">Crawling Semua Area…</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xl transition-transform group-hover:scale-110">🌍</span>
                  <div>
                    <div className="text-sm opacity-90">Semua Area</div>
                    <div className="text-base font-semibold">Crawl Periode 1-20</div>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-900">
            <span>ℹ️</span> Informasi
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-blue-800">
            <li><strong>Periode 1-20</strong>: Crawl status OPEN, SUBMITTED, APPROVED</li>
            <li><strong>Periode 21-30</strong>: Cek status untuk yang sudah APPROVED</li>
            <li><strong>Kedua Periode</strong>: Jalankan keduanya secara berurutan (selalu kirim ke database)</li>
            <li><strong>Semua Area</strong>: Crawl periode 1-20 untuk 4 area</li>
            <li><strong>Send to Database</strong>: Aktifkan untuk otomatis simpan ke database (menggunakan Smart Upsert Strategy)</li>
          </ul>
        </div>

        {/* Real-time Logs & Progress */}
        {loading && (
          <div className="space-y-4">
            {/* Progress Bar */}
            {progress.total > 0 && (
              <div className="rounded-2xl border border-indigo-100 bg-white/80 p-5 shadow-lg backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                    <span>📊</span> Progress
                  </h3>
                  <span className="text-sm font-medium text-indigo-600">
                    {progress.current} / {progress.total} records ({progress.percentage}%)
                  </span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress.percentage}%` }}
                  >
                    <div className="absolute inset-0 animate-pulse bg-white/20" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Crawler sedang berjalan... Data dikirim per batch (50 records)
                </p>
              </div>
            )}

            {/* Live Logs Terminal */}
            <div className="rounded-2xl border border-gray-200 bg-gray-900 p-5 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  </span>
                  Live Logs
                </h3>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto rounded-lg bg-black/50 p-4 font-mono text-xs leading-relaxed text-green-400 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                {logs.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                    <span>Waiting for logs...</span>
                  </div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="mb-1 whitespace-pre-wrap break-words">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}