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
  officers?: Officer[];
  contactLinks?: ContactLink[];
}

interface WebsiteEditorProps {
  website: ClubWebsiteData;
  onSave: (data: Partial<ClubWebsiteData>) => Promise<boolean | undefined>;
  isNew?: boolean;
}

export default function WebsiteEditor({ website, onSave, isNew = false }: WebsiteEditorProps) {
  const [formData, setFormData] = useState<ClubWebsiteData>(website);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingOfficerPhoto, setUploadingOfficerPhoto] = useState<number | null>(null);
  const [autosaveTimeout, setAutosaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle text input changes
  const handleInputChange = (field: keyof ClubWebsiteData, value: string) => {
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
    try {
      const dataToSave = partialData || formData;
      const success = await onSave(dataToSave);
      
      if (success) {
        toast.success('Changes saved successfully');
      }
    } catch (error) {
      console.error('Error saving website data:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle image uploads
  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>, 
    type: 'banner' | 'gallery' | 'officer',
    officerIndex?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Set the appropriate loading state
    if (type === 'banner') {
      setUploadingBanner(true);
    } else if (type === 'gallery') {
      setUploadingImage(true);
    } else if (type === 'officer' && officerIndex !== undefined) {
      setUploadingOfficerPhoto(officerIndex);
    }
    
    try {
      const storage = getStorage();
      const fileExt = file.name.split('.').pop();
      const fileName = `${formData.id}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `club-websites/${formData.id}/${type}/${fileName}`);
      
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
        handleSave({ bannerImage: downloadURL });
      } else if (type === 'gallery') {
        const updatedGalleryImages = [...(formData.galleryImages || []), downloadURL];
        setFormData(prev => ({
          ...prev,
          galleryImages: updatedGalleryImages
        }));
        handleSave({ galleryImages: updatedGalleryImages });
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
        handleSave({ officers: updatedOfficers });
      }
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      // Clear the loading state
      if (type === 'banner') {
        setUploadingBanner(false);
      } else if (type === 'gallery') {
        setUploadingImage(false);
      } else if (type === 'officer') {
        setUploadingOfficerPhoto(null);
      }
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

  return (
    <div className="pt-[100px] min-h-screen bg-[#FAFAFA]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8">
        {isNew && (
          <div className="bg-blue-50 text-blue-700 rounded-lg p-4 mb-8 border border-blue-200">
            <h2 className="text-lg font-semibold mb-2">Welcome to your new club website!</h2>
            <p>
              Customize your website by filling out the sections below. Your changes are automatically saved.
              Preview your site any time using the Preview button in the bottom-right corner.
            </p>
          </div>
        )}
        
        {/* Save indicator */}
        {isSaving && (
          <div className="fixed top-[100px] right-4 z-40 bg-white rounded-lg shadow-lg py-2 px-4 flex items-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm text-gray-600">Saving...</span>
          </div>
        )}
        
        {/* Banner Image Section */}
        <section className="mb-12">
          <div 
            className="relative h-[300px] rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 mb-4"
            style={{
              backgroundImage: formData.bannerImage ? `url(${formData.bannerImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {uploadingBanner ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <label className="cursor-pointer bg-white/90 text-black px-4 py-2 rounded-lg flex items-center hover:bg-white transition-colors">
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  {formData.bannerImage ? 'Change Banner Image' : 'Add Banner Image'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                  />
                </label>
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Club Name
            </label>
            <input
              type="text"
              value={formData.clubName}
              onChange={(e) => handleInputChange('clubName', e.target.value)}
              className="w-full px-4 py-3 text-3xl font-bold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
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
              className="w-full px-4 py-2 text-lg rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
              placeholder="Add a short, catchy phrase to describe your club"
            />
          </div>
        </section>
        
        {/* About Section */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#180D39] mb-4">About Our Club</h2>
          <textarea
            value={formData.aboutSection || ''}
            onChange={(e) => handleInputChange('aboutSection', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] min-h-[200px]"
            placeholder="Describe your club, its mission, history, and what makes it special..."
          />
        </section>
        
        {/* Meeting Info */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#180D39] mb-4">Meeting Information</h2>
          <textarea
            value={formData.meetingInfo || ''}
            onChange={(e) => handleInputChange('meetingInfo', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1] min-h-[150px]"
            placeholder="When and where does your club meet? What should new members expect? Include any important details..."
          />
        </section>
        
        {/* Gallery */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#180D39] mb-4">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {formData.galleryImages?.map((image, index) => (
              <div key={`gallery-${index}`} className="relative h-[200px] rounded-lg overflow-hidden group">
                <Image 
                  src={image} 
                  alt={`Club gallery image ${index + 1}`} 
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                />
                <button
                  onClick={() => handleRemoveGalleryImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
            
            <div className="h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              {uploadingImage ? (
                <LoadingSpinner size="md" />
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Image</span>
                  <input 
                    type="file" 
                    accept="image/png" 
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'gallery')}
                  />
                </label>
              )}
            </div>
          </div>
        </section>
        
        {/* Officers */}
        <section className="mb-12 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#180D39]">Board Members</h2>
            <button
              onClick={handleAddOfficer}
              className="bg-[#38BFA1] text-white px-3 py-1 rounded-md text-sm flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Board Member
            </button>
          </div>
          
          <div className="space-y-6">
            {formData.officers?.map((officer, index) => (
              <div key={`officer-${index}`} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  onClick={() => handleRemoveOfficer(index)}
                  className="absolute top-2 right-2 text-red-500"
                  aria-label="Remove officer"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-[150px]">
                    <div 
                      className="h-[150px] w-full md:w-[150px] rounded-lg bg-gray-100 mb-2 overflow-hidden relative"
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
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <UserIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      
                      {uploadingOfficerPhoto === index ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                          <label className="cursor-pointer bg-white/90 text-black px-3 py-1 rounded-md text-sm">
                            {officer.photoUrl ? 'Change Photo' : 'Add Photo'}
                            <input 
                              type="file" 
                              accept="image/png" 
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, 'officer', index)}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
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
                        Role
                      </label>
                      <input
                        type="text"
                        value={officer.role}
                        onChange={(e) => handleOfficerChange(index, 'role', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                        placeholder="e.g., President, Treasurer, etc."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio (Optional)
                      </label>
                      <textarea
                        value={officer.bio || ''}
                        onChange={(e) => handleOfficerChange(index, 'bio', e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                        placeholder="Brief bio or statement"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {(!formData.officers || formData.officers.length === 0) && (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-4">No officers added yet</p>
                <button
                  onClick={handleAddOfficer}
                  className="bg-[#38BFA1] text-white px-4 py-2 rounded-md text-sm inline-flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Your First Officer
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
              className="bg-[#38BFA1] text-white px-3 py-1 rounded-md text-sm flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Link
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.contactLinks?.map((link, index) => (
              <div key={`link-${index}`} className="border border-gray-200 rounded-lg p-4 relative">
                <button
                  onClick={() => handleRemoveContactLink(index)}
                  className="absolute top-2 right-2 text-red-500"
                  aria-label="Remove link"
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
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => handleContactLinkChange(index, 'label', e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#38BFA1] focus:border-[#38BFA1]"
                      placeholder="e.g., Official Website, Email Us, etc."
                    />
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
                  </div>
                </div>
              </div>
            ))}
            
            {(!formData.contactLinks || formData.contactLinks.length === 0) && (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 mb-4">No contact links added yet</p>
                <button
                  onClick={handleAddContactLink}
                  className="bg-[#38BFA1] text-white px-4 py-2 rounded-md text-sm inline-flex items-center"
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