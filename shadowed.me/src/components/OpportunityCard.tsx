'use client';
import { motion} from 'framer-motion';

interface Opportunity {
  title: string;
  category: string;
  description: string;
  organization: string;
  location: string;
  timeCommitment: string;
  impact: string;
  spotsLeft: number;
}

const opportunities: Opportunity[] = [
  {
    title: "Local Food Bank Assistant",
    category: "Social Services",
    description: "Help sort and distribute food to those in need in our community",
    organization: "Naperville Food Bank",
    location: "Downtown Naperville",
    timeCommitment: "2-4 hours weekly",
    impact: "Food Security",
    spotsLeft: 5
  },
  {
    title: "Animal Shelter Helper",
    category: "Animal Welfare",
    description: "Care for animals and assist with adoption events",
    organization: "Naperville Animal Shelter",
    location: "South Naperville",
    timeCommitment: "3-6 hours weekly",
    impact: "Animal Care",
    spotsLeft: 3
  }
];

export default function OpportunityCard() {
  return (
    <div className="w-full h-[500px] relative overflow-hidden bg-[#38BFA1]/5 rounded-2xl p-8">
      <motion.div
        animate={{
          y: [0, -100 * opportunities.length],
        }}
        transition={{
          duration: 5 * opportunities.length,
          repeat: Infinity,
          ease: "linear"
        }}
        className="space-y-4"
      >
        {[...opportunities, ...opportunities].map((opportunity, index) => (
          <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-semibold text-[#0A2540]">
                {opportunity.title}
              </h2>
              <span className="bg-[#38BFA1]/10 text-[#38BFA1] px-3 py-1 rounded-full text-sm">
                {opportunity.spotsLeft} spots left
              </span>
            </div>
            
            <span className="inline-block bg-[#38BFA1]/10 text-[#38BFA1] px-3 py-1 rounded-full text-sm mb-4">
              {opportunity.category}
            </span>
            
            <p className="text-lg text-[#0A2540]/70 mb-6">
              {opportunity.description}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[#38BFA1]">🏢</span>
                <span className="text-[#0A2540]">{opportunity.organization}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#38BFA1]">📍</span>
                <span className="text-[#0A2540]">{opportunity.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#38BFA1]">⏰</span>
                <span className="text-[#0A2540]">{opportunity.timeCommitment}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#38BFA1]">✨</span>
                <span className="text-[#0A2540]">Impact: {opportunity.impact}</span>
              </div>
            </div>
            
            <button className="w-full mt-6 bg-[#38BFA1] text-white px-6 py-3 rounded-md hover:bg-[#2DA891] transition-all">
              Sign Up to Volunteer
            </button>
          </div>
        ))}
      </motion.div>
    </div>
  );
} 