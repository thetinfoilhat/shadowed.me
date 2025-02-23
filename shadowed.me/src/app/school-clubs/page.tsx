import Image from "next/image";

export default function SchoolClubs() {
  return (
    <div className="min-h-screen px-8 py-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-[#4A3C2D] mb-6">School Clubs</h1>
      
      <p className="text-[#725A44] text-lg mb-8">
        Discover and join clubs that match your interests at local high schools.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example Club Cards */}
        {['Robotics Club', 'Debate Team', 'Art Society', 'Chess Club', 'Environmental Club', 'Music Ensemble'].map((club) => (
          <div key={club} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#F3EDE7] flex items-center justify-center mb-4">
              <span className="text-[#725A44]">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-[#4A3C2D] mb-2">{club}</h3>
            <p className="text-[#725A44] mb-4">
              Join fellow students in exploring and developing your interests.
            </p>
            <button className="text-[#725A44] font-medium hover:text-[#8B6D54]">
              Learn more →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 