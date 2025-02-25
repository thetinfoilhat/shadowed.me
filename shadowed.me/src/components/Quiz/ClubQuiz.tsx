import { useState } from 'react';
import EnhancedIntro from './EnhancedIntro';

// Types
type Club = {
  name: string;
  attributes: string[];
  description?: string;
};

type QuestionType = 'yes-no' | 'multiple-choice' | 'slider';

type Option = {
  label: string;
  value: string;
  attributes: string[];
};

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

type Answer = {
  questionId: number;
  selectedOptions?: string[];
  sliderValue?: number;
};

type ClubMatch = {
  club: Club;
  score: number;
  matchedAttributes: string[];
  matchPercentage?: number;
  negativeAttributes?: string[];
  confidenceScore?: number;
  categoryMatch?: string | null;
};

// Sample club data (you can replace this later)
const clubs: Club[] = [
  // 🎨 Art Clubs
  {
    name: "Art Club",
    attributes: ["creativity", "painting", "drawing", "self-expression", "collaboration", "design", "visual storytelling", "artistic"],
    description: "A club for students interested in exploring different forms of visual art and creative expression."
  },
  {
    name: "Ceramics Society",
    attributes: ["pottery", "hands-on", "sculpting", "creativity", "design", "craftsmanship", "tactile", "DIY"],
    description: "A club dedicated to ceramics and sculpting for those who love working with clay."
  },
  {
    name: "Photography Club",
    attributes: ["photography", "editing", "visual storytelling", "composition", "technology", "media", "graphic design", "creativity"],
    description: "A club focused on learning photography techniques, photo editing, and composition."
  },

  // 🌎 Language & Culture Clubs
  {
    name: "ASL (American Sign Language & Culture) Club",
    attributes: ["language", "cultural awareness", "sign language", "communication", "accessibility", "global awareness", "inclusivity"],
    description: "A club for students interested in learning ASL and engaging with Deaf culture."
  },
  {
    name: "French Club",
    attributes: ["language", "cultural awareness", "travel", "conversation", "community", "history", "global issues", "social"],
    description: "A club for students interested in French language, culture, and traditions."
  },
  {
    name: "Spanish Club",
    attributes: ["language", "cultural awareness", "communication", "travel", "conversation", "global awareness", "public speaking"],
    description: "A club for students interested in Spanish language and Hispanic cultures."
  },
  {
    name: "German Club",
    attributes: ["language", "cultural awareness", "communication", "global awareness", "history"],
    description: "A club dedicated to learning German language and culture through activities and discussions."
  },
  {
    name: "Korean Club",
    attributes: ["language", "cultural awareness", "community", "tradition", "communication", "global awareness"],
    description: "A club for students interested in Korean language, culture, and traditions."
  },
  {
    name: "Henna Club",
    attributes: ["art", "cultural awareness", "self-expression", "design", "creativity", "tradition", "history", "hands-on"],
    description: "A club that explores the cultural significance and art of henna designs."
  },

  // 🔬 STEM Clubs
  {
    name: "Astronomy Club",
    attributes: ["space", "science", "experiments", "exploration", "critical thinking", "problem-solving", "innovation", "research"],
    description: "A club for students fascinated by the universe, space exploration, and astronomy."
  },
  {
    name: "Biochemistry Club",
    attributes: ["science", "experiments", "healthcare", "research", "lab work", "medicine", "problem-solving", "critical thinking"],
    description: "A club focused on the intersection of biology and chemistry through experiments and discussions."
  },
  {
    name: "Computer Science Club",
    attributes: ["coding", "technology", "problem-solving", "teamwork", "algorithms", "engineering", "AI", "automation"],
    description: "A club for students interested in software development, algorithms, and coding competitions."
  },
  {
    name: "Math Team",
    attributes: ["math", "competitive", "problem-solving", "logical thinking", "strategy", "teamwork", "analysis", "precision"],
    description: "A competitive team for students who love challenging math problems and competitions."
  },
  {
    name: "Robotics Team (FIRST Robotics)",
    attributes: ["engineering", "teamwork", "problem-solving", "coding", "hands-on", "competitive", "technology", "innovation"],
    description: "A hands-on club where students design, build, and program robots for competitions."
  },
  {
    name: "Science Olympiad",
    attributes: ["science", "experiments", "competitive", "teamwork", "innovation", "critical thinking", "problem-solving"],
    description: "A team-based competition club for students passionate about science and engineering."
  },

  // 🎭 Performing Arts Clubs
  {
    name: "Drama Club",
    attributes: ["acting", "performance", "public speaking", "creativity", "teamwork", "improvisation", "confidence", "stage presence"],
    description: "A club for students passionate about theater, performing plays, and improving public speaking skills."
  },
  {
    name: "Marching Band",
    attributes: ["music", "performance", "teamwork", "discipline", "coordination", "musicality", "rhythm"],
    description: "A club for students interested in performing music in a marching band setting."
  },
  {
    name: "Show Choir",
    attributes: ["singing", "performance", "teamwork", "dance", "stage presence", "expression", "musicality", "discipline"],
    description: "A competitive choir that combines singing with choreographed dance routines."
  },
  {
    name: "Orchesis",
    attributes: ["dance", "performance", "creativity", "expression", "fitness", "choreography", "movement", "artistic"],
    description: "A dance-focused club that explores different styles and puts on performances."
  },

  // 💼 Business Clubs
  {
    name: "DECA",
    attributes: ["business", "competitive", "teamwork", "public speaking", "leadership", "marketing", "entrepreneurship", "networking"],
    description: "A club focused on business, marketing, and entrepreneurship through competitions."
  },
  {
    name: "BPA (Business Professionals of America)",
    attributes: ["business", "leadership", "networking", "public speaking", "finance", "competitive", "professional development"],
    description: "A club that prepares students for business careers through competitions and networking."
  },
  {
    name: "Investment Club",
    attributes: ["finance", "business", "economics", "investing", "strategy", "critical thinking", "wealth management", "decision making"],
    description: "A club for students interested in learning about the stock market and financial literacy."
  },

  // ❤️ Community Service Clubs
  {
    name: "Girl Up",
    attributes: ["volunteering", "advocacy", "leadership", "community", "global awareness", "gender equality", "social impact"],
    description: "A club dedicated to empowering young women and advocating for gender equality."
  },
  {
    name: "Interact Club",
    attributes: ["volunteering", "community service", "leadership", "fundraising", "teamwork", "event planning", "outreach", "collaboration"],
    description: "A Rotary-sponsored club focused on service projects and leadership development."
  },
  {
    name: "UNICEF Club",
    attributes: ["volunteering", "global awareness", "advocacy", "fundraising", "teamwork", "policy change", "public health", "education"],
    description: "A club dedicated to helping children around the world through advocacy and fundraising."
  },

  // 📚 Academic & Humanities Clubs
  {
    name: "Debate",
    attributes: ["public speaking", "debate", "critical thinking", "argumentation", "competition", "logic", "persuasion", "research"],
    description: "A club for students who enjoy structured arguments, competitions, and discussing important issues."
  },
  {
    name: "Model UN",
    attributes: ["public speaking", "debate", "global issues", "teamwork", "policy analysis", "diplomacy", "critical thinking", "advocacy"],
    description: "A club where students simulate United Nations conferences, debating global policies and current events."
  },
  {
    name: "Huskie Book Club",
    attributes: ["reading", "literature", "discussion", "analysis", "critical thinking", "storytelling"],
    description: "A club for students who love reading and discussing books with peers."
  },

  // 🏆 Miscellaneous Clubs
  {
    name: "Chess Club & Team",
    attributes: ["strategy", "problem-solving", "competition", "critical thinking", "gameplay", "logic", "concentration", "patience"],
    description: "A club for students who enjoy chess and want to improve their strategic thinking."
  },
  {
    name: "Esports Club",
    attributes: ["gaming", "strategy", "teamwork", "competitive", "tournament play", "technology", "coordination", "communication"],
    description: "A club for students interested in competitive gaming and team-based esports tournaments."
  },
  {
    name: "Yearbook",
    attributes: ["photography", "writing", "design", "teamwork", "publishing", "journalism", "editing", "creativity"],
    description: "A club where students work together to create and design the school's yearbook."
  }
];

