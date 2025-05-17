'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ControlsProps {
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  hasSelectedObject: boolean
  isCameraOn: boolean
  toggleCamera: () => void
}

export function Controls({ isPlaying, setIsPlaying, hasSelectedObject, isCameraOn, toggleCamera }: ControlsProps) {
  const [currentEffect, setCurrentEffect] = useState<string | null>(null);

  return (
    <>
      <AnimatePresence>
        {currentEffect && (
          <motion.div
            className="fixed inset-0 pointer-events-none flex items-center justify-center text-8xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => {
              setTimeout(() => setCurrentEffect(null), 1000);
            }}
          >
            {currentEffect}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 glass-panel px-6 py-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center space-x-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!hasSelectedObject}
            className={`glass-button text-2xl ${
              hasSelectedObject 
                ? 'text-white hover:text-white/90' 
                : 'text-white/40'
            }`}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const effects = ['🌈', '✨', '💫', '🎉', '🎸', '🎭', '🎪'];
              const randomEffect = effects[Math.floor(Math.random() * effects.length)];
              setCurrentEffect(randomEffect);
              setIsPlaying(true);
            }}
            disabled={!hasSelectedObject}
            className={`glass-button text-2xl ${
              hasSelectedObject 
                ? 'text-white hover:text-white/90' 
                : 'text-white/40'
            }`}
          >
            🎲
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              document.documentElement.classList.toggle('theme-fun');
            }}
            className="glass-button text-2xl text-white hover:text-white/90"
          >
            🎨
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleCamera}
            className="glass-button text-2xl text-white hover:text-white/90"
          >
            {isCameraOn ? '📷' : '🚫'}
          </motion.button>
        </div>
        
        {!hasSelectedObject && isCameraOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-sm text-white/60"
          >
            Select an object to start
          </motion.div>
        )}
        
        {!isCameraOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-sm text-white/60"
          >
            Camera is turned off
          </motion.div>
        )}
      </motion.div>
    </>
  )
} 