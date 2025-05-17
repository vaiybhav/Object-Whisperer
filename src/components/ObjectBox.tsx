'use client'

import React from 'react'
import { motion } from 'framer-motion'
import * as cocossd from '@tensorflow-models/coco-ssd'

interface ObjectBoxProps {
  object: cocossd.DetectedObject
  isSelected: boolean
  onSelect: () => void
}

export function ObjectBox({ object, isSelected, onSelect }: ObjectBoxProps) {
  const { bbox, class: label, score } = object
  const [x, y, width, height] = bbox
  
  return (
    <motion.div
      className={`absolute cursor-pointer ${
        isSelected 
          ? 'border-2 border-white shadow-glow' 
          : 'border border-white/40'
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        borderColor: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)'
      }}
      whileHover={{ 
        scale: 1.02,
        borderColor: 'rgba(255, 255, 255, 0.9)'
      }}
      onClick={onSelect}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`absolute -top-7 left-0 px-3 py-1 rounded-full text-xs font-medium
          ${isSelected ? 'glass-panel shadow-glow' : 'bg-black/40 backdrop-blur-sm'}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-white">
            {label}
          </span>
          <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-white/60'}`}>
            {Math.round(score * 100)}%
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
} 