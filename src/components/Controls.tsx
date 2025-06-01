'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlay, FaPause, FaPalette, FaCamera } from 'react-icons/fa'
import { FiCameraOff, FiInfo, FiTarget } from 'react-icons/fi'

interface ControlsProps {
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  hasSelectedObject: boolean
  isCameraOn: boolean
  toggleCamera: () => void
  isDeepGaze: boolean
  setIsDeepGaze: (deepGaze: boolean) => void
}

export function Controls({ 
  isPlaying, 
  setIsPlaying, 
  hasSelectedObject, 
  isCameraOn, 
  toggleCamera,
  isDeepGaze,
  setIsDeepGaze
}: ControlsProps) {
  const [currentEffect, setCurrentEffect] = useState<string | null>(null);
  const iconSize = 18;

  const buttonVariants = {
    hover: { scale: 1.15, y: -3, transition: { type: 'spring', stiffness: 400, damping: 15 } },
    tap: { scale: 1.05, y: -1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
  };

  const focusButtonVariants = {
    hover: { 
      scale: 1.2, 
      y: -4, 
      rotate: [0, 5, -5, 5, 0],
      boxShadow: "0px 0px 18px rgba(139, 195, 74, 0.7)",
      transition: { type: 'spring', stiffness: 350, damping: 10 } 
    },
    tap: { 
      scale: 1.1, 
      y: -2,
      transition: { type: 'spring', stiffness: 400, damping: 15 } 
    },
  };

  const helperTextAnimation = {
    initial: { opacity: 0, y: 10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20, delay: 0.1 } },
    exit: { opacity: 0, y: 8, scale: 0.95, transition: { duration: 0.15 } },
  };

  return (
    <>
      <AnimatePresence>
        {currentEffect && (
          <motion.div
            className="fixed inset-0 pointer-events-none flex items-center justify-center text-8xl md:text-9xl z-50 opacity-80"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1, rotate: [0, -5, 5, -5, 0] }}
            exit={{ opacity: 0, scale: 1.5, rotate: 15 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onAnimationComplete={() => setTimeout(() => setCurrentEffect(null), 800)}
          >
            {currentEffect}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-0 left-0 right-0 controls-bar-panel flex items-center justify-center z-30"
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ type: 'spring', stiffness: 250, damping: 30, delay: 0.5 }}
      >
        <div className="flex items-center space-x-3 sm:space-x-4">
          {[ 
            { id: 'playPause', action: () => setIsPlaying(!isPlaying), disabled: !hasSelectedObject, title: isPlaying ? "Pause" : "Play", icon: isPlaying ? <FaPause size={iconSize} /> : <FaPlay size={iconSize} /> },
            { 
              id: 'deepGaze', 
              action: () => { 
                setIsDeepGaze(!isDeepGaze);
                
                if (!isDeepGaze && !isPlaying && hasSelectedObject) {
                  setIsPlaying(true);
                }
                
                if (hasSelectedObject && !isDeepGaze) {
                  setCurrentEffect('🎯');
                }
              }, 
              disabled: !hasSelectedObject,
              title: isDeepGaze ? "Exit Deep Gaze" : "Deep Gaze",
              icon: <FiTarget size={iconSize} className={isDeepGaze ? "text-green-400" : ""} />,
              isFocusButton: true,
              isActive: isDeepGaze
            },
            { id: 'toggleTheme', action: () => document.documentElement.classList.toggle('theme-fun'), title: "Toggle Theme", icon: <FaPalette size={iconSize} /> },
            { id: 'toggleCamera', action: toggleCamera, title: isCameraOn ? "Turn Camera Off" : "Turn Camera On", icon: isCameraOn ? <FaCamera size={iconSize} /> : <FiCameraOff size={iconSize} /> },
          ].map(btn => (
            <motion.button
              key={btn.id}
              variants={btn.isFocusButton ? focusButtonVariants : buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={btn.action}
              disabled={btn.disabled}
              className={`premium-glass-button ${btn.isFocusButton ? 'focus-button-enhanced' : ''} ${btn.isActive ? 'button-active' : ''}`}
              title={btn.title}
            >
              {btn.icon}
            </motion.button>
          ))}
        </div>

        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <AnimatePresence>
            {(!hasSelectedObject && isCameraOn) && (
                <motion.div {...helperTextAnimation} className="helper-text-bubble">
                    <FiInfo size={13} className="mr-1.5 opacity-70"/> Select an object to start
                </motion.div>
            )}
            </AnimatePresence>
            <AnimatePresence>
            {!isCameraOn && (
                <motion.div {...helperTextAnimation} className="helper-text-bubble">
                <FiInfo size={13} className="mr-1.5 opacity-70"/> Camera is off
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        <style jsx global>{`
          .button-active {
            background-color: rgba(139, 195, 74, 0.3) !important;
            box-shadow: 0 0 12px rgba(139, 195, 74, 0.5), 0 0 5px rgba(139, 195, 74, 0.3) inset !important;
            border-color: rgba(139, 195, 74, 0.6) !important;
          }
        `}</style>
      </motion.div>
    </>
  )
} 