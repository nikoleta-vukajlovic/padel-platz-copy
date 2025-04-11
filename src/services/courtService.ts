import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from "firebase/firestore";
import { Court } from "@/types/booking";

export const courtService = {
  async getAllCourts(): Promise<Court[]> {
    try {
      const courtsRef = collection(db, "courts");
      const snapshot = await getDocs(courtsRef);
      const courts = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Court[];
      return courts.sort((a, b) => a.id.localeCompare(b.id));
    } catch (error) {
      console.error("Error fetching courts:", error);
      throw new Error("Failed to fetch courts");
    }
  },

  async createCourt(court: Omit<Court, "id">): Promise<Court> {
    try {
      const courtsRef = collection(db, "courts");
      const docRef = await addDoc(courtsRef, court);
      return {
        ...court,
        id: docRef.id
      };
    } catch (error) {
      console.error("Error creating court:", error);
      throw new Error("Failed to create court");
    }
  },

  async updateCourt(id: string, court: Partial<Court>): Promise<void> {
    try {
      const courtRef = doc(db, "courts", id);
      await updateDoc(courtRef, court);
    } catch (error) {
      console.error("Error updating court:", error);
      throw new Error("Failed to update court");
    }
  },

  async deleteCourt(id: string): Promise<void> {
    try {
      const courtRef = doc(db, "courts", id);
      await deleteDoc(courtRef);
    } catch (error) {
      console.error("Error deleting court:", error);
      throw new Error("Failed to delete court");
    }
  }
};