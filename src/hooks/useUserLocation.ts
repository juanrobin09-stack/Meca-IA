import { useState, useCallback } from 'react';

export interface UserLocation {
  lat: number;
  lng: number;
}

interface UseUserLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  getUserLocation: () => void;
  clearError: () => void;
}

const PARIS_LOCATION: UserLocation = { lat: 48.8566, lng: 2.3522 };
const LOCATION_STORAGE_KEY = 'mecai_user_location';
const LOCATION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function useUserLocation(): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(() => {
    // Try to restore cached location
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (cached) {
        const { location: loc, timestamp } = JSON.parse(cached);
        // Check if location is still valid (not expired)
        if (Date.now() - timestamp < LOCATION_EXPIRY_MS) {
          return loc;
        }
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par ton navigateur');
      setLocation(PARIS_LOCATION);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLocation);
        setLoading(false);

        // Cache the location
        try {
          localStorage.setItem(
            LOCATION_STORAGE_KEY,
            JSON.stringify({ location: newLocation, timestamp: Date.now() })
          );
        } catch {
          // Ignore storage errors
        }
      },
      (err) => {
        setLoading(false);

        let errorMessage: string;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Tu as refusé l\'accès à ta position. Active la géolocalisation ou entre une adresse.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Impossible de déterminer ta position. Vérifie ta connexion.';
            break;
          case err.TIMEOUT:
            errorMessage = 'La demande de localisation a expiré. Réessaie.';
            break;
          default:
            errorMessage = 'Une erreur est survenue lors de la géolocalisation.';
        }

        setError(errorMessage);
        // Use Paris as fallback
        setLocation(PARIS_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { location, loading, error, getUserLocation, clearError };
}
