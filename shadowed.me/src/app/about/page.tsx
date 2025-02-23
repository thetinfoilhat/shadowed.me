import Image from "next/image";

export default function About() {
  return (
    <div className="min-h-screen px-8 py-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-[#4A3C2D] mb-6">About Shadowed.me</h1>
      
      <div className="prose prose-lg text-[#725A44] max-w-none">
        <p className="text-lg mb-8">
          We&apos;re on a mission to help students discover their passions and connect with meaningful opportunities 
          in their local community.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
          <div className="bg-[#F3EDE7] p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-[#4A3C2D] mb-4">Our Mission</h3>
            <p>
              To empower students by connecting them with enriching opportunities that foster personal growth 
              and community engagement.
            </p>
          </div>

          <div className="bg-[#F3EDE7] p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-[#4A3C2D] mb-4">Our Vision</h3>
            <p>
              Creating a vibrant community where every student can explore their interests and make 
              meaningful contributions.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#4A3C2D] mb-4">How We Help</h2>
        <ul className="space-y-4 mb-8">
          <li>Connect students with school clubs that match their interests</li>
          <li>Facilitate meaningful volunteer opportunities in the community</li>
          <li>Build bridges between students and local organizations</li>
        </ul>

        <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
          <h2 className="text-2xl font-bold text-[#4A3C2D] mb-4">Get In Touch</h2>
          <p className="mb-4">
            Have questions or want to learn more about how we can help? We'd love to hear from you.
          </p>
          <button className="px-6 py-3 bg-[#725A44] text-white rounded-md hover:bg-[#8B6D54] transition-colors">
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
} 