import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getCurrentUser } from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const userData = await getCurrentUser(token);
                    setUser(userData);
                } catch (err) {
                    console.error('Failed to get user:', err);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [token]);

    const login = async (username, password) => {
        setError(null);
        try {
            const data = await apiLogin(username, password);
            // In session auth, we get 'session_token' (and 'access_token' for compat)
            const newToken = data.session_token || data.access_token;
            const userData = data.user;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData)); // Store user data for offline/quick access

            setToken(newToken);
            setUser(userData);

            return true;
        } catch (err) {
            console.error('Login error:', err);
            let message = 'فشل تسجيل الدخول';

            if (err.response) {
                if (typeof err.response.data.detail === 'string') {
                    message = err.response.data.detail;
                } else if (Array.isArray(err.response.data.detail)) {
                    // FastAPI validation error
                    message = err.response.data.detail.map(e => e.msg).join(', ');
                } else if (err.response.data.detail) {
                    message = JSON.stringify(err.response.data.detail);
                } else {
                    message = `HTTP Error ${err.response.status}: ${err.response.statusText}`;
                }
            } else if (err.message) {
                message = err.message;
            }

            setError(message);
            return false;
        }
    };

    const logout = async () => {
        if (token) {
            try {
                // Call backend logout
                await import('../api/auth').then(mod => mod.logout(token));
            } catch (e) {
                console.warn("Backend logout failed", e);
            }
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const hasPermission = (permission) => {
        if (!user) return false;
        if (user.is_superuser) return true;

        if (user.permissions && Array.isArray(user.permissions)) {
            return user.permissions.includes(permission);
        }
        return false;
    };

    const updateConfig = async (newConfig) => {
        if (!user || !token) return;

        // Update local state immediately for UI responsiveness
        const updatedUser = { ...user, dashboard_config: JSON.stringify(newConfig) };
        setUser(updatedUser);

        // Update backend
        try {
            await import('../api/auth').then(mod => mod.updateDashboardConfig(token, newConfig));
        } catch (err) {
            console.error("Failed to save dashboard config:", err);
            // Optionally revert local state here if strict consistency needed
        }
    };

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        updateConfig
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
