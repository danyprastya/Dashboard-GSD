// import { useEffect, useState } from 'react'

// export default function UsersPage() {
//   const [users, setUsers] = useState([])

//   useEffect(() => {
//     fetch('/api/users')
//       .then((res) => res.json())
//       .then((data) => setUsers(data))
//   }, [])

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Daftar User</h1>
//       <table className="border-collapse border border-gray-400">
//         <thead>
//           <tr>
//             <th className="border p-2">ID</th>
//             <th className="border p-2">Username</th>
//             <th className="border p-2">Role</th>
//           </tr>
//         </thead>
//         <tbody>
//           {users.map((u) => (
//             <tr key={u.ID}>
//               <td className="border p-2">{u.ID}</td>
//               <td className="border p-2">{u.USERNAME}</td>
//               <td className="border p-2">{u.ROLE}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }
