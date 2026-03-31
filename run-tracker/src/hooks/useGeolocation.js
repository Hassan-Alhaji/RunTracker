import { useState, useEffect, useRef } from 'react';
import { calculateDistance } from '../utils/calculations';

export function useGeolocation(isActive) {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [error, setError] = useState(null);
  const [path, setPath] = useState([]); // Array of {lat, lng, timestamp}
  const [distance, setDistance] = useState(0); // in KM
  
  const watcherId = useRef(null);
  const lastPosition = useRef(null);
  const startTime = useRef(null);

  useEffect(() => {
    if (!isActive) {
      if (watcherId.current) {
        navigator.geolocation.clearWatch(watcherId.current);
        watcherId.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    
    // Set start time for the whole activity if missing
    if (!startTime.current && path.length === 0) {
       startTime.current = new Date().toISOString();
    }

    watcherId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = {
          lat: latitude, 
          lng: longitude, 
          timestamp: new Date().toISOString()
        };

        setCurrentPosition([latitude, longitude]);
        
        // Push the detailed point for Strava GPX tracing
        setPath((prev) => [...prev, newPos]);

        if (lastPosition.current) {
          const distIncrement = calculateDistance(
            lastPosition.current.lat, lastPosition.current.lng,
            latitude, longitude
          );
          // Add distance if significant
          if (distIncrement > 0.002) { 
            setDistance((prev) => prev + distIncrement);
            lastPosition.current = newPos;
          }
        } else {
          lastPosition.current = newPos; // First point
        }
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watcherId.current) {
        navigator.geolocation.clearWatch(watcherId.current);
      }
    };
  }, [isActive]);

  const resetTracking = () => {
    setPath([]);
    setDistance(0);
    setCurrentPosition(null);
    lastPosition.current = null;
    startTime.current = null;
    setError(null);
  };

  return { currentPosition, path, distance, error, resetTracking, startTime: startTime.current };
}
