import { Toaster } from '@/components/ui/sonner';
import { createClient } from '@supabase/supabase-js';
import type { UserPermissions } from '@/types/sheets';
import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '@/SupabaseClient';

interface AuthState {
    loggedIn: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    loading: boolean;
    user: UserPermissions;
}

const AuthContext = createContext<AuthState | null>(null);



export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const stored = localStorage.getItem('auth');
        if (stored) {
            try {
                const { username } = JSON.parse(stored);
                // Fetch from Supabase instead of Google Sheets
                supabase
                    .from('user')
                    .select('*')
                    .eq('user_name', username)
                    .then(({ data, error }) => {
                        if (error) {
                            console.error('Error fetching user data:', error);
                            localStorage.removeItem('auth');
                            setLoading(false);
                            return;
                        }
                        
                        const user = data?.[0] as UserPermissions;
                        if (user) {
                            setUserPermissions(user);
                            setLoggedIn(true);
                        }
                        setLoading(false);
                    });
            } catch (error) {
                console.error('Error parsing stored auth data:', error);
                localStorage.removeItem('auth');
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    async function login(username: string, password: string) {
        try {
            // Fetch from Supabase instead of Google Sheets
            const { data, error } = await supabase
                .from('user')
                .select('*')
                .eq('user_name', username)
                .eq('password', password);

            if (error) {
                console.error('Error during login:', error);
                return false;
            }

            const user = data?.[0] as UserPermissions;
            if (user === undefined) {
                return false;
            }

            localStorage.setItem('auth', JSON.stringify({ username }));
            setUserPermissions(user);
            setLoggedIn(true);
            return true;
        } catch (error) {
            console.error('Error during login:', error);
            return false;
        }
    }

    function logout() {
        localStorage.removeItem('auth');
        setLoggedIn(false);
        setUserPermissions(null);
    }

    // Create a default user object to prevent undefined errors
    const defaultUser: UserPermissions = userPermissions || {} as UserPermissions;

    return (
        <AuthContext.Provider value={{ 
            login, 
            loggedIn, 
            logout, 
            user: defaultUser, 
            loading 
        }}>
            {children}
            <Toaster expand richColors theme="light" closeButton />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};