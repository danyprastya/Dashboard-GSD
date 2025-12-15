"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginResult, setLoginResult] = useState<"loading" | "success" | "error" | null>(null);
  const [loginMessage, setLoginMessage] = useState("");
  const [mounted, setMounted] = useState(false); // 🧩 untuk hindari SSR hydration mismatch

  // Jalankan hanya di client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Jika belum mounted, jangan render apa pun
  if (!mounted) return null;

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setStatus("Sedang memeriksa...");
    setIsLoading(true);
    setLoginResult("loading");
    setLoginMessage("");

    try {
      // Panggil API route untuk login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus("");
        setLoginResult("error");
        setLoginMessage(result.error || "Login gagal");
        // Delay sebelum menutup overlay
        setTimeout(() => {
          setIsLoading(false);
          setLoginResult(null);
          setError(result.error || "Login gagal");
        }, 2000);
        return;
      }

      if (result.success && result.user) {
        // Simpan user ke localStorage (pastikan hanya di client)
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(result.user));
          document.cookie = `isLoggedIn=true; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `userRole=${result.user.role}; path=/; max-age=86400; SameSite=Lax`;
        }

        setStatus("Login berhasil!");
        setLoginResult("success");
        setLoginMessage(`Selamat datang, ${result.user.username}!`);

        // Delay sebelum redirect
        setTimeout(() => {
          // Arahkan sesuai role
          if (result.user.role === "admin") {
            router.push("/dashboard");
          } else if (result.user.role === "superadmin") {
            router.push("/superadmin");
          } else {
            setLoginResult("error");
            setLoginMessage("Role tidak dikenali");
            setTimeout(() => {
              setIsLoading(false);
              setLoginResult(null);
              setError("Role tidak dikenali");
            }, 2000);
          }
        }, 1500);
      } else {
        setStatus("");
        setLoginResult("error");
        setLoginMessage("Username atau password salah");
        setTimeout(() => {
          setIsLoading(false);
          setLoginResult(null);
          setError("Username atau password salah");
        }, 2000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setStatus("");
      setLoginResult("error");
      setLoginMessage("Terjadi kesalahan saat login");
      setTimeout(() => {
        setIsLoading(false);
        setLoginResult(null);
        setError("Terjadi kesalahan saat login");
      }, 2000);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl min-w-[280px]">
            {loginResult === "loading" && (
              <>
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800">Memproses Login</p>
                  <p className="text-sm text-gray-500">Mohon tunggu sebentar...</p>
                </div>
              </>
            )}
            {loginResult === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600">Login Berhasil!</p>
                  <p className="text-sm text-gray-500">{loginMessage}</p>
                  <p className="text-xs text-gray-400 mt-2">Mengalihkan ke dashboard...</p>
                </div>
              </>
            )}
            {loginResult === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-red-600">Login Gagal</p>
                  <p className="text-sm text-gray-500">{loginMessage}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-blue-700">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96 text-center">
        <h1 className="text-2xl font-bold mb-1 text-blue-600">
          Telkom Property
        </h1>
        <p className="mb-6 text-sm text-gray-500">Sistem Manajemen Dashboard</p>

        <form onSubmit={handleLogin}>
          <div className="text-left mb-4">
            <label className="block text-sm mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="text-left mb-6">
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full border rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 hover:scale-110 transition-all duration-200 group"
          >
            <span className="inline-flex items-center gap-2 group-hover:gap-4 transition-all duration-200">
              Login <span>→</span>
            </span>
          </button>

          {status && <p className="text-sm text-gray-600 mt-3">{status}</p>}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </form>
        <p className="text-gray-400 text-xs mt-6">
          © 2025 Telkom Property. Semua hak cipta dilindungi.
        </p>
      </div>
    </div>
    </>
  );
}
