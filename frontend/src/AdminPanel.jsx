import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPanel() {
    const [pendingOrgs, setPendingOrgs] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch the list of unapproved organizations
    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const { data } = await axios.get('https://event-sphere-uk4j.onrender.com/api/admin/pending-organizers');
            setPendingOrgs(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch pending organizations");
            setLoading(false);
        }
    };

    // 2. The Approval Logic
    const handleApprove = async (id) => {
        try {
            await axios.put(`https://event-sphere-uk4j.onrender.com/api/admin/approve-organizer/${id}`);
            alert("Organization Approved! They can now log in and post events.");
            fetchPending(); // Refresh the list
        } catch (err) {
            alert("Approval failed.");
        }
    };

    if (loading) return <p>Loading requests...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #dc3545', paddingBottom: '10px' }}>
                🛡️ Admin Approval Queue
            </h2>

            {pendingOrgs.length === 0 ? (
                <p style={{ color: '#777', marginTop: '20px' }}>No pending approval requests at the moment.</p>
            ) : (
                <div style={{ marginTop: '20px' }}>
                    {pendingOrgs.map(org => (
                        <div key={org._id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '15px',
                            backgroundColor: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            marginBottom: '10px'
                        }}>
                            <div>
                                <strong style={{ fontSize: '18px' }}>{org.name}</strong>
                                <p style={{ margin: '5px 0', color: '#555' }}>{org.email}</p>
                            </div>
                            <button
                                onClick={() => handleApprove(org._id)}
                                style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                Approve Organization
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}