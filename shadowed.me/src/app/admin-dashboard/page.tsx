'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, doc, getDoc, setDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, UserRole, ROLE_HIERARCHY } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Dialog, Tab } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClubAssignmentModal from '@/components/ClubAssignmentModal';
import ClubModal from '@/components/ClubModal';
import Link from 'next/link';

interface User {
  email: string;
  role?: UserRole;
  displayName?: string | null;
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
  name: string;
  description: string;
  mission: string;
  meetingTimes: string;
  contactInfo: string;
  category: string;
  captain: string;
  sponsorEmail: string;
  createdAt: Date;
  status?: 'pending' | 'approved' | 'rejected';
  attributes?: string[];
  image?: string;
  bgColor?: string;
  bgGradient?: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  // Add a day to fix timezone offset issue
  date.setDate(date.getDate() + 1);
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString(undefined, options);
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
  const [visits, setVisits] = useState<VisitData[]>([]);
  const [sponsorNames, setSponsorNames] = useState<Record<string, string>>({});
  const [allClubs, setAllClubs] = useState<ClubListing[]>([]);
  const [selectedClub, setSelectedClub] = useState<ClubListing | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(true);

  const fetchSponsorNames = useCallback(async (visits: VisitData[]) => {
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
      
      setSponsorNames(namesMap);
    } catch (err) {
      console.error('Error fetching sponsor names:', err);
    }
  }, []);

  const fetchAllVisits = useCallback(async () => {
    try {
      const visitsRef = collection(db, 'opportunities');
      const querySnapshot = await getDocs(visitsRef);
      
      const visitsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'pending',
      })) as VisitData[];
      
      setVisits(visitsData);
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
        .map(doc => ({
          email: doc.data().email,
          role: doc.data().role as UserRole,
          displayName: doc.data().displayName
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
      const clubsRef = collection(db, 'clubs');
      const querySnapshot = await getDocs(clubsRef);
      
      const clubsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClubListing[];
      
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

  const handleApprove = async (visitId: string) => {
    try {
      const visitRef = doc(db, 'opportunities', visitId);
      await updateDoc(visitRef, {
        status: 'approved'
      });
      toast.success('Visit approved successfully');
      fetchAllVisits();
    } catch (error) {
      console.error('Error approving visit:', error);
      toast.error('Failed to approve visit');
    }
  };

  const handleReject = async (visitId: string) => {
    try {
      const visitRef = doc(db, 'opportunities', visitId);
      await updateDoc(visitRef, {
        status: 'rejected'
      });
      toast.success('Visit rejected');
      fetchAllVisits();
    } catch (error) {
      console.error('Error rejecting visit:', error);
      toast.error('Failed to reject visit');
    }
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
      await deleteDoc(doc(db, 'clubs', clubId));
      toast.success('Club deleted successfully');
      fetchAllClubs();
    } catch (error) {
      console.error('Error deleting club:', error);
      toast.error('Failed to delete club');
    }
  };

  const handleAssignClub = (club: ClubListing) => {
    setSelectedClub(club);
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

  const pendingVisits = visits.filter(visit => visit.status === 'pending');
  const approvedVisits = visits.filter(visit => visit.status === 'approved');
  const rejectedVisits = visits.filter(visit => visit.status === 'rejected');

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

        {/* Opportunities Management */}
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-8">
          <h2 className="text-xl font-semibold text-[#0A2540] mb-6">Manage All Opportunities</h2>
          
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
                Pending ({pendingVisits.length})
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
                Approved ({approvedVisits.length})
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
                Rejected ({rejectedVisits.length})
              </Tab>
            </Tab.List>
            
            <Tab.Panels>
              <Tab.Panel>
                {pendingVisits.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No pending visits to approve</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingVisits.map((visit) => (
                      <div key={visit.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h2>
                              <p className="text-sm text-gray-500 mb-1">
                                <span className="font-medium">Captain:</span> {visit.captain}
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                <span className="font-medium">Sponsor:</span> {visit.sponsorEmail} 
                                {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? ` (${sponsorNames[visit.sponsorEmail]})` : ''}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          </div>
                          
                          <div className="mt-4 space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Category:</span>
                              <span className="ml-2 text-gray-900">{visit.category}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Date:</span>
                              <span className="ml-2 text-gray-900">{formatDate(visit.date)}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Time:</span>
                              <span className="ml-2 text-gray-900">{visit.time}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Available Slots:</span>
                              <span className="ml-2 text-gray-900">{visit.slots}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Description:</span>
                              <p className="mt-1 text-gray-900">{visit.description}</p>
                            </div>
                          </div>
                          
                          <div className="mt-6 flex space-x-3">
                            <button
                              onClick={() => handleApprove(visit.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(visit.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XCircleIcon className="h-5 w-5 mr-2" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>
              
              <Tab.Panel>
                {approvedVisits.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No approved visits</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {approvedVisits.map((visit) => (
                      <div key={visit.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h2>
                              <p className="text-sm text-gray-500 mb-1">
                                <span className="font-medium">Captain:</span> {visit.captain}
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                <span className="font-medium">Approved by:</span> {visit.sponsorEmail}
                                {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? ` (${sponsorNames[visit.sponsorEmail]})` : ''}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          </div>
                          
                          <div className="mt-4 space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Category:</span>
                              <span className="ml-2 text-gray-900">{visit.category}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Date:</span>
                              <span className="ml-2 text-gray-900">{formatDate(visit.date)}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Time:</span>
                              <span className="ml-2 text-gray-900">{visit.time}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Available Slots:</span>
                              <span className="ml-2 text-gray-900">{visit.slots}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Description:</span>
                              <p className="mt-1 text-gray-900">{visit.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>
              
              <Tab.Panel>
                {rejectedVisits.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No rejected visits</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {rejectedVisits.map((visit) => (
                      <div key={visit.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                        <div className="p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="text-xl font-semibold text-[#0A2540] mb-2">{visit.name}</h2>
                              <p className="text-sm text-gray-500 mb-1">
                                <span className="font-medium">Captain:</span> {visit.captain}
                              </p>
                              <p className="text-sm text-gray-500 mb-4">
                                <span className="font-medium">Rejected by:</span> {visit.sponsorEmail}
                                {visit.sponsorEmail && sponsorNames[visit.sponsorEmail] ? ` (${sponsorNames[visit.sponsorEmail]})` : ''}
                              </p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Rejected
                            </span>
                          </div>
                          
                          <div className="mt-4 space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Category:</span>
                              <span className="ml-2 text-gray-900">{visit.category}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Date:</span>
                              <span className="ml-2 text-gray-900">{formatDate(visit.date)}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Time:</span>
                              <span className="ml-2 text-gray-900">{visit.time}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Available Slots:</span>
                              <span className="ml-2 text-gray-900">{visit.slots}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Description:</span>
                              <p className="mt-1 text-gray-900">{visit.description}</p>
                            </div>
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
                    .map((user) => (
              <div 
                key={user.email}
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
                    .map((user) => (
                      <div 
                        key={user.email}
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
            <h2 className="text-xl font-semibold">Clubs</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedClub(null);
                  setShowClubModal(true);
                }}
                className="px-4 py-2 bg-[#38BFA1] text-white rounded-md hover:bg-[#2A8E9E]"
              >
                Add Club
              </button>
            </div>
          </div>
          
          {loadingClubs ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Captain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allClubs.map((club) => (
                    <tr key={club.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{club.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{club.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {club.captain || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {club.sponsorEmail || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAssignClub(club)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClub(club);
                              setShowClubModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleClubDelete(club.id)}
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
          club={selectedClub}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}

      {showClubModal && (
        <ClubModal
          isOpen={showClubModal}
          onCloseAction={() => setShowClubModal(false)}
          onSubmitAction={fetchAllClubs}
          initialData={selectedClub}
        />
      )}
    </div>
  );
} 