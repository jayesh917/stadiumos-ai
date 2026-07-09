import React from 'react';
import { CrowdZone } from '../types';
import { Shield, Users, Activity, TrendingUp, AlertTriangle } from 'lucide-react';

interface StadiumMapProps {
  zones: CrowdZone[];
  selectedZone: CrowdZone | null;
  onSelectZone: (zone: CrowdZone) => void;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({ zones, selectedZone, onSelectZone }) => {
  const getZoneColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'fill-status-red/30 stroke-status-red glow-red';
      case 'HIGH':
        return 'fill-status-amber/30 stroke-status-amber glow-amber';
      case 'WATCH':
        return 'fill-status-amber/20 stroke-status-amber/80';
      case 'NORMAL':
      default:
        return 'fill-status-green/10 stroke-status-green/70';
    }
  };

  const getZoneByName = (id: string): CrowdZone | undefined => {
    return zones.find(z => z.id === id);
  };

  const renderZoneSVG = (id: string, path: string, labelX: number, labelY: number, labelText: string) => {
    const zone = getZoneByName(id);
    if (!zone) return null;

    const isSelected = selectedZone?.id === id;
    const colorClasses = getZoneColor(zone.status);
    const borderWeight = isSelected ? 'stroke-[3px]' : 'stroke-[1.5px]';

    return (
      <g
        className="cursor-pointer transition-all duration-300 group"
        onClick={() => onSelectZone(zone)}
        id={`svg-zone-${id}`}
      >
        {/* Background / Glowing Path */}
        <path
          d={path}
          className={`${colorClasses} ${borderWeight} transition-colors duration-500`}
        />
        {/* Label Background for premium HUD text */}
        <rect
          x={labelX - 45}
          y={labelY - 12}
          width={90}
          height={24}
          rx={4}
          className="fill-background/90 stroke-border/40 stroke-[0.5px] opacity-80 group-hover:opacity-100 transition-opacity"
        />
        {/* Label Text */}
        <text
          x={labelX}
          y={labelY + 4}
          textAnchor="middle"
          className="fill-gray-300 text-[10px] font-medium tracking-wider font-sans pointer-events-none"
        >
          {labelText}
        </text>
        {/* Value Text */}
        <text
          x={labelX}
          y={labelY + 24}
          textAnchor="middle"
          className={`text-[9px] font-bold pointer-events-none ${
            zone.status === 'CRITICAL' ? 'fill-status-red' :
            zone.status === 'HIGH' ? 'fill-status-amber' :
            'fill-primary'
          }`}
        >
          {Math.round(zone.occupancy_ratio * 100)}%
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full h-[320px] bg-surface rounded-xl border border-border p-4 flex flex-col items-center justify-center overflow-hidden">
      {/* HUD scan overlay */}
      <div className="absolute inset-0 scan-line pointer-events-none opacity-20"></div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2d42_1px,transparent_1px),linear-gradient(to_bottom,#1f2d42_1px,transparent_1px)] bg-[size:30px_30px] opacity-10"></div>

      {/* Status Bar */}
      <div className="absolute top-3 left-4 flex gap-3 text-[10px] font-semibold tracking-wider text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-status-green animate-pulse"></span> NORMAL</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-status-amber"></span> WARNING</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-status-red animate-ping"></span> CRITICAL</span>
      </div>

      <div className="absolute top-3 right-4 text-[10px] text-primary/70 font-mono tracking-widest">
        TELEMETRY STADIUM MAP v1.0
      </div>

      {/* SVG Stadium Map */}
      <svg
        viewBox="0 0 600 360"
        className="w-full h-full max-w-[550px] relative z-10"
      >
        {/* Pitch / Field in the middle */}
        <rect
          x="200"
          y="110"
          width="200"
          height="120"
          rx="6"
          className="fill-green-950/20 stroke-green-800/40 stroke-[2px]"
        />
        <circle cx="300" cy="170" r="25" className="fill-none stroke-green-800/20 stroke-[1.5px]" />
        <line x1="300" y1="110" x2="300" y2="230" className="stroke-green-800/20 stroke-[1.5px]" />

        {/* 1. North Stand (Top) */}
        {renderZoneSVG(
          'north_stand',
          'M 160 90 Q 300 30 440 90 L 460 70 Q 300 10 140 70 Z',
          300,
          50,
          'NORTH STAND'
        )}

        {/* 2. South Stand (Bottom) */}
        {renderZoneSVG(
          'south_stand',
          'M 160 250 Q 300 310 440 250 L 460 270 Q 300 330 140 270 Z',
          300,
          290,
          'SOUTH STAND'
        )}

        {/* 3. West Stand (Left) */}
        {renderZoneSVG(
          'west_stand',
          'M 140 100 Q 90 170 140 240 L 120 255 Q 65 170 120 85 Z',
          105,
          170,
          'WEST STAND'
        )}

        {/* 4. East Stand (Right) */}
        {renderZoneSVG(
          'east_stand',
          'M 460 100 Q 510 170 460 240 L 480 255 Q 535 170 480 85 Z',
          495,
          170,
          'EAST STAND'
        )}

        {/* 5. Food Court (Center Arena Top Annex) */}
        {renderZoneSVG(
          'food_court',
          'M 260 170 L 340 170 L 320 200 L 280 200 Z',
          300,
          185,
          'FOOD COURT'
        )}

        {/* 6. Gate A (Top Left outer ring) */}
        {renderZoneSVG(
          'gate_a',
          'M 80 50 A 15 15 0 1 1 80 80 A 15 15 0 1 1 80 50',
          80,
          65,
          'GATE A'
        )}

        {/* 7. Gate B (Bottom Center outer ring) */}
        {renderZoneSVG(
          'gate_b',
          'M 300 325 A 15 15 0 1 1 300 355 A 15 15 0 1 1 300 325',
          300,
          340,
          'GATE B'
        )}

        {/* 8. Gate C (Top Right outer ring) */}
        {renderZoneSVG(
          'gate_c',
          'M 520 50 A 15 15 0 1 1 520 80 A 15 15 0 1 1 520 50',
          520,
          65,
          'GATE C'
        )}

        {/* 9. Parking Area (Outer side) */}
        {renderZoneSVG(
          'parking',
          'M 20 280 L 80 280 L 80 320 L 20 320 Z',
          50,
          300,
          'PARKING'
        )}
      </svg>
    </div>
  );
};
