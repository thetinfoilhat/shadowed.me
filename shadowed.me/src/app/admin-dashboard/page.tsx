'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { db, UserRole } from '@/lib/firebase';
import { Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AdminOnly } from '@/components/RoleBasedAccess';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  role?: UserRole;
  displayName?: string | null;
  uniqueKey?: string;
  joinedClubs?: string[];
}

interface ClubListing {
  id: string;
  slug: string;
  clubName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  sponsorEmail?: string;
  sponsorEmails?: string[];
  captainEmail?: string;
  captainEmails?: string[];
  captains?: string[];
  description?: string;
  meetingInfo?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<ClubListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [showClubEditModal, setShowClubEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubListing | null>(null);

  // Fetch data
  const fetchUsers = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          role: data.role || 'student',
          displayName: data.displayName || null,
          uniqueKey: data.uniqueKey || '',
          joinedClubs: data.joinedClubs || [],
        } as User;
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  }, []);

  const fetchClubs = useCallback(async () => {
    try {
      const clubsRef = collection(db, 'clubSites');
      const querySnapshot = await getDocs(clubsRef);
      const clubsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ClubListing[];
      setClubs(clubsData);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
    }
  }, []);

  // Check admin status
  const checkAdminStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsAdmin(userData.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }, [user]);

  // Initialize data
  useEffect(() => {
    const initialize = async () => {
      await checkAdminStatus();
      if (isAdmin) {
        await Promise.all([fetchUsers(), fetchClubs()]);
        setLoading(false);
      }
    };
    
    if (user) {
      initialize();
    }
  }, [user, isAdmin, fetchUsers, fetchClubs, checkAdminStatus]);

  // Filter functions
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredClubs = clubs.filter(club =>
    club.clubName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (club.description && club.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Bulk actions
  const handleBulkDelete = async (type: 'users' | 'clubs') => {
    if (!confirm(`Are you sure you want to delete all selected ${type}?`)) return;
    
    try {
      if (type === 'users') {
        for (const userId of selectedUsers) {
          await deleteDoc(doc(db, 'users', userId));
        }
        setSelectedUsers(new Set());
        toast.success('Users deleted successfully');
        fetchUsers();
      } else {
        for (const clubId of selectedClubs) {
          await deleteDoc(doc(db, 'clubSites', clubId));
        }
        setSelectedClubs(new Set());
        toast.success('Clubs deleted successfully');
        fetchClubs();
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}`);
    }
  };

  const handleToggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const handleToggleClubSelection = (clubId: string) => {
    const newSelection = new Set(selectedClubs);
    if (newSelection.has(clubId)) {
      newSelection.delete(clubId);
    } else {
      newSelection.add(clubId);
    }
    setSelectedClubs(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const handleSelectAllUsers = (users: User[]) => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
      setShowBulkActions(true);
    }
  };

  const handleSelectAllClubs = (clubs: ClubListing[]) => {
    if (selectedClubs.size === clubs.length) {
      setSelectedClubs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedClubs(new Set(clubs.map(c => c.id)));
      setShowBulkActions(true);
    }
  };

  // User actions
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserEditModal(true);
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // Use the new API route to update user role and ensure continuity
      const response = await fetch('/api/user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          newRole,
          action: 'update'
        }),
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ));
        
        toast.success('User role updated successfully');
        setShowUserEditModal(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleRemoveJoinedClub = async (userId: string, clubId: string) => {
    if (!user?.email) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return;
      }
      
      const userData = userDoc.data();
      const joinedClubs = userData.joinedClubs || [];
      
      // Remove the club from user's joined clubs
      const updatedJoinedClubs = joinedClubs.filter((id: string) => id !== clubId);
      
      // Update the user document
      await updateDoc(userRef, {
        joinedClubs: updatedJoinedClubs
      });
      
      // Also remove from club's submissions for backward compatibility
      try {
        const clubRef = doc(db, 'clubSites', clubId);
        const clubDoc = await getDoc(clubRef);
        
        if (clubDoc.exists()) {
          const clubData = clubDoc.data();
          const submissions = clubData.interestForm?.submissions || [];
          const userSubmission = submissions.find(
            (submission: { email: string }) => submission.email === userData.email
          );
          
          if (userSubmission) {
            await updateDoc(clubRef, {
              'interestForm.submissions': arrayRemove(userSubmission)
            });
          }
        }
      } catch (error) {
        console.error('Error removing from club submissions:', error);
        // Don't fail the main operation if this fails
      }
      
      // Update the local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, joinedClubs: updatedJoinedClubs } : u
      ));
      
      toast.success('Club removed from user successfully');
    } catch (error) {
      console.error('Error removing joined club:', error);
      toast.error('Failed to remove joined club');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Club actions
  const handleEditClub = (club: ClubListing) => {
    setSelectedClub(club);
    setShowClubEditModal(true);
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club?')) return;
    
    try {
      await deleteDoc(doc(db, 'clubSites', clubId));
      toast.success('Club deleted successfully');
      fetchClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    }
  };

  // Helper functions
  const getSponsorInfo = (club: ClubListing): string => {
    const sponsors: string[] = [];
    if (club.sponsorEmails && club.sponsorEmails.length > 0) {
      sponsors.push(...club.sponsorEmails);
    }
    if (club.sponsorEmail && !sponsors.includes(club.sponsorEmail)) {
      sponsors.push(club.sponsorEmail);
    }
    return sponsors.length > 0 ? sponsors.join(', ') : 'None assigned';
  };

  const getCaptainInfo = (club: ClubListing): string => {
    const captains: string[] = [];
    if (club.captainEmails && club.captainEmails.length > 0) {
      captains.push(...club.captainEmails);
    }
    if (club.captainEmail && !captains.includes(club.captainEmail)) {
      captains.push(club.captainEmail);
    }
    if (club.captains && club.captains.length > 0) {
      club.captains.forEach(captain => {
        if (!captains.includes(captain)) {
          captains.push(captain);
        }
      });
    }
    return captains.length > 0 ? captains.join(', ') : 'None assigned';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You must be an admin to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminOnly>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
            <p className="text-gray-600 mt-2">Manage users, clubs, and system settings</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users or clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-red-800">
                  {selectedUsers.size + selectedClubs.size} items selected
                </span>
                <div className="flex gap-2">
                  {selectedUsers.size > 0 && (
                    <button
                      onClick={() => handleBulkDelete('users')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete {selectedUsers.size} Users
                    </button>
                  )}
                  {selectedClubs.size > 0 && (
                    <button
                      onClick={() => handleBulkDelete('clubs')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete {selectedClubs.size} Clubs
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border border-gray-200 mb-6">
              <Tab className={({ selected }) =>
                `w-full py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  selected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`
              }>
                <div className="flex items-center justify-center gap-2">
                  <UsersIcon className="h-5 w-5" />
                  Users ({filteredUsers.length})
                </div>
              </Tab>
              <Tab className={({ selected }) =>
                `w-full py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  selected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`
              }>
                <div className="flex items-center justify-center gap-2">
                  <BuildingOfficeIcon className="h-5 w-5" />
                  Clubs ({filteredClubs.length})
                </div>
              </Tab>
            </Tab.List>

            <Tab.Panels>
              {/* Users Panel */}
              <Tab.Panel>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                      <button className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <PlusIcon className="h-4 w-4" />
                        Add User
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                              onChange={() => handleSelectAllUsers(filteredUsers)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedUsers.has(user.id)}
                                onChange={() => handleToggleUserSelection(user.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">{user.displayName || 'No name'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'sponsor' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'captain' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role || 'student'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Tab.Panel>

              {/* Clubs Panel */}
              <Tab.Panel>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Club Management</h2>
                      <button className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <PlusIcon className="h-4 w-4" />
                        Add Club
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedClubs.size === filteredClubs.length && filteredClubs.length > 0}
                              onChange={() => handleSelectAllClubs(filteredClubs)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Captain</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClubs.map((club) => (
                          <tr key={club.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={selectedClubs.has(club.id)}
                                onChange={() => handleToggleClubSelection(club.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{club.clubName}</div>
                                <div className="text-sm text-gray-500">{club.description?.substring(0, 50)}...</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{club.category || 'Uncategorized'}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                club.status === 'approved' ? 'bg-green-100 text-green-800' :
                                club.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {club.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{getSponsorInfo(club)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{getCaptainInfo(club)}</td>
                            <td className="px-6 py-4 text-sm font-medium">
                              <div className="flex space-x-2">
                                <a
                                  href={`/${club.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </a>
                                <button 
                                  onClick={() => handleEditClub(club)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteClub(club.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* User Edit Modal */}
        {showUserEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit User</h3>
                <button
                  onClick={() => {
                    setShowUserEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{selectedUser.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <p className="text-gray-900">{selectedUser.displayName || 'Not set'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                  <select
                    value={selectedUser.role || 'student'}
                    onChange={(e) => handleUpdateUserRole(selectedUser.id, e.target.value as UserRole)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="student">Student</option>
                    <option value="captain">Captain</option>
                    <option value="sponsor">Sponsor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                {selectedUser.joinedClubs && selectedUser.joinedClubs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joined Clubs</label>
                    <div className="space-y-2">
                      {selectedUser.joinedClubs.map((clubId) => {
                        const club = clubs.find(c => c.id === clubId);
                        return (
                          <div key={clubId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">
                              {club ? club.clubName : clubId}
                            </span>
                            <button
                              onClick={() => handleRemoveJoinedClub(selectedUser.id, clubId)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Club Edit Modal */}
        {showClubEditModal && selectedClub && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Club</h3>
                <button
                  onClick={() => {
                    setShowClubEditModal(false);
                    setSelectedClub(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                  <p className="text-gray-900">{selectedClub.clubName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{selectedClub.category || 'Uncategorized'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedClub.status || 'pending'}
                    onChange={() => {
                      // Handle status update
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Captains</label>
                  <p className="text-gray-900">{getCaptainInfo(selectedClub)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Sponsors</label>
                  <p className="text-gray-900">{getSponsorInfo(selectedClub)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  );
} 