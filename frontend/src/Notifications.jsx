import { useState, useEffect } from 'react';
import axios from 'axios';

// Helper function to format date like Facebook/Instagram
const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Map Notification type to icons/colors
const getTypeStyles = (type) => {
    switch (type) {
        case 'Approval':
            return { icon: '✅', color: '#28a745', bg: '#eef8f0' };
        case 'Event Interaction':
            return { icon: '⭐', color: '#ffb400', bg: '#fffdf5' };
        case 'System':
        default:
            return { icon: '🔔', color: '#1877F2', bg: '#f0f2f5' }; // Facebook blue
    }
};

export default function Notifications() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (user && user._id) {
            axios.get(`https://event-sphere-uk4j.onrender.com/api/notifications/${user._id}`)
                .then(res => setNotifications(res.data))
                .catch(err => console.error(err));
        }
    }, [user?._id]);

    const handleMarkAsRead = async (id) => {
        try {
            await axios.put(`https://event-sphere-uk4j.onrender.com/api/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) { console.error(error); }
    };

    if (!user) return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'system-ui' }}>Please login to view notifications.</div>;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div style={{ maxWidth: '600px', margin: '30px auto', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e4e6eb', paddingBottom: '15px', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#050505', fontSize: '24px', fontWeight: 'bold' }}>Notifications</h2>
                {unreadCount > 0 && (
                    <span style={{ backgroundColor: '#e41e3f', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                        {unreadCount} New
                    </span>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#65676B' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                    <p style={{ margin: 0, fontWeight: '500' }}>You have no notifications right now.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map(note => {
                        const styles = getTypeStyles(note.type);

                        return (
                            <div
                                key={note._id}
                                onClick={() => handleMarkAsRead(note._id)}
                                style={{
                                    display: 'flex',
                                    padding: '12px 16px',
                                    backgroundColor: note.isRead ? '#fff' : '#e7f3ff', // Soft blue for unread
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    borderRadius: '8px',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    if (note.isRead) e.currentTarget.style.backgroundColor = '#f2f2f2';
                                }}
                                onMouseLeave={(e) => {
                                    if (note.isRead) e.currentTarget.style.backgroundColor = '#fff';
                                }}
                            >
                                {/* Active Indicator Dot */}
                                {!note.isRead && (
                                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '10px', height: '10px', backgroundColor: '#1877F2', borderRadius: '50%' }}></div>
                                )}

                                {/* Icon Circle */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: styles.bg,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    fontSize: '22px',
                                    flexShrink: 0
                                }}>
                                    {styles.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, paddingRight: '20px' }}>
                                    <p style={{
                                        margin: '0 0 4px 0',
                                        fontSize: '15px',
                                        color: '#050505',
                                        lineHeight: '1.4',
                                        fontWeight: note.isRead ? 'normal' : '600'
                                    }}>
                                        {note.message}
                                    </p>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '13px', color: styles.color, fontWeight: '600' }}>
                                            {note.type}
                                        </span>
                                        <span style={{ color: '#65676B', fontSize: '13px' }}>•</span>
                                        <span style={{ fontSize: '13px', color: '#65676B' }}>
                                            {formatTimeAgo(note.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}