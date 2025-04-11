import {createContext, useContext, useEffect, useState} from "react";
import {auth, db} from "@/lib/firebase";
import {User} from "firebase/auth";
import {doc, getDoc} from "firebase/firestore";

interface UserProfile {
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
    emailVerified?: boolean;
    birthdate?: string;
    noShowUser?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    userRole: string | null;
    userProfile: UserProfile | null;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    userRole: null,
    userProfile: null,
    refreshUserProfile: async () => {
    }
});

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const fetchUserProfile = async (userId: string) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const data = userDoc.data() as UserProfile;
                setUserRole(data.role || null);
                setUserProfile(data);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const refreshUserProfile = async () => {
        if (user) {
            await fetchUserProfile(user.uid);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                await fetchUserProfile(user.uid);
            } else {
                setUserRole(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{user, loading, userRole, userProfile, refreshUserProfile}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);