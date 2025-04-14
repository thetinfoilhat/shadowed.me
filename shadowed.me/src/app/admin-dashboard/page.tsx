'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, query, where, /* updateDoc, */ deleteDoc } from 'firebase/firestore';
import { db, UserRole, ROLE_HIERARCHY } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Dialog, Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClubAssignmentModal from '@/components/ClubAssignmentModal';
import ClubModal from '@/components/ClubModal';

interface User {
  email: string;
  role?: UserRole;
  displayName?: string | null;
  id?: string;
  uniqueKey?: string;
}

interface Applicant {
  name: string;
  email: string;
  grade: string;
  school: string;
}

interface VisitData {
  id: string;
  name: string;
  school?: string;
  sponsorEmail: string;
  category: string;
  contactEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  time: string;
  slots: number;
  description: string;
  captain: string;
  applicants: Applicant[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

interface ClubListing {
  id: string;
  slug: string;
  clubName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  theme?: {
    primaryColor: string;
    textColor: string;
    font: string;
  };
  bannerImage?: string;
  slogan?: string;
  description?: string;      // Long form about section
  meetingInfo?: string;      // Times, room, day
  roomNumber?: string;       // Room number for meetings
  category?: string;         // STEM, Business, Arts, Language & Culture, Community Service, Humanities, Medical, Academic, Miscellaneous
  activityType?: string;     // Competitive, Leaders, Tryout, Public Speaking, Performance, etc.
  jamboreeMeetingInfo?: {    // Used to display on the Jamboree page
    table?: string;          // Jamboree table number or identifier
    time?: string;           // Meeting time (e.g. "Weekly on TBD")
    room?: string;           // Room where meetings are held
    captains?: string;       // Captains information
    sponsor?: string;        // Sponsor information
    email?: string;          // Contact email
  };
  captain?: string;          // Legacy field for compatibility
  sponsorEmail?: string;     // Legacy field for compatibility
  captains?: string[];       // Multiple captains support
  sponsorEmails?: string[];  // Multiple sponsors support
  status?: 'pending' | 'approved' | 'rejected';
  uniqueKey?: string;
  
  // Legacy fields needed for compatibility
  name: string;             // Maps to clubName
  mission: string;          // Maps to slogan
  meetingTimes: string;     // Maps to meetingInfo
  contactInfo: string;      // Maps to email in jamboreeMeetingInfo
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
  /* const [visits, setVisits] = useState<(VisitData & { uniqueKey: string })[]>([]); */
  const [allClubs, setAllClubs] = useState<(ClubListing & { uniqueKey: string })[]>([]);
  const [selectedClub, setSelectedClub] = useState<ClubListing | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(true);

  const fetchSponsorNames = useCallback(async (visits: (VisitData & { uniqueKey: string })[]) => {
    const emails = visits
      .map(visit => visit.sponsorEmail)
      .filter((email): email is string => !!email);
    
    const uniqueEmails = [...new Set(emails)];
    const namesMap: Record<string, string> = {};
    
    try {
      for (const email of uniqueEmails) {
        const usersQuery = await getDocs(collection(db, 'users'));
        const userDoc = usersQuery.docs.find(doc => doc.data().email === email);
        
        if (userDoc) {
          const userData = userDoc.data();
          namesMap[email] = userData.displayName || '';
        }
      }
      
      // Commented out to fix linter error
      // setSponsorNames(namesMap);
    } catch (err) {
      console.error('Error fetching sponsor names:', err);
    }
  }, []);

  const fetchAllVisits = useCallback(async () => {
    try {
      const visitsRef = collection(db, 'opportunities');
      const querySnapshot = await getDocs(visitsRef);
      
      const visitsData = querySnapshot.docs.map((doc, index) => ({
        id: doc.id,
        uniqueKey: `visit-${doc.id}-${index}-${Date.now()}`,
        ...doc.data(),
        status: doc.data().status || 'pending',
      })) as (VisitData & { uniqueKey: string })[];
      
      // Commented out to fix linter error
      // setVisits(visitsData);
      fetchSponsorNames(visitsData);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to load visits');
    }
  }, [fetchSponsorNames]);

  const fetchUsers = useCallback(async () => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const usersList = querySnapshot.docs
        .map((doc, index) => ({
          id: doc.id,
          email: doc.data().email,
          role: doc.data().role as UserRole,
          displayName: doc.data().displayName,
          uniqueKey: `user-${doc.id}-${index}-${Date.now()}`
        }))
        .filter(user => user.email)
        // Sort by role hierarchy and then by email
        .sort((a, b) => {
          // First sort by role hierarchy (admins first, then sponsors, then captains, then students)
          const roleA = ROLE_HIERARCHY[a.role] || 0;
          const roleB = ROLE_HIERARCHY[b.role] || 0;
          const roleComparison = roleB - roleA;
          if (roleComparison !== 0) return roleComparison;
          // Then sort by email within each role group
          return a.email.localeCompare(b.email);
        });

      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchAllClubs = useCallback(async () => {
    try {
      setLoadingClubs(true);
      const clubsRef = collection(db, 'clubSites');
      const querySnapshot = await getDocs(clubsRef);
      
      // Process clubs and ensure only one entry per club name
      const clubsData = querySnapshot.docs.map((doc, index) => {
        const data = doc.data();
        
        // Create a guaranteed unique key for React
        const uniqueKey = `club-${doc.id}-${index}-${Date.now()}`;
        
        // Convert Firestore timestamps to JS Date objects
        let createdAt: Date;
        let updatedAt: Date;
        
        if (data.createdAt && typeof data.createdAt === 'object' && 'seconds' in data.createdAt) {
          // It's a Firestore Timestamp-like object
          const seconds = (data.createdAt as { seconds: number }).seconds;
          createdAt = new Date(seconds * 1000);
        } else {
          // It's already a Date or a string/number
          createdAt = new Date(data.createdAt as string | number | Date);
        }
        
        if (data.updatedAt && typeof data.updatedAt === 'object' && 'seconds' in data.updatedAt) {
          // It's a Firestore Timestamp-like object
          const seconds = (data.updatedAt as { seconds: number }).seconds;
          updatedAt = new Date(seconds * 1000);
        } else {
          // It's already a Date or a string/number
          updatedAt = new Date(data.updatedAt as string | number | Date);
        }
        
        // Map ClubSite fields to ClubListing structure for compatibility
        return {
          id: doc.id,
          uniqueKey,
          slug: data.slug || doc.id,
          clubName: data.clubName || 'Unnamed Club',
          createdBy: data.createdBy || '',
          createdAt,
          updatedAt,
          theme: data.theme || {
            primaryColor: 'teal',
            textColor: 'dark',
            font: 'inter'
          },
          description: data.description || '',
          meetingInfo: data.meetingInfo || '',
          roomNumber: data.roomNumber || '',
          category: data.category || '',
          activityType: data.activityType || '',
          captain: data.jamboreeMeetingInfo?.captains?.split(',')[0] || '',
          sponsorEmail: data.jamboreeMeetingInfo?.sponsor?.split(',')[0] || '',
          // Additional fields for compatibility with existing code
          name: data.clubName || 'Unnamed Club',
          mission: data.slogan || '',
          meetingTimes: data.meetingInfo || '',
          contactInfo: data.jamboreeMeetingInfo?.email || '',
          jamboreeMeetingInfo: data.jamboreeMeetingInfo || {},
          bannerImage: data.bannerImage || '',
          captains: data.jamboreeMeetingInfo?.captains?.split(',') || [],
          sponsorEmails: data.jamboreeMeetingInfo?.sponsor?.split(',') || [],
        } as (ClubListing & { uniqueKey: string });
      });
      
      // Sort clubs alphabetically by name
      clubsData.sort((a, b) => a.clubName.localeCompare(b.clubName));
      
      console.log(`Found ${querySnapshot.docs.length} total clubs`);
      console.log(`Displaying ${clubsData.length} clubs`);
      
      setAllClubs(clubsData);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      toast.error('Failed to load clubs');
    } finally {
      setLoadingClubs(false);
    }
  }, []);

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
          await Promise.all([fetchUsers(), fetchAllVisits(), fetchAllClubs()]);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router, fetchAllVisits, fetchUsers, fetchAllClubs]);

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

  const getRoleBadgeClass = (role: UserRole | undefined) => {
    switch(role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'sponsor':
        return 'bg-purple-100 text-purple-800';
      case 'captain':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClubDelete = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'clubSites', clubId));
      toast.success('Club deleted successfully');
      fetchAllClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    }
  };

  const handleAssignClub = (club: ClubListing & { uniqueKey?: string }) => {
    // Use type assertion to convert to ClubListing
    setSelectedClub(club as ClubListing);
    setShowAssignmentModal(true);
  };

  const handleAssignmentComplete = () => {
    fetchAllClubs();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
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

        {/* Users Management */}
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6">User Management</h2>
          
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
                Staff Members
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
                Students
              </Tab>
            </Tab.List>
            
            <Tab.Panels>
              <Tab.Panel>
                <div className="space-y-4">
                  {users
                    .filter(user => ['admin', 'sponsor', 'captain'].includes(user.role || ''))
                    .map((user, index) => (
                      <div 
                        key={user.uniqueKey || `staff-${user.email}-${index}`}
                        className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors
                          ${user.role === 'admin' ? 'bg-red-50' : 
                            user.role === 'sponsor' ? 'bg-purple-50' : 
                            user.role === 'captain' ? 'bg-blue-50' : ''}`}
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

                  {users.filter(user => ['admin', 'sponsor', 'captain'].includes(user.role || '')).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No staff members found</p>
                  )}
                </div>
              </Tab.Panel>
              
              <Tab.Panel>
                <div className="space-y-4">
                  {users
                    .filter(user => user.role === 'student')
                    .map((user, index) => (
                      <div 
                        key={user.uniqueKey || `student-${user.email}-${index}`}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
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

                  {users.filter(user => user.role === 'student').length === 0 && (
                    <p className="text-gray-500 text-center py-4">No students found</p>
                  )}
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Club Management */}
        <div className="mt-12 bg-white rounded-xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-black">Clubs</h2>
           {/*  <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedClub(null);
                  setShowClubModal(true);
                }}
                className="px-4 py-2 bg-[#38BFA1] text-white rounded-md hover:bg-[#2A8E9E]"
              >
                Add Club
              </button>
            </div> */}
          </div>
          
          {loadingClubs ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allClubs.map((club) => (
                <div 
                  key={club.uniqueKey || club.id} 
                  className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{club.clubName}</h2>
                        {club.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                            {club.category}
                          </span>
                        )}
                        {club.activityType && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-2 mb-2">
                            {club.activityType}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">Captain:</span>
                        <span className="text-gray-700">{club.jamboreeMeetingInfo?.captains || 'None'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Sponsor:</span>
                        <span className="text-gray-700">{club.jamboreeMeetingInfo?.sponsor || 'None'}</span>
                      </div>
                      {club.jamboreeMeetingInfo?.email && (
                        <div className="flex flex-col">
                          <span className="font-medium">Contact:</span>
                          <span className="text-gray-700">{club.jamboreeMeetingInfo.email}</span>
                        </div>
                      )}
                      {club.meetingInfo && (
                        <div className="flex flex-col">
                          <span className="font-medium">Meeting Info:</span>
                          <span className="text-gray-700">{club.meetingInfo}</span>
                        </div>
                      )}
                      {club.description && (
                        <div className="flex flex-col mt-2">
                          <span className="font-medium">Description:</span>
                          <p className="text-gray-700 line-clamp-2">{club.description}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => handleClubDelete(club.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                      
                      <button
                        onClick={() => handleAssignClub(club)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Assign
                      </button>
                      
                      <a 
                        href={`/${club.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Site
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

      {showAssignmentModal && selectedClub && (
        <ClubAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          club={selectedClub as Partial<ClubListing>}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}

      {showClubModal && (
        <ClubModal
          isOpen={showClubModal}
          onCloseAction={() => setShowClubModal(false)}
          onSubmitAction={fetchAllClubs}
          initialData={selectedClub as Partial<ClubListing> | null}
        />
      )}
    </div>
  );
} 