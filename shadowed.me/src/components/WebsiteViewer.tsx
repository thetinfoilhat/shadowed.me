'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LinkIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

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

interface WebsiteViewerProps {
  website: ClubWebsiteData;
}

export default function WebsiteViewer({ website }: WebsiteViewerProps) {
  const hasGallery = website.galleryImages && website.galleryImages.length > 0;
  const hasOfficers = website.officers && website.officers.length > 0;
  const hasContactLinks = website.contactLinks && website.contactLinks.length > 0;
  
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
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="pt-[80px] min-h-screen bg-[#FAFAFA]">
      {/* Banner Image Section */}
      <div 
        className="w-full h-[300px] md:h-[400px] relative bg-gradient-to-r from-blue-500 to-purple-500"
        style={{
          backgroundImage: website.bannerImage ? `url(${website.bannerImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
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
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          {website.aboutSection && (
            <motion.div 
              className="bg-white rounded-xl p-6 md:p-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-[#180D39] mb-4">
                About Our Club
              </h2>
              <div className="prose prose-lg max-w-none text-[#180D39]/80">
                {website.aboutSection.split('\n').map((paragraph, i) => (
                  paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Gallery Section */}
          {hasGallery && (
            <motion.div 
              className="bg-white rounded-xl p-6 md:p-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2 className="text-2xl font-bold text-[#180D39] mb-6">
                Gallery
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {website.galleryImages?.map((image, index) => (
                  <div key={`gallery-${index}`} className="relative h-[200px] rounded-lg">
                    <Image 
                      src={image}
                      alt={`${website.clubName} gallery image ${index + 1}`}
                      className="object-cover rounded-lg"
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Officers Section */}
          {hasOfficers && (
            <motion.div 
              className="bg-white rounded-xl p-6 md:p-8 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-[#180D39] mb-6">
                Board Members
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {website.officers?.map((officer, index) => (
                  <div 
                    key={`officer-${index}`}
                    className="flex flex-col sm:flex-row gap-4 bg-gray-50 rounded-lg p-4"
                  >
                    <div className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 relative">
                      {officer.photoUrl ? (
                        <Image 
                          src={officer.photoUrl} 
                          alt={officer.name || 'Officer'} 
                          className="object-cover"
                          fill
                          sizes="100px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#38BFA1]/20">
                          <UserIcon className="h-8 w-8 text-[#38BFA1]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#180D39] text-lg">{officer.name}</h3>
                      <p className="text-[#38BFA1] font-medium mb-2">{officer.role}</p>
                      {officer.bio && (
                        <p className="text-sm text-[#180D39]/70">{officer.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meeting Info Section */}
          {website.meetingInfo && (
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center mb-4">
                <CalendarIcon className="h-5 w-5 text-[#38BFA1] mr-2" />
                <h2 className="text-xl font-bold text-[#180D39]">
                  Meeting Information
                </h2>
              </div>
              <div className="prose prose-sm max-w-none text-[#180D39]/80">
                {website.meetingInfo.split('\n').map((paragraph, i) => (
                  paragraph ? <p key={i}>{paragraph}</p> : <br key={i} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Contact Links Section */}
          {hasContactLinks && (
            <motion.div 
              className="bg-white rounded-xl p-6 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center mb-4">
                <LinkIcon className="h-5 w-5 text-[#38BFA1] mr-2" />
                <h2 className="text-xl font-bold text-[#180D39]">
                  Contact & Links
                </h2>
              </div>
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
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#38BFA1]/10 text-[#38BFA1] mr-3">
                        {getLinkIcon(link.type)}
                      </span>
                      <span className="font-medium text-[#180D39]">{link.label}</span>
                    </a>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Back to Jamboree Link */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <Link 
              href="/jamboree"
              className="flex items-center text-[#38BFA1] font-medium hover:underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Jamboree
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 