"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
export default function SuperAdminPage() {
    const router = useRouter()
      useEffect(() => {
    const roleMatch = document.cookie.match(/userRole=([^;]+)/)
    const role = roleMatch ? roleMatch[1] : ''
    if (role !== 'superadmin') router.push('/')
  }, [])

  const handleLogout = () => {
    // Hapus data session user
    localStorage.removeItem("user")
    document.cookie = "isLoggedIn=; path=/; max-age=0"
    document.cookie = "userRole=; path=/; max-age=0"

    // Arahkan ke halaman login
    router.push("/")
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-yellow-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-yellow-700">🛠️ SuperAdmin Panel</h1>
        <p className="mt-2 text-gray-600">Selamat datang, SuperAdmin! Anda memiliki akses penuh.</p>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
      >
        Logout
      </button>
    </div>
  )
}
