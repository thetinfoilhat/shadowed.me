'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{email: string, role: UserRole} | null>(null);

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
      
      const usersList = querySnapshot.docs
        .map(doc => ({
          email: doc.data().email,
          role: doc.data().role as UserRole
        }))
        .filter(user => user.email)
        // Explicit sorting to ensure admins are at the top
        .sort((a, b) => {
          // First sort by role (admins first)
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          // Then sort by email within each role group
          return a.email.localeCompare(b.email);
        });

      console.log('Sorted users:', usersList); // Add this to debug
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

    // If assigning admin role, show confirmation dialog
    if (selectedRole === 'admin') {
      setPendingUpdate({ email, role: selectedRole });
      setShowConfirmation(true);
      return;
    }

    // Otherwise proceed with the update
    await updateUserRole(email, selectedRole);
  };

  const updateUserRole = async (userEmail: string, role: UserRole) => {
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      await setDoc(doc(db, 'users', userDoc.id), {
        ...userDoc.data(),
        role
      });

      if (role === 'admin') {
        setSuccess(`Successfully granted admin privileges to ${userEmail}`);
      } else {
        setSuccess(`Successfully updated role to ${role}`);
      }
      setEmail('');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to update role');
    }
  };

  const handleConfirmAdminRole = async () => {
    if (pendingUpdate) {
      await updateUserRole(pendingUpdate.email, pendingUpdate.role);
      setPendingUpdate(null);
    }
    setShowConfirmation(false);
  };

  const handleCancelAdminRole = () => {
    setPendingUpdate(null);
    setShowConfirmation(false);
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
                <option value="admin" className="text-red-600 font-medium">Admin (Full Access)</option>
              </select>
              {selectedRole === 'admin' && (
                <p className="mt-2 text-amber-600 text-sm font-medium">
                  Warning: Admin users have full access to manage all aspects of the platform, including user roles and all club visits.
                </p>
              )}
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
            {users.map((user) => (
              <div 
                key={user.email}
                className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors
                  ${user.role === 'admin' ? 'bg-red-50' : ''}`}
              >
                <div>
                  <p className="text-[#0A2540] font-medium">{user.email}</p>
                  <p className={`text-sm capitalize ${
                    user.role === 'admin' 
                      ? 'text-red-600 font-medium' 
                      : 'text-gray-500'
                  }`}>
                    {user.role}
                  </p>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <p className="text-gray-500 text-center py-4">No captains or admins found</p>
            )}
          </div>
        </div>
      </div>

      {/* Admin Confirmation Dialog */}
      <Dialog 
        open={showConfirmation} 
        onClose={handleCancelAdminRole}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-8">
            <Dialog.Title className="text-2xl font-semibold text-[#0A2540] mb-4">
              Confirm Admin Privileges
            </Dialog.Title>
            
            <p className="text-gray-600 mb-4">
              You are about to grant <span className="font-semibold">{pendingUpdate?.email}</span> admin privileges. 
              This will give them full access to:
            </p>

            <ul className="list-disc pl-5 mb-6 text-gray-600 space-y-1">
              <li>Manage all user roles</li>
              <li>Access and modify all club visits</li>
              <li>Delete any club visit</li>
              <li>View all user data</li>
            </ul>

            <p className="text-amber-600 font-medium mb-6">
              This action should only be performed for trusted individuals who need full administrative access.
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelAdminRole}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdminRole}
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Confirm Admin Access
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 