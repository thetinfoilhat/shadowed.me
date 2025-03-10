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

// Define option type
type Option = {
  label: string;
  value: string;
  attributes: string[];
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
  attributes?: Record<number, string[]>; // For slider questions, map slider values to attributes
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
  matchPercentage?: number;
  negativeAttributes?: string[];
  confidenceScore?: number;
  categoryMatch?: string | null;
};

// Define clubs with detailed attributes
const clubs: Club[] = [
  {
    name: "Art Club",
    attributes: [
      "creative", "artistic", "visual arts", "drawing", "painting", "sculpture", 
      "self-expression", "design", "art exhibitions", "collaborative", "inclusive",
      "creative thinking", "color theory", "composition", "art history", "mixed media"
    ],
    description: "Art Club provides a creative space for students to explore various artistic mediums, develop their skills, and express themselves through visual arts."
  },
  {
    name: "ASL (American Sign Language) Club",
    attributes: [
      "language learning", "sign language", "deaf culture", "communication", "inclusive", 
      "accessibility", "cultural awareness", "visual learning", "expressive", "community service",
      "language skills", "diversity", "social awareness", "interpretation"
    ],
    description: "ASL Club offers students the opportunity to learn and practice American Sign Language, understand Deaf culture, and promote accessibility and inclusion."
  },
  {
    name: "Astronomy Club",
    attributes: [
      "science", "space", "stars", "planets", "telescopes", "night observation", 
      "physics", "research", "analytical", "curiosity", "exploration", "cosmos",
      "astrophysics", "celestial objects", "astronomy", "scientific method"
    ],
    description: "Astronomy Club explores the wonders of the universe through stargazing sessions, telescope observations, and discussions about cosmic phenomena."
  },
  {
    name: "Auto Club",
    attributes: [
      "mechanics", "cars", "engines", "technical", "hands-on", "engineering", 
      "problem-solving", "automotive", "maintenance", "design", "practical skills",
      "tools", "vehicle systems", "diagnostics", "teamwork", "technical knowledge"
    ],
    description: "Auto Club brings together students interested in automotive technology, mechanics, and car culture through hands-on projects and learning experiences."
  },
  {
    name: "Aviation Club",
    attributes: [
      "flying", "aircraft", "aeronautics", "engineering", "physics", "technical", 
      "navigation", "aerospace", "simulation", "aviation history", "flight principles",
      "aerodynamics", "pilot skills", "air traffic control", "aviation careers"
    ],
    description: "Aviation Club introduces students to the principles of flight, aircraft systems, and careers in aviation through interactive activities and learning experiences."
  },
  {
    name: "Bass Fishing Team",
    attributes: [
      "fishing", "outdoors", "nature", "competition", "patience", "environmental awareness", 
      "conservation", "teamwork", "strategy", "technique", "water ecosystems", "sportsmanship",
      "recreational", "wildlife", "natural resources", "seasonal activities"
    ],
    description: "Bass Fishing Team combines outdoor recreation with competitive fishing, developing skills while learning about aquatic ecosystems and conservation."
  },
  {
    name: "Bella Corda",
    attributes: [
      "music", "string instruments", "performance", "classical", "ensemble", "artistic", 
      "practice", "dedication", "harmony", "musical theory", "composition", "interpretation",
      "concerts", "musical technique", "collaboration", "orchestral"
    ],
    description: "Bella Corda is a select string ensemble that performs classical and contemporary music, refining instrumental skills through collaborative performances."
  },
  {
    name: "Best Buddies",
    attributes: [
      "inclusion", "friendship", "community service", "empathy", "social awareness", "volunteering", 
      "disability awareness", "leadership", "compassion", "social skills", "mentoring", "advocacy",
      "diversity", "acceptance", "relationship building", "social events"
    ],
    description: "Best Buddies creates opportunities for one-to-one friendships between students with and without intellectual and developmental disabilities."
  },
  {
    name: "Biochemistry Club",
    attributes: [
      "science", "chemistry", "biology", "research", "laboratory", "experiments", 
      "analytical", "problem-solving", "molecular biology", "scientific method", "data analysis",
      "healthcare applications", "enzymes", "cellular processes", "organic chemistry"
    ],
    description: "Biochemistry Club explores the intersection of biology and chemistry through laboratory experiments, research discussions, and scientific investigations."
  },
  {
    name: "BPA (Business Professionals of America)",
    attributes: [
      "business", "professional development", "leadership", "competition", "networking", "career preparation", 
      "public speaking", "entrepreneurship", "finance", "marketing", "management", "technology",
      "presentation skills", "teamwork", "problem-solving", "workplace skills"
    ],
    description: "BPA prepares students for careers in business and information technology through competitive events, leadership development, and professional growth programs."
  },
  {
    name: "BSLA (Black Student Leadership Assoc.)",
    attributes: [
      "leadership", "cultural awareness", "diversity", "community building", "advocacy", "empowerment", 
      "social justice", "mentoring", "identity", "inclusion", "history", "representation",
      "community service", "networking", "personal development", "cultural celebration"
    ],
    description: "BSLA empowers Black students through leadership development, cultural celebration, community service, and creating a supportive network for academic and personal success."
  },
  {
    name: "Caregiver Club",
    attributes: [
      "community service", "healthcare", "empathy", "support", "volunteering", "compassion", 
      "elder care", "family support", "mental health awareness", "resources", "self-care",
      "advocacy", "social awareness", "helping others", "wellness", "education"
    ],
    description: "Caregiver Club provides support, resources, and community for student caregivers while raising awareness about caregiving challenges and promoting self-care."
  },
  {
    name: "Ceramics Society",
    attributes: [
      "art", "pottery", "sculpture", "creative", "hands-on", "design", 
      "3D art", "clay work", "artistic expression", "craftsmanship", "glazing techniques",
      "kiln firing", "traditional techniques", "functional art", "decorative art"
    ],
    description: "Ceramics Society offers hands-on experience with clay, teaching pottery techniques, sculpture methods, and the artistic process from concept to finished ceramic pieces."
  },
  {
    name: "Cheerleading, Adaptive",
    attributes: [
      "inclusive", "adaptive sports", "teamwork", "performance", "school spirit", "physical activity", 
      "accessibility", "support", "coordination", "enthusiasm", "community building",
      "confidence building", "social inclusion", "modified techniques", "encouragement"
    ],
    description: "Adaptive Cheerleading creates an inclusive environment where students of all abilities can participate in cheerleading activities, building school spirit and community."
  },
  {
    name: "Chemistry Club",
    attributes: [
      "science", "chemistry", "experiments", "laboratory", "analytical", "research", 
      "problem-solving", "elements", "compounds", "reactions", "scientific method",
      "data analysis", "molecular structures", "chemical properties", "hands-on learning"
    ],
    description: "Chemistry Club engages students in hands-on experiments, demonstrations, and discussions about chemical principles and their real-world applications."
  },
  {
    name: "Chess Club & Team",
    attributes: [
      "strategy", "critical thinking", "competition", "problem-solving", "concentration", "patience", 
      "analytical skills", "planning", "decision making", "logic", "pattern recognition",
      "tournaments", "mental challenge", "tactical thinking", "game theory", "focus"
    ],
    description: "Chess Club & Team develops strategic thinking and analytical skills through chess practice, tournaments, and collaborative problem-solving of complex chess positions."
  },
  {
    name: "Children's Show",
    attributes: [
      "performance", "theater", "acting", "production", "creativity", "community service", 
      "storytelling", "entertainment", "children's literature", "directing", "set design",
      "costumes", "audience engagement", "character development", "family-friendly"
    ],
    description: "Children's Show produces theatrical performances designed for young audiences, combining creative storytelling, acting, and production to entertain and inspire children."
  },
  {
    name: "Chinese Yo-Yo Club",
    attributes: [
      "cultural", "performance", "skill development", "coordination", "Chinese culture", "artistic", 
      "dexterity", "balance", "traditional arts", "performance art", "hand-eye coordination",
      "rhythm", "precision", "cultural heritage", "demonstration", "physical activity"
    ],
    description: "Chinese Yo-Yo Club teaches the traditional art of Chinese yo-yo (diabolo), combining cultural learning with the development of coordination, performance, and artistic skills."
  },
  {
    name: "Civil Leaders of America (formerly JSA)",
    attributes: [
      "leadership", "civic engagement", "debate", "politics", "public speaking", "critical thinking", 
      "current events", "government", "policy analysis", "advocacy", "democratic principles",
      "constitutional knowledge", "civil discourse", "political awareness", "community involvement"
    ],
    description: "Civil Leaders of America engages students in civil discourse, debate, and democratic processes, developing leadership skills and knowledge of governmental systems."
  },
  {
    name: "Color Guard (Fall Flags)",
    attributes: [
      "performance", "dance", "visual arts", "coordination", "teamwork", "music", 
      "choreography", "precision", "expression", "marching", "flag technique",
      "rhythm", "performance art", "synchronization", "school spirit", "discipline"
    ],
    description: "Color Guard combines dance, flag technique, and visual performance to create artistic interpretations of music alongside the marching band during fall season."
  },
  {
    name: "Computer Science Club",
    attributes: [
      "coding", "programming", "technology", "software development", "problem-solving", "algorithms", 
      "computer languages", "web development", "app development", "technical skills", "logical thinking",
      "hackathons", "project-based", "innovation", "digital literacy", "computational thinking"
    ],
    description: "Computer Science Club explores programming languages, software development, and computational problem-solving through coding projects, hackathons, and tech discussions."
  },
  {
    name: "Costume Crew",
    attributes: [
      "theater", "design", "sewing", "creativity", "fashion", "production", 
      "costume history", "character development", "teamwork", "attention to detail", "craftsmanship",
      "backstage work", "visual storytelling", "technical theater", "collaborative", "hands-on"
    ],
    description: "Costume Crew designs and creates costumes for theatrical productions, developing skills in design, sewing, and visual storytelling while supporting performing arts."
  },
  {
    name: "Creative Writing Club",
    attributes: [
      "writing", "storytelling", "poetry", "fiction", "creative expression", "literary", 
      "imagination", "narrative", "editing", "publishing", "workshopping",
      "self-expression", "language arts", "composition", "literary techniques", "peer review"
    ],
    description: "Creative Writing Club nurtures literary expression through writing workshops, peer feedback sessions, and opportunities to explore various genres and publishing platforms."
  },
  {
    name: "Dawg Pound",
    attributes: [
      "school spirit", "sports", "community", "enthusiasm", "social", "events", 
      "cheering", "student section", "athletics support", "traditions", "camaraderie",
      "leadership", "school pride", "game attendance", "energy", "school unity"
    ],
    description: "Dawg Pound is the student spirit section that builds school pride and community through organized cheering, themed events, and enthusiastic support at athletic competitions."
  },
  {
    name: "Debate",
    attributes: [
      "public speaking", "argumentation", "research", "critical thinking", "competition", "persuasion", 
      "current events", "logic", "analysis", "policy", "communication skills",
      "tournaments", "rhetoric", "evidence-based reasoning", "quick thinking", "formal debate"
    ],
    description: "Debate develops public speaking, critical thinking, and persuasive argumentation through competitive debate tournaments, research, and structured argumentation practice."
  },
  {
    name: "DECA",
    attributes: [
      "business", "marketing", "entrepreneurship", "competition", "leadership", "professional development", 
      "case studies", "presentation skills", "career preparation", "networking", "finance",
      "management", "problem-solving", "business strategy", "industry knowledge", "conferences"
    ],
    description: "DECA prepares emerging leaders and entrepreneurs in marketing, finance, hospitality, and management through competitive events, conferences, and real-world business experiences."
  },
  {
    name: "Environmental Science Club",
    attributes: [
      "environment", "sustainability", "conservation", "science", "activism", "nature", 
      "ecology", "climate change", "recycling", "outdoor activities", "research",
      "community projects", "environmental awareness", "field studies", "green initiatives", "stewardship"
    ],
    description: "Environmental Science Club promotes ecological awareness through conservation projects, sustainability initiatives, and scientific exploration of environmental issues and solutions."
  },
  {
    name: "Esports Club",
    attributes: [
      "gaming", "competition", "technology", "teamwork", "strategy", "digital", 
      "video games", "tournaments", "technical skills", "coordination", "community",
      "communication", "problem-solving", "digital literacy", "competitive gaming", "entertainment"
    ],
    description: "Esports Club brings together gaming enthusiasts to develop teamwork, strategy, and technical skills through organized video game competitions and collaborative play."
  },
  {
    name: "Esports Competitive Teams",
    attributes: [
      "gaming", "competition", "technology", "teamwork", "strategy", "digital", 
      "video games", "tournaments", "technical skills", "coordination", "competitive",
      "communication", "problem-solving", "digital literacy", "high-level play", "team-based"
    ],
    description: "Esports Competitive Teams represent the school in organized video game competitions, developing high-level gaming skills, strategic teamwork, and competitive excellence."
  },
  {
    name: "Fall Play",
    attributes: [
      "theater", "acting", "performance", "drama", "production", "creative", 
      "stage", "character development", "public speaking", "teamwork", "memorization",
      "rehearsal", "theatrical arts", "storytelling", "stage presence", "production design"
    ],
    description: "Fall Play produces a theatrical production during the fall semester, offering opportunities in acting, stage management, and technical theater while developing performance skills."
  },
  {
    name: "FFA (Future Farmers of America)",
    attributes: [
      "agriculture", "leadership", "career development", "science", "hands-on", "community", 
      "farming", "animal science", "plant science", "agricultural business", "environmental",
      "technical skills", "competitions", "rural development", "sustainability", "practical skills"
    ],
    description: "FFA develops leadership, personal growth, and career success through agricultural education, hands-on projects, competitions, and community involvement in agricultural sciences."
  },
  {
    name: "Field Hockey",
    attributes: [
      "sports", "teamwork", "physical activity", "competition", "athletics", "outdoor", 
      "coordination", "strategy", "endurance", "skill development", "sportsmanship",
      "field sports", "stick skills", "team strategy", "conditioning", "competitive"
    ],
    description: "Field Hockey develops athletic skills, teamwork, and strategic thinking through competitive play, training, and tournaments in this fast-paced field sport."
  },
  {
    name: "Filipino Culture Club",
    attributes: [
      "cultural", "heritage", "diversity", "community", "international", "language", 
      "traditions", "celebrations", "food", "history", "arts",
      "cultural awareness", "identity", "inclusion", "global perspective", "cultural exchange"
    ],
    description: "Filipino Culture Club celebrates Filipino heritage through cultural events, traditional celebrations, language learning, and community building activities that share Filipino culture."
  },
  {
    name: "French Club",
    attributes: [
      "language learning", "cultural", "international", "French", "global", "communication", 
      "European culture", "francophone", "language skills", "cultural awareness", "traditions",
      "food", "travel", "history", "arts", "global perspective"
    ],
    description: "French Club explores French language and francophone cultures through conversation practice, cultural celebrations, film screenings, and activities that develop language skills and cultural understanding."
  },
  {
    name: "Fresh/Soph Wheel Dawgs",
    attributes: [
      "wheelchair sports", "adaptive athletics", "inclusion", "teamwork", "physical activity", "sports", 
      "wheelchair basketball", "adaptive recreation", "skill development", "competition", "sportsmanship",
      "coordination", "strength building", "accessibility", "community", "underclassmen"
    ],
    description: "Fresh/Soph Wheel Dawgs introduces freshmen and sophomores to wheelchair sports, promoting inclusive athletics, skill development, and teamwork through adaptive sports activities."
  },
  {
    name: "Frosh/Soph Play",
    attributes: [
      "theater", "acting", "performance", "underclassmen", "drama", "creative", 
      "stage experience", "character development", "public speaking", "teamwork", "entry-level",
      "theatrical arts", "storytelling", "stage presence", "beginner-friendly", "performance skills"
    ],
    description: "Frosh/Soph Play provides freshmen and sophomores with theatrical opportunities through a dedicated production that develops acting skills, stage presence, and theatrical knowledge."
  },
  {
    name: "GEMS (Girls in Engineering, Math & Science)",
    attributes: [
      "STEM", "women in STEM", "engineering", "mathematics", "science", "technology", 
      "gender equity", "career exploration", "mentorship", "problem-solving", "technical skills",
      "female empowerment", "hands-on learning", "innovation", "research", "collaboration"
    ],
    description: "GEMS encourages and supports female students in STEM fields through mentorship, hands-on projects, guest speakers, and exploration of career opportunities in engineering, math, and science."
  },
  {
    name: "German Club",
    attributes: [
      "language learning", "cultural", "international", "German", "global", "communication", 
      "European culture", "language skills", "cultural awareness", "traditions", "food",
      "travel", "history", "arts", "global perspective", "German-speaking countries"
    ],
    description: "German Club explores German language and culture through conversation practice, cultural celebrations, film screenings, and activities that develop language skills and cultural understanding."
  },
  {
    name: "Girl Up",
    attributes: [
      "gender equality", "advocacy", "leadership", "social justice", "global issues", "empowerment", 
      "women's rights", "community service", "activism", "awareness", "education",
      "global perspective", "female leadership", "social impact", "international", "United Nations"
    ],
    description: "Girl Up, an initiative of the United Nations Foundation, develops leadership skills while advocating for gender equality through awareness campaigns, fundraising, and community action projects."
  },
  {
    name: "Gourmet and Good Living Club",
    attributes: [
      "culinary arts", "cooking", "food culture", "nutrition", "wellness", "lifestyle", 
      "recipe development", "cultural cuisine", "food science", "hospitality", "health",
      "sustainable living", "meal planning", "social dining", "food appreciation", "life skills"
    ],
    description: "Gourmet and Good Living Club explores culinary arts, nutrition, and wellness through cooking demonstrations, recipe sharing, cultural food exploration, and discussions about healthy lifestyle choices."
  },
  {
    name: "GSA (Gender-Sexuality Alliance)",
    attributes: [
      "LGBTQ+", "inclusion", "advocacy", "support", "diversity", "social justice", 
      "community building", "awareness", "education", "acceptance", "identity",
      "allyship", "safe space", "equality", "gender issues", "self-expression"
    ],
    description: "GSA provides a safe, supportive environment for LGBTQ+ students and allies, promoting inclusion through education, advocacy, community building, and social events that celebrate diversity."
  },
  {
    name: "Health Occupations Students of America (HOSA)",
    attributes: [
      "healthcare", "medicine", "career preparation", "medical knowledge", "competition", "professional development", 
      "clinical skills", "health science", "leadership", "biology", "anatomy",
      "medical ethics", "patient care", "health education", "medical terminology", "healthcare industry"
    ],
    description: "HOSA prepares students for careers in healthcare through skill development, competitive events, leadership opportunities, and connections with health professionals and medical institutions."
  },
  {
    name: "Helping Hands Club",
    attributes: [
      "community service", "volunteering", "charity", "social impact", "empathy", "outreach", 
      "humanitarian", "giving back", "local community", "service projects", "fundraising",
      "social awareness", "helping others", "compassion", "community building", "philanthropy"
    ],
    description: "Helping Hands Club coordinates volunteer opportunities and service projects that address community needs, developing leadership, empathy, and social responsibility through hands-on community service."
  },
  {
    name: "Henna Club",
    attributes: [
      "art", "cultural", "creative", "design", "body art", "traditional", 
      "South Asian culture", "Middle Eastern culture", "artistic expression", "patterns", "cultural appreciation",
      "hand-drawn", "temporary art", "cultural heritage", "artistic technique", "decorative arts"
    ],
    description: "Henna Club explores the traditional art of henna design, teaching techniques, patterns, and cultural significance while creating beautiful temporary body art and celebrating cultural diversity."
  },
  {
    name: "Hockey",
    attributes: [
      "sports", "teamwork", "physical activity", "competition", "ice skating", "winter sports", 
      "athletics", "strategy", "coordination", "endurance", "sportsmanship",
      "stick handling", "team strategy", "physical fitness", "competitive", "speed"
    ],
    description: "Hockey develops athletic skills, teamwork, and strategic thinking through competitive play, training, and tournaments in this fast-paced ice sport requiring coordination and endurance."
  },
  {
    name: "Humane Huskies",
    attributes: [
      "animal welfare", "advocacy", "volunteering", "compassion", "community service", "education", 
      "animal rights", "environmental awareness", "fundraising", "shelter support", "pet adoption",
      "wildlife conservation", "ethical treatment", "awareness campaigns", "empathy", "activism"
    ],
    description: "Humane Huskies advocates for animal welfare through volunteer work with local shelters, educational campaigns about responsible pet ownership, and fundraising for animal protection organizations."
  },
  {
    name: "Huskie Book Club",
    attributes: [
      "reading", "literature", "discussion", "critical thinking", "analysis", "diverse perspectives", 
      "fiction", "non-fiction", "literary appreciation", "communication skills", "intellectual",
      "book recommendations", "author studies", "genre exploration", "reading comprehension", "social"
    ],
    description: "Huskie Book Club brings together students who enjoy reading to discuss diverse literature, share perspectives, develop critical thinking skills, and foster a love of reading through regular book discussions."
  },
  {
    name: "Huskie Crew",
    attributes: [
      "school spirit", "event planning", "leadership", "community building", "organization", "teamwork", 
      "school pride", "social", "event coordination", "promotion", "enthusiasm",
      "school culture", "student involvement", "communication", "collaboration", "school events"
    ],
    description: "Huskie Crew organizes and promotes school events, builds school spirit, and creates a positive school culture through student-led initiatives, event planning, and community building activities."
  },
  {
    name: "Improv Club",
    attributes: [
      "theater", "comedy", "performance", "creativity", "spontaneity", "public speaking", 
      "acting", "thinking on your feet", "teamwork", "confidence building", "entertainment",
      "stage presence", "humor", "storytelling", "character development", "audience interaction"
    ],
    description: "Improv Club develops performance skills, creativity, and quick thinking through improvisational theater games, comedy exercises, and performances that build confidence and stage presence."
  },
  {
    name: "Interact Club",
    attributes: [
      "community service", "leadership", "international", "volunteering", "social impact", "Rotary", 
      "global citizenship", "service projects", "fundraising", "humanitarian", "local community",
      "global awareness", "civic engagement", "teamwork", "project management", "social responsibility"
    ],
    description: "Interact Club, affiliated with Rotary International, develops leadership through community service, international awareness projects, and initiatives that address local and global challenges."
  },
  {
    name: "International Thespian Society",
    attributes: [
      "theater", "performance", "acting", "drama", "recognition", "arts", 
      "stage production", "theatrical excellence", "honor society", "performance arts", "dedication",
      "theatrical scholarship", "dramatic arts", "stage management", "theatrical community", "achievement"
    ],
    description: "International Thespian Society recognizes student achievement in theater arts, providing opportunities for theatrical growth, performance excellence, and connection to the broader theatrical community."
  },
  {
    name: "Investment Club",
    attributes: [
      "finance", "economics", "business", "stock market", "investing", "financial literacy", 
      "portfolio management", "market analysis", "wealth building", "entrepreneurship", "research",
      "risk assessment", "economic trends", "financial planning", "business strategy", "analytical thinking"
    ],
    description: "Investment Club teaches financial literacy and investment strategies through stock market simulations, portfolio management practice, market analysis, and discussions with finance professionals."
  },
  {
    name: "ISA (Indian Students Association)",
    attributes: [
      "cultural", "heritage", "diversity", "community", "Indian culture", "traditions", 
      "celebrations", "language", "food", "arts", "music",
      "dance", "festivals", "cultural awareness", "identity", "cultural exchange"
    ],
    description: "ISA celebrates Indian culture and heritage through traditional celebrations, cultural performances, language sharing, cuisine exploration, and community-building activities that promote cultural understanding."
  },
  {
    name: "Jazz Band",
    attributes: [
      "music", "performance", "jazz", "instrumental", "ensemble", "improvisation", 
      "musical technique", "rhythm", "harmony", "creativity", "collaboration",
      "musical theory", "performance skills", "musical expression", "concerts", "swing"
    ],
    description: "Jazz Band develops musical skills through the study and performance of jazz music, focusing on improvisation, ensemble playing, and the rich traditions of jazz across various styles and eras."
  },
  {
    name: "Junior Board",
    attributes: [
      "leadership", "class representation", "event planning", "student government", "organization", "teamwork", 
      "school spirit", "fundraising", "communication", "project management", "class unity",
      "student voice", "advocacy", "decision making", "community building", "junior class"
    ],
    description: "Junior Board represents the junior class in student government, organizing class events, fundraising for prom and senior year activities, and advocating for junior class interests in school decisions."
  },
  {
    name: "Korean Club",
    attributes: [
      "language learning", "cultural", "international", "Korean", "global", "communication", 
      "Asian culture", "K-pop", "Korean cuisine", "language skills", "cultural awareness",
      "traditions", "media", "history", "arts", "global perspective"
    ],
    description: "Korean Club explores Korean language and culture through conversation practice, K-pop and media discussions, traditional celebrations, cuisine exploration, and activities that develop cultural understanding."
  },
  {
    name: "LASA (Latin American Student Assn)",
    attributes: [
      "cultural", "heritage", "diversity", "community", "Latin American culture", "Spanish", 
      "traditions", "celebrations", "food", "music", "dance",
      "cultural awareness", "identity", "inclusion", "global perspective", "cultural exchange"
    ],
    description: "LASA celebrates Latin American cultures through traditional celebrations, language sharing, cuisine exploration, music and dance events, and community-building activities that promote cultural understanding."
  },
  {
    name: "Mandarin Club",
    attributes: [
      "language learning", "cultural", "international", "Chinese", "global", "communication", 
      "Asian culture", "Mandarin language", "Chinese traditions", "language skills", "cultural awareness",
      "calligraphy", "cuisine", "history", "arts", "global perspective"
    ],
    description: "Mandarin Club explores Chinese language and culture through conversation practice, calligraphy, traditional celebrations, cuisine exploration, and activities that develop language skills and cultural understanding."
  },
  {
    name: "Marching Band",
    attributes: [
      "music", "performance", "marching", "instrumental", "teamwork", "discipline", 
      "coordination", "rhythm", "outdoor performance", "musical technique", "precision",
      "school spirit", "competitions", "choreography", "dedication", "ensemble playing"
    ],
    description: "Marching Band combines musical performance with choreographed movement, performing at football games, parades, and competitions while developing musicianship, coordination, and teamwork."
  },
  {
    name: "Math Team",
    attributes: [
      "mathematics", "problem-solving", "competition", "analytical thinking", "logic", "academic", 
      "numerical reasoning", "mathematical theory", "critical thinking", "patterns", "equations",
      "mathematical contests", "collaborative problem-solving", "mental math", "mathematical concepts", "academic excellence"
    ],
    description: "Math Team challenges students with advanced mathematical problems, preparing for competitions through collaborative problem-solving, mathematical theory exploration, and development of analytical skills."
  },
  {
    name: "MENA Club",
    attributes: [
      "cultural", "Middle Eastern", "North African", "heritage", "diversity", "international", 
      "traditions", "language", "food", "history", "arts",
      "cultural awareness", "identity", "global perspective", "cultural exchange", "community building"
    ],
    description: "MENA Club celebrates Middle Eastern and North African cultures through traditional celebrations, language sharing, cuisine exploration, and community-building activities that promote cultural understanding."
  },
  {
    name: "Model UN",
    attributes: [
      "international relations", "diplomacy", "debate", "public speaking", "research", "global issues", 
      "negotiation", "policy analysis", "current events", "leadership", "critical thinking",
      "United Nations", "global citizenship", "political awareness", "conflict resolution", "international organizations"
    ],
    description: "Model UN simulates United Nations committees, developing research, public speaking, and diplomatic skills as students represent countries in debates on global issues and international relations."
  },
  {
    name: "MSA (Muslim Student Association)",
    attributes: [
      "cultural", "religious", "community", "Islamic traditions", "diversity", "support", 
      "spiritual growth", "education", "interfaith dialogue", "cultural awareness", "identity",
      "celebrations", "service", "inclusion", "heritage", "community building"
    ],
    description: "MSA provides a supportive community for Muslim students and those interested in Islamic culture, offering religious and cultural activities, educational events, and interfaith dialogue opportunities."
  },
  {
    name: "Musical Director",
    attributes: [
      "theater", "music", "leadership", "production", "directing", "performance", 
      "musical theater", "artistic vision", "collaboration", "conducting", "musical arrangement",
      "rehearsal management", "creative direction", "performance arts", "musical interpretation", "production planning"
    ],
    description: "Musical Director leads the musical aspects of theatrical productions, conducting the orchestra, coaching vocalists, arranging music, and collaborating with the director to create cohesive musical performances."
  },
  {
    name: "Musical Pit Director",
    attributes: [
      "music", "orchestra", "conducting", "theater", "leadership", "ensemble", 
      "musical accompaniment", "score reading", "musical theater", "collaboration", "instrumental direction",
      "performance coordination", "musical interpretation", "rehearsal management", "timing", "musical production"
    ],
    description: "Musical Pit Director conducts and coordinates the orchestra for musical theater productions, ensuring musical accompaniment aligns with stage performances through rehearsals and performance coordination."
  },
  {
    name: "New Generation Club",
    attributes: [
      "leadership", "innovation", "social change", "community service", "activism", "youth empowerment", 
      "future planning", "social awareness", "project development", "teamwork", "civic engagement",
      "problem-solving", "community impact", "social entrepreneurship", "mentorship", "collaboration"
    ],
    description: "New Generation Club empowers students to create positive social change through leadership development, community service projects, social entrepreneurship, and initiatives addressing contemporary issues."
  },
  {
    name: "NFHS (National French Honor Society)",
    attributes: [
      "French language", "academic excellence", "cultural", "honor society", "recognition", "international", 
      "language proficiency", "French culture", "scholarship", "achievement", "global perspective",
      "language learning", "francophone", "academic distinction", "cultural awareness", "language arts"
    ],
    description: "NFHS recognizes academic achievement in French language studies, promoting French culture, language excellence, and cultural understanding through service projects and cultural activities."
  },
  {
    name: "NHS (National Honor Society)",
    attributes: [
      "academic excellence", "leadership", "service", "character", "honor society", "recognition", 
      "scholarship", "achievement", "community service", "ethics", "academic distinction",
      "college preparation", "volunteer work", "personal development", "prestigious", "well-rounded"
    ],
    description: "NHS recognizes outstanding high school students who demonstrate excellence in scholarship, leadership, service, and character, providing opportunities for continued growth and community service."
  },
  {
    name: "NNHS Ambassadors",
    attributes: [
      "leadership", "school representation", "communication", "public speaking", "hospitality", "community building", 
      "school pride", "tour guides", "event hosting", "interpersonal skills", "school knowledge",
      "welcoming committee", "school culture", "student leadership", "positive representation", "mentoring"
    ],
    description: "NNHS Ambassadors represent the school to visitors, new students, and the community, providing tours, hosting events, and serving as the welcoming face of the school at various functions."
  },
  {
    name: "NNHS Medical Club (NNMC)",
    attributes: [
      "healthcare", "medicine", "science", "career exploration", "biology", "anatomy", 
      "medical knowledge", "health education", "professional development", "medical ethics", "research",
      "healthcare careers", "clinical exposure", "medical speakers", "health science", "pre-med"
    ],
    description: "NNHS Medical Club explores healthcare careers through guest speakers, medical facility tours, health education projects, and discussions about current medical issues and advancements."
  },
  {
    name: "North Star (Newspaper)",
    attributes: [
      "journalism", "writing", "reporting", "media", "communication", "current events", 
      "editing", "publishing", "interviewing", "photography", "layout design",
      "news literacy", "investigative skills", "deadline management", "media ethics", "storytelling"
    ],
    description: "North Star produces the school newspaper, developing journalistic skills through reporting, writing, editing, and publishing stories about school events, student achievements, and relevant issues."
  },
  {
    name: "Northern Lights (Winter Flags)",
    attributes: [
      "performance", "dance", "visual arts", "coordination", "teamwork", "winter season", 
      "choreography", "precision", "expression", "indoor performance", "flag technique",
      "rhythm", "performance art", "synchronization", "artistic interpretation", "discipline"
    ],
    description: "Northern Lights performs indoor color guard routines during winter season, combining dance, flag technique, and visual performance to create artistic interpretations of music in competitive events."
  },
  {
    name: "NSHS (National Spanish Honor Society)",
    attributes: [
      "Spanish language", "academic excellence", "cultural", "honor society", "recognition", "international", 
      "language proficiency", "Hispanic culture", "scholarship", "achievement", "global perspective",
      "language learning", "Spanish-speaking world", "academic distinction", "cultural awareness", "language arts"
    ],
    description: "NSHS recognizes academic achievement in Spanish language studies, promoting Hispanic culture, language excellence, and cultural understanding through service projects and cultural activities."
  },
  {
    name: "OASIS",
    attributes: [
      "support", "mental health", "wellness", "community", "self-care", "resources", 
      "peer support", "stress management", "emotional well-being", "mindfulness", "personal growth",
      "coping skills", "resilience building", "safe space", "health education", "balance"
    ],
    description: "OASIS provides a supportive environment focused on mental health and wellness, offering resources, peer support, stress management techniques, and activities promoting emotional well-being."
  },
  {
    name: "Orchesis",
    attributes: [
      "dance", "performance", "choreography", "artistic expression", "movement", "creativity", 
      "technique", "rhythm", "flexibility", "coordination", "stage presence",
      "modern dance", "jazz", "contemporary", "composition", "performance arts"
    ],
    description: "Orchesis is a dance company that develops technical and creative dance skills through choreography, rehearsals, and performances in various styles including modern, jazz, and contemporary dance."
  },
  {
    name: "Orchestra Council",
    attributes: [
      "music", "leadership", "orchestra", "event planning", "organization", "advocacy", 
      "classical music", "ensemble management", "fundraising", "musical community", "student voice",
      "performance coordination", "musical leadership", "program development", "instrumental music", "representation"
    ],
    description: "Orchestra Council provides leadership for the orchestra program, organizing events, advocating for orchestral music, planning performances, and representing orchestra students in school decisions."
  },
  {
    name: "Pep Band",
    attributes: [
      "music", "performance", "school spirit", "sports events", "instrumental", "energy", 
      "entertainment", "rhythm", "teamwork", "musical technique", "enthusiasm",
      "crowd engagement", "game day atmosphere", "musical repertoire", "school pride", "live performance"
    ],
    description: "Pep Band performs energetic music at sporting events and pep rallies, building school spirit through lively instrumental performances that enhance the game day atmosphere."
  },
  {
    name: "Photography Club",
    attributes: [
      "visual arts", "photography", "creative expression", "composition", "technical skills", "artistic", 
      "digital media", "camera techniques", "visual storytelling", "editing", "portfolio development",
      "photo shoots", "visual literacy", "artistic vision", "digital editing", "exhibition"
    ],
    description: "Photography Club develops camera skills, composition techniques, and artistic vision through photo shoots, editing workshops, portfolio development, and photography exhibitions."
  },
  {
    name: "Pickleball Club",
    attributes: [
      "sports", "physical activity", "racket sports", "teamwork", "coordination", "recreation", 
      "strategy", "hand-eye coordination", "social", "competitive", "fitness",
      "agility", "reflexes", "game skills", "sportsmanship", "active lifestyle"
    ],
    description: "Pickleball Club introduces students to this popular paddle sport, developing coordination, strategy, and fitness through regular play, friendly competitions, and skill development."
  },
  {
    name: "Project Positivity NNHS",
    attributes: [
      "mental health", "wellness", "positivity", "community building", "support", "awareness", 
      "kindness initiatives", "stress reduction", "school culture", "emotional well-being", "mindfulness",
      "anti-bullying", "inclusion", "self-care", "encouragement", "social-emotional learning"
    ],
    description: "Project Positivity promotes mental wellness and positive school culture through kindness initiatives, stress reduction activities, and awareness campaigns that foster a supportive community."
  },
  {
    name: "Red Cross Club",
    attributes: [
      "community service", "humanitarian", "health", "disaster preparedness", "first aid", "volunteering", 
      "blood drives", "emergency response", "public health", "service learning", "global issues",
      "safety education", "fundraising", "community outreach", "leadership", "social impact"
    ],
    description: "Red Cross Club supports humanitarian efforts through blood drives, disaster preparedness education, first aid training, and fundraising for local and international Red Cross initiatives."
  },
  {
    name: "Red Ribbon Club",
    attributes: [
      "drug prevention", "health awareness", "peer education", "community service", "advocacy", "wellness", 
      "substance abuse prevention", "health education", "leadership", "awareness campaigns", "positive choices",
      "peer influence", "community outreach", "health promotion", "social responsibility", "education"
    ],
    description: "Red Ribbon Club promotes drug prevention and healthy lifestyle choices through peer education, awareness campaigns, and community outreach focused on substance abuse prevention."
  },
  {
    name: "Robotics Team (FIRST Robotics)",
    attributes: [
      "engineering", "technology", "robotics", "programming", "design", "competition", 
      "problem-solving", "teamwork", "STEM", "mechanical skills", "electrical engineering",
      "computer science", "innovation", "project management", "technical writing", "hands-on"
    ],
    description: "Robotics Team designs, builds, and programs robots for FIRST Robotics competitions, developing engineering skills, teamwork, and problem-solving through hands-on technical challenges."
  },
  {
    name: "Rocketry Club",
    attributes: [
      "aerospace", "engineering", "physics", "design", "hands-on", "STEM", 
      "rocket building", "aerodynamics", "technical skills", "scientific method", "competition",
      "flight principles", "data analysis", "safety protocols", "project-based", "technical design"
    ],
    description: "Rocketry Club designs, builds, and launches model rockets, exploring principles of physics, engineering, and aerodynamics through hands-on projects and competitive launches."
  },
  {
    name: "Scholastic Bowl",
    attributes: [
      "academic competition", "knowledge", "quick recall", "trivia", "teamwork", "intellectual", 
      "general knowledge", "academic subjects", "critical thinking", "fast-paced", "quiz bowl",
      "academic excellence", "interdisciplinary", "competitive academics", "mental agility", "scholarly"
    ],
    description: "Scholastic Bowl competes in academic quiz competitions covering a wide range of subjects, developing quick recall, broad knowledge base, and teamwork through practice and tournaments."
  },
  {
    name: "Science Bowl",
    attributes: [
      "science", "academic competition", "STEM", "knowledge", "quick recall", "teamwork", 
      "scientific concepts", "physics", "chemistry", "biology", "earth science",
      "mathematics", "competitive academics", "scientific literacy", "problem-solving", "academic excellence"
    ],
    description: "Science Bowl competes in fast-paced science and math competitions, developing in-depth knowledge of scientific concepts, quick thinking, and teamwork through practice and tournaments."
  },
  {
    name: "Science Olympiad",
    attributes: [
      "science", "competition", "STEM", "hands-on", "teamwork", "research", 
      "engineering", "laboratory skills", "scientific method", "problem-solving", "technical design",
      "biology", "chemistry", "physics", "earth science", "interdisciplinary"
    ],
    description: "Science Olympiad prepares for competitions in various scientific disciplines, developing laboratory skills, research abilities, and collaborative problem-solving through hands-on science and engineering challenges."
  },
  {
    name: "Senior Board - Class of 2025",
    attributes: [
      "leadership", "class representation", "event planning", "senior activities", "organization", "teamwork", 
      "school spirit", "fundraising", "graduation planning", "class unity", "student voice",
      "senior traditions", "legacy projects", "communication", "project management", "senior class"
    ],
    description: "Senior Board represents the senior class, organizing graduation activities, senior traditions, fundraising events, and creating memorable experiences for the Class of 2025."
  },
  {
    name: "Seva Circle",
    attributes: [
      "community service", "volunteering", "cultural", "South Asian", "charity", "leadership", 
      "humanitarian", "giving back", "cultural awareness", "service projects", "fundraising",
      "social impact", "compassion", "outreach", "cultural heritage", "selfless service"
    ],
    description: "Seva Circle organizes service projects based on the South Asian concept of selfless service, combining cultural awareness with community outreach, volunteering, and humanitarian initiatives."
  },
  {
    name: "Show Choir",
    attributes: [
      "music", "vocal performance", "dance", "choreography", "performance", "ensemble", 
      "singing", "stage presence", "musical theater", "competition", "harmony",
      "showmanship", "vocal technique", "performance skills", "musical expression", "entertainment"
    ],
    description: "Show Choir combines vocal music with choreographed movement, performing popular and show tunes in competitive and showcase events while developing vocal technique and performance skills."
  },
  {
    name: "Ski & Snowboard Club",
    attributes: [
      "winter sports", "outdoor recreation", "skiing", "snowboarding", "physical activity", "social", 
      "mountain sports", "adventure", "snow sports", "seasonal", "skill development",
      "outdoor skills", "winter recreation", "active lifestyle", "nature appreciation", "trips"
    ],
    description: "Ski & Snowboard Club organizes trips to ski resorts, developing winter sports skills, outdoor appreciation, and social connections through recreational skiing and snowboarding activities."
  },
  {
    name: "Spanish Club",
    attributes: [
      "language learning", "cultural", "international", "Spanish", "global", "communication", 
      "Hispanic culture", "language skills", "cultural awareness", "traditions", "food",
      "travel", "history", "arts", "global perspective", "Spanish-speaking countries"
    ],
    description: "Spanish Club explores Spanish language and Hispanic cultures through conversation practice, cultural celebrations, film screenings, and activities that develop language skills and cultural understanding."
  },
  {
    name: "Spectrum",
    attributes: [
      "diversity", "inclusion", "cultural awareness", "social justice", "community building", "education", 
      "multicultural", "identity", "global perspective", "cross-cultural", "dialogue",
      "heritage celebration", "equity", "cultural exchange", "awareness", "acceptance"
    ],
    description: "Spectrum promotes cultural diversity and inclusion through multicultural events, educational workshops, dialogue sessions, and celebrations that foster understanding and appreciation of different identities."
  },
  {
    name: "Speech Team (Forensics)",
    attributes: [
      "public speaking", "performance", "competition", "communication skills", "debate", "oratory", 
      "interpretation", "persuasion", "critical thinking", "presentation", "rhetoric",
      "literary analysis", "confidence building", "articulation", "competitive speaking", "research"
    ],
    description: "Speech Team competes in various public speaking and performance events, developing communication skills, confidence, and critical thinking through competitive forensics tournaments."
  },
  {
    name: "Spring Play",
    attributes: [
      "theater", "acting", "performance", "drama", "production", "creative", 
      "stage", "character development", "public speaking", "teamwork", "memorization",
      "rehearsal", "theatrical arts", "storytelling", "stage presence", "spring season"
    ],
    description: "Spring Play produces a theatrical production during the spring semester, offering opportunities in acting, stage management, and technical theater while developing performance skills."
  },
  {
    name: "Statistics & Card Game Club",
    attributes: [
      "mathematics", "games", "strategy", "probability", "analytical thinking", "social", 
      "card games", "data analysis", "logical reasoning", "recreational math", "game theory",
      "statistical concepts", "pattern recognition", "decision making", "mathematical applications", "recreational"
    ],
    description: "Statistics & Card Game Club explores mathematical concepts through card games, developing statistical thinking, probability understanding, and strategic skills in a social, game-based environment."
  },
  {
    name: "Student Government, Head",
    attributes: [
      "leadership", "student representation", "school policy", "event planning", "advocacy", "organization", 
      "student voice", "decision making", "communication", "project management", "school improvement",
      "civic engagement", "public speaking", "collaboration", "school culture", "governance"
    ],
    description: "Student Government represents the student body in school decisions, organizes school-wide events, advocates for student interests, and develops leadership through democratic processes and community building."
  },
  {
    name: "Table Tennis Team & Club",
    attributes: [
      "sports", "table tennis", "hand-eye coordination", "reflexes", "strategy", "competition", 
      "precision", "focus", "individual sport", "teamwork", "technique",
      "agility", "mental sharpness", "game skills", "recreational", "competitive"
    ],
    description: "Table Tennis Team & Club develops skills in this fast-paced sport through regular practice, technique development, competitive play, and tournaments that build coordination and strategic thinking."
  },
  {
    name: "Table Top Game Club",
    attributes: [
      "games", "strategy", "social", "board games", "card games", "role-playing games", 
      "problem-solving", "critical thinking", "creativity", "competition", "collaboration",
      "game design", "logical reasoning", "storytelling", "recreational", "community building"
    ],
    description: "Table Top Game Club brings together students interested in board games, card games, and role-playing games, developing strategic thinking, social skills, and creativity through regular gaming sessions."
  },
  {
    name: "Tech Crew",
    attributes: [
      "theater", "technical production", "lighting", "sound", "backstage", "production", 
      "stage management", "technical skills", "design", "teamwork", "problem-solving",
      "equipment operation", "theatrical technology", "production support", "hands-on", "technical theater"
    ],
    description: "Tech Crew manages the technical aspects of theatrical productions, developing skills in lighting, sound, stage management, and production design while supporting performances behind the scenes."
  },
  {
    name: "Theatre Club",
    attributes: [
      "theater", "acting", "performance", "drama", "creative expression", "stage", 
      "character development", "public speaking", "theatrical arts", "production", "collaboration",
      "improvisation", "script analysis", "stage presence", "performance skills", "storytelling"
    ],
    description: "Theatre Club explores various aspects of theatrical arts through workshops, performances, theater games, and production involvement, developing acting skills and theatrical knowledge."
  },
  {
    name: "Top Dawgs",
    attributes: [
      "leadership", "mentoring", "peer support", "school culture", "role models", "community building", 
      "student leadership", "guidance", "new student support", "school pride", "positive influence",
      "orientation", "school transition", "interpersonal skills", "communication", "responsibility"
    ],
    description: "Top Dawgs provides peer mentoring and leadership for new and underclassmen students, creating a positive school culture through orientation activities, ongoing support, and community building."
  },
  {
    name: "Tutors for the Future",
    attributes: [
      "tutoring", "academic support", "teaching", "mentoring", "community service", "education", 
      "subject expertise", "helping others", "leadership", "communication skills", "patience",
      "educational outreach", "knowledge sharing", "academic excellence", "service learning", "peer education"
    ],
    description: "Tutors for the Future provides academic support to fellow students and community members, developing teaching skills, subject mastery, and leadership through peer tutoring and educational outreach."
  },
  {
    name: "Ultimate Frisbee Club",
    attributes: [
      "sports", "teamwork", "physical activity", "outdoor recreation", "strategy", "competition", 
      "disc sports", "athleticism", "coordination", "sportsmanship", "endurance",
      "field sports", "active lifestyle", "game skills", "recreational", "self-officiated"
    ],
    description: "Ultimate Frisbee Club develops athletic skills, teamwork, and sportsmanship through this self-officiated team sport that combines elements of football, soccer, and basketball with a flying disc."
  },
  {
    name: "UNICEF Club",
    attributes: [
      "global issues", "humanitarian", "children's rights", "advocacy", "fundraising", "international", 
      "social impact", "awareness campaigns", "global citizenship", "service", "education",
      "United Nations", "community outreach", "global health", "human rights", "social justice"
    ],
    description: "UNICEF Club raises awareness and funds for children's rights worldwide, developing global citizenship through advocacy campaigns, fundraising events, and educational initiatives about international issues."
  },
  {
    name: "Veterans Club",
    attributes: [
      "military appreciation", "patriotism", "community service", "history", "civic engagement", "support", 
      "veterans affairs", "remembrance", "service projects", "awareness", "recognition",
      "military history", "national service", "community outreach", "appreciation events", "civic duty"
    ],
    description: "Veterans Club honors military service through veteran appreciation events, service projects supporting veterans, and educational initiatives about military history and service."
  },
  {
    name: "Vertigo (Literary Magazine)",
    attributes: [
      "creative writing", "literature", "publishing", "editing", "artistic expression", "poetry", 
      "fiction", "literary arts", "design", "creative collaboration", "publication",
      "editorial skills", "literary analysis", "visual arts", "student writing", "creative showcase"
    ],
    description: "Vertigo publishes student creative writing and artwork in a literary magazine, developing skills in writing, editing, design, and publication while showcasing student creative expression."
  },
  {
    name: "Yearbook",
    attributes: [
      "journalism", "photography", "design", "publishing", "documentation", "layout", 
      "writing", "editing", "visual storytelling", "school history", "collaboration",
      "deadline management", "interviewing", "graphic design", "memory preservation", "publication"
    ],
    description: "Yearbook documents the school year through photography, writing, and design, creating a permanent record of school events, student life, and achievements in a professionally published book."
  },
  {
    name: "Yoga Club",
    attributes: [
      "wellness", "physical activity", "mindfulness", "flexibility", "stress reduction", "balance", 
      "meditation", "mental health", "fitness", "self-care", "breathing techniques",
      "relaxation", "mind-body connection", "strength building", "holistic health", "centering"
    ],
    description: "Yoga Club practices physical postures, breathing techniques, and mindfulness, promoting physical and mental wellness through regular yoga sessions focused on flexibility, strength, and stress reduction."
  },
  {
    name: "Youth and Government",
    attributes: [
      "government", "politics", "civic engagement", "leadership", "public policy", "debate", 
      "mock government", "legislation", "public speaking", "current events", "democracy",
      "political process", "bill writing", "parliamentary procedure", "advocacy", "citizenship"
    ],
    description: "Youth and Government simulates state government processes, developing civic knowledge, leadership, and policy skills through mock legislative sessions, court proceedings, and political debate."
  }
];

// Sample questions
const questions: Question[] = [
  // 🔹 General Interest & Personality
  {
    id: 1,
    text: "Do you enjoy solving mysteries or puzzles?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["problem-solving", "analytical", "strategy", "logic"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 2,
    text: "How much do you enjoy working with your hands?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "Very much",
    attributes: {
      1: [],
      2: ["casual interest"],
      3: ["hands-on", "craftsmanship"],
      4: ["hands-on", "technical", "design"],
      5: ["hands-on", "technical", "creative", "engineering"]
    }
  },
  {
    id: 3,
    text: "Do you prefer structured rules or open-ended creativity?",
    type: "multiple-choice",
    options: [
      { label: "Structured", value: "structured", attributes: ["structured", "logical", "rules", "organization"] },
      { label: "Open-ended", value: "open-ended", attributes: ["creative", "innovation", "self-expression"] },
      { label: "Both", value: "both", attributes: ["adaptable", "versatile"] }
    ]
  },
  // 🔹 Academic Interests
  {
    id: 4,
    text: "What subjects do you enjoy the most?",
    type: "multiple-choice",
    options: [
      { label: "Science", value: "science", attributes: ["science", "research", "experiments", "analytical"] },
      { label: "Math", value: "math", attributes: ["math", "logical thinking", "numbers"] },
      { label: "Literature", value: "literature", attributes: ["writing", "reading", "storytelling", "analysis"] },
      { label: "Social Studies", value: "social-studies", attributes: ["policy analysis", "global issues", "debate"] },
      { label: "Arts", value: "arts", attributes: ["artistic", "design", "self-expression"] }
    ]
  },
  {
    id: 5,
    text: "Do you enjoy conducting science experiments or working in a lab?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["science", "experiments", "laboratory", "hands-on"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 6,
    text: "Are you interested in leading or mentoring others?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["leadership", "mentoring", "community service"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 7,
    text: "How important is teamwork to you?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not important",
    maxLabel: "Very important",
    attributes: {
      1: ["independent", "self-directed"],
      2: ["casual teamwork"],
      3: ["collaboration"],
      4: ["teamwork", "group projects"],
      5: ["team leadership", "coaching", "mentoring"]
    }
  },
  {
    id: 8,
    text: "Would you be interested in planning school-wide events or fundraisers?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["event planning", "fundraising", "organization", "networking"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  // 🔹 Business & Financial Literacy
  {
    id: 9,
    text: "Would you like to learn about investing, stocks, or business strategy?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["finance", "investing", "economics", "business", "wealth management"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 10,
    text: "Do you enjoy problem-solving through real-world business case studies?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["business", "entrepreneurship", "strategy", "problem-solving"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  // 🔹 STEM & Technology
  {
    id: 11,
    text: "Would you be interested in learning how to code or build software?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["coding", "technology", "software development", "engineering"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 12,
    text: "How much do you enjoy working with robotics or AI?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "Very much",
    attributes: {
      1: [],
      2: ["casual interest"],
      3: ["robotics", "engineering"],
      4: ["robotics", "engineering", "automation"],
      5: ["robotics", "engineering", "AI", "cutting-edge technology"]
    }
  },
  // 🔹 Creative & Performing Arts
  {
    id: 13,
    text: "Do you enjoy creating art in any form (painting, sculpting, digital design)?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["art", "creative", "visual arts", "design"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 14,
    text: "What type of performance interests you most?",
    type: "multiple-choice",
    options: [
      { label: "Acting", value: "acting", attributes: ["acting", "theater", "performance", "drama"] },
      { label: "Singing", value: "singing", attributes: ["music", "singing", "choir"] },
      { label: "Dance", value: "dance", attributes: ["dance", "choreography", "movement"] },
      { label: "Instrumental Music", value: "instrumental", attributes: ["music", "instrumental", "ensemble"] },
      { label: "None", value: "none", attributes: [] }
    ]
  },
  {
    id: 15,
    text: "Would you enjoy designing costumes, makeup, or set pieces for theater?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["design", "theater", "costume", "production"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  // 🔹 Sports & Outdoor Activities
  {
    id: 16,
    text: "Do you enjoy being active or playing sports?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["sports", "athletics", "physical activity", "teamwork"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  // 🔹 Community & Global Awareness
  {
    id: 17,
    text: "Would you like to volunteer and give back to the community?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["community service", "social impact", "philanthropy"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 18,
    text: "Do you enjoy learning about different cultures and global affairs?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["cultural awareness", "international relations", "global perspective"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 19,
    text: "Do you prefer high-energy environments or relaxed activities?",
    type: "multiple-choice",
    options: [
      { label: "High-Energy", value: "high-energy", attributes: ["competitive", "high-intensity", "fast-paced"] },
      { label: "Relaxed", value: "relaxed", attributes: ["calm", "mindfulness", "meditative"] },
      { label: "Both", value: "both", attributes: ["adaptable", "versatile"] }
    ]
  },
  {
    id: 20,
    text: "Would you be interested in a club that focuses on mental health and well-being?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["mental health", "wellness", "self-care", "stress management"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 21,
    text: "Do you enjoy photography, filmmaking, or digital media creation?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["photography", "digital media", "visual storytelling", "film production"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 22,
    text: "Do you enjoy building things, whether it's with Legos, wood, or mechanical parts?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["hands-on", "engineering", "design", "mechanics", "problem-solving"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 23,
    text: "Would you be interested in participating in a math or science competition?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["math", "science", "competitions", "problem-solving", "critical thinking"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 24,
    text: "Are you interested in public policy, debating, or learning how government works?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["government", "debate", "politics", "civic engagement", "public speaking"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 25,
    text: "Do you enjoy outdoor activities like hiking, fishing, or exploring nature?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["outdoors", "nature", "conservation", "recreation", "environmental awareness"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  
];

const ClubQuiz: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [clubMatches, setClubMatches] = useState<ClubMatch[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [skipsRemaining, setSkipsRemaining] = useState(20); // Allow 20 skips
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
        // Use functional update to ensure we're working with the latest state
        setCurrentQuestionIndex(prevIndex => {
          if (prevIndex === null || prevIndex <= 0) return 0;
          return prevIndex - 1;
        });
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
      setSkipsRemaining(20);
      setShowResults(false);
    } catch (error) {
      console.error("Error starting quiz:", error);
      // Attempt recovery
      setIsStarted(true);
      setCurrentQuestionIndex(0);
    }
  };

  // Calculate matches based on user responses
  const calculateMatches = () => {
    try {
      // Define question weights (higher number = more important)
      const questionWeights: Record<number, number> = {
        1: 1.2,  // Public speaking
        2: 1.5,  // Team vs independent
        3: 1.3,  // Competitiveness
        4: 2.0,  // Subject preferences (high weight as it's a key indicator)
        5: 1.4,  // Problem solving
        6: 1.6,  // Business interest
        7: 1.5,  // Technology interest
        8: 1.4,  // STEM competitions
        9: 1.3,  // Writing interest
        10: 1.7, // Performing arts
        11: 1.5, // Global issues
        12: 1.6, // Volunteering
        13: 1.3, // Event planning
        14: 1.6, // Hands-on activities
        15: 1.5, // Photography/visual arts
        16: 1.5, // Newspaper/yearbook
        17: 1.3, // Strategic thinking
        18: 1.5, // Creative expression
        19: 1.6, // Structured vs creative
        20: 1.4, // Language learning
        21: 1.5, // Advocacy for diversity
        22: 1.6, // Robotics/coding
        23: 1.5  // Medical/health
      };

      // Define category mappings (for better organization in results)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const categoryMapping: Record<string, string[]> = {
        "Arts": ["art", "creative", "design", "music", "theater", "dance", "film", "photography", "writing", "poetry"],
        "Language & Culture": ["language", "culture", "international", "global", "diversity", "heritage", "ethnic", "multicultural"],
        "STEM": ["science", "technology", "engineering", "math", "coding", "robotics", "research", "academic", "medicine", "health"],
        "Business & Entrepreneurship": ["business", "entrepreneurship", "finance", "economics", "marketing", "leadership", "management"],
        "Social Impact": ["volunteer", "service", "community", "activism", "advocacy", "social justice", "environment", "sustainability"],
        "Sports & Recreation": ["sports", "athletics", "fitness", "outdoor", "recreation", "games", "competition"]
      };

      // Define attribute weights (higher = more important for matching)
      const attributeWeights: Record<string, number> = {
        // Core interests and skills (highest weight)
        "coding": 2.0,
        "science": 1.8,
        "math": 1.8,
        "engineering": 1.8,
        "writing": 1.8,
        "acting": 1.8,
        "singing": 1.8,
        "dancing": 1.8,
        "language": 1.8,
        "business": 1.8,
        "finance": 1.8,
        "volunteering": 1.8,
        "photography": 1.8,
        "design": 1.8,
        "pottery": 1.8,
        "painting": 1.8,
        "drawing": 1.8,
        
        // Secondary attributes (medium weight)
        "teamwork": 1.5,
        "leadership": 1.5,
        "problem-solving": 1.5,
        "critical thinking": 1.5,
        "creativity": 1.5,
        "performance": 1.5,
        "public speaking": 1.5,
        "debate": 1.5,
        "research": 1.5,
        "competition": 1.5,
        "cultural awareness": 1.5,
        "global awareness": 1.5,
        "advocacy": 1.5,
        
        // Tertiary attributes (lower weight)
        "collaboration": 1.2,
        "communication": 1.2,
        "innovation": 1.2,
        "strategy": 1.2,
        "analytical": 1.2,
        "organization": 1.2,
        "discipline": 1.2
      };

      // Define club categories for better grouping
      const clubCategories: Record<string, string[]> = {
        "Art": ["Art Club", "Ceramics Society", "Photography Club", "Henna Club"],
        "Language & Culture": ["ASL (American Sign Language & Culture) Club", "French Club", "Spanish Club", "German Club", "Korean Club"],
        "STEM": ["Astronomy Club", "Biochemistry Club", "Computer Science Club", "Math Team", "Robotics Team (FIRST Robotics)", "Science Olympiad"],
        "Performing Arts": ["Drama Club", "Marching Band", "Show Choir", "Orchesis"],
        "Business": ["DECA", "BPA (Business Professionals of America)", "Investment Club"],
        "Community Service": ["Girl Up", "Interact Club", "UNICEF Club"],
        "Academic & Humanities": ["Debate", "Model UN", "Huskie Book Club"],
        "Competitive": ["Chess Club & Team", "Esports Club", "Debate", "Math Team", "DECA", "BPA (Business Professionals of America)", "Robotics Team (FIRST Robotics)", "Science Olympiad"],
        "Creative": ["Art Club", "Ceramics Society", "Photography Club", "Henna Club", "Drama Club", "Show Choir", "Orchesis", "Yearbook"],
        "Advocacy": ["Girl Up", "UNICEF Club", "Model UN"],
        "Medical": ["Biochemistry Club"]
      };

      // Define required attributes for perfect matches (clubs must have these to get 90%+ scores)
      const clubRequiredAttributes: Record<string, string[]> = {
        "Art Club": ["creativity", "artistic"],
        "Ceramics Society": ["pottery", "hands-on"],
        "Photography Club": ["photography", "visual storytelling"],
        "Henna Club": ["art", "cultural awareness"],
        "ASL (American Sign Language & Culture) Club": ["language", "cultural awareness"],
        "French Club": ["language", "cultural awareness"],
        "Spanish Club": ["language", "cultural awareness"],
        "German Club": ["language", "cultural awareness"],
        "Korean Club": ["language", "cultural awareness"],
        "Astronomy Club": ["space", "science"],
        "Biochemistry Club": ["science", "experiments"],
        "Computer Science Club": ["coding", "technology"],
        "Math Team": ["math", "competitive"],
        "Robotics Team (FIRST Robotics)": ["engineering", "technology"],
        "Science Olympiad": ["science", "competitive"],
        "Drama Club": ["acting", "performance"],
        "Marching Band": ["music", "performance"],
        "Show Choir": ["singing", "performance"],
        "Orchesis": ["dance", "performance"],
        "DECA": ["business", "competitive"],
        "BPA (Business Professionals of America)": ["business", "leadership"],
        "Investment Club": ["finance", "business"],
        "Girl Up": ["advocacy", "leadership"],
        "Interact Club": ["volunteering", "community service"],
        "UNICEF Club": ["volunteering", "global awareness"],
        "Debate": ["debate", "public speaking"],
        "Model UN": ["global issues", "debate"],
        "Huskie Book Club": ["reading", "literature"],
        "Chess Club & Team": ["strategy", "critical thinking"],
        "Esports Club": ["gaming", "competitive"],
        "Yearbook": ["photography", "design"]
      };

      // Create a map to track attribute matches for each club
      const clubMatches = new Map<Club, { 
        matchedAttributes: string[], 
        negativeAttributes: string[],
        matchScore: number,
        weightedScore: number,
        totalPossibleScore: number,
        categoryMatch: string | null,
        confidenceScore: number,
        attributeMatchStrength: number,
        userPreferredAttributes: string[],
        requiredAttributesMatched: number,
        totalRequiredAttributes: number,
        diminishingReturnsApplied: boolean
      }>();

      // Initialize club matches
      clubs.forEach(club => {
        // Find which categories this club belongs to
        const categories: string[] = [];
        for (const [cat, clubNames] of Object.entries(clubCategories)) {
          if (clubNames.includes(club.name)) {
            categories.push(cat);
          }
        }

        // Get required attributes for this club
        const requiredAttributes = clubRequiredAttributes[club.name] || [];

        clubMatches.set(club, { 
          matchedAttributes: [], 
          negativeAttributes: [],
          matchScore: 0,
          weightedScore: 0,
          totalPossibleScore: 0, // Will be calculated based on weighted attributes
          categoryMatch: categories.length > 0 ? categories[0] : null,
          confidenceScore: 0,
          attributeMatchStrength: 0,
          userPreferredAttributes: [],
          requiredAttributesMatched: 0,
          totalRequiredAttributes: requiredAttributes.length,
          diminishingReturnsApplied: false
        });
      });

      // Track user's preferred categories based on answers
      const categoryScores: Record<string, number> = {
        "Art": 0,
        "Language & Culture": 0,
        "STEM": 0,
        "Performing Arts": 0,
        "Business": 0,
        "Community Service": 0,
        "Academic & Humanities": 0,
        "Competitive": 0,
        "Creative": 0,
        "Advocacy": 0,
        "Medical": 0
      };

      // Collect all user's preferred attributes
      const userAttributes: string[] = [];
      const userNegativeAttributes: string[] = [];
      
      // Process each user response
      answers.forEach(response => {
        const question = questions.find(q => q.id === response.questionId);
        if (!question) return;

        // Get the weight for this question
        const questionWeight = questionWeights[question.id] || 1.0;
        
        let responseAttributes: string[] = [];
        let negativeAttributes: string[] = [];
        const categoryBoosts: string[] = [];

        // Extract attributes based on question type
        if (question.type === 'yes-no' || question.type === 'multiple-choice') {
          if (question.options && response.selectedOptions && response.selectedOptions.length > 0) {
            // Handle multiple selected options for multiple-choice questions
            response.selectedOptions.forEach(selectedValue => {
              const selectedOption = question.options?.find(opt => opt.value === selectedValue);
              if (selectedOption) {
                responseAttributes = [...responseAttributes, ...selectedOption.attributes];
                
                // Add category boosts based on specific answers
                if (question.id === 4) { // Subject preferences
                  if (selectedValue === 'math') categoryBoosts.push("STEM", "Academic & Humanities");
                  if (selectedValue === 'science') categoryBoosts.push("STEM", "Medical");
                  if (selectedValue === 'english') categoryBoosts.push("Academic & Humanities");
                  if (selectedValue === 'history') categoryBoosts.push("Academic & Humanities");
                  if (selectedValue === 'arts') categoryBoosts.push("Art", "Performing Arts", "Creative");
                }
                
                if (question.id === 10) { // Performing arts preferences
                  if (selectedValue === 'acting') categoryBoosts.push("Performing Arts");
                  if (selectedValue === 'singing') categoryBoosts.push("Performing Arts");
                  if (selectedValue === 'dancing') categoryBoosts.push("Performing Arts");
                }
                
                if (question.id === 6 && selectedValue === 'yes') { // Business interest
                  categoryBoosts.push("Business");
                }
                
                if (question.id === 11 && selectedValue === 'yes') { // Global issues
                  categoryBoosts.push("Language & Culture", "Advocacy");
                }
                
                if (question.id === 12 && selectedValue === 'yes') { // Volunteering
                  categoryBoosts.push("Community Service", "Advocacy");
                }
                
                // New questions category boosts
                if (question.id === 19) { // Structured vs creative
                  if (selectedValue === 'creative') categoryBoosts.push("Creative", "Art");
                  if (selectedValue === 'structured') categoryBoosts.push("Academic & Humanities", "Business");
                }
                
                if (question.id === 20 && selectedValue === 'yes') { // Language learning
                  categoryBoosts.push("Language & Culture");
                }
                
                if (question.id === 21 && selectedValue === 'yes') { // Diversity and inclusion
                  categoryBoosts.push("Advocacy", "Community Service");
                }
                
                if (question.id === 22 && selectedValue === 'yes') { // Robotics/coding
                  categoryBoosts.push("STEM");
                }
                
                if (question.id === 23 && selectedValue === 'yes') { // Medical/health
                  categoryBoosts.push("Medical", "STEM");
                }
              }
            });
            
            // For "No" answers in yes-no questions, add negative attributes
            if (question.type === 'yes-no' && response.selectedOptions.includes('no')) {
              // Find the "yes" option to get attributes to avoid
              const yesOption = question.options.find(opt => opt.value === 'yes');
              if (yesOption) {
                negativeAttributes = yesOption.attributes;
                userNegativeAttributes.push(...yesOption.attributes);
              }
            }
          }
        } else if (question.type === 'slider') {
          const sliderValue = response.sliderValue;
          if (question.attributes && sliderValue !== undefined && question.attributes[sliderValue]) {
            responseAttributes = question.attributes[sliderValue];
            
            // Add category boosts based on slider values
            if (question.id === 3 && sliderValue >= 4) { // Competitiveness
              categoryBoosts.push("Competitive");
            }
            
            if (question.id === 7 && sliderValue >= 4) { // Technology interest
              categoryBoosts.push("STEM");
            }
            
            if (question.id === 18 && sliderValue >= 4) { // Creative expression
              categoryBoosts.push("Creative", "Art", "Performing Arts");
            } else if (question.id === 18 && sliderValue <= 2) {
              // If user doesn't value creative expression, add negative attributes
              negativeAttributes.push("creative", "artistic", "self-expression");
              userNegativeAttributes.push("creative", "artistic", "self-expression");
            }
          } else if (question.attributes && sliderValue !== undefined) {
            // Handle case where exact slider value doesn't have attributes
            // Find the closest value that has attributes
            const availableValues = Object.keys(question.attributes).map(Number).sort((a, b) => a - b);
            if (availableValues.length > 0) {
              let closestValue = availableValues[0];
              let minDiff = Math.abs(sliderValue - closestValue);
              
              for (const val of availableValues) {
                const diff = Math.abs(sliderValue - val);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestValue = val;
                }
              }
              
              responseAttributes = question.attributes[closestValue] || [];
            }
          }
        }

        // Add user's preferred attributes
        userAttributes.push(...responseAttributes);

        // Boost category scores based on answers
        categoryBoosts.forEach(category => {
          if (categoryScores[category] !== undefined) {
            categoryScores[category] += questionWeight;
          }
        });

        // Update club matches based on response attributes
        clubs.forEach(club => {
          const clubMatch = clubMatches.get(club);
          if (!clubMatch) return;

          // Get required attributes for this club
          const requiredAttributes = clubRequiredAttributes[club.name] || [];

          // Check for attribute matches
          responseAttributes.forEach(attr => {
            if (club.attributes.includes(attr) && !clubMatch.matchedAttributes.includes(attr)) {
              clubMatch.matchedAttributes.push(attr);
              
              // Apply attribute weight if defined, otherwise use default weight of 1.0
              const attrWeight = attributeWeights[attr] || 1.0;
              clubMatch.matchScore += 1;
              
              // Apply diminishing returns for clubs with many attributes
              // This makes it harder for clubs with many attributes to get high scores
              const diminishingReturnFactor = Math.max(0.7, 1 - (clubMatch.matchedAttributes.length * 0.03));
              clubMatch.weightedScore += questionWeight * attrWeight * diminishingReturnFactor;
              
              if (diminishingReturnFactor < 1) {
                clubMatch.diminishingReturnsApplied = true;
              }
              
              // Track user's preferred attributes that match this club
              clubMatch.userPreferredAttributes.push(attr);
              
              // Check if this is a required attribute
              if (requiredAttributes.includes(attr)) {
                clubMatch.requiredAttributesMatched += 1;
              }
            }
          });
          
          // Check for negative attribute matches (attributes to avoid)
          negativeAttributes.forEach(attr => {
            if (club.attributes.includes(attr) && !clubMatch.negativeAttributes.includes(attr)) {
              clubMatch.negativeAttributes.push(attr);
              // We'll use this for confidence calculation later
            }
          });
        });
      });

      // Calculate total possible score for each club based on weighted attributes
      clubs.forEach(club => {
        const clubMatch = clubMatches.get(club);
        if (!clubMatch) return;
        
        // Calculate total possible weighted score
        let totalPossibleScore = 0;
        club.attributes.forEach(attr => {
          const attrWeight = attributeWeights[attr] || 1.0;
          totalPossibleScore += attrWeight;
        });
        
        clubMatch.totalPossibleScore = totalPossibleScore;
        
        // Calculate attribute match strength (how many of the user's preferred attributes match this club)
        const uniqueUserAttributes = [...new Set(userAttributes)];
        if (uniqueUserAttributes.length > 0) {
          const matchingAttributes = clubMatch.matchedAttributes.length;
          clubMatch.attributeMatchStrength = matchingAttributes / uniqueUserAttributes.length;
        }
      });

      // Find the top categories
      const sortedCategories = Object.entries(categoryScores)
        .sort((a, b) => b[1] - a[1])
        .filter(([, score]) => score > 0)
        .map(([category]) => category);
      
      const topCategories = sortedCategories.slice(0, 3);

      // Calculate match percentages, confidence scores, and sort by weighted score
      const results = Array.from(clubMatches.entries())
        .map(([club, match]) => {
          // Calculate match percentage with a more nuanced approach
          const rawPercentage = Math.round((match.matchScore / Math.max(1, club.attributes.length)) * 100);
          
          // Calculate weighted percentage based on the weighted score and total possible score
          const weightedPercentage = Math.round((match.weightedScore / Math.max(1, match.totalPossibleScore)) * 100);
          
          // Calculate negative attribute penalty
          const negativeAttributePenalty = match.negativeAttributes.length * 8; // Increased from 5 to 8
          
          // Calculate required attribute penalty
          // If the club has required attributes but the user didn't match them all, apply a penalty
          let requiredAttributePenalty = 0;
          if (match.totalRequiredAttributes > 0) {
            const requiredAttributeRatio = match.requiredAttributesMatched / match.totalRequiredAttributes;
            if (requiredAttributeRatio < 1) {
              // Apply a significant penalty if not all required attributes are matched
              requiredAttributePenalty = Math.round((1 - requiredAttributeRatio) * 25);
            }
          }
          
          // Calculate final match percentage with a balanced approach
          let matchPercentage = Math.round((weightedPercentage * 0.6) + (rawPercentage * 0.4));
          
          // Apply negative attribute penalty
          matchPercentage = Math.max(5, matchPercentage - negativeAttributePenalty);
          
          // Apply required attribute penalty
          matchPercentage = Math.max(5, matchPercentage - requiredAttributePenalty);
          
          // Boost percentage if club is in a top category (but less than before)
          if (match.categoryMatch && topCategories.includes(match.categoryMatch)) {
            matchPercentage += 8; // Reduced from 10 to 8
          }
          
          // Apply a scaling factor to make high percentages harder to achieve
          // This creates a more bell-curve distribution of scores
          if (matchPercentage > 70) {
            const scalingFactor = 0.8; // Reduce high scores more aggressively
            matchPercentage = 70 + Math.round((matchPercentage - 70) * scalingFactor);
          }
          
          // Apply diminishing returns penalty for clubs with many attributes
          if (match.diminishingReturnsApplied) {
            matchPercentage = Math.max(5, matchPercentage - 5);
          }
          
          // Apply a penalty based on the number of questions answered
          // If the user answered fewer questions, be more conservative with high scores
          const questionCompletionRatio = answers.length / questions.length;
          if (questionCompletionRatio < 0.7 && matchPercentage > 60) {
            const incompletenessAdjustment = Math.round((1 - questionCompletionRatio) * 20);
            matchPercentage = Math.max(60, matchPercentage - incompletenessAdjustment);
          }
          
          // Make it extremely difficult to get 100%
          if (matchPercentage > 90) {
            // Check if all required attributes are matched
            if (match.totalRequiredAttributes > 0 && match.requiredAttributesMatched < match.totalRequiredAttributes) {
              matchPercentage = Math.min(matchPercentage, 90);
            }
            
            // Check if there are any negative attributes
            if (match.negativeAttributes.length > 0) {
              matchPercentage = Math.min(matchPercentage, 85);
            }
            
            // Check if the user answered enough questions
            if (questionCompletionRatio < 0.8) {
              matchPercentage = Math.min(matchPercentage, 88);
            }
          }
          
          // Cap at 95% unless it's a perfect match
          const isPerfectMatch = match.totalRequiredAttributes > 0 && 
                                match.requiredAttributesMatched === match.totalRequiredAttributes && 
                                match.negativeAttributes.length === 0 &&
                                questionCompletionRatio > 0.8 &&
                                match.matchedAttributes.length >= Math.ceil(club.attributes.length * 0.8);
          
          if (!isPerfectMatch) {
            matchPercentage = Math.min(95, matchPercentage);
          }
          
          // Cap at 100%
          matchPercentage = Math.min(100, matchPercentage);
          
          // Calculate confidence score (0-100)
          let confidence = 50; // Start at neutral
          
          // Boost confidence if the club is in a top category
          if (match.categoryMatch && topCategories.includes(match.categoryMatch)) {
            confidence += 15;
          }
          
          // Boost confidence based on number of matched attributes and their weights
          const matchedAttributesBoost = Math.min(25, match.matchedAttributes.length * 3);
          confidence += matchedAttributesBoost;
          
          // Boost confidence based on attribute match strength
          confidence += Math.round(match.attributeMatchStrength * 15);
          
          // Reduce confidence based on negative attributes
          confidence -= Math.min(40, match.negativeAttributes.length * 10);
          
          // Adjust confidence based on the number of answers provided
          const answerRatio = answers.length / questions.length;
          if (answerRatio < 0.5) {
            confidence -= 15; // Reduce confidence if user answered less than half the questions
          } else if (answerRatio > 0.8) {
            confidence += 10; // Boost confidence if user answered most questions
          }
          
          // Adjust confidence based on required attributes
          if (match.totalRequiredAttributes > 0) {
            const requiredAttributeRatio = match.requiredAttributesMatched / match.totalRequiredAttributes;
            if (requiredAttributeRatio < 0.5) {
              confidence -= 20; // Significant confidence reduction if less than half of required attributes matched
            } else if (requiredAttributeRatio === 1) {
              confidence += 15; // Boost confidence if all required attributes matched
            }
          }
          
          // Ensure confidence is between 0-100
          confidence = Math.max(0, Math.min(100, confidence));
          
          return {
            club,
            matchedAttributes: match.matchedAttributes,
            negativeAttributes: match.negativeAttributes,
            score: match.weightedScore,
            matchPercentage,
            confidenceScore: confidence,
            categoryMatch: match.categoryMatch,
            requiredAttributesMatched: match.requiredAttributesMatched,
            totalRequiredAttributes: match.totalRequiredAttributes
          };
        })
        .sort((a, b) => {
          // Sort by match percentage first
          if (b.matchPercentage !== a.matchPercentage) {
            return b.matchPercentage - a.matchPercentage;
          }
          // If percentages are equal, sort by confidence score
          return b.confidenceScore - a.confidenceScore;
        });

      // Return top matches (clubs with at least 20% match)
      const topMatches = results.filter(result => result.matchPercentage >= 20);
      
      // Group matches by category for better organization and limit to 11 results
      const categorizedMatches = topMatches.length > 0 
        ? topMatches.slice(0, 11) 
        : results.slice(0, 5);
      
      return categorizedMatches;
    } catch (error) {
      console.error("Error calculating matches:", error);
      // Return a safe fallback
      return clubs.slice(0, 5).map(club => ({
        club,
        matchedAttributes: [],
        negativeAttributes: [],
        score: 0,
        matchPercentage: 20,
        confidenceScore: 10,
        categoryMatch: null
      }));
    }
  };

  // Calculate quiz results
  const calculateResults = () => {
    try {
      // Add a safety check to ensure we have answers
      if (answers.length === 0) {
        // If no answers, provide some default matches rather than breaking
        setClubMatches(clubs.slice(0, 5).map(club => ({
          club,
          matchedAttributes: [],
          negativeAttributes: [],
          score: 0,
          matchPercentage: 20,
          confidenceScore: 10,
          categoryMatch: null
        })));
        setShowResults(true);
        return;
      }
      
      // Match clubs based on attributes
      const matches: ClubMatch[] = calculateMatches();
      
      // Ensure we have valid matches
      if (!matches || matches.length === 0) {
        // Fallback to providing some default matches
        setClubMatches(clubs.slice(0, 5).map(club => ({
          club,
          matchedAttributes: [],
          negativeAttributes: [],
          score: 0,
          matchPercentage: 20,
          confidenceScore: 10,
          categoryMatch: null
        })));
      } else {
        // Limit results to a maximum of 11 clubs
        setClubMatches(matches.slice(0, 11));
      }
      
      setShowResults(true);
    } catch (error) {
      console.error("Error calculating results:", error);
      // Provide fallback results in case of error
      setClubMatches(clubs.slice(0, 5).map(club => ({
        club,
        matchedAttributes: [],
        negativeAttributes: [],
        score: 0,
        matchPercentage: 20,
        confidenceScore: 10,
        categoryMatch: null
      })));
      setShowResults(true);
    }
  };

  // Reset the quiz
  const resetQuiz = () => {
    setCurrentQuestionIndex(null);
    setAnswers([]);
    setClubMatches([]);
    setSkipsRemaining(20); // Reset skips to 20
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
                    Previous
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
                    {currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1 ? 'Next' : 'See Results'}
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
              className="text-gray-600 mb-8 text-center max-w-lg"
            >
              Based on your responses, here are the clubs that best match your interests and preferences.
            </motion.p>
            
            {clubMatches.length > 0 ? (
              <div className="w-full space-y-6">
                {clubMatches.map((match, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 0, 0, 0.1)" }}
                    className={`p-6 border rounded-xl transition-all ${
                      (match.confidenceScore ?? 0) >= 70 ? 'border-green-200 bg-gradient-to-r from-green-50 to-teal-50' : 
                      (match.confidenceScore ?? 0) >= 40 ? 'border-blue-100 bg-gradient-to-r from-white to-blue-50' : 'border-gray-200 bg-gradient-to-r from-white to-gray-50'
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
                            (match.matchPercentage ?? 0) >= 70 ? 'bg-gradient-to-r from-green-500 to-teal-500' :
                            (match.matchPercentage ?? 0) >= 50 ? 'bg-gradient-to-r from-[#3B82F6] to-[#38BFA1]' :
                            'bg-gradient-to-r from-[#3B82F6] to-indigo-500'
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
                            (match.confidenceScore ?? 0) >= 70 ? 'bg-gradient-to-r from-green-500 to-teal-500' :
                            (match.confidenceScore ?? 0) >= 40 ? 'bg-gradient-to-r from-[#3B82F6] to-[#38BFA1]' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`}
                        ></motion.div>
                      </div>
                      <span className="text-xs font-medium ml-3 min-w-[90px] text-gray-600">
                        {(match.confidenceScore ?? 0) >= 70 ? 'Strong match' :
                         (match.confidenceScore ?? 0) >= 40 ? 'Good match' : 'Possible match'}
                      </span>
                    </div>
                    
                    {match.matchedAttributes.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="mt-4"
                      >
                        <p className="text-sm font-medium text-gray-700 mb-2">Matched Attributes:</p>
                        <div className="flex flex-wrap gap-2">
                          {match.matchedAttributes.map((attr, i) => (
                            <motion.span 
                              key={i}
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
                <p className="text-lg text-gray-700 mb-4">
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
              <p className="text-gray-600 mb-6 text-center">
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