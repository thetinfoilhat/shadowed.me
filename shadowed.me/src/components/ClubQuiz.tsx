import { useState } from 'react';

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
};

// Sample club data (you can replace this later)
const clubs: Club[] = [
  { 
    name: "DECA", 
    attributes: ["business", "competitive", "teamwork", "public speaking"],
    description: "Business club focused on entrepreneurship, marketing, finance, and hospitality."
  },
  { 
    name: "Key Club", 
    attributes: ["volunteering", "community service", "leadership"],
    description: "International service program for high school students, focused on community service."
  },
  { 
    name: "Math Team", 
    attributes: ["math", "competitive", "problem-solving", "analytical"],
    description: "Compete in mathematics competitions and develop advanced problem-solving skills."
  },
  { 
    name: "Robotics Club", 
    attributes: ["engineering", "teamwork", "problem-solving", "coding", "technology", "hands-on"],
    description: "Design, build, and program robots for competitions and real-world applications."
  },
  { 
    name: "Drama Club", 
    attributes: ["acting", "performance", "creativity", "artistic", "teamwork"],
    description: "Perform in plays and musicals while developing acting and stage production skills."
  },
  { 
    name: "Science Olympiad", 
    attributes: ["science", "experiments", "competitive", "problem-solving", "teamwork"],
    description: "Compete in science-related events covering various scientific disciplines."
  },
  { 
    name: "Debate Club", 
    attributes: ["public speaking", "research", "competitive", "analytical", "communication"],
    description: "Develop argumentation and public speaking skills through competitive debates."
  },
  { 
    name: "Environmental Club", 
    attributes: ["environmental", "community service", "science", "hands-on", "collaborative"],
    description: "Work on projects to improve the environment and raise awareness about environmental issues."
  },
  { 
    name: "Student Council", 
    attributes: ["leadership", "teamwork", "management", "public speaking", "organized"],
    description: "Represent the student body and organize school events and initiatives."
  },
  { 
    name: "Newspaper/Journalism", 
    attributes: ["writing", "communication", "creative", "teamwork", "research"],
    description: "Report on school events and create content for the school newspaper or website."
  },
  { 
    name: "Art Club", 
    attributes: ["artistic", "creative", "hands-on", "independent"],
    description: "Express yourself through various art forms and techniques in a supportive environment."
  },
  { 
    name: "Coding Club", 
    attributes: ["coding", "technology", "problem-solving", "engineering", "analytical"],
    description: "Learn programming languages and develop software projects with fellow coding enthusiasts."
  },
  { 
    name: "Model UN", 
    attributes: ["public speaking", "research", "leadership", "teamwork", "analytical"],
    description: "Simulate United Nations committees and debate global issues as representatives of different countries."
  },
  { 
    name: "Chess Club", 
    attributes: ["analytical", "problem-solving", "competitive", "strategic", "independent"],
    description: "Learn and play chess while developing strategic thinking and problem-solving skills."
  },
  { 
    name: "Music Ensemble", 
    attributes: ["performance", "artistic", "creative", "teamwork", "structured"],
    description: "Perform music in a group setting, developing musical skills and teamwork."
  }
];

// Sample questions
const questions: Question[] = [
  {
    id: 1,
    text: "Do you enjoy public speaking?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["public speaking"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 2,
    text: "Do you like working in a team or alone?",
    type: "multiple-choice",
    options: [
      { label: "Team", value: "team", attributes: ["teamwork"] },
      { label: "Alone", value: "alone", attributes: ["independent"] },
      { label: "Both", value: "both", attributes: ["teamwork", "independent"] }
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
      1: [],
      2: [],
      3: [],
      4: ["competitive"],
      5: ["competitive", "high-intensity"]
    }
  },
  {
    id: 4,
    text: "Do you enjoy solving complex problems?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["problem-solving"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 5,
    text: "Are you interested in business or finance?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["business", "finance"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 6,
    text: "Do you like volunteering and helping the community?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["volunteering", "community service"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 7,
    text: "Do you prefer structured projects or creative freedom?",
    type: "multiple-choice",
    options: [
      { label: "Structured", value: "structured", attributes: ["structured", "organized"] },
      { label: "Creative", value: "creative", attributes: ["creative", "artistic"] },
      { label: "Both", value: "both", attributes: ["structured", "creative", "adaptable"] }
    ]
  },
  {
    id: 8,
    text: "How much do you enjoy technology and coding?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "I love it!",
    attributes: {
      1: [],
      2: [],
      3: ["technology"],
      4: ["technology", "coding"],
      5: ["technology", "coding", "engineering"]
    }
  },
  {
    id: 9,
    text: "Are you more interested in arts, science, or leadership?",
    type: "multiple-choice",
    options: [
      { label: "Arts", value: "arts", attributes: ["creativity", "artistic", "performance"] },
      { label: "Science", value: "science", attributes: ["science", "analytical", "experiments"] },
      { label: "Leadership", value: "leadership", attributes: ["leadership", "management"] }
    ]
  },
  {
    id: 10,
    text: "How important is it for you to express yourself creatively?",
    type: "slider",
    min: 1,
    max: 5,
    minLabel: "Not important",
    maxLabel: "Very important",
    attributes: {
      1: [],
      2: [],
      3: ["creative"],
      4: ["creative", "artistic"],
      5: ["creative", "artistic", "performance"]
    }
  },
  {
    id: 11,
    text: "Which subjects do you enjoy most in school?",
    type: "multiple-choice",
    options: [
      { label: "Math", value: "math", attributes: ["math", "analytical"] },
      { label: "Science", value: "science", attributes: ["science", "experiments"] },
      { label: "English/Literature", value: "english", attributes: ["writing", "creative"] },
      { label: "History/Social Studies", value: "history", attributes: ["research", "analytical"] },
      { label: "Arts", value: "arts", attributes: ["artistic", "creative"] }
    ]
  },
  {
    id: 12,
    text: "Do you enjoy writing or journalism?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["writing", "communication"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 13,
    text: "How do you feel about participating in competitions?",
    type: "multiple-choice",
    options: [
      { label: "Love them", value: "love", attributes: ["competitive", "high-intensity"] },
      { label: "Enjoy occasionally", value: "sometimes", attributes: ["competitive"] },
      { label: "Prefer to avoid", value: "avoid", attributes: ["collaborative", "non-competitive"] }
    ]
  },
  {
    id: 14,
    text: "Are you interested in environmental issues?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["environmental", "science", "community service"] },
      { label: "No", value: "no", attributes: [] }
    ]
  },
  {
    id: 15,
    text: "Do you enjoy building or making things with your hands?",
    type: "yes-no",
    options: [
      { label: "Yes", value: "yes", attributes: ["hands-on", "engineering", "creative"] },
      { label: "No", value: "no", attributes: [] }
    ]
  }
];

const ClubQuiz: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [clubMatches, setClubMatches] = useState<ClubMatch[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [skipsRemaining, setSkipsRemaining] = useState(3); // Allow 3 skips

  // Calculate progress percentage
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  // Handle Yes/No and Multiple Choice answers
  const handleOptionSelect = (questionId: number, optionValue: string, selected: boolean) => {
    setAnswers(prevAnswers => {
      const questionIndex = prevAnswers.findIndex(a => a.questionId === questionId);
      
      if (questionIndex === -1) {
        // Question hasn't been answered yet
        return [...prevAnswers, {
          questionId,
          selectedOptions: selected ? [optionValue] : []
        }];
      } else {
        // Update existing answer
        const updatedAnswers = [...prevAnswers];
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
        
        return updatedAnswers;
      }
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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      // Quiz completed
      calculateResults();
      setQuizCompleted(true);
    }
  };

  // Skip current question
  const handleSkip = () => {
    if (skipsRemaining > 0 && currentQuestionIndex < questions.length - 1) {
      setSkipsRemaining(prev => prev - 1);
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };

  // Check if current question has been answered
  const isCurrentQuestionAnswered = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const answer = answers.find(a => a.questionId === currentQuestion.id);
    
    if (!answer) return false;
    
    if (currentQuestion.type === 'slider') {
      return answer.sliderValue !== undefined;
    } else {
      return answer.selectedOptions && answer.selectedOptions.length > 0;
    }
  };

  // Calculate quiz results
  const calculateResults = () => {
    // Collect all user attributes from answers
    const attributes: string[] = [];
    
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      
      if (question?.type === 'slider' && answer.sliderValue !== undefined) {
        // Get attributes for the slider value
        const sliderAttributes = question.attributes?.[answer.sliderValue] || [];
        attributes.push(...sliderAttributes);
      } else if (answer.selectedOptions && answer.selectedOptions.length > 0) {
        // Get attributes for selected options
        answer.selectedOptions.forEach(optionValue => {
          const option = question?.options?.find(opt => opt.value === optionValue);
          if (option) {
            attributes.push(...option.attributes);
          }
        });
      }
    });
    
    // Remove duplicates
    const uniqueAttributes = [...new Set(attributes)];
    
    // Match clubs based on attributes
    const matches: ClubMatch[] = clubs.map(club => {
      const matchedAttributes = club.attributes.filter(attr => 
        uniqueAttributes.includes(attr)
      );
      
      return {
        club,
        score: matchedAttributes.length,
        matchedAttributes
      };
    });
    
    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);
    setClubMatches(matches);
  };

  // Reset the quiz
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizCompleted(false);
    setClubMatches([]);
    setSkipsRemaining(3); // Reset skips
  };

  // Get the current question
  const currentQuestion = questions[currentQuestionIndex];

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
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {!isStarted ? (
        // Quiz intro screen
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">
            Find Your Perfect Club Match
          </h2>
          <p className="text-gray-600 mb-8">
            Answer a few questions about your interests and preferences, and we&apos;ll suggest clubs that might be a great fit for you!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You can skip up to 3 questions if you&apos;re not sure about an answer.
          </p>
          <button
            onClick={startQuiz}
            className="bg-[#38BFA1] text-white px-8 py-3 rounded-lg hover:bg-[#2DA891] transition-colors"
          >
            Start Quiz
          </button>
        </div>
      ) : !quizCompleted ? (
        // Quiz questions
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
              Question {currentQuestionIndex + 1} of {questions.length}
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
              <div className="flex gap-4">
                {currentQuestion.options?.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(
                      currentQuestion.id, 
                      option.value, 
                      !isOptionSelected(currentQuestion.id, option.value)
                    )}
                    className={`px-6 py-3 rounded-lg border transition-colors ${
                      isOptionSelected(currentQuestion.id, option.value)
                        ? 'bg-[#38BFA1] text-white border-[#38BFA1]'
                        : 'bg-white text-[#0A2540] border-gray-200 hover:border-[#38BFA1]/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            
            {currentQuestion.type === 'multiple-choice' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentQuestion.options?.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(
                      currentQuestion.id, 
                      option.value, 
                      !isOptionSelected(currentQuestion.id, option.value)
                    )}
                    className={`px-6 py-3 rounded-lg border transition-colors ${
                      isOptionSelected(currentQuestion.id, option.value)
                        ? 'bg-[#38BFA1] text-white border-[#38BFA1]'
                        : 'bg-white text-[#0A2540] border-gray-200 hover:border-[#38BFA1]/50'
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
                <div className="mt-2 text-center font-medium text-[#0A2540]">
                  {getSliderValue(currentQuestion.id)}
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2 rounded-lg transition-colors ${
                currentQuestionIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-[#0A2540] hover:bg-gray-200'
              }`}
            >
              Previous
            </button>
            
            {skipsRemaining > 0 && currentQuestionIndex < questions.length - 1 && (
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
              {currentQuestionIndex < questions.length - 1 ? 'Next' : 'See Results'}
            </button>
          </div>
        </div>
      ) : (
        // Results screen
        <div className="bg-white rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <h2 className="text-2xl font-semibold text-[#0A2540] mb-4">
            Your Club Matches
          </h2>
          
          {clubMatches.length > 0 && clubMatches[0].score > 0 ? (
            <div className="space-y-6">
              <p className="text-gray-600 mb-6">
                Based on your responses, here are the clubs that match your interests:
              </p>
              
              {clubMatches.map((match, index) => (
                match.score > 0 && (
                  <div 
                    key={match.club.name}
                    className={`p-6 rounded-lg border transition-all ${
                      index === 0 
                        ? 'border-[#38BFA1] bg-[#38BFA1]/5' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-medium text-[#0A2540] mb-2">
                          {match.club.name}
                          {index === 0 && (
                            <span className="ml-2 text-sm bg-[#38BFA1]/20 text-[#38BFA1] px-2 py-0.5 rounded-full">
                              Best Match
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {match.club.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {match.matchedAttributes.map(attr => (
                            <span 
                              key={attr}
                              className="text-xs bg-[#38BFA1]/10 text-[#38BFA1] px-2 py-1 rounded-full"
                            >
                              {attr}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#38BFA1]">
                          {Math.round((match.score / match.club.attributes.length) * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">match</div>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-[#38BFA1]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-xl font-medium text-[#0A2540] mb-4">
                No Strong Matches Found
              </h3>
              <p className="text-gray-600 mb-6">
                We couldn&apos;t find clubs that strongly match your preferences. Consider exploring a variety of clubs to discover new interests!
              </p>
            </div>
          )}
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={resetQuiz}
              className="bg-[#38BFA1] text-white px-6 py-2 rounded-lg hover:bg-[#2DA891] transition-colors"
            >
              Take Quiz Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubQuiz; 