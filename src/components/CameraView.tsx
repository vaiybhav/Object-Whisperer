'use client'

import React, { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import * as tf from '@tensorflow/tfjs'
import * as cocossd from '@tensorflow-models/coco-ssd'
import { motion } from 'framer-motion'

interface CameraViewProps {
  onObjectsDetected: (objects: cocossd.DetectedObject[]) => void
  isModelLoading: boolean
  setIsModelLoading: (loading: boolean) => void
  isCameraOn: boolean
}

export function CameraView({ onObjectsDetected, isModelLoading, setIsModelLoading, isCameraOn }: CameraViewProps) {
  const webcamRef = useRef<Webcam>(null)
  const modelRef = useRef<cocossd.ObjectDetection | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setHasPermission(true)
        stream.getTracks().forEach(track => track.stop())
      } catch (error) {
        console.error('Camera permission error:', error)
        setHasPermission(false)
      }
    }
    
    checkPermission()
  }, [])
  
  useEffect(() => {
    if (!hasPermission) return
    
    const loadModel = async () => {
      try {
        await tf.ready()
        modelRef.current = await cocossd.load()
        setIsModelLoading(false)
      } catch (error) {
        console.error('Error loading model:', error)
      }
    }
    
    loadModel()
  }, [hasPermission, setIsModelLoading])
  
  useEffect(() => {
    if (!modelRef.current || isModelLoading || !hasPermission || !isCameraOn) return
    
    let animationFrame: number
    
    const detectFrame = async () => {
      if (!webcamRef.current?.video || !modelRef.current) return
      
      try {
        const predictions = await modelRef.current.detect(webcamRef.current.video)
        onObjectsDetected(predictions)
        animationFrame = requestAnimationFrame(detectFrame)
      } catch (error) {
        console.error('Detection error:', error)
      }
    }
    
    detectFrame()
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isModelLoading, onObjectsDetected, hasPermission, isCameraOn])
  
  // Clear detected objects when camera is turned off
  useEffect(() => {
    if (!isCameraOn) {
      onObjectsDetected([]);
    }
  }, [isCameraOn, onObjectsDetected]);
  
  if (hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white p-4 text-center">
        <div>
          <p className="text-xl mb-2">📸 Camera access needed</p>
          <p className="text-sm opacity-80">Please allow camera access to use Object Whisperer</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-full">
      {isCameraOn ? (
        <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full h-full object-cover transform scale-x-[-1]"
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'environment'
          }}
          mirrored={false}
        />
      ) : (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-white text-xl">Camera is off</div>
        </div>
      )}
      
      {isModelLoading && isCameraOn && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-white text-xl">Loading AI model...</div>
        </motion.div>
      )}
    </div>
  )
} 