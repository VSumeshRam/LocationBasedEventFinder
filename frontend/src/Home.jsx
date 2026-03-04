import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';

// Leaflet icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

export default function Home() {
    const [events, setEvents] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        axios.get('http://localhost:5000/api/events')
            .then(res => setEvents(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleInterest = (title) => {
        alert(`Awesome! You've marked interest in "${title}". The organizer has been notified.`);
    };

    return (
        <div style={{ height: '80vh', width: '100%' }}>
            <MapContainer center={[10.5, 76.5]} zoom={7} style={{ height: '100%', width: '100%', borderRadius: '10px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {events.map(event => (
                    <Marker key={event._id} position={[event.location.lat, event.location.lng]}>
                        <Popup>
                            <div style={{ minWidth: '150px' }}>
                                <span style={{ backgroundColor: '#eee', padding: '2px 5px', fontSize: '10px', borderRadius: '3px' }}>{event.eventType}</span>
                                <h3 style={{ margin: '5px 0' }}>{event.title}</h3>
                                <p style={{ fontSize: '12px', color: '#555' }}>{event.description}</p>
                                <p><strong>📅 Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                <p><strong>📍 Place:</strong> {event.location.address}</p>

                                <a href={event.regLink} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', backgroundColor: '#007BFF', color: 'white', padding: '8px', textDecoration: 'none', borderRadius: '5px', marginBottom: '10px' }}>
                                    Register Now
                                </a>

                                {user ? (
                                    <button onClick={() => handleInterest(event.title)} style={{ width: '100%', padding: '8px', border: '1px solid #28a745', backgroundColor: 'transparent', color: '#28a745', cursor: 'pointer', borderRadius: '5px' }}>
                                        Interested?
                                    </button>
                                ) : (
                                    <p style={{ fontSize: '11px', color: '#dc3545', textAlign: 'center' }}><i>Login to mark interest</i></p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}