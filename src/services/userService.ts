import { db } from "@/lib/firebase";
 import {collection, deleteDoc, doc, getDoc, getDocs, updateDoc} from "firebase/firestore";
 import { deleteUser } from "firebase/auth";

 interface UserProfile {
   name?: string;
   phone?: string;
   email?: string;
   role?: string;
   birthdate?: string;
   noShowUser?: boolean
 }

 export const userService = {
   async getAllUsers(): Promise<UserProfile[]> {
        try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        return usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as UserProfile[];
        } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
        }
   },

     async deleteCurrentUser(userId: object): Promise<void> {
        try {
            console.log("Deleting user with ID:", userId);
            const userRef = doc(db, "users", userId.id);
            await deleteDoc(userRef);
        } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
     }
    },

   async updateUserProfile(userId: string, profileData: UserProfile): Promise<void> {
     try {
       await updateDoc(doc(db, "users", userId), {
         ...profileData,
         updatedAt: new Date().toISOString()
       });
     } catch (error) {
       console.error("Error updating user profile:", error);
       throw error;
     }
   }
 };