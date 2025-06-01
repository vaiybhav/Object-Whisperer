'use client'

import React from 'react'
import { motion } from 'framer-motion'
import * as cocossd from '@tensorflow-models/coco-ssd'

interface ObjectBoxProps {
  object: cocossd.DetectedObject
  isSelected: boolean
  onSelect: () => void
  isDeepGaze?: boolean
}

export function ObjectBox({ object, isSelected, onSelect, isDeepGaze = false }: ObjectBoxProps) {
  const { bbox, class: label, score } = object
  const [x, y, width, height] = bbox
  
  const scorePercentage = Math.round(score * 100);
  
  // Generate border styles based on detection confidence and state
  const getBorderStyle = () => {
    // Calculate higher quality border style with corner markers
    const cornerStyles = {
      borderRadius: '0.5rem',
      background: `
        linear-gradient(to right, ${getBorderColor()} 4px, transparent 4px) 0 0,
        linear-gradient(to right, ${getBorderColor()} 4px, transparent 4px) 0 100%,
        linear-gradient(to left, ${getBorderColor()} 4px, transparent 4px) 100% 0,
        linear-gradient(to left, ${getBorderColor()} 4px, transparent 4px) 100% 100%,
        linear-gradient(to bottom, ${getBorderColor()} 4px, transparent 4px) 0 0,
        linear-gradient(to bottom, ${getBorderColor()} 4px, transparent 4px) 100% 0,
        linear-gradient(to top, ${getBorderColor()} 4px, transparent 4px) 0 100%,
        linear-gradient(to top, ${getBorderColor()} 4px, transparent 4px) 100% 100%
      `,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '20px 20px',
      border: `2px solid ${getBorderColor()}`
    };
    
    return cornerStyles;
  };
  
  // Get appropriate colors based on detection confidence and current state
  const getBorderColor = () => {
    if (isDeepGaze) {
      return isSelected ? 'rgba(139, 195, 74, 0.9)' : 'rgba(139, 195, 74, 0.65)';
    }
    return isSelected ? 'rgba(236, 72, 153, 0.9)' : 'rgba(139, 92, 246, 0.7)';
  };
  
  const getBackgroundColor = () => {
    if (isDeepGaze) {
      return isSelected ? 'rgba(139, 195, 74, 0.15)' : 'rgba(139, 195, 74, 0.05)';
    }
    return isSelected ? 'rgba(236, 72, 153, 0.1)' : 'rgba(139, 92, 246, 0.05)';
  };
  
  const getBoxShadow = () => {
    if (isDeepGaze) {
      return isSelected 
        ? '0 0 15px rgba(139, 195, 74, 0.7), 0 0 1px rgba(139, 195, 74, 0.9) inset' 
        : '0 0 8px rgba(139, 195, 74, 0.4)';
    }
    return isSelected 
      ? '0 0 15px rgba(236, 72, 153, 0.7)' 
      : '0 0 8px rgba(139, 92, 246, 0.4)';
  };
  
  const getHoverBoxShadow = () => {
    if (isDeepGaze) {
      return isSelected 
        ? '0 0 20px rgba(139, 195, 74, 0.8), 0 0 2px rgba(139, 195, 74, 1) inset' 
        : '0 0 12px rgba(139, 195, 74, 0.6)';
    }
    return isSelected 
      ? '0 0 20px rgba(236, 72, 153, 0.9)' 
      : '0 0 12px rgba(139, 92, 246, 0.6)';
  };
  
  const getLabelStyle = () => {
    if (isDeepGaze) {
      return isSelected 
        ? 'bg-green-600 text-white deep-gaze-label'
        : 'bg-green-700/80 backdrop-blur-sm text-gray-100 group-hover:bg-green-600';
    }
    return isSelected 
      ? 'bg-pink-500 text-white object-box-selected'
      : 'bg-purple-600/80 backdrop-blur-sm text-gray-100 group-hover:bg-purple-500';
  };

  return (
    <motion.div
      className={`absolute cursor-pointer group transform transition-all duration-200 ease-in-out`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: getBackgroundColor(),
        ...getBorderStyle()
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        boxShadow: getBoxShadow(),
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: getHoverBoxShadow(),
      }}
      onClick={onSelect}
      transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.div
        className={`absolute -top-8 left-0 px-2.5 py-1 rounded-md text-xs font-medium 
          shadow-lg transition-all duration-200 ease-in-out ${getLabelStyle()}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <div className="flex items-center space-x-1.5">
          <span className="capitalize">
            {label}
          </span>
          <span className={`font-semibold ${
            isDeepGaze
              ? (isSelected ? 'text-white' : 'text-green-200 group-hover:text-white')
              : (isSelected ? 'text-white' : 'text-purple-200 group-hover:text-white')
          }`}>
            {scorePercentage}%
          </span>
        </div>
      </motion.div>
      
      {/* Pulse effect on selected objects */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3], 
            scale: [0.95, 1.02, 0.95] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5,
            ease: "easeInOut"
          }}
          style={{
            backgroundColor: 'transparent',
            border: `2px solid ${isDeepGaze ? 'rgba(139, 195, 74, 0.7)' : 'rgba(236, 72, 153, 0.7)'}`
          }}
        />
      )}
    </motion.div>
  )
} 