'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSpinner from '@/components/LoadingSpinner';
import PageTransition from '@/components/PageTransition';
import WebsiteEditor from '../../components/WebsiteEditor';
import WebsiteViewer from '../../components/WebsiteViewer';
import Link from 'next/link';

// Interface for club website data
interface ClubWebsiteData {
  id: string;
  clubName: string;
  slug: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  bannerImage?: string;
  slogan?: string;
  aboutSection?: string;
  meetingInfo?: string;
  galleryImages?: string[];
  officers?: {
    name: string;
    role: string;
    photoUrl?: string;
    bio?: string;
  }[];
  contactLinks?: {
    type: string;
    url: string;
    label: string;
  }[];
}

export default function ClubWebsitePage() {
  const { clubSlug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [website, setWebsite] = useState<ClubWebsiteData | null>(null);
  const [, setUserRole] = useState<string | null>(null);
  const [isEditor, setIsEditor] = useState<boolean>(false);
  const [isNewWebsite, setIsNewWebsite] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setUserClubs] = useState<string[]>([]);

  // Parse query parameters
  const isEditMode = searchParams.get('edit') === 'true';
  const isNew = searchParams.get('new') === 'true';
  const initialClubName = searchParams.get('name');

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);

          // If user is admin, they can edit any club
          if (role === 'admin') {
            setIsEditor(true);
          } else if (role === 'captain' || role === 'sponsor') {
            // Fetch clubs where user is captain or sponsor
            const clubsRef = collection(db, 'clubs');
            const captainQuery = query(clubsRef, where('captain', '==', user.email));
            const sponsorQuery = query(clubsRef, where('sponsorEmail', '==', user.email));
            
            const [captainSnapshot, sponsorSnapshot] = await Promise.all([
              getDocs(captainQuery),
              getDocs(sponsorQuery)
            ]);
            
            // Extract club names and convert to slugs
            const clubs: string[] = [];
            captainSnapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.name) {
                clubs.push(data.name.toLowerCase().replace(/\s+/g, '-'));
              }
            });
            
            sponsorSnapshot.docs.forEach(doc => {
              const data = doc.data();
              if (data.name) {
                clubs.push(data.name.toLowerCase().replace(/\s+/g, '-'));
              }
            });
            
            setUserClubs(clubs);
            
            // Check if user can edit this specific club
            if (clubs.includes(clubSlug as string)) {
              setIsEditor(true);
            }
          }
        }
        
        // Fetch the website data if it exists
        const websiteRef = doc(db, 'clubWebsites', clubSlug as string);
        const websiteDoc = await getDoc(websiteRef);
        
        if (websiteDoc.exists()) {
          const data = websiteDoc.data();
          setWebsite({
            id: websiteDoc.id,
            clubName: data.clubName,
            slug: data.slug,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            bannerImage: data.bannerImage,
            slogan: data.slogan,
            aboutSection: data.aboutSection,
            meetingInfo: data.meetingInfo,
            galleryImages: data.galleryImages,
            officers: data.officers,
            contactLinks: data.contactLinks
          });
        } else if (isNew) {
          // Handle new website creation
          setIsNewWebsite(true);
          setEditMode(true);
          
          // Create initial data for new club website
          if (initialClubName) {
            setWebsite({
              id: clubSlug as string,
              clubName: initialClubName,
              slug: clubSlug as string,
              createdBy: user.email || 'unknown',
              createdAt: new Date(),
              updatedAt: new Date()
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
  }, [clubSlug, user, isNew, initialClubName]);

  useEffect(() => {
    // Set edit mode based on URL parameter and user permission
    if (isEditMode && isEditor) {
      setEditMode(true);
    }
  }, [isEditMode, isEditor]);

  // Toggle between edit and view modes
  const toggleEditMode = () => {
    if (!isEditor) return;
    setEditMode(prev => !prev);
    
    // Update URL without reloading the page
    const newUrl = editMode 
      ? `/${clubSlug}` 
      : `/${clubSlug}?edit=true`;
    
    window.history.pushState({}, '', newUrl);
  };

  // Save website data
  const saveWebsite = async (data: Partial<ClubWebsiteData>) => {
    if (!isEditor || !user) return;
    
    try {
      const websiteRef = doc(db, 'clubWebsites', clubSlug as string);
      
      // Merge with existing data and update timestamp
      const updatedData = {
        ...website,
        ...data,
        updatedAt: new Date()
      };
      
      if (isNewWebsite) {
        // For a new website, also set creation metadata
        updatedData.createdAt = new Date();
        updatedData.createdBy = user.email || 'unknown';
        updatedData.slug = clubSlug as string;
      }
      
      // Update Firestore
      await setDoc(websiteRef, updatedData, { merge: true });
      
      // Update local state
      setWebsite(updatedData as ClubWebsiteData);
      
      // If this was a new website, clear the new flag
      if (isNewWebsite) {
        setIsNewWebsite(false);
        // Update URL to remove new parameter
        router.replace(`/${clubSlug}?edit=true`);
      }
      
      return true;
    } catch (err) {
      console.error('Error saving club website:', err);
      return false;
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
        <div className="min-h-screen pt-[100px] flex flex-col items-center justify-center px-4">
          <div className="text-6xl mb-6">🏫</div>
          <h1 className="text-3xl font-bold text-[#180D39] mb-4">Oops! Club Not Found</h1>
          <p className="text-[#180D39]/70 text-center mb-8 max-w-md">
            {error}
          </p>
          <Link 
            href="/jamboree" 
            className="bg-[#38BFA1] text-white px-6 py-3 rounded-full font-medium hover:bg-[#2DA891] transition-colors"
          >
            Back to Jamboree
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pb-16">
        {/* Control Bar for Editors */}
        {isEditor && website && (
          <div className="fixed bottom-6 right-6 z-50 bg-white rounded-full shadow-lg px-4 py-2 flex items-center space-x-3">
            {editMode ? (
              <>
                <button 
                  onClick={toggleEditMode}
                  className="bg-[#4361EE] text-white px-4 py-2 rounded-full font-medium hover:bg-[#3A54D4] transition-colors"
                >
                  Preview
                </button>
              </>
            ) : (
              <button 
                onClick={toggleEditMode}
                className="bg-[#38BFA1] text-white px-4 py-2 rounded-full font-medium hover:bg-[#2DA891] transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Render either the editor or viewer based on edit mode */}
        {website && (
          editMode && isEditor ? (
            <WebsiteEditor 
              website={website} 
              onSave={saveWebsite} 
              isNew={isNewWebsite}
            />
          ) : (
            <WebsiteViewer 
              website={website}
            />
          )
        )}
      </div>
    </PageTransition>
  );
} 