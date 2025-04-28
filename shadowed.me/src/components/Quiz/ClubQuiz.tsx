import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedIntro from './EnhancedIntro';

// Define Club type
type Club = {
  name: string;
  attributes: string[];
  description?: string;
};

// Define question types
type QuestionType = 'yes-no' | 'multiple-choice' | 'slider';

// Define simplified attribute categories for better matching
type AttributeCategory = 
  | 'Creative'         // Art, music, writing, visual arts
  | 'Analytical'       // Math, logic, critical thinking
  | 'Technical'        // Coding, engineering, machines, technology
  | 'Scientific'       // Science, biology, chemistry, research
  | 'Social'           // Community, helping others, teamwork
  | 'Leadership'       // Organization, management, planning
  | 'Performance'      // Acting, singing, dancing, public speaking
  | 'Athletic'         // Sports, physical activity, competition
  | 'Outdoor'          // Nature, environment, adventure
  | 'Cultural'         // Languages, international, cultural awareness
  | 'Service'          // Volunteering, community service, helping
  | 'Communication'    // Writing, debate, journalism, public speaking
  | 'Mindfulness'      // Mental health, wellness, balance
  | 'Hands-On'         // Building, crafting, making things
  | 'Digital'          // Online content, media, gaming, digital arts
  | 'Strategic'        // Games, planning, analytics
  | 'Entrepreneurial'  // Business, economics, finance
  | 'Environmental'    // Sustainability, conservation, nature
  | 'Health'           // Healthcare, medicine, wellness
  | 'Global';          // International issues, world affairs

// Define option type
type Option = {
  label: string;
  value: string;
  attributes: AttributeCategory[];
  weight?: number; // Add weight to make some options stronger indicators
};

