'use client'

import { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { motion } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import * as cocossd from '@tensorflow-models/coco-ssd'
import { CameraView } from '@/components/CameraView'
import { ObjectBox } from '@/components/ObjectBox'
import { SpeechBubble } from '@/components/SpeechBubble'
import { Controls } from '@/components/Controls'

export default function Home() {
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [detectedObjects, setDetectedObjects] = useState<cocossd.DetectedObject[]>([])
  const [selectedObject, setSelectedObject] = useState<cocossd.DetectedObject | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <main className="flex min-h-screen flex-col items-center p-6 relative">
      <motion.h1 
        className="text-5xl md:text-6xl gradient-text text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Object Whisperer
      </motion.h1>
      
      <motion.div 
        className="w-full max-w-4xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="glass-panel p-4">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <CameraView
              onObjectsDetected={setDetectedObjects}
              isModelLoading={isModelLoading}
              setIsModelLoading={setIsModelLoading}
            />
            
            {detectedObjects.map((object, index) => (
              <ObjectBox
                key={index}
                object={object}
                isSelected={selectedObject?.bbox === object.bbox}
                onSelect={() => setSelectedObject(object)}
              />
            ))}
            
            {selectedObject && (
              <SpeechBubble
                object={selectedObject}
                isPlaying={isPlaying}
              />
            )}
          </div>
          
          <div className="mt-4 text-center text-sm text-white/60">
            Point your camera at objects to bring them to life!
          </div>
        </div>
      </motion.div>

      <Controls
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        hasSelectedObject={!!selectedObject}
      />
    </main>
  )
} 