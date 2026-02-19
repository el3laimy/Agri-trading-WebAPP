import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSeasons } from '../api/seasons';

const SeasonContext = createContext();

export function useSeason() {
    return useContext(SeasonContext);
}

export function SeasonProvider({ children }) {
    const [seasons, setSeasons] = useState([]);
    const [activeSeason, setActiveSeason] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshSeasons = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSeasons();
            setSeasons(data);
            const active = data.find(s => s.status === 'ACTIVE');
            setActiveSeason(active || null);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch seasons", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSeasons();
    }, [refreshSeasons]);

    const value = {
        seasons,
        activeSeason,
        loading,
        error,
        refreshSeasons
    };

    return (
        <SeasonContext.Provider value={value}>
            {children}
        </SeasonContext.Provider>
    );
}
