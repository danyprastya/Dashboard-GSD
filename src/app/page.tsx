"use client"
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseclient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false) // 🧩 untuk hindari SSR hydration mismatch

  // Jalankan hanya di client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Jika belum mounted, jangan render apa pun
  if (!mounted) return null

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setStatus('Sedang memeriksa...')

    try {
      // Panggil API route untuk login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus('')
        setError(result.error || 'Login gagal')
        return
      }

      if (result.success && result.user) {
        // Simpan user ke localStorage (pastikan hanya di client)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(result.user))
          document.cookie = `isLoggedIn=true; path=/; max-age=86400; SameSite=Lax`
          document.cookie = `userRole=${result.user.role}; path=/; max-age=86400; SameSite=Lax`
        }

        setStatus('Login berhasil!')

        // Arahkan sesuai role
        if (result.user.role === 'admin') {
          router.push('/dashboard')
        } else if (result.user.role === 'superadmin') {
          router.push('/superadmin')
        } else {
          setError('Role tidak dikenali')
        }
      } else {
        setStatus('')
        setError('Username atau password salah')
      }
    } catch (err) {
      console.error('Login error:', err)
      setStatus('')
      setError('Terjadi kesalahan saat login')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-500 to-blue-700">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96 text-center">
        <h1 className="text-2xl font-bold mb-1 text-blue-600">Telkom Property</h1>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            → Login
          </button>

          {status && <p className="text-sm text-gray-600 mt-3">{status}</p>}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </form>

        <div className="mt-6 p-3 border rounded-md bg-gray-50 text-sm text-left">
          <p>
            Status koneksi Supabase:{' '}
            <span className="text-green-600 font-semibold">✅ Berhasil ke Supabase!</span>
          </p>
        </div>

        <p className="text-gray-400 text-xs mt-6">© 2025 Telkom Property. Semua hak cipta dilindungi.</p>
      </div>
    </div>
  )
}
