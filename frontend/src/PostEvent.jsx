import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

export default function PostEvent() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        locationName: '',
        eventType: 'Workshop',
        regLink: '',
        lat: null,
        lng: null
    });

    // Custom Map Component to handle clicking and dropping a pin
    const LocationPicker = () => {
        useMapEvents({
            click(e) {
                setFormData({ ...formData, lat: e.latlng.lat, lng: e.latlng.lng });
            },
        });

        return formData.lat === null ? null : (
            <Marker position={[formData.lat, formData.lng]}></Marker>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Block submission if they forgot to drop a pin
        if (!formData.lat || !formData.lng) {
            alert("📍 Please click on the map to drop a pin for the exact location!");
            return;
        }

        try {
            await axios.post('http://localhost:5000/api/events', {
                ...formData,
                location: {
                    address: formData.locationName,
                    lat: formData.lat,
                    lng: formData.lng
                },
                organizer: user._id
            });
            alert("Event Published to Map!");
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.message || "Post failed. Ensure you are verified.");
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '20px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#28a745', textAlign: 'center', marginBottom: '20px' }}>📢 Post New Event</h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="text" placeholder="Event Title" required style={styles.input} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                <textarea placeholder="Description" required style={{ ...styles.input, height: '80px' }} onChange={e => setFormData({ ...formData, description: e.target.value })} />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="date" required style={{ ...styles.input, flex: 1 }} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    <select style={{ ...styles.input, flex: 1 }} onChange={e => setFormData({ ...formData, eventType: e.target.value })}>
                        <option value="Workshop">Workshop</option>
                        <option value="Conference">Conference</option>
                        <option value="Meetup">Meetup</option>
                    </select>
                </div>

                <input type="url" placeholder="Registration Link (URL)" required style={styles.input} onChange={e => setFormData({ ...formData, regLink: e.target.value })} />

                <hr style={{ width: '100%', border: '1px solid #eee', margin: '10px 0' }} />

                <h3 style={{ margin: '0', fontSize: '16px' }}>📍 Event Location</h3>
                <input type="text" placeholder="Venue Name (e.g., Main Town Hall)" required style={styles.input} onChange={e => setFormData({ ...formData, locationName: e.target.value })} />

                <p style={{ fontSize: '13px', color: '#666', margin: '0' }}>Click on the map below to drop a pin at the exact location.</p>

                {/* The Interactive Map for dropping a pin */}
                <div style={{ height: '300px', width: '100%', border: '2px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapContainer center={[10.5, 76.5]} zoom={7} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationPicker />
                    </MapContainer>
                </div>

                <button type="submit" style={styles.button}>Publish to Map 📍</button>
            </form>
        </div>
    );
}

const styles = {
    input: { padding: '12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', width: '100%' },
    button: { padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }
};