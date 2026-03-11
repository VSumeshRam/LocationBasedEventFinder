import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, CircleMarker, LayersControl, LayerGroup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';

// Classic Icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// Custom Blinking Icon for Hover State
const blinkingIcon = new L.DivIcon({
    className: 'custom-blinking-icon',
    html: '<div class="blinking-dot"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

function MapController({ targetLoc }) {
    const map = useMap();
    useEffect(() => {
        if (targetLoc) map.flyTo([targetLoc.lat, targetLoc.lng], 14, { duration: 2.5 }); 
    }, [targetLoc, map]);
    return null;
}

export default function Home() {
    const [events, setEvents] = useState([]);
    const [userLoc, setUserLoc] = useState(null); 
    const [mapTarget, setMapTarget] = useState(null); 
    const [nearbyEvents, setNearbyEvents] = useState([]);
    const [isSearchingGPS, setIsSearchingGPS] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    
    // NEW: Radius and Hover States
    const [radiusKm, setRadiusKm] = useState(5); // Default 5km
    const [hoveredEventId, setHoveredEventId] = useState(null);

    const [routeCoords, setRouteCoords] = useState([]);
    const [routeDistance, setRouteDistance] = useState(null);
    const [selectedEventId, setSelectedEventId] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => { fetchEvents(); }, []);

    // Recalculate nearby events whenever userLoc or radiusKm changes
    useEffect(() => {
        if (userLoc && events.length > 0) {
            const userLatLng = L.latLng(userLoc.lat, userLoc.lng);
            const nearby = events.filter(event => {
                if (!event.location?.lat) return false;
                return userLatLng.distanceTo(L.latLng(event.location.lat, event.location.lng)) <= (radiusKm * 1000); 
            });
            setNearbyEvents(nearby);
        }
    }, [userLoc, radiusKm, events]);

    const fetchEvents = () => {
        axios.get('https://event-sphere-uk4j.onrender.com/api/events')
            .then(res => setEvents(res.data))
            .catch(err => console.error(err));
    };

    const handleInterest = async (eventId, eventTitle) => {
        try {
            await axios.put(`https://event-sphere-uk4j.onrender.com/api/events/${eventId}/interested`, { userId: user._id });
            fetchEvents(); 
        } catch (error) { console.error(error); }
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
                alert("Place not found! Try being more specific.");
            }
        } catch (err) { console.error(err); }
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
        } catch (err) { alert("Failed to get route."); }
    };

    const findNearbyEvents = () => {
        if (!navigator.geolocation) return alert("GPS not supported.");
        setIsSearchingGPS(true);

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                navigator.geolocation.clearWatch(watchId);
                const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLoc(loc);
                setMapTarget(loc); 
                setIsSearchingGPS(false);
            },
            (error) => {
                navigator.geolocation.clearWatch(watchId);
                alert("Location error. Please type your city in the search bar instead.");
                setIsSearchingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } 
        );
    };

    const displayedEvents = events.filter(e => filterCategory === 'All' || e.eventType === filterCategory);
    const displayedNearbyEvents = nearbyEvents.filter(e => filterCategory === 'All' || e.eventType === filterCategory);

    return (
        <div style={{ display: 'flex', gap: '20px', height: '85vh', width: '100%' }}>
            
            {/* INJECTED CSS FOR BLINKING PIN */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 51, 51, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(255, 51, 51, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 51, 51, 0); }
                }
                .blinking-dot {
                    background-color: #ff3333;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    border: 3px solid white;
                    animation: pulse 1.5s infinite;
                }
            `}</style>

            <div style={{ flex: 3, position: 'relative', borderRadius: '15px', overflow: 'hidden', border: '1px solid #ddd', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                
                <form onSubmit={handleTextSearch} style={styles.searchOverlay}>
                    <input type="text" placeholder="Search area (e.g., Kidangoor)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={styles.searchInput} />
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={styles.categoryDropdown}>
                        <option value="All">All Types</option>
                        <option value="Tech Meetup">Tech Meetup</option>
                        <option value="Hackathon">Hackathon</option>
                    </select>
                    <button type="submit" style={styles.searchBtn}>🔍</button>
                </form>

                <button onClick={findNearbyEvents} style={styles.gpsBtn}>
                    {isSearchingGPS ? "Locating..." : "📍 Near Me"}
                </button>

                <MapContainer center={[10.5, 76.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
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
                    
                    <MapController targetLoc={mapTarget} />

                    {userLoc && (
                        <>
                            {/* Circle Radius is now dynamic based on Slider */}
                            <Circle center={[userLoc.lat, userLoc.lng]} radius={radiusKm * 1000} pathOptions={{ fillColor: '#4285F4', color: '#4285F4', weight: 1.5, fillOpacity: 0.15 }} />
                            <CircleMarker center={[userLoc.lat, userLoc.lng]} radius={8} pathOptions={{ fillColor: '#4285F4', color: '#ffffff', weight: 2, fillOpacity: 1 }}>
                                <Popup><strong>You are exactly here!</strong></Popup>
                            </CircleMarker>
                        </>
                    )}

                    {routeCoords.length > 0 && <Polyline positions={routeCoords} color="#ff3333" weight={5} opacity={0.8} />}

                    {displayedEvents.map(event => (
                        <Marker 
                            key={event._id} 
                            position={[event.location.lat, event.location.lng]}
                            icon={hoveredEventId === event._id ? blinkingIcon : new L.Icon.Default()} // Swaps icon on hover
                            zIndexOffset={hoveredEventId === event._id ? 1000 : 0} // Brings hovered pin to front
                        >
                            <Popup>
                                <div style={{ minWidth: '220px', fontFamily: 'system-ui' }}>
                                    
                                    {/* Header Row with Info Button */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3 style={{ margin: '0 0 5px 0', color: '#007BFF', fontSize: '18px', paddingRight: '10px' }}>{event.title}</h3>
                                        
                                        {/* Pure CSS Tooltip for the Information Icon */}
                                        <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                                             onMouseEnter={(e) => {
                                                 const tooltip = e.currentTarget.querySelector('.info-tooltip');
                                                 if(tooltip) tooltip.style.display = 'block';
                                             }}
                                             onMouseLeave={(e) => {
                                                 const tooltip = e.currentTarget.querySelector('.info-tooltip');
                                                 if(tooltip) tooltip.style.display = 'none';
                                             }}
                                        >
                                            <div style={{ backgroundColor: '#e7f3ff', color: '#007BFF', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', border: '1px solid #007BFF' }}>
                                                i
                                            </div>
                                            
                                            {/* Tooltip Card (Hidden by default) */}
                                            <div className="info-tooltip" style={{
                                                display: 'none',
                                                position: 'absolute',
                                                top: '-10px',
                                                left: '30px',
                                                width: '240px',
                                                backgroundColor: '#fff',
                                                border: '1px solid #ccc',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                zIndex: 3000, // Very high z-index to appear over map
                                                cursor: 'default'
                                            }}>
                                                <h4 style={{ margin: '0 0 8px 0', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>📋 Event Details</h4>
                                                
                                                <div style={{ fontSize: '12px', color: '#555', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <p style={{ margin: 0 }}><strong>📅 Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                                    <p style={{ margin: 0 }}><strong>🏷️ Category:</strong> {event.eventType}</p>
                                                    {event.organizer && <p style={{ margin: 0 }}><strong>👤 Organizer:</strong> {event.organizer.name}</p>}
                                                    <p style={{ margin: 0 }}><strong>🕒 Posted:</strong> {new Date(event.createdAt).toLocaleString()}</p>
                                                    
                                                    <div style={{ marginTop: '5px' }}>
                                                        <strong>📝 Description:</strong>
                                                        <p style={{ margin: '3px 0 0 0', maxHeight: '60px', overflowY: 'auto', backgroundColor: '#f9f9f9', padding: '5px', borderRadius: '4px', border: '1px solid #eee' }}>
                                                            {event.description}
                                                        </p>
                                                    </div>

                                                    {event.regLink && (
                                                        <a href={event.regLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '5px', color: '#28a745', fontWeight: 'bold', textDecoration: 'none' }}>
                                                            🔗 Registration Link
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Default Visible Card Content */}
                                    <p style={{ fontSize: '13px', margin: '5px 0', color: '#555' }}>📍 {event.location.address}</p>
                                    <p style={{ fontSize: '13px', margin: '5px 0 10px 0', color: '#777' }}>⭐ {event.interestedUsers?.length || 0} Interested</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {user && (
                                            <button 
                                                onClick={() => handleInterest(event._id, event.title)} 
                                                style={{...styles.routeBtn, backgroundColor: '#28a745'}}
                                            >
                                                ⭐ Mark Interested
                                            </button>
                                        )}
                                        <button onClick={() => getRoute(event.location.lat, event.location.lng, event._id)} style={{...styles.routeBtn, backgroundColor: '#17a2b8'}}>
                                            🧭 Get Route
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {userLoc && (
                <div style={styles.sidebar}>
                    {/* NEW: Radius Control Panel */}
                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #ddd' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🎯 Search Radius</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                                type="range" 
                                min="1" max="50" 
                                value={radiusKm} 
                                onChange={e => setRadiusKm(Number(e.target.value))} 
                                style={{ flex: 1 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input 
                                    type="number" 
                                    min="1" max="500"
                                    value={radiusKm} 
                                    onChange={e => setRadiusKm(Number(e.target.value))}
                                    style={{ width: '50px', padding: '5px', borderRadius: '5px', border: '1px solid #ccc', textAlign: 'center' }}
                                />
                                <span style={{ marginLeft: '5px', fontWeight: 'bold', color: '#555' }}>km</span>
                            </div>
                        </div>
                    </div>

                    <h3 style={{ borderBottom: '2px solid #007BFF', paddingBottom: '10px' }}>Nearby ({radiusKm}km)</h3>
                    
                    {displayedNearbyEvents.length === 0 ? <p>No events found within {radiusKm}km.</p> : displayedNearbyEvents.map(event => (
                        <div 
                            key={event._id} 
                            onMouseEnter={() => setHoveredEventId(event._id)} // Triggers map blink
                            onMouseLeave={() => setHoveredEventId(null)}     // Stops map blink
                            style={{ padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: hoveredEventId === event._id ? '#f0f8ff' : '#fff', transition: '0.2s', borderRadius: '8px', marginBottom: '5px' }}
                        >
                            <span style={{...styles.categoryTag, fontSize: '10px'}}>{event.eventType}</span>
                            <h4 style={{ margin: '5px 0', color: '#007BFF' }}>{event.title}</h4>
                            <p style={{ fontSize: '12px', margin: '5px 0' }}>{event.location.address}</p>
                            <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>👥 {event.interestedUsers?.length || 0} Interested</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    searchOverlay: { position: 'absolute', top: '20px', left: '60px', zIndex: 1000, display: 'flex', width: '450px', borderRadius: '30px', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' },
    searchInput: { flex: 2, padding: '12px 20px', border: 'none', outline: 'none' },
    categoryDropdown: { flex: 1, padding: '12px', border: 'none', borderLeft: '1px solid #eee', outline: 'none', background: '#f9f9f9', cursor: 'pointer', color: '#555' },
    searchBtn: { padding: '0 20px', background: '#007BFF', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px' },
    gpsBtn: { position: 'absolute', top: '20px', right: '20px', zIndex: 1000, padding: '12px 20px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
    sidebar: { flex: 1, padding: '20px', background: '#fff', borderRadius: '15px', border: '1px solid #ddd', overflowY: 'auto' },
    categoryTag: { backgroundColor: '#e7f3ff', color: '#007BFF', padding: '3px 8px', fontSize: '11px', borderRadius: '12px', fontWeight: 'bold' },
    routeBtn: { padding: '8px', border: 'none', background: '#17a2b8', color: 'white', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};