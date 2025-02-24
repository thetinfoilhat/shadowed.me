'use client';
import { ReactElement } from 'react';
import { Dialog } from '@headlessui/react';

type Applicant = {
  name: string;
  email: string;
  grade: string;
  school: string;
};

export default function ApplicantsDialog({ 
  isOpen, 
  onCloseAction,
  applicants 
}: { 
  isOpen: boolean;
  onCloseAction: () => void;
  applicants: Applicant[];
}): ReactElement {
  return (
    <Dialog open={isOpen} onClose={onCloseAction} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-xl bg-white p-8">
          <Dialog.Title className="text-2xl font-semibold text-black mb-6">
            Registered Applicants
          </Dialog.Title>

          {applicants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black">No applicants have registered yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="font-medium text-black">Name</div>
                <div className="font-medium text-black">Grade</div>
                <div className="font-medium text-black">School</div>
                <div className="font-medium text-black">Email</div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {applicants.map((applicant, index) => (
                  <div 
                    key={index}
                    className="grid grid-cols-4 gap-4 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-black truncate">
                      {applicant.name}
                    </div>
                    <div className="text-black truncate">
                      {applicant.grade}
                    </div>
                    <div className="text-black truncate">
                      {applicant.school}
                    </div>
                    <div className="text-black truncate">
                      <a 
                        href={`mailto:${applicant.email}`}
                        className="text-[#38BFA1] hover:underline"
                      >
                        {applicant.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-black">
              Total Applicants: {applicants.length}
            </div>
            <button
              type="button"
              onClick={onCloseAction}
              className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-black"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 