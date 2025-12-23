'use client';

import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface LogoutButtonProps {
    clearTokens?: boolean;
}

export default function LogoutButton({ clearTokens = false }: LogoutButtonProps) {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);

        try {
            // Clear all localStorage data
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
                console.log('✅ Cleared localStorage and sessionStorage');
            }

            // If clearTokens is true, call the API to clear OAuth tokens from database
            if (clearTokens) {
                try {
                    const response = await fetch('/api/auth/clear-tokens', {
                        method: 'POST',
                    });

                    if (response.ok) {
                        console.log('✅ Cleared OAuth tokens from database');
                    } else {
                        console.warn('⚠️  Failed to clear OAuth tokens from database');
                    }
                } catch (error) {
                    console.error('❌ Error clearing tokens:', error);
                }
            }

            // Sign out from NextAuth
            await signOut({
                callbackUrl: '/admin/login',
                redirect: true,
            });
        } catch (error) {
            console.error('❌ Error during logout:', error);
            setIsLoggingOut(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
        >
            {isLoggingOut ? (
                <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </>
            )}
        </button>
    );
}
