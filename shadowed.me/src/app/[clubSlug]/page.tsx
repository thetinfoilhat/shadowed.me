'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTransition from '@/components/PageTransition';
import WebsiteEditor from '../../components/WebsiteEditor';
import WebsiteViewer from '../../components/WebsiteViewer';
import Link from 'next/link';
import { ClubSite } from '@/types/club';
import { DEFAULT_PRIMARY_COLOR, DEFAULT_TEXT_COLOR } from '@/utils/colors';
import { DEFAULT_FONT } from '@/utils/fonts';
import { toast } from 'react-hot-toast';

export default function ClubWebsitePage() {
  const { clubSlug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userRole, captainClubs } = useAuth();
  const [loading, setLoading] = useState(true);
  const [website, setWebsite] = useState<ClubSite | null>(null);
  const [isEditor, setIsEditor] = useState<boolean>(false);
  const [isNewWebsite, setIsNewWebsite] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Parse query parameters
  const isEditMode = searchParams.get('edit') === 'true';
  const isNew = searchParams.get('new') === 'true';
  const isPreview = searchParams.get('preview') === 'true';
  const initialClubName = searchParams.get('name');

  useEffect(() => {
    const checkAuth = async () => {
      if (isPreview) {
        // Skip auth check for preview mode - just show the current website data
        setLoading(false);
        return;
      }
      
      if (!user && !isPreview) {
        // For viewing, non-authenticated users can still see the site
        try {
          // Fetch the website data if it exists
          const websiteRef = doc(db, 'clubSites', clubSlug as string);
          const websiteDoc = await getDoc(websiteRef);
          
          if (websiteDoc.exists()) {
            const data = websiteDoc.data() as Omit<ClubSite, 'id'>;
            setWebsite({
              id: websiteDoc.id,
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
            });
          } else {
            // Website doesn't exist
            setError('This club website does not exist.');
          }
        } catch (err) {
          console.error('Error fetching club website:', err);
          setError('Failed to load club website. Please try again later.');
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch the website data first to check permissions
        const websiteRef = doc(db, 'clubSites', clubSlug as string);
        const websiteDoc = await getDoc(websiteRef);
        
        if (websiteDoc.exists()) {
          const data = websiteDoc.data() as Omit<ClubSite, 'id'>;
          const websiteData = {
            id: websiteDoc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt)
          };
          
          setWebsite(websiteData);
          
          // Check permissions for editing
          if (user) {
            // Admins can edit any club
            if (userRole === 'admin') {
              setIsEditor(true);
            } 
            // Captains can edit clubs they're assigned to
            else if (userRole === 'captain') {
              const userEmail = user.email;
              
              // Check multiple ways a captain might be assigned to this club
              const isCaptain = 
                // Check if club is in user's captainClubs array (captainClubs contains IDs, not slugs)
                (captainClubs && captainClubs.includes(websiteData.id)) ||
                // Check if user's email is in the captainEmails array
                (Array.isArray(websiteData.captainEmails) && websiteData.captainEmails.includes(userEmail!)) ||
                // Check if user's email is in the captains array (legacy)
                (Array.isArray(websiteData.captains) && websiteData.captains.includes(userEmail!)) ||
                // Check if user's email matches the single captain field (legacy)
                (websiteData.captain === userEmail) ||
                // Check if user's email is mentioned in jamboreeMeetingInfo.captains string
                (websiteData.jamboreeMeetingInfo?.captains && 
                 typeof websiteData.jamboreeMeetingInfo.captains === 'string' && 
                 websiteData.jamboreeMeetingInfo.captains.includes(userEmail!)) ||
                // Check if user created this website
                (websiteData.createdBy === user.uid);
              
              // Debug logging for captain permissions
              console.log('Captain permission check:', {
                userEmail,
                userRole,
                clubSlug,
                websiteId: websiteData.id,
                captainClubs,
                captainEmails: websiteData.captainEmails,
                captains: websiteData.captains,
                captain: websiteData.captain,
                jamboreeCaptains: websiteData.jamboreeMeetingInfo?.captains,
                createdBy: websiteData.createdBy,
                userUid: user.uid,
                isCaptain
              });
              
              if (isCaptain) {
                setIsEditor(true);
              }
            }
            // Sponsors can edit clubs assigned to them
            else if (userRole === 'sponsor') {
              const userEmail = user.email;
              
              const isSponsor = 
                // Check if user's email is in the sponsorEmails array
                (Array.isArray(websiteData.sponsorEmails) && websiteData.sponsorEmails.includes(userEmail!)) ||
                // Check if user's email matches the single sponsorEmail field (legacy)
                (websiteData.sponsorEmail === userEmail) ||
                // Check if user's email is mentioned in jamboreeMeetingInfo.sponsor string
                (websiteData.jamboreeMeetingInfo?.sponsor && 
                 typeof websiteData.jamboreeMeetingInfo.sponsor === 'string' && 
                 websiteData.jamboreeMeetingInfo.sponsor.includes(userEmail!));
              
              if (isSponsor) {
                setIsEditor(true);
              }
            }
          }
        } else if (isNew && user) {
          // Handle new website creation
          setIsNewWebsite(true);
          setEditMode(true);
          setIsCreatingNew(true);
          
          // Create initial data for new club website
          if (initialClubName) {
            setWebsite({
              id: clubSlug as string,
              clubName: initialClubName,
              slug: clubSlug as string,
              createdBy: user.uid,
              createdAt: new Date(),
              updatedAt: new Date(),
              theme: {
                primaryColor: DEFAULT_PRIMARY_COLOR.id,
                textColor: DEFAULT_TEXT_COLOR.id,
                font: DEFAULT_FONT.id
              }
            });
          }
        } else {
          // Website doesn't exist
          setError('This club website does not exist.');
        }
      } catch (err) {
        console.error('Error fetching club website:', err);
        setError('Failed to load club website. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isEditor,clubSlug, user, isNew, initialClubName, isPreview, userRole, captainClubs]);

  useEffect(() => {
    // Set edit mode based on URL parameter and user permission
    console.log('Edit mode check:', { isEditMode, isEditor, editMode });
    if (isEditMode && isEditor && !editMode) {
      setEditMode(true);
    }
  }, [isEditMode, isEditor, editMode]);

  // Save website data
  const saveWebsite = async (data: Partial<ClubSite>) => {
    if (!isEditor || !user) return false;
    
    try {
      const websiteRef = doc(db, 'clubSites', clubSlug as string);
      
      // Clean data - remove any undefined values as Firebase doesn't support them
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);
      
      // If it's a complete save (not a partial update), add updated timestamp
      if (!Object.keys(data).includes('updatedAt')) {
        cleanData.updatedAt = new Date();
      }
      
      if (isNewWebsite && isCreatingNew) {
        // For a new website, create full document with metadata
        const newWebsiteData: ClubSite = {
          id: clubSlug as string,
          clubName: initialClubName || 'New Club',
          slug: clubSlug as string,
          createdBy: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          theme: {
            primaryColor: DEFAULT_PRIMARY_COLOR.id,
            textColor: DEFAULT_TEXT_COLOR.id,
            font: DEFAULT_FONT.id
          },
          ...cleanData as Partial<ClubSite>
        };
        
        // Set the full document (not merge)
        await setDoc(websiteRef, newWebsiteData);
        
        // Update local state
        setWebsite(newWebsiteData);
        
        // This is no longer a new site being created for the first time
        setIsCreatingNew(false);
        toast.success('Website created successfully!');
        
        // Update URL to remove new parameter
        router.replace(`/${clubSlug}?edit=true`);
      } else {
        // For updates to existing site, merge with existing data
        await setDoc(websiteRef, cleanData, { merge: true });
        
        // Update local state with the changes
        setWebsite(prev => prev ? { ...prev, ...cleanData as Partial<ClubSite> } : null);
      }
      
      return true;
    } catch (err) {
      console.error('Error saving club website:', err);
      toast.error('Failed to save changes');
      return false;
    }
  };

  // Add delete website function
  const deleteWebsite = async () => {
    if (!isEditor || !user) return;
    
    try {
      const websiteRef = doc(db, 'clubSites', clubSlug as string);
      await deleteDoc(websiteRef);
      
      // Redirect to jamboree page after successful deletion
      router.push('/clubs');
      toast.success('Website deleted successfully');
    } catch (err) {
      console.error('Error deleting club website:', err);
      toast.error('Failed to delete website');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="pt-[120px] min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Oops! {error}</h1>
            <p className="text-gray-600 mb-8">
              The club website you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Link 
              href="/clubs" 
              className="bg-[#38BFA1] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2DA891] transition-colors"
            >
              Return to Clubs Page
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!website) {
    return (
      <PageTransition>
        <div className="pt-[120px] min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Website Not Found</h1>
            <p className="text-gray-600 mb-8">
              This club doesn&apos;t have a website yet.
            </p>
            <Link 
              href="/clubs" 
              className="bg-[#38BFA1] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2DA891] transition-colors"
            >
              Return to Clubs Page
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      {editMode ? (
        <WebsiteEditor 
          website={website} 
          onSave={saveWebsite} 
          isNew={isNewWebsite}
        />
      ) : (
        <WebsiteViewer 
          website={website} 
          isEditor={isEditor}
          onDelete={deleteWebsite}
        />
      )}
    </PageTransition>
  );
} 