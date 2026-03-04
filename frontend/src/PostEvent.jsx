import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PostEvent() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        locationName: '',
        eventType: 'Workshop', // Default type
        regLink: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // We combine the form data with the organizer's ID and random Kerala coordinates for the MVP
            await axios.post('http://localhost:5000/api/events', {
                ...formData,
                location: {
                    address: formData.locationName,
                    lat: 10.0 + (Math.random() * 0.5), // Random near Kerala
                    lng: 76.0 + (Math.random() * 0.5)
                },
                organizer: user._id
            });

            alert("Event Posted Successfully!");
            navigate('/'); // Go back to map to see the new pin
        } catch (err) {
            alert(err.response?.data?.message || "Failed to post event.");
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '20px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', backgroundColor: '#fff' }}>
            <h2 style={{ color: '#28a745', textAlign: 'center' }}>📢 Post New Event</h2>
            <form onSubmit={handleSubmit}>
                <label>Event Title</label>
                <input type="text" placeholder="e.g. KTU Tech Fest" required style={styles.input} onChange={e => setFormData({ ...formData, title: e.target.value })} />

                <label>Description</label>
                <textarea placeholder="Tell us about the event..." required style={{ ...styles.input, height: '80px' }} onChange={e => setFormData({ ...formData, description: e.target.value })} />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label>Date</label>
                        <input type="date" required style={styles.input} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Event Type</label>
                        <select style={styles.input} onChange={e => setFormData({ ...formData, eventType: e.target.value })}>
                            <option value="Workshop">Workshop</option>
                            <option value="Conference">Conference</option>
                            <option value="Meetup">Meetup</option>
                            <option value="Concert">Concert</option>
                        </select>
                    </div>
                </div>

                <label>Place / Venue Name</label>
                <input type="text" placeholder="e.g. Town Hall, Ernakulam" required style={styles.input} onChange={e => setFormData({ ...formData, locationName: e.target.value })} />

                <label>Registration Link (URL)</label>
                <input type="url" placeholder="https://example.com/register" required style={styles.input} onChange={e => setFormData({ ...formData, regLink: e.target.value })} />

                <button type="submit" style={styles.button}>Publish to Map 📍</button>
            </form>
        </div>
    );
}

const styles = {
    input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
    button: { width: '100%', padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }
};