'use client';
import { useState } from 'react';

interface UserRoleModalProps {
  onSelectAction: (role: 'student' | 'captain') => Promise<void>;
  onCloseAction: () => void;
}

export default function UserRoleModal({ onSelectAction, onCloseAction }: UserRoleModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (role: 'student' | 'captain') => {
    setLoading(true);
    try {
      await onSelectAction(role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full relative">
        <button
          onClick={onCloseAction}
          className="absolute top-4 right-4 text-[#725A44] hover:text-[#8B6D54]"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold text-[#4A3C2D] mb-6">Welcome to shadowed.me!</h2>
        <p className="text-[#725A44] mb-6">Please select your role to continue:</p>
        
        <div className="space-y-4">
          <button
            onClick={() => handleSelect('student')}
            disabled={loading}
            className="w-full px-4 py-4 flex items-center justify-between border border-[#E2D9D0] rounded-lg hover:bg-[#F3EDE7] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">👨‍🎓</span>
              <div className="text-left">
                <div className="font-semibold text-[#4A3C2D]">I&apos;m a Student</div>
                <div className="text-sm text-[#725A44]">Looking to join clubs and volunteer</div>
              </div>
            </div>
            <span className="text-[#725A44]">→</span>
          </button>

          <button
            onClick={() => handleSelect('captain')}
            disabled={loading}
            className="w-full px-4 py-4 flex items-center justify-between border border-[#E2D9D0] rounded-lg hover:bg-[#F3EDE7] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">👨‍🏫</span>
              <div className="text-left">
                <div className="font-semibold text-[#4A3C2D]">I&apos;m a Club Captain</div>
                <div className="text-sm text-[#725A44]">Managing a club or organization</div>
              </div>
            </div>
            <span className="text-[#725A44]">→</span>
          </button>
          
          <div className="mt-6 pt-4 border-t border-[#E2D9D0] text-sm text-[#725A44] text-center">
            <p>Sponsor and Admin roles are assigned by existing administrators.</p>
            <p>Please contact your school administrator if you need these privileges.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 