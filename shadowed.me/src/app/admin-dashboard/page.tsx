'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { db, UserRole, ROLE_HIERARCHY } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Dialog } from '@headlessui/react';

interface User {
  email: string;
  role: UserRole;
  displayName?: string | null;
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
      const q = query(usersRef, where('role', 'in', ['captain', 'sponsor', 'admin']));
      const querySnapshot = await getDocs(q);
      
      const usersList = querySnapshot.docs
        .map(doc => ({
          email: doc.data().email,
          role: doc.data().role as UserRole,
          displayName: doc.data().displayName
        }))
        .filter(user => user.email)
        // Sort by role hierarchy and then by email
        .sort((a, b) => {
          // First sort by role hierarchy (admins first, then sponsors, then captains)
          const roleComparison = ROLE_HIERARCHY[b.role] - ROLE_HIERARCHY[a.role];
          if (roleComparison !== 0) return roleComparison;
          // Then sort by email within each role group
          return a.email.localeCompare(b.email);
        });

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

    // If assigning admin or sponsor role, show confirmation dialog
    if (selectedRole === 'admin' || selectedRole === 'sponsor') {
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
      } else if (role === 'sponsor') {
        setSuccess(`Successfully granted sponsor privileges to ${userEmail}`);
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

  const handleConfirmRoleChange = async () => {
    if (pendingUpdate) {
      await updateUserRole(pendingUpdate.email, pendingUpdate.role);
      setPendingUpdate(null);
    }
    setShowConfirmation(false);
  };

  const handleCancelRoleChange = () => {
    setPendingUpdate(null);
    setShowConfirmation(false);
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch(role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'sponsor':
        return 'bg-purple-100 text-purple-800';
      case 'captain':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                <option value="sponsor" className="text-purple-600 font-medium">Sponsor (Approval Access)</option>
                <option value="admin" className="text-red-600 font-medium">Admin (Full Access)</option>
              </select>
              {selectedRole === 'admin' && (
                <p className="mt-2 text-amber-600 text-sm font-medium">
                  Warning: Admin users have full access to manage all aspects of the platform, including user roles and all club visits.
                </p>
              )}
              {selectedRole === 'sponsor' && (
                <p className="mt-2 text-purple-600 text-sm font-medium">
                  Sponsors can approve club listings from captains and manage clubs assigned to them.
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
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6">Current Captains, Sponsors, and Admins</h2>
          
          <div className="space-y-4">
            {users.map((user) => (
              <div 
                key={user.email}
                className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors
                  ${user.role === 'admin' ? 'bg-red-50' : user.role === 'sponsor' ? 'bg-purple-50' : ''}`}
              >
                <div>
                  <p className="text-[#0A2540] font-medium">
                    {user.email}
                    {user.displayName && ` (${user.displayName})`}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <p className="text-gray-500 text-center py-4">No captains, sponsors, or admins found</p>
            )}
          </div>
        </div>
      </div>

      {/* Role Change Confirmation Dialog */}
      <Dialog 
        open={showConfirmation} 
        onClose={handleCancelRoleChange}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-xl bg-white p-8">
            <Dialog.Title className="text-2xl font-semibold text-[#0A2540] mb-4">
              {pendingUpdate?.role === 'admin' ? 'Confirm Admin Privileges' : 'Confirm Sponsor Privileges'}
            </Dialog.Title>
            
            <p className="text-gray-600 mb-4">
              You are about to grant <span className="font-semibold">{pendingUpdate?.email}</span> 
              {pendingUpdate?.role === 'admin' ? ' admin ' : ' sponsor '} 
              privileges. This will give them access to:
            </p>

            {pendingUpdate?.role === 'admin' ? (
              <ul className="list-disc pl-5 mb-6 text-gray-600 space-y-1">
                <li>Manage all user roles</li>
                <li>Access and modify all club visits</li>
                <li>Delete any club visit</li>
                <li>View all user data</li>
                <li>Approve any club listing</li>
              </ul>
            ) : (
              <ul className="list-disc pl-5 mb-6 text-gray-600 space-y-1">
                <li>Approve club listings from captains</li>
                <li>Manage clubs assigned to them</li>
                <li>View club visit data for their assigned clubs</li>
              </ul>
            )}

            <p className={`${pendingUpdate?.role === 'admin' ? 'text-amber-600' : 'text-purple-600'} font-medium mb-6`}>
              {pendingUpdate?.role === 'admin' 
                ? 'This action should only be performed for trusted individuals who need full administrative access.'
                : 'This action should only be performed for teachers or staff members who supervise clubs.'}
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelRoleChange}
                className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRoleChange}
                className={`px-6 py-2 rounded-lg text-white transition-colors ${
                  pendingUpdate?.role === 'admin' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {pendingUpdate?.role === 'admin' ? 'Confirm Admin Access' : 'Confirm Sponsor Access'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
} 