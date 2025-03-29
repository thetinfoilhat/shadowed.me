import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Maximum file sizes
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_PDF_TYPES = ['application/pdf'];

// File upload error types
export enum FileUploadError {
  SIZE_EXCEEDED = 'File size exceeds limit',
  INVALID_TYPE = 'Invalid file type',
  UPLOAD_FAILED = 'Upload failed'
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: FileUploadError;
  fileName: string;
  fileSize?: number;
}

export interface ResourceUploadResult extends UploadResult {
  type: 'pdf' | 'link';
  title: string;
  description?: string;
  uploadedAt: Date;
}

// Get storage path from URL
export const getStoragePathFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const path = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
    return path;
  } catch (error) {
    console.error('Error getting storage path from URL:', error);
    throw new Error('Invalid file URL');
  }
};

// Upload image to Firebase Storage
export const uploadImage = async (
  file: File, 
  clubSlug: string, 
  type: 'banner' | 'gallery' | 'member' | 'featured' = 'gallery'
): Promise<UploadResult> => {
  try {
    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        success: false,
        error: FileUploadError.SIZE_EXCEEDED,
        fileName: file.name
      };
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: FileUploadError.INVALID_TYPE,
        fileName: file.name
      };
    }

    // Generate unique filename
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${fileId}.${fileExtension}`;
    
    // Create storage reference with proper path
    const storageRef = ref(storage, `clubsites/${clubSlug}/${type}/${fileName}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    
    return {
      success: true,
      url: downloadUrl,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: FileUploadError.UPLOAD_FAILED,
      fileName: file.name
    };
  }
};

// Upload PDF to Firebase Storage as a resource
export const uploadPDFResource = async (
  file: File,
  clubSlug: string,
  title: string,
  description?: string
): Promise<ResourceUploadResult> => {
  try {
    // Validate file size
    if (file.size > MAX_PDF_SIZE) {
      return {
        success: false,
        error: FileUploadError.SIZE_EXCEEDED,
        fileName: file.name,
        type: 'pdf',
        title,
        description,
        uploadedAt: new Date()
      };
    }

    // Validate file type
    if (!ALLOWED_PDF_TYPES.includes(file.type)) {
      return {
        success: false,
        error: FileUploadError.INVALID_TYPE,
        fileName: file.name,
        type: 'pdf',
        title,
        description,
        uploadedAt: new Date()
      };
    }

    // Create safe filename
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileId = uuidv4();
    const fileName = `${fileId}-${safeFileName}`;
    
    // Create storage reference with proper path
    const storageRef = ref(storage, `clubsites/${clubSlug}/resources/${fileName}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    
    return {
      success: true,
      url: downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      type: 'pdf',
      title,
      description,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return {
      success: false,
      error: FileUploadError.UPLOAD_FAILED,
      fileName: file.name,
      type: 'pdf',
      title,
      description,
      uploadedAt: new Date()
    };
  }
};

// Create a link resource
export const createLinkResource = (
  url: string,
  title: string,
  description?: string
): ResourceUploadResult => {
  return {
    success: true,
    url,
    fileName: url,
    type: 'link',
    title,
    description,
    uploadedAt: new Date()
  };
};

// Upload PDF to Firebase Storage (legacy support)
export const uploadPDF = async (
  file: File,
  clubSlug: string
): Promise<UploadResult> => {
  try {
    // Validate file size
    if (file.size > MAX_PDF_SIZE) {
      return {
        success: false,
        error: FileUploadError.SIZE_EXCEEDED,
        fileName: file.name
      };
    }

    // Validate file type
    if (!ALLOWED_PDF_TYPES.includes(file.type)) {
      return {
        success: false,
        error: FileUploadError.INVALID_TYPE,
        fileName: file.name
      };
    }

    // Create safe filename
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileId = uuidv4();
    const fileName = `${fileId}-${safeFileName}`;
    
    // Create storage reference with proper path
    const storageRef = ref(storage, `clubsites/${clubSlug}/pdfs/${fileName}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    
    return {
      success: true,
      url: downloadUrl,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return {
      success: false,
      error: FileUploadError.UPLOAD_FAILED,
      fileName: file.name
    };
  }
};

// Delete file from Firebase Storage
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  try {
    // Get the storage path from the URL
    const storagePath = getStoragePathFromUrl(fileUrl);
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Delete file
    await deleteObject(storageRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}; 