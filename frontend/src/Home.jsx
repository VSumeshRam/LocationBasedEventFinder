import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, CircleMarker, LayersControl, LayerGroup, Polyline, useMapEvents, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';

/** * FIX FOR LEAFLET DEFAULT ICON ASSETS 
 * This ensures markers show up correctly after deployment on Vercel
 */
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow
});

/**
 * CUSTOM BLINKING RED ICON COMPONENT
 * Created using Leaflet DivIcon and CSS animations
 */
const blinkingIcon = new L.DivIcon({
    className: 'custom-blinking-icon',
    html: '<div class="blinking-dot"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const userDotIcon = new L.DivIcon({
    className: 'custom-user-dot',
    html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const manualDotIcon = new L.DivIcon({
    className: 'custom-manual-dot',
    html: '<div style="background-color: #9C27B0; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

/**
 * MAP CONTROLLER COMPONENT
 * Handles smooth flying/panning to new coordinates
 */
function MapController({ targetLoc, onFlyStart, onFlyEnd }) {
    const map = useMap();
    useEffect(() => {
        if (targetLoc) {
            onFlyStart && onFlyStart();
            map.flyTo([targetLoc.lat, targetLoc.lng], 14, {
                duration: 2.5,
                easeLinearity: 0.25
            });
            const timer = setTimeout(() => {
                onFlyEnd && onFlyEnd();
            }, 2600); // Wait slightly longer than the 2.5s animation
            return () => clearTimeout(timer);
        }
    }, [targetLoc, map]); // Removed onFlyStart/onFlyEnd from deps to avoid infinite loops if they aren't memoized
    return null;
}

export default function Home() {
    // --- STATE MANAGEMENT ---
    const [events, setEvents] = useState([]);
    const [userLoc, setUserLoc] = useState(null);
    const [locSource, setLocSource] = useState(null); // 'GPS' or 'MANUAL'
    const [isManualPinning, setIsManualPinning] = useState(false);
    const [mapTarget, setMapTarget] = useState(null);
    const [nearbyEvents, setNearbyEvents] = useState([]);
    const [isSearchingGPS, setIsSearchingGPS] = useState(false);
    
    // Track map flight state to completely hide SVG elements that glitch during flyTo
    const [isMapFlying, setIsMapFlying] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Radius Control and Interactive Syncing
    const [radiusKm, setRadiusKm] = useState(5);
    const [hoveredEventId, setHoveredEventId] = useState(null);

    // Routing and Navigation States
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeDistance, setRouteDistance] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);

    // Auth context
    const user = JSON.parse(localStorage.getItem('user'));

    // --- SIDE EFFECTS (USEEFFECT) ---
    useEffect(() => {
        fetchEvents();
    }, []);

    // Logic to filter events based on the dynamic Radius Slider
    useEffect(() => {
        if (userLoc && events.length > 0) {
            const userLatLng = L.latLng(userLoc.lat, userLoc.lng);
            const nearby = events.filter(event => {
                if (!event.location?.lat) return false;
                const dist = userLatLng.distanceTo(L.latLng(event.location.lat, event.location.lng));
                return dist <= (radiusKm * 1000);
            });
            setNearbyEvents(nearby);
        }
    }, [userLoc, radiusKm, events]);

    // --- API HANDLERS ---
    const fetchEvents = () => {
        axios.get('https://event-sphere-uk4j.onrender.com/api/events')
            .then(res => setEvents(res.data))
            .catch(err => console.error("Fetch Error:", err));
    };

    const handleInterest = async (eventId, eventTitle) => {
        if (!user) return alert("Please Login First!");
        try {
            await axios.put(`https://event-sphere-uk4j.onrender.com/api/events/${eventId}/interested`, {
                userId: user._id
            });
            fetchEvents();
            alert(`Interest noted for ${eventTitle}!`);
        } catch (error) {
            console.error("Interest Error:", error);
        }
    };

    const handleTextSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon } = res.data[0];
                const loc = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setMapTarget(loc);
                setUserLoc(loc);
            } else {
                alert("Place not found! Try being more specific (e.g. Kidangoor, Kerala).");
            }
        } catch (err) {
            console.error("Search Error:", err);
        }
    };

    const getRoute = async (eventLat, eventLng, eventId) => {
        if (!userLoc) return alert("📍 Please search for your location or click 'Near Me' first!");
        setSelectedEventId(eventId);
        try {
            const res = await axios.get(`https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${eventLng},${eventLat}?overview=full&geometries=geojson`);
            if (res.data.routes && res.data.routes.length > 0) {
                const coords = res.data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                setRouteCoords(coords);
                setRouteDistance((res.data.routes[0].distance / 1000).toFixed(2));
            }
        } catch (err) {
            alert("Routing API is currently busy. Try again in a moment.");
        }
    };

    const findNearbyEvents = () => {
        if (!navigator.geolocation) return alert("GPS hardware not found.");
        setIsSearchingGPS(true);

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                navigator.geolocation.clearWatch(watchId);
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLoc(loc);
                setLocSource('GPS');
                setMapTarget(loc);
                setIsSearchingGPS(false);
            },
            (error) => {
                navigator.geolocation.clearWatch(watchId);
                alert("GPS Denied. Using Manual Search Override instead.");
                setIsSearchingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleManualUnpin = () => {
        if (locSource === 'MANUAL') {
            if (window.confirm("Unpin the current location?")) {
                setUserLoc(null);
                setLocSource(null);
                setRouteCoords([]);
                setRouteDistance(null);
            }
        }
    };

    const ManualPinController = () => {
        useMapEvents({
            click(e) {
                if (isManualPinning) {
                    if (window.confirm("Are you here?")) {
                        const loc = { lat: e.latlng.lat, lng: e.latlng.lng };
                        setUserLoc(loc);
                        setLocSource('MANUAL');
                        setMapTarget(loc);
                        setIsManualPinning(false);
                    }
                }
            }
        });
        return null;
    };

    // --- RENDER LOGIC ---
    const displayedEvents = events.filter(e => filterCategory === 'All' || e.eventType === filterCategory);
    const displayedNearbyEvents = nearbyEvents.filter(e => filterCategory === 'All' || e.eventType === filterCategory);

    return (
        <div className="home-layout">

            {/* CSS STYLES BLOCK REMOVED - NOW USING index.css DESIGN SYSTEM */}

            {/* --- LEFT SECTION: MAP & SEARCH --- */}
            <div className="map-container-box">

                {/* Overlay Search Bar */}
                <form onSubmit={handleTextSearch} className="search-box">
                    <input type="text" placeholder="Search area (e.g., Kidangoor)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" />
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="category-dropdown">
                        <option value="All">All Types</option>
                        <option value="Tech Meetup">Tech Meetup</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Conference">Conference</option>
                        <option value="Music & Arts">Music & Arts</option>
                        <option value="Sports">Sports</option>
                        <option value="Food & Drink">Food & Drink</option>
                        <option value="Health & Wellness">Health & Wellness</option>
                        <option value="Business & Networking">Business & Networking</option>
                        <option value="Education & Learning">Education & Learning</option>
                        <option value="Science & Tech">Science & Tech</option>
                        <option value="Community & Culture">Community & Culture</option>
                        <option value="Charity & Causes">Charity & Causes</option>
                        <option value="Gaming & Esports">Gaming & Esports</option>
                        <option value="Fashion & Beauty">Fashion & Beauty</option>
                        <option value="Film & Media">Film & Media</option>
                        <option value="Travel & Outdoors">Travel & Outdoors</option>
                        <option value="Spirituality & Religion">Spirituality & Religion</option>
                        <option value="Book Club">Book Club</option>
                        <option value="Startup Pitch">Startup Pitch</option>
                    </select>
                    <button type="submit" className="search-btn">🔍 Search</button>
                </form>

                {/* Map Controls */}
                <div className="map-controls-wrapper">
                    <button 
                        onClick={() => setIsManualPinning(!isManualPinning)} 
                        className="near-me-btn" 
                        style={{ backgroundColor: isManualPinning ? 'var(--status-danger)' : 'var(--accent-secondary)' }}
                    >
                        {isManualPinning ? "❌ Cancel Pin" : "📌 Drop Pin"}
                    </button>
                    <button onClick={findNearbyEvents} className="near-me-btn" style={{ backgroundColor: 'var(--accent-primary)' }}>
                        {isSearchingGPS ? "Locating..." : "📍 Near Me"}
                    </button>
                </div>

                {/* Leaflet Core Map Component */}
                <MapContainer center={[10.5, 76.5]} zoom={7} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 1, cursor: isManualPinning ? 'crosshair' : 'grab' }}>
                    <ZoomControl position="bottomleft" />
                    <LayersControl position="bottomright">
                        <LayersControl.BaseLayer checked name="Satellite View">
                            <LayerGroup>
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
                            </LayerGroup>
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Normal Map">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        </LayersControl.BaseLayer>
                    </LayersControl>

                    <MapController 
                        targetLoc={mapTarget} 
                        onFlyStart={() => setIsMapFlying(true)} 
                        onFlyEnd={() => setIsMapFlying(false)} 
                    />
                    <ManualPinController />

                    {/* User Location Visuals */}
                    {userLoc && (
                        <>
                            {!isMapFlying && (
                                <Circle
                                    center={[userLoc.lat, userLoc.lng]}
                                    radius={radiusKm * 1000}
                                    pathOptions={{ 
                                        fillColor: locSource === 'MANUAL' ? '#9C27B0' : '#4285F4', 
                                        color: locSource === 'MANUAL' ? '#9C27B0' : '#4285F4', 
                                        weight: 1.5, fillOpacity: 0.12 
                                    }}
                                />
                            )}
                            <Marker
                                eventHandlers={{ click: handleManualUnpin }}
                                position={[userLoc.lat, userLoc.lng]}
                                icon={locSource === 'MANUAL' ? manualDotIcon : userDotIcon}
                            >
                                <Popup>
                                    <strong>{locSource === 'MANUAL' ? '📌 Manually Pinned Location' : '📍 You are here'}</strong>
                                    {locSource === 'MANUAL' && <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Click this dot to unpin.</p>}
                                </Popup>
                            </Marker>
                        </>
                    )}

                    {/* Road Routing Line */}
                    {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#ff3333" weight={5} opacity={0.8} />}

                    {/* Event Markers with Detailed Tooltips */}
                    {displayedEvents.map(event => (
                        <Marker
                            key={event._id}
                            position={[event.location.lat, event.location.lng]}
                            icon={hoveredEventId === event._id ? blinkingIcon : new L.Icon.Default()}
                            zIndexOffset={hoveredEventId === event._id ? 1000 : 0}
                        >
                            <Popup>
                                <div style={{ minWidth: '230px', padding: '10px', backgroundColor: 'var(--bg-base)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent-primary)', fontSize: '18px', fontWeight: '700' }}>{event.title}</h3>

                                        {/* THE DETAILED INFO TOOLTIP LOGIC */}
                                        <div style={{ position: 'relative', display: 'inline-block' }}
                                            onMouseEnter={(e) => { e.currentTarget.querySelector('.info-card').style.display = 'block'; }}
                                            onMouseLeave={(e) => { e.currentTarget.querySelector('.info-card').style.display = 'none'; }}
                                        >
                                            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', border: '1px solid var(--accent-primary)', cursor: 'help' }}>i</div>

                                            <div className="info-card glass-panel" style={{ display: 'none', position: 'absolute', top: '-10px', left: '30px', width: '300px', maxHeight: '350px', overflowY: 'auto', borderRadius: '12px', padding: '20px', zIndex: 9999 }}>
                                                <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>Event Overview</h4>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                                    <p style={{ margin: '0 0 6px 0' }}><strong style={{color: 'var(--text-primary)'}}>📅 Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                                    <p style={{ margin: '0 0 6px 0' }}><strong style={{color: 'var(--text-primary)'}}>🏷️ Category:</strong> <span className="category-badge">{event.eventType}</span></p>
                                                    <p style={{ margin: '0 0 6px 0' }}><strong style={{color: 'var(--text-primary)'}}>📍 Location:</strong> {event.location.address}</p>
                                                    <p style={{ margin: '0 0 12px 0' }}><strong style={{color: 'var(--text-primary)'}}>📝 Desc:</strong> {event.description}</p>
                                                    {event.regLink && (
                                                        <a href={event.regLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'inline-block', marginTop: '10px' }}>Register Now →</a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: '13px', margin: '5px 0 12px 0', color: 'var(--text-muted)' }}>📍 {event.location.address}</p>

                                    {/* NEW: Conditional Display Logic for Interest Count */}
                                    {event.showInterestCount !== false && (
                                        <p style={{ fontSize: '13px', margin: '0 0 16px 0', color: 'var(--status-warning)', fontWeight: '600' }}>⭐ {event.interestedUsers?.length || 0} People Interested</p>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {user && (
                                            <button
                                                onClick={() => handleInterest(event._id, event.title)}
                                                className="btn-outline"
                                                style={{ borderColor: 'var(--status-success)', color: 'var(--status-success)' }}
                                            >
                                                Mark Interested
                                            </button>
                                        )}
                                        <button
                                            onClick={() => getRoute(event.location.lat, event.location.lng, event._id)}
                                            className="btn-primary"
                                        >
                                            🧭 Navigation Route
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* --- RIGHT SECTION: RADIUS & NEARBY LIST --- */}
            {userLoc && (
                <div className="sidebar-box">
                    {/* Interactive Radius Slider */}
                    {/* Interactive Radius Slider */}
                    <div className="radius-panel">
                        <h4>📍 Search Distance</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <input
                                type="range"
                                min="1" max="100"
                                value={radiusKm === '' ? 1 : radiusKm}
                                onChange={e => setRadiusKm(e.target.value)}
                                style={{ flex: 1, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={radiusKm}
                                    onChange={e => {
                                        let val = e.target.value;
                                        if (val === '') {
                                            setRadiusKm('');
                                            return;
                                        }
                                        if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                                            val = val.replace(/^0+/, '');
                                            if (val === '') val = '0';
                                        }
                                        setRadiusKm(val);
                                    }}
                                    style={{ width: '65px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontWeight: '600', textAlign: 'center', fontSize: '14px' }}
                                />
                                <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>km</span>
                            </div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '18px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', color: 'var(--text-primary)' }}>
                        Nearby Events ({radiusKm}km)
                    </h3>

                    {displayedNearbyEvents.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '30px', fontSize: '14px' }}>No events found. Try increasing the radius.</p>
                    ) : (
                        displayedNearbyEvents.map(event => (
                            <div
                                key={event._id}
                                onClick={() => setMapTarget({ lat: event.location.lat, lng: event.location.lng })}
                                onMouseEnter={() => setHoveredEventId(event._id)}
                                onMouseLeave={() => setHoveredEventId(null)}
                                className={`event-card ${hoveredEventId === event._id ? 'event-card-active' : ''}`}
                            >
                                <span className="category-badge">{event.eventType}</span>
                                <h4 className="event-title">{event.title}</h4>
                                <p className="event-address">{event.location.address}</p>
                                
                                {/* NEW: Conditional Display on the Sidebar panel too */}
                                {event.showInterestCount !== false && (
                                    <p className="event-interested">👥 {event.interestedUsers?.length || 0} Interested</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}