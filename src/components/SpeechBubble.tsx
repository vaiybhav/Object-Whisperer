'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as cocossd from '@tensorflow-models/coco-ssd'

interface SpeechBubbleProps {
  object: cocossd.DetectedObject
  isPlaying: boolean
}

export function SpeechBubble({ object, isPlaying }: SpeechBubbleProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { bbox } = object
  const [x, y] = bbox
  
  useEffect(() => {
    if (!isPlaying) return
    
    const generateMessage = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/generate-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ object: object.class })
        })
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate message');
        }
        
        const data = await response.json()
        setMessage(data.message)
      } catch (error) {
        console.error('Error generating message:', error)
        setMessage('🤖 Oops! My AI brain needs a tune-up. Check the API key!')
      } finally {
        setIsLoading(false)
      }
    }
    
    generateMessage()
  }, [isPlaying, object.class])
  
  return (
    <AnimatePresence>
      {(isPlaying || isLoading) && (
        <motion.div
          className="absolute z-10 glass-panel p-4 max-w-xs"
          style={{
            left: `${x}px`,
            top: `${y - 120}px`,
          }}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        >
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4">
            <div className="w-full h-full bg-white/10 backdrop-blur-lg rotate-45 border-r border-b border-white/20" />
          </div>
          
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
                className="text-2xl"
              >
                🤔
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/80"
              >
                Thinking...
              </motion.div>
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/90 leading-relaxed"
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
} 