// Sample questions
const questions: Question[] = [
  // 🔹 General Interest & Personality
  {
    id: 1,
    text: "Do you enjoy public speaking or presenting to groups?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["public speaking", "performance", "communication", "leadership"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 2,
    text: "Do you prefer working in a team or independently?",
    type: "multiple-choice",
    options: [
      { label: "Team", value: "team", attributes: ["teamwork", "collaboration", "leadership"] },
      { label: "Independently", value: "alone", attributes: ["independent", "self-directed", "focus"] },
      { label: "Both", value: "both", attributes: ["teamwork", "independent", "adaptable", "versatile"] }
    ]
  },
  {
    id: 3,
    text: "How competitive are you?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "Extremely",
    attributes: {
      1: ["non-competitive", "collaborative", "casual"],
      2: ["casual", "friendly competition"],
      3: ["moderate competition"],
      4: ["competitive", "ambitious"],
      5: ["competitive", "tournament play", "high-intensity", "perfectionist"]
    }
  },

  // 🔹 Academic Preferences
  {
    id: 4,
    text: "Which subjects do you enjoy most in school?",
    type: "multiple-choice",
    options: [
      { label: "Math", value: "math", attributes: ["math", "analytical", "logical thinking", "numbers"] },
      { label: "Science", value: "science", attributes: ["science", "experiments", "research", "innovation", "technology"] },
      { label: "English/Literature", value: "english", attributes: ["writing", "literature", "reading", "analysis", "storytelling"] },
      { label: "History/Social Studies", value: "history", attributes: ["research", "analytical", "global issues", "debate", "policy analysis"] },
      { label: "Arts", value: "arts", attributes: ["artistic", "creative", "design", "expression", "visual storytelling"] }
    ]
  },
  {
    id: 5,
    text: "Do you enjoy solving complex problems or puzzles?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["problem-solving", "critical thinking", "analytical", "strategy", "logic"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },

  // 🔹 Business & Finance
  {
    id: 6,
    text: "Are you interested in business, finance, or entrepreneurship?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["business", "finance", "economics", "investing", "networking", "leadership"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },

  // 🔹 STEM & Technology
  {
    id: 7,
    text: "How interested are you in technology and computing?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "Very interested",
    attributes: {
      1: [],
      2: ["casual interest"],
      3: ["technology", "coding"],
      4: ["technology", "coding", "engineering"],
      5: ["technology", "coding", "engineering", "algorithms", "cybersecurity"]
    }
  },
  {
    id: 8,
    text: "Would you enjoy competing in STEM-related competitions?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["STEM", "competitions", "problem-solving", "engineering", "innovation"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },

  // 🔹 Creative & Performing Arts
  {
    id: 9,
    text: "Do you enjoy writing, journalism, or storytelling?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["writing", "communication", "publishing", "visual storytelling", "journalism"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 10,
    text: "Do you like acting, singing, or dancing?",
    type: "multiple-choice",
    options: [
      { label: "Acting", value: "acting", attributes: ["acting", "theater", "performance", "stage presence", "drama", "confidence"] },
      { label: "Singing", value: "singing", attributes: ["music", "singing", "choir", "performance", "vocal training", "rhythm"] },
      { label: "Dancing", value: "dancing", attributes: ["dance", "choreography", "performance", "rhythm", "movement", "teamwork"] },
      { label: "None", value: "none", attributes: [] }
    ]
  },

  // 🔹 Social & Global Awareness
  {
    id: 11,
    text: "Are you interested in global issues or different cultures?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["global awareness", "cultural awareness", "language", "policy analysis", "advocacy", "international relations"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },

  // 🔹 Volunteering & Leadership
  {
    id: 12,
    text: "Do you enjoy volunteering and community service?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["volunteering", "community service", "advocacy", "social impact", "fundraising", "social responsibility"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 13,
    text: "Do you like planning and organizing events?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["event planning", "leadership", "teamwork", "organization", "networking", "logistics"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },

  // 🔹 Hands-on Activities & Specialized Interests
  {
    id: 14,
    text: "Do you enjoy hands-on activities or building things?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["hands-on", "engineering", "design", "pottery", "sculpting", "DIY", "mechanics", "creativity"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 15,
    text: "Do you enjoy photography, graphic design, or visual arts?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["photography", "graphic design", "visual storytelling", "editing", "digital media"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 16,
    text: "Would you be interested in working on a school newspaper or yearbook?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["publishing", "journalism", "writing", "photography", "design", "media", "editing"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 17,
    text: "Do you enjoy strategic thinking and games like chess or card games?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["strategy", "logic", "critical thinking", "competition", "game theory"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  
  // 🔹 Additional Questions - Creative Expression
  {
    id: 18,
    text: "How important is creative expression to you?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not important",
    maxLabel: "Very important",
    attributes: {
      1: [],
      2: ["casual interest"],
      3: ["creative", "self-expression"],
      4: ["creative", "self-expression", "artistic"],
      5: ["creative", "self-expression", "artistic", "innovation", "design"]
    }
  },
  {
    id: 19,
    text: "Do you prefer structured activities or creative freedom?",
    type: "multiple-choice",
    options: [
      { label: "Structured", value: "structured", attributes: ["structured", "organized", "discipline", "rules", "logical thinking"] },
      { label: "Creative", value: "creative", attributes: ["creative", "artistic", "self-expression", "innovation", "free thinking"] },
      { label: "Both", value: "both", attributes: ["structured", "creative", "adaptable", "versatile"] }
    ]
  },
  
  // 🔹 Additional Questions - Languages & Culture
  {
    id: 20,
    text: "Do you enjoy learning new languages?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["language", "communication", "cultural awareness", "multilingualism", "travel"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 21,
    text: "Would you enjoy being part of a club that promotes diversity and inclusion?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["advocacy", "social impact", "leadership", "community service", "human rights"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  
  // 🔹 Additional Questions - Specialized Interests
  {
    id: 22,
    text: "Would you like to participate in a robotics or coding competition?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["robotics", "technology", "engineering", "problem-solving", "automation", "AI"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 23,
    text: "Would you like to be involved in a medical or health-related club?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["medicine", "healthcare", "science", "biology", "research", "patient care"] },
      { label: "No", value: "no", attributes: [] }
    ]
  }
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

  // Handle Yes/No and Multiple Choice answers
  const handleOptionSelect = (questionId: number, optionValue: string, selected: boolean) => {
    console.log(`Option selected: Question ${questionId}, Option ${optionValue}, Selected: ${selected}`);
    
    setAnswers(prevAnswers => {
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
          if (questions.find(q => q.id === questionId)?.type === 'yes-no') {
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
    });
  };

  // Handle Slider answers
  const handleSliderChange = (questionId: number, value: number) => {
    setAnswers(prevAnswers => {
      const questionIndex = prevAnswers.findIndex(a => a.questionId === questionId);
      
      if (questionIndex === -1) {
        // Question hasn't been answered yet
        return [...prevAnswers, {
          questionId,
          sliderValue: value
        }];
      } else {
        // Update existing answer
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[questionIndex].sliderValue = value;
        return updatedAnswers;
      }
    });
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex !== null ? prevIndex + 1 : 0);
    } else {
      // Quiz completed
      calculateResults();
      setShowResults(true);
      setCurrentQuestionIndex(null); // Reset current question index when showing results
    }
  };

  // Skip current question
  const handleSkip = () => {
    if (skipsRemaining > 0 && currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1) {
      setSkipsRemaining(prev => prev - 1);
      setCurrentQuestionIndex(prevIndex => prevIndex !== null ? prevIndex + 1 : 0);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex !== null && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex !== null ? prevIndex - 1 : 0);
    }
  };

  // Check if current question has been answered
  const isCurrentQuestionAnswered = () => {
    if (currentQuestionIndex === null || !currentQuestion) return false;
    
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
    
    console.log(`Checking if question ${currentQuestion.id} is answered:`, answer);
    
    if (!answer) return false;
    
    let isAnswered = false;
    
    if (currentQuestion.type === 'slider') {
      isAnswered = answer.sliderValue !== undefined;
    } else if (currentQuestion.type === 'yes-no' || currentQuestion.type === 'multiple-choice') {
      isAnswered = answer.selectedOptions !== undefined && answer.selectedOptions.length > 0;
    }
    
    console.log(`Question ${currentQuestion.id} is answered: ${isAnswered}`);
    return isAnswered;
  };

  // Calculate matches based on user responses
  const calculateMatches = () => {
    // Define question weights (higher number = more important)
    const questionWeights: Record<number, number> = {
      1: 1.2,  // Public speaking
      2: 1.5,  // Team vs independent
      3: 1.3,  // Competitiveness
      4: 1.8,  // Subject preferences (high weight as it's a key indicator)
      5: 1.2,  // Problem solving
      6: 1.4,  // Business interest
      7: 1.3,  // Technology interest
      8: 1.4,  // STEM competitions
      9: 1.2,  // Writing interest
      10: 1.5, // Performing arts
      11: 1.3, // Global issues
      12: 1.4, // Volunteering
      13: 1.3, // Event planning
      14: 1.4, // Hands-on activities
      15: 1.5, // Photography/visual arts
      16: 1.5, // Newspaper/yearbook
      17: 1.2,  // Strategic thinking
      18: 1.3,  // Creative expression
      19: 1.4,  // Structured vs creative
      20: 1.2,  // Language learning
      21: 1.3,  // Advocacy for diversity
      22: 1.4,  // Robotics/coding
      23: 1.3   // Medical/health
    };

    // Define club categories for better grouping
    const clubCategories: Record<string, string[]> = {
      "Art": ["Art Club", "Ceramics Society", "Photography Club", "Henna Club"],
      "Language & Culture": ["ASL (American Sign Language & Culture) Club", "French Club", "Spanish Club", "Korean Club"],
      "STEM": ["Astronomy Club", "Biochemistry Club", "Computer Science Club", "Math Team", "Robotics Team (FIRST Robotics)"],
      "Performing Arts": ["Drama Club", "Marching Band", "Show Choir", "Orchesis"],
      "Business": ["DECA", "BPA (Business Professionals of America)", "Investment Club"],
      "Community Service": ["Girl Up", "Interact Club", "UNICEF Club"],
      "Academic & Humanities": ["Debate", "Model UN", "Huskie Book Club"],
      "Competitive": ["Chess Club & Team", "Esports Club", "Debate", "Math Team", "DECA", "BPA (Business Professionals of America)", "Robotics Team (FIRST Robotics)"],
      "Creative": ["Art Club", "Ceramics Society", "Photography Club", "Henna Club", "Drama Club", "Show Choir", "Orchesis"],
      "Advocacy": ["Girl Up", "UNICEF Club"],
      "Medical": ["Biochemistry Club"]
    };

    // Create a map to track attribute matches for each club
    const clubMatches = new Map<Club, { 
      matchedAttributes: string[], 
      negativeAttributes: string[],
      matchScore: number,
      weightedScore: number,
      totalPossibleScore: number,
      categoryMatch: string | null,
      confidenceScore: number
    }>();

    // Initialize club matches
    clubs.forEach(club => {
      // Find which category this club belongs to
      let category = null;
      for (const [cat, clubNames] of Object.entries(clubCategories)) {
        if (clubNames.includes(club.name)) {
          category = cat;
          break;
        }
      }

      clubMatches.set(club, { 
        matchedAttributes: [], 
        negativeAttributes: [],
        matchScore: 0,
        weightedScore: 0,
        totalPossibleScore: club.attributes.length,
        categoryMatch: category,
        confidenceScore: 0
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
        if (question.options && response.selectedOptions) {
          // Handle multiple selected options for multiple-choice questions
          response.selectedOptions.forEach(selectedValue => {
            const selectedOption = question.options?.find(opt => opt.value === selectedValue);
            if (selectedOption) {
              responseAttributes = [...responseAttributes, ...selectedOption.attributes];
              
              // Add category boosts based on specific answers
              if (question.id === 4) { // Subject preferences
                if (selectedValue === 'math') categoryBoosts.push("STEM", "Academic & Humanities");
                if (selectedValue === 'science') categoryBoosts.push("STEM");
                if (selectedValue === 'english') categoryBoosts.push("Academic & Humanities");
                if (selectedValue === 'history') categoryBoosts.push("Academic & Humanities");
                if (selectedValue === 'arts') categoryBoosts.push("Art", "Performing Arts");
              }
              
              if (question.id === 10) { // Performing arts preferences
                if (selectedValue === 'acting') categoryBoosts.push("Performing Arts");
                if (selectedValue === 'singing') categoryBoosts.push("Performing Arts");
                if (selectedValue === 'dancing') categoryBoosts.push("Performing Arts");
              }
              
              if (question.id === 3 && parseInt(selectedValue) >= 4) { // Competitiveness
                categoryBoosts.push("Competitive");
              }
              
              // New questions category boosts
              if (question.id === 19) { // Structured vs creative
                if (selectedValue === 'creative') categoryBoosts.push("Creative", "Art");
                if (selectedValue === 'structured') categoryBoosts.push("Academic & Humanities", "Business");
              }
              
              if (question.id === 20) { // Language learning
                if (selectedValue === 'yes') categoryBoosts.push("Language & Culture");
              }
              
              if (question.id === 21) { // Diversity and inclusion
                if (selectedValue === 'yes') categoryBoosts.push("Advocacy", "Community Service");
              }
              
              if (question.id === 22) { // Robotics/coding
                if (selectedValue === 'yes') categoryBoosts.push("STEM");
              }
              
              if (question.id === 23) { // Medical/health
                if (selectedValue === 'yes') categoryBoosts.push("Medical", "STEM");
              }
            }
          });
          
          // For "No" answers in yes-no questions, add negative attributes
          if (question.type === 'yes-no' && response.selectedOptions.includes('no')) {
            // Find the "yes" option to get attributes to avoid
            const yesOption = question.options.find(opt => opt.value === 'yes');
            if (yesOption) {
              negativeAttributes = yesOption.attributes;
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
          }
        }
      }

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

        // Check for attribute matches
        responseAttributes.forEach(attr => {
          if (club.attributes.includes(attr) && !clubMatch.matchedAttributes.includes(attr)) {
            clubMatch.matchedAttributes.push(attr);
            clubMatch.matchScore += 1;
            clubMatch.weightedScore += questionWeight;
          }
        });
        
        // Check for negative attribute matches (attributes to avoid)
        negativeAttributes.forEach(attr => {
          if (club.attributes.includes(attr) && !clubMatch.negativeAttributes.includes(attr)) {
            clubMatch.negativeAttributes.push(attr);
            // We don't reduce the score here, but we'll use this for confidence calculation
          }
        });
      });
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
        const rawPercentage = Math.round((match.matchScore / Math.max(1, match.totalPossibleScore)) * 100);
        
        // Adjust percentage based on weighted score
        const weightedPercentage = Math.round((match.weightedScore / (match.totalPossibleScore * 1.5)) * 100);
        
        // Use the better of the two percentages, with a minimum of 5%
        const matchPercentage = Math.max(5, Math.max(rawPercentage, weightedPercentage));
        
        // Calculate confidence score (0-100)
        let confidence = 50; // Start at neutral
        
        // Boost confidence if the club is in a top category
        if (match.categoryMatch && topCategories.includes(match.categoryMatch)) {
          confidence += 15;
        }
        
        // Boost confidence based on number of matched attributes
        confidence += Math.min(20, match.matchedAttributes.length * 2);
        
        // Reduce confidence based on negative attributes
        confidence -= Math.min(30, match.negativeAttributes.length * 10);
        
        // Ensure confidence is between 0-100
        confidence = Math.max(0, Math.min(100, confidence));
        
        return {
          club,
          matchedAttributes: match.matchedAttributes,
          negativeAttributes: match.negativeAttributes,
          score: match.weightedScore, // Use weighted score
          matchPercentage,
          confidenceScore: confidence,
          categoryMatch: match.categoryMatch
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
    
    // Group matches by category for better organization
    const categorizedMatches = topMatches.length > 0 ? topMatches : results.slice(0, 5);
    
    return categorizedMatches;
  };

  // Calculate quiz results
  const calculateResults = () => {
    if (answers.length === 0) return;
    
    // Match clubs based on attributes
    const matches: ClubMatch[] = calculateMatches();
    
    setClubMatches(matches);
    setShowResults(true);
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
    const answer = answers.find(a => a.questionId === questionId);
    return answer?.sliderValue !== undefined ? answer.sliderValue : 3; // Default to middle value
  };

  // Start the quiz
  const startQuiz = () => {
    setIsStarted(true);
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Quiz Content */}
      {isStarted ? (
        currentQuestion ? (
          // Question screen
          <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-8">
              <div 
                className="h-full bg-[#38BFA1] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex !== null ? currentQuestionIndex + 1 : ''} of {questions.length}
              </div>
              <div className="text-sm text-gray-500">
                Skips remaining: {skipsRemaining}
              </div>
            </div>
            
            <h3 className="text-xl font-medium text-[#0A2540] mb-6">
              {currentQuestion.text}
            </h3>
            
            {/* Question content based on type */}
            <div className="mb-8">
              {currentQuestion.type === 'yes-no' && (
                <div className="flex justify-center gap-4">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleOptionSelect(currentQuestion.id, option.value, !isOptionSelected(currentQuestion.id, option.value))}
                      className={`flex-1 max-w-[180px] py-4 px-6 rounded-lg border-2 transition-all ${
                        isOptionSelected(currentQuestion.id, option.value)
                          ? 'border-[#38BFA1] bg-[#38BFA1]/10 text-[#0A2540] font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              
              {currentQuestion.type === 'multiple-choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleOptionSelect(currentQuestion.id, option.value, !isOptionSelected(currentQuestion.id, option.value))}
                      className={`py-3 px-4 rounded-lg border-2 text-left transition-all ${
                        isOptionSelected(currentQuestion.id, option.value)
                          ? 'border-[#38BFA1] bg-[#38BFA1]/10 text-[#0A2540] font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              
              {currentQuestion.type === 'slider' && (
                <div className="px-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{currentQuestion.minLabel}</span>
                    <span>{currentQuestion.maxLabel}</span>
                  </div>
                  <input
                    type="range"
                    min={currentQuestion.min || 1}
                    max={currentQuestion.max || 5}
                    value={getSliderValue(currentQuestion.id)}
                    onChange={(e) => handleSliderChange(currentQuestion.id, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#38BFA1]"
                  />
                  <div className="mt-4 text-center">
                    <span className="inline-block px-4 py-2 bg-[#38BFA1]/10 rounded-full font-medium text-[#38BFA1]">
                      {getSliderValue(currentQuestion.id)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === null || currentQuestionIndex === 0}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  currentQuestionIndex === null || currentQuestionIndex === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-[#0A2540] hover:bg-gray-200'
                }`}
              >
                Previous
              </button>
              
              {skipsRemaining > 0 && currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Skip ({skipsRemaining})
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={!isCurrentQuestionAnswered()}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  isCurrentQuestionAnswered()
                    ? 'bg-[#38BFA1] text-white hover:bg-[#2DA891]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentQuestionIndex !== null && currentQuestionIndex < questions.length - 1 ? 'Next' : 'See Results'}
              </button>
            </div>
          </div>
        ) : showResults ? (
          // Results screen
          <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-[#0A2540] mb-2">Your Club Matches</h2>
            <p className="text-gray-600 mb-6 text-center">
              Based on your responses, here are the clubs that best match your interests and preferences.
            </p>
            
            {clubMatches.length > 0 ? (
              <div className="w-full space-y-6">
                {clubMatches.map((match, index) => (
                  <div 
                    key={index} 
                    className={`p-5 border rounded-lg hover:shadow-md transition-shadow ${
                      (match.confidenceScore ?? 0) >= 70 ? 'border-green-200 bg-green-50' : 
                      (match.confidenceScore ?? 0) >= 40 ? 'border-gray-200' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-[#0A2540]">{match.club.name}</h3>
                        {match.categoryMatch && (
                          <span className="text-xs font-medium text-gray-500">{match.categoryMatch}</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold ${
                          (match.matchPercentage ?? 0) >= 70 ? 'bg-gradient-to-r from-green-500 to-teal-500' :
                          (match.matchPercentage ?? 0) >= 50 ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                          'bg-gradient-to-r from-blue-400 to-indigo-400'
                        }`}>
                          {match.matchPercentage}%
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 my-3">{match.club.description}</p>
                    
                    <div className="flex items-center mb-2">
                      <div className={`h-1.5 rounded-full ${
                        (match.confidenceScore ?? 0) >= 70 ? 'bg-green-500' :
                        (match.confidenceScore ?? 0) >= 40 ? 'bg-blue-500' : 'bg-gray-400'
                      }`} style={{ width: `${match.confidenceScore ?? 50}%` }}></div>
                      <span className="text-xs font-medium ml-2 text-gray-500">
                        {(match.confidenceScore ?? 0) >= 70 ? 'Strong match' :
                         (match.confidenceScore ?? 0) >= 40 ? 'Good match' : 'Possible match'}
                      </span>
                    </div>
                    
                    {match.matchedAttributes.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Matched Attributes:</p>
                        <div className="flex flex-wrap gap-2">
                          {match.matchedAttributes.map((attr, i) => (
                            <span 
                              key={i} 
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                            >
                              {attr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg w-full">
                <p className="text-lg text-gray-700 mb-4">
                  We couldn&apos;t find strong matches based on your responses. Consider exploring a variety of clubs to discover what interests you!
                </p>
              </div>
            )}
            
            <div className="mt-8 flex flex-col items-center">
              <p className="text-gray-600 mb-4 text-center">
                Remember, this is just a starting point! Feel free to explore clubs outside your matches too.
              </p>
              <button
                onClick={resetQuiz}
                className="px-6 py-3 bg-[#0A2540] text-white font-medium rounded-lg hover:bg-[#0D2F4F] transition-colors"
              >
                Take Quiz Again
              </button>
            </div>
          </div>
        ) : null
      ) : (
        // Intro screen
        <EnhancedIntro onStartQuiz={startQuiz} />
      )}
    </div>
  );
};

export default ClubQuiz;