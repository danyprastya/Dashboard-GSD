"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuperAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState("BANDUNG");

  useEffect(() => {
    const roleMatch = document.cookie.match(/userRole=([^;]+)/);
    const role = roleMatch ? roleMatch[1] : "";
    if (role !== "superadmin") router.push("/");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    document.cookie = "isLoggedIn=; path=/; max-age=0";
    document.cookie = "userRole=; path=/; max-age=0";
    router.push("/");
  };

  // Crawl Periode 1-20
  const handleRunCrawlerPeriod1_20 = async () => {
    setLoading("period-1-20");
    try {
      const res = await fetch("http://localhost:4000/run-crawler-period-1-20", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: selectedArea }),
      });
      
      // Check if response is ok
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
      console.error("Gagal menjalankan crawler periode 1-20:", err);
      alert(`❌ Gagal menjalankan crawler periode 1-20\n\nPastikan:\n1. Server Express sudah jalan (npm start di folder crawler)\n2. Port 4000 tidak diblokir\n3. CORS sudah diaktifkan\n\nError: ${err.message}`);
    } finally {
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
        body: JSON.stringify({ area: selectedArea }),
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 gap-6 p-8">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold text-yellow-700 mb-2">🛠️ SuperAdmin Panel</h1>
        <p className="text-gray-600">
          Selamat datang, SuperAdmin! Kelola crawler dengan mudah.
        </p>
      </div>

      {/* Area Selection */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pilih Area:
        </label>
        <select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading !== null}
        >
          <option value="BANDUNG">BANDUNG</option>
          <option value="CORPU">CORPU</option>
          <option value="PRIANGAN_BARAT">PRIANGAN BARAT</option>
          <option value="PRIANGAN_TIMUR">PRIANGAN TIMUR</option>
        </select>
      </div>

      {/* Crawler Buttons */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-3">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🤖 Crawler Actions</h2>
        
        {/* Periode 1-20 */}
        <button
          onClick={handleRunCrawlerPeriod1_20}
          disabled={loading !== null}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
            loading === "period-1-20"
              ? "bg-blue-400 cursor-wait"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {loading === "period-1-20" ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Crawling Periode 1-20...</span>
            </>
          ) : (
            <>
              <span>📅</span>
              <span>Crawl Periode 1-20 ({selectedArea})</span>
            </>
          )}
        </button>

        {/* Periode 21-30 */}
        <button
          onClick={handleRunCrawlerPeriod21_30}
          disabled={loading !== null}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
            loading === "period-21-30"
              ? "bg-green-400 cursor-wait"
              : "bg-green-600 hover:bg-green-700"
          } text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {loading === "period-21-30" ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Crawling Periode 21-30...</span>
            </>
          ) : (
            <>
              <span>📊</span>
              <span>Crawl Periode 21-30 ({selectedArea})</span>
            </>
          )}
        </button>

        {/* Kedua Periode */}
        <button
          onClick={handleRunCrawlerBoth}
          disabled={loading !== null}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
            loading === "both"
              ? "bg-purple-400 cursor-wait"
              : "bg-purple-600 hover:bg-purple-700"
          } text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
        >
          {loading === "both" ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              <span>Crawling Kedua Periode...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Crawl Kedua Periode ({selectedArea})</span>
            </>
          )}
        </button>

        <div className="border-t pt-3 mt-3">
          {/* Semua Area */}
          <button
            onClick={handleRunCrawlerAllAreas}
            disabled={loading !== null}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
              loading === "all-areas"
                ? "bg-orange-400 cursor-wait"
                : "bg-orange-600 hover:bg-orange-700"
            } text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading === "all-areas" ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Crawling Semua Area...</span>
              </>
            ) : (
              <>
                <span>🌍</span>
                <span>Crawl Semua Area (Periode 1-20)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Informasi:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Periode 1-20</strong>: Crawl status OPEN, SUBMITTED, APPROVED</li>
          <li>• <strong>Periode 21-30</strong>: Cek status untuk yang sudah APPROVED</li>
          <li>• <strong>Kedua Periode</strong>: Jalankan keduanya secara berurutan</li>
          <li>• <strong>Semua Area</strong>: Crawl periode 1-20 untuk 4 area</li>
        </ul>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={loading !== null}
        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        🚪 Logout
      </button>
    </div>
  );
}