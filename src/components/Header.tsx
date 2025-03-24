import React from 'react';
import Link from 'next/link';

// Define the possible user roles
type UserRole = 'student' | 'admin' | 'captain' | 'sponsor';

// Mock userRole for now - in a real app this would come from context
const userRole: UserRole = 'student'; // or 'admin', 'captain', 'sponsor'

export default function Header() {
  return (
    <ul className="flex gap-8">
      <li>
        <Link 
          href="/school-clubs"
          className="text-black hover:text-[#38BFA1] font-medium transition-colors"
        >
          School Clubs
        </Link>
      </li>
      {userRole !== 'student' && (
        <li>
          <Link 
            href="/my-visits"
            className="text-black hover:text-[#38BFA1] font-medium transition-colors"
          >
            My Visits
          </Link>
        </li>
      )}
      {(userRole === 'captain' || userRole === 'admin') && (
        <li className="relative group">
          {userRole === 'admin' ? (
            <>
              <div className="flex items-center gap-1 cursor-pointer text-black hover:text-[#38BFA1] font-medium transition-colors">
                <span>Dashboard</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link 
                  href="/captain-dashboard"
                  className="block px-4 py-2 text-sm text-black hover:bg-[#38BFA1]/10 hover:text-[#38BFA1] transition-colors"
                >
                  Captain Dashboard
                </Link>
                <Link 
                  href="/admin-dashboard"
                  className="block px-4 py-2 text-sm text-black hover:bg-[#38BFA1]/10 hover:text-[#38BFA1] transition-colors"
                >
                  Admin Dashboard
                </Link>
              </div>
            </>
          ) : (
            <Link 
              href="/captain-dashboard"
              className="text-black hover:text-[#38BFA1] font-medium transition-colors"
            >
              Captain Dashboard
            </Link>
          )}
        </li>
      )}
      {userRole === 'sponsor' && (
        <li>
          <Link 
            href="/sponsor-dashboard"
            className="text-black hover:text-[#38BFA1] font-medium transition-colors"
          >
            Sponsor Dashboard
          </Link>
        </li>
      )}
      {userRole === 'student' && (
        <li>
          <Link 
            href="/student-dashboard"
            className="text-black hover:text-[#38BFA1] font-medium transition-colors"
          >
            Student Dashboard
          </Link>
        </li>
      )}
      <li>
        <Link 
          href="/what-fits-you"
          className="text-black hover:text-[#38BFA1] font-medium transition-colors"
        >
          What Fits You!
        </Link>
      </li>
      <li>
        <Link 
          href="/about" 
          className="text-black hover:text-[#38BFA1] font-medium transition-colors"
        >
          About
        </Link>
      </li>
    </ul>
  );
} 