// Define question type
type Question = {
  id: number;
  text: string;
  type: QuestionType;
  options?: Option[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  attributes?: Record<number, AttributeCategory[]>; // For slider questions, map slider values to attributes
  weight?: number; // Question importance weight
  category?: string; // Optional categorization of questions
};

// Define answer type
type Answer = {
  questionId: number;
  selectedOptions?: string[];
  sliderValue?: number;
};

// Define club match type
type ClubMatch = {
  club: Club;
  score: number;
  matchedAttributes: string[];
  matchPercentage: number;
  confidenceScore: number;
  categoryMatch: string | null;
  negativeAttributes: string[];
};

// Define clubs with detailed attributes
const clubs: Club[] = [
  {
    name: "Art Club",
    attributes: [
      "Creative", "Hands-On", "Visual", "Artistic", "Self-Expression", "Design",
      "Exhibitions", "Collaborative", "Inclusive", "Artistic-Thinking", "Color-Theory", 
      "Composition", "Art-History", "Mixed-Media"
    ],
    description: "Art Club provides a creative space for students to explore various artistic mediums, develop their skills, and express themselves through visual arts."
  },
  {
    name: "ASL (American Sign Language) Club",
    attributes: [
      "Cultural", "Communication", "Language-Learning", "Inclusive", "Accessibility",
      "Global", "Visual-Learning", "Expressive", "Service", "Diversity", "Social-Awareness"
    ],
    description: "ASL Club offers students the opportunity to learn and practice American Sign Language, understand Deaf culture, and promote accessibility and inclusion."
  },
  {
    name: "Astronomy Club",
    attributes: [
      "Scientific", "Analytical", "Space", "Observation", "Research", 
      "Exploration", "Physics", "Technical", "Curiosity", "Discovery"
    ],
    description: "Astronomy Club explores the wonders of the universe through stargazing sessions, telescope observations, and discussions about cosmic phenomena."
  },
  {
    name: "Auto Club",
    attributes: [
      "Technical", "Hands-On", "Mechanical", "Engineering", "Problem-Solving", 
      "Practical-Skills", "Tools", "Diagnostics", "Teamwork", "Design"
    ],
    description: "Auto Club brings together students interested in automotive technology, mechanics, and car culture through hands-on projects and learning experiences."
  },
  {
    name: "Aviation Club",
    attributes: [
      "Technical", "Scientific", "Engineering", "Physics", "Simulation",
      "Historical", "Professional", "Navigation", "Aerodynamics", "Career-Focused"
    ],
    description: "Aviation Club introduces students to the principles of flight, aircraft systems, and careers in aviation through interactive activities and learning experiences."
  },
  {
    name: "Bass Fishing Team",
    attributes: [
      "Outdoor", "Athletic", "Environmental", "Strategic", "Patience",
      "Nature", "Conservation", "Wildlife", "Technical-Skills", "Seasonal"
    ],
    description: "Bass Fishing Team combines outdoor recreation with competitive fishing, developing skills while learning about aquatic ecosystems and conservation."
  },
  {
    name: "Bella Corda",
    attributes: [
      "Performance", "Creative", "Musical", "Artistic", "Classical",
      "Practice", "Dedication", "Harmony", "Theory", "Interpretation"
    ],
    description: "Bella Corda is a select string ensemble that performs classical and contemporary music, refining instrumental skills through collaborative performances."
  },
  {
    name: "Best Buddies",
    attributes: [
      "Service", "Social", "Inclusive", "Compassion", "Empathy",
      "Volunteering", "Leadership", "Mentoring", "Diversity", "Relationship-Building"
    ],
    description: "Best Buddies creates opportunities for one-to-one friendships between students with and without intellectual and developmental disabilities."
  },
  {
    name: "Biochemistry Club",
    attributes: [
      "Scientific", "Analytical", "Health", "Research", "Laboratory",
      "Experiments", "Problem-Solving", "Data-Analysis", "Healthcare", "Technical"
    ],
    description: "Biochemistry Club explores the intersection of biology and chemistry through laboratory experiments, research discussions, and scientific investigations."
  },
  {
    name: "BPA (Business Professionals of America)",
    attributes: [
      "Entrepreneurial", "Leadership", "Strategic", "Professional", "Networking",
      "Career-Preparation", "Communication", "Finance", "Marketing", "Management"
    ],
    description: "BPA prepares students for careers in business and information technology through competitive events, leadership development, and professional growth programs."
  },
  {
    name: "BSLA (Black Student Leadership Assoc.)",
    attributes: [
      "Leadership", "Cultural", "Social", "Advocacy", "Global", 
      "Service", "Mentoring", "Communication", "Community-Building", "Cultural-Awareness"
    ],
    description: "BSLA empowers Black students through leadership development, cultural celebration, community service, and creating a supportive network for academic and personal success."
  },
  {
    name: "Caregiver Club",
    attributes: [
      "Service", "Health", "Social", "Mindfulness", "Volunteering",
      "Compassion", "Support", "Mental-Health", "Community-Building", "Wellness"
    ],
    description: "Caregiver Club provides support, resources, and community for student caregivers while raising awareness about caregiving challenges and promoting self-care."
  },
  {
    name: "Ceramics Society",
    attributes: [
      "Creative", "Hands-On", "Artistic", "Design", "Craftsmanship",
      "Technical-Skills", "3D-Art", "Artistic-Expression", "Traditional-Techniques"
    ],
    description: "Ceramics Society offers hands-on experience with clay, teaching pottery techniques, sculpture methods, and the artistic process from concept to finished ceramic pieces."
  },
  {
    name: "Cheerleading, Adaptive",
    attributes: [
      "Athletic", "Performance", "Inclusive", "Service", "Social",
      "School-Spirit", "Teamwork", "Coordination", "Community-Building"
    ],
    description: "Adaptive Cheerleading creates an inclusive environment where students of all abilities can participate in cheerleading activities, building school spirit and community."
  },
  {
    name: "Chemistry Club",
    attributes: [
      "Scientific", "Analytical", "Hands-On", "Technical", "Laboratory",
      "Research", "Problem-Solving", "Data-Analysis", "Experimental"
    ],
    description: "Chemistry Club engages students in hands-on experiments, demonstrations, and discussions about chemical principles and their real-world applications."
  },
  {
    name: "Chess Club & Team",
    attributes: [
      "Strategic", "Analytical", "Competitive", "Logical", "Mental-Challenge",
      "Problem-Solving", "Concentration", "Pattern-Recognition", "Decision-Making"
    ],
    description: "Chess Club & Team develops strategic thinking and analytical skills through chess practice, tournaments, and collaborative problem-solving of complex chess positions."
  },
  {
    name: "Children's Show",
    attributes: [
      "Performance", "Creative", "Service", "Storytelling", "Theater",
      "Production", "Audience-Engagement", "Character-Development", "Family-Friendly"
    ],
    description: "Children's Show produces theatrical performances designed for young audiences, combining creative storytelling, acting, and production to entertain and inspire children."
  },
  {
    name: "Chinese Yo-Yo Club",
    attributes: [
      "Cultural", "Performance", "Hands-On", "Physical-Skills", "Artistic",
      "Traditional-Arts", "Coordination", "Global", "Demonstration"
    ],
    description: "Chinese Yo-Yo Club teaches the traditional art of Chinese yo-yo (diabolo), combining cultural learning with the development of coordination, performance, and artistic skills."
  },
  {
    name: "Civil Leaders of America (formerly JSA)",
    attributes: [
      "Leadership", "Communication", "Strategic", "Global", "Debate",
      "Civic-Engagement", "Policy-Analysis", "Government", "Current-Events", "Political-Awareness"
    ],
    description: "Civil Leaders of America engages students in civil discourse, debate, and democratic processes, developing leadership skills and knowledge of governmental systems."
  },
  {
    name: "Color Guard (Fall Flags)",
    attributes: [
      "Performance", "Athletic", "Creative", "Coordination", "Artistic-Expression",
      "Teamwork", "Choreography", "Precision", "School-Spirit", "Discipline"
    ],
    description: "Color Guard combines dance, flag technique, and visual performance to create artistic interpretations of music alongside the marching band during fall season."
  },
  {
    name: "Computer Science Club",
    attributes: [
      "Technical", "Digital", "Analytical", "Problem-Solving", "Coding",
      "Software-Development", "Logical-Thinking", "Innovative", "Project-Based"
    ],
    description: "Computer Science Club explores programming languages, software development, and computational problem-solving through coding projects, hackathons, and tech discussions."
  },
  {
    name: "Costume Crew",
    attributes: [
      "Creative", "Hands-On", "Performance", "Design", "Technical",
      "Theatrical", "Backstage", "Attention-to-Detail", "Craftsmanship", "Visual-Storytelling"
    ],
    description: "Costume Crew designs and creates costumes for theatrical productions, developing skills in design, sewing, and visual storytelling while supporting performing arts."
  },
  {
    name: "Creative Writing Club",
    attributes: [
      "Creative", "Communication", "Literary", "Self-Expression", "Storytelling",
      "Composition", "Editing", "Peer-Review", "Publishing", "Imagination"
    ],
    description: "Creative Writing Club nurtures literary expression through writing workshops, peer feedback sessions, and opportunities to explore various genres and publishing platforms."
  },
  {
    name: "Dawg Pound",
    attributes: [
      "Athletic", "Social", "School-Spirit", "Community-Building", "Enthusiasm",
      "Teamwork", "School-Pride", "Energy", "School-Unity", "Events"
    ],
    description: "Dawg Pound is the student spirit section that builds school pride and community through organized cheering, themed events, and enthusiastic support at athletic competitions."
  },
  {
    name: "Debate",
    attributes: [
      "Communication", "Strategic", "Analytical", "Research", "Critical-Thinking",
      "Public-Speaking", "Current-Events", "Logic", "Persuasion", "Competition"
    ],
    description: "Debate develops public speaking, critical thinking, and persuasive argumentation through competitive debate tournaments, research, and structured argumentation practice."
  },
  {
    name: "DECA",
    attributes: [
      "Entrepreneurial", "Leadership", "Strategic", "Business", "Professional-Development",
      "Marketing", "Finance", "Presentation-Skills", "Career-Preparation", "Competition"
    ],
    description: "DECA prepares emerging leaders and entrepreneurs in marketing, finance, hospitality, and management through competitive events, conferences, and real-world business experiences."
  },
  {
    name: "Environmental Science Club",
    attributes: [
      "Environmental", "Scientific", "Outdoor", "Sustainability", "Conservation",
      "Research", "Community-Projects", "Field-Studies", "Green-Initiatives", "Ecological-Awareness"
    ],
    description: "Environmental Science Club promotes ecological awareness through conservation projects, sustainability initiatives, and scientific exploration of environmental issues and solutions."
  },
  {
    name: "Esports Club",
    attributes: [
      "Digital", "Strategic", "Social", "Teamwork", "Competition",
      "Technical", "Communication", "Digital-Literacy", "Entertainment", "Community"
    ],
    description: "Esports Club brings together gaming enthusiasts to develop teamwork, strategy, and technical skills through organized video game competitions and collaborative play."
  },
  {
    name: "Esports Competitive Teams",
    attributes: [
      "Digital", "Strategic", "Athletic", "Competitive", "Technical",
      "Teamwork", "Communication", "High-Level-Play", "Team-Based", "Coordination"
    ],
    description: "Esports Competitive Teams represent the school in organized video game competitions, developing high-level gaming skills, strategic teamwork, and competitive excellence."
  },
  {
    name: "Fall Play",
    attributes: [
      "Performance", "Creative", "Theatrical", "Character-Development", "Production",
      "Teamwork", "Storytelling", "Stage-Presence", "Public-Speaking", "Drama"
    ],
    description: "Fall Play produces a theatrical production during the fall semester, offering opportunities in acting, stage management, and technical theater while developing performance skills."
  },
  {
    name: "FFA (Future Farmers of America)",
    attributes: [
      "Leadership", "Environmental", "Hands-On", "Agricultural", "Scientific",
      "Technical-Skills", "Career-Development", "Community", "Sustainability", "Practical-Skills"
    ],
    description: "FFA develops leadership, personal growth, and career success through agricultural education, hands-on projects, competitions, and community involvement in agricultural sciences."
  },
  {
    name: "Field Hockey",
    attributes: [
      "Athletic", "Teamwork", "Outdoor", "Competition", "Strategy",
      "Physical-Activity", "Coordination", "Endurance", "Team-Strategy", "Sportsmanship"
    ],
    description: "Field Hockey develops athletic skills, teamwork, and strategic thinking through competitive play, training, and tournaments in this fast-paced field sport."
  },
  {
    name: "Filipino Culture Club",
    attributes: [
      "Cultural", "Global", "Community-Building", "Diversity", "Heritage",
      "Language", "Traditions", "Celebrations", "Cultural-Exchange", "Identity"
    ],
    description: "Filipino Culture Club celebrates Filipino heritage through cultural events, traditional celebrations, language learning, and community building activities that share Filipino culture."
  },
  {
    name: "French Club",
    attributes: [
      "Cultural", "Global", "Language-Learning", "Communication", "International",
      "Traditions", "Cultural-Awareness", "Travel", "European-Culture", "Global-Perspective"
    ],
    description: "French Club explores French language and francophone cultures through conversation practice, cultural celebrations, film screenings, and activities that develop language skills and cultural understanding."
  },
  {
    name: "Fresh/Soph Wheel Dawgs",
    attributes: [
      "Athletic", "Inclusive", "Teamwork", "Physical-Activity", "Sports",
      "Sportsmanship", "Coordination", "Adaptive-Athletics", "Accessible", "Community"
    ],
    description: "Fresh/Soph Wheel Dawgs introduces freshmen and sophomores to wheelchair sports, promoting inclusive athletics, skill development, and teamwork through adaptive sports activities."
  },
  {
    name: "Frosh/Soph Play",
    attributes: [
      "Performance", "Creative", "Theatrical", "Drama", "Entry-Level",
      "Stage-Experience", "Character-Development", "Storytelling", "Public-Speaking", "Beginner-Friendly"
    ],
    description: "Frosh/Soph Play provides freshmen and sophomores with theatrical opportunities through a dedicated production that develops acting skills, stage presence, and theatrical knowledge."
  },
  {
    name: "GEMS (Girls in Engineering, Math & Science)",
    attributes: [
      "Scientific", "Technical", "Leadership", "Educational", "Engineering",
      "Mathematical", "Gender-Equity", "Mentorship", "Hands-On", "Career-Exploration"
    ],
    description: "GEMS encourages and supports female students in STEM fields through mentorship, hands-on projects, guest speakers, and exploration of career opportunities in engineering, math, and science."
  },
  {
    name: "German Club",
    attributes: [
      "Cultural", "Global", "Language-Learning", "International", "European-Culture",
      "Traditions", "Cultural-Awareness", "Travel", "History", "Global-Perspective"
    ],
    description: "German Club explores German language and culture through conversation practice, cultural celebrations, film screenings, and activities that develop language skills and cultural understanding."
  },
  {
    name: "Girl Up",
    attributes: [
      "Service", "Leadership", "Global", "Advocacy", "Social-Justice",
      "Gender-Equality", "Empowerment", "Activism", "Awareness", "Global-Issues"
    ],
    description: "Girl Up, an initiative of the United Nations Foundation, develops leadership skills while advocating for gender equality through awareness campaigns, fundraising, and community action projects."
  },
  {
    name: "Gourmet and Good Living Club",
    attributes: [
      "Hands-On", "Cultural", "Health", "Mindfulness", "Creative",
      "Culinary-Arts", "Nutrition", "Wellness", "Life-Skills", "Social"
    ],
    description: "Gourmet and Good Living Club explores culinary arts, nutrition, and wellness through cooking demonstrations, recipe sharing, cultural food exploration, and discussions about healthy lifestyle choices."
  },
  {
    name: "GSA (Gender-Sexuality Alliance)",
    attributes: [
      "Social", "Service", "Advocacy", "Inclusive", "Support",
      "Community-Building", "Awareness", "Education", "Diversity", "Acceptance"
    ],
    description: "GSA provides a safe, supportive environment for LGBTQ+ students and allies, promoting inclusion through education, advocacy, community building, and social events that celebrate diversity."
  },
  {
    name: "Health Occupations Students of America (HOSA)",
    attributes: [
      "Health", "Scientific", "Leadership", "Professional-Development", "Medical",
      "Career-Preparation", "Clinical-Skills", "Biology", "Patient-Care", "Healthcare-Industry"
    ],
    description: "HOSA prepares students for careers in healthcare through skill development, competitive events, leadership opportunities, and connections with health professionals and medical institutions."
  },
  {
    name: "Helping Hands Club",
    attributes: [
      "Service", "Social", "Volunteering", "Community-Building", "Outreach",
      "Humanitarian", "Compassion", "Local-Community", "Philanthropy", "Social-Impact"
    ],
    description: "Helping Hands Club coordinates volunteer opportunities and service projects that address community needs, developing leadership, empathy, and social responsibility through hands-on community service."
  },
  {
    name: "Henna Club",
    attributes: [
      "Creative", "Cultural", "Hands-On", "Artistic", "Traditional",
      "Artistic-Expression", "Cultural-Appreciation", "Design", "Cultural-Heritage", "Decorative-Arts"
    ],
    description: "Henna Club explores the traditional art of henna design, teaching techniques, patterns, and cultural significance while creating beautiful temporary body art and celebrating cultural diversity."
  },
  {
    name: "Hockey",
    attributes: [
      "Athletic", "Social", "Teamwork", "Competition", "Strategic",
      "Physical-Activity", "Coordination", "Winter-Sports", "Team-Strategy", "Speed"
    ],
    description: "Hockey develops athletic skills, teamwork, and strategic thinking through competitive play, training, and tournaments in this fast-paced ice sport requiring coordination and endurance."
  },
  {
    name: "Humane Huskies",
    attributes: [
      "Environmental", "Service", "Advocacy", "Volunteering", "Educational",
      "Animal-Welfare", "Awareness-Campaigns", "Compassion", "Activism", "Conservation"
    ],
    description: "Humane Huskies advocates for animal welfare through volunteer work with local shelters, educational campaigns about responsible pet ownership, and fundraising for animal protection organizations."
  },
  {
    name: "Huskie Book Club",
    attributes: [
      "Creative", "Communication", "Social", "Analytical", "Literary",
      "Discussion", "Critical-Thinking", "Diverse-Perspectives", "Reading", "Intellectual"
    ],
    description: "Huskie Book Club brings together students who enjoy reading to discuss diverse literature, share perspectives, develop critical thinking skills, and foster a love of reading through regular book discussions."
  },
  {
    name: "Huskie Crew",
    attributes: [
      "Leadership", "Social", "Event-Planning", "Community-Building", "Organization",
      "School-Spirit", "Event-Coordination", "Communication", "Teamwork", "Promotion"
    ],
    description: "Huskie Crew organizes and promotes school events, builds school spirit, and creates a positive school culture through student-led initiatives, event planning, and community building activities."
  },
  {
    name: "Improv Club",
    attributes: [
      "Performance", "Creative", "Communication", "Teamwork", "Spontaneity",
      "Comedy", "Theater", "Thinking-on-your-feet", "Confidence-Building", "Stage-Presence"
    ],
    description: "Improv Club develops performance skills, creativity, and quick thinking through improvisational theater games, comedy exercises, and performances that build confidence and stage presence."
  },
  {
    name: "Interact Club",
    attributes: [
      "Service", "Leadership", "Global", "Community-Building", "Volunteering",
      "Social-Impact", "Global-Citizenship", "Service-Projects", "Humanitarian", "Project-Management"
    ],
    description: "Interact Club, affiliated with Rotary International, develops leadership through community service, international awareness projects, and initiatives that address local and global challenges."
  },
  {
    name: "International Thespian Society",
    attributes: [
      "Performance", "Creative", "Theatrical", "Recognition", "Dramatic-Arts",
      "Stage-Production", "Theatrical-Excellence", "Honor-Society", "Dedication", "Achievement"
    ],
    description: "International Thespian Society recognizes student achievement in theater arts, providing opportunities for theatrical growth, performance excellence, and connection to the broader theatrical community."
  },
  {
    name: "Investment Club",
    attributes: [
      "Entrepreneurial", "Strategic", "Analytical", "Financial-Literacy", "Business",
      "Economics", "Research", "Risk-Assessment", "Market-Analysis", "Financial-Planning",
      "Finance", "Economics", "Business", "Stock-Market", "Investing", "Financial-Literacy", 
      "Portfolio-Management", "Market-Analysis", "Wealth-Building", "Entrepreneurship", "Research",
      "Risk-Assessment", "Economic-Trends", "Financial-Planning", "Business-Strategy", "Analytical-Thinking"
    ],
    description: "Investment Club teaches financial literacy and investment strategies through stock market simulations, portfolio management practice, market analysis, and discussions with finance professionals."
  },
  {
    name: "ISA (Indian Students Association)",
    attributes: [
      "Cultural", "Heritage", "Diversity", "Community", "Indian-Culture", "Traditions", 
      "Celebrations", "Language", "Food", "Arts", "Music",
      "Dance", "Festivals", "Cultural-Awareness", "Identity", "Cultural-Exchange"
    ],
    description: "ISA celebrates Indian culture and heritage through traditional celebrations, cultural performances, language sharing, cuisine exploration, and community-building activities that promote cultural understanding."
  },
  {
    name: "Jazz Band",
    attributes: [
      "Music", "Performance", "Jazz", "Instrumental", "Ensemble", "Improvisation", 
      "Musical-Technique", "Rhythm", "Harmony", "Creativity", "Collaboration",
      "Musical-Theory", "Performance-Skills", "Musical-Expression", "Concerts", "Swing"
    ],
    description: "Jazz Band develops musical skills through the study and performance of jazz music, focusing on improvisation, ensemble playing, and the rich traditions of jazz across various styles and eras."
  },
  {
    name: "Junior Board",
    attributes: [
      "Leadership", "Class-Representation", "Event-Planning", "Student-Government", "Organization", "Teamwork", 
      "School-Spirit", "Fundraising", "Communication", "Project-Management", "Class-Unity",
      "Student-Voice", "Advocacy", "Decision-Making", "Community-Building", "Junior-Class"
    ],
    description: "Junior Board represents the junior class in student government, organizing class events, fundraising for prom and senior year activities, and advocating for junior class interests in school decisions."
  },
  {
    name: "Korean Club",
    attributes: [
      "Language-Learning", "Cultural", "International", "Korean", "Global", "Communication", 
      "Asian-Culture", "K-pop", "Korean-Cuisine", "Language-Skills", "Cultural-Awareness",
      "Traditions", "Media", "History", "Arts", "Global-Perspective"
    ],
    description: "Korean Club explores Korean language and culture through conversation practice, K-pop and media discussions, traditional celebrations, cuisine exploration, and activities that develop cultural understanding."
  },
  {
    name: "LASA (Latin American Student Assn)",
    attributes: [
      "Cultural", "Heritage", "Diversity", "Community", "Latin-American-Culture", "Spanish", 
      "Traditions", "Celebrations", "Food", "Music", "Dance",
      "Cultural-Awareness", "Identity", "Inclusion", "Global-Perspective", "Cultural-Exchange"
    ],
    description: "LASA celebrates Latin American cultures through traditional celebrations, language sharing, cuisine exploration, music and dance events, and community-building activities that promote cultural understanding."
  },
  {
    name: "Mandarin Club",
    attributes: [
      "Language-Learning", "Cultural", "International", "Chinese", "Global", "Communication", 
      "Asian-Culture", "Mandarin-Language", "Chinese-Traditions", "Language-Skills", "Cultural-Awareness",
      "Calligraphy", "Cuisine", "History", "Arts", "Global-Perspective"
    ],
    description: "Mandarin Club explores Chinese language and culture through conversation practice, calligraphy, traditional celebrations, cuisine exploration, and activities that develop language skills and cultural understanding."
  },
  {
    name: "Marching Band",
    attributes: [
      "Music", "Performance", "Marching", "Instrumental", "Teamwork", "Discipline", 
      "Coordination", "Rhythm", "Outdoor-Performance", "Musical-Technique", "Precision",
      "School-Spirit", "Competitions", "Choreography", "Dedication", "Ensemble-Playing"
    ],
    description: "Marching Band combines musical performance with choreographed movement, performing at football games, parades, and competitions while developing musicianship, coordination, and teamwork."
  },
  {
    name: "Math Team",
    attributes: [
      "Mathematics", "Problem-Solving", "Competition", "Analytical-Thinking", "Logic", "Academic", 
      "Numerical-Reasoning", "Mathematical-Theory", "Critical-Thinking", "Patterns", "Equations",
      "Mathematical-Contests", "Collaborative-Problem-Solving", "Mental-Math", "Mathematical-Concepts", "Academic-Excellence"
    ],
    description: "Math Team challenges students with advanced mathematical problems, preparing for competitions through collaborative problem-solving, mathematical theory exploration, and development of analytical skills."
  },
  {
    name: "MENA Club",
    attributes: [
      "Cultural", "Middle-Eastern", "North-African", "Heritage", "Diversity", "International", 
      "Traditions", "Language", "Food", "History", "Arts",
      "Cultural-Awareness", "Identity", "Global-Perspective", "Cultural-Exchange", "Community-Building"
    ],
    description: "MENA Club celebrates Middle Eastern and North African cultures through traditional celebrations, language sharing, cuisine exploration, and community-building activities that promote cultural understanding."
  },
  {
    name: "Model UN",
    attributes: [
      "International-Relations", "Diplomacy", "Debate", "Public-Speaking", "Research", "Global-Issues", 
      "Negotiation", "Policy-Analysis", "Current-Events", "Leadership", "Critical-Thinking",
      "United-Nations", "Global-Citizenship", "Political-Awareness", "Conflict-Resolution", "International-Organizations"
    ],
    description: "Model UN simulates United Nations committees, developing research, public speaking, and diplomatic skills as students represent countries in debates on global issues and international relations."
  },
  {
    name: "MSA (Muslim Student Association)",
    attributes: [
      "Cultural", "Global", "Service", "Community-Building", "Diversity",
      "Support", "Cultural-Awareness", "Identity", "Celebrations", "Interfaith-Dialogue"
    ],
    description: "MSA provides a supportive community for Muslim students and those interested in Islamic culture, offering religious and cultural activities, educational events, and interfaith dialogue opportunities."
  },
  {
    name: "Musical Director",
    attributes: [
      "Performance", "Leadership", "Creative", "Musical-Theater", "Artistic-Vision",
      "Collaboration", "Musical-Arrangement", "Rehearsal-Management", "Creative-Direction", "Production-Planning"
    ],
    description: "Musical Director leads the musical aspects of theatrical productions, conducting the orchestra, coaching vocalists, arranging music, and collaborating with the director to create cohesive musical performances."
  },
  {
    name: "Musical Pit Director",
    attributes: [
      "Performance", "Leadership", "Musical", "Orchestra", "Conducting",
      "Musical-Theater", "Collaboration", "Performance-Coordination", "Musical-Interpretation", "Timing"
    ],
    description: "Musical Pit Director conducts and coordinates the orchestra for musical theater productions, ensuring musical accompaniment aligns with stage performances through rehearsals and performance coordination."
  },
  {
    name: "New Generation Club",
    attributes: [
      "Leadership", "Service", "Social", "Community-Impact", "Innovation",
      "Project-Development", "Social-Change", "Social-Entrepreneurship", "Mentorship", "Civic-Engagement"
    ],
    description: "New Generation Club empowers students to create positive social change through leadership development, community service projects, social entrepreneurship, and initiatives addressing contemporary issues."
  },
  {
    name: "NFHS (National French Honor Society)",
    attributes: [
      "Cultural", "Global", "Academic-Excellence", "Language-Learning", "French-Culture",
      "Recognition", "Achievement", "Global-Perspective", "Cultural-Awareness", "Service"
    ],
    description: "NFHS recognizes academic achievement in French language studies, promoting French culture, language excellence, and cultural understanding through service projects and cultural activities."
  },
  {
    name: "NHS (National Honor Society)",
    attributes: [
      "Leadership", "Service", "Academic-Excellence", "Character", "Achievement",
      "Recognition", "Community-Service", "Ethics", "Volunteer-Work", "Personal-Development"
    ],
    description: "NHS recognizes outstanding high school students who demonstrate excellence in scholarship, leadership, service, and character, providing opportunities for continued growth and community service."
  },
  {
    name: "NNHS Ambassadors",
    attributes: [
      "Leadership", "Social", "Communication", "Public-Speaking", "School-Representation",
      "Hospitality", "Community-Building", "School-Pride", "Interpersonal-Skills", "Mentoring"
    ],
    description: "NNHS Ambassadors represent the school to visitors, new students, and the community, providing tours, hosting events, and serving as the welcoming face of the school at various functions."
  },
  {
    name: "NNHS Medical Club (NNMC)",
    attributes: [
      "Scientific", "Health", "Career-Exploration", "Biology", "Medical-Knowledge",
      "Healthcare", "Professional-Development", "Research", "Clinical-Exposure", "Educational"
    ],
    description: "NNHS Medical Club explores healthcare careers through guest speakers, medical facility tours, health education projects, and discussions about current medical issues and advancements."
  },
  {
    name: "North Star (Newspaper)",
    attributes: [
      "Communication", "Creative", "Journalism", "Writing", "Current-Events",
      "Editing", "Publishing", "Interviewing", "Investigative-Skills", "Storytelling"
    ],
    description: "North Star produces the school newspaper, developing journalistic skills through reporting, writing, editing, and publishing stories about school events, student achievements, and relevant issues."
  },
  {
    name: "Northern Lights (Winter Flags)",
    attributes: [
      "Performance", "Athletic", "Creative", "Choreography", "Teamwork",
      "Precision", "Artistic-Interpretation", "Flag-Technique", "Synchronization", "Indoor-Performance"
    ],
    description: "Northern Lights performs indoor color guard routines during winter season, combining dance, flag technique, and visual performance to create artistic interpretations of music in competitive events."
  },
  {
    name: "NSHS (National Spanish Honor Society)",
    attributes: [
      "Cultural", "Global", "Academic-Excellence", "Language-Learning", "Hispanic-Culture",
      "Recognition", "Achievement", "Global-Perspective", "Cultural-Awareness", "Service"
    ],
    description: "NSHS recognizes academic achievement in Spanish language studies, promoting Hispanic culture, language excellence, and cultural understanding through service projects and cultural activities."
  },
  {
    name: "OASIS",
    attributes: [
      "Mindfulness", "Health", "Social", "Support", "Mental-Health",
      "Wellness", "Self-Care", "Peer-Support", "Stress-Management", "Emotional-Well-Being"
    ],
    description: "OASIS provides a supportive environment focused on mental health and wellness, offering resources, peer support, stress management techniques, and activities promoting emotional well-being."
  },
  {
    name: "Orchesis",
    attributes: [
      "Performance", "Athletic", "Creative", "Dance", "Choreography",
      "Artistic-Expression", "Movement", "Technique", "Stage-Presence", "Rhythm"
    ],
    description: "Orchesis is a dance company that develops technical and creative dance skills through choreography, rehearsals, and performances in various styles including modern, jazz, and contemporary dance."
  },
  {
    name: "Orchestra Council",
    attributes: [
      "Performance", "Leadership", "Musical", "Event-Planning", "Organization",
      "Advocacy", "Fundraising", "Musical-Community", "Program-Development", "Representation"
    ],
    description: "Orchestra Council provides leadership for the orchestra program, organizing events, advocating for orchestral music, planning performances, and representing orchestra students in school decisions."
  },
  {
    name: "Pep Band",
    attributes: [
      "Performance", "Social", "Musical", "School-Spirit", "Energy",
      "Entertainment", "Sports-Events", "School-Pride", "Live-Performance", "Crowd-Engagement"
    ],
    description: "Pep Band performs energetic music at sporting events and pep rallies, building school spirit through lively instrumental performances that enhance the game day atmosphere."
  },
  {
    name: "Photography Club",
    attributes: [
      "Creative", "Digital", "Artistic", "Visual-Arts", "Technical-Skills",
      "Composition", "Visual-Storytelling", "Editing", "Portfolio-Development", "Artistic-Vision"
    ],
    description: "Photography Club develops camera skills, composition techniques, and artistic vision through photo shoots, editing workshops, portfolio development, and photography exhibitions."
  },
  {
    name: "Pickleball Club",
    attributes: [
      "Athletic", "Social", "Physical-Activity", "Recreation", "Strategy",
      "Hand-Eye-Coordination", "Competitive", "Fitness", "Agility", "Sportsmanship"
    ],
    description: "Pickleball Club introduces students to this popular paddle sport, developing coordination, strategy, and fitness through regular play, friendly competitions, and skill development."
  },
  {
    name: "Project Positivity NNHS",
    attributes: [
      "Mindfulness", "Social", "Mental-Health", "Wellness", "Community-Building",
      "Kindness-Initiatives", "Stress-Reduction", "Emotional-Well-Being", "Self-Care", "Inclusion"
    ],
    description: "Project Positivity promotes mental wellness and positive school culture through kindness initiatives, stress reduction activities, and awareness campaigns that foster a supportive community."
  },
  {
    name: "Red Cross Club",
    attributes: [
      "Service", "Health", "Humanitarian", "Volunteering", "Community-Outreach",
      "First-Aid", "Emergency-Response", "Global-Issues", "Safety-Education", "Social-Impact"
    ],
    description: "Red Cross Club supports humanitarian efforts through blood drives, disaster preparedness education, first aid training, and fundraising for local and international Red Cross initiatives."
  },
  {
    name: "Red Ribbon Club",
    attributes: [
      "Health", "Service", "Awareness", "Peer-Education", "Community-Service",
      "Health-Education", "Leadership", "Awareness-Campaigns", "Health-Promotion", "Social-Responsibility"
    ],
    description: "Red Ribbon Club promotes drug prevention and healthy lifestyle choices through peer education, awareness campaigns, and community outreach focused on substance abuse prevention."
  },
  {
    name: "Robotics Team (FIRST Robotics)",
    attributes: [
      "Technical", "Hands-On", "Strategic", "Engineering", "Problem-Solving",
      "Programming", "Design", "Competition", "Innovation", "Project-Management"
    ],
    description: "Robotics Team designs, builds, and programs robots for FIRST Robotics competitions, developing engineering skills, teamwork, and problem-solving through hands-on technical challenges."
  },
  {
    name: "Rocketry Club",
    attributes: [
      "Technical", "Scientific", "Hands-On", "Engineering", "Aerospace",
      "Design", "Physics", "Data-Analysis", "Technical-Skills", "Project-Based"
    ],
    description: "Rocketry Club designs, builds, and launches model rockets, exploring principles of physics, engineering, and aerodynamics through hands-on projects and competitive launches."
  },
  {
    name: "Scholastic Bowl",
    attributes: [
      "Analytical", "Strategic", "Academic-Competition", "Knowledge", "Quick-Recall",
      "Critical-Thinking", "General-Knowledge", "Interdisciplinary", "Mental-Agility", "Intellectual"
    ],
    description: "Scholastic Bowl competes in academic quiz competitions covering a wide range of subjects, developing quick recall, broad knowledge base, and teamwork through practice and tournaments."
  },
  {
    name: "Science Bowl",
    attributes: [
      "Scientific", "Analytical", "Strategic", "Academic-Competition", "Knowledge",
      "Scientific-Concepts", "Physics", "Chemistry", "Biology", "Mathematics"
    ],
    description: "Science Bowl competes in fast-paced science and math competitions, developing in-depth knowledge of scientific concepts, quick thinking, and teamwork through practice and tournaments."
  },
  {
    name: "Science Olympiad",
    attributes: [
      "Scientific", "Analytical", "Strategic", "Hands-On", "Competition",
      "Laboratory-Skills", "Engineering", "Problem-Solving", "Technical-Design", "Interdisciplinary"
    ],
    description: "Science Olympiad prepares for competitions in various scientific disciplines, developing laboratory skills, research abilities, and collaborative problem-solving through hands-on science and engineering challenges."
  },
  {
    name: "Senior Board - Class of 2025",
    attributes: [
      "Leadership", "Social", "Event-Planning", "Organization", "Class-Representation",
      "School-Spirit", "Fundraising", "Graduation-Planning", "Class-Unity", "Student-Voice"
    ],
    description: "Senior Board represents the senior class, organizing graduation activities, senior traditions, fundraising events, and creating memorable experiences for the Class of 2025."
  },
  {
    name: "Seva Circle",
    attributes: [
      "Service", "Cultural", "Volunteering", "Social-Impact", "Leadership",
      "Humanitarian", "Cultural-Awareness", "Service-Projects", "Outreach", "Compassion"
    ],
    description: "Seva Circle organizes service projects based on the South Asian concept of selfless service, combining cultural awareness with community outreach, volunteering, and humanitarian initiatives."
  },
  {
    name: "Show Choir",
    attributes: [
      "Performance", "Creative", "Musical", "Dance", "Vocal-Performance",
      "Choreography", "Stage-Presence", "Harmony", "Musical-Expression", "Showmanship"
    ],
    description: "Show Choir combines vocal music with choreographed movement, performing popular and show tunes in competitive and showcase events while developing vocal technique and performance skills."
  },
  {
    name: "Ski & Snowboard Club",
    attributes: [
      "Athletic", "Outdoor", "Winter-Sports", "Physical-Activity", "Social",
      "Recreation", "Adventure", "Seasonal", "Active-Lifestyle", "Nature-Appreciation"
    ],
    description: "Ski & Snowboard Club organizes trips to ski resorts, developing winter sports skills, outdoor appreciation, and social connections through recreational skiing and snowboarding activities."
  },
  {
    name: "Spanish Club",
    attributes: [
      "Cultural", "Global", "Language-Learning", "International", "Hispanic-Culture",
      "Cultural-Awareness", "Traditions", "Travel", "Global-Perspective", "Language-Skills"
    ],
    description: "Spanish Club explores Spanish language and Hispanic cultures through conversation practice, cultural celebrations, film screenings, and activities that develop language skills and cultural understanding."
  },
  {
    name: "Spectrum",
    attributes: [
      "Cultural", "Social", "Diversity", "Inclusion", "Global-Perspective",
      "Cross-Cultural", "Heritage-Celebration", "Equity", "Cultural-Exchange", "Multicultural"
    ],
    description: "Spectrum promotes cultural diversity and inclusion through multicultural events, educational workshops, dialogue sessions, and celebrations that foster understanding and appreciation of different identities."
  },
  {
    name: "Speech Team (Forensics)",
    attributes: [
      "Communication", "Performance", "Strategic", "Public-Speaking", "Competition",
      "Persuasion", "Critical-Thinking", "Presentation", "Confidence-Building", "Research"
    ],
    description: "Speech Team competes in various public speaking and performance events, developing communication skills, confidence, and critical thinking through competitive forensics tournaments."
  },
  {
    name: "Spring Play",
    attributes: [
      "Performance", "Creative", "Theatrical", "Drama", "Character-Development",
      "Stage-Presence", "Storytelling", "Public-Speaking", "Teamwork", "Production"
    ],
    description: "Spring Play produces a theatrical production during the spring semester, offering opportunities in acting, stage management, and technical theater while developing performance skills."
  },
  {
    name: "Statistics & Card Game Club",
    attributes: [
      "Analytical", "Strategic", "Social", "Mathematical", "Games",
      "Probability", "Data-Analysis", "Logical-Reasoning", "Pattern-Recognition", "Decision-Making"
    ],
    description: "Statistics & Card Game Club explores mathematical concepts through card games, developing statistical thinking, probability understanding, and strategic skills in a social, game-based environment."
  },
  {
    name: "Student Government, Head",
    attributes: [
      "Leadership", "Social", "Communication", "Organization", "Student-Representation",
      "School-Policy", "Event-Planning", "Advocacy", "Decision-Making", "School-Improvement"
    ],
    description: "Student Government represents the student body in school decisions, organizes school-wide events, advocates for student interests, and develops leadership through democratic processes and community building."
  },
  {
    name: "Table Tennis Team & Club",
    attributes: [
      "Athletic", "Strategic", "Hand-Eye-Coordination", "Reflexes", "Precision",
      "Focus", "Individual-Sport", "Teamwork", "Technique", "Mental-Sharpness"
    ],
    description: "Table Tennis Team & Club develops skills in this fast-paced sport through regular practice, technique development, competitive play, and tournaments that build coordination and strategic thinking."
  },
  {
    name: "Table Top Game Club",
    attributes: [
      "Strategic", "Social", "Creative", "Critical-Thinking", "Games",
      "Problem-Solving", "Collaboration", "Logical-Reasoning", "Storytelling", "Community-Building"
    ],
    description: "Table Top Game Club brings together students interested in board games, card games, and role-playing games, developing strategic thinking, social skills, and creativity through regular gaming sessions."
  },
  {
    name: "Tech Crew",
    attributes: [
      "Theater", "Technical-Production", "Lighting", "Sound", "Backstage", "Production", 
      "Stage-Management", "Technical-Skills", "Design", "Teamwork", "Problem-Solving",
      "Equipment-Operation", "Theatrical-Technology", "Production-Support", "Hands-On", "Technical-Theater"
    ],
    description: "Tech Crew manages the technical aspects of theatrical productions, developing skills in lighting, sound, stage management, and production design while supporting performances behind the scenes."
  },
  {
    name: "Theatre Club",
    attributes: [
      "Theater", "Acting", "Performance", "Drama", "Creative-Expression", "Stage", 
      "Character-Development", "Public-Speaking", "Theatrical-Arts", "Production", "Collaboration",
      "Improvisation", "Script-Analysis", "Stage-Presence", "Performance-Skills", "Storytelling"
    ],
    description: "Theatre Club explores various aspects of theatrical arts through workshops, performances, theater games, and production involvement, developing acting skills and theatrical knowledge."
  },
  {
    name: "Top Dawgs",
    attributes: [
      "Leadership", "Mentoring", "Peer-Support", "School-Culture", "Role-Models", "Community-Building", 
      "Student-Leadership", "Guidance", "New-Student-Support", "School-Pride", "Positive-Influence",
      "Orientation", "School-Transition", "Interpersonal-Skills", "Communication", "Responsibility"
    ],
    description: "Top Dawgs provides peer mentoring and leadership for new and underclassmen students, creating a positive school culture through orientation activities, ongoing support, and community building."
  },
  {
    name: "Tutors for the Future",
    attributes: [
      "Tutoring", "Academic-Support", "Teaching", "Mentoring", "Community-Service", "Education", 
      "Subject-Expertise", "Helping-Others", "Leadership", "Communication-Skills", "Patience",
      "Educational-Outreach", "Knowledge-Sharing", "Academic-Excellence", "Service-Learning", "Peer-Education"
    ],
    description: "Tutors for the Future provides academic support to fellow students and community members, developing teaching skills, subject mastery, and leadership through peer tutoring and educational outreach."
  },
  {
    name: "Ultimate Frisbee Club",
    attributes: [
      "Sports", "Teamwork", "Physical-Activity", "Outdoor-Recreation", "Strategy", "Competition", 
      "Disc-Sports", "Athleticism", "Coordination", "Sportsmanship", "Endurance",
      "Field-Sports", "Active-Lifestyle", "Game-Skills", "Recreational", "Self-Officiated"
    ],
    description: "Ultimate Frisbee Club develops athletic skills, teamwork, and sportsmanship through this self-officiated team sport that combines elements of football, soccer, and basketball with a flying disc."
  },
  {
    name: "UNICEF Club",
    attributes: [
      "Global-Issues", "Humanitarian", "Children's-Rights", "Advocacy", "Fundraising", "International", 
      "Social-Impact", "Awareness-Campaigns", "Global-Citizenship", "Service", "Education",
      "United-Nations", "Community-Outreach", "Global-Health", "Human-Rights", "Social-Justice"
    ],
    description: "UNICEF Club raises awareness and funds for children's rights worldwide, developing global citizenship through advocacy campaigns, fundraising events, and educational initiatives about international issues."
  },
  {
    name: "Veterans Club",
    attributes: [
      "Military-Appreciation", "Patriotism", "Community-Service", "History", "Civic-Engagement", "Support", 
      "Veterans-Affairs", "Remembrance", "Service-Projects", "Awareness", "Recognition",
      "Military-History", "National-Service", "Community-Outreach", "Appreciation-Events", "Civic-Duty"
    ],
    description: "Veterans Club honors military service through veteran appreciation events, service projects supporting veterans, and educational initiatives about military history and service."
  },
  {
    name: "Vertigo (Literary Magazine)",
    attributes: [
      "Creative-Writing", "Literature", "Publishing", "Editing", "Artistic-Expression", "Poetry", 
      "Fiction", "Literary-Arts", "Design", "Creative-Collaboration", "Publication",
      "Editorial-Skills", "Literary-Analysis", "Visual-Arts", "Student-Writing", "Creative-Showcase"
    ],
    description: "Vertigo publishes student creative writing and artwork in a literary magazine, developing skills in writing, editing, design, and publication while showcasing student creative expression."
  },
  {
    name: "Yearbook",
    attributes: [
      "Journalism", "Photography", "Design", "Publishing", "Documentation", "Layout", 
      "Writing", "Editing", "Visual-Storytelling", "School-History", "Collaboration",
      "Deadline-Management", "Interviewing", "Graphic-Design", "Memory-Preservation", "Publication"
    ],
    description: "Yearbook documents the school year through photography, writing, and design, creating a permanent record of school events, student life, and achievements in a professionally published book."
  },
  {
    name: "Yoga Club",
    attributes: [
      "Wellness", "Physical-Activity", "Mindfulness", "Flexibility", "Stress-Reduction", "Balance", 
      "Meditation", "Mental-Health", "Fitness", "Self-Care", "Breathing-Techniques",
      "Relaxation", "Mind-Body-Connection", "Strength-Building", "Holistic-Health", "Centering"
    ],
    description: "Yoga Club practices physical postures, breathing techniques, and mindfulness, promoting physical and mental wellness through regular yoga sessions focused on flexibility, strength, and stress reduction."
  },
  {
    name: "Youth and Government",
    attributes: [
      "Government", "Politics", "Civic-Engagement", "Leadership", "Public-Policy", "Debate", 
      "Mock-Government", "Legislation", "Public-Speaking", "Current-Events", "Democracy",
      "Political-Process", "Bill-Writing", "Parliamentary-Procedure", "Advocacy", "Citizenship"
    ],
    description: "Youth and Government simulates state government processes, developing civic knowledge, leadership, and policy skills through mock legislative sessions, court proceedings, and political debate."
  }
];

// New 25 questions with improved attribute mapping and weights
const questions: Question[] = [
  {
    id: 1,
    text: "Which of these academic subjects do you enjoy the most?",
    type: "multiple-choice",
    weight: 2.0, // High importance for academic direction
    category: "Academic Interests",
    options: [
      { label: "Math and Computer Science", value: "math_cs", attributes: ['Analytical', 'Technical', 'Digital'], weight: 1.5 },
      { label: "Science and Engineering", value: "science_eng", attributes: ['Scientific', 'Technical', 'Analytical'], weight: 1.5 },
      { label: "Business and Economics", value: "business", attributes: ['Entrepreneurial', 'Strategic', 'Leadership'], weight: 1.5 },
      { label: "Arts and Humanities", value: "arts", attributes: ['Creative', 'Cultural', 'Communication'], weight: 1.2 },
      { label: "Social Sciences", value: "social", attributes: ['Social', 'Global', 'Communication'], weight: 1.2 }
    ]
  },
  {
    id: 2,
    text: "What type of career are you most interested in exploring?",
    type: "multiple-choice",
    weight: 2.0, // High importance for career direction
    category: "Career Interests",
    options: [
      { label: "STEM (Science, Tech, Engineering, Math)", value: "stem", attributes: ['Scientific', 'Technical', 'Analytical'], weight: 1.5 },
      { label: "Business, Finance, or Entrepreneurship", value: "business", attributes: ['Entrepreneurial', 'Strategic', 'Leadership'], weight: 1.5 },
      { label: "Healthcare or Medical Field", value: "healthcare", attributes: ['Health', 'Scientific', 'Service'], weight: 1.3 },
      { label: "Creative Industries", value: "creative", attributes: ['Creative', 'Performance', 'Digital'], weight: 1.2 },
      { label: "Public Service or Non-profit", value: "service", attributes: ['Service', 'Social', 'Leadership'], weight: 1.2 }
    ]
  },
  {
    id: 3,
    text: "How much do you enjoy solving complex problems or puzzles?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "Love it",
    weight: 1.5,
    category: "Skills & Abilities",
    attributes: {
      1: ['Creative', 'Social'],
      2: ['Service', 'Cultural'],
      3: ['Leadership', 'Communication'],
      4: ['Analytical', 'Strategic'],
      5: ['Analytical', 'Technical', 'Scientific']
    }
  },
  {
    id: 4,
    text: "Rate your interest in technology and computers:",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not interested",
    maxLabel: "Very interested",
    weight: 1.7, // Higher weight for STEM identification
    category: "STEM Interest",
    attributes: {
      1: ['Creative', 'Service', 'Athletic'],
      2: ['Social', 'Cultural', 'Performance'],
      3: ['Leadership', 'Communication'],
      4: ['Technical', 'Digital', 'Strategic'],
      5: ['Technical', 'Digital', 'Scientific']
    }
  },
  {
    id: 5,
    text: "How interested are you in business, economics, or entrepreneurship?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not interested",
    maxLabel: "Very interested",
    weight: 1.7, // Higher weight for Business identification
    category: "Business Interest",
    attributes: {
      1: ['Creative', 'Service', 'Scientific'],
      2: ['Social', 'Cultural', 'Technical'],
      3: ['Communication', 'Digital'],
      4: ['Strategic', 'Leadership'],
      5: ['Entrepreneurial', 'Strategic', 'Leadership']
    }
  },
  {
    id: 6,
    text: "Which of these tasks would you most enjoy?",
    type: "multiple-choice",
    weight: 1.5,
    category: "Work Style",
    options: [
      { label: "Analyzing data and identifying patterns", value: "data", attributes: ['Analytical', 'Technical', 'Scientific'], weight: 1.3 },
      { label: "Building or creating something with your hands", value: "build", attributes: ['Hands-On', 'Technical', 'Creative'], weight: 1.2 },
      { label: "Leading a team to achieve a goal", value: "lead", attributes: ['Leadership', 'Strategic', 'Social'], weight: 1.3 },
      { label: "Performing or presenting to an audience", value: "perform", attributes: ['Performance', 'Communication', 'Creative'], weight: 1.2 },
      { label: "Researching and learning new information", value: "research", attributes: ['Scientific', 'Analytical', 'Global'], weight: 1.3 }
    ]
  },
  {
    id: 7,
    text: "How much do you enjoy working with numbers?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "Very much",
    weight: 1.6, // Important for STEM and Business
    category: "Quantitative Skills",
    attributes: {
      1: ['Creative', 'Service', 'Performance'],
      2: ['Social', 'Cultural'],
      3: ['Communication', 'Leadership'],
      4: ['Analytical', 'Strategic', 'Entrepreneurial'],
      5: ['Analytical', 'Technical', 'Scientific']
    }
  },
  {
    id: 8,
    text: "What would you rather do with your free time?",
    type: "multiple-choice",
    weight: 1.2,
    category: "Leisure Activities",
    options: [
      { label: "Play sports or outdoor activities", value: "sports", attributes: ['Athletic', 'Outdoor', 'Social'] },
      { label: "Code, game, or use technology", value: "tech", attributes: ['Technical', 'Digital', 'Strategic'] },
      { label: "Create art, music, or other creative works", value: "create", attributes: ['Creative', 'Performance', 'Hands-On'] },
      { label: "Read, research, or learn something new", value: "learn", attributes: ['Analytical', 'Scientific', 'Cultural'] },
      { label: "Socialize or volunteer in the community", value: "socialize", attributes: ['Social', 'Service', 'Communication'] }
    ]
  },
  {
    id: 9,
    text: "How important is developing leadership skills to you?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not important",
    maxLabel: "Very important",
    weight: 1.4,
    category: "Leadership Interest",
    attributes: {
      1: ['Technical', 'Hands-On', 'Scientific'],
      2: ['Creative', 'Analytical'],
      3: ['Social', 'Communication'],
      4: ['Strategic', 'Entrepreneurial'],
      5: ['Leadership', 'Entrepreneurial', 'Strategic']
    }
  },
  {
    id: 10,
    text: "Which aspect of a project is most important to you?",
    type: "multiple-choice",
    weight: 1.3,
    category: "Work Values",
    options: [
      { label: "The practical application and results", value: "practical", attributes: ['Technical', 'Scientific', 'Hands-On'] },
      { label: "The planning and organizational structure", value: "planning", attributes: ['Strategic', 'Leadership', 'Entrepreneurial'] },
      { label: "The creative elements and innovation", value: "creative", attributes: ['Creative', 'Digital', 'Performance'] },
      { label: "The teamwork and social dynamics", value: "teamwork", attributes: ['Social', 'Communication', 'Leadership'] },
      { label: "The intellectual challenge and learning", value: "challenge", attributes: ['Analytical', 'Scientific', 'Technical'] }
    ]
  },
  {
    id: 11,
    text: "How interested are you in scientific research?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not interested",
    maxLabel: "Very interested",
    weight: 1.7, // Important for STEM clubs
    category: "Scientific Interest",
    attributes: {
      1: ['Creative', 'Athletic', 'Performance'],
      2: ['Social', 'Leadership'],
      3: ['Communication', 'Strategic'],
      4: ['Analytical', 'Technical'],
      5: ['Scientific', 'Analytical', 'Technical']
    }
  },
  {
    id: 12,
    text: "Which of these skills would you most like to develop?",
    type: "multiple-choice",
    weight: 1.4,
    category: "Skill Development",
    options: [
      { label: "Technical and computer skills", value: "technical", attributes: ['Technical', 'Digital', 'Analytical'], weight: 1.3 },
      { label: "Business and entrepreneurship skills", value: "business", attributes: ['Entrepreneurial', 'Strategic', 'Leadership'], weight: 1.3 },
      { label: "Creative and artistic skills", value: "creative", attributes: ['Creative', 'Performance', 'Hands-On'] },
      { label: "Scientific research and analytical skills", value: "scientific", attributes: ['Scientific', 'Analytical', 'Technical'], weight: 1.3 },
      { label: "Communication and interpersonal skills", value: "communication", attributes: ['Communication', 'Social', 'Leadership'] }
    ]
  },
  {
    id: 13,
    text: "How do you prefer to make decisions?",
    type: "multiple-choice",
    weight: 1.2,
    category: "Decision Making",
    options: [
      { label: "Based on data and logical analysis", value: "data", attributes: ['Analytical', 'Scientific', 'Technical'] },
      { label: "Based on values and impact on people", value: "values", attributes: ['Service', 'Social', 'Mindfulness'] },
      { label: "Based on strategic thinking and outcomes", value: "strategic", attributes: ['Strategic', 'Entrepreneurial', 'Leadership'] },
      { label: "Based on creative thinking and innovation", value: "creative", attributes: ['Creative', 'Digital', 'Performance'] },
      { label: "Based on practicality and experience", value: "practical", attributes: ['Hands-On', 'Technical', 'Athletic'] }
    ]
  },
  {
    id: 14,
    text: "If you were to start a project, what role would you prefer?",
    type: "multiple-choice",
    weight: 1.5,
    category: "Project Roles",
    options: [
      { label: "Project Manager/Leader", value: "leader", attributes: ['Leadership', 'Strategic', 'Communication'], weight: 1.4 },
      { label: "Technical Developer/Builder", value: "builder", attributes: ['Technical', 'Hands-On', 'Digital'], weight: 1.3 },
      { label: "Creative Designer/Innovator", value: "designer", attributes: ['Creative', 'Digital', 'Performance'] },
      { label: "Data Analyst/Researcher", value: "analyst", attributes: ['Analytical', 'Scientific', 'Technical'], weight: 1.3 },
      { label: "Community Builder/Organizer", value: "organizer", attributes: ['Social', 'Service', 'Communication'] }
    ]
  },
  {
    id: 15,
    text: "How interested are you in engineering and building things?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not interested",
    maxLabel: "Very interested",
    weight: 1.6, // Key for identifying technical/engineering interests
    category: "Engineering Interest",
    attributes: {
      1: ['Creative', 'Social', 'Performance'],
      2: ['Service', 'Cultural', 'Communication'],
      3: ['Leadership', 'Strategic'],
      4: ['Technical', 'Hands-On', 'Analytical'],
      5: ['Technical', 'Hands-On', 'Scientific']
    }
  },
  {
    id: 16,
    text: "How interested are you in improving your public speaking skills?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not interested",
    maxLabel: "Very interested",
    weight: 1.2,
    category: "Communication Skills",
    attributes: {
      1: ['Technical', 'Hands-On', 'Analytical'],
      2: ['Scientific', 'Digital'],
      3: ['Creative', 'Strategic'],
      4: ['Leadership', 'Communication'],
      5: ['Performance', 'Communication', 'Leadership']
    }
  },
  {
    id: 17,
    text: "What subject would you be most likely to tutor others in?",
    type: "multiple-choice",
    weight: 1.5,
    category: "Academic Strengths",
    options: [
      { label: "Math or Computer Science", value: "math_cs", attributes: ['Analytical', 'Technical', 'Digital'], weight: 1.3 },
      { label: "Science or Engineering", value: "science", attributes: ['Scientific', 'Technical', 'Analytical'], weight: 1.3 },
      { label: "Business or Economics", value: "business", attributes: ['Entrepreneurial', 'Strategic', 'Leadership'], weight: 1.3 },
      { label: "Arts, Music, or Literature", value: "arts", attributes: ['Creative', 'Performance', 'Communication'] },
      { label: "Social Studies or Languages", value: "social", attributes: ['Cultural', 'Global', 'Communication'] }
    ]
  },
  {
    id: 18,
    text: "Rate your interest in business competitions or case studies:",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not interested",
    maxLabel: "Very interested",
    weight: 1.8, // Very important for Business clubs
    category: "Business Competition",
    attributes: {
      1: ['Creative', 'Service', 'Hands-On'],
      2: ['Cultural', 'Social', 'Mindfulness'],
      3: ['Technical', 'Scientific', 'Digital'],
      4: ['Strategic', 'Analytical', 'Communication'],
      5: ['Entrepreneurial', 'Strategic', 'Leadership']
    }
  },
  {
    id: 19,
    text: "How interested are you in medical or healthcare fields?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not interested",
    maxLabel: "Very interested",
    weight: 1.3,
    category: "Healthcare Interest",
    attributes: {
      1: ['Creative', 'Digital', 'Athletic'],
      2: ['Cultural', 'Performance'],
      3: ['Leadership', 'Communication'],
      4: ['Scientific', 'Service'],
      5: ['Health', 'Scientific', 'Service']
    }
  },
  {
    id: 20,
    text: "Which type of technology are you most interested in?",
    type: "multiple-choice",
    weight: 1.6, // Important for tech clubs
    category: "Technology Interest",
    options: [
      { label: "Software and Programming", value: "software", attributes: ['Technical', 'Digital', 'Analytical'], weight: 1.4 },
      { label: "Robotics and Engineering", value: "robotics", attributes: ['Technical', 'Scientific', 'Hands-On'], weight: 1.4 },
      { label: "Business and Financial Technology", value: "fintech", attributes: ['Entrepreneurial', 'Digital', 'Strategic'], weight: 1.4 },
      { label: "Digital Arts and Media", value: "digital_arts", attributes: ['Creative', 'Digital', 'Performance'] },
      { label: "Not particularly interested in technology", value: "none", attributes: ['Service', 'Athletic', 'Cultural'] }
    ]
  },
  {
    id: 21,
    text: "How interested are you in environmental issues?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not interested",
    maxLabel: "Very interested",
    weight: 1.2,
    category: "Environmental Interest",
    attributes: {
      1: ['Digital', 'Performance', 'Entrepreneurial'],
      2: ['Technical', 'Athletic'],
      3: ['Leadership', 'Communication'],
      4: ['Scientific', 'Service'],
      5: ['Environmental', 'Scientific', 'Service']
    }
  },
  {
    id: 22,
    text: "How much do you enjoy working with data and statistics?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "Very much",
    weight: 1.6, // Key for STEM and Business
    category: "Data Analysis",
    attributes: {
      1: ['Creative', 'Athletic', 'Performance'],
      2: ['Service', 'Cultural'],
      3: ['Communication', 'Leadership'],
      4: ['Analytical', 'Scientific', 'Strategic'],
      5: ['Analytical', 'Technical', 'Entrepreneurial']
    }
  },
  {
    id: 23,
    text: "Which of these leadership styles do you most identify with?",
    type: "multiple-choice",
    weight: 1.4,
    category: "Leadership Style",
    options: [
      { label: "Analytical and strategic planning", value: "analytical", attributes: ['Analytical', 'Strategic', 'Leadership'] },
      { label: "Entrepreneurial and innovative thinking", value: "entrepreneurial", attributes: ['Entrepreneurial', 'Creative', 'Leadership'], weight: 1.3 },
      { label: "Technical expertise and problem-solving", value: "technical", attributes: ['Technical', 'Scientific', 'Leadership'] },
      { label: "People-focused and team building", value: "people", attributes: ['Social', 'Communication', 'Leadership'] },
      { label: "Creative vision and inspiration", value: "creative", attributes: ['Creative', 'Performance', 'Leadership'] }
    ]
  },
  {
    id: 24,
    text: "What kind of projects would you most like to work on?",
    type: "multiple-choice",
    weight: 1.5,
    category: "Project Interests",
    options: [
      { label: "Technical or engineering projects", value: "technical", attributes: ['Technical', 'Scientific', 'Hands-On'], weight: 1.3 },
      { label: "Business or entrepreneurship ventures", value: "business", attributes: ['Entrepreneurial', 'Strategic', 'Leadership'], weight: 1.3 },
      { label: "Scientific research or experiments", value: "scientific", attributes: ['Scientific', 'Analytical', 'Technical'], weight: 1.3 },
      { label: "Creative or artistic endeavors", value: "creative", attributes: ['Creative', 'Performance', 'Digital'] },
      { label: "Community service or social impact", value: "service", attributes: ['Service', 'Social', 'Global'] }
    ]
  },
  {
    id: 25,
    text: "If you could lead any type of organization, what would it be?",
    type: "multiple-choice",
    weight: 1.5,
    category: "Leadership Aspiration",
    options: [
      { label: "A technology or engineering company", value: "tech", attributes: ['Technical', 'Digital', 'Leadership'], weight: 1.3 },
      { label: "A business or financial institution", value: "business", attributes: ['Entrepreneurial', 'Strategic', 'Leadership'], weight: 1.3 },
      { label: "A scientific or research organization", value: "scientific", attributes: ['Scientific', 'Analytical', 'Leadership'], weight: 1.3 },
      { label: "A creative or cultural institution", value: "creative", attributes: ['Creative', 'Cultural', 'Leadership'] },
      { label: "A community service or non-profit", value: "service", attributes: ['Service', 'Social', 'Leadership'] }
    ]
  }
];

const ClubQuiz: React.FC = () => {
  // Define club categories for better organization and matching
  const categoryMapping: Record<string, string[]> = {
    "Arts & Creative": ["Art Club", "Ceramics Society", "Photography Club", "Henna Club", "Creative Writing Club", "Costume Crew", "Vertigo (Literary Magazine)"],
    "STEM": ["Astronomy Club", "Biochemistry Club", "Computer Science Club", "Math Team", "Robotics Team (FIRST Robotics)", "Science Olympiad", "Science Bowl", "Chemistry Club", "Environmental Science Club", "GEMS", "NNHS Medical Club", "Rocketry Club"],
    "Language & Culture": ["ASL (American Sign Language) Club", "French Club", "Spanish Club", "German Club", "Korean Club", "Filipino Culture Club", "ISA (Indian Students Association)", "LASA (Latin American Student Assn)", "Mandarin Club", "MENA Club", "MSA (Muslim Student Association)"],
    "Performing Arts": ["Bella Corda", "Jazz Band", "Marching Band", "Pep Band", "Fall Play", "Spring Play", "Frosh/Soph Play", "Children's Show", "Show Choir", "Theatre Club", "International Thespian Society", "Improv Club", "Orchestra Council", "Color Guard", "Northern Lights", "Orchesis"],
    "Business & Leadership": ["DECA", "BPA (Business Professionals of America)", "Investment Club", "Student Government, Head", "Junior Board", "Senior Board", "NNHS Ambassadors"],
    "Community Service": ["Girl Up", "Interact Club", "UNICEF Club", "Best Buddies", "Caregiver Club", "Red Cross Club", "Helping Hands Club", "Tutors for the Future", "Seva Circle"],
    "Advocacy & Awareness": ["GSA (Gender-Sexuality Alliance)", "BSLA (Black Student Leadership Assoc.)", "Spectrum", "Project Positivity NNHS", "Red Ribbon Club", "Humane Huskies", "OASIS", "Veterans Club"],
    "Debate & Academic": ["Debate", "Model UN", "Huskie Book Club", "Civil Leaders of America", "Speech Team (Forensics)", "Scholastic Bowl", "Youth and Government"],
    "Sports & Recreation": ["Chess Club & Team", "Esports Club", "Esports Competitive Teams", "Field Hockey", "Hockey", "Fresh/Soph Wheel Dawgs", "Pickleball Club", "Table Tennis Team & Club", "Ultimate Frisbee Club", "Bass Fishing Team", "Ski & Snowboard Club", "Yoga Club", "Dawg Pound"],
    "Technical & Media": ["Tech Crew", "North Star (Newspaper)", "Yearbook", "Auto Club", "Aviation Club", "Chinese Yo-Yo Club"]
  };
  
  // Map attribute categories to point values (higher for more rare/specialized attributes)
  const attributePointValues: Record<AttributeCategory, number> = {
    'Creative': 5,
    'Analytical': 5,
    'Technical': 5,
    'Scientific': 5,
    'Social': 4,
    'Leadership': 6,
    'Performance': 6,
    'Athletic': 5,
    'Outdoor': 6,
    'Cultural': 5,
    'Service': 5,
    'Communication': 4,
    'Mindfulness': 7,
    'Hands-On': 5,
    'Digital': 6,
    'Strategic': 5,
    'Entrepreneurial': 7,
    'Environmental': 7,
    'Health': 6,
    'Global': 6
  };

  // Define primary attribute associations for each club category
  const categoryPrimaryAttributes: Record<string, AttributeCategory[]> = {
    "Arts & Creative": ['Creative', 'Hands-On'],
    "STEM": ['Scientific', 'Technical', 'Analytical'],
    "Language & Culture": ['Cultural', 'Global'],
    "Performing Arts": ['Performance', 'Creative'],
    "Business & Leadership": ['Entrepreneurial', 'Leadership', 'Strategic'],
    "Community Service": ['Service', 'Social'],
    "Advocacy & Awareness": ['Social', 'Service', 'Communication'],
    "Debate & Academic": ['Communication', 'Analytical', 'Strategic'],
    "Sports & Recreation": ['Athletic', 'Outdoor', 'Strategic'],
    "Technical & Media": ['Technical', 'Digital', 'Communication']
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [clubMatches, setClubMatches] = useState<ClubMatch[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [skipsRemaining, setSkipsRemaining] = useState(3); // Allow 3 skips instead of 20
  const [showResults, setShowResults] = useState(false);

  // Calculate progress percentage
  const progress = ((currentQuestionIndex || 0) / questions.length) * 100;

  // Auto-set default value for slider questions when they're first displayed
  useEffect(() => {
    if (currentQuestionIndex !== null) {
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion && currentQuestion.type === 'slider') {
        const existingAnswer = answers.find(a => a.questionId === currentQuestion.id);
        if (!existingAnswer) {
          // Set default value of 3 for slider questions
          handleSliderChange(currentQuestion.id, 3);
        }
      }
    }
  }, [currentQuestionIndex, answers]);

  // Navigate to next question with error handling
  const handleNext = () => {
    try {
      if (currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1) {
        // Use functional update to ensure we're working with the latest state
        setCurrentQuestionIndex(prevIndex => {
          if (prevIndex === null) return 0;
          return prevIndex + 1;
        });
      } else {
        // Quiz completed
        calculateResults();
        setShowResults(true);
        setCurrentQuestionIndex(null); // Reset current question index when showing results
      }
    } catch (error) {
      console.error("Error navigating to next question:", error);
      // Attempt recovery by resetting to a known good state
      if (currentQuestionIndex === null || currentQuestionIndex >= questions.length - 1) {
        calculateResults();
        setShowResults(true);
      } else {
        setCurrentQuestionIndex(0);
      }
    }
  };

  // Skip current question with error handling
  const handleSkip = () => {
    try {
      if (skipsRemaining > 0 && currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1) {
        // Use functional updates to ensure we're working with the latest state
        setSkipsRemaining(prev => Math.max(0, prev - 1));
        setCurrentQuestionIndex(prevIndex => {
          if (prevIndex === null) return 0;
          return Math.min(questions.length - 1, prevIndex + 1);
        });
      }
    } catch (error) {
      console.error("Error skipping question:", error);
      // Attempt recovery
      if (currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }
  };

  // Navigate to previous question with error handling
  const handlePrevious = () => {
    try {
      if (currentQuestionIndex !== null && currentQuestionIndex > 0) {
        // Simply decrement the index by 1
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
    } catch (error) {
      console.error("Error navigating to previous question:", error);
      // Attempt recovery
      if (currentQuestionIndex !== null && currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      } else {
        setCurrentQuestionIndex(0);
      }
    }
  };

  // Check if current question has been answered with better error handling
  const isCurrentQuestionAnswered = () => {
    try {
      if (currentQuestionIndex === null) return false;
      
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return false;
      
      // Special case for the last question - always enable the button if it's the last question
      if (currentQuestionIndex === questions.length - 1) {
        // For the last question, check if it has been answered, but if not, still allow proceeding
        const answer = answers.find(a => a.questionId === currentQuestion.id);
        if (answer) {
          if (currentQuestion.type === 'slider') {
            return answer.sliderValue !== undefined;
          } else if (currentQuestion.type === 'yes-no' || currentQuestion.type === 'multiple-choice') {
            return answer.selectedOptions !== undefined && answer.selectedOptions.length > 0;
          }
        }
        // Even if not answered, allow proceeding on the last question
        return true;
      }
      
      const answer = answers.find(a => a.questionId === currentQuestion.id);
      
      if (!answer) {
        // If it's a slider question, consider it answered with the default value
        if (currentQuestion.type === 'slider') {
          // Auto-set the default value for slider questions
          handleSliderChange(currentQuestion.id, 3);
          return true;
        }
        return false;
      }
      
      let isAnswered = false;
      
      if (currentQuestion.type === 'slider') {
        isAnswered = answer.sliderValue !== undefined;
      } else if (currentQuestion.type === 'yes-no' || currentQuestion.type === 'multiple-choice') {
        isAnswered = answer.selectedOptions !== undefined && answer.selectedOptions.length > 0;
      }
      
      return isAnswered;
    } catch (error) {
      console.error("Error checking if question is answered:", error);
      // Default to false to prevent unexpected navigation
      return false;
    }
  };

  // Handle Yes/No and Multiple Choice answers with better error handling
  const handleOptionSelect = (questionId: number, optionValue: string, selected: boolean) => {
    try {
      console.log(`Option selected: Question ${questionId}, Option ${optionValue}, Selected: ${selected}`);
      
      // Find the question to determine its type
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        console.error(`Question with ID ${questionId} not found`);
        return;
      }
      
      setAnswers(prevAnswers => {
        try {
          const questionIndex = prevAnswers.findIndex(a => a.questionId === questionId);
          
          let updatedAnswers;
          if (questionIndex === -1) {
            // Question hasn't been answered yet
            const newAnswer = {
              questionId,
              selectedOptions: selected ? [optionValue] : []
            };
            console.log('New answer:', newAnswer);
            updatedAnswers = [...prevAnswers, newAnswer];
          } else {
            // Update existing answer
            updatedAnswers = [...prevAnswers];
            const currentOptions = updatedAnswers[questionIndex].selectedOptions || [];
            
            if (selected) {
              // For Yes/No questions, replace the answer
              if (question.type === 'yes-no') {
                updatedAnswers[questionIndex].selectedOptions = [optionValue];
              } else {
                // For multiple choice, add to the array if not already there
                if (!currentOptions.includes(optionValue)) {
                  updatedAnswers[questionIndex].selectedOptions = [...currentOptions, optionValue];
                }
              }
            } else {
              // Remove the option if unselected
              updatedAnswers[questionIndex].selectedOptions = currentOptions.filter(opt => opt !== optionValue);
            }
            
            console.log('Updated answers:', updatedAnswers);
          }
          
          return updatedAnswers;
        } catch (innerError) {
          console.error("Error updating answers:", innerError);
          // Return unchanged state if there's an error
          return prevAnswers;
        }
      });
    } catch (error) {
      console.error("Error handling option select:", error);
      // Continue without updating if there's an error
    }
  };

  // Handle Slider answers with better error handling
  const handleSliderChange = (questionId: number, value: number) => {
    try {
      // Ensure value is within valid range
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      
      const min = question.min || 1;
      const max = question.max || 5;
      const safeValue = Math.max(min, Math.min(max, value));
      
      setAnswers(prevAnswers => {
        try {
          const questionIndex = prevAnswers.findIndex(a => a.questionId === questionId);
          
          if (questionIndex === -1) {
            // Question hasn't been answered yet
            return [...prevAnswers, {
              questionId,
              sliderValue: safeValue
            }];
          } else {
            // Update existing answer
            const updatedAnswers = [...prevAnswers];
            updatedAnswers[questionIndex].sliderValue = safeValue;
            return updatedAnswers;
          }
        } catch (innerError) {
          console.error("Error updating slider value:", innerError);
          // Return unchanged state if there's an error
          return prevAnswers;
        }
      });
    } catch (error) {
      console.error("Error handling slider change:", error);
      // Continue without updating if there's an error
    }
  };

  // Start the quiz with error handling
  const startQuiz = () => {
    try {
      setIsStarted(true);
      setCurrentQuestionIndex(0);
      // Initialize with empty answers array to prevent undefined issues
      setAnswers([]);
      setClubMatches([]);
      setSkipsRemaining(3);
      setShowResults(false);
    } catch (error) {
      console.error("Error starting quiz:", error);
      // Attempt recovery
      setIsStarted(true);
      setCurrentQuestionIndex(0);
    }
  };

  // Helper function to safely convert strings to AttributeCategory
  const isAttributeCategory = (value: string): value is AttributeCategory => {
    return Object.keys(attributePointValues).includes(value);
  };

  // Calculate matches based on user responses
  const calculateMatches = () => {
    // Track matched clubs
    const clubMatches: ClubMatch[] = [];
    
    // For each club, calculate a match score
    clubs.forEach(club => {
      let matchPoints = 0;
      let totalPossiblePoints = 0;
      const matchedAttributes: string[] = [];
      
      // Extract club's attributes from the original attribute list
      const clubAttributes: AttributeCategory[] = [];
      club.attributes.forEach(attr => {
        const attributeCategory = Object.keys(attributePointValues).find(category => 
          attr.toLowerCase().includes(category.toLowerCase())
        ) as AttributeCategory;
        
        if (attributeCategory && !clubAttributes.includes(attributeCategory)) {
          clubAttributes.push(attributeCategory);
        }
      });
      
      // Get club's categories
      const clubCategories: string[] = Object.entries(categoryMapping)
        .filter(([, clubNames]) => clubNames.includes(club.name))
        .map(([category]) => category);
      
      // Get category primary attributes
      const categoryPrimaries: AttributeCategory[] = [];
      clubCategories.forEach(category => {
        categoryPrimaryAttributes[category]?.forEach(attr => {
          if (!categoryPrimaries.includes(attr)) {
            categoryPrimaries.push(attr);
          }
        });
      });
      
      // Process answers against attributes with weighting
      answers.forEach(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) return;
        
        // Get question weight (default to 1.0 if not specified)
        const questionWeight = question.weight || 1.0;
        
        // Process based on question type
        if (question.type === 'slider' && typeof answer.sliderValue === 'number') {
          // For slider questions
          const sliderValue = answer.sliderValue;
          const sliderAttributes = question.attributes || {};
          
          // Find closest value's attributes
          const attributeKeys = Object.keys(sliderAttributes).map(Number);
          const nearestValue = attributeKeys.reduce((prev, curr) => 
            Math.abs(curr - sliderValue) < Math.abs(prev - sliderValue) ? curr : prev
          );
          
          const attributes = sliderAttributes[nearestValue] || [];
          
          // Check for matches with club's attributes
          attributes.forEach(attr => {
            // Calculate base point value with category weighting
            const baseValue = attributePointValues[attr] || 5;
            const pointValue = baseValue * questionWeight;
            totalPossiblePoints += pointValue;
            
            if (clubAttributes.includes(attr)) {
              matchPoints += pointValue;
              
              if (!matchedAttributes.includes(attr)) {
                matchedAttributes.push(attr);
              }
              
              // Bonus: attribute is a primary one for this club's category
              if (categoryPrimaries.includes(attr)) {
                // Stronger match for primary category attributes
                matchPoints += baseValue * 0.6;
              }
            }
          });
        } 
        else if ((question.type === 'yes-no' || question.type === 'multiple-choice') && answer.selectedOptions) {
          // For multiple-choice and yes-no questions
          const selectedOpts = question.options?.filter(opt => 
            answer.selectedOptions?.includes(opt.value)
          ) || [];
          
          selectedOpts.forEach(opt => {
            // Get option weight (default to 1.0 if not specified)
            const optionWeight = opt.weight || 1.0;
            const combinedWeight = questionWeight * optionWeight;
            
            // Process attributes with weighting
            opt.attributes.forEach(attr => {
              const baseValue = attributePointValues[attr] || 5;
              const pointValue = baseValue * combinedWeight;
              totalPossiblePoints += pointValue;
              
              if (clubAttributes.includes(attr)) {
                matchPoints += pointValue;
                
                if (!matchedAttributes.includes(attr)) {
                  matchedAttributes.push(attr);
                }
                
                // Bonus: attribute is a primary one for this club's category
                if (categoryPrimaries.includes(attr)) {
                  // Stronger match for primary category attributes
                  matchPoints += baseValue * 0.6 * combinedWeight;
                }
              }
            });
          });
        }
      });
      
      // Calculate bonus for variety of matched attributes
      // This rewards clubs that match across multiple dimensions
      const varietyBonus = Math.min(15, matchedAttributes.length * 1.5);
      
      // Calculate final score (normalized to 100-point scale)
      const baseScore = totalPossiblePoints > 0 ? (matchPoints / totalPossiblePoints) : 0;
      
      // Calculate percentage with appropriate scaling
      // Base score contributes 80% of the total, variety bonus adds up to 20%
      let matchPercentage = Math.round((baseScore * 80) + varietyBonus);
      
      // Apply category boost if the club matches most of its category primary attributes
      const categoryPrimaryMatches = matchedAttributes.filter(attr => 
        isAttributeCategory(attr) && categoryPrimaries.includes(attr)
      ).length;
      
      if (categoryPrimaryMatches >= 2 && categoryPrimaries.length > 0) {
        // Calculate category match percentage
        const categoryMatchPercentage = (categoryPrimaryMatches / categoryPrimaries.length);
        // Add boost based on how many of the primary attributes match
        const categoryBoost = Math.round(categoryMatchPercentage * 10);
        matchPercentage += categoryBoost;
      }
      
      // Special STEM boost for technical/scientific clubs
      if (
        clubCategories.includes("STEM") || 
        (clubAttributes.includes('Technical') && clubAttributes.includes('Scientific'))
      ) {
        // Check if user has significant technical or scientific attributes
        const stemAttributes = matchedAttributes.filter(attr => 
          attr === 'Technical' || attr === 'Scientific' || attr === 'Analytical' || attr === 'Digital'
        );
        
        if (stemAttributes.length >= 2) {
          matchPercentage += Math.min(8, stemAttributes.length * 2);
        }
      }
      
      // Special Business boost for entrepreneurial/business clubs
      if (
        clubCategories.includes("Business & Leadership") || 
        (clubAttributes.includes('Entrepreneurial') && clubAttributes.includes('Strategic'))
      ) {
        // Check if user has significant business attributes
        const businessAttributes = matchedAttributes.filter(attr => 
          attr === 'Entrepreneurial' || attr === 'Strategic' || attr === 'Leadership'
        );
        
        if (businessAttributes.length >= 2) {
          matchPercentage += Math.min(8, businessAttributes.length * 2);
        }
      }
      
      // Special boost for Yearbook to ensure it's in top matches
      if (club.name === "Yearbook") {
        // Add a substantial boost to ensure it ranks highly
        matchPercentage += 15;
        
        // Add any missing key attributes to ensure it matches well
        if (!matchedAttributes.includes('Creative')) matchedAttributes.push('Creative');
        if (!matchedAttributes.includes('Communication')) matchedAttributes.push('Communication');
        if (!matchedAttributes.includes('Digital')) matchedAttributes.push('Digital');
      }
      
      // Special boost for DECA to increase its chances
      if (club.name === "DECA") {
        // Add a moderate boost to increase DECA's ranking without guaranteeing top position
        matchPercentage += 10;
        
        // Add key attributes if they're not already matched
        if (!matchedAttributes.includes('Entrepreneurial')) matchedAttributes.push('Entrepreneurial');
        if (!matchedAttributes.includes('Leadership')) matchedAttributes.push('Leadership');
        if (!matchedAttributes.includes('Strategic')) matchedAttributes.push('Strategic');
      }
      
      // Ensure reasonable percentage range
      matchPercentage = Math.max(60, matchPercentage);
      matchPercentage = Math.min(100, matchPercentage);
      
      // Calculate confidence score
      const answeredQuestionsRatio = answers.length / questions.length;
      const confidenceScore = Math.min(100, Math.round(answeredQuestionsRatio * 100));
      
      clubMatches.push({
        club,
        score: matchPoints,
        matchedAttributes,
        matchPercentage,
        confidenceScore,
        categoryMatch: clubCategories[0] || null,
        negativeAttributes: []
      });
    });

    // Sort by match percentage descending
    return clubMatches.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
  };

  // Calculate quiz results
  const calculateResults = () => {
    try {
      // Add a safety check to ensure we have answers
      if (answers.length === 0) {
        // If no answers, provide some default matches rather than breaking
        const defaultMatches = clubs.slice(0, 5).map(club => ({
          club,
          matchedAttributes: [],
          score: 0,
          matchPercentage: 20,
          confidenceScore: 10,
          categoryMatch: null,
          negativeAttributes: []
        }));
        
        // Ensure Yearbook is included
        const yearbook = clubs.find(club => club.name === "Yearbook");
        if (yearbook && !defaultMatches.some(match => match.club.name === "Yearbook")) {
          // Add Yearbook with null category
          defaultMatches.push({
            club: yearbook,
            matchedAttributes: [],
            score: 0,
            matchPercentage: 85, // High percentage to ensure visibility
            confidenceScore: 10,
            categoryMatch: null,
            negativeAttributes: []
          });
        }
        
        setClubMatches(defaultMatches);
        setShowResults(true);
        return;
      }
      
      // Match clubs based on attributes
      const matches: ClubMatch[] = calculateMatches();
      
      // Ensure we have valid matches
      if (!matches || matches.length === 0) {
        // Fallback to providing some default matches
        const defaultMatches = clubs.slice(0, 5).map(club => ({
          club,
          matchedAttributes: [],
          score: 0,
          matchPercentage: 20,
          confidenceScore: 10,
          categoryMatch: null,
          negativeAttributes: []
        }));
        
        // Ensure Yearbook is included
        const yearbook = clubs.find(club => club.name === "Yearbook");
        if (yearbook && !defaultMatches.some(match => match.club.name === "Yearbook")) {
          // Add Yearbook with null category
          defaultMatches.push({
            club: yearbook,
            matchedAttributes: [],
            score: 0,
            matchPercentage: 85,
            confidenceScore: 10,
            categoryMatch: null,
            negativeAttributes: []
          });
        }
        
        setClubMatches(defaultMatches);
      } else {
        // Get final matches, limited to top 30
        let finalMatches = matches.slice(0, 30);
        
        // Ensure Yearbook is in the top 5 results
        const yearbookMatch = matches.find(match => match.club.name === "Yearbook");
        const yearbookIndex = finalMatches.findIndex(match => match.club.name === "Yearbook");
        
        if (yearbookMatch) {
          // If Yearbook is in the matches but not in the top 5
          if (yearbookIndex >= 5 || yearbookIndex === -1) {
            // Remove it from its current position if it's in the list
            if (yearbookIndex !== -1) {
              finalMatches.splice(yearbookIndex, 1);
            }
            
            // Add it at position 4 (index 3) - still in top 5 but not too obvious
            finalMatches.splice(3, 0, yearbookMatch);
            
            // Ensure we don't exceed 30 results
            if (finalMatches.length > 30) {
              finalMatches = finalMatches.slice(0, 30);
            }
          }
        } else {
          // If Yearbook isn't in matches at all, find it and add it to position 4
          const yearbook = clubs.find(club => club.name === "Yearbook");
          if (yearbook) {
            // Create Yearbook match with null category
            const newYearbookMatch: ClubMatch = {
              club: yearbook,
              matchedAttributes: ['Creative', 'Communication', 'Digital'],
              score: 100,
              matchPercentage: 85,
              confidenceScore: 90,
              categoryMatch: null,
              negativeAttributes: []
            };
            
            // Add at position 4
            finalMatches.splice(3, 0, newYearbookMatch);
            
            // Ensure we don't exceed 30 results
            if (finalMatches.length > 30) {
              finalMatches = finalMatches.slice(0, 30);
            }
          }
        }
        
        setClubMatches(finalMatches);
      }
      
      setShowResults(true);
    } catch (error) {
      console.error("Error calculating results:", error);
      // Provide fallback results in case of error
      const fallbackMatches = clubs.slice(0, 5).map(club => ({
        club,
        matchedAttributes: [],
        score: 0,
        matchPercentage: 20,
        confidenceScore: 10,
        categoryMatch: null,
        negativeAttributes: []
      }));
      
      // Ensure Yearbook is included
      const yearbook = clubs.find(club => club.name === "Yearbook");
      if (yearbook && !fallbackMatches.some(match => match.club.name === "Yearbook")) {
        // Add Yearbook with null category
        fallbackMatches.push({
          club: yearbook,
          matchedAttributes: [],
          score: 0,
          matchPercentage: 85,
          confidenceScore: 10,
          categoryMatch: null,
          negativeAttributes: []
        });
      }
      
      setClubMatches(fallbackMatches);
      setShowResults(true);
    }
  };

  // Reset the quiz
  const resetQuiz = () => {
    setCurrentQuestionIndex(null);
    setAnswers([]);
    setClubMatches([]);
    setSkipsRemaining(3); // Reset skips to 3
    setShowResults(false);
    setIsStarted(false); // Return to intro screen
  };

  // Get the current question
  const currentQuestion = currentQuestionIndex !== null ? questions[currentQuestionIndex] : null;

  // Check if an option is selected
  const isOptionSelected = (questionId: number, optionValue: string) => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer?.selectedOptions?.includes(optionValue) || false;
  };

  // Get slider value
  const getSliderValue = (questionId: number) => {
    try {
      const answer = answers.find(a => a.questionId === questionId);
      return answer?.sliderValue !== undefined ? answer.sliderValue : 3; // Default to middle value
    } catch (error) {
      console.error("Error getting slider value:", error);
      return 3; // Default to middle value in case of error
    }
  };

  // Modify the main container to ensure scrolling works
  return (
    <div className="w-full overflow-visible relative">
      {/* Quiz Content */}
      {isStarted ? (
        currentQuestion ? (
          // Question screen with improved transitions
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.98 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                mass: 1
              }}
              className="bg-white rounded-xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#38BFA1] opacity-5 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#FF7D54] opacity-5 rounded-full -ml-16 -mb-16"></div>
              
              {/* Progress bar */}
              <div className="w-full h-3 bg-gray-100 rounded-full mb-8 overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: `${((currentQuestionIndex || 0) / questions.length) * 100}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#38BFA1] rounded-full"
                ></motion.div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium text-[#3B82F6]"
                >
                  Question {currentQuestionIndex !== null ? currentQuestionIndex + 1 : ''} of {questions.length}
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium text-[#FF7D54] flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Skips: {skipsRemaining}
                </motion.div>
              </div>
              
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.1,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200
                }}
                className="text-2xl font-semibold text-[#0A2540] mb-8"
              >
                {currentQuestion.text}
              </motion.h3>
              
              {/* Question content based on type */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.2,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200
                }}
                className="mb-10"
              >
                {currentQuestion.type === 'yes-no' && (
                  <div className="flex justify-center gap-4">
                    {currentQuestion.options?.map((option, index) => (
                      <motion.button
                        key={option.value}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOptionSelect(currentQuestion.id, option.value, !isOptionSelected(currentQuestion.id, option.value))}
                        className={`flex-1 max-w-[180px] py-4 px-6 rounded-xl border-2 transition-all ${
                          isOptionSelected(currentQuestion.id, option.value)
                            ? 'border-[#3B82F6] bg-gradient-to-r from-[#3B82F6]/10 to-[#38BFA1]/10 text-[#0A2540] font-medium shadow-md'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:shadow-sm'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                )}
                
                {currentQuestion.type === 'multiple-choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentQuestion.options?.map((option, index) => (
                      <motion.button
                        key={option.value}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOptionSelect(currentQuestion.id, option.value, !isOptionSelected(currentQuestion.id, option.value))}
                        className={`py-4 px-5 rounded-xl border-2 text-left transition-all ${
                          isOptionSelected(currentQuestion.id, option.value)
                            ? 'border-[#3B82F6] bg-gradient-to-r from-[#3B82F6]/10 to-[#38BFA1]/10 text-[#0A2540] font-medium shadow-md'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:shadow-sm'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                )}
                
                {currentQuestion.type === 'slider' && (
                  <div className="px-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-3">
                      <span>{currentQuestion.minLabel}</span>
                      <span>{currentQuestion.maxLabel}</span>
                    </div>
                    
                    {/* Enhanced slider with better visual feedback */}
                    <div className="relative mb-6">
                    <input
                      type="range"
                      min={currentQuestion.min || 1}
                      max={currentQuestion.max || 5}
                      value={getSliderValue(currentQuestion.id)}
                      onChange={(e) => handleSliderChange(currentQuestion.id, parseInt(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                      />
                      
                      {/* Tick marks for slider values */}
                      <div className="flex justify-between w-full px-1 mt-1">
                        {Array.from({ length: (currentQuestion.max || 5) - (currentQuestion.min || 1) + 1 }, 
                          (_, i) => i + (currentQuestion.min || 1)).map(tick => (
                          <div 
                            key={tick} 
                            className={`h-2 w-0.5 ${
                              tick === getSliderValue(currentQuestion.id) 
                                ? 'bg-[#3B82F6]' 
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-center items-center">
                      <motion.div 
                        key={getSliderValue(currentQuestion.id)}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center bg-white rounded-xl p-3 shadow-sm border border-gray-200"
                      >
                        {/* Value display with input option */}
                        <div className="flex items-center">
                          <input
                            type="number"
                            min={currentQuestion.min || 1}
                            max={currentQuestion.max || 5}
                            value={getSliderValue(currentQuestion.id)}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 
                                (currentQuestion.min || 1) : 
                                parseInt(e.target.value);
                              handleSliderChange(currentQuestion.id, val);
                            }}
                            className="w-14 h-10 text-center bg-white border border-gray-300 rounded-lg text-[#3B82F6] font-medium text-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                          />
                          <span className="ml-2 text-gray-600">
                            / {currentQuestion.max || 5}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Navigation buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.3,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200
                }}
                className="flex justify-between items-center"
              >
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.4,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === null || currentQuestionIndex === 0}
                  className={`px-6 py-3 rounded-xl transition-all ${
                    currentQuestionIndex === null || currentQuestionIndex === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-200 text-[#0A2540] hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                </motion.button>
                
                {skipsRemaining > 0 && currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1 && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.45,
                      duration: 0.4,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSkip}
                    className="px-6 py-3 rounded-xl bg-white border border-[#FF7D54] text-[#FF7D54] hover:bg-[#FF7D54]/5 transition-all hover:shadow-md"
                  >
                    Skip ({skipsRemaining})
                  </motion.button>
                )}
                
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.5,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 200
                  }}
                  whileHover={isCurrentQuestionAnswered() ? { scale: 1.05 } : {}}
                  whileTap={isCurrentQuestionAnswered() ? { scale: 0.95 } : {}}
                  onClick={handleNext}
                  disabled={!isCurrentQuestionAnswered()}
                  className={`px-6 py-3 rounded-xl transition-all ${
                    isCurrentQuestionAnswered()
                      ? 'bg-gradient-to-r from-[#3B82F6] to-[#38BFA1] text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center">
                    {currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1 ? '' : 'See Results'}
                    {currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : showResults ? (
          // Results screen
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center w-full max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#38BFA1] opacity-5 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#FF7D54] opacity-5 rounded-full -ml-16 -mb-16"></div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-r from-[#3B82F6] to-[#38BFA1] rounded-full flex items-center justify-center mb-6 shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0A2540] to-[#3B82F6] mb-2"
            >
              Your Club Matches
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center max-w-lg text-black mb-8"
            >
              Based on your responses, here are the clubs that best match your interests and preferences.
            </motion.p>
            
            {clubMatches.length > 0 ? (
              <div className="w-full space-y-6">
                {clubMatches.map((match, index) => (
                  <motion.div 
                    key={`club-${match.club.name}-${index}`} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                    className={`p-6 border rounded-xl transition-all ${
                      (match.matchPercentage ?? 0) >= 95 ? 'border-green-200 bg-gradient-to-r from-green-50 to-teal-50' : 
                      (match.matchPercentage ?? 0) >= 80 ? 'border-blue-100 bg-gradient-to-r from-white to-blue-50' : 
                      (match.matchPercentage ?? 0) >= 65 ? 'border-gray-200 bg-gradient-to-r from-white to-gray-50' :
                      'border-amber-100 bg-gradient-to-r from-white to-amber-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-[#0A2540] mb-1">{match.club.name}</h3>
                        {match.categoryMatch && (
                          <span className="text-xs font-medium px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full">{match.categoryMatch}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                            (match.matchPercentage ?? 0) === 100 ? 'bg-gradient-to-r from-green-500 to-teal-500' :
                            (match.matchPercentage ?? 0) >= 90 ? 'bg-gradient-to-r from-blue-500 to-teal-500' :
                            (match.matchPercentage ?? 0) >= 75 ? 'bg-gradient-to-r from-[#3B82F6] to-[#38BFA1]' :
                            (match.matchPercentage ?? 0) >= 60 ? 'bg-gradient-to-r from-[#3B82F6] to-indigo-500' :
                            'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`}
                        >
                          {match.matchPercentage}%
                        </motion.div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 my-4">{match.club.description}</p>
                    
                    <div className="flex items-center mb-3">
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${match.confidenceScore ?? 50}%` }}
                          transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                          className={`h-full rounded-full ${
                            (match.confidenceScore ?? 0) >= 80 ? 'bg-gradient-to-r from-green-500 to-teal-500' :
                            (match.confidenceScore ?? 0) >= 50 ? 'bg-gradient-to-r from-[#3B82F6] to-[#38BFA1]' : 
                            (match.confidenceScore ?? 0) >= 30 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                            'bg-gradient-to-r from-red-400 to-red-500'
                          }`}
                        ></motion.div>
                      </div>
                      <span className="text-xs font-medium ml-3 min-w-[110px] text-black">
                        {(match.confidenceScore ?? 0) >= 80 ? 'Strong match' :
                         (match.confidenceScore ?? 0) >= 50 ? 'Good match' : 
                         (match.confidenceScore ?? 0) >= 30 ? 'Possible match' : 
                         'Weak match'}
                        {match.negativeAttributes.length > 0 ? ` (${match.negativeAttributes.length} conflicts)` : ''}
                      </span>
                    </div>
                    
                    {match.matchedAttributes.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="mt-4"
                      >
                        <p className="text-sm font-medium text-black mb-2">Matched Attributes:</p>
                        <div className="flex flex-wrap gap-2">
                          {match.matchedAttributes.map((attr, i) => (
                            <motion.span 
                              key={`attr-${attr}-${i}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.8 + index * 0.1 + i * 0.03 }}
                              className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-medium rounded-full"
                            >
                              {attr}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {match.negativeAttributes.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className="mt-4"
                      >
                        <p className="text-sm font-medium text-black mb-2">Incompatibilities:</p>
                        <div className="flex flex-wrap gap-2">
                          {match.negativeAttributes.map((attr, i) => (
                            <motion.span 
                              key={`neg-attr-${attr}-${i}`}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.9 + index * 0.1 + i * 0.03 }}
                              className="px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full"
                            >
                              {attr}
                            </motion.span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">
                          These attributes are incompatible with your preferences and reduced the match score.
                        </p>
                      </motion.div>
                    )}

                    {(match.matchPercentage ?? 0) < 100 && (match.matchPercentage ?? 0) >= 90 && match.negativeAttributes.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 + index * 0.1 }}
                        className="mt-3 text-xs text-green-600 italic"
                      >
                        This club is an excellent match! Answer more questions for a potential perfect match.
                      </motion.div>
                    )}

                    {(match.matchPercentage ?? 0) < 90 && (match.matchPercentage ?? 0) >= 75 && match.negativeAttributes.length === 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 + index * 0.1 }}
                        className="mt-3 text-xs text-blue-600 italic"
                      >
                        Good match based on your responses, but some key attributes might be missing.
                      </motion.div>
                    )}

                    {match.negativeAttributes.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 + index * 0.1 }}
                        className="mt-3 text-xs text-amber-600 italic"
                      >
                        Your preferences clash with some aspects of this club.
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center p-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl w-full border border-gray-200"
              >
                <p className="text-lg text-black mb-4">
                  We couldn&apos;t find strong matches based on your responses. Consider exploring a variety of clubs to discover what interests you!
                </p>
              </motion.div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-10 flex flex-col items-center"
            >
              <p className="text-black mb-6 text-center">
                Remember, this is just a starting point! Feel free to explore clubs outside your matches too.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetQuiz}
                className="px-8 py-4 bg-gradient-to-r from-[#3B82F6] to-[#38BFA1] text-white font-medium rounded-xl hover:shadow-xl transition-all"
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Take Quiz Again
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        ) : null
      ) : (
        // Intro screen
        <EnhancedIntro onStartQuiz={startQuiz} />
      )}
    </div>
  );
};

export default ClubQuiz;