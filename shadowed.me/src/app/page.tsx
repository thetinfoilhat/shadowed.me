import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Shadowed.me logo"
            width={32}
            height={32}
            priority
          />
          <span className="font-semibold text-[#725A44]">shadowed.me</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="text-[#725A44] hover:text-[#8B6D54]">Home</a>
          <a href="#" className="text-[#725A44] hover:text-[#8B6D54]">School Clubs</a>
          <a href="#" className="text-[#725A44] hover:text-[#8B6D54]">Volunteering</a>
          <a href="#" className="text-[#725A44] hover:text-[#8B6D54]">Shadowing</a>
          <a href="#" className="text-[#725A44] hover:text-[#8B6D54]">About</a>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 text-[#725A44] border border-[#725A44] rounded-md hover:bg-[#725A44] hover:text-white transition-colors">
            Login
          </button>
          <button className="px-4 py-2 bg-[#725A44] text-white rounded-md hover:bg-[#8B6D54] transition-colors">
            Sign Up
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-20 text-center">
        <div className="flex justify-center gap-2 mb-8">
          {/* Icons for different aspects */}
          <div className="w-12 h-12 rounded-full bg-[#F3EDE7] flex items-center justify-center">
            <span className="text-[#725A44]">👥</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F3EDE7] flex items-center justify-center">
            <span className="text-[#725A44]">✏️</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F3EDE7] flex items-center justify-center">
            <span className="text-[#725A44]">🎓</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F3EDE7] flex items-center justify-center">
            <span className="text-[#725A44]">💡</span>
          </div>
        </div>

        <h1 className="text-5xl font-bold text-[#4A3C2D] mb-6">
          The platform helping<br />students spark their light.
        </h1>
        
        <p className="text-[#725A44] text-lg mb-12 max-w-2xl mx-auto">
          Connecting students in Naperville & beyond to clubs in high schools,
          community volunteering, and career shadowing.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <button className="px-6 py-3 bg-[#725A44] text-white rounded-md hover:bg-[#8B6D54] transition-colors">
            Start Exploring →
          </button>
          <button className="px-6 py-3 text-[#725A44] border border-[#725A44] rounded-md hover:bg-[#F3EDE7] transition-colors">
            About Us
          </button>
        </div>

        <p className="text-[#725A44] text-sm">
          Trusted by 500+ students across local schools
        </p>
      </main>
    </div>
  );
}
