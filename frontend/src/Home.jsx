import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

export default function Home() {
    const [events, setEvents] = useState([]);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = () => {
        axios.get('http://localhost:5000/api/events')
            .then(res => setEvents(res.data))
            .catch(err => console.error(err));
    };

    const handleInterest = async (eventId, eventTitle) => {
        try {
            await axios.put(`http://localhost:5000/api/events/${eventId}/interested`, {
                userId: user._id
            });
            alert(`Awesome! You've marked interest in "${eventTitle}".`);
            fetchEvents(); // Refresh map data
        } catch (error) {
            console.error(error);
            alert("Something went wrong marking your interest.");
        }
    };

    return (
        <div style={{ height: '80vh', width: '100%' }}>
            <MapContainer center={[10.5, 76.5]} zoom={7} style={{ height: '100%', width: '100%', borderRadius: '10px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {events.map(event => (
                    <Marker key={event._id} position={[event.location.lat, event.location.lng]}>
                        <Popup>
                            <div style={{ minWidth: '180px' }}>
                                <span style={{ backgroundColor: '#f0f0f0', padding: '2px 6px', fontSize: '11px', borderRadius: '4px' }}>{event.eventType}</span>
                                <h3 style={{ margin: '8px 0' }}>{event.title}</h3>
                                <p style={{ fontSize: '13px' }}><strong>📍 Place:</strong> {event.location.address}</p>
                                <p style={{ fontSize: '13px' }}><strong>📅 Date:</strong> {new Date(event.date).toLocaleDateString()}</p>

                                <a href={event.regLink} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', backgroundColor: '#007BFF', color: 'white', padding: '10px', textDecoration: 'none', borderRadius: '6px', margin: '10px 0' }}>
                                    Register Here
                                </a>

                                {user ? (
                                    <button
                                        onClick={() => handleInterest(event._id, event.title)}
                                        disabled={event.interestedUsers?.includes(user._id)}
                                        style={{
                                            width: '100%', padding: '10px',
                                            border: event.interestedUsers?.includes(user._id) ? 'none' : '1px solid #28a745',
                                            backgroundColor: event.interestedUsers?.includes(user._id) ? '#e9ecef' : 'transparent',
                                            color: event.interestedUsers?.includes(user._id) ? '#6c757d' : '#28a745',
                                            cursor: event.interestedUsers?.includes(user._id) ? 'not-allowed' : 'pointer',
                                            borderRadius: '6px', fontWeight: 'bold'
                                        }}>
                                        {event.interestedUsers?.includes(user._id) ? '✓ Interest Noted' : 'Interested'}
                                    </button>
                                ) : (
                                    <p style={{ fontSize: '12px', color: '#dc3545', textAlign: 'center' }}><i>Login to mark interest</i></p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}