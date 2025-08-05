'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, UserRole } from '@/lib/firebase';
import { Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  PlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface User {
  email: string;
  role?: UserRole;
  displayName?: string | null;
  id?: string;
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
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
  const checkAdminStatus = async () => {
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
  };

  useEffect(() => {
    const initialize = async () => {
      await checkAdminStatus();
      await fetchUsers();
      await fetchClubs();
      setLoading(false);
    };
    initialize();
  }, [user, fetchUsers, fetchClubs]);

  // Bulk operations
  const handleBulkDelete = async (type: 'users' | 'clubs') => {
    if (selectedItems.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.size} ${type}?`)) {
      try {
        const promises = Array.from(selectedItems).map(id => {
          const ref = doc(db, type === 'users' ? 'users' : 'clubSites', id);
          return deleteDoc(ref);
        });
        
        await Promise.all(promises);
        toast.success(`Deleted ${selectedItems.size} ${type}`);
        setSelectedItems(new Set());
        setShowBulkActions(false);
        
        if (type === 'users') {
          fetchUsers();
        } else {
          fetchClubs();
        }
      } catch (error) {
        console.error(`Error bulk deleting ${type}:`, error);
        toast.error(`Failed to delete ${type}`);
      }
    }
  };

  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (items: (User | ClubListing)[]) => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedItems(new Set(items.map(item => item.id || '')));
      setShowBulkActions(true);
    }
  };

  // Filter functions
  const filterItems = (items: (User | ClubListing)[], query: string) => {
    if (!query.trim()) return items;
    
    const searchTerm = query.toLowerCase();
    return items.filter(item => {
      if ('email' in item) {
        // User
        return item.email.toLowerCase().includes(searchTerm) ||
               (item.displayName && item.displayName.toLowerCase().includes(searchTerm)) ||
               (item.role && item.role.toLowerCase().includes(searchTerm));
      } else {
        // Club
        return item.clubName.toLowerCase().includes(searchTerm) ||
               (item.category && item.category.toLowerCase().includes(searchTerm)) ||
               (item.description && item.description.toLowerCase().includes(searchTerm));
      }
    });
  };

  const filteredUsers = filterItems(users, searchQuery);
  const filteredClubs = filterItems(clubs, searchQuery);

  // User management functions
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserEditModal(true);
  };

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
      setShowUserEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleRemoveJoinedClub = async (userId: string, clubId: string) => {
    try {
      // Remove the club from user's joined clubs
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const joinedClubs = userData.joinedClubs || [];
        const updatedJoinedClubs = joinedClubs.filter((id: string) => id !== clubId);
        
        await updateDoc(userRef, { joinedClubs: updatedJoinedClubs });
        toast.success('Club removed from user');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error removing joined club:', error);
      toast.error('Failed to remove club from user');
    }
  };

  // Club management functions
  const handleEditClub = (club: ClubListing) => {
    setSelectedClub(club);
    setShowClubEditModal(true);
  };

  const handleUpdateClubAssignments = async (clubId: string, captains: string[], sponsors: string[]) => {
    try {
      // Get the current club data to find removed captains
      const clubRef = doc(db, 'clubSites', clubId);
      const clubDoc = await getDoc(clubRef);
      let previousCaptains: string[] = [];
      
      if (clubDoc.exists()) {
        const clubData = clubDoc.data();
        previousCaptains = clubData.captainEmails || clubData.captains || [];
      }
      
      // Find captains that have been removed
      const removedCaptains = previousCaptains.filter(email => !captains.includes(email));
      
      // Remove club from captainClubs array for removed captains
      if (removedCaptains.length > 0) {
        const usersRef = collection(db, 'users');
        for (const captainEmail of removedCaptains) {
          const userQuery = query(usersRef, where('email', '==', captainEmail));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            const currentCaptainClubs = userData.captainClubs || [];
            
            // Remove club from captain's captainClubs array
            const updatedCaptainClubs = currentCaptainClubs.filter((id: string) => id !== clubId);
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              captainClubs: updatedCaptainClubs
            });
          }
        }
      }
      
      // Get captain display names for jamboreeMeetingInfo
      const captainDisplayNames = [];
      if (captains.length > 0) {
        const usersRef = collection(db, 'users');
        for (const captainEmail of captains) {
          const userQuery = query(usersRef, where('email', '==', captainEmail));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            const displayName = userData.displayName || userData.name || captainEmail;
            captainDisplayNames.push(displayName);
          } else {
            captainDisplayNames.push(captainEmail);
          }
        }
      }
      
      await updateDoc(clubRef, {
        captainEmails: captains,
        sponsorEmails: sponsors,
        'jamboreeMeetingInfo.captains': captainDisplayNames.join(', '),
        updatedAt: new Date()
      });
      
      // Update captainClubs array for all assigned captains
      if (captains.length > 0) {
        const usersRef = collection(db, 'users');
        for (const captainEmail of captains) {
          const userQuery = query(usersRef, where('email', '==', captainEmail));
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            const currentCaptainClubs = userData.captainClubs || [];
            
            // Add club to captain's captainClubs array if not already there
            const updatedCaptainClubs = currentCaptainClubs.includes(clubId) 
              ? currentCaptainClubs 
              : [...currentCaptainClubs, clubId];
            
            await updateDoc(doc(db, 'users', userDoc.id), {
              captainClubs: updatedCaptainClubs
            });
          }
        }
      }
      
      toast.success('Club assignments updated successfully');
      fetchClubs();
      setShowClubEditModal(false);
      setSelectedClub(null);
    } catch (error) {
      console.error('Error updating club assignments:', error);
      toast.error('Failed to update club assignments');
    }
  };

  // Delete individual user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  // Helper functions to get sponsor and captain information
  const getSponsorInfo = (club: ClubListing): string => {
    if (club.sponsorEmails && club.sponsorEmails.length > 0) {
      return `${club.sponsorEmails.length} sponsor${club.sponsorEmails.length > 1 ? 's' : ''}`;
    } else if (club.sponsorEmail) {
      return '1 sponsor';
    }
    return 'Not assigned';
  };

  const getCaptainInfo = (club: ClubListing): string => {
    if (club.captainEmails && club.captainEmails.length > 0) {
      return `${club.captainEmails.length} captain${club.captainEmails.length > 1 ? 's' : ''}`;
    } else if (club.captains && club.captains.length > 0) {
      return `${club.captains.length} captain${club.captains.length > 1 ? 's' : ''}`;
    } else if (club.captainEmail) {
      return '1 captain';
    }
    return 'Not assigned';
  };

  // Delete individual club
  const handleDeleteClub = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete club document
      await deleteDoc(doc(db, 'clubSites', clubId));
      toast.success('Club deleted successfully');
      fetchClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    }
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-600 mt-2">Manage users, clubs, and system settings</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users, clubs, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedItems(new Set())}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkDelete(selectedTab === 0 ? 'users' : 'clubs')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow-sm mb-6">
            <Tab className={({ selected }) =>
              `flex items-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${
                selected 
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
              <UsersIcon className="h-5 w-5" />
              Users ({filteredUsers.length})
            </Tab>
            <Tab className={({ selected }) =>
              `flex items-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${
                selected 
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }>
              <BuildingOfficeIcon className="h-5 w-5" />
              Clubs ({filteredClubs.length})
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
                            checked={selectedItems.size === filteredUsers.length && filteredUsers.length > 0}
                            onChange={() => handleSelectAll(filteredUsers)}
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
                              checked={selectedItems.has(user.id || '')}
                              onChange={() => handleToggleSelection(user.id || '')}
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
                                 onClick={() => handleDeleteUser(user.id || '')}
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
                            checked={selectedItems.size === filteredClubs.length && filteredClubs.length > 0}
                            onChange={() => handleSelectAll(filteredClubs)}
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
                              checked={selectedItems.has(club.id)}
                              onChange={() => handleToggleSelection(club.id)}
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
                  onChange={(e) => handleUpdateUserRole(selectedUser.id || '', e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="student">Student</option>
                  <option value="captain">Captain</option>
                  <option value="sponsor">Sponsor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joined Clubs</label>
                <div className="max-h-32 overflow-y-auto">
                  {selectedUser.joinedClubs && selectedUser.joinedClubs.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.joinedClubs.map((clubId: string) => {
                        const club = clubs.find(c => c.id === clubId);
                        return club ? (
                          <div key={clubId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{club.clubName}</span>
                            <button
                              onClick={() => handleRemoveJoinedClub(selectedUser.id || '', clubId)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No joined clubs</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Club Edit Modal */}
      {showClubEditModal && selectedClub && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Club: {selectedClub.clubName}</h3>
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
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Captains (up to 4)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {users.filter(u => u.role === 'captain' || u.role === 'admin').map((user) => (
                    <label key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedClub.captains?.includes(user.email) || false}
                        onChange={(e) => {
                          const currentCaptains = selectedClub.captains || [];
                          if (e.target.checked && currentCaptains.length < 4) {
                            setSelectedClub({
                              ...selectedClub,
                              captains: [...currentCaptains, user.email]
                            });
                          } else if (!e.target.checked) {
                            setSelectedClub({
                              ...selectedClub,
                              captains: currentCaptains.filter(c => c !== user.email)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{user.email}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Sponsors (up to 4)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {users.filter(u => u.role === 'sponsor' || u.role === 'admin').map((user) => (
                    <label key={user.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedClub.sponsorEmails?.includes(user.email) || false}
                        onChange={(e) => {
                          const currentSponsors = selectedClub.sponsorEmails || [];
                          if (e.target.checked && currentSponsors.length < 4) {
                            setSelectedClub({
                              ...selectedClub,
                              sponsorEmails: [...currentSponsors, user.email]
                            });
                          } else if (!e.target.checked) {
                            setSelectedClub({
                              ...selectedClub,
                              sponsorEmails: currentSponsors.filter(s => s !== user.email)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{user.email}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowClubEditModal(false);
                    setSelectedClub(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateClubAssignments(
                    selectedClub.id,
                    selectedClub.captains || [],
                    selectedClub.sponsorEmails || []
                  )}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 