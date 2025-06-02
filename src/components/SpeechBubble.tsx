'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as cocossd from '@tensorflow-models/coco-ssd'
import { FiMessageCircle, FiLoader, FiAlertTriangle } from 'react-icons/fi'

interface SpeechBubbleProps {
  object: cocossd.DetectedObject
  isPlaying: boolean
  isDeepGaze?: boolean
}

export function SpeechBubble({ object, isPlaying, isDeepGaze = false }: SpeechBubbleProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const isMobileDevice = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { bbox, class: objectClass } = object
  const [x, y, width] = bbox
  
  const bubbleWidth = isMobile ? '100%' : 288;
  const bubbleHeight = isDeepGaze ? 160 : 120;
  const objectCenterX = x + width / 2;
  
  // Only calculate position if not mobile
  let bubbleX = isMobile ? 0 : objectCenterX - (typeof bubbleWidth === 'number' ? bubbleWidth : 288) / 2;
  let bubbleY = isMobile ? 0 : y - bubbleHeight - 15;
  
  if (!isMobile && typeof window !== "undefined") {
    if (bubbleX < 10) bubbleX = 10;
    if (bubbleX + (typeof bubbleWidth === 'number' ? bubbleWidth : 288) > window.innerWidth - 10) {
      bubbleX = window.innerWidth - (typeof bubbleWidth === 'number' ? bubbleWidth : 288) - 10;
    }
    if (bubbleY < 10) bubbleY = y + bbox[3] + 15;
  }
  
  useEffect(() => {
    if (!isPlaying || !objectClass) return
    
    const generateMessage = async () => {
      setIsLoading(true)
      setError(null);
      try {
        const response = await fetch('/api/generate-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            object: objectClass,
            isDeepGaze
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate message');
        }
        
        const data = await response.json()
        setMessage(data.message)
      } catch (err: any) {
        console.error('Error generating message:', err)
        setError(err.message || 'AI brain freeze! Try again?')
        setMessage('')
      } finally {
        setIsLoading(false)
      }
    }
    
    generateMessage()
  }, [isPlaying, objectClass, isDeepGaze])
  
  const tailVariants = {
    hidden: { opacity: 0, pathLength: 0 },
    visible: {
      opacity: 1,
      pathLength: 1,
      transition: { duration: 0.5, ease: "easeInOut", delay: 0.3 },
    },
  };

  if (!isPlaying && !isLoading && !error) return null;

  return (
    <AnimatePresence>
      {(isPlaying || isLoading || error) && (
        <motion.div
          className={`${isMobile ? 'w-full' : 'absolute z-20 w-72'} speech-bubble-fun ${isDeepGaze ? 'deep-gaze-bubble' : ''}`}
          style={!isMobile ? {
            left: `${bubbleX}px`,
            top: `${bubbleY}px`,
          } : undefined}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10, transition: {duration: 0.2}} }
          transition={{ 
            type: "spring",
            stiffness: 350,
            damping: 25
          }}
        >
          {!isMobile && (
            <svg 
              width="20" 
              height="10" 
              className={`absolute left-1/2 transform -translate-x-1/2 bottom-[-9px] ${isDeepGaze ? 'text-green-700/70' : 'text-purple-700/70 dark:text-gray-800/70'} fill-current`}
            >
              <motion.path 
                d="M0 0 L10 10 L20 0 Z" 
                variants={tailVariants}
                initial="hidden"
                animate="visible"
                className="filter drop-shadow-sm"
              />
            </svg>
          )}

          <div className={`${isDeepGaze ? 'bg-green-700/70' : 'bg-purple-700/70 dark:bg-gray-800/70'} backdrop-blur-md p-4 rounded-xl shadow-2xl ring-1 ring-white/10 min-h-[80px] flex flex-col justify-center items-center`}>
            {isLoading ? (
              <motion.div 
                className="flex flex-col items-center space-y-2 text-purple-200 dark:text-gray-300"
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              >
                <FiLoader className="animate-spin text-3xl" />
                <p className="text-sm font-medium">
                  {isDeepGaze ? "Analyzing deeply..." : "Whispering..."}
                </p>
              </motion.div>
            ) : error ? (
              <motion.div 
                className="flex flex-col items-center space-y-2 text-red-400 p-2"
                initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              >
                <FiAlertTriangle className="text-3xl mb-1"/>
                <p className="text-sm font-semibold text-center">Oops!</p>
                <p className="text-xs text-red-300/80 text-center">{error}</p>
              </motion.div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-white leading-relaxed text-center"
              >
                <FiMessageCircle className="inline mr-2 mb-0.5 opacity-70" />
                {message}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 