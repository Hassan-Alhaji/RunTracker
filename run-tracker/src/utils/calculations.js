// Calculates distance between two coordinates in kilometers using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  dist = dist * 1.609344; // Convert miles to kilometers
  return dist;
}

// Format seconds into HH:MM:SS layout
export function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hDisplay = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
  const mDisplay = minutes.toString().padStart(2, '0');
  const sDisplay = seconds.toString().padStart(2, '0');

  return `${hDisplay}${mDisplay}:${sDisplay}`;
}

// Calculate pace in minutes per km (Format: MM:SS)
export function calculatePace(distanceKm, timeSeconds) {
  if (distanceKm === 0 || timeSeconds === 0) return "0:00";
  const paceSeconds = timeSeconds / distanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  if (mins > 60) return ">60:00"; // Cap it to realistic numbers
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Average stride length for walking/running is ~0.762 meters
export function calculateSteps(distanceKm) {
  const distanceMeters = distanceKm * 1000;
  return Math.round(distanceMeters / 0.762);
}

// Rough estimate for calories burned (Running usually burns ~1 kcal per kg per km)
// Assuming an average weight of 70kg: ~70 kcal / km
export function calculateCalories(distanceKm) {
  return Math.round(distanceKm * 70); 
}
