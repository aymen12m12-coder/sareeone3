import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Check, X, Loader2, Navigation as NavigationIcon, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  onCancel?: () => void;
  initialLocation?: [number, number];
}

// Component to handle map clicks
function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number] | null; 
  setPosition: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

// Component to update map view when position changes
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LocationPicker({
  onLocationSelect,
  onCancel,
  initialLocation,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Default center (Sanaa, Yemen)
  const defaultCenter: [number, number] = [15.3694, 44.1910];
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    position || initialLocation || defaultCenter
  );

  // Reverse geocoding to get address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=ar`
      );
      const data = await response.json();
      
      if (data.display_name) {
        setAddress(data.display_name);
      } else if (data.address) {
        // Build address from components
        const parts = [
          data.address.road,
          data.address.neighbourhood,
          data.address.suburb,
          data.address.city || data.address.town,
          data.address.country,
        ].filter(Boolean);
        setAddress(parts.join(', '));
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  // Search for address
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=ar`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const newPos: [number, number] = [lat, lon];
        setPosition(newPos);
        setMapCenter(newPos);
        setAddress(data[0].display_name);
      } else {
        alert('لم يتم العثور على الموقع المطلوب');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('حدث خطأ أثناء البحث عن الموقع');
    } finally {
      setIsSearching(false);
    }
  };

  // Update address when position changes
  useEffect(() => {
    if (position) {
      // Only fetch if we don't already have the address from search
      getAddressFromCoordinates(position[0], position[1]);
    }
  }, [position]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم خدمة تحديد الموقع');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newPos: [number, number] = [lat, lng];
        setPosition(newPos);
        setMapCenter(newPos);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('فشل في الحصول على موقعك الحالي');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleConfirm = () => {
    if (position && address) {
      onLocationSelect(position[0], position[1], address);
    } else {
      alert('الرجاء اختيار موقع على الخريطة');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">تحديد موقع المطعم</h2>
                <p className="text-sm text-white/80">ابحث عن الموقع أو انقر على الخريطة</p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b bg-gray-50">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منطقة، شارع، أو معلم..."
                className="w-full pr-10 pl-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>بحث</span>
            </button>
          </form>
        </div>

        {/* Map */}
        <div className="flex-1 relative min-h-[400px]">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={mapCenter} />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>

          {/* Get current location button */}
          <button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="absolute bottom-4 left-4 z-[1000] bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="تحديد موقعي الحالي"
          >
            {gettingLocation ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <NavigationIcon className="h-6 w-6 text-primary" />
            )}
          </button>
        </div>

        {/* Address display */}
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 border">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              العنوان المحدد:
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>جاري تحديد العنوان...</span>
              </div>
            ) : position ? (
              <div className="space-y-1">
                <p className="text-gray-900 font-medium text-sm">{address || 'جاري التحميل...'}</p>
                <p className="text-xs text-gray-500">
                  الإحداثيات: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">لم يتم اختيار موقع بعد</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t bg-gray-50 p-4 flex gap-3 justify-end">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              إلغاء
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={!position || loading}
            className="px-6 py-2 bg-primary text-white rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            تأكيد الموقع
          </button>
        </div>
      </div>
    </div>
  );
}
