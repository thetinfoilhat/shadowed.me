'use client';
import { useState, ChangeEvent, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';
import Image from 'next/image';
import { COLOR_OPTIONS, getColorById } from '@/utils/colors';
import { uploadImage, uploadPDF, deleteFile, uploadPDFResource} from '@/utils/fileUpload';

// Icon imports
import { 
  XMarkIcon, 
  PhotoIcon, 
  UserIcon, 
  LinkIcon, 
  PlusIcon, 
  TrashIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  EyeIcon,
  SwatchIcon,
  PaintBrushIcon,
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
  meetingInfo?: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'custom';
    days: { day: string; startTime: string; endTime: string; }[];
    room: string;
    jamboreeTable?: string;
    customInfo?: string;
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
  category?: string;
  activityTypes?: string[];
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

// Add constants for Categories and Activity Types at the top of the file
// Define the categories
const CATEGORIES = [
  'STEM',
  'Business', 
  'Arts',
  'Language & Culture',
  'Community Service',
  'Humanities',
  'Medical',
  'Academic',
  'Miscellaneous'
] as const;

// Define activity types
const ACTIVITY_TYPES = [
  'Competitive',
  'Leaders',
  'Tryout',
  'Public Speaking',
  'Performance'
] as const;

// Define member roles
const MEMBER_ROLES = [
  'President',
  'Sponsor',
  'Co-Prest',
  'Treasurer',
  'Leader',
  'Social Media Manager',
  'Vice-President',
  'Captain',
  'Custom'
] as const;

export default function WebsiteEditor({ website, onSave, isNew = false }: WebsiteEditorProps) {
  // State variables
  const [activeTab, setActiveTab] = useState<'content' | 'media' | 'members' | 'design' | 'form'>('content');
  const [formData, setFormData] = useState<ClubSite>({ ...website });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Meeting information state
  const [meetingDays, setMeetingDays] = useState<{ day: string; startTime: string; endTime: string; }[]>(
    website.meetingInfo?.days || []
  );
  
  // Debounced autosave state
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Refs for scrolling to sections
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  
  // UI states
  /* Commented out as no longer used - dropdown functionality removed
  const [expandedSection, setExpandedSection] = useState<string | null>('banner');
  */
  
  // Media upload states
  const [uploadingMemberPhoto, setUploadingMemberPhoto] = useState<number | null>(null);
  
  // Theme customization state
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  
  // Handle rich text editor state without ReactQuill
  const [editorContent, setEditorContent] = useState(formData.description || '');
  
  // Create a ref to store the handleSave function
  const handleSaveRef = useRef<(partialData?: Partial<ClubSite>) => Promise<void>>((async () => {}));
  
  // Add state for category, activity type, and required contact fields
  const [category, setCategory] = useState<string>(website.category || '');
  const [activityTypes, setActivityTypes] = useState<string[]>(website.activityTypes || []);
  const [sponsorEmail, setSponsorEmail] = useState<string>('');
  const [captainEmail, setCaptainEmail] = useState<string>('');
  const [hasRequiredContacts, setHasRequiredContacts] = useState<boolean>(false);
  
  // Initialize meeting info if it doesn't exist
  useEffect(() => {
    // Ensure meetingInfo has default values if undefined
    if (!formData.meetingInfo) {
      const initialMeetingInfo = {
        frequency: 'weekly' as const,
        days: [],
        room: '',
        jamboreeTable: '',
        customInfo: ''
      };
      setFormData(prev => ({
        ...prev,
        meetingInfo: initialMeetingInfo
      }));
      handleSave({ meetingInfo: initialMeetingInfo });
    }
  }, []);
  
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
    
    // Check for required fields
    const sponsorContact = formData.contactLinks?.find(link => 
      link.label.toLowerCase().includes('sponsor') && link.type === 'email'
    );
    
    const captainContact = formData.contactLinks?.find(link => 
      link.label.toLowerCase().includes('captain') && link.type === 'email'
    );
    
    if (!sponsorContact || !captainContact) {
      toast.error('Please add both sponsor and captain email contacts');
      // Scroll to contact section
      setActiveTab('content');
      setTimeout(() => {
        const contactSection = document.querySelector('section:has(h3:contains("Contact Links"))') as HTMLElement;
        contactSection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
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
    if (type === 'member' && memberIndex !== undefined) {
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
      if (type === 'member') {
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

  // Handle meeting information changes
  const handleMeetingInfoChange = (field: string, value: any) => {
    const updatedMeetingInfo = {
      frequency: formData.meetingInfo?.frequency || 'weekly',
      days: formData.meetingInfo?.days || [],
      room: formData.meetingInfo?.room || '',
      jamboreeTable: formData.meetingInfo?.jamboreeTable || '',
      customInfo: formData.meetingInfo?.customInfo || '',
      ...formData.meetingInfo,
      [field]: value
    };
    handleInputChange('meetingInfo', updatedMeetingInfo);
  };

  const handleAddMeetingDay = () => {
    const newDay = {
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00'
    };
    const updatedDays = [...meetingDays, newDay];
    setMeetingDays(updatedDays);
    handleMeetingInfoChange('days', updatedDays);
  };

  const handleRemoveMeetingDay = (index: number) => {
    const updatedDays = meetingDays.filter((_, i) => i !== index);
    setMeetingDays(updatedDays);
    handleMeetingInfoChange('days', updatedDays);
  };

  const handleMeetingDayChange = (index: number, field: string, value: string) => {
    const updatedDays = meetingDays.map((day, i) => {
      if (i === index) {
        return { ...day, [field]: value };
      }
      return day;
    });
    setMeetingDays(updatedDays);
    handleMeetingInfoChange('days', updatedDays);
  };

  // Add function to handle category change
  const handleCategoryChange = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setFormData(prev => ({
      ...prev,
      category: selectedCategory
    }));
    
    // Set up debounced autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSave({ category: selectedCategory });
    }, 1000);
    
    setAutosaveTimeout(timeout);
  };
  
  // Handle activity type selection
  const toggleActivityType = (type: string) => {
    let updatedTypes;
    if (activityTypes.includes(type)) {
      updatedTypes = activityTypes.filter(t => t !== type);
    } else {
      updatedTypes = [...activityTypes, type];
    }
    
    setActivityTypes(updatedTypes);
    setFormData(prev => ({
      ...prev,
      activityTypes: updatedTypes
    }));
    
    // Set up debounced autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSave({ activityTypes: updatedTypes });
    }, 1000);
    
    setAutosaveTimeout(timeout);
  };
  
  // Handle required contact email changes
  const handleRequiredEmailChange = (type: 'sponsor' | 'captain', value: string) => {
    if (type === 'sponsor') {
      setSponsorEmail(value);
    } else {
      setCaptainEmail(value);
    }
    
    // Update or add to contactLinks
    const updatedContactLinks = [...(formData.contactLinks || [])];
    
    // Find existing contact or index to update
    const existingIndex = updatedContactLinks.findIndex(link => 
      link.label.toLowerCase().includes(type) && link.type === 'email'
    );
    
    if (existingIndex >= 0) {
      // Update existing contact
      updatedContactLinks[existingIndex] = {
        ...updatedContactLinks[existingIndex],
        url: value
      };
    } else {
      // Add new contact
      updatedContactLinks.push({
        type: 'email',
        label: type === 'sponsor' ? 'Sponsor Email' : 'Captain Email',
        url: value
      });
    }
    
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
    }, 1000);
    
    setAutosaveTimeout(timeout);
  };

  // Check if required contacts exist in contactLinks
  useEffect(() => {
    const sponsorContact = formData.contactLinks?.find(link => 
      link.label.toLowerCase().includes('sponsor') && link.type === 'email'
    );
    
    const captainContact = formData.contactLinks?.find(link => 
      link.label.toLowerCase().includes('captain') && link.type === 'email'
    );
    
    setHasRequiredContacts(!!sponsorContact && !!captainContact);
    if (sponsorContact) setSponsorEmail(sponsorContact.url);
    if (captainContact) setCaptainEmail(captainContact.url);
  }, [formData.contactLinks]);

  const handleMeetingTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      meetingInfo: {
        ...prev.meetingInfo!,
        frequency: value as 'weekly' | 'biweekly' | 'monthly' | 'custom'
      }
    }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top sticky navigation bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-[#000000] hidden md:block">
              {isNew ? "Creating: " : "Editing: "} {formData.clubName}
            </h1>
            <span className="text-sm text-black hidden md:block">
              {isNew ? "New website" : `Last saved: ${formData.updatedAt ? new Date(formData.updatedAt).toLocaleTimeString() : 'Not saved yet'}`}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Save status indicator */}
            {isSaving ? (
              <div className="flex items-center text-black">
                <LoadingSpinner size="sm" className="mr-2" />
                <span className="text-sm">Saving...</span>
              </div>
            ) : saveSuccess ? (
              <div className="flex items-center text-green-600">
                <CheckIcon className="h-5 w-5 mr-1" />
                <span className="text-sm">Saved</span>
              </div>
            ) : (
              <div className="text-black text-sm hidden md:block">
                Changes auto-save
              </div>
            )}
            
            {/* Action buttons */}
            <button
              onClick={handleViewSite}
              className="bg-blue-50 text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center hover:bg-blue-100"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View Site
            </button>
            
            <button
              onClick={() => setShowThemeEditor(!showThemeEditor)}
              className="bg-blue-50 text-black px-3 py-1.5 rounded-lg text-sm font-medium flex items-center hover:bg-blue-100"
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
      
      {/* Theme editor panel */}
      {showThemeEditor && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#000000]">Theme Color</h2>
              <button 
                onClick={() => setShowThemeEditor(false)}
                className="text-black hover:text-black"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div>
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
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
                <p className="text-xs text-black mt-2">
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
          </div>
        </div>
      )}
      
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
                <h2 className="text-lg font-bold text-[#000000]">Editor</h2>
              </div>
              
              <nav className="p-2">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center mb-1 ${
                    activeTab === 'content' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-black hover:bg-blue-50'
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
                      : 'text-black hover:bg-blue-50'
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
                      : 'text-black hover:bg-blue-50'
                  }`}
                >
                  <DocumentIcon className="h-5 w-5 mr-2" />
                  Interest Form
                </button>
                
                <button
                  onClick={() => setActiveTab('design')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center mb-1 ${
                    activeTab === 'design' 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-black hover:bg-blue-50'
                  }`}
                >
                  <PaintBrushIcon className="h-5 w-5 mr-2" />
                  Design & Links
                </button>
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
                    <h3 className="text-xl font-bold text-[#000000]">Banner & Club Identity</h3>
                  </div>
                  
                  <div 
                    className="h-[300px] rounded-lg overflow-hidden mb-6 flex items-center justify-center"
                    style={{ backgroundColor: getColorById(formData.theme?.primaryColor || 'blue').value }}
                  >
                    <h1 className="text-4xl font-bold text-white text-center px-6">
                      {formData.clubName || 'Your Club Name'}
                    </h1>
                  </div>
                  
                  <div className="text-sm text-black p-4 bg-blue-50 rounded-lg mb-6">
                    <p className="font-medium mb-2">Banner Tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Your banner will use your selected theme color</li>
                      <li>Make sure your club name is clear and readable</li>
                      <li>You can change the banner color in the Theme settings</li>
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Club Name
                      </label>
                      <input
                        type="text"
                        value={formData.clubName}
                        onChange={(e) => handleInputChange('clubName', e.target.value)}
                        className="w-full px-4 py-3 text-xl font-bold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] text-black"
                        placeholder="Your Club Name"
                        style={{ color: 'black' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Slogan or Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.slogan || ''}
                        onChange={(e) => handleInputChange('slogan', e.target.value)}
                        className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                        placeholder="Add a short, catchy phrase to describe your club"
                      />
                      <p className="text-xs text-black mt-1">A brief statement that captures the essence of your club</p>
                    </div>
                  </div>
                </section>
                
                {/* About Section */}
                <section 
                  ref={(el) => { sectionsRef.current['about'] = el; }} 
                  className="bg-white rounded-xl p-6 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#000000]">About Our Club</h3>
                  </div>
                  
                  <div className="mb-2 text-sm text-black">
                    Share your club&apos;s story, mission, and what makes it special. Make it compelling!
                  </div>
                  
                  <div className="bg-white rounded-lg mb-2 min-h-[200px] border border-gray-300">
                    <div className="p-2 border-b border-gray-200 bg-blue-50 flex gap-2">
                      <button 
                        className="px-2 py-1 rounded hover:bg-blue-100" 
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
                        className="px-2 py-1 rounded hover:bg-blue-100" 
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
                        className="px-2 py-1 rounded hover:bg-blue-100" 
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
                      className="w-full p-4 min-h-[200px] resize-y"
                      placeholder="Describe your club, its mission, and what members do..."
                    />
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-black mb-2">Preview:</p>
                    <div 
                      className="p-4 border rounded-lg bg-white"
                      dangerouslySetInnerHTML={{ __html: editorContent || '...' }} 
                    />
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs text-black">
                    <span>Use formatting tools to organize your content</span>
                    <span>{editorContent ? 
                      `${editorContent.replace(/<[^>]*>/g, '').length} characters` : 
                      '0 characters'}
                    </span>
                  </div>
                </section>

                {/* Categories Section */}
                <section className="bg-white rounded-xl p-6 shadow-sm mt-8">
                  <h3 className="text-xl font-bold text-[#000000] mb-4">Club Category</h3>
                  <p className="text-sm text-black mb-6">
                    Select the category that best represents your club.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => handleCategoryChange(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          category === cat
                            ? 'bg-[#38BFA1] text-white shadow-md'
                            : 'bg-blue-50 text-black hover:bg-blue-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Activity Type Section */}
                <section className="bg-white rounded-xl p-6 shadow-sm mt-8">
                  <h3 className="text-xl font-bold text-[#000000] mb-4">Activity Type</h3>
                  <p className="text-sm text-black mb-6">
                    Select all activity types that apply to your club.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {ACTIVITY_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleActivityType(type)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          activityTypes.includes(type)
                            ? 'bg-[#38BFA1] text-white shadow-md'
                            : 'bg-blue-50 text-black hover:bg-blue-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Team Members Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#000000]">Team Members</h3>
                    <button
                      onClick={handleAddMember}
                      className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Member
                    </button>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <p className="text-sm text-black mb-6">
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
                                className="h-[150px] w-full md:w-[150px] rounded-lg bg-blue-50 mb-2 overflow-hidden relative border border-gray-200"
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
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
                                    <UserIcon className="h-12 w-12 text-black mb-2" />
                                    <span className="text-xs text-black">Add photo</span>
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
                                  <label className="block text-sm font-medium text-black mb-1">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={member.name}
                                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                                    placeholder="Member name"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium text-black mb-1">
                                    Role / Position
                                  </label>
                                  <select
                                    value={member.role === 'Custom' ? 'Custom' : 
                                          MEMBER_ROLES.includes(member.role as typeof MEMBER_ROLES[number]) ? member.role : 'Custom'}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      handleMemberChange(
                                        index, 
                                        'role', 
                                        value === 'Custom' ? '' : value
                                      );
                                      if (value === 'Custom') {
                                        // If Custom is selected, set an empty role to trigger showing the custom input
                                        setTimeout(() => {
                                          const customInput = document.getElementById(`custom-role-${index}`);
                                          if (customInput) (customInput as HTMLInputElement).focus();
                                        }, 100);
                                      }
                                    }}
                                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                                  >
                                    {MEMBER_ROLES.map(role => (
                                      <option key={role} value={role}>{role}</option>
                                    ))}
                                  </select>
                                  
                                  {/* Show custom input field if Custom is selected */}
                                  {(!MEMBER_ROLES.includes(member.role as typeof MEMBER_ROLES[number]) || member.role === 'Custom') && (
                                    <div className="mt-2">
                                      <label className="block text-sm font-medium text-black mb-1">
                                        Custom Role
                                      </label>
                                      <input
                                        id={`custom-role-${index}`}
                                        type="text"
                                        value={member.role === 'Custom' ? '' : member.role}
                                        onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                                        placeholder="Enter custom role..."
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                  Bio <span className="text-black font-normal">(Optional)</span>
                                </label>
                                <textarea
                                  value={member.bio || ''}
                                  onChange={(e) => handleMemberChange(index, 'bio', e.target.value)}
                                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                                  placeholder="Brief bio or statement (interests, goals, etc.)"
                                  rows={3}
                                />
                                <p className="text-xs text-black mt-1">A short personal statement, relevant experience, or contact info</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!formData.members || formData.members.length === 0) && (
                        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-blue-50">
                          <UserIcon className="h-14 w-14 text-black mx-auto mb-3" />
                          <p className="text-black font-medium mb-2">No team members added yet</p>
                          <p className="text-black mb-6 max-w-md mx-auto">Showcase your club&apos;s team by adding photos and information about your members.</p>
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
                      <h3 className="text-xl font-bold text-[#000000]">Documents & Resources</h3>
                      <p className="text-sm text-black mt-1">Share important documents and links with your members</p>
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
                              <h3 className="font-medium text-black">
                                {resource.title}
                              </h3>
                              {resource.description && (
                                <p className="text-sm text-black">{resource.description}</p>
                              )}
                              <p className="text-xs text-black">
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
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-blue-50">
                        <DocumentTextIcon className="h-14 w-14 text-black mx-auto mb-3" />
                        <p className="text-black font-medium mb-2">No resources added yet</p>
                        <p className="text-black mb-6 max-w-md mx-auto">
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
                    <div className="mt-4 text-sm text-black">
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

                {/* Required Contact Links Section */}
                <div className="mb-6 border-b border-gray-200 pb-6">
                  <h4 className="text-md font-semibold text-black mb-3">Required Contact Information</h4>
                  <p className="text-sm text-black mb-4">
                    These email addresses are required and will be displayed on your club card.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Sponsor Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={sponsorEmail}
                        onChange={(e) => handleRequiredEmailChange('sponsor', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                        placeholder="sponsor@school.edu"
                        required
                      />
                      <p className="text-xs text-black mt-1">This will be shown as "@ Sponsor" on your club card</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        Captain Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={captainEmail}
                        onChange={(e) => handleRequiredEmailChange('captain', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                        placeholder="captain@school.edu"
                        required
                      />
                      <p className="text-xs text-black mt-1">This will be shown as "@ Captain" on your club card</p>
                    </div>
                  </div>
                  
                  {!hasRequiredContacts && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-700">
                        <span className="font-medium">Note:</span> Both sponsor and captain emails are required 
                        to submit your club website.
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Links Section */}
                <section className="bg-white rounded-xl p-6 shadow-sm mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#000000]">Contact Links</h3>
                    <button
                      onClick={handleAddContactLink}
                      className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Contact Link
                    </button>
                  </div>
                  
                  <p className="text-sm text-black mb-6">
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
                            <label className="block text-sm font-medium text-black mb-1">
                              Link Type
                            </label>
                            <select
                              value={link.type}
                              onChange={(e) => handleContactLinkChange(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
                            <label className="block text-sm font-medium text-black mb-1">
                              Display Label
                            </label>
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => handleContactLinkChange(index, 'label', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                              placeholder="e.g., Official Website, Email Us, etc."
                            />
                            <p className="text-xs text-black mt-1">The text visitors will see on your website</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-black mb-1">
                              URL or Address
                            </label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => handleContactLinkChange(index, 'url', e.target.value)}
                              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                              placeholder={link.type === 'email' ? 'email@example.com' : 'https://...'}
                            />
                            <p className="text-xs text-black mt-1">
                              {link.type === 'email' ? 'Enter a valid email address' : 'Include https:// for web links'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!formData.contactLinks || formData.contactLinks.length === 0) && (
                      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-blue-50">
                        <LinkIcon className="h-14 w-14 text-black mx-auto mb-3" />
                        <p className="text-black font-medium mb-2">No contact links added yet</p>
                        <p className="text-black mb-6 max-w-md mx-auto">Help visitors connect with your club by adding social media links, email addresses, or other contact information.</p>
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

                {/* Meeting Information Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
                  <h2 className="text-xl font-semibold mb-4">Meeting Information</h2>
                  
                  {/* Meeting Frequency */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Meeting Frequency
                    </label>
                    <select
                      value={formData.meetingInfo?.frequency || 'weekly'}
                      onChange={(e) => handleMeetingInfoChange('frequency', e.target.value)}
                      className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-transparent text-base"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom Schedule</option>
                    </select>
                  </div>

                  {/* Meeting Days */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-black">
                        Meeting Days
                      </label>
                      <button
                        onClick={handleAddMeetingDay}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-[#38BFA1] hover:text-[#2DA891]"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Day
                      </button>
                    </div>
                    
                    {meetingDays.map((day, index) => (
                      <div key={index} className="flex gap-4 mb-2 items-center">
                        <select
                          value={day.day}
                          onChange={(e) => handleMeetingDayChange(index, 'day', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-transparent"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                        
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => handleMeetingDayChange(index, 'startTime', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-transparent"
                        />
                        
                        <span className="text-black">to</span>
                        
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => handleMeetingDayChange(index, 'endTime', e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-transparent"
                        />
                        
                        <button
                          onClick={() => handleRemoveMeetingDay(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Room Number */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={formData.meetingInfo?.room || ''}
                      onChange={(e) => handleMeetingInfoChange('room', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-transparent"
                      placeholder="Enter room number"
                    />
                  </div>

                  {/* Jamboree Table */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Jamboree Table Number
                    </label>
                    <input
                      type="text"
                      value={formData.meetingInfo?.jamboreeTable || ''}
                      onChange={(e) => handleMeetingInfoChange('jamboreeTable', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-transparent"
                      placeholder="Enter jamboree table number"
                    />
                  </div>

                  {/* Custom Meeting Information */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      Custom Meeting Information (Adding Information here will override any meeting information you have inputted above, and display this instead)
                    </label>
                    <textarea
                      value={formData.meetingInfo?.customInfo || ''}
                      onChange={(e) => handleMeetingInfoChange('customInfo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-transparent"
                      placeholder="Enter any additional meeting information here"
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Media Gallery Tab */}
            {activeTab === 'media' && (
              <section className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#000000]">Informational PDF</h2>
                    <p className="text-sm text-black mt-1">Upload and manage your club&apos;s informational PDF</p>
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
                              <h3 className="font-medium text-black">
                                {pdf.fileName}
                              </h3>
                              <p className="text-xs text-black">
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
                  <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-blue-50">
                    <DocumentTextIcon className="h-14 w-14 text-black mx-auto mb-3" />
                    <p className="text-black font-medium mb-2">No PDF documents uploaded</p>
                    <p className="text-black mb-6 max-w-md mx-auto">
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
                  <div className="mt-4 text-sm text-black">
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
                <h2 className="text-xl font-bold text-[#000000] mb-6">Interest Form Submissions</h2>
                
                <div className="space-y-4">
                  {formData.interestForm?.submissions && formData.interestForm.submissions.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg divide-y">
                      {formData.interestForm.submissions.map((submission, index) => (
                        <div key={index} className="p-4 hover:bg-blue-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-black">{submission.name}</h3>
                              <p className="text-sm text-black">{submission.email}</p>
                              <p className="text-xs text-black mt-1">
                                Submitted {new Date(submission.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-blue-50">
                      <DocumentIcon className="h-14 w-14 text-black mx-auto mb-3" />
                      <p className="text-black font-medium mb-2">No submissions yet</p>
                      <p className="text-black mb-6 max-w-md mx-auto">
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
                  <h2 className="text-xl font-bold text-[#000000] mb-6">Theme Color</h2>
                  
                  <div>
                    {/* Primary Color */}
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
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
                      <p className="text-xs text-black mt-2">
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