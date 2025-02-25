'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

type UserRole = 'student' | 'captain' | 'admin';

interface User {
  email: string;
  role: UserRole;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        router.push('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isUserAdmin = userDoc.data()?.role === 'admin';
        setIsAdmin(isUserAdmin);

        if (!isUserAdmin) {
          router.push('/');
        } else {
          fetchUsers();
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', 'in', ['captain', 'admin']));
      const querySnapshot = await getDocs(q);
      
      const usersList = querySnapshot.docs.map(doc => ({
        email: doc.data().email,
        role: doc.data().role as UserRole
      }));

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter an email address');
      return;
    }

    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      await setDoc(doc(db, 'users', userDoc.id), {
        ...userDoc.data(),
        role: selectedRole
      });

      setSuccess(`Successfully updated role to ${selectedRole}`);
      setEmail('');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#725A44]">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-8 py-16">
        <h1 className="text-4xl font-semibold text-[#0A2540] mb-8">Admin Dashboard</h1>
        
        {/* Role Update Form */}
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-8">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6">Update User Role</h2>
          
          <form onSubmit={handleUpdateRole} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
                placeholder="Enter user email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2A8E9E] text-black"
              >
                <option value="student">Student</option>
                <option value="captain">Captain</option>
              </select>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm">{success}</p>}

            <button
              type="submit"
              className="bg-[#38BFA1] text-white px-6 py-2 rounded-lg hover:bg-[#2DA891] transition-colors"
            >
              Update Role
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6">Current Captains and Admins</h2>
          
          <div className="space-y-4">
            {users.map((user, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="text-[#0A2540]">{user.email}</p>
                  <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <p className="text-gray-500 text-center py-4">No captains or admins found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 