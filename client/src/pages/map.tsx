import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { MapPin, Locate, X, Loader2, Info, ExternalLink, AlertCircle, } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Landmark, LandmarkDetail } from "@shared/schema";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapControllerProps {
  onMapMove: (lat: number, lng: number, zoom: number) => void;
  onLocate: () => void;
}

function MapController({ onMapMove, onLocate }: MapControllerProps) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapMove(center.lat, center.lng, zoom);
    },
  });

  useEffect(() => {
    onLocate();
  }, [onLocate]);

  return null;
}

function LocationButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute bottom-28 right-4 z-[1000] lg:bottom-6">
      <Button
        size="icon"
        onClick={onClick}
        className="rounded-full shadow-lg h-12 w-12"
        aria-label="Center map on my location"
        data-testid="button-locate"
      >
        <Locate className="h-5 w-5" />
      </Button>
    </div>
  );
}

interface LandmarkDetailPanelProps {
  pageid: number | null;
  onClose: () => void;
}

function LandmarkDetailPanel({ pageid, onClose }: LandmarkDetailPanelProps) {
  const { data: landmarkDetail, isLoading, error, refetch } = useQuery<LandmarkDetail>({
    queryKey: ["/api/landmarks/detail", pageid],
    queryFn: async () => {
      if (!pageid) throw new Error("No page ID");
      const response = await fetch(`/api/landmarks/${pageid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch landmark details: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!pageid,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (!pageid) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] lg:right-0 lg:left-auto lg:top-0 lg:bottom-0 lg:w-96 transition-transform duration-200 ease-in-out">
      <Card className="h-80 lg:h-full rounded-t-2xl lg:rounded-none border-t lg:border-l shadow-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle className="text-2xl font-semibold line-clamp-2" data-testid="text-landmark-title">
            {isLoading ? "Loading..." : landmarkDetail?.title || "Landmark"}
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="rounded-full shrink-0"
            aria-label="Close landmark details"
            data-testid="button-close-detail"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <ScrollArea className="h-[calc(100%-5rem)]">
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between gap-2">
                  <span>Failed to load landmark details</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => refetch()}
                    data-testid="button-retry-detail"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : landmarkDetail ? (
              <>
                {landmarkDetail.thumbnail && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={landmarkDetail.thumbnail.source}
                      alt={landmarkDetail.title}
                      className="w-full h-full object-cover"
                      data-testid="img-landmark-thumbnail"
                    />
                  </div>
                )}

                {landmarkDetail.extract && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">About</h3>
                    <p className="text-sm text-foreground leading-relaxed" data-testid="text-landmark-extract">
                      {landmarkDetail.extract}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full gap-2"
                  asChild
                  data-testid="button-view-wikipedia"
                >
                  <a
                    href={landmarkDetail.url || `https://en.wikipedia.org/?curid=${landmarkDetail.pageid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Read more on Wikipedia
                  </a>
                </Button>
              </>
            ) : null}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}

interface LandmarkListSidebarProps {
  landmarks: Landmark[];
  onSelectLandmark: (landmark: Landmark) => void;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

function LandmarkListSidebar({ landmarks, onSelectLandmark, isLoading, error, onRetry }: LandmarkListSidebarProps) {
  return (
    <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-80 z-[1000]">
      <Card className="h-full rounded-none border-r">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Local Landmarks
          </CardTitle>
          <div className="flex ">
            <p className="italic underline ms-6 text-tiny ">Created by - Mihir Das</p>
          </div>

          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : error ? "Error loading landmarks" : `${landmarks.length} landmarks visible`}
          </p>
        </CardHeader>
        <ScrollArea className="h-[calc(100%-5rem)]">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p>Failed to load landmarks</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onRetry}
                    className="w-full"
                    data-testid="button-retry-landmarks"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : landmarks.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Info className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Move the map to discover landmarks in different areas
                </p>
              </div>
            ) : (
              landmarks.map((landmark) => (
                <button
                  key={landmark.pageid}
                  onClick={() => onSelectLandmark(landmark)}
                  className="w-full text-left p-3 rounded-lg hover-elevate active-elevate-2 border bg-card transition-all"
                  data-testid={`button-landmark-${landmark.pageid}`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {landmark.title}
                      </h3>
                      {landmark.dist !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {landmark.dist < 1000 
                            ? `${Math.round(landmark.dist)}m away` 
                            : `${(landmark.dist / 1000).toFixed(1)}km away`}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

export default function MapPage() {
  const queryClient = useQueryClient();
  const [selectedPageid, setSelectedPageid] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // NYC default
  const [mapZoom, setMapZoom] = useState(13);
  const [searchParams, setSearchParams] = useState<{ lat: number; lon: number; radius: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Query for landmarks using TanStack Query
  const { data: landmarksData, isLoading, error, refetch } = useQuery<{ landmarks: Landmark[] }>({
    queryKey: ["/api/landmarks/search", searchParams],
    queryFn: async () => {
      if (!searchParams) throw new Error("No search parameters");
      const response = await fetch(
        `/api/landmarks/search?lat=${searchParams.lat}&lon=${searchParams.lon}&radius=${searchParams.radius}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch landmarks: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!searchParams,
    retry: 2,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const landmarks = landmarksData?.landmarks || [];

  const debouncedFetchLandmarks = useCallback((lat: number, lng: number, zoom: number) => {
    // Clear existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Debounce API calls by 500ms
    fetchTimeoutRef.current = setTimeout(() => {
      // Calculate radius based on zoom level (larger radius for zoomed out views)
      const radius = Math.min(10000, Math.max(1000, 50000 / Math.pow(2, zoom - 10)));
      setSearchParams({ lat, lon: lng, radius });
    }, 500);
  }, []);

  const handleMapMove = useCallback((lat: number, lng: number, zoom: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoom);
    debouncedFetchLandmarks(lat, lng, zoom);
  }, [debouncedFetchLandmarks]);

  const handleLocate = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(14);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 14);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleSelectLandmark = useCallback((landmark: Landmark) => {
    setSelectedPageid(landmark.pageid);
    if (mapRef.current) {
      mapRef.current.setView([landmark.lat, landmark.lon], Math.max(mapZoom, 15), {
        animate: true,
      });
    }
  }, [mapZoom]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map Container */}
      <div className={`absolute inset-0 ${selectedPageid ? 'lg:right-96' : ''} ${landmarks.length > 0 ? 'lg:left-80' : ''} transition-all duration-300`}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController onMapMove={handleMapMove} onLocate={handleLocate} />

          {landmarks.map((landmark) => (
            <Marker
              key={landmark.pageid}
              position={[landmark.lat, landmark.lon]}
              eventHandlers={{
                click: () => setSelectedPageid(landmark.pageid),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-semibold mb-1">{landmark.title}</h3>
                  {landmark.dist !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {landmark.dist < 1000 
                        ? `${Math.round(landmark.dist)}m away` 
                        : `${(landmark.dist / 1000).toFixed(1)}km away`}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-4 right-4 z-[1000]">
            <Badge variant="secondary" className="gap-2 py-2 px-3 shadow-md">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs">Loading landmarks...</span>
            </Badge>
          </div>
        )}

        {/* Error Indicator */}
        {error && !isLoading && (
          <div className="absolute top-4 right-4 z-[1000] max-w-xs">
            <Alert variant="destructive" className="shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-2">
                <span className="text-xs">Failed to load landmarks</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => refetch()}
                  data-testid="button-retry-map"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Location Button */}
        <LocationButton onClick={handleLocate} />
      </div>

      {/* Sidebar with landmark list (desktop only) */}
      <LandmarkListSidebar
        landmarks={landmarks}
        onSelectLandmark={handleSelectLandmark}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
      />

      {/* Landmark Detail Panel */}
      <LandmarkDetailPanel
        pageid={selectedPageid}
        onClose={() => setSelectedPageid(null)}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[999] backdrop-blur-sm bg-background/80 border-b">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Local Landmarks</h1>
         
          </div>
          <Badge variant="outline" className="gap-2">
            <span className="text-xs">Powered by Wikipedia</span>
          </Badge>
         
        </div>
      </div>
    </div>
  );
}
