'use client';
import { useState, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LoadingSpinner from './LoadingSpinner';
import Image from 'next/image';

// Icon imports
import { 
  XMarkIcon, 
  PhotoIcon, 
  UserIcon, 
  LinkIcon, 
  PlusIcon, 
  TrashIcon,
  ArrowUpTrayIcon 
} from '@heroicons/react/24/outline';

interface Officer {
  name: string;
  role: string;
  photoUrl?: string;
  bio?: string;
}

interface ContactLink {
  type: string;
  url: string;
  label: string;
}

interface ImageWithMetadata {
  url: string;
  title?: string;
  caption?: string;
  uploadedAt: Date;
}

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
  galleryImagesMetadata?: ImageWithMetadata[];
  officers?: Officer[];
  contactLinks?: ContactLink[];
  themeColor?: string;
  showFeaturedImage?: boolean;
  featuredImage?: string;
}

interface WebsiteEditorProps {
  website: ClubWebsiteData;
  onSave: (data: Partial<ClubWebsiteData>) => Promise<boolean | undefined>;
  isNew?: boolean;
}

export default function WebsiteEditor({ website, onSave, isNew = false }: WebsiteEditorProps) {
  const [formData, setFormData] = useState<ClubWebsiteData>(website);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingOfficerPhoto, setUploadingOfficerPhoto] = useState<number | null>(null);
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle text input changes
  const handleInputChange = (field: keyof ClubWebsiteData, value: string | boolean | undefined) => {
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
      handleSave({ [field]: value });
    }, 2000);
    
    setAutosaveTimeout(timeout);
  };

  // Save the form data
  const handleSave = async (partialData?: Partial<ClubWebsiteData>) => {
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
      
      const success = await onSave(cleanedData as Partial<ClubWebsiteData>);
      
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        toast.success('Changes saved successfully');
      }
    } catch (error) {
      console.error('Error saving website data:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Save all form data at once
  const handleSaveAll = () => {
    // Clear any pending autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
      setAutosaveTimeout(null);
    }
    
    // Save the entire form
    handleSave(formData);
  };

  // Handle image uploads
  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>, 
    type: 'banner' | 'gallery' | 'officer' | 'featured',
    officerIndex?: number
  ): Promise<string | undefined> => {
    const file = e.target.files?.[0];
    if (!file) {
      // Reset the file input
      e.target.value = '';
      return undefined;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG or PNG image.');
      // Reset the file input
      e.target.value = '';
      return undefined;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Please upload an image under 5MB.');
      // Reset the file input
      e.target.value = '';
      return undefined;
    }
    
    // Set the appropriate loading state
    if (type === 'banner') {
      setUploadingBanner(true);
    } else if (type === 'gallery' || type === 'featured') {
      setUploadingImage(true);
    } else if (type === 'officer' && officerIndex !== undefined) {
      setUploadingOfficerPhoto(officerIndex);
    }
    
    try {
      const storage = getStorage();
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.id}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `club-websites/${formData.id}/${type}/${fileName}`);
      
      // Show feedback during upload
      const toastId = toast.loading('Uploading image...');
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the appropriate state
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
          featuredImage: downloadURL,
          showFeaturedImage: true
        }));
        
        await handleSave({ 
          featuredImage: downloadURL,
          showFeaturedImage: true
        });
      } else if (type === 'officer' && officerIndex !== undefined) {
        const updatedOfficers = [...(formData.officers || [])];
        updatedOfficers[officerIndex] = {
          ...updatedOfficers[officerIndex],
          photoUrl: downloadURL
        };
        setFormData(prev => ({
          ...prev,
          officers: updatedOfficers
        }));
        await handleSave({ officers: updatedOfficers });
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
      } else if (type === 'gallery' || type === 'featured') {
        setUploadingImage(false);
      } else if (type === 'officer') {
        setUploadingOfficerPhoto(null);
      }
      
      // Reset the file input
      e.target.value = '';
    }
  };

  // Handle gallery image removal
  const handleRemoveGalleryImage = (indexToRemove: number) => {
    const updatedGalleryImages = formData.galleryImages?.filter((_, index) => index !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      galleryImages: updatedGalleryImages
    }));
    handleSave({ galleryImages: updatedGalleryImages });
  };

  // Handle officers
  const handleAddOfficer = () => {
    const newOfficer: Officer = {
      name: '',
      role: ''
    };
    
    const updatedOfficers = [...(formData.officers || []), newOfficer];
    setFormData(prev => ({
      ...prev,
      officers: updatedOfficers
    }));
  };

  const handleRemoveOfficer = (indexToRemove: number) => {
    const updatedOfficers = formData.officers?.filter((_, index) => index !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      officers: updatedOfficers
    }));
    handleSave({ officers: updatedOfficers });
  };

  const handleOfficerChange = (index: number, field: keyof Officer, value: string) => {
    const updatedOfficers = [...(formData.officers || [])];
    updatedOfficers[index] = {
      ...updatedOfficers[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      officers: updatedOfficers
    }));
    
    // Set up debounced autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSave({ officers: updatedOfficers });
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

  // Handle gallery image metadata updates
  const handleImageMetadataChange = (index: number, field: 'title' | 'caption', value: string) => {
    const updatedMetadata = [...(formData.galleryImagesMetadata || [])];
    if (!updatedMetadata[index]) {
      // Create metadata if it doesn't exist yet
      const imageUrl = formData.galleryImages?.[index] || '';
      updatedMetadata[index] = { 
        url: imageUrl, 
        uploadedAt: new Date() 
      };
    }
    
    // Update the field
    updatedMetadata[index][field] = value;
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      galleryImagesMetadata: updatedMetadata
    }));
    
    // Set up debounced autosave
    if (autosaveTimeout) {
      clearTimeout(autosaveTimeout);
    }
    
    const timeout = setTimeout(() => {
      handleSave({ galleryImagesMetadata: updatedMetadata });
    }, 1000);
    
    setAutosaveTimeout(timeout);
  };

  return (
    <div className="pt-[100px] min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
        {/* Save Controls */}
        <div className="sticky top-[100px] z-40 bg-white rounded-lg shadow-lg py-3 px-4 flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#180D39]">
            Editing: {formData.clubName}
          </h1>
          <div className="flex items-center space-x-4">
            {isSaving ? (
              <div className="flex items-center text-gray-600">
                <LoadingSpinner size="sm" className="mr-2" />
                <span>Saving...</span>
              </div>
            ) : saveSuccess ? (
              <div className="flex items-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Saved</span>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                Changes auto-save as you type
              </div>
            )}
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#4361EE] to-[#3A54D4] text-white px-6 py-2 rounded-lg font-medium flex items-center hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </div>

        {isNew && (
          <div className="bg-blue-50 text-blue-700 rounded-lg p-4 mb-8 border border-blue-200">
            <h2 className="text-lg font-semibold mb-2">Welcome to your new club website!</h2>
            <p>
              Customize your website by filling out the sections below. Your changes are automatically saved.
              Preview your site any time using the Preview button in the top control bar.
            </p>
          </div>
        )}
        
        {/* Banner Image Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[#180D39] mb-4">Banner & Club Identity</h2>
          
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
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
            
            <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">Banner Image Tips:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use a high-quality landscape image (recommended size: 1200 × 400 pixels)</li>
                <li>Keep file size under 5MB for faster loading</li>
                <li>Choose an image that represents your club&apos;s identity</li>
                <li>Ensure good contrast with text that will appear on top</li>
              </ul>
            </div>
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
                className="w-full px-4 py-3 text-2xl font-bold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
        </section>
        
        {/* About Section */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#180D39] mb-4">About Our Club</h2>
          <div className="mb-2 text-sm text-gray-600">
            Share your club&apos;s story, mission, and what makes it special. Make it compelling!
          </div>
          <textarea
            value={formData.aboutSection || ''}
            onChange={(e) => handleInputChange('aboutSection', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] min-h-[200px]"
            placeholder="Describe your club, its mission, history, and what makes it special..."
          />
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Use multiple paragraphs to organize your content</span>
            <span>{formData.aboutSection?.length || 0} characters</span>
          </div>
        </section>
        
        {/* Meeting Info */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#180D39] mb-4">Meeting Information</h2>
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
        </section>
        
        {/* Gallery */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#180D39] mb-4">Gallery</h2>
          
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h3 className="text-md font-medium text-[#180D39] mb-3">Featured Image</h3>
              
              {formData.featuredImage ? (
                <div className="relative h-[250px] rounded-lg overflow-hidden mb-3">
                  <Image 
                    src={formData.featuredImage} 
                    alt="Featured club image" 
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleInputChange('featuredImage', '')}
                        className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                        aria-label="Remove featured image"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-3">
                  {uploadingImage ? (
                    <LoadingSpinner size="md" />
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center p-6 w-full h-full hover:bg-gray-100 transition-colors rounded-lg">
                      <PhotoIcon className="h-10 w-10 text-gray-400 mb-3" />
                      <span className="text-sm font-medium text-gray-700 mb-1">Set Featured Image</span>
                      <span className="text-xs text-gray-500">PNG and JPG files supported</span>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg" 
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'featured')}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <h3 className="text-md font-medium text-[#180D39] mb-3">Gallery Images</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {formData.galleryImages?.map((image, index) => (
              <div key={`gallery-${index}`} className="relative rounded-lg overflow-hidden group border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <div className="h-[200px] relative">
                  <Image 
                    src={image} 
                    alt={`Club gallery image ${index + 1}`} 
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                      <button
                        onClick={() => {
                          if (formData.featuredImage !== image) {
                            handleInputChange('featuredImage', image);
                            handleInputChange('showFeaturedImage', 'true');
                          }
                        }}
                        className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                        title="Set as featured"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRemoveGalleryImage(index)}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        title="Remove image"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-white border-t border-gray-100">
                  <input
                    type="text"
                    placeholder="Image title (optional)"
                    className="w-full px-3 py-2 text-sm rounded border border-gray-300 mb-2 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                    value={(formData.galleryImagesMetadata?.[index]?.title || '')}
                    onChange={(e) => handleImageMetadataChange(index, 'title', e.target.value)}
                  />
                  
                  <textarea
                    placeholder="Caption (optional)"
                    className="w-full px-3 py-2 text-sm rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] resize-none"
                    rows={2}
                    value={(formData.galleryImagesMetadata?.[index]?.caption || '')}
                    onChange={(e) => handleImageMetadataChange(index, 'caption', e.target.value)}
                  />
                </div>
              </div>
            ))}
            
            <div className="h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
              {uploadingImage ? (
                <div className="flex flex-col items-center justify-center p-6">
                  <LoadingSpinner size="md" />
                  <p className="mt-4 text-gray-600 font-medium">Uploading image...</p>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center p-6 w-full h-full hover:bg-gray-50 transition-colors rounded-lg">
                  <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-3" />
                  <span className="text-base text-gray-700 font-medium mb-2">Add Images</span>
                  <span className="text-sm text-gray-500 mb-1">Click to browse files</span>
                  <span className="text-xs text-gray-400">PNG and JPG files supported (max 5MB)</span>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'gallery')}
                  />
                </label>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
            <p className="font-medium mb-2">Tips for great gallery images:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use high-quality PNG or JPG images for best results</li>
              <li>Keep file sizes under 5MB for faster uploads</li>
              <li>Use consistent dimensions (like square 1:1 ratio) for a polished look</li>
              <li>Add meaningful titles and captions to make your gallery more engaging</li>
            </ul>
          </div>
        </section>
        
        {/* Officers */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#180D39]">Board Members</h2>
            <button
              onClick={handleAddOfficer}
              className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-4 py-2 rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Board Member
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            Add your club&apos;s leadership team with photos, names, roles, and short bios.
          </p>
          
          <div className="space-y-6">
            {formData.officers?.map((officer, index) => (
              <div key={`officer-${index}`} className="border border-gray-200 rounded-lg p-4 relative hover:shadow-md transition-all">
                <button
                  onClick={() => handleRemoveOfficer(index)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 bg-white rounded-full p-1 shadow-sm"
                  aria-label="Remove officer"
                  title="Remove board member"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-[150px] flex-shrink-0">
                    <div 
                      className="h-[150px] w-full md:w-[150px] rounded-lg bg-gray-100 mb-2 overflow-hidden relative border border-gray-200"
                    >
                      {officer.photoUrl ? (
                        <Image 
                          src={officer.photoUrl} 
                          alt={officer.name || 'Officer photo'} 
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
                      
                      {uploadingOfficerPhoto === index ? (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                          <LoadingSpinner size="sm" />
                          <span className="text-white text-xs mt-2">Uploading...</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                          <label className="cursor-pointer bg-white/90 text-black px-3 py-1 rounded-md text-sm shadow-sm hover:shadow-md">
                            {officer.photoUrl ? 'Change Photo' : 'Add Photo'}
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg, image/jpg" 
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'officer', index)}
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
                          value={officer.name}
                          onChange={(e) => handleOfficerChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                          placeholder="Officer name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role / Position
                        </label>
                        <input
                          type="text"
                          value={officer.role}
                          onChange={(e) => handleOfficerChange(index, 'role', e.target.value)}
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
                        value={officer.bio || ''}
                        onChange={(e) => handleOfficerChange(index, 'bio', e.target.value)}
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
            
            {(!formData.officers || formData.officers.length === 0) && (
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <UserIcon className="h-14 w-14 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-2">No board members added yet</p>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Showcase your club&apos;s leadership team by adding photos and information about your board members.</p>
                <button
                  onClick={handleAddOfficer}
                  className="bg-gradient-to-r from-[#38BFA1] to-[#2DA891] text-white px-5 py-2.5 rounded-lg text-sm inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Your First Board Member
                </button>
              </div>
            )}
          </div>
        </section>
        
        {/* Contact Links */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
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
      </div>
    </div>
  );
} 