import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      
      if (!answer) return false;
      
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
      
      // Group matches by category for better organization
      const categorizedMatches = topMatches.length > 0 ? topMatches : results.slice(0, 5);
      
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
        setClubMatches(matches);
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
      return 3; // Safe default
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
                    <input
                      type="range"
                      min={currentQuestion.min || 1}
                      max={currentQuestion.max || 5}
                      value={getSliderValue(currentQuestion.id)}
                      onChange={(e) => handleSliderChange(currentQuestion.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                    />
                    <div className="mt-6 text-center">
                      <motion.span 
                        key={getSliderValue(currentQuestion.id)}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-block px-6 py-3 bg-gradient-to-r from-[#3B82F6]/20 to-[#38BFA1]/20 rounded-full font-medium text-[#3B82F6] shadow-sm"
                      >
                        {getSliderValue(currentQuestion.id)}
                      </motion.span>
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