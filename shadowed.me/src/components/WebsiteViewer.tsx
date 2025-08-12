'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LinkIcon, UserIcon, XMarkIcon, DocumentIcon, PencilIcon, TrashIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { ClubSite } from '@/types/club';
import { getColorById, getTextColorById } from '@/utils/colors';
import { getFontById } from '@/utils/fonts';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

// Format date for display (used for image metadata)
const formatUploadDate = (date: Date | string): string => {
  try {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return 'Invalid date';
  }
};

interface WebsiteViewerProps {
  website: ClubSite;
  isEditor?: boolean;
  onDelete?: () => Promise<void>;
}

export default function WebsiteViewer({ website, isEditor, onDelete }: WebsiteViewerProps) {
  const { user, userRole, captainClubs } = useAuth();
  const [canEdit, setCanEdit] = useState(false);
  
  // State for lightbox and gallery viewing
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [interestFormData, setInterestFormData] = useState({
    name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for user data
  const [captainUsers, setCaptainUsers] = useState<{email: string, name: string}[]>([]);
  const [sponsorUsers, setSponsorUsers] = useState<{email: string, name: string}[]>([]);

  // Function to open interest form with auto-filled user data
  const handleOpenInterestForm = () => {
    if (user) {
      // Auto-fill with user's information
      const displayName = user.displayName || '';
      const userEmail = user.email || '';
      
      setInterestFormData({
        name: displayName,
        email: userEmail
      });
    }
    setShowInterestForm(true);
  };
  
  // Check if various sections exist
  const hasGallery = website.galleryImages && website.galleryImages.length > 0;
  const hasMembers = website.members && website.members.length > 0;
  const hasContactLinks = website.contactLinks && website.contactLinks.length > 0;
  const hasMeetings = website.meetings && website.meetings.length > 0;
  
  // Get theme values
  const primaryColor = getColorById(website.theme?.primaryColor || 'teal').value;
  const textColor = getTextColorById(website.theme?.textColor || 'dark').value;
  const fontClass = getFontById(website.theme?.font || 'inter').className;
  
  // Fetch user data for captains and sponsors
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        // Fetch captain data
        if (website.captainEmails && website.captainEmails.length > 0) {
          const usersRef = collection(db, 'users');
          const captainUsersData: {email: string, name: string}[] = [];
          
          for (const email of website.captainEmails) {
            const userQuery = query(usersRef, where('email', '==', email));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              const userDoc = userSnapshot.docs[0];
              const userData = userDoc.data();
              captainUsersData.push({
                email: email,
                name: userData.displayName || userData.name || email
              });
            } else {
              captainUsersData.push({
                email: email,
                name: email
              });
            }
          }
          setCaptainUsers(captainUsersData);
        }
        
        // Fetch sponsor data
        if (website.sponsorEmails && website.sponsorEmails.length > 0) {
          const usersRef = collection(db, 'users');
          const sponsorUsersData: {email: string, name: string}[] = [];
          
          for (const email of website.sponsorEmails) {
            const userQuery = query(usersRef, where('email', '==', email));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              const userDoc = userSnapshot.docs[0];
              const userData = userDoc.data();
              sponsorUsersData.push({
                email: email,
                name: userData.displayName || userData.name || email
              });
            } else {
              sponsorUsersData.push({
                email: email,
                name: email
              });
            }
          }
          setSponsorUsers(sponsorUsersData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, [website.captainEmails, website.sponsorEmails]);

  // Check if the current user is authorized to edit this club website
  useEffect(() => {
    if (!user) {
      setCanEdit(false);
      return;
    }

    // Admins can edit any club
    if (userRole === 'admin') {
      setCanEdit(true);
      return;
    }

    // Check if the user is a captain assigned to this club
    if (userRole === 'captain') {
      const userEmail = user.email;
      
      // Check multiple ways a captain might be assigned to this club
      const isCaptain = 
        // Check if club is in user's captainClubs array
        (captainClubs && captainClubs.includes(website.id)) ||
        // Check if user's email is in the captainEmails array
        (Array.isArray(website.captainEmails) && website.captainEmails.includes(userEmail!)) ||
        // Check if user's email is in the captains array (legacy)
        (Array.isArray(website.captains) && website.captains.includes(userEmail!)) ||
        // Check if user's email matches the single captain field (legacy)
        (website.captain === userEmail) ||
        // Check if user's email is mentioned in jamboreeMeetingInfo.captains string
        (website.jamboreeMeetingInfo?.captains && 
         typeof website.jamboreeMeetingInfo.captains === 'string' && 
         website.jamboreeMeetingInfo.captains.includes(userEmail!)) ||
        // Check if user created this website
        (website.createdBy === user.uid);
      
      // Debug logging for captains
      console.log('Captain permission check:', {
        userEmail,
        userRole,
        websiteId: website.id,
        captainClubs,
        captainEmails: website.captainEmails,
        captains: website.captains,
        captain: website.captain,
        jamboreeCaptains: website.jamboreeMeetingInfo?.captains,
        createdBy: website.createdBy,
        userUid: user.uid,
        isCaptain
      });
      
      if (isCaptain) {
        setCanEdit(true);
        return;
      }
    }

    // Sponsors can edit clubs assigned to them
    if (userRole === 'sponsor') {
      const userEmail = user.email;
      
      // Check multiple ways a sponsor might be assigned to this club
      const isSponsor = 
        // Check if user's email is in the sponsorEmails array
        (Array.isArray(website.sponsorEmails) && website.sponsorEmails.includes(userEmail!)) ||
        // Check if user's email matches the single sponsorEmail field (legacy)
        (website.sponsorEmail === userEmail) ||
        // Check if user's email is mentioned in jamboreeMeetingInfo.sponsor string
        (website.jamboreeMeetingInfo?.sponsor && 
         typeof website.jamboreeMeetingInfo.sponsor === 'string' && 
         website.jamboreeMeetingInfo.sponsor.includes(userEmail!));
      
      if (isSponsor) {
        setCanEdit(true);
        return;
      }
    }

    setCanEdit(false);
  }, [user, userRole, website, captainClubs]);

  // Helper function to extract captain names from members array
  const getCaptains = (members?: { name: string; role: string }[]) => {
    if (!members || members.length === 0) return undefined;
    
    const captains = members
      .filter(m => m.role.toLowerCase().includes('captain'))
      .map(m => m.name);
      
    return captains.length > 0 ? captains.join(', ') : undefined;
  };

  // Function to get appropriate icon for contact links
  const getLinkIcon = (linkType: string) => {
    switch (linkType) {
      case 'email':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        );
      case 'twitter':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        );
      case 'facebook':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case 'remind':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 11h-3v3c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-3h-3c-.83 0-1.5-.67-1.5-1.5S7.67 10 8.5 10h3V7c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v3h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
          </svg>
        );
      case 'discord':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515c-.211.38-.415.77-.596 1.177a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.597-1.177c-1.652.37-3.3.88-4.885 1.515-3.07 4.67-3.906 9.226-3.484 13.727 2.003 1.494 3.913 2.41 5.773 3.014.463-.636.886-1.31 1.246-2.016-.685-.256-1.344-.555-1.971-.895.166-.125.328-.25.49-.379 3.865 1.86 8.104 1.86 11.92 0 .164.13.327.255.49.38-.63.34-1.29.638-1.97.895.36.706.783 1.38 1.246 2.016 1.86-.606 3.77-1.52 5.773-3.014.49-4.977-.72-9.51-3.483-13.728zM8.293 15.311c-1.117 0-2.04-1.043-2.04-2.33s.9-2.33 2.04-2.33c1.142 0 2.068 1.044 2.042 2.33 0 1.287-.9 2.33-2.042 2.33z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
  };

  // Function to navigate through images in the lightbox
  const navigateImage = (direction: 'next' | 'prev') => {
    if (!website.galleryImages || website.galleryImages.length === 0) return;
    
    if (direction === 'next') {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === website.galleryImages!.length - 1 ? 0 : prevIndex + 1
      );
      setSelectedImage(website.galleryImages[(currentImageIndex + 1) % website.galleryImages.length]);
    } else {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? website.galleryImages!.length - 1 : prevIndex - 1
      );
      setSelectedImage(website.galleryImages[currentImageIndex === 0 
        ? website.galleryImages.length - 1 
        : currentImageIndex - 1]);
    }
  };
  
  // Get the title of the current selected image
  const getImageTitle = (url: string): string | undefined => {
    if (!website.galleryImagesMetadata) return undefined;
    
    const metadata = website.galleryImagesMetadata.find(meta => meta.url === url);
    return metadata?.title;
  };

  // Handle interest form submission
  const handleInterestFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteId: website.id,
          ...interestFormData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('You have already submitted an interest form with this email');
        } else {
          toast.error(data.error || 'Failed to submit interest form');
        }
        throw new Error(data.error || 'Failed to submit interest form');
      }

      toast.success('Successfully joined club!');
      setShowInterestForm(false);
      setInterestFormData({ name: '', email: '' });
    } catch (error) {
      console.error('Error submitting interest form:', error);
      // Toast error is already shown in the if block above
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`pt-[80px] min-h-screen bg-[#FAFAFA] ${fontClass}`} style={{ color: textColor }}>
      {/* Add floating action buttons for authorized editors only */}
      {(isEditor || canEdit) && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
          <Link
            href={`/${website.slug}?edit=true`}
            className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            title="Edit Website"
          >
            <PencilIcon className="h-6 w-6 text-gray-700" />
          </Link>
          {(userRole === 'admin' || (userRole === 'captain' && canEdit)) && (
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this website? This action cannot be undone.')) {
                  if (onDelete) {
                    await onDelete();
                  }
                }
              }}
              className="bg-red-500 p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
              title="Delete Website"
            >
              <TrashIcon className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      )}
      


      {/* Banner Image Section */}
      <div 
        className="w-full h-[300px] md:h-[400px] relative bg-gradient-to-r from-blue-500 to-purple-500"
        style={{
          backgroundImage: website.bannerImage ? `url(${website.bannerImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: website.bannerImage ? undefined : primaryColor
        }}
      >
        <div className="absolute inset-0 bg-black/30 flex items-end">
          <div className="max-w-[1200px] w-full mx-auto px-4 md:px-8 py-8 md:py-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">
              {website.clubName}
            </h1>
            {website.slogan && (
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                {website.slogan}
              </p>
            )}
            {(website.category || website.activityTypes?.length || website.activityType) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {website.category && (
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                    {website.category}
                  </span>
                )}
                {website.activityTypes?.map((type: string, idx: number) => (
                  <span key={`activity-${idx}`} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm capitalize">
                    {type}
                  </span>
                ))}
                {!website.activityTypes?.length && website.activityType && (
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                    {website.activityType}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Section - 2/3 width */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Our Club Section */}
          {website.description && (
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
                About Our Club
              </h2>
              <div 
                className="prose prose-lg max-w-none" 
                style={{ color: textColor }} 
                dangerouslySetInnerHTML={{ __html: website.description }}
              />
            </div>
          )}

          {/* PDF Documents Section */}
          {website.pdfUploads && website.pdfUploads.length > 0 && (
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
                Information
              </h2>
              <div className="space-y-8">
                {website.pdfUploads.map((pdf, index) => (
                  <div key={`pdf-viewer-${index}`} className="w-full max-w-3xl mx-auto rounded-lg overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between bg-gray-50 p-3 border-b">
                      <div className="flex items-center max-w-[70%] overflow-hidden">
                        <DocumentIcon className="h-5 w-5 text-gray-700 mr-2 flex-shrink-0" />
                        <h3 className="font-medium text-gray-800 truncate">{pdf.fileName}</h3>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 flex-shrink-0">
                        {pdf.fileSize ? `${Math.round(pdf.fileSize / 1024)} KB • ` : ''}
                        {pdf.uploadedAt ? formatUploadDate(pdf.uploadedAt) : 'recently'}
                        <a 
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 text-blue-600 hover:text-blue-800 flex-shrink-0"
                          title="Open in new tab"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div className="w-full h-[380px] bg-gray-50">
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdf.url)}&embedded=true`}
                        className="w-full h-full border-none"
                        title={pdf.fileName}
                      ></iframe>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {hasGallery && (
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
                Photo Gallery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {website.galleryImages?.map((imageUrl, index) => (
                  <div 
                    key={`gallery-${index}`}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => {
                      setSelectedImage(imageUrl);
                      setCurrentImageIndex(index);
                    }}
                  >
                    <Image
                      src={imageUrl}
                      alt={getImageTitle(imageUrl) || `Gallery image ${index + 1}`}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-4">
                        <h3 className="font-medium mb-1">{getImageTitle(imageUrl) || `Image ${index + 1}`}</h3>
                        <p className="text-sm opacity-80">Click to view</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members Section */}
          {hasMembers && (
            <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
                Team Members
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {website.members?.map((member, index) => (
                  <div 
                    key={`member-${index}`}
                    className="flex flex-col sm:flex-row gap-4 rounded-lg p-4"
                    style={{ backgroundColor: `${primaryColor}10` }}
                  >
                    <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 relative">
                      {member.photoUrl ? (
                        <Image 
                          src={member.photoUrl} 
                          alt={member.name || 'Team member'} 
                          className="object-cover"
                          fill
                          sizes="100px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}20` }}
                        >
                          <UserIcon className="h-8 w-8" style={{ color: primaryColor }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#180D39] text-lg">{member.name}</h3>
                      <p className="font-medium mb-2" style={{ color: primaryColor }}>{member.role}</p>
                      {member.bio && (
                        <p className="text-sm text-[#180D39]/70">{member.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
           {/* Join Club card */}
           <div className="bg-white text-gray-900 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-3">Join this club?</h2>
            <p className="text-sm mb-4 text-gray-600">Join this club to stay updated and access exclusive information!</p>
            <button
              onClick={handleOpenInterestForm}
              className="w-full text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
              style={{ backgroundColor: primaryColor }}
            >
              Join Club
            </button>
            <p className="text-xs mt-2 text-gray-500 text-center">
              Join to receive updates and access club information!
            </p>
          </div>
          {/* Club Information Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
              Club Information
            </h2>
            
            <div className="space-y-4">
              {/* Meeting Details */}
              {website.meetingInfo && typeof website.meetingInfo === 'string' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Meeting Details</h3>
                  <div className="text-gray-800">
                    {website.meetingInfo.split('\n').map((paragraph, i) => (
                      paragraph ? <p key={i} className="mb-1">{paragraph}</p> : <br key={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Room */}
              {website.roomNumber && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Room</h3>
                  <p className="text-gray-800">{website.roomNumber}</p>
                </div>
              )}
              

            </div>
          </div>
          
          {/* Meetings Section */}
          {hasMeetings && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
                Upcoming Meetings
              </h2>
              
              <div className="space-y-4">
                {website.meetings
                  ?.filter(meeting => meeting.status === 'active')
                  .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                  .map((meeting, index) => (
                    <div key={`meeting-${index}`} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{meeting.title}</h3>
                        {meeting.isRecurring && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Recurring
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3 text-sm">{meeting.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(meeting.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(`2000-01-01T${meeting.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(`2000-01-01T${meeting.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span>Room {meeting.roomNumber}</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{meeting.currentParticipants}/{meeting.maxParticipants || '∞'} participants</span>
                        </div>
                      </div>
                      
                      {meeting.tags && meeting.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {meeting.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Club Leadership Section */}
          {((website.captainEmails && website.captainEmails.length > 0) || 
            (website.sponsorEmails && website.sponsorEmails.length > 0) ||
            website.jamboreeMeetingInfo?.captains || 
            website.jamboreeMeetingInfo?.sponsor ||
            getCaptains(website.members)) && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
                Club Leadership
              </h2>
              
              <div className="space-y-4">
                {/* Captains */}
                {((website.captainEmails && website.captainEmails.length > 0) || 
                  website.jamboreeMeetingInfo?.captains || 
                  getCaptains(website.members)) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Club Captain{(website.captainEmails && website.captainEmails.length > 1) || 
                        (website.jamboreeMeetingInfo?.captains?.includes(',')) ? 's' : ''}
                    </h3>
                    
                    {/* Display captains from captainEmails with names and emails */}
                    {captainUsers.length > 0 && (
                      <ul className="space-y-2">
                        {captainUsers.map((captain, idx) => (
                          <li key={`captain-${idx}`} className="flex items-center">
                            <span className="text-xl mr-2 text-blue-500" style={{ color: primaryColor }}>•</span>
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-medium">{captain.name}</span>
                              <span className="text-sm text-gray-500">{captain.email}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {/* Fallback to captainEmails if user data not loaded yet */}
                    {captainUsers.length === 0 && website.captainEmails && website.captainEmails.length > 0 && (
                      <ul className="space-y-2">
                        {website.captainEmails.map((captainEmail, idx) => (
                          <li key={`captain-${idx}`} className="flex items-center">
                            <span className="text-xl mr-2 text-blue-500" style={{ color: primaryColor }}>•</span>
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-medium">{captainEmail}</span>
                              <span className="text-sm text-gray-500">{captainEmail}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {/* Fallback to jamboreeMeetingInfo.captains */}
                    {(!website.captainEmails || website.captainEmails.length === 0) && 
                     website.jamboreeMeetingInfo?.captains && (
                      <div>
                        {website.jamboreeMeetingInfo.captains.includes(',') ? (
                          <ul className="space-y-1">
                            {website.jamboreeMeetingInfo.captains.split(/,\s*/).map((captain, idx) => (
                              <li key={`captain-${idx}`} className="flex items-center">
                                <span className="text-xl mr-2 text-blue-500" style={{ color: primaryColor }}>•</span>
                                <span className="text-gray-800">{captain}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-800">{website.jamboreeMeetingInfo.captains}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Fallback to members array */}
                    {(!website.captainEmails || website.captainEmails.length === 0) && 
                     !website.jamboreeMeetingInfo?.captains && 
                     getCaptains(website.members) && (
                      <p className="text-gray-800">{getCaptains(website.members)}</p>
                    )}
                  </div>
                )}
                
                {/* Sponsors */}
                {((website.sponsorEmails && website.sponsorEmails.length > 0) || 
                  website.jamboreeMeetingInfo?.sponsor) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Faculty Sponsor{(website.sponsorEmails && website.sponsorEmails.length > 1) || 
                        (website.jamboreeMeetingInfo?.sponsor?.includes(',')) ? 's' : ''}
                    </h3>
                    
                    {/* Display sponsors from sponsorEmails with names and emails */}
                    {sponsorUsers.length > 0 && (
                      <ul className="space-y-2">
                        {sponsorUsers.map((sponsor, idx) => (
                          <li key={`sponsor-${idx}`} className="flex items-center">
                            <span className="text-xl mr-2" style={{ color: primaryColor }}>•</span>
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-medium">{sponsor.name}</span>
                              <span className="text-sm text-gray-500">{sponsor.email}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {/* Fallback to sponsorEmails if user data not loaded yet */}
                    {sponsorUsers.length === 0 && website.sponsorEmails && website.sponsorEmails.length > 0 && (
                      <ul className="space-y-2">
                        {website.sponsorEmails.map((sponsorEmail, idx) => (
                          <li key={`sponsor-${idx}`} className="flex items-center">
                            <span className="text-xl mr-2" style={{ color: primaryColor }}>•</span>
                            <div className="flex flex-col">
                              <span className="text-gray-800 font-medium">{sponsorEmail}</span>
                              <span className="text-sm text-gray-500">{sponsorEmail}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    {/* Fallback to jamboreeMeetingInfo.sponsor */}
                    {(!website.sponsorEmails || website.sponsorEmails.length === 0) && 
                     website.jamboreeMeetingInfo?.sponsor && (
                      <div>
                        {website.jamboreeMeetingInfo.sponsor.includes(',') ? (
                          <ul className="space-y-1">
                            {website.jamboreeMeetingInfo.sponsor.split(/,\s*/).map((sponsor, idx) => (
                              <li key={`sponsor-${idx}`} className="flex items-center">
                                <span className="text-xl mr-2" style={{ color: primaryColor }}>•</span>
                                <span className="text-gray-800">{sponsor}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-800">{website.jamboreeMeetingInfo.sponsor}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Contact Email */}
                {website.jamboreeMeetingInfo?.email && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Contact Email</h3>
                    <a 
                      href={`mailto:${website.jamboreeMeetingInfo.email}`}
                      className="text-gray-800 hover:underline" 
                      style={{ color: primaryColor }}
                    >
                      {website.jamboreeMeetingInfo.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resources Section */}
          {website.resources && website.resources.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
                Resources
              </h2>
              <div className="space-y-3">
                {website.resources.map((resource, index) => (
                  <a
                    key={`resource-${index}`}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="mr-3 text-gray-700">
                      {resource.type === 'pdf' ? (
                        <DocumentIcon className="h-5 w-5" />
                      ) : (
                        <GlobeAltIcon className="h-5 w-5" />
                      )}
                    </span>
                    <div className="flex-1">
                      <span className="font-medium text-[#180D39]">{resource.title}</span>
                      {resource.description && (
                        <p className="text-sm text-gray-600">{resource.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        {resource.type === 'pdf' && resource.fileSize && 
                          `${Math.round(resource.fileSize / 1024)} KB • `
                        }
                        Added {formatUploadDate(resource.uploadedAt)}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Contact & Links */}
          {hasContactLinks && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#180D39] mb-4 border-b-2 pb-2" style={{ borderColor: primaryColor }}>
                Contact & Links
              </h2>
              <div className="space-y-3">
                {website.contactLinks?.map((link, index) => {
                  const url = link.type === 'email' 
                    ? `mailto:${link.url}` 
                    : link.url.startsWith('http') ? link.url : `https://${link.url}`;
                    
                  return (
                    <a 
                      key={`link-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="flex items-center justify-center w-8 h-8 rounded-full mr-3"
                        style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                      >
                        {getLinkIcon(link.type)}
                      </span>
                      <span className="font-medium text-[#180D39]">{link.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Back to Jamboree Link */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <Link 
              href="/clubs"
              className="flex items-center font-medium hover:underline"
              style={{ color: primaryColor }}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/clubs';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Jamboree
            </Link>
          </div>
        </div>
      </div>
      
      {/* Lightbox for Gallery Images */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            {/* Navigation buttons */}
            {website.galleryImages && website.galleryImages.length > 1 && (
              <>
                <button 
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={() => setSelectedImage(null)}
            >
              <XMarkIcon className="h-8 w-8" />
            </button>
            
            {/* Image container */}
            <div className="relative h-[80vh] w-[80vw] max-w-[1200px]" onClick={(e) => e.stopPropagation()}>
              <Image 
                src={selectedImage}
                alt={getImageTitle(selectedImage) || "Gallery image"}
                className="object-contain"
                fill
                sizes="80vw"
                priority
              />
              
              {getImageTitle(selectedImage) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4 text-white">
                  <h3 className="text-lg font-medium">{getImageTitle(selectedImage)}</h3>
                  <p className="text-sm opacity-70">
                    Image {currentImageIndex + 1} of {website.galleryImages?.length}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interest Form Modal */}
      <AnimatePresence>
        {showInterestForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowInterestForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#180D39]">Join {website.clubName}?</h2>
                <button
                  onClick={() => setShowInterestForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleInterestFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={interestFormData.name}
                    onChange={(e) => setInterestFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={interestFormData.email}
                    onChange={(e) => setInterestFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                    placeholder="Enter your email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg font-medium hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Joining...' : 'Join Club'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 