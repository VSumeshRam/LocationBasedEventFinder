import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Profile() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [myEvents, setMyEvents] = useState([]);

    useEffect(() => {
        if (user?.role === 'Organizer') {
            fetchMyEvents();
        }
    }, [user?._id, user?.role]);

    const fetchMyEvents = () => {
        axios.get('http://localhost:5000/api/events')
            .then(res => {
                const filtered = res.data.filter(e => e.organizer?._id === user._id);
                setMyEvents(filtered);
            })
            .catch(err => console.error(err));
    };

    // NEW: The function that runs when you click Delete
    const handleDelete = async (eventId) => {
        // Add a confirmation popup so you don't delete by accident
        if (!window.confirm("Are you sure you want to permanently delete this event?")) return;

        try {
            await axios.delete(`http://localhost:5000/api/events/${eventId}`);

            // Instantly remove the event from the screen without refreshing the page
            setMyEvents(myEvents.filter(event => event._id !== eventId));
            alert("Event deleted successfully!");

        } catch (error) {
            console.error(error);
            alert("Failed to delete the event.");
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px' }}>
            <div style={styles.card}>
                <h2 style={{ borderBottom: '2px solid #007BFF', paddingBottom: '10px' }}>👤 Account Settings</h2>
                <p><strong>Name:</strong> {user?.name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Account Type:</strong>
                    <span style={styles.badge}>{user?.role}</span>
                </p>
            </div>

            {user?.role === 'Organizer' && (
                <div style={{ marginTop: '30px' }}>
                    <h3>🛠️ Manage Your Events</h3>
                    {myEvents.length === 0 ? (
                        <p>You haven't posted any events yet.</p>
                    ) : (
                        myEvents.map(event => (
                            <div key={event._id} style={styles.eventItem}>
                                <div>
                                    <strong>{event.title}</strong>
                                    <p style={{ fontSize: '12px', color: '#666' }}>
                                        {event.location?.address} | {new Date(event.date).toLocaleDateString()}
                                    </p>
                                </div>
                                {/* The button is now connected to the handleDelete function */}
                                <button onClick={() => handleDelete(event._id)} style={styles.deleteBtn}>
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    card: { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    badge: { marginLeft: '10px', backgroundColor: '#e7f3ff', color: '#007BFF', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    eventItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee' },
    deleteBtn: { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }
};