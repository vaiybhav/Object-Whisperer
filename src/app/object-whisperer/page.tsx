'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as cocossd from '@tensorflow-models/coco-ssd'
import { CameraView } from '@/components/CameraView'
import { ObjectBox } from '@/components/ObjectBox'
import { SpeechBubble } from '@/components/SpeechBubble'
import { Controls } from '@/components/Controls'
import { FiCameraOff, FiLoader, FiZap } from 'react-icons/fi'

const Particle = ({ delay }: { delay: number }) => {
  const size = Math.random() * 8 + 4; // Smaller, more varied sizes
  const randomXStart = Math.random() * 100;
  const randomYStart = Math.random() * 100;
  const randomXEnd = randomXStart + (Math.random() - 0.5) * 40; // Drift less aggressively
  const randomYEnd = randomYStart + (Math.random() - 0.5) * 40;

  return (
    <motion.div
      className="absolute rounded-full bg-purple-300/15 filter blur-[1px]" // Softer color, low opacity, subtle blur
      initial={{ opacity: 0, scale: 0, x: `${randomXStart}vw`, y: `${randomYStart}vh` }}
      animate={{
        opacity: [0, Math.random() * 0.4 + 0.1, 0], // More subtle opacity flicker
        scale: [0, Math.random() * 0.7 + 0.2, 0], // Subtle scaling
        x: [`${randomXStart}vw`, `${randomXEnd}vw`],
        y: [`${randomYStart}vh`, `${randomYEnd}vh`],
      }}
      transition={{
        duration: Math.random() * 10 + 8, // Slightly faster, more varied duration for twinkling
        repeat: Infinity,
        repeatType: "mirror",
        delay: delay,
        ease: "circInOut" // Smoother easing
      }}
      style={{ 
          width: size + 'px', 
          height: size + 'px' 
      }}
    />
  );
}

export default function ObjectWhispererPage() {
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [detectedObjects, setDetectedObjects] = useState<cocossd.DetectedObject[]>([])
  const [selectedObject, setSelectedObject] = useState<cocossd.DetectedObject | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [isDeepGaze, setIsDeepGaze] = useState(false)

  const mainContainerRef = useRef<HTMLDivElement>(null)

  const [isMobile, setIsMobile] = useState(false)
  
  // Detect if device is mobile
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

  useEffect(() => {
    if (!isModelLoading && typeof window !== 'undefined') {
        cocossd.load().then(() => console.log("COCO-SSD preloaded or loaded"))
    }
  }, [isModelLoading])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isCameraOn && !isModelLoading && detectedObjects.length === 0 && !selectedObject) {
      timer = setTimeout(() => setShowHint(true), 7000)
    } else {
      setShowHint(false)
    }
    return () => clearTimeout(timer)
  }, [isCameraOn, isModelLoading, detectedObjects.length, selectedObject])

  const [rotate, setRotate] = useState({ x: 0, y: 0 })
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!mainContainerRef.current) return
    const rect = mainContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rotateY = (x / (rect.width / 2)) * 6 // Reduced rotation intensity slightly
    const rotateX = -(y / (rect.height / 2)) * 6 // Reduced rotation intensity slightly
    setRotate({ x: rotateX, y: rotateY })
  }
  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 })
  }

  const numParticles = 25 // Increased particle count for a richer feel

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-3 sm:p-4 md:p-5 bg-[#0D081A] text-slate-200 overflow-hidden relative isolate">
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 pointer-events-none radial-gradient-overlay opacity-30"></div>
      <style jsx global>{`
        .radial-gradient-overlay {
          background: radial-gradient(ellipse at center, rgba(128, 0, 128, 0.3) 0%, rgba(13, 8, 26, 0) 70%);
        }
        .object-whisperer-title span.gradient-text {
            filter: drop-shadow(0 0 10px rgba(192, 132, 252, 0.7)); /* Enhanced violet glow */
        }
        .camera-view-container {
          aspect-ratio: 16/9;
        }
        @media (max-width: 640px) {
          .camera-view-container {
            aspect-ratio: 16/9;
            height: 40vh;
            width: 100%;
            margin: 0 auto;
          }
        }
        .camera-view-container:hover {
            box-shadow: 0 0 25px rgba(192, 132, 252, 0.4), 0 0 10px rgba(220, 200, 255, 0.3) inset;
            border-color: rgba(192, 132, 252, 0.7);
        }
        .camera-off-indicator .icon {
            filter: drop-shadow(0 0 12px rgba(192, 132, 252, 0.7));
        }
        .loading-indicator .icon {
             filter: drop-shadow(0 0 12px rgba(192, 132, 252, 0.8));
        }
        .deep-gaze-active {
          box-shadow: 0 0 30px rgba(139, 195, 74, 0.4), 0 0 15px rgba(139, 195, 74, 0.2) inset !important;
          border-color: rgba(139, 195, 74, 0.6) !important;
        }
        .mobile-response {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          width: 100% !important;
          margin-top: 1rem;
        }
      `}</style>

      {[...Array(numParticles)].map((_, i) => <Particle key={i} delay={Math.random() * 7} />)}
      
      <motion.header 
        className="w-full py-3 sm:py-4 md:py-5 text-center z-10"
        initial={{ opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 25, delay: 0.2 }}
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter object-whisperer-title leading-tight">
          Object <span className="gradient-text">Whisperer</span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-400/90 mt-1.5 sm:mt-2 max-w-lg md:max-w-xl mx-auto">
          Unveil the unseen narratives around you. Engage your camera, and let the symphony of objects begin.
        </p>
      </motion.header>

      <motion.main 
        ref={mainContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          transformStyle: "preserve-3d",
          transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` // Increased perspective
        }}
        className="flex-grow w-full max-w-4xl lg:max-w-5xl flex flex-col items-center justify-center my-3 sm:my-4 md:my-5 z-10 transition-transform duration-150 ease-out" // Faster transform transition
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div 
          className={`w-full camera-view-container bg-black/50 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl relative ring-1 ring-purple-500/40 transition-all duration-300 hover:ring-purple-300/70 ${isDeepGaze ? 'deep-gaze-active' : ''}`} // Added conditional class
          style={{ transform: "translateZ(25px)" }} // Slightly more Z translation
          whileHover={{ scale: 1.015 }} // Slightly more pronounced hover scale
        >
          {isCameraOn ? (
            <>
              <CameraView
                onObjectsDetected={setDetectedObjects}
                isModelLoading={isModelLoading}
                setIsModelLoading={setIsModelLoading}
                isCameraOn={isCameraOn}
              />
              {detectedObjects.map((object, index) => (
                <ObjectBox
                  key={index}
                  object={object}
                  isSelected={selectedObject?.bbox.join(',') === object.bbox.join(',')}
                  onSelect={() => setSelectedObject(object)}
                  isDeepGaze={isDeepGaze}
                />
              ))}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 camera-off-indicator bg-gradient-to-br from-gray-800/80 to-gray-900/70 p-4 backdrop-blur-sm">
              <FiCameraOff size={72} className="mb-5 opacity-60 icon text-purple-300/90" />
              <p className="text-xl sm:text-2xl font-semibold">Camera is Inactive</p>
              <p className="text-sm sm:text-base text-slate-400/90 mt-1.5 text-center max-w-xs">
                Activate the camera via the controls below to begin exploring.
              </p>
            </div>
          )}

          {isModelLoading && isCameraOn && (
            <motion.div 
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-10 p-4 loading-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FiLoader className="animate-spin text-purple-300 text-5xl sm:text-6xl mb-3 sm:mb-4 icon" />
              <p className="text-base sm:text-lg md:text-xl text-slate-100 font-medium">Initializing AI Vision...</p>
              <p className="text-xs sm:text-sm text-slate-400/80 mt-1">Please hold on, magic is loading.</p>
            </motion.div>
          )}
          
          {/* Mobile Response Container */}
          {isMobile && selectedObject && isCameraOn && (
            <div className="w-full mt-4">
              <SpeechBubble
                object={selectedObject}
                isPlaying={isPlaying}
                isDeepGaze={isDeepGaze}
              />
            </div>
          )}

          {/* Desktop Response */}
          {!isMobile && selectedObject && isCameraOn && (
            <SpeechBubble
              object={selectedObject}
              isPlaying={isPlaying}
              isDeepGaze={isDeepGaze}
            />
          )}
        </motion.div>

        <AnimatePresence>
          {showHint && (
             <motion.div 
              initial={{ opacity: 0, y: 20, scale:0.9 }}
              animate={{ opacity: 1, y: 0, scale:1 }}
              exit={{ opacity: 0, y:10, scale:0.9 }}
              transition={{type: "spring", stiffness:200, damping:15}}
              className="mt-4 sm:mt-5 text-center text-purple-300/90 text-xs sm:text-sm bg-purple-900/40 backdrop-blur-sm px-3.5 py-2 rounded-full shadow-xl flex items-center ring-1 ring-purple-500/40"
            >
              <FiZap size={15} className="mr-2 opacity-90 text-yellow-300 filter drop-shadow-[0_0_5px_#facc15]"/> Point your camera at objects to detect them!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      <Controls
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        hasSelectedObject={!!selectedObject}
        isCameraOn={isCameraOn}
        toggleCamera={() => {
          setIsCameraOn(!isCameraOn)
          if (isCameraOn) {
            setDetectedObjects([])
            setSelectedObject(null)
            setIsDeepGaze(false)
          }
        }}
        isDeepGaze={isDeepGaze}
        setIsDeepGaze={setIsDeepGaze}
      />
    </div>
  )
}