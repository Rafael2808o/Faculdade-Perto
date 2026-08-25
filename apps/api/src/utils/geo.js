const EARTH_RADIUS_KM=6371.0088;
const radians=(degrees)=>degrees*Math.PI/180;
export function distanceKm(a,b){const dLat=radians(b.lat-a.lat);const dLng=radians(b.lng-a.lng);const lat1=radians(a.lat);const lat2=radians(b.lat);const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;return 2*EARTH_RADIUS_KM*Math.asin(Math.sqrt(h))}
