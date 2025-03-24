'use client';
import { useState, ChangeEvent, useRef, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import LoadingSpinner from './LoadingSpinner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { COLOR_OPTIONS, TEXT_COLORS, getColorById, getTextColorById } from '@/utils/colors';
import { FONT_OPTIONS, getFontById } from '@/utils/fonts';
import { uploadImage, uploadPDF } from '@/utils/fileUpload';

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
  PencilIcon,
  EyeIcon,
  SwatchIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

// Import the ClubSite type
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
  pdfUploads?: {
    fileName: string;
    url: string;
    uploadedAt: Date;
    fileSize?: number;
  }[];
  lastUpdated?: Date;
  featuredImage?: string;    // URL to featured image from gallery
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

export default function WebsiteEditor({ website, onSave, isNew = false }: WebsiteEditorProps) {
  // State variables
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState<ClubSite>({ ...website });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const router = useRouter();
  
  // Debounced autosave state
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Refs for scrolling to sections
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({});
  
  // UI States
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('about');
  
  // Media upload states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingMemberPhoto, setUploadingMemberPhoto] = useState<number | null>(null);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  
  // Theme customization state
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  
  // Handle rich text editor state without ReactQuill
  const [editorContent, setEditorContent] = useState<string>(website.description || '');
  
  // Create a ref to store the handleSave function
  const handleSaveRef = useRef<(partialData?: Partial<ClubSite>) => Promise<void>>((async () => {}));
  
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
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
    
    // Scroll to section after state update
    setTimeout(() => {
      if (sectionsRef.current[section]) {
        sectionsRef.current[section]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
    
    setUploadingPDF(true);
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
      setUploadingPDF(false);
      e.target.value = '';
    }
  };
  
  // Handle file deletion (images or PDFs)
  const handleFileDelete = async (fileUrl: string, type: 'gallery' | 'pdf') => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this file? This cannot be undone.');
      if (!confirmDelete) return;
      
      const toastId = toast.loading('Deleting file...');
      
      // Delete from storage
      try {
        // The deleteObject function is called internally by deleteFile
        await deleteObject(ref(getStorage(), fileUrl));
      } catch (error) {
        console.warn('Error deleting from storage, may be already deleted:', error);
        // Continue with UI update even if storage delete fails
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
  
  // Handle preview toggle
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  // Handle view site
  const handleViewSite = () => {
    router.push(`/${formData.slug}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top sticky navigation bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
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
              onClick={handleTogglePreview}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center hover:bg-gray-200"
            >
              {showPreview ? <PencilIcon className="h-4 w-4 mr-1" /> : <EyeIcon className="h-4 w-4 mr-1" />}
              {showPreview ? "Edit" : "Preview"}
            </button>
            
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
      
      {/* Theme editor panel */}
      {showThemeEditor && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#180D39]">Customize Theme</h2>
              <button 
                onClick={() => setShowThemeEditor(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="grid grid-cols-5 gap-2">
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
              </div>
              
              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleThemeChange('textColor', color.id)}
                      className={`w-full py-2 rounded-md transition-all flex items-center justify-center ${
                        formData.theme.textColor === color.id 
                          ? 'ring-2 ring-offset-2 ring-black' 
                          : 'hover:opacity-80'
                      }`}
                      style={{ 
                        backgroundColor: color.value,
                        color: color.id === 'dark' ? 'white' : 'black'
                      }}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {getTextColorById(formData.theme.textColor).name}
                </p>
              </div>
              
              {/* Font Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font
                </label>
                <div className="space-y-2">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => handleThemeChange('font', font.id)}
                      className={`w-full py-2 px-3 rounded-md transition-all text-left ${
                        formData.theme.font === font.id 
                          ? 'bg-gray-100 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                    >
                      <span className={font.className}>{font.name}</span>
                    </button>
                  ))}
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
        {showPreview ? (
          <div className="bg-gray-100 p-4 rounded-lg mb-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <iframe 
                src={`/${formData.slug}?preview=true`} 
                className="w-full h-[80vh]"
                title="Website Preview"
              />
            </div>
          </div>
        ) : (
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
                    Media Gallery
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center mb-1 ${
                      activeTab === 'members' 
                        ? 'bg-blue-50 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <UserIcon className="h-5 w-5 mr-2" />
                    Team Members
                  </button>
                  
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
                      <h3 className="text-xl font-bold text-[#180D39]" onClick={() => toggleSection('banner')} style={{cursor: 'pointer'}}>Banner & Club Identity</h3>
                    </div>
                    
                    {expandedSection === 'banner' && (
                      <>
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
                              className="w-full px-4 py-3 text-xl font-bold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
                              className="w-full px-4 py-3 text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                              placeholder="Add a short, catchy phrase to describe your club"
                            />
                            <p className="text-xs text-gray-500 mt-1">A brief statement that captures the essence of your club</p>
                          </div>
                        </div>
                      </>
                    )}
                  </section>
                  
                  {/* About Section */}
                  <section 
                    ref={(el) => { sectionsRef.current['about'] = el; }} 
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-[#180D39]" onClick={() => toggleSection('about')} style={{cursor: 'pointer'}}>About Our Club</h3>
                    </div>
                    
                    {expandedSection === 'about' && (
                      <>
                        <div className="mb-2 text-sm text-gray-600">
                          Share your club&apos;s story, mission, and what makes it special. Make it compelling!
                        </div>
                        
                        <div className="bg-white rounded-lg mb-2 min-h-[200px] border border-gray-300">
                          <div className="p-2 border-b border-gray-200 bg-gray-50 flex gap-2">
                            <button 
                              className="px-2 py-1 rounded hover:bg-gray-200" 
                              onClick={() => {
                                // Insert h2 tag at cursor position or wrap selected text
                                const textarea = document.getElementById('description-editor') as HTMLTextAreaElement;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = textarea.value;
                                const selectedText = text.substring(start, end);
                                
                                const newText = text.substring(0, start) + 
                                  `<h2>${selectedText}</h2>` + 
                                  text.substring(end);
                                
                                setEditorContent(newText);
                              }}
                            >
                              H2
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
                            className="w-full p-4 min-h-[200px] resize-y"
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
                      </>
                    )}
                  </section>
                  
                  {/* Meeting Info Section */}
                  <section 
                    ref={(el) => { sectionsRef.current['meeting'] = el; }} 
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-[#180D39]" onClick={() => toggleSection('meeting')} style={{cursor: 'pointer'}}>Meeting Information</h3>
                    </div>
                    
                    {expandedSection === 'meeting' && (
                      <>
                        <div className="mb-2 text-sm text-gray-600">
                          Provide details about when and where your club meets, and what new members should know.
                        </div>
                        <textarea
                          value={formData.meetingInfo || ''}
                          onChange={(e) => handleInputChange('meetingInfo', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] min-h-[150px]"
                          placeholder="When and where does your club meet? What should new members expect? Include any important details..."
                        />
                        <div className="flex justify-end mt-2 text-xs text-gray-500">
                          <span>{formData.meetingInfo?.length || 0} characters</span>
                        </div>
                      </>
                    )}
                  </section>
                  
                  {/* PDF Documents Section */}
                  <section 
                    ref={(el) => { sectionsRef.current['documents'] = el; }} 
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-[#180D39]" onClick={() => toggleSection('documents')} style={{cursor: 'pointer'}}>Documents & Resources</h3>
                    </div>
                    
                    {expandedSection === 'documents' && (
                      <>
                        <div className="mb-4 text-sm text-gray-600">
                          Upload PDFs such as schedules, rule books, forms, or any other important documents for your members.
                        </div>
                        
                        <div className="space-y-4">
                          {/* PDF Upload List */}
                          {formData.pdfUploads && formData.pdfUploads.length > 0 ? (
                            <div className="border border-gray-200 rounded-lg divide-y">
                              {formData.pdfUploads.map((pdf, index) => (
                                <div key={`pdf-${index}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                  <div className="flex items-center">
                                    <DocumentIcon className="h-8 w-8 text-red-500 mr-3" />
                                    <div>
                                      <h3 className="font-medium text-gray-800">{pdf.fileName}</h3>
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
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500 mb-2">No documents uploaded yet</p>
                              <p className="text-sm text-gray-400 mb-4">PDFs up to 10MB are supported</p>
                            </div>
                          )}
                          
                          {/* Upload button */}
                          <div className="mt-4">
                            <label className="cursor-pointer inline-flex items-center bg-white border border-gray-300 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                              <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-gray-500" />
                              {uploadingPDF ? 'Uploading...' : 'Upload PDF Document'}
                              <input 
                                type="file" 
                                accept="application/pdf" 
                                className="hidden"
                                onChange={handlePDFUpload}
                                disabled={uploadingPDF}
                              />
                            </label>
                            
                            <p className="text-xs text-gray-500 mt-2">
                              Max file size: 10MB
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </section>
                </>
              )}

              {/* Team Members Tab */}
              {activeTab === 'members' && (
                <section className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-[#180D39]">Team Members</h2>
                    <button
                      onClick={handleAddMember}
                      className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Member
                    </button>
                  </div>
                  
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
                                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
                                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
                </section>
              )}

              {/* Design & Links Tab */}
              {activeTab === 'design' && (
                <>
                  {/* Theme Section */}
                  <section className="bg-white rounded-xl p-6 shadow-sm mb-8">
                    <h2 className="text-xl font-bold text-[#180D39] mb-6">Theme Customization</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Primary Color */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Color
                        </label>
                        <div className="grid grid-cols-5 gap-2">
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
                      
                      {/* Text Color */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Text Color
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {TEXT_COLORS.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => handleThemeChange('textColor', color.id)}
                              className={`w-full py-2 rounded-md transition-all flex items-center justify-center ${
                                formData.theme.textColor === color.id 
                                  ? 'ring-2 ring-offset-2 ring-black' 
                                  : 'hover:opacity-80'
                              }`}
                              style={{ 
                                backgroundColor: color.value,
                                color: color.id === 'dark' ? 'white' : 'black'
                              }}
                            >
                              {color.name}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Selected: {getTextColorById(formData.theme.textColor).name}
                        </p>
                        
                        <div className="mt-4 p-4 rounded-lg border" style={{ 
                          color: getTextColorById(formData.theme.textColor).value
                        }}>
                          <p className="font-medium">Text Color Preview</p>
                          <p className="text-sm">This is how your text will appear</p>
                        </div>
                      </div>
                      
                      {/* Font Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Font
                        </label>
                        <div className="space-y-2">
                          {FONT_OPTIONS.map((font) => (
                            <button
                              key={font.id}
                              onClick={() => handleThemeChange('font', font.id)}
                              className={`w-full py-2 px-3 rounded-md transition-all text-left ${
                                formData.theme.font === font.id 
                                  ? 'bg-gray-100 border-l-4 border-blue-500' 
                                  : 'hover:bg-gray-50 border-l-4 border-transparent'
                              }`}
                            >
                              <span className={font.className}>{font.name}</span>
                            </button>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-4 rounded-lg border">
                          <p className={`font-medium ${getFontById(formData.theme.font).className}`}>
                            Font Preview: {getFontById(formData.theme.font).name}
                          </p>
                          <p className={`text-sm ${getFontById(formData.theme.font).className}`}>
                            The quick brown fox jumps over the lazy dog.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  {/* Contact Links Section */}
                  <section className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-[#180D39]">Contact Links</h2>
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
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Display Label
                              </label>
                              <input
                                type="text"
                                value={link.label}
                                onChange={(e) => handleContactLinkChange(index, 'label', e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 