import Image from "next/image";

export default function Volunteering() {
  return (
    <div className="min-h-screen px-8 py-12 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-[#4A3C2D] mb-6">Volunteering Opportunities</h1>
      
      <p className="text-[#725A44] text-lg mb-8">
        Make a difference in your community through meaningful volunteer work.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {[
          {
            title: "Local Food Bank",
            description: "Help sort and distribute food to those in need",
            hours: "2-4 hours weekly",
            impact: "Food Security"
          },
          {
            title: "Animal Shelter",
            description: "Care for animals and assist with adoption events",
            hours: "3-6 hours weekly",
            impact: "Animal Welfare"
          },
          {
            title: "Senior Center",
            description: "Spend time with elderly residents",
            hours: "2-3 hours weekly",
            impact: "Elder Care"
          },
          {
            title: "Library Program",
            description: "Help with children's reading programs",
            hours: "2-4 hours weekly",
            impact: "Education"
          }
        ].map((opportunity) => (
          <div key={opportunity.title} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-[#4A3C2D] mb-2">{opportunity.title}</h3>
            <p className="text-[#725A44] mb-4">{opportunity.description}</p>
            <div className="flex gap-4 text-sm text-[#725A44]">
              <span>🕒 {opportunity.hours}</span>
              <span>💫 {opportunity.impact}</span>
            </div>
            <button className="mt-4 px-4 py-2 bg-[#725A44] text-white rounded-md hover:bg-[#8B6D54] transition-colors">
              Sign Up
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 