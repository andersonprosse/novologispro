import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck, Warehouse, MapPin, Navigation } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Custom Icons setup
const createIcon = (iconComponent, color = '#3b82f6') => {
  const iconMarkup = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-10 h-10">
      <div className="absolute inset-0 bg-white rounded-full shadow-lg border-2 border-white"></div>
      <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: color }}></div>
      <div className="relative z-10 text-white p-2 rounded-full" style={{ backgroundColor: color }}>
        {iconComponent}
      </div>
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45 shadow-sm"></div>
    </div>
  );
  
  return L.divIcon({
    html: iconMarkup,
    className: 'custom-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -45]
  });
};

const warehouseIcon = createIcon(<Warehouse size={20} />, '#f59e0b'); // Orange
const truckIcon = createIcon(<Truck size={20} />, '#10b981'); // Green
const destinationIcon = createIcon(<MapPin size={20} />, '#ef4444'); // Red
const userIcon = createIcon(<Navigation size={20} />, '#3b82f6'); // Blue

// Map Controller for view updates
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onClick }) {
  useMapEvents({
    click: (e) => {
      if (onClick) onClick(e);
    },
  });
  return null;
}

export default function LogisticsMap({ 
  warehouses = [], 
  vehicles = [], 
  orders = [],
  center = [-23.550520, -46.633308], // Default São Paulo
  zoom = 13,
  onMapClick,
  showRoute = false,
  routePoints = [],
  interactive = true,
  height = "500px",
  darkMode = false
}) {
  // Fix for Leaflet default marker icons if needed (though we use custom ones)
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 z-0 relative" style={{ height }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <MapClickHandler onClick={onMapClick} />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Mapa Padrão (Street)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={darkMode 
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              }
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satélite (Esri)">
             <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Terreno">
             <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <MapController center={center} zoom={zoom} />

        {/* Render Warehouses */}
        {warehouses.map((wh) => (
          <Marker 
            key={wh.id} 
            position={[wh.lat, wh.lng]} 
            icon={warehouseIcon}
          >
            <Popup className="custom-popup">
              <div className="p-2">
                <h3 className="font-bold text-slate-800">{wh.name}</h3>
                <p className="text-sm text-slate-600">{wh.address}</p>
                <div className="mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full inline-block">
                  Capacidade: {wh.capacity}m³
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Vehicles */}
        {vehicles.map((vehicle) => (
          <Marker 
            key={vehicle.id} 
            position={[vehicle.current_lat, vehicle.current_lng]} 
            icon={truckIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-slate-800">{vehicle.model}</h3>
                <p className="text-sm text-slate-600">Placa: {vehicle.plate}</p>
                <p className="text-sm text-slate-600">Motorista: {vehicle.driver_name}</p>
                <div className="mt-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full inline-block">
                  {vehicle.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Orders/Destinations */}
        {orders.map((order) => (
          <Marker 
            key={order.id} 
            position={[order.lat, order.lng]} 
            icon={destinationIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-slate-800">Pedido #{order.order_number}</h3>
                <p className="text-sm text-slate-600">{order.customer_name}</p>
                <p className="text-sm text-slate-600">{order.address}</p>
                <div className="mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full inline-block">
                  {order.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Route */}
        {showRoute && routePoints.length > 0 && (
          <Polyline 
            positions={routePoints} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.7} 
            dashArray="10, 10" 
          />
        )}
      </MapContainer>
    </div>
  );
}