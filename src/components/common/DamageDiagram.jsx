import React, { useRef, useState } from 'react';
import { motion } from "framer-motion";

// Ute/Pickup Truck SVG (Hilux, etc.)
const UteSVG = ({ children }) => (
  <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    {/* Main cabin */}
    <path
      d="M150,250 C150,200 150,150 200,150 L350,150 L350,100 L450,100 L450,150 L600,150 C650,150 650,200 650,250 Z"
      fill="#e2e8f0"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Tray/bed */}
    <path
      d="M450,150 L450,250 L700,250 L700,200 L700,150 L450,150"
      fill="#cbd5e1"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Windscreen */}
    <path d="M200,150 L350,150 L320,100 L230,100 Z" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Side windows */}
    <rect x="360" y="120" width="80" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Wheels */}
    <circle cx="220" cy="280" r="35" fill="#475569" stroke="white" strokeWidth="3" />
    <circle cx="580" cy="280" r="35" fill="#475569" stroke="white" strokeWidth="3" />
    {/* Headlights */}
    <ellipse cx="150" cy="200" rx="15" ry="25" fill="#fbbf24" stroke="#475569" strokeWidth="2" />
    {/* Taillights */}
    <ellipse cx="700" cy="200" rx="10" ry="20" fill="#ef4444" stroke="#475569" strokeWidth="2" />
    {children}
  </svg>
);

// SUV/4x4 SVG (LandCruiser, etc.)
const SUV_SVG = ({ children }) => (
  <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    {/* Main body */}
    <path
      d="M120,280 C120,200 150,150 200,150 L600,150 C650,150 680,200 680,280 L120,280 Z"
      fill="#e2e8f0"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Roof line */}
    <path
      d="M200,150 L250,100 L550,100 L600,150"
      fill="#d1d5db"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Windscreen */}
    <path d="M250,100 L550,100 L580,150 L220,150 Z" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Side windows */}
    <rect x="230" y="120" width="120" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    <rect x="450" y="120" width="120" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Wheels */}
    <circle cx="200" cy="320" r="40" fill="#475569" stroke="white" strokeWidth="3" />
    <circle cx="600" cy="320" r="40" fill="#475569" stroke="white" strokeWidth="3" />
    {/* Headlights */}
    <ellipse cx="120" cy="220" rx="15" ry="25" fill="#fbbf24" stroke="#475569" strokeWidth="2" />
    {/* Taillights */}
    <ellipse cx="680" cy="220" rx="10" ry="20" fill="#ef4444" stroke="#475569" strokeWidth="2" />
    {/* Spare tire on back */}
    <circle cx="680" cy="250" r="25" fill="#64748b" stroke="#475569" strokeWidth="2" />
    {children}
  </svg>
);

// Bus/Van SVG (Commuter, etc.)
const BusSVG = ({ children }) => (
  <svg viewBox="0 0 900 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    {/* Main body */}
    <path
      d="M100,300 C100,200 130,150 180,150 L720,150 C770,150 800,200 800,300 L100,300 Z"
      fill="#e2e8f0"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Roof */}
    <path
      d="M180,150 L200,100 L700,100 L720,150"
      fill="#d1d5db"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Front windscreen */}
    <path d="M200,100 L320,100 L350,150 L180,150 Z" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Multiple side windows for passengers */}
    <rect x="200" y="120" width="80" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    <rect x="300" y="120" width="80" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    <rect x="400" y="120" width="80" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    <rect x="500" y="120" width="80" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    <rect x="600" y="120" width="80" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Door lines */}
    <line x1="350" y1="150" x2="350" y2="300" stroke="#475569" strokeWidth="2" />
    <line x1="550" y1="150" x2="550" y2="300" stroke="#475569" strokeWidth="2" />
    {/* Wheels */}
    <circle cx="220" cy="340" r="35" fill="#475569" stroke="white" strokeWidth="3" />
    <circle cx="680" cy="340" r="35" fill="#475569" stroke="white" strokeWidth="3" />
    {/* Headlights */}
    <ellipse cx="100" cy="220" rx="15" ry="25" fill="#fbbf24" stroke="#475569" strokeWidth="2" />
    {/* Taillights */}
    <ellipse cx="800" cy="220" rx="10" ry="20" fill="#ef4444" stroke="#475569" strokeWidth="2" />
    {children}
  </svg>
);

// Truck SVG (larger commercial vehicles)
const TruckSVG = ({ children }) => (
  <svg viewBox="0 0 900 450" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    {/* Cabin */}
    <path
      d="M100,320 C100,250 130,200 180,200 L350,200 L350,150 L400,150 L400,200 L420,200 C470,200 470,250 470,320 Z"
      fill="#e2e8f0"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Truck bed/cargo area */}
    <path
      d="M470,200 L470,320 L800,320 L800,250 L800,200 L470,200"
      fill="#cbd5e1"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Windscreen */}
    <path d="M180,200 L350,200 L320,150 L210,150 Z" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Side window */}
    <rect x="360" y="170" width="80" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Front wheels */}
    <circle cx="200" cy="360" r="40" fill="#475569" stroke="white" strokeWidth="3" />
    {/* Rear wheels (dual) */}
    <circle cx="650" cy="360" r="40" fill="#475569" stroke="white" strokeWidth="3" />
    <circle cx="700" cy="360" r="40" fill="#475569" stroke="white" strokeWidth="3" />
    {/* Headlights */}
    <ellipse cx="100" cy="260" rx="15" ry="30" fill="#fbbf24" stroke="#475569" strokeWidth="2" />
    {/* Taillights */}
    <ellipse cx="800" cy="260" rx="10" ry="25" fill="#ef4444" stroke="#475569" strokeWidth="2" />
    {children}
  </svg>
);

// Sedan/Car SVG (fallback for regular cars)
const CarSVG = ({ children }) => (
  <svg viewBox="0 0 800 350" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    {/* Main body */}
    <path
      d="M150,300 C50,300 50,200 100,200 L150,200 L200,100 L600,100 L650,200 L700,200 C750,200 750,300 650,300 Z"
      fill="#e2e8f0"
      stroke="#475569"
      strokeWidth="4"
    />
    {/* Roof line */}
    <path
      d="M200,200 L250,200 L280,100 L520,100 L550,200 L600,200"
      fill="none"
      stroke="#94a3b8"
      strokeWidth="3"
    />
    {/* Windscreen */}
    <path d="M280,100 L520,100 L550,200 L250,200 Z" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Side windows */}
    <rect x="260" y="130" width="100" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    <rect x="440" y="130" width="100" height="30" fill="#a5b4fc" stroke="#475569" strokeWidth="2" />
    {/* Wheels */}
    <circle cx="200" cy="300" r="40" fill="#475569" stroke="white" strokeWidth="3" />
    <circle cx="600" cy="300" r="40" fill="#475569" stroke="white" strokeWidth="3" />
    {/* Headlights */}
    <ellipse cx="100" cy="220" rx="12" ry="20" fill="#fbbf24" stroke="#475569" strokeWidth="2" />
    {/* Taillights */}
    <ellipse cx="700" cy="220" rx="8" ry="15" fill="#ef4444" stroke="#475569" strokeWidth="2" />
    {children}
  </svg>
);

export default function DamageDiagram({ 
  newDamagePoints = [], 
  existingDamagePoints = [],
  onDiagramClick,
  onPointClick,
  activeDamageId,
  interactive = true,
  vehicleType = "car" // New prop to determine vehicle type
}) {
  const svgRef = useRef(null);

  const handleSvgClick = (e) => {
    if (!interactive || !onDiagramClick) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize coordinates to be relative (0 to 1)
    const relativeX = x / rect.width;
    const relativeY = y / rect.height;

    onDiagramClick({ x: relativeX, y: relativeY });
  };
  
  const getCoords = (point, rect) => {
      if (!rect || !point) return { cx: 0, cy: 0 };
      return {
          cx: point.x * rect.width,
          cy: point.y * rect.height
      }
  };

  // Determine which SVG component to use based on vehicle type
  const getVehicleComponent = () => {
    const lowerType = vehicleType.toLowerCase();
    
    if (lowerType.includes('hilux') || lowerType.includes('ute') || lowerType.includes('pickup')) {
      return UteSVG;
    } else if (lowerType.includes('landcruiser') || lowerType.includes('4x4') || lowerType.includes('suv') || lowerType.includes('prado')) {
      return SUV_SVG;
    } else if (lowerType.includes('commuter') || lowerType.includes('bus') || lowerType.includes('hiace') || lowerType.includes('van')) {
      return BusSVG;
    } else if (lowerType.includes('truck') || lowerType.includes('canter') || lowerType.includes('isuzu')) {
      return TruckSVG;
    } else {
      return CarSVG; // Default fallback
    }
  };

  const VehicleComponent = getVehicleComponent();

  return (
    <div className="space-y-2">
      {/* Vehicle type indicator */}
      <div className="text-sm text-slate-600 font-medium">
        Vehicle Type: {vehicleType} 
        {interactive && <span className="ml-2 text-blue-600">(Click on diagram to mark damage)</span>}
      </div>
      
      <div 
        ref={svgRef} 
        onClick={handleSvgClick} 
        className={`relative rounded-lg bg-slate-50 border-2 ${interactive ? 'cursor-crosshair border-slate-300 hover:bg-slate-100' : 'border-slate-200'} transition-colors`}
      >
        <VehicleComponent>
          {/* Render existing damage points */}
          {existingDamagePoints.map((point, index) => {
            if (!point || !svgRef.current) return null;
            const rect = svgRef.current.getBoundingClientRect();
            const { cx, cy } = getCoords(point, rect);
            return (
              <motion.circle
                key={`existing-${index}`}
                cx={cx}
                cy={cy}
                r="12"
                fill="rgba(59, 130, 246, 0.8)"
                stroke="white"
                strokeWidth="3"
                initial={{ r: 0 }}
                animate={{ r: 12 }}
                transition={{ delay: index * 0.1 }}
              />
            );
          })}
          
          {/* Render new damage points */}
          {newDamagePoints.map((point, index) => {
            if (!point.diagram_coords || !svgRef.current) return null;
            const rect = svgRef.current.getBoundingClientRect();
            const { cx, cy } = getCoords(point.diagram_coords, rect);
            const isActive = point.id === activeDamageId;

            return (
              <motion.circle
                key={`new-${point.id}`}
                cx={cx}
                cy={cy}
                r={isActive ? 16 : 12}
                fill="rgba(239, 68, 68, 0.9)"
                stroke="white"
                strokeWidth={isActive ? 4 : 3}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onPointClick) onPointClick(point.id);
                }}
                className={interactive ? "cursor-pointer" : ""}
                whileHover={{ r: 16 }}
                initial={{ r: 0 }}
                animate={{ r: isActive ? 16 : 12 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            );
          })}
        </VehicleComponent>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
          <span>Pre-existing damage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
          <span>New damage</span>
        </div>
      </div>
    </div>
  );
}