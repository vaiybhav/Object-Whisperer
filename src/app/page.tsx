'use client'

import Link from 'next/link'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { FiArrowRight, FiEye, FiMic, FiCoffee } from 'react-icons/fi' // added coffee because why not
import { useState, useEffect } from 'react'

// A little easter egg - objects start whispering to you if you stay too long
const whispers = [
  "psst... hey you...",
  "we've been waiting...",
  "your coffee mug misses you...",
  "what secrets do your socks hold?",
]

export default function LandingPage() {
  // Track how long they've been here... watching... waiting...
  const [whisperIndex, setWhisperIndex] = useState(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  // Initialize transforms with default values
  const rotateX = useTransform(mouseY, [0, dimensions.height], [5, -5])
  const rotateY = useTransform(mouseX, [0, dimensions.width], [-5, 5])

  useEffect(() => {
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    })

    // Update dimensions on resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Change the whisper every so often
    const interval = setInterval(() => {
      setWhisperIndex((prev) => (prev + 1) % whispers.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Track mouse position for that weird parallax thing
  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.pageX)
    mouseY.set(e.pageY)
  }

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden"
    >
      {/* Those weird floating shapes in the background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-pink-900/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        className="text-center mb-12 relative"
      >
        <motion.h1 
          className="text-6xl md:text-7xl font-bold mb-4 tracking-tight"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          Object{" "}
          <span className="relative">
            <span className="absolute -inset-1 bg-gradient-to-r from-pink-600/50 to-purple-600/50 blur"></span>
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              Whisperer
            </span>
          </span>
        </motion.h1>

        <motion.p 
          className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {whispers[whisperIndex]}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <Link href="/object-whisperer">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-purple-900 text-white font-medium rounded-lg shadow-lg text-xl 
              hover:bg-purple-800 transition-all relative group overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              <FiCoffee className="w-6 h-6" />
              <span>Talk to Things</span>
              <FiArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 transform translate-y-full group-hover:translate-y-0 transition-transform" />
          </motion.button>
        </Link>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-lg border border-white/5 hover:border-purple-500/20 transition-colors"
        >
          <FiEye size={32} className="text-purple-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">Point at Stuff</h3>
          <p className="text-gray-400 text-sm">
            Your camera is the key to unlocking the secret world of talking objects. Yes, really.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-lg border border-white/5 hover:border-pink-500/20 transition-colors"
        >
          <FiMic size={32} className="text-pink-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">Hear Secrets</h3>
          <p className="text-gray-400 text-sm">
            Every object has a story. Some are profound, others... well, let's just say your stapler has opinions.
          </p>
        </motion.div>
      </div>

      <footer className="absolute bottom-8 text-center text-gray-500 text-sm">
        <p>Made late at night by someone who talks to their houseplants 🌿</p>
      </footer>
    </div>
  )
} 