'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Tab } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon, PencilIcon, PlusIcon, UserIcon, LinkIcon, EyeIcon, MagnifyingGlassIcon, TableCellsIcon, ViewColumnsIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ClubSite {
  id: string;
  clubName: string;
  slug: string;
  category?: string;
  sponsorEmail?: string;
  captainEmail?: string;
  description?: string;
  meetingInfo?: string;
  jamboreeMeetingInfo?: {
    table?: string;
    email?: string;
  };
  activityTypes?: string[];
  updatedAt: Date;
}

interface User {
  uid: string;
  email: string;
  name?: string;
  role?: string;
}

export default function SponsorDashboard() {
  const { user, userRole } = useAuth();
  const [sponsoredClubs, setSponsoredClubs] = useState<ClubSite[]>([]);
  const [allClubs, setAllClubs] = useState<ClubSite[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubSite | null>(null);
  const [selectedCaptain, setSelectedCaptain] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingClub, setEditingClub] = useState<ClubSite | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const fetchSponsoredClubs = useCallback(async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const clubsRef = collection(db, 'clubSites');
      
      let clubsData: ClubSite[];
      
      if (userRole === 'admin') {
        // Admins see all clubs
        const querySnapshot = await getDocs(clubsRef);
        clubsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as ClubSite[];
      } else {
        // Sponsors only see clubs where they're assigned as sponsorEmail
        const q = query(clubsRef, where('sponsorEmail', '==', user.email));
        const querySnapshot = await getDocs(q);
        clubsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as ClubSite[];
      }
      
      setSponsoredClubs(clubsData);
    } catch (error) {
      console.error('Error fetching sponsored clubs:', error);
      toast.error('Failed to load sponsored clubs');
    } finally {
      setLoading(false);
    }
  }, [user?.email, userRole]);

  const fetchAllClubs = useCallback(async () => {
    try {
      const clubsRef = collection(db, 'clubSites');
      const querySnapshot = await getDocs(clubsRef);
      
      const clubsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ClubSite[];
      
      setAllClubs(clubsData);
    } catch (error) {
      console.error('Error fetching all clubs:', error);
      toast.error('Failed to load clubs');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const usersData = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as User[];
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      fetchSponsoredClubs();
      fetchAllClubs();
      fetchUsers();
    }
  }, [user, fetchSponsoredClubs, fetchAllClubs, fetchUsers]);

  const handleAssignSponsor = async (clubId: string) => {
    try {
      const clubRef = doc(db, 'clubSites', clubId);
      await updateDoc(clubRef, {
        sponsorEmail: user?.email
      });
      toast.success('Successfully assigned as sponsor');
      fetchSponsoredClubs();
      fetchAllClubs();
    } catch (error) {
      console.error('Error assigning sponsor:', error);
      toast.error('Failed to assign sponsor');
    }
  };

  const handleAssignCaptain = async () => {
    if (!selectedClub || !selectedCaptain) return;
    
    try {
      const clubRef = doc(db, 'clubSites', selectedClub.id);
      await updateDoc(clubRef, {
        captainEmail: selectedCaptain
      });
      toast.success('Captain assigned successfully');
      setSelectedClub(null);
      setSelectedCaptain('');
      setIsAssignModalOpen(false);
      fetchSponsoredClubs();
      fetchAllClubs();
    } catch (error) {
      console.error('Error assigning captain:', error);
      toast.error('Failed to assign captain');
    }
  };

  const handleRemoveSponsor = async (clubId: string) => {
    try {
      const clubRef = doc(db, 'clubSites', clubId);
      await updateDoc(clubRef, {
        sponsorEmail: null
      });
      toast.success('Removed as sponsor');
      fetchSponsoredClubs();
      fetchAllClubs();
    } catch (error) {
      console.error('Error removing sponsor:', error);
      toast.error('Failed to remove sponsor');
    }
  };

  // Bulk operations
  const handleBulkAssignSponsor = async () => {
    if (selectedClubs.size === 0) return;
    
    try {
      const promises = Array.from(selectedClubs).map(clubId => {
        const clubRef = doc(db, 'clubSites', clubId);
        return updateDoc(clubRef, { sponsorEmail: user?.email });
      });
      
      await Promise.all(promises);
      toast.success(`Assigned ${selectedClubs.size} clubs`);
      setSelectedClubs(new Set());
      setShowBulkActions(false);
      fetchSponsoredClubs();
      fetchAllClubs();
    } catch (error) {
      console.error('Error bulk assigning sponsor:', error);
      toast.error('Failed to assign clubs');
    }
  };

  const handleBulkAssignCaptain = async (captainEmail: string) => {
    if (selectedClubs.size === 0) return;
    
    try {
      const promises = Array.from(selectedClubs).map(clubId => {
        const clubRef = doc(db, 'clubSites', clubId);
        return updateDoc(clubRef, { captainEmail });
      });
      
      await Promise.all(promises);
      toast.success(`Assigned captain to ${selectedClubs.size} clubs`);
      setSelectedClubs(new Set());
      setShowBulkActions(false);
      fetchSponsoredClubs();
      fetchAllClubs();
    } catch (error) {
      console.error('Error bulk assigning captain:', error);
      toast.error('Failed to assign captain');
    }
  };

  const handleToggleClubSelection = (clubId: string) => {
    const newSelected = new Set(selectedClubs);
    if (newSelected.has(clubId)) {
      newSelected.delete(clubId);
    } else {
      newSelected.add(clubId);
    }
    setSelectedClubs(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    const currentClubs = viewMode === 'cards' ? filteredSponsoredClubs : filteredUnassignedClubs;
    if (selectedClubs.size === currentClubs.length) {
      setSelectedClubs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedClubs(new Set(currentClubs.map(club => club.id)));
      setShowBulkActions(true);
    }
  };

  // Quick edit functionality
  const handleQuickEdit = async (clubId: string, field: string, value: string) => {
    try {
      const clubRef = doc(db, 'clubSites', clubId);
      await updateDoc(clubRef, { [field]: value });
      toast.success('Updated successfully');
      fetchSponsoredClubs();
      fetchAllClubs();
    } catch (error) {
      console.error('Error updating club:', error);
      toast.error('Failed to update');
    }
  };

  const handleStartEdit = (club: ClubSite) => {
    setEditingClub(club);
  };

  const handleSaveEdit = async () => {
    if (!editingClub) return;
    
    try {
      const clubRef = doc(db, 'clubSites', editingClub.id);
      await updateDoc(clubRef, {
        clubName: editingClub.clubName,
        description: editingClub.description,
        meetingInfo: editingClub.meetingInfo,
        category: editingClub.category
      });
      toast.success('Club updated successfully');
      setEditingClub(null);
      fetchSponsoredClubs();
      fetchAllClubs();
    } catch (error) {
      console.error('Error updating club:', error);
      toast.error('Failed to update club');
    }
  };

  const handleCancelEdit = () => {
    setEditingClub(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-[#38BFA1]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-3xl font-semibold text-[#0A2540] mb-4">
              Please Sign In
            </h1>
            <p className="text-gray-600 mb-8">
              Sign in to manage your sponsored clubs
            </p>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[data-login-button]')?.click()}
              className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors inline-flex items-center gap-2"
            >
              <span>Sign In</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is a sponsor or admin
  if (userRole !== 'sponsor' && userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full px-6 text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🚫</span>
            </div>
            <h1 className="text-3xl font-semibold text-[#0A2540] mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-8">
              You must be a sponsor or admin to access this dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter clubs based on search query and filters
  const filterClubs = (clubs: ClubSite[]) => {
    let filtered = clubs;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(club => 
        club.clubName.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(club => 
        club.category === categoryFilter
      );
    }
    
    // Status filter
    if (statusFilter) {
      if (statusFilter === 'assigned') {
        filtered = filtered.filter(club => club.sponsorEmail);
      } else if (statusFilter === 'unassigned') {
        filtered = filtered.filter(club => !club.sponsorEmail);
      } else if (statusFilter === 'has-captain') {
        filtered = filtered.filter(club => club.captainEmail);
      } else if (statusFilter === 'no-captain') {
        filtered = filtered.filter(club => !club.captainEmail);
      }
    }
    
    return filtered;
  };

  const filteredSponsoredClubs = filterClubs(sponsoredClubs);
  const unassignedClubs = allClubs.filter(club => !club.sponsorEmail);
  const filteredUnassignedClubs = filterClubs(unassignedClubs);

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540] mb-4">
              {userRole === 'admin' ? 'Admin Club Management' : 'Sponsor Dashboard'}
            </h1>
            <p className="text-gray-600 max-w-2xl">
              {userRole === 'admin' 
                ? 'Manage all clubs, assign sponsors and captains, and view club websites.'
                : 'Manage your sponsored clubs, assign captains, and view club websites.'
              }
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search clubs by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1] sm:text-sm"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-[#38BFA1] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Card View"
              >
                <ViewColumnsIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-[#38BFA1] text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Table View"
              >
                <TableCellsIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
            >
              <option value="">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Music, Arts, & Performing Arts">Music, Arts, & Performing Arts</option>
              <option value="Sports & Athletics">Sports & Athletics</option>
              <option value="Technology & Engineering">Technology & Engineering</option>
              <option value="Leadership & Service">Leadership & Service</option>
              <option value="Cultural & International">Cultural & International</option>
              <option value="Science & Math">Science & Math</option>
              <option value="Other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
            >
              <option value="">All Status</option>
              <option value="assigned">Assigned to Sponsor</option>
              <option value="unassigned">Unassigned</option>
              <option value="has-captain">Has Captain</option>
              <option value="no-captain">No Captain</option>
            </select>

            {/* Clear Filters */}
            {(categoryFilter || statusFilter) && (
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setStatusFilter('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-[#F0F9F6] p-1 mb-8">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected 
                  ? 'bg-[#38BFA1] text-white shadow'
                  : 'text-[#0A2540] hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }
            >
              {userRole === 'admin' ? 'All Clubs' : 'My Sponsored Clubs'} ({filteredSponsoredClubs.length})
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                ${selected 
                  ? 'bg-[#38BFA1] text-white shadow'
                  : 'text-[#0A2540] hover:bg-white/[0.12] hover:text-[#38BFA1]'
                }`
              }
            >
              {userRole === 'admin' ? 'Unassigned Clubs' : 'Available Clubs'} ({filteredUnassignedClubs.length})
            </Tab>
          </Tab.List>
          
          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedClubs.size} club{selectedClubs.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => setSelectedClubs(new Set())}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear Selection
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {userRole === 'admin' && (
                    <button
                      onClick={handleBulkAssignSponsor}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Assign as Sponsor
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const captainEmail = prompt('Enter captain email:');
                      if (captainEmail) {
                        handleBulkAssignCaptain(captainEmail);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Assign Captain
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <Tab.Panels>
            {/* My Sponsored Clubs */}
            <Tab.Panel>
              {filteredSponsoredClubs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">
                    {searchQuery.trim() 
                      ? 'No clubs match your search'
                      : userRole === 'admin' ? 'No clubs found' : 'You haven\'t sponsored any clubs yet'
                    }
                  </p>
                  <p className="text-sm text-gray-400">
                    {searchQuery.trim()
                      ? 'Try adjusting your search terms'
                      : userRole === 'admin' 
                        ? 'All clubs are currently assigned to sponsors'
                        : 'Go to "Available Clubs" to assign yourself as a sponsor'
                    }
                  </p>
                </div>
              ) : (
                <>
                  {/* Select All Checkbox */}
                  <div className="mb-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedClubs.size === filteredSponsoredClubs.length && filteredSponsoredClubs.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-[#38BFA1] focus:ring-[#38BFA1]"
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </div>

                  {viewMode === 'cards' ? (
                    <div className="space-y-6">
                      {filteredSponsoredClubs.map((club) => (
                        <div key={club.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                          <div className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedClubs.has(club.id)}
                                  onChange={() => handleToggleClubSelection(club.id)}
                                  className="rounded border-gray-300 text-[#38BFA1] focus:ring-[#38BFA1]"
                                />
                                <div className="flex-1">
                                  <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{club.clubName}</h2>
                                  <p className="text-sm text-gray-500 mb-4">
                                    Category: {club.category || 'Uncategorized'} • 
                                    Updated: {club.updatedAt.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {userRole === 'admin' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {club.sponsorEmail ? 'Assigned' : 'Unassigned'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Sponsored
                                  </span>
                                )}
                                {userRole !== 'admin' && (
                                  <button
                                    onClick={() => handleRemoveSponsor(club.id)}
                                    className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                                    title="Remove as sponsor"
                                  >
                                    <XCircleIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                        
                                                  <div className="mt-4 space-y-3">
                            {club.description && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Description:</span>
                                <p className="mt-1 text-gray-900">{club.description}</p>
                              </div>
                            )}
                            {club.meetingInfo && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Meetings:</span>
                                <span className="ml-2 text-gray-900">{club.meetingInfo}</span>
                              </div>
                            )}
                            {club.jamboreeMeetingInfo?.table && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Jamboree Table:</span>
                                <span className="ml-2 text-gray-900">{club.jamboreeMeetingInfo.table}</span>
                              </div>
                            )}
                            {club.jamboreeMeetingInfo?.email && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Contact:</span>
                                <span className="ml-2 text-gray-900">{club.jamboreeMeetingInfo.email}</span>
                              </div>
                            )}
                            {userRole === 'admin' && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Sponsor:</span>
                                <span className="ml-2 text-gray-900">
                                  {club.sponsorEmail || 'Not assigned'}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-medium text-gray-500">Captain:</span>
                              <span className="ml-2 text-gray-900">
                                {club.captainEmail || 'Not assigned'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-6 flex space-x-3">
                            <a
                              href={`/${club.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <EyeIcon className="h-4 w-4 mr-2" />
                              View Club Site
                            </a>
                            <button
                              onClick={() => {
                                setSelectedClub(club);
                                setSelectedCaptain(club.captainEmail || '');
                                setIsAssignModalOpen(true);
                              }}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <UserIcon className="h-4 w-4 mr-2" />
                              Assign Captain
                            </button>
                            {userRole === 'admin' && !club.sponsorEmail && (
                              <button
                                onClick={() => handleAssignSponsor(club.id)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                Assign Sponsor
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Table View */
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedClubs.size === filteredSponsoredClubs.length && filteredSponsoredClubs.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-[#38BFA1] focus:ring-[#38BFA1]"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Captain</th>
                          {userRole === 'admin' && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor</th>
                          )}
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredSponsoredClubs.map((club) => (
                          <tr key={club.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selectedClubs.has(club.id)}
                                onChange={() => handleToggleClubSelection(club.id)}
                                className="rounded border-gray-300 text-[#38BFA1] focus:ring-[#38BFA1]"
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{club.clubName}</div>
                                <div className="text-sm text-gray-500">{club.description?.substring(0, 50)}...</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">{club.category || 'Uncategorized'}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                userRole === 'admin' 
                                  ? (club.sponsorEmail ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {userRole === 'admin' ? (club.sponsorEmail ? 'Assigned' : 'Unassigned') : 'Sponsored'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">{club.captainEmail || 'Not assigned'}</td>
                            {userRole === 'admin' && (
                              <td className="px-4 py-4 text-sm text-gray-900">{club.sponsorEmail || 'Not assigned'}</td>
                            )}
                            <td className="px-4 py-4 text-sm font-medium">
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
                                  onClick={() => {
                                    setSelectedClub(club);
                                    setSelectedCaptain(club.captainEmail || '');
                                    setIsAssignModalOpen(true);
                                  }}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Assign Captain
                                </button>
                                {userRole === 'admin' && !club.sponsorEmail && (
                                  <button
                                    onClick={() => handleAssignSponsor(club.id)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Assign Sponsor
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                </>
              )}
            </Tab.Panel>
            
            {/* Available Clubs */}
            <Tab.Panel>
              {filteredUnassignedClubs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    {searchQuery.trim() ? 'No unassigned clubs match your search' : 'No unassigned clubs available'}
                  </p>
                  {searchQuery.trim() && (
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search terms</p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredUnassignedClubs.map((club) => (
                    <div key={club.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{club.clubName}</h2>
                            <p className="text-sm text-gray-500 mb-4">
                              Category: {club.category || 'Uncategorized'} • 
                              Updated: {club.updatedAt.toLocaleDateString()}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Unassigned
                          </span>
                        </div>
                        
                        <div className="mt-4 space-y-3">
                          {club.description && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Description:</span>
                              <p className="mt-1 text-gray-900">{club.description}</p>
                            </div>
                          )}
                          {club.meetingInfo && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Meetings:</span>
                              <span className="ml-2 text-gray-900">{club.meetingInfo}</span>
                            </div>
                          )}
                          {club.jamboreeMeetingInfo?.table && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Jamboree Table:</span>
                              <span className="ml-2 text-gray-900">{club.jamboreeMeetingInfo.table}</span>
                            </div>
                          )}
                          {userRole === 'admin' && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Sponsor:</span>
                              <span className="ml-2 text-gray-900">
                                {club.sponsorEmail || 'Not assigned'}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-500">Captain:</span>
                            <span className="ml-2 text-gray-900">
                              {club.captainEmail || 'Not assigned'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex space-x-3">
                          <a
                            href={`/${club.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Club Site
                          </a>
                          {userRole === 'admin' ? (
                            <button
                              onClick={() => handleAssignSponsor(club.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Assign Sponsor
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignSponsor(club.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Assign as Sponsor
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Assign Captain Modal */}
      {isAssignModalOpen && selectedClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign Captain</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Assign a captain to {selectedClub.clubName}
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Select Captain
              </label>
              <select
                value={selectedCaptain}
                onChange={(e) => setSelectedCaptain(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No captain assigned</option>
                {users
                  .filter(u => u.role === 'captain' || u.role === 'admin')
                  .map((user) => (
                    <option key={user.uid} value={user.email}>
                      {user.name || user.email} ({user.role})
                    </option>
                  ))}
              </select>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedClub(null);
                  setSelectedCaptain('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignCaptain}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Assign Captain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 