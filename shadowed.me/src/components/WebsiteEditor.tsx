'use client';
import { useState, ChangeEvent, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import Image from 'next/image';
import { COLOR_OPTIONS, getColorById } from '@/utils/colors';
import { uploadImage, uploadPDF, deleteFile, uploadPDFResource} from '@/utils/fileUpload';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// Icon imports
import { 
  PhotoIcon, 
  UserIcon, 
  LinkIcon, 
  PlusIcon, 
  TrashIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  EyeIcon,
  SwatchIcon,
  // PaintBrushIcon, // Removed since we commented out the design tab
  DocumentTextIcon,
  CheckIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

// Resource type definition
interface Resource {
  type: 'pdf' | 'link';
  title: string;
  description?: string;
  url: string;
  uploadedAt: Date;
  fileSize?: number;
}

export interface ClubSite {
  id: string;
  slug: string;
  clubName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  theme: {
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
  activityType?: string;     // Legacy single activity type
  activityTypes?: string[];  // New multi-select activity types
  jamboreeMeetingInfo?: {    // Used to display on the Jamboree page
    time?: string;           // Meeting time (e.g. "Weekly on TBD")
    room?: string;           // Room where meetings are held
    captains?: string;       // Captains information (display names as comma-separated string)
    sponsor?: string;        // Sponsor information (display names as comma-separated string)
    email?: string;          // Contact email
  };
  galleryImages?: string[];  // URLs to images
  galleryImagesMetadata?: {
    url: string;
    title?: string;
    caption?: string;
    uploadedAt: Date;
  }[];
  contactLinks?: {
    type: string;      // email, instagram, remind, etc.
    url: string;
    label: string;
  }[];
  members?: {
    name: string;
    role: string;
    photoUrl?: string;
    bio?: string;
  }[];
  resources?: Resource[];
  pdfUploads?: {
    fileName: string;
    url: string;
    uploadedAt: Date;
    fileSize?: number;
  }[];  // Deprecated: Use resources instead
  lastUpdated?: Date;
  featuredImage?: string;    // URL to featured image from gallery
  interestForm?: {
    enabled: boolean;
    submissions: {
      name: string;
      email: string;
      timestamp: number;
    }[];
  };
  meetingFrequency?: string;
  meetingSchedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  captains?: string[];       // Email addresses of captains (legacy)
  captainEmails?: string[];  // Email addresses of captains (new standard)
  captain?: string;          // Single captain email (legacy)
  sponsorEmails?: string[];  // Email addresses of sponsors
  sponsorEmail?: string;     // Single sponsor email (legacy)
  captainDetails?: {         // NEW: Store both email and display name together
    email: string;
    displayName: string;
  }[];
  sponsorDetails?: {         // NEW: Store both email and display name together
    email: string;
    displayName: string;
  }[];
}

// Member interface (formerly Officer)
interface Member {
  name: string;
  role: string;
  photoUrl?: string;
  bio?: string;
}

// Contact Link interface
interface ContactLink {
  type: string;
  url: string;
  label: string;
}

// PDF upload interface
interface PDFUpload {
  fileName: string;
  url: string;
  uploadedAt: Date;
  fileSize?: number;
}

// Theme interface
interface Theme {
  primaryColor: string;
  textColor: string;
  font: string;
}

// WebsiteEditorProps interface
interface WebsiteEditorProps {
  website: ClubSite;
  onSave: (data: Partial<ClubSite>) => Promise<boolean | undefined>;
  isNew?: boolean;
}

// Category color mapping
const CATEGORY_COLORS: Record<string, { bg: string, text: string, lighter: string }> = {
  'STEM': { bg: '#4285F4', text: '#ffffff', lighter: '#d0e0ff' },
  'Business': { bg: '#34A853', text: '#ffffff', lighter: '#d0f0d9' },
  'Music, Arts, & Performing Arts': { bg: '#FBBC05', text: '#000000', lighter: '#fff2d0' },
  'Language & Culture': { bg: '#8E44AD', text: '#ffffff', lighter: '#e9d0f0' },
  'Community Service & Leadership': { bg: '#3498DB', text: '#ffffff', lighter: '#d0e8f7' },
  'Humanities': { bg: '#E67E22', text: '#ffffff', lighter: '#fae0cc' },
  'Medical': { bg: '#1ABC9C', text: '#ffffff', lighter: '#d0f5ef' },
  'Academic': { bg: '#F1C40F', text: '#000000', lighter: '#fef7d0' },
  'Sports': { bg: '#2ECC71', text: '#ffffff', lighter: '#d5f9e0' },
  'Miscellaneous': { bg: '#95A5A6', text: '#ffffff', lighter: '#ebeeee' },
  // Keeping these for backward compatibility
  'Arts': { bg: '#FBBC05', text: '#000000', lighter: '#fff2d0' },
  'Community Service': { bg: '#3498DB', text: '#ffffff', lighter: '#d0e8f7' },
  'Performing Arts': { bg: '#E74C3C', text: '#ffffff', lighter: '#fad6d1' },
  'Technology': { bg: '#9B59B6', text: '#ffffff', lighter: '#ebdaf2' }
};

// Function to get color for category
const getCategoryColor = (category: string | undefined): { bg: string, text: string, lighter: string } => {
  if (!category || !(category in CATEGORY_COLORS)) {
    return { bg: '#38BFA1', text: '#ffffff', lighter: '#d9f5f0' }; // Default
  }
  return CATEGORY_COLORS[category];
};

// Tab types for website editor
type TabType = 'content' | 'media' | 'members' | 'design' | 'form';

export default function WebsiteEditor({ website, onSave, isNew = false }: WebsiteEditorProps) {
  // State variables
  const { /* user */ } = useAuth(); // Unused for now but component needs auth context
  const [formData, setFormData] = useState<ClubSite>({ ...website });
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingMemberPhoto, setUploadingMemberPhoto] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // User state for dropdowns
  const [captains, setCaptains] = useState<{id: string, email: string, displayName: string}[]>([]);
  const [sponsors, setSponsors] = useState<{id: string, email: string, displayName: string}[]>([]);
  const [selectedCaptains, setSelectedCaptains] = useState<string[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  
  // Refs for scrolling to sections
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  
  // UI states
  /* Commented out as no longer used - dropdown functionality removed
  const [expandedSection, setExpandedSection] = useState<string | null>('banner');
  */
  
  // Theme customization state
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  
  // Handle rich text editor state without ReactQuill
  const [editorContent, setEditorContent] = useState(formData.description || '');
  
  // Create a ref to store the handleSave function
  const handleSaveRef = useRef<(partialData?: Partial<ClubSite>) => Promise<void>>((async () => {}));
  
  // Format meeting information based on frequency and schedule
  const formatMeetingInfo = (frequency: string, schedule: { day: string; startTime: string; endTime: string }[]): string => {
    if (!schedule || schedule.length === 0) return '';
    
    const formatTime = (timeString: string): string => {
      try {
        // Convert 24-hour format to 12-hour format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 === 0 ? 12 : hour % 12;
        return `${hour12}:${minutes} ${period}`;
      } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
      }
    };
    
    // Day abbreviations mapping
    const dayAbbreviations: Record<string, string> = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    
    // Group meetings by day
    const meetingsByDay: Record<string, { startTime: string; endTime: string }[]> = {};
    
    schedule.forEach(meeting => {
      if (!meetingsByDay[meeting.day]) {
        meetingsByDay[meeting.day] = [];
      }
      meetingsByDay[meeting.day].push({
        startTime: formatTime(meeting.startTime),
        endTime: formatTime(meeting.endTime)
      });
    });
    
    // Format each day's meetings
    const formattedDays = Object.entries(meetingsByDay).map(([day, times]) => {
      // Use abbreviation for the day
      const dayAbbr = dayAbbreviations[day] || day;
      // Use hyphen instead of "to"
      const timeRanges = times.map(time => `${time.startTime}-${time.endTime}`).join(', ');
      return `${dayAbbr}: ${timeRanges}`;
    });
    
    // Combine with frequency
    return `${formattedDays.join(' | ')} (${frequency})`;
  };
  
  // Save the form data
  const handleSave = useCallback(async (partialData?: Partial<ClubSite>) => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const dataToSave = partialData || formData;
      
      // Filter out undefined values before saving to Firebase
      const cleanedData: Record<string, unknown> = {};
      
      // Safely copy non-undefined values
      Object.entries(dataToSave).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      // Add last updated timestamp
      if (!partialData) {
        cleanedData.updatedAt = new Date();
      }
      
      const success = await onSave(cleanedData as Partial<ClubSite>);
      
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (!partialData) {
          toast.success('All changes saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving website data:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSave]);
  
  // Store the latest handleSave in a ref
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);
  
  // Handle text input changes
  const handleInputChange = useCallback((field: keyof ClubSite, value: string | boolean | unknown) => {
    // Don't set undefined values to prevent Firebase errors
    if (value === undefined) {
      console.warn(`Attempted to set undefined value for field: ${field}`);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Set up debounced autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (handleSaveRef.current) {
        handleSaveRef.current({ [field]: value });
      }
    }, 2000);
    
    setAutosaveTimeout(timeout);
  }, [autosaveTimeout]);
  
  // Handle content editor tabs
  /* Commented out as no longer used - dropdown functionality removed
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
    
    // Scroll to section after state update
    setTimeout(() => {
      if (sectionsRef.current[section]) {
        sectionsRef.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  */

  // Update description when editor content changes
  useEffect(() => {
    if (editorContent !== formData.description) {
      handleInputChange('description', editorContent);
    }
  }, [editorContent, formData.description, handleInputChange]);

  // Handle nested properties like theme
  const handleThemeChange = (property: keyof Theme, value: string) => {
    setFormData(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [property]: value
      }
    }));
    
    // Set up debounced autosave for theme changes
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSave({ 
        theme: {
          ...formData.theme,
          [property]: value
        } 
      });
    }, 1000);
    
    setAutosaveTimeout(timeout);
  };

  // Save all form data at once
  const handleSaveAll = () => {
    // Clear any pending autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
      setAutosaveTimeout(null);
    }
    
    // Add updated timestamp
    const updatedData = {
      ...formData,
      updatedAt: new Date()
    };
    
    // Save the entire form
    handleSave(updatedData);
  };

  // Handle image uploads with improved error handling
  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>, 
    type: 'banner' | 'gallery' | 'member' | 'featured',
    memberIndex?: number
  ): Promise<string | undefined> => {
    const file = e.target.files?.[0];
    if (!file) {
      // Reset the file input
      e.target.value = '';
      return undefined;
    }
    
    // Set the appropriate loading state
    if (type === 'banner') {
      setUploadingBanner(true);
    } else if (type === 'member' && memberIndex !== undefined) {
      setUploadingMemberPhoto(memberIndex);
    }
    
    try {
      // Show feedback during upload
      const toastId = toast.loading('Uploading image...');
      
      // Use the utility function to upload the image
      const result = await uploadImage(file, formData.slug, type);
      
      if (!result.success) {
        toast.error(`Failed to upload image: ${result.error}`, { id: toastId });
        return undefined;
      }
      
      const downloadURL = result.url!;
      
      // Update the appropriate state based on image type
      if (type === 'banner') {
        setFormData(prev => ({
          ...prev,
          bannerImage: downloadURL
        }));
        await handleSave({ bannerImage: downloadURL });
      } else if (type === 'gallery') {
        const updatedGalleryImages = [...(formData.galleryImages || []), downloadURL];
        
        // Create metadata for the new image
        const updatedMetadata = [...(formData.galleryImagesMetadata || [])];
        updatedMetadata.push({
          url: downloadURL,
          uploadedAt: new Date()
        });
        
        setFormData(prev => ({
          ...prev,
          galleryImages: updatedGalleryImages,
          galleryImagesMetadata: updatedMetadata
        }));
        
        await handleSave({ 
          galleryImages: updatedGalleryImages,
          galleryImagesMetadata: updatedMetadata
        });
      } else if (type === 'featured') {
        setFormData(prev => ({
          ...prev,
          featuredImage: downloadURL
        }));
        
        await handleSave({ featuredImage: downloadURL });
      } else if (type === 'member' && memberIndex !== undefined) {
        const updatedMembers = [...(formData.members || [])];
        updatedMembers[memberIndex] = {
          ...updatedMembers[memberIndex],
          photoUrl: downloadURL
        };
        setFormData(prev => ({
          ...prev,
          members: updatedMembers
        }));
        await handleSave({ members: updatedMembers });
      }
      
      // Update toast to success
      toast.success('Image uploaded successfully', { id: toastId });
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
      return undefined;
    } finally {
      // Clear the loading state
      if (type === 'banner') {
        setUploadingBanner(false);
      } else if (type === 'member') {
        setUploadingMemberPhoto(null);
      }
      
      // Reset the file input
      e.target.value = '';
    }
  };
  
  // Handle PDF uploads
  const handlePDFUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = '';
      return;
    }
    
    const toastId = toast.loading('Uploading PDF...');
    
    try {
      const result = await uploadPDF(file, formData.slug);
      
      if (!result.success) {
        toast.error(`Failed to upload PDF: ${result.error}`, { id: toastId });
        return;
      }
      
      const newPDFUpload: PDFUpload = {
        fileName: file.name,
        url: result.url!,
        uploadedAt: new Date(),
        fileSize: file.size
      };
      
      const updatedPDFs = [...(formData.pdfUploads || []), newPDFUpload];
      
      setFormData(prev => ({
        ...prev,
        pdfUploads: updatedPDFs
      }));
      
      await handleSave({ pdfUploads: updatedPDFs });
      toast.success('PDF uploaded successfully', { id: toastId });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF. Please try again.', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };
  
  // Handle file deletion (images or PDFs)
  const handleFileDelete = async (fileUrl: string, type: 'gallery' | 'pdf') => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this file? This cannot be undone.');
      if (!confirmDelete) return;
      
      const toastId = toast.loading('Deleting file...');
      
      // Delete from storage using the utility function
      const deleted = await deleteFile(fileUrl);
      if (!deleted) {
        toast.error('Failed to delete file from storage', { id: toastId });
        return;
      }
      
      // Update state based on file type
      if (type === 'gallery') {
        const updatedGalleryImages = formData.galleryImages?.filter(img => img !== fileUrl) || [];
        const updatedMetadata = formData.galleryImagesMetadata?.filter(meta => meta.url !== fileUrl) || [];
        
        setFormData(prev => ({
          ...prev,
          galleryImages: updatedGalleryImages,
          galleryImagesMetadata: updatedMetadata
        }));
        
        await handleSave({ 
          galleryImages: updatedGalleryImages,
          galleryImagesMetadata: updatedMetadata
        });
      } else if (type === 'pdf') {
        const updatedPDFs = formData.pdfUploads?.filter(pdf => pdf.url !== fileUrl) || [];
        
        setFormData(prev => ({
          ...prev,
          pdfUploads: updatedPDFs
        }));
        
        await handleSave({ pdfUploads: updatedPDFs });
      }
      
      toast.success('File deleted successfully', { id: toastId });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file. Please try again.');
    }
  };

  // Handle members (formerly officers)
  const handleAddMember = () => {
    const newMember: Member = {
      name: '',
      role: ''
    };
    
    const updatedMembers = [...(formData.members || []), newMember];
    setFormData(prev => ({
      ...prev,
      members: updatedMembers
    }));
  };

  const handleRemoveMember = (indexToRemove: number) => {
    const updatedMembers = formData.members?.filter((_, index) => index !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      members: updatedMembers
    }));
    handleSave({ members: updatedMembers });
  };

  const handleMemberChange = (index: number, field: keyof Member, value: string) => {
    const updatedMembers = [...(formData.members || [])];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      members: updatedMembers
    }));
    
    // Set up debounced autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSave({ members: updatedMembers });
    }, 2000);
    
    setAutosaveTimeout(timeout);
  };

  // Handle contact links
  const handleAddContactLink = () => {
    const newContactLink: ContactLink = {
      type: 'website',
      url: '',
      label: ''
    };
    
    const updatedContactLinks = [...(formData.contactLinks || []), newContactLink];
    setFormData(prev => ({
      ...prev,
      contactLinks: updatedContactLinks
    }));
  };

  const handleRemoveContactLink = (indexToRemove: number) => {
    const updatedContactLinks = formData.contactLinks?.filter((_, index) => index !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      contactLinks: updatedContactLinks
    }));
    handleSave({ contactLinks: updatedContactLinks });
  };

  const handleContactLinkChange = (index: number, field: keyof ContactLink, value: string) => {
    const updatedContactLinks = [...(formData.contactLinks || [])];
    updatedContactLinks[index] = {
      ...updatedContactLinks[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      contactLinks: updatedContactLinks
    }));
    
    // Set up debounced autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSave({ contactLinks: updatedContactLinks });
    }, 2000);
    
    setAutosaveTimeout(timeout);
  };
  
  // Handle view site
  const handleViewSite = () => {
    window.location.href = `/${formData.slug}`;
  };

  // Handle resource upload
  const handleResourceUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = '';
      return;
    }
    
    const title = prompt('Enter a title for this resource:');
    if (!title) {
      e.target.value = '';
      return;
    }

    const description = prompt('Enter a description (optional):') || undefined;
    
    const toastId = toast.loading('Uploading resource...');
    
    try {
      const result = await uploadPDFResource(file, formData.slug, title, description);
      
      if (!result.success) {
        toast.error(`Failed to upload resource: ${result.error}`, { id: toastId });
        return;
      }
      
      if (!result.url) {
        toast.error('Failed to get resource URL', { id: toastId });
        return;
      }

      const newResource: Resource = {
        type: 'pdf',
        title: result.title,
        description: result.description,
        url: result.url,
        uploadedAt: result.uploadedAt,
        fileSize: result.fileSize
      };
      
      const updatedResources = [...(formData.resources || []), newResource];
      
      setFormData(prev => ({
        ...prev,
        resources: updatedResources
      }));
      
      await handleSave({ resources: updatedResources });
      toast.success('Resource uploaded successfully', { id: toastId });
    } catch (error) {
      console.error('Error uploading resource:', error);
      toast.error('Failed to upload resource. Please try again.', { id: toastId });
    } finally {
      e.target.value = '';
    }
  };

  // Handle adding a link resource
  const handleAddLinkResource = async () => {
    const title = prompt('Enter a title for this resource:');
    if (!title) return;

    let url = prompt('Enter the URL:');
    if (!url) return;

    // Ensure URL has protocol
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const description = prompt('Enter a description (optional):') || '';

    const newResource: Resource = {
      type: 'link',
      title,
      description,
      url,
      uploadedAt: new Date(),
      fileSize: 0
    };
    
    const updatedResources = [...(formData.resources || []), newResource];
    
    setFormData(prev => ({
      ...prev,
      resources: updatedResources
    }));
    
    await handleSave({ resources: updatedResources });
    toast.success('Link resource added successfully');
  };

  // Handle resource deletion
  const handleResourceDelete = async (resource: Resource) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this resource? This cannot be undone.');
      if (!confirmDelete) return;
      
      const toastId = toast.loading('Deleting resource...');
      
      // For PDF resources, delete the file from storage
      if (resource.type === 'pdf') {
        const deleted = await deleteFile(resource.url);
        if (!deleted) {
          toast.error('Failed to delete resource file', { id: toastId });
          return;
        }
      }
      
      // Update state
      const updatedResources = formData.resources?.filter(r => r.url !== resource.url) || [];
      
      setFormData(prev => ({
        ...prev,
        resources: updatedResources
      }));
      
      await handleSave({ resources: updatedResources });
      toast.success('Resource deleted successfully', { id: toastId });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource. Please try again.');
    }
  };

  // Fetch captains and sponsors
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const usersCollection = collection(db, 'users');
        
        // Fetch captains
        const captainsQuery = query(usersCollection, where('role', '==', 'captain'));
        const captainsSnapshot = await getDocs(captainsQuery);
        const captainsData = captainsSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email || '',
          displayName: doc.data().displayName || doc.data().email || '',
        }));
        setCaptains(captainsData);
        
        // Fetch sponsors
        const sponsorsQuery = query(usersCollection, where('role', '==', 'sponsor'));
        const sponsorsSnapshot = await getDocs(sponsorsQuery);
        const sponsorsData = sponsorsSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().email || '',
          displayName: doc.data().displayName || doc.data().email || '',
        }));
        setSponsors(sponsorsData);

        // Initialize arrays to hold the selected user emails
        let captainEmailsToSelect: string[] = [];
        let sponsorEmailsToSelect: string[] = [];
        
        // PRIORITY 1: Use captainDetails and sponsorDetails (most accurate with both email and display name)
        if (formData.captainDetails && formData.captainDetails.length > 0) {
          captainEmailsToSelect = formData.captainDetails.map(captain => captain.email);
        } 
        // PRIORITY 2: Use captainEmails array (new standard)
        else if (formData.captainEmails && formData.captainEmails.length > 0) {
          captainEmailsToSelect = formData.captainEmails;
        }
        // PRIORITY 3: Use captains array (direct emails) 
        else if (formData.captains && formData.captains.length > 0) {
          captainEmailsToSelect = formData.captains;
        } 
        // PRIORITY 4: Use single captain value (legacy)
        else if (formData.captain) {
          captainEmailsToSelect = [formData.captain];
        } 
        // PRIORITY 5: Use jamboreeMeetingInfo.captains (display names only)
        else if (formData.jamboreeMeetingInfo?.captains) {
          // Try to match display names to emails for existing captains
          const captainNames = formData.jamboreeMeetingInfo.captains.split(/,\s*/).filter(Boolean);
          
          // For each name, try to find a matching captain by display name
          captainNames.forEach(name => {
            // Find a captain whose display name matches the stored name
            const matchingCaptain = captainsData.find(c => c.displayName === name);
            if (matchingCaptain) {
              captainEmailsToSelect.push(matchingCaptain.email);
            }
          });

          // If we couldn't match any by display name but have captains,
          // populate with the first few captain emails as a fallback
          if (captainEmailsToSelect.length === 0 && captainsData.length > 0) {
            captainEmailsToSelect = captainsData.slice(0, Math.min(captainNames.length, captainsData.length)).map(c => c.email);
          }
        }
        
        // Same priority order for sponsors
        // PRIORITY 1: Use sponsorDetails
        if (formData.sponsorDetails && formData.sponsorDetails.length > 0) {
          sponsorEmailsToSelect = formData.sponsorDetails.map(sponsor => sponsor.email);
        }
        // PRIORITY 2: Use sponsorEmails array 
        else if (formData.sponsorEmails && formData.sponsorEmails.length > 0) {
          sponsorEmailsToSelect = formData.sponsorEmails;
        } 
        // PRIORITY 3: Use single sponsorEmail value (legacy)
        else if (formData.sponsorEmail) {
          sponsorEmailsToSelect = [formData.sponsorEmail];
        } 
        // PRIORITY 4: Use jamboreeMeetingInfo.sponsor
        else if (formData.jamboreeMeetingInfo?.sponsor) {
          // Try to match display names to emails for existing sponsors
          const sponsorNames = formData.jamboreeMeetingInfo.sponsor.split(/,\s*/).filter(Boolean);
          
          // For each name, try to find a matching sponsor by display name
          sponsorNames.forEach(name => {
            // Find a sponsor whose display name matches the stored name
            const matchingSponsor = sponsorsData.find(s => s.displayName === name);
            if (matchingSponsor) {
              sponsorEmailsToSelect.push(matchingSponsor.email);
            }
          });

          // If we couldn't match any by display name but have sponsors,
          // populate with the first few sponsor emails as a fallback
          if (sponsorEmailsToSelect.length === 0 && sponsorsData.length > 0) {
            sponsorEmailsToSelect = sponsorsData.slice(0, Math.min(sponsorNames.length, sponsorsData.length)).map(s => s.email);
          }
        }
        
        // Set the selectedCaptains and selectedSponsors states with the emails
        setSelectedCaptains(captainEmailsToSelect.length > 0 ? captainEmailsToSelect : []);
        setSelectedSponsors(sponsorEmailsToSelect.length > 0 ? sponsorEmailsToSelect : []);
        
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, [formData.jamboreeMeetingInfo, formData.captainDetails, formData.sponsorDetails, formData.captains, formData.captainEmails, formData.sponsorEmails, formData.captain, formData.sponsorEmail]);

  // Handle adding, removing, and updating captains
  const addCaptainSelection = () => {
    if (selectedCaptains.length < 4) {
      setSelectedCaptains([...selectedCaptains, '']);
    }
  };

  const removeCaptainSelection = (index: number) => {
    const updatedCaptains = selectedCaptains.filter((_, i) => i !== index);
    const removedCaptain = selectedCaptains[index]; // The captain being removed
    
    setSelectedCaptains(updatedCaptains);
    
    // Filter out any empty values
    const filteredCaptains = updatedCaptains.filter(email => email.trim() !== '');
    
    // Format captain data with display names
    const captainDetailsArray = filteredCaptains.map(email => {
      const captain = captains.find(c => c.email === email);
      const displayName = captain && captain.displayName ? captain.displayName : email;
      return { email, displayName };
    });
    
    const formattedCaptains = captainDetailsArray
      .map(captain => captain.displayName)
      .join(', ');
    
    // Update the jamboreeMeetingInfo with the standardized format
    const updatedJamboreeMeetingInfo = {
      ...(formData.jamboreeMeetingInfo || {}),
      captains: formattedCaptains
    };
    
    // Create a complete update object with all captain-related fields
    const updatedData: Partial<ClubSite> = {
      jamboreeMeetingInfo: updatedJamboreeMeetingInfo,
      captains: filteredCaptains,
      captain: filteredCaptains.length > 0 ? filteredCaptains[0] : '',
      captainDetails: captainDetailsArray
    };
    
    // Update formData first
    setFormData(prev => ({
      ...prev,
      ...updatedData
    }));
    
    // If a captain was removed, update their user document
    if (removedCaptain && removedCaptain.trim() !== '') {
      updateCaptainUserData(removedCaptain);
    }
    
    // Save all captain-related updates at once
    handleSave(updatedData);
  };
  
  // Function to update a captain's user document
  const updateCaptainUserData = async (captainEmail: string) => {
    if (!formData.id) return; // Ensure we have a club ID
    
    try {
      const usersCollection = collection(db, 'users');
      const captainQuery = query(usersCollection, where('email', '==', captainEmail));
      const captainSnapshot = await getDocs(captainQuery);
      
      if (!captainSnapshot.empty) {
        const captainDoc = captainSnapshot.docs[0];
        const captainData = captainDoc.data();
        
        // Remove club ID from captainClubs array
        if (captainData.captainClubs && Array.isArray(captainData.captainClubs)) {
          const updatedClubs = captainData.captainClubs.filter(id => id !== formData.id);
          
          // Update the user document
          await updateDoc(doc(db, 'users', captainDoc.id), {
            captainClubs: updatedClubs
          });
        }
      }
    } catch (error) {
      console.error('Error updating captain user data:', error);
    }
  };

  // Handle adding, removing, and updating sponsors
  const addSponsorSelection = () => {
    if (selectedSponsors.length < 4) {
      setSelectedSponsors([...selectedSponsors, '']);
    }
  };

  const removeSponsorSelection = (index: number) => {
    const updatedSponsors = selectedSponsors.filter((_, i) => i !== index);
    setSelectedSponsors(updatedSponsors);
    
    // Filter out any empty values
    const filteredSponsors = updatedSponsors.filter(email => email.trim() !== '');
    
    // Format sponsor data with display names
    const sponsorDetailsArray = filteredSponsors.map(email => {
      const sponsor = sponsors.find(s => s.email === email);
      const displayName = sponsor && sponsor.displayName ? sponsor.displayName : email;
      return { email, displayName };
    });
    
    const formattedSponsors = sponsorDetailsArray
      .map(sponsor => sponsor.displayName)
      .join(', ');
    
    // Update the jamboreeMeetingInfo with the standardized format
    const updatedJamboreeMeetingInfo = {
      ...(formData.jamboreeMeetingInfo || {}),
      sponsor: formattedSponsors
    };
    
    // Handle the case where all sponsors are removed
    const updatedData: Partial<ClubSite> = {
      jamboreeMeetingInfo: updatedJamboreeMeetingInfo,
      sponsorEmails: filteredSponsors,
      sponsorEmail: filteredSponsors.length > 0 ? filteredSponsors[0] : '',
      sponsorDetails: sponsorDetailsArray
    };
    
    // Save all sponsor-related updates at once
    handleSave(updatedData);
  };

  // Update sponsor selection
  const updateSponsorSelection = (index: number, value: string) => {
    const updatedSponsors = [...selectedSponsors];
    updatedSponsors[index] = value;
    setSelectedSponsors(updatedSponsors);
    
    // Filter out any empty values
    const filteredSponsors = updatedSponsors.filter(email => email.trim() !== '');
    
    // Format sponsor data with display names
    const sponsorDetailsArray = filteredSponsors.map(email => {
      const sponsor = sponsors.find(s => s.email === email);
      const displayName = sponsor && sponsor.displayName ? sponsor.displayName : email;
      return { email, displayName };
    });
    
    const formattedSponsors = sponsorDetailsArray
      .map(sponsor => sponsor.displayName)
      .join(', ');
    
    // Update the jamboreeMeetingInfo with the standardized format
    const updatedJamboreeMeetingInfo = {
      ...(formData.jamboreeMeetingInfo || {}),
      sponsor: formattedSponsors
    };
    
    // Clear any legacy fields to prevent duplication
    const updatedData: Partial<ClubSite> = {
      jamboreeMeetingInfo: updatedJamboreeMeetingInfo,
      sponsorEmails: filteredSponsors,
      sponsorEmail: filteredSponsors.length > 0 ? filteredSponsors[0] : '',
      sponsorDetails: sponsorDetailsArray
    };
    
    // Save all sponsor-related updates at once
    handleSave(updatedData);
  };

  // Initialize from legacy activityType if activityTypes is not set
  useEffect(() => {
    if (!formData.activityTypes && formData.activityType && formData.activityType.trim() !== '') {
      // Map legacy activity type to the new format
      const legacyTypeMappings: Record<string, string> = {
        'Competitive': 'competitive',
        'Performance': 'performance',
        'Public Speaking': 'public speaking',
        'Leaders': 'team-based',
        'Tryout': 'competitive',
        'Casual': 'volunteering',
        'Academic': 'competitive'
      };
      
      const legacyType = formData.activityType;
      const mappedType = legacyTypeMappings[legacyType] || legacyType.toLowerCase();
      
      // Set the new activityTypes array with the mapped legacy type
      handleInputChange('activityTypes' as keyof ClubSite, [mappedType]);
    }
  }, [formData.activityType, formData.activityTypes, handleInputChange]);

  // Update captain selection
  const updateCaptainSelection = (index: number, value: string) => {
    const updatedCaptains = [...selectedCaptains];
    const oldValue = updatedCaptains[index]; // Save the old value to check if a captain was removed
    updatedCaptains[index] = value;
    setSelectedCaptains(updatedCaptains);
    
    // Filter out any empty values
    const filteredCaptains = updatedCaptains.filter(email => email.trim() !== '');
    
    // Format captain data with display names
    const captainDetailsArray = filteredCaptains.map(email => {
      const captain = captains.find(c => c.email === email);
      const displayName = captain && captain.displayName ? captain.displayName : email;
      return { email, displayName };
    });
    
    const formattedCaptains = captainDetailsArray
      .map(captain => captain.displayName)
      .join(', ');
    
    // Update the jamboreeMeetingInfo with the standardized format
    const updatedJamboreeMeetingInfo = {
      ...(formData.jamboreeMeetingInfo || {}),
      captains: formattedCaptains
    };
    
    // Create a complete update object with all captain-related fields
    const updatedData: Partial<ClubSite> = {
      jamboreeMeetingInfo: updatedJamboreeMeetingInfo,
      captains: filteredCaptains,
      captain: filteredCaptains.length > 0 ? filteredCaptains[0] : '',
      captainDetails: captainDetailsArray
    };
    
    // Update formData first
    setFormData(prev => ({
      ...prev,
      ...updatedData
    }));
    
    // If a captain was replaced or removed, remove the club from their captainClubs array
    if (oldValue && oldValue !== value && oldValue.trim() !== '') {
      updateCaptainUserData(oldValue);
    }
    
    // Save all captain-related updates at once
    handleSave(updatedData);
  };
  
  // Cleanup function for side effects
  useEffect(() => {
    return () => {
      // Clear any pending autosave timeouts when the component unmounts
      if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
      }
    };
  }, [autosaveTimeout]);

  // Utility function to get unique submissions by email, keeping the latest one
  const getUniqueSubmissions = (submissions: { name: string; email: string; timestamp: number }[]): { name: string; email: string; timestamp: number }[] => {
    if (!submissions || submissions.length === 0) {
      return [];
    }
    
    // Create a map to track the latest submission for each email
    const emailMap = new Map<string, { name: string; email: string; timestamp: number }>();
    
    // Iterate through all submissions
    submissions.forEach(sub => {
      const email = sub.email.toLowerCase();
      const existingSubmission = emailMap.get(email);
      
      // If this email doesn't exist in the map yet, or if this submission is newer, update the map
      if (!existingSubmission || sub.timestamp > existingSubmission.timestamp) {
        emailMap.set(email, sub);
      }
    });
    
    // Convert the map values back to an array and sort by name
    return Array.from(emailMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top sticky navigation bar */}
      <div className="sticky top-0 z-100 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-[#180D39] hidden md:block">
              {isNew ? "Creating: " : "Editing: "} {formData.clubName}
            </h1>
            <span className="text-sm text-gray-500 hidden md:block">
              {isNew ? "New website" : `Last saved: ${formData.updatedAt ? new Date(formData.updatedAt).toLocaleTimeString() : 'Not saved yet'}`}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Save status indicator */}
            {isSaving ? (
              <div className="flex items-center text-gray-600">
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-sm">Saving...</span>
              </div>
            ) : saveSuccess ? (
              <div className="flex items-center text-green-600">
                <CheckIcon className="h-5 w-5 mr-1" />
                <span className="text-sm">Saved</span>
              </div>
            ) : (
              <div className="text-gray-500 text-sm hidden md:block">
                Changes auto-save
              </div>
            )}
            
            {/* Action buttons */}
            <button
              onClick={handleViewSite}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center hover:bg-gray-200"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View Site
            </button>
            
            <button
              onClick={() => setShowThemeEditor(!showThemeEditor)}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center hover:bg-gray-200"
            >
              <SwatchIcon className="h-4 w-4 mr-1" />
              Theme
            </button>
            
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#4361EE] to-[#3A54D4] text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-1" />
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Save All
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="pt-8 max-w-[1400px] mx-auto px-4 md:px-8 pb-24">
        {isNew && (
          <div className="bg-blue-50 text-blue-700 rounded-lg p-4 mb-8 border border-blue-200">
            <h2 className="text-lg font-semibold mb-2">Welcome to your new club website!</h2>
            <p>
              Customize your website by filling out the sections below. Your changes are automatically saved.
              Preview your site any time using the Preview button in the top control bar.
            </p>
          </div>
        )}
        
        {/* Editor/Preview Toggle */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm sticky top-24">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#180D39]">Editor</h2>
              </div>
              
              <nav className="p-2">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center mb-1 ${
                    activeTab === 'content' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Content
                </button>
                
                <button
                  onClick={() => setActiveTab('media')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center mb-1 ${
                    activeTab === 'media' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Media
                </button>

                <button
                  onClick={() => setActiveTab('form')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center mb-1 ${
                    activeTab === 'form' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <DocumentIcon className="h-5 w-5 mr-2" />
                  Interest Form
                </button>
                
                {/* 
                <button
                  onClick={() => setActiveTab('design')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center mb-1 ${
                    activeTab === 'design' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <PaintBrushIcon className="h-5 w-5 mr-2" />
                  Design & Links
                </button>
                */}
              </nav>
              
              <div className="p-4 border-t border-gray-100 mt-2">
                <button
                  onClick={handleViewSite}
                  className="w-full bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md"
                >
                  Open Published Site
                </button>
              </div>
            </div>
          </div>
          
          {/* Main editing area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Content Tab */}
            {activeTab === 'content' && (
              <>
                {/* Banner & Identity Section */}
                <section 
                  ref={(el) => { sectionsRef.current['banner'] = el; }} 
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#180D39]">Banner & Club Identity</h3>
                  </div>
                  
                  <div 
                    className="relative h-[300px] rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 mb-6 border-2 border-dashed border-gray-300 group"
                    style={{
                      backgroundImage: formData.bannerImage ? `url(${formData.bannerImage})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderStyle: formData.bannerImage ? 'solid' : 'dashed'
                    }}
                  >
                    {uploadingBanner ? (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <LoadingSpinner size="lg" />
                        <p className="text-white mt-4 font-medium">Uploading image...</p>
                      </div>
                    ) : (
                      <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all">
                        <div className="bg-white/90 text-black px-6 py-3 rounded-lg flex items-center hover:bg-white transition-colors shadow-lg">
                          <PhotoIcon className="h-5 w-5 mr-2" />
                          {formData.bannerImage ? 'Change Banner Image' : 'Add Banner Image'}
                        </div>
                        {!formData.bannerImage && (
                          <p className="text-white mt-4 text-sm font-medium">
                            Recommended size: 1200 × 400 pixels
                          </p>
                        )}
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg" 
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, 'banner')}
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg mb-6">
                    <p className="font-medium mb-2">Banner Image Tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Use a high-quality landscape image (recommended size: 1200 × 400 pixels)</li>
                      <li>Keep file size under 5MB for faster loading</li>
                      <li>Choose an image that represents your club&apos;s identity</li>
                      <li>Ensure good contrast with text that will appear on top</li>
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Club Name
                      </label>
                      <input
                        type="text"
                        value={formData.clubName}
                        onChange={(e) => handleInputChange('clubName', e.target.value)}
                        className="w-full px-4 py-3 text-xl font-bold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                        placeholder="Your Club Name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slogan or Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.slogan || ''}
                        onChange={(e) => handleInputChange('slogan', e.target.value)}
                        className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                        placeholder="Add a short, catchy phrase to describe your club"
                      />
                      <p className="text-xs text-gray-500 mt-1">A brief statement that captures the essence of your club</p>
                    </div>
                  </div>
                </section>
                
                {/* Club Classification & Meeting Info Section */}
                <section 
                  ref={(el) => { sectionsRef.current['classification'] = el; }} 
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#180D39]">Club Classification & Meeting Info</h3>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-6">
                    Add important information about your club category, activity type, and meeting details.
                    This information will be displayed on the Jamboree page and help students find your club.
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Club Category
                      </label>
                      <div className="relative">
                        <select
                          value={formData.category || ''}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:border-[#38BFA1] text-black appearance-none"
                          style={{
                            borderColor: formData.category ? getCategoryColor(formData.category).bg : '#d1d5db',
                            boxShadow: formData.category ? `0 0 0 1px ${getCategoryColor(formData.category).bg}` : 'none'
                          }}
                        >
                          <option value="">Select a category</option>
                          <option value="STEM" style={{ backgroundColor: CATEGORY_COLORS['STEM'].lighter, color: CATEGORY_COLORS['STEM'].bg }}>STEM</option>
                          <option value="Humanities" style={{ backgroundColor: CATEGORY_COLORS['Humanities'].lighter, color: CATEGORY_COLORS['Humanities'].bg }}>Humanities</option>
                          <option value="Business" style={{ backgroundColor: CATEGORY_COLORS['Business'].lighter, color: CATEGORY_COLORS['Business'].bg }}>Business</option>
                          <option value="Music, Arts, & Performing Arts" style={{ backgroundColor: CATEGORY_COLORS['Music, Arts, & Performing Arts'].lighter, color: CATEGORY_COLORS['Music, Arts, & Performing Arts'].bg }}>Music, Arts, & Performing Arts</option>
                          <option value="Academic" style={{ backgroundColor: CATEGORY_COLORS['Academic'].lighter, color: CATEGORY_COLORS['Academic'].bg }}>Academic</option>
                          <option value="Language & Culture" style={{ backgroundColor: CATEGORY_COLORS['Language & Culture'].lighter, color: CATEGORY_COLORS['Language & Culture'].bg }}>Language & Culture</option>
                          <option value="Medical" style={{ backgroundColor: CATEGORY_COLORS['Medical'].lighter, color: CATEGORY_COLORS['Medical'].bg }}>Medical</option>
                          <option value="Sports" style={{ backgroundColor: CATEGORY_COLORS['Sports'].lighter, color: CATEGORY_COLORS['Sports'].bg }}>Sports</option>
                          <option value="Community Service & Leadership" style={{ backgroundColor: CATEGORY_COLORS['Community Service & Leadership'].lighter, color: CATEGORY_COLORS['Community Service & Leadership'].bg }}>Community Service & Leadership</option>
                          <option value="Miscellaneous" style={{ backgroundColor: CATEGORY_COLORS['Miscellaneous'].lighter, color: CATEGORY_COLORS['Miscellaneous'].bg }}>Miscellaneous</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Categorizing your club helps students find activities they&apos;re interested in</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Type
                      </label>
                      <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
                        {['competitive', 'performance', 'public speaking', 'volunteering', 'team-based'].map((type) => (
                          <div key={type} className="flex items-center mb-2 last:mb-0">
                            <input
                              id={`activity-${type}`}
                              type="checkbox"
                              checked={formData.activityTypes?.includes(type) || false}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                const currentTypes = formData.activityTypes || [];
                                
                                // If trying to add more than 3 activity types, prevent it
                                if (isChecked && currentTypes.length >= 3) {
                                  toast.error('Maximum 3 activity types allowed');
                                  return;
                                }
                                
                                const updatedTypes = isChecked
                                  ? [...currentTypes, type]
                                  : currentTypes.filter((t: string) => t !== type);
                                
                                handleInputChange('activityTypes' as keyof ClubSite, updatedTypes);
                              }}
                              className="h-4 w-4 text-[#38BFA1] border-gray-300 rounded focus:ring-[#38BFA1]"
                              disabled={!(formData.activityTypes?.includes(type) || false) && (formData.activityTypes?.length ?? 0) >= 3}
                            />
                            <label htmlFor={`activity-${type}`} className="ml-2 block text-sm text-black capitalize">
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Select up to 3 activity types that apply to your club 
                        {(formData.activityTypes?.length ?? 0) > 0 ? ` (${formData.activityTypes?.length ?? 0}/3 selected)` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={formData.roomNumber || ''}
                      onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                      placeholder="e.g., Room 123"
                    />
                    <p className="text-xs text-gray-500 mt-1">Where does your club meet?</p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Information
                    </label>
                    
                    {/* Structured Meeting Info */}
                    <div className="bg-white rounded-lg border border-gray-300 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Frequency Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Meeting Frequency
                          </label>
                          <select
                            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                            value={formData.meetingFrequency || 'weekly'}
                            onChange={(e) => {
                              const value = e.target.value;
                              handleInputChange('meetingFrequency', value);
                              
                              // Update the displayed meeting info when frequency changes
                              const meetings = formData.meetingSchedule || [];
                              if (meetings.length > 0) {
                                const formattedInfo = formatMeetingInfo(value, meetings);
                                handleInputChange('meetingInfo', formattedInfo);
                              }
                            }}
                          >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="daily">Daily</option>
                            <option value="custom">Custom Schedule</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">How often does your club meet?</p>
                        </div>
                      </div>
                      
                      {/* Meeting Schedule Builder */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Meeting Schedule
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const meetings = [...(formData.meetingSchedule || [])];
                              meetings.push({ day: 'Monday', startTime: '15:00', endTime: '16:00' });
                              
                              // Update both the schedule array and the formatted meeting info
                              handleInputChange('meetingSchedule', meetings);
                              const formattedInfo = formatMeetingInfo(formData.meetingFrequency || 'weekly', meetings);
                              handleInputChange('meetingInfo', formattedInfo);
                            }}
                            className="text-sm text-[#38BFA1] hover:text-[#2DA891] font-medium"
                          >
                            + Add Meeting Time
                          </button>
                        </div>
                        
                        {/* Display each meeting day/time row */}
                        <div className="space-y-3">
                          {(formData.meetingSchedule || []).map((meeting, index) => (
                            <div key={index} className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-md">
                              {/* Day selection */}
                              <div className="w-full sm:w-auto">
                                <select
                                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                                  value={meeting.day}
                                  onChange={(e) => {
                                    const meetings = [...(formData.meetingSchedule || [])];
                                    meetings[index].day = e.target.value;
                                    
                                    // Update both the schedule array and the formatted meeting info
                                    handleInputChange('meetingSchedule', meetings);
                                    const formattedInfo = formatMeetingInfo(formData.meetingFrequency || 'weekly', meetings);
                                    handleInputChange('meetingInfo', formattedInfo);
                                  }}
                                >
                                  <option value="Monday">Monday</option>
                                  <option value="Tuesday">Tuesday</option>
                                  <option value="Wednesday">Wednesday</option>
                                  <option value="Thursday">Thursday</option>
                                  <option value="Friday">Friday</option>
                                  <option value="Saturday">Saturday</option>
                                  <option value="Sunday">Sunday</option>
                                </select>
                              </div>
                              
                              {/* Time inputs */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                                  value={meeting.startTime}
                                  onChange={(e) => {
                                    const meetings = [...(formData.meetingSchedule || [])];
                                    meetings[index].startTime = e.target.value;
                                    
                                    // Update both the schedule array and the formatted meeting info
                                    handleInputChange('meetingSchedule', meetings);
                                    const formattedInfo = formatMeetingInfo(formData.meetingFrequency || 'weekly', meetings);
                                    handleInputChange('meetingInfo', formattedInfo);
                                  }}
                                />
                                <span className="text-gray-500">to</span>
                                <input
                                  type="time"
                                  className="px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                                  value={meeting.endTime}
                                  onChange={(e) => {
                                    const meetings = [...(formData.meetingSchedule || [])];
                                    meetings[index].endTime = e.target.value;
                                    
                                    // Update both the schedule array and the formatted meeting info
                                    handleInputChange('meetingSchedule', meetings);
                                    const formattedInfo = formatMeetingInfo(formData.meetingFrequency || 'weekly', meetings);
                                    handleInputChange('meetingInfo', formattedInfo);
                                  }}
                                />
                              </div>
                              
                              {/* Remove button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const meetings = [...(formData.meetingSchedule || [])];
                                  meetings.splice(index, 1);
                                  
                                  // Update both the schedule array and the formatted meeting info
                                  handleInputChange('meetingSchedule', meetings);
                                  const formattedInfo = formatMeetingInfo(formData.meetingFrequency || 'weekly', meetings);
                                  handleInputChange('meetingInfo', formattedInfo);
                                }}
                                className="ml-auto text-red-500 hover:text-red-700"
                                aria-label="Remove meeting time"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                          
                          {(!formData.meetingSchedule || formData.meetingSchedule.length === 0) && (
                            <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                              <p className="text-gray-500 mb-2">No meeting times added yet</p>
                              <button
                                type="button"
                                onClick={() => {
                                  const meetings = [...(formData.meetingSchedule || [])];
                                  meetings.push({ day: 'Monday', startTime: '15:00', endTime: '16:00' });
                                  
                                  // Update both the schedule array and the formatted meeting info
                                  handleInputChange('meetingSchedule', meetings);
                                  const formattedInfo = formatMeetingInfo(formData.meetingFrequency || 'weekly', meetings);
                                  handleInputChange('meetingInfo', formattedInfo);
                                }}
                                className="text-[#38BFA1] hover:text-[#2DA891] font-medium"
                              >
                                + Add Your First Meeting Time
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Preview of the formatted meeting info */}
                      <div className="mt-4 bg-gray-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Formatted Meeting Information:</h4>
                        <p className="text-sm text-gray-800">{formData.meetingInfo || 'Add meeting times to see the formatted information'}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">This information will be displayed on your club&apos;s page</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Jamboree Information</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      This information will be displayed on the Jamboree page.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Captains
                        </label>
                        <div className="space-y-2">
                          {selectedCaptains.map((captainEmail, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <select
                                value={captainEmail}
                                onChange={(e) => updateCaptainSelection(index, e.target.value)}
                                className="flex-grow px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                              >
                                <option value="">-- Select Captain --</option>
                                {captains.map((captain) => (
                                  <option key={captain.id} value={captain.email}>
                                    {captain.displayName || captain.email}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeCaptainSelection(index)}
                                className="p-1 text-red-500 hover:text-red-700 rounded"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {selectedCaptains.length === 0 && (
                          <div className="text-center py-4 border border-dashed border-gray-300 rounded-md">
                            <p className="text-gray-500 mb-2">No captains added yet</p>
                            <button
                              type="button"
                              onClick={addCaptainSelection}
                              className="text-[#38BFA1] hover:text-[#2DA891] font-medium"
                            >
                              + Add Captain
                            </button>
                          </div>
                        )}
                        
                        {selectedCaptains.length < 4 && selectedCaptains.length > 0 && (
                          <button
                            type="button"
                            onClick={addCaptainSelection}
                            className="mt-2 text-sm text-[#38BFA1] hover:text-[#2DA891] font-medium flex items-center"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Another Captain
                          </button>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sponsors
                        </label>
                        <div className="space-y-2">
                          {selectedSponsors.map((sponsorEmail, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <select
                                value={sponsorEmail}
                                onChange={(e) => updateSponsorSelection(index, e.target.value)}
                                className="flex-grow px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                              >
                                <option value="">-- Select Sponsor --</option>
                                {sponsors.map((sponsor) => (
                                  <option key={sponsor.id} value={sponsor.email}>
                                    {sponsor.displayName || sponsor.email}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeSponsorSelection(index)}
                                className="p-1 text-red-500 hover:text-red-700 rounded"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {selectedSponsors.length === 0 && (
                          <div className="text-center py-4 border border-dashed border-gray-300 rounded-md">
                            <p className="text-gray-500 mb-2">No sponsors added yet</p>
                            <button
                              type="button"
                              onClick={addSponsorSelection}
                              className="text-[#38BFA1] hover:text-[#2DA891] font-medium"
                            >
                              + Add Sponsor
                            </button>
                          </div>
                        )}
                        
                        {selectedSponsors.length < 4 && selectedSponsors.length > 0 && (
                          <button
                            type="button"
                            onClick={addSponsorSelection}
                            className="mt-2 text-sm text-[#38BFA1] hover:text-[#2DA891] font-medium flex items-center"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Another Sponsor
                          </button>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Contact Email
                        </label>
                        <input
                          type="email"
                          value={formData.jamboreeMeetingInfo?.email || ''}
                          onChange={(e) => {
                            const updatedInfo = {
                              ...(formData.jamboreeMeetingInfo || {}),
                              email: e.target.value
                            };
                            handleInputChange('jamboreeMeetingInfo', updatedInfo);
                          }}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                          placeholder="e.g., sponsor@school.edu"
                        />
                      </div>
                    </div>
                  </div>
                </section>
                
                {/* About Section */}
                <section 
                  ref={(el) => { sectionsRef.current['about'] = el; }} 
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#180D39]">About Our Club</h3>
                  </div>
                  
                  <div className="mb-2 text-sm text-gray-600">
                    Share your club&apos;s story, mission, and what makes it special. Make it compelling!
                  </div>
                  
                  <div className="bg-white rounded-lg mb-2 min-h-[200px] border border-gray-300">
                    <div className="p-2 border-b border-gray-200 bg-gray-50 flex gap-2">
                      <button 
                        className="px-2 py-1 rounded hover:bg-gray-200" 
                        onClick={() => {
                          const textarea = document.getElementById('description-editor') as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selectedText = text.substring(start, end);
                          
                          const newText = text.substring(0, start) + 
                            `<strong>${selectedText}</strong>` + 
                            text.substring(end);
                          
                          setEditorContent(newText);
                        }}
                      >
                        Bold
                      </button>
                      <button 
                        className="px-2 py-1 rounded hover:bg-gray-200" 
                        onClick={() => {
                          const textarea = document.getElementById('description-editor') as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selectedText = text.substring(start, end);
                          
                          const newText = text.substring(0, start) + 
                            `<em>${selectedText}</em>` + 
                            text.substring(end);
                          
                          setEditorContent(newText);
                        }}
                      >
                        Italic
                      </button>
                      <button 
                        className="px-2 py-1 rounded hover:bg-gray-200" 
                        onClick={() => {
                          const textarea = document.getElementById('description-editor') as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selectedText = text.substring(start, end).split('\n').filter(line => line.trim() !== '');
                          
                          let listItems = '';
                          if (selectedText.length > 0) {
                            selectedText.forEach(item => {
                              listItems += `<li>${item}</li>`;
                            });
                          } else {
                            listItems = '<li></li>';
                          }
                          
                          const newText = text.substring(0, start) + 
                            `<ul>${listItems}</ul>` + 
                            text.substring(end);
                          
                          setEditorContent(newText);
                        }}
                      >
                        List
                      </button>
                    </div>
                    <textarea
                      id="description-editor"
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="w-full p-4 min-h-[200px] resize-y text-black"
                      placeholder="Describe your club, its mission, and what members do..."
                    />
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Preview:</p>
                    <div 
                      className="p-4 border rounded-lg bg-white"
                      dangerouslySetInnerHTML={{ __html: editorContent || '...' }} 
                    />
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Use formatting tools to organize your content</span>
                    <span>{editorContent ? 
                      `${editorContent.replace(/<[^>]*>/g, '').length} characters` : 
                      '0 characters'}
                    </span>
                  </div>
                </section>

                {/* Team Members Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#180D39]">Team Members</h3>
                    <button
                      onClick={handleAddMember}
                      className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Member
                    </button>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <p className="text-sm text-gray-600 mb-6">
                      Add your club&apos;s team members with photos, names, roles, and short bios.
                    </p>
                    <div className="space-y-6">
                      {formData.members?.map((member, index) => (
                        <div key={`member-${index}`} className="border border-gray-200 rounded-lg p-4 relative hover:shadow-md transition-all">
                          <button
                            onClick={() => handleRemoveMember(index)}
                            className="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                            aria-label="Remove member"
                            title="Remove member"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-[150px] flex-shrink-0">
                              <div 
                                className="h-[150px] w-full md:w-[150px] rounded-lg bg-gray-100 mb-2 overflow-hidden relative border border-gray-200"
                              >
                                {member.photoUrl ? (
                                  <Image 
                                    src={member.photoUrl} 
                                    alt={member.name || 'Member photo'} 
                                    className="w-full h-full object-cover"
                                    fill
                                    sizes="150px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                    <UserIcon className="h-12 w-12 text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-500">Add photo</span>
                                  </div>
                                )}
                                
                                {uploadingMemberPhoto === index ? (
                                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                    <LoadingSpinner size="sm" />
                                    <span className="text-white text-xs mt-2">Uploading...</span>
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                                    <label className="cursor-pointer bg-white/90 text-black px-3 py-1 rounded-md text-sm shadow-sm hover:shadow-md">
                                      {member.photoUrl ? 'Change Photo' : 'Add Photo'}
                                      <input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/jpg" 
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(e, 'member', index)}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={member.name}
                                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                                    placeholder="Member name"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role / Position
                                  </label>
                                  <input
                                    type="text"
                                    value={member.role}
                                    onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                                    placeholder="e.g., President, Treasurer, etc."
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Bio <span className="text-gray-500 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                  value={member.bio || ''}
                                  onChange={(e) => handleMemberChange(index, 'bio', e.target.value)}
                                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                                  placeholder="Brief bio or statement (interests, goals, etc.)"
                                  rows={3}
                                />
                                <p className="text-xs text-gray-500 mt-1">A short personal statement, relevant experience, or contact info</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!formData.members || formData.members.length === 0) && (
                        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                          <UserIcon className="h-14 w-14 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-700 font-medium mb-2">No team members added yet</p>
                          <p className="text-gray-500 mb-6 max-w-md mx-auto">Showcase your club&apos;s team by adding photos and information about your members.</p>
                          <button
                            onClick={handleAddMember}
                            className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add Your First Team Member
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents & Resources Section */}
                <section className="bg-white rounded-xl p-6 shadow-sm mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#180D39]">Documents & Resources</h3>
                      <p className="text-sm text-gray-600 mt-1">Share important documents and links with your members</p>
                    </div>
                    <div className="flex space-x-2">
                      <label className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer">
                        <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                        Upload PDF
                        <input 
                          type="file" 
                          accept="application/pdf" 
                          className="hidden"
                          onChange={handleResourceUpload}
                        />
                      </label>
                      <button
                        onClick={handleAddLinkResource}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                      >
                        <GlobeAltIcon className="h-4 w-4 mr-1" />
                        Add Link
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    {formData.resources?.map((resource, index) => (
                      <div 
                        key={`resource-${index}`}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {resource.type === 'pdf' ? (
                              <DocumentIcon className="h-8 w-8 text-red-500 mr-3" />
                            ) : (
                              <GlobeAltIcon className="h-8 w-8 text-blue-500 mr-3" />
                            )}
                            <div>
                              <h3 className="font-medium text-gray-800">
                                {resource.title}
                              </h3>
                              {resource.description && (
                                <p className="text-sm text-gray-600">{resource.description}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                {resource.type === 'pdf' && resource.fileSize && 
                                  `${Math.round(resource.fileSize / 1024)} KB • `
                                }
                                Added {resource.uploadedAt ? new Date(resource.uploadedAt).toLocaleDateString() : 'recently'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <a 
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                              title={resource.type === 'pdf' ? "View PDF" : "Open Link"}
                            >
                              <EyeIcon className="h-5 w-5" />
                            </a>
                            <button
                              onClick={() => handleResourceDelete(resource)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                              title="Delete Resource"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!formData.resources || formData.resources.length === 0) && (
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <DocumentTextIcon className="h-14 w-14 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-2">No resources added yet</p>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Share important documents and links with your members by uploading PDFs or adding external links.
                        </p>
                        <div className="flex justify-center space-x-4">
                          <label className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer">
                            <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                            Upload PDF
                            <input 
                              type="file" 
                              accept="application/pdf" 
                              className="hidden"
                              onChange={handleResourceUpload}
                            />
                          </label>
                          <button
                            onClick={handleAddLinkResource}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                          >
                            <GlobeAltIcon className="h-4 w-4 mr-1" />
                            Add Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.resources && formData.resources.length > 0 && (
                    <div className="mt-4 text-sm text-gray-500">
                      <p className="font-medium mb-2">Resource Tips:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Keep PDF file sizes under 10MB</li>
                        <li>Use clear, descriptive titles</li>
                        <li>Add helpful descriptions to make resources easy to find</li>
                        <li>Ensure links are valid and accessible</li>
                        <li>Organize resources by type (PDF/Link) and purpose</li>
                      </ul>
                    </div>
                  )}
                </section>

                {/* Contact Links Section */}
                <section className="bg-white rounded-xl p-6 shadow-sm mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#180D39]">Contact Links</h3>
                    <button
                      onClick={handleAddContactLink}
                      className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Contact Link
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-6">
                    Make it easy for people to connect with your club by adding social media links, website links, or email addresses.
                  </p>
                  
                  <div className="space-y-4">
                    {formData.contactLinks?.map((link, index) => (
                      <div key={`link-${index}`} className="border border-gray-200 rounded-lg p-4 relative hover:shadow-md transition-all">
                        <button
                          onClick={() => handleRemoveContactLink(index)}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                          aria-label="Remove link"
                          title="Remove contact link"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Link Type
                            </label>
                            <select
                              value={link.type}
                              onChange={(e) => handleContactLinkChange(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                            >
                              <option value="website">Website</option>
                              <option value="email">Email</option>
                              <option value="instagram">Instagram</option>
                              <option value="twitter">Twitter</option>
                              <option value="facebook">Facebook</option>
                              <option value="remind">Remind</option>
                              <option value="discord">Discord</option>
                              <option value="youtube">YouTube</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Display Label
                            </label>
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => handleContactLinkChange(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                              placeholder="e.g., Official Website, Email Us, etc."
                            />
                            <p className="text-xs text-gray-500 mt-1">The text visitors will see on your website</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              URL or Address
                            </label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => handleContactLinkChange(index, 'url', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                              placeholder={link.type === 'email' ? 'email@example.com' : 'https://...'}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {link.type === 'email' ? 'Enter a valid email address' : 'Include https:// for web links'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!formData.contactLinks || formData.contactLinks.length === 0) && (
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                        <LinkIcon className="h-14 w-14 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-2">No contact links added yet</p>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">Help visitors connect with your club by adding social media links, email addresses, or other contact information.</p>
                        <button
                          onClick={handleAddContactLink}
                          className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Your First Contact Link
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* Media Gallery Tab */}
            {activeTab === 'media' && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#180D39]">Informational PDF</h2>
                    <p className="text-sm text-gray-600 mt-1">Upload and manage your club&apos;s informational PDF</p>
                  </div>
                  <label className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer">
                    <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                    Upload PDF
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className="hidden"
                      onChange={handlePDFUpload}
                    />
                  </label>
                </div>

                {/* PDF List */}
                {formData.pdfUploads && formData.pdfUploads.length > 0 ? (
                  <div className="space-y-4">
                    {formData.pdfUploads.map((pdf, index) => (
                      <div 
                        key={`pdf-${index}`}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DocumentIcon className="h-8 w-8 text-red-500 mr-3" />
                            <div>
                              <h3 className="font-medium text-gray-800">
                                {pdf.fileName}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {pdf.fileSize ? `${Math.round(pdf.fileSize / 1024)} KB • ` : ''}
                                Uploaded {pdf.uploadedAt ? new Date(pdf.uploadedAt).toLocaleDateString() : 'recently'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <a 
                              href={pdf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                              title="View PDF"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </a>
                            <button
                              onClick={() => handleFileDelete(pdf.url, 'pdf')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                              title="Delete PDF"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <DocumentTextIcon className="h-14 w-14 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium mb-2">No PDF documents uploaded</p>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Upload PDF documents such as club guidelines, event schedules, or important forms.
                    </p>
                    <label className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all cursor-pointer">
                      <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                      Upload Your First PDF
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden"
                        onChange={handlePDFUpload}
                      />
                    </label>
                  </div>
                )}

                {formData.pdfUploads && formData.pdfUploads.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500">
                    <p className="font-medium mb-2">PDF Upload Tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Create the PDF from a Google Slides presentation</li>
                      <li>Keep file sizes under 10MB for faster loading</li>
                      <li>Use clear, descriptive filenames</li>
                      <li>Ensure PDFs are properly formatted and readable</li>
                      <li>Please upload only one PDF at a time</li>
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Interest Form Tab */}
            {activeTab === 'form' && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#180D39]">Interest Form Submissions</h2>
                  
                  {formData.interestForm?.submissions && formData.interestForm.submissions.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Add column headers
                          const headers = "Name\tEmail";
                          
                          // Get unique submissions
                          const uniqueSubmissions = getUniqueSubmissions(formData.interestForm!.submissions);
                          
                          // Format the data for Excel (tab separated for columns)
                          const formattedData = uniqueSubmissions
                            .map(submission => `${submission.name}\t${submission.email}`)
                            .join('\n');
                          
                          // Combine headers and data
                          const dataWithHeaders = headers + '\n' + formattedData;
                          
                          // Copy to clipboard
                          navigator.clipboard.writeText(dataWithHeaders)
                            .then(() => {
                              toast.success('Copied to clipboard! Paste into Sheets.');
                            })
                            .catch(err => {
                              console.error('Failed to copy:', err);
                              toast.error('Failed to copy data.');
                            });
                        }}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy for Sheets
                      </button>
                      <button
                        onClick={() => {
                          // Get unique submissions
                          const uniqueSubmissions = getUniqueSubmissions(formData.interestForm!.submissions);
                          
                          // Extract and format just the emails as a comma-separated list
                          const emails = uniqueSubmissions
                            .map(submission => submission.email)
                            .join(', ');
                          
                          // Copy to clipboard
                          navigator.clipboard.writeText(emails)
                            .then(() => {
                              toast.success('Emails copied to clipboard!');
                            })
                            .catch(err => {
                              console.error('Failed to copy:', err);
                              toast.error('Failed to copy data.');
                            });
                        }}
                        className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Copy Emails
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {formData.interestForm?.submissions && formData.interestForm.submissions.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg divide-y">
                      {getUniqueSubmissions(formData.interestForm.submissions).map((submission, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{submission.name}</h3>
                              <p className="text-sm text-gray-500">{submission.email}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Submitted {new Date(submission.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <DocumentIcon className="h-14 w-14 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium mb-2">No submissions yet</p>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        When visitors click the &ldquo;Are you interested?&rdquo; button on your website, their responses will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Design & Links Tab */}
            {activeTab === 'design' && (
              <>
                {/* Theme Section */}
                <section className="bg-white rounded-xl p-6 shadow-sm mb-8">
                  <h2 className="text-xl font-bold text-[#180D39] mb-6">Theme Color</h2>
                  
                  <div>
                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme Color
                      </label>
                      <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => handleThemeChange('primaryColor', color.id)}
                            className={`w-full aspect-square rounded-md transition-all ${
                              formData.theme.primaryColor === color.id 
                                ? 'ring-2 ring-offset-2 ring-black scale-110' 
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                            aria-label={`Select ${color.name} color`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Selected: {getColorById(formData.theme.primaryColor).name}
                      </p>
                      
                      <div className="mt-4 p-4 rounded-lg" style={{ 
                        backgroundColor: getColorById(formData.theme.primaryColor).value,
                        color: getColorById(formData.theme.primaryColor).textDark ? '#111827' : '#F8FAFC' 
                      }}>
                        <p className="font-medium">Color Preview</p>
                        <p className="text-sm opacity-80">This is how your color looks</p>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 