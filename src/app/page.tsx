"use client"
import { useState } from 'react'
import { supabase } from './lib/supabaseclient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setStatus('Sedang memeriksa...')

    // Ambil data user berdasarkan username & password
    const { data, error } = await supabase
      .from('user')
      .select('USERNAME, PASSWORD, ROLE')
      .eq('USERNAME', username)
      .eq('PASSWORD', password)
      .single()

    if (error || !data) {
      setStatus('')
      setError('Username atau password salah')
      return
    }

    // Simpan user ke localStorage
    localStorage.setItem('user', JSON.stringify(data))
    setStatus('Login berhasil!')

    // Cek role dan arahkan ke halaman sesuai
    if (data.ROLE === 'admin') {
      router.push('/dashboard')
    } else if (data.ROLE === 'superadmin') {
      router.push('/superadmin')
    } else {
      setError('Role tidak dikenali')
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
