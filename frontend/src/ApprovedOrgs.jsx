import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ApprovedOrgs() {
    const [approvedOrgs, setApprovedOrgs] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedOrgId, setExpandedOrgId] = useState(null);
    const [revokeReason, setRevokeReason] = useState("");
    const [revokingOrgId, setRevokingOrgId] = useState(null);

    // Fetch approved organizations and all events on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const orgsRes = await axios.get('https://event-sphere-uk4j.onrender.com/api/admin/approved-organizers');
            setApprovedOrgs(orgsRes.data);

            const eventsRes = await axios.get('https://event-sphere-uk4j.onrender.com/api/events');
            setAllEvents(eventsRes.data);

            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch approved organizations or events");
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm("Are you sure you want to revoke this organizer's approval? They will no longer be able to post events.")) return;

        try {
            // Optimistic update
            const updatedOrgs = approvedOrgs.filter(org => org._id !== id);
            setApprovedOrgs(updatedOrgs);

            await axios.put(`https://event-sphere-uk4j.onrender.com/api/admin/revoke-organizer/${id}`, {
                reason: revokeReason
            });
            alert("Organization approval revoked.");
            setRevokingOrgId(null);
            setRevokeReason("");
        } catch (err) {
            alert("Failed to revoke approval.");
            fetchData(); // Revert on failure
        }
    };

    // Filter organizations based on search query
    const filteredOrgs = approvedOrgs.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading organizations...</p>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #007BFF', paddingBottom: '10px', marginBottom: '20px' }}>
                <h2 style={{ color: '#333', margin: 0 }}>
                    🏢 Approved Organizations
                </h2>
                <input
                    type="text"
                    placeholder="🔍 Search by organization name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        padding: '10px 15px',
                        borderRadius: '20px',
                        border: '1px solid #ccc',
                        width: '300px',
                        outline: 'none',
                    }}
                />
            </div>

            {filteredOrgs.length === 0 ? (
                <p style={{ color: '#777', textAlign: 'center', marginTop: '40px', fontSize: '18px' }}>
                    No approved organizations match your search.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredOrgs.map(org => {
                        const orgEvents = allEvents.filter(event => event.organizer?._id === org._id);
                        const isExpanded = expandedOrgId === org._id;

                        return (
                            <div key={org._id} style={{
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s'
                            }}>
                                {/* Header / Summary Row */}
                                <div
                                    onClick={() => setExpandedOrgId(isExpanded ? null : org._id)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '15px 20px',
                                        cursor: 'pointer',
                                        backgroundColor: isExpanded ? '#f8f9fa' : '#fff',
                                    }}>
                                    <div>
                                        <strong style={{ fontSize: '18px', color: '#333' }}>{org.name}</strong>
                                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>{org.email}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span style={{ fontSize: '14px', color: '#555', backgroundColor: '#eef8f0', padding: '4px 10px', borderRadius: '12px' }}>
                                            🗓️ {orgEvents.length} Events Posted
                                        </span>
                                        <span style={{ fontSize: '20px', color: '#999' }}>
                                            {isExpanded ? '🔼' : '🔽'}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Details Row */}
                                {isExpanded && (
                                    <div style={{ padding: '20px', borderTop: '1px solid #eee', backgroundColor: '#fafbfc' }}>
                                        
                                        {/* Actions */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                                            {revokingOrgId === org._id ? (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Reason for revocation..."
                                                        value={revokeReason}
                                                        onChange={(e) => setRevokeReason(e.target.value)}
                                                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '250px' }}
                                                    />
                                                    <button onClick={() => handleRevoke(org._id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        Confirm Revoke
                                                    </button>
                                                    <button onClick={() => setRevokingOrgId(null)} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setRevokingOrgId(org._id)}
                                                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                    🚨 Revoke Approval
                                                </button>
                                            )}
                                        </div>

                                        <h4 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                                            Event History ({orgEvents.length})
                                        </h4>
                                        
                                        {orgEvents.length === 0 ? (
                                            <p style={{ color: '#777', fontStyle: 'italic' }}>This organization hasn't posted any events yet.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                                                {orgEvents.map(event => (
                                                    <div key={event._id} style={{ backgroundColor: '#fff', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <strong style={{ display: 'block', fontSize: '16px', marginBottom: '5px', color: '#007BFF' }}>{event.title}</strong>
                                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#555' }}>
                                                            <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                                                        </p>
                                                        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#555' }}>
                                                            <strong>Location:</strong> {event.location?.address}
                                                        </p>
                                                        <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>
                                                            <strong>Interested:</strong> {event.interestedUsers?.length || 0} users
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
