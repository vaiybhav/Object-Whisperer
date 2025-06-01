'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export function Logo() {
  return (
    <motion.div 
      className="fixed top-4 right-4 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Link href="/" className="block hover:opacity-80 transition-opacity">
        <Image
          src="/favicon-32x32.png"
          alt="Object Whisperer Logo"
          width={32}
          height={32}
          className="w-8 h-8 sm:w-10 sm:h-10"
        />
      </Link>
    </motion.div>
  )
} 