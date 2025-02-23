import OpportunityCard from '@/components/OpportunityCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Text Content */}
          <div>
            <h1 className="text-[3.5rem] font-semibold leading-[1.1] text-[#0A2540] mb-6">
              The platform helping
              <br />
              students spark their
              <br />
              light.
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Connecting students in Naperville & beyond to clubs in high schools,
              community volunteering, and career shadowing.
            </p>
            <div className="flex gap-4 mb-6">
              <button className="bg-[#38BFA1] text-white px-6 py-3 rounded-md hover:bg-[#2DA891] transition-all">
                Start Exploring →
              </button>
              <button className="px-6 py-3 text-[#0A2540] border border-[#0A2540] rounded-md hover:bg-gray-50 transition-all">
                About Us
              </button>
            </div>

            {/* Trust Badge */}
            <p className="text-sm text-gray-500">
              Trusted by 500+ students across local schools
            </p>
          </div>

          {/* Right Column - Card Preview */}
          <div className="relative h-full">
            <OpportunityCard />
          </div>
        </div>
      </div>
    </main>
  );
}
