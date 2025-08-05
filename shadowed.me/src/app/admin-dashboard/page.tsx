'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, UserRole } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CogIcon, 
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface User {
  email: string;
  role?: UserRole;
  displayName?: string | null;
  id?: string;
  uniqueKey?: string;
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
  captainEmail?: string;
  description?: string;
  meetingInfo?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<ClubListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Fetch data
  const fetchUsers = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
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
                              <button className="text-blue-600 hover:text-blue-900">Edit</button>
                              <button className="text-red-600 hover:text-red-900">Delete</button>
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
                          <td className="px-6 py-4 text-sm text-gray-900">{club.sponsorEmail || 'Not assigned'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{club.captainEmail || 'Not assigned'}</td>
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
                              <button className="text-gray-600 hover:text-gray-900">Edit</button>
                              <button className="text-red-600 hover:text-red-900">Delete</button>
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
    </div>
  );
} 