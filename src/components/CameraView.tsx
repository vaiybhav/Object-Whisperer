'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import * as cocossd from '@tensorflow-models/coco-ssd'
import { motion } from 'framer-motion'

// Define model types for advanced model handling
type ModelType = 'cocossd';

// EfficientDet model type definitions for reference
interface EfficientDetPrediction {
  box: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  label: string;
  score: number;
}

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
  const [activeModel, setActiveModel] = useState<ModelType>('cocossd')
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.65) // Higher threshold for more accurate detections
  const [processingDelay, setProcessingDelay] = useState(150) // ms between processing frames
  const frameCountRef = useRef(0)
  const lastProcessedTimeRef = useRef(0)
  const aggregatedPredictionsRef = useRef<cocossd.DetectedObject[]>([])
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

  // Updated video constraints for better mobile handling
  const videoConstraints = {
    facingMode: isMobile ? { exact: "environment" } : "user",
    aspectRatio: isMobile ? 16/9 : 16/9, 
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 },
    frameRate: { ideal: 30 }
  };

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: videoConstraints
        });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
      }
    };
    
    checkPermission();
  }, [isMobile]);
  
  // Enhanced model loading with advanced configuration
  useEffect(() => {
    if (!hasPermission) return
    
    let isMounted = true
    
    const loadModels = async () => {
      try {
        // Configure TensorFlow.js for better performance
        await tf.ready()
        await tf.setBackend('webgl')
        tf.env().set('WEBGL_FORCE_F16_TEXTURES', true)
        tf.env().set('WEBGL_PACK', true)
        
        console.log("TensorFlow backend: ", tf.getBackend())
        
        // Load COCO-SSD with improved options
        const cocoModel = await cocossd.load({
          base: 'mobilenet_v2', // Use MobileNet v2 for better accuracy/speed tradeoff
          modelUrl: undefined
        })
        
        if (isMounted) {
          modelRef.current = cocoModel
          setIsModelLoading(false)
          console.log("COCO-SSD model loaded successfully")
        }
      } catch (error) {
        console.error('Error loading models:', error)
        if (isMounted) {
          // Fall back to lighter COCO-SSD if initial load fails
          try {
            modelRef.current = await cocossd.load({
              base: 'lite_mobilenet_v2'
            })
            setIsModelLoading(false)
            console.log("Fallback model loaded")
          } catch (fallbackError) {
            console.error('Fallback model load failed:', fallbackError)
          }
        }
      }
    }
    
    loadModels()
    
    return () => {
      isMounted = false
    }
  }, [hasPermission, setIsModelLoading])
  
  // Process detections with temporal smoothing and confidence filtering
  const processDetections = useCallback((rawPredictions: cocossd.DetectedObject[]) => {
    // Filter by confidence threshold
    const highConfidencePredictions = rawPredictions.filter(
      pred => pred.score >= confidenceThreshold
    )
    
    // Add to aggregated predictions for temporal smoothing
    aggregatedPredictionsRef.current = [...aggregatedPredictionsRef.current, ...highConfidencePredictions]
    
    // Group by class and average bounding boxes for stable visualization
    const classGroups: Record<string, cocossd.DetectedObject[]> = {}
    
    aggregatedPredictionsRef.current.forEach(pred => {
      if (!classGroups[pred.class]) {
        classGroups[pred.class] = []
      }
      classGroups[pred.class].push(pred)
    })
    
    // Process each group to get averaged/smoothed predictions
    const smoothedPredictions = Object.values(classGroups).map(group => {
      if (group.length === 1) return group[0]
      
      // Calculate weighted average of bounding boxes based on confidence
      const totalWeight = group.reduce((sum, pred) => sum + pred.score, 0)
      const avgBbox: [number, number, number, number] = [0, 0, 0, 0]
      let highestScore = 0
      let bestClass = group[0].class
      
      group.forEach(pred => {
        const weight = pred.score / totalWeight
        pred.bbox.forEach((coord, i) => {
          avgBbox[i] += coord * weight
        })
        
        if (pred.score > highestScore) {
          highestScore = pred.score
          bestClass = pred.class
        }
      })
      
      return {
        bbox: avgBbox as [number, number, number, number],
        class: bestClass,
        score: highestScore
      }
    })
    
    // Reset aggregated predictions periodically to avoid stale detections
    if (frameCountRef.current % 10 === 0) {
      aggregatedPredictionsRef.current = highConfidencePredictions
    }
    
    return smoothedPredictions
  }, [confidenceThreshold])
  
  // Detect objects using the appropriate model
  const detectWithModel = useCallback(async (video: HTMLVideoElement) => {
    if (!video || !modelRef.current) return []
    
    try {
      const predictions = await modelRef.current.detect(video)
      return predictions
    } catch (error) {
      console.error(`Error detecting with model:`, error)
      return []
    }
  }, [])
  
  // Main detection loop with performance optimizations
  useEffect(() => {
    if (!modelRef.current || isModelLoading || !hasPermission || !isCameraOn) return
    
    let animationFrame: number
    
    const detectFrame = async () => {
      if (!webcamRef.current?.video) {
        animationFrame = requestAnimationFrame(detectFrame)
        return
      }
      
      const video = webcamRef.current.video
      
      // Throttle processing to avoid overloading the GPU
      const now = performance.now()
      if (now - lastProcessedTimeRef.current < processingDelay) {
        animationFrame = requestAnimationFrame(detectFrame)
        return
      }
      
      lastProcessedTimeRef.current = now
      frameCountRef.current++
      
      try {
        // Ensure video is ready
        if (video.readyState < 2) {
          animationFrame = requestAnimationFrame(detectFrame)
          return
        }
        
        // Skip frames periodically to reduce load
        if (frameCountRef.current % 2 !== 0) {
          animationFrame = requestAnimationFrame(detectFrame)
          return
        }
        
        const rawPredictions = await detectWithModel(video)
        const processedPredictions = processDetections(rawPredictions)
        
        onObjectsDetected(processedPredictions)
      } catch (error) {
        console.error('Detection error:', error)
      }
      
      animationFrame = requestAnimationFrame(detectFrame)
    }
    
    detectFrame()
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isModelLoading, onObjectsDetected, hasPermission, isCameraOn, detectWithModel, processDetections, processingDelay])
  
  // Clear detected objects when camera is turned off
  useEffect(() => {
    if (!isCameraOn) {
      onObjectsDetected([]);
      // Reset aggregated predictions when camera is off
      aggregatedPredictionsRef.current = [];
    }
  }, [isCameraOn, onObjectsDetected]);
  
  // Performance monitoring to adjust settings
  useEffect(() => {
    if (!isCameraOn || isModelLoading) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    
    const checkPerformance = () => {
      const now = performance.now();
      frameCount++;
      
      // Every 5 seconds, measure FPS and adjust settings if needed
      if (now - lastTime > 5000) {
        const fps = frameCount / ((now - lastTime) / 1000);
        console.log(`Current performance: ${fps.toFixed(1)} FPS`);
        
        // Adjust settings based on performance
        if (fps < 12) {
          // If performance is poor, lower quality to improve speed
          setProcessingDelay(prev => Math.min(prev + 50, 300)); // Increase delay between frames
          setConfidenceThreshold(prev => Math.min(prev + 0.05, 0.8)); // Raise threshold to process fewer objects
        } else if (fps > 30) {
          // If performance is good, increase quality
          setProcessingDelay(prev => Math.max(prev - 30, 100)); // Decrease delay
          setConfidenceThreshold(prev => Math.max(prev - 0.03, 0.5)); // Lower threshold for more detections
        }
        
        frameCount = 0;
        lastTime = now;
      }
      
      performanceId = requestAnimationFrame(checkPerformance);
    };
    
    let performanceId = requestAnimationFrame(checkPerformance);
    
    return () => {
      cancelAnimationFrame(performanceId);
    };
  }, [isCameraOn, isModelLoading]);
  
  if (hasPermission === false) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white text-center p-4">
        <div>
          <p className="text-lg font-semibold mb-2">Camera Access Required</p>
          <p className="text-sm opacity-80">Please enable camera access to use object detection.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-full">
      {isCameraOn && hasPermission && (
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-full object-cover"
          style={{
            transform: isMobile ? 'none' : 'scaleX(-1)',
          }}
        />
      )}
      
      {isModelLoading && isCameraOn && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex flex-col items-center text-white">
            <div className="text-xl mb-2">Loading advanced AI model...</div>
            <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-300"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
      
      {!isModelLoading && isCameraOn && (
        <div className="absolute bottom-2 left-2 text-xs text-white bg-black/40 px-2 py-1 rounded-full">
          COCO-SSD • Conf: {Math.round(confidenceThreshold * 100)}%
        </div>
      )}
    </div>
  )
} 