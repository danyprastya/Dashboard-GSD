"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseclient'

type User = {
  ID: number;
  USERNAME: string;
  ROLE: string;
};

export default function Dashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const session = localStorage.getItem('user')
    if (!session) {
      router.push('/')
    } else {
      setUser(JSON.parse(session))
      fetchUsers()
    }
  }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('user').select('*')
    if (!error) setUsers(data)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">📊 Dashboard Telkom Property</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Daftar User</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-100 text-left">
              <th className="border p-2">ID</th>
              <th className="border p-2">Username</th>
              <th className="border p-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.ID}>
                <td className="border p-2">{u.ID}</td>
                <td className="border p-2">{u.USERNAME}</td>
                <td className="border p-2">{u.ROLE}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
