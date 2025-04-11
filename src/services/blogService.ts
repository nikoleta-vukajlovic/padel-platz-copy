import {db} from "@/lib/firebase";
import {collection, doc, getDoc, getDocs, updateDoc} from "firebase/firestore";
import {BlogPost, Court} from "@/types/booking";

export const blogService = {
    async getBlogs(): Promise<BlogPost[]> {
        try {
            const blogsRef = collection(db, "blogs");
            const snapshot = await getDocs(blogsRef);
            return snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as BlogPost[];
        } catch (error) {
            console.error("Error fetching blogs:", error);
            throw new Error("Failed to fetch blogs");
        }
    },

    async getBlogById(id: string) {
        try {
            const userDoc = await getDoc(doc(db, "blogs", id));
            if (userDoc.exists()) {
                return userDoc.data() as BlogPost;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            throw error;
        }
    }
}