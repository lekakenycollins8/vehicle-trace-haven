import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Replace with your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHRxOWF1NmowMDFqMmptbGVwZ2E4ZXd2In0.a6Gwb3zZX3oOX3TwTt1qDg';

export function VehicleMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("positions");
      if (error) throw error;
      return data?.positions || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40], // Default center
      zoom: 9
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl());

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when positions change
  useEffect(() => {
    if (!map.current || !positions) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add new markers
    positions.forEach((position: any) => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white';
      el.innerHTML = '🚗';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([position.longitude, position.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <p class="font-bold">Vehicle ID: ${position.vehicle_id}</p>
            <p>Speed: ${position.speed || 'N/A'} km/h</p>
            <p>Last Updated: ${new Date(position.timestamp).toLocaleString()}</p>
          </div>
        `))
        .addTo(map.current);

      markersRef.current[position.vehicle_id] = marker;
    });

    // Fit bounds to show all markers
    if (positions.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      positions.forEach((position: any) => {
        bounds.extend([position.longitude, position.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [positions]);

  return (
    <div ref={mapContainer} className="w-full h-[400px] rounded-lg overflow-hidden" />
  );
}