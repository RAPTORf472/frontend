'use client';

interface StaticMapProps {
  address: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function StaticMap({ address, className, width = 600, height = 400 }: StaticMapProps) {
  const encodedAddress = encodeURIComponent(address);
  const googleMapsUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  
  const handleMapClick = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div 
      className={`aspect-video overflow-hidden rounded-lg ${className}`}
      style={{ position: 'relative' }}
    >
      <iframe
        width={width}
        height={height}
        style={{ border: 0, width: '100%', height: '100%' }}
        loading="lazy"
        src={googleMapsUrl}
        title={`Map showing ${address}`}
      />
      {/* Overlay to handle clicks, since iframe clicks won't trigger our handler */}
      <div 
        onClick={handleMapClick}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          cursor: 'pointer',
          background: 'transparent'
        }}
        aria-label="Click to open in Google Maps"
      />
    </div>
  );
} 