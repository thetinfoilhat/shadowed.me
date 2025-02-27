'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Animated text component that cycles between phrases
const AnimatedHeadline = () => {
  const phrases = [
    "find free opportunities",
    "discover their interests",
    "chase their passions"
  ];
  
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [phrases.length]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  const textVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.03,
      },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: -20,
      transition: {
        delay: i * 0.02,
      },
    }),
  };

  return (
    <motion.div 
      className="text-2xl md:text-4xl font-bold text-center mb-32"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col items-center justify-center">
        <h2 className="flex flex-col sm:flex-row items-center justify-center text-center gap-2">
          <span className="text-[#0A2540]">We help students</span>
          <div className="relative h-[40px] md:h-[50px] w-full sm:w-auto min-w-[200px] md:min-w-[300px] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="absolute text-[#2A8E9E] whitespace-normal sm:whitespace-nowrap text-center w-full"
                custom={currentIndex}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                <div className="flex justify-center">
                  {phrases[currentIndex].split("").map((char, i) => (
                    <motion.span
                      key={i}
                      variants={textVariants}
                      custom={i}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{ display: 'inline-block' }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </div>
                <motion.div
                  className="h-[2px] bg-gradient-to-r from-[#2A8E9E] to-[#38BFA1] mt-1"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </h2>
      </div>
      
      {/* Animated underline */}
      <motion.div 
        className="h-1 bg-gradient-to-r from-[#2A8E9E] to-[#38BFA1] rounded-full mx-auto mt-6"
        initial={{ width: 0 }}
        whileInView={{ width: "240px" }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      />
    </motion.div>
  );
};

export default AnimatedHeadline; 