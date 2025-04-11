
import { db } from "@/lib/firebase";
import {collection, query, where, getDocs, addDoc, Timestamp, doc, updateDoc, orderBy, limit} from "firebase/firestore";
import { Booking, TimeSlot, Court } from "@/types/booking";
import { courtService } from "./courtService";

export const bookingService = {
  async getAvailableSlots(date: string) {
    try {
      const [courts, bookingsSnapshot] = await Promise.all([
        courtService.getAllCourts(),
        getDocs(query(
          collection(db, "bookings"),
          where("date", "==", date),
          where("status", "==", "confirmed")
        ))
      ]);
      
      const bookedSlots = bookingsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Booking[];
      
      return generateAvailableTimeSlots(bookedSlots, courts);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      throw new Error("Failed to fetch available slots");
    }
  },

  async getAvailableCourts(date: string, startTime: string, endTime: string): Promise<Court[]> {
    try {
      const [courts, bookingsSnapshot] = await Promise.all([
        courtService.getAllCourts(),
        getDocs(query(
          collection(db, "bookings"),
          where("date", "==", date),
          where("status", "==", "confirmed")
        ))
      ]);
      
      const bookedSlots = bookingsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Booking[];
      
      return courts.filter(court => 
        !isTimeSlotBookedForCourt(startTime, endTime, court.id, bookedSlots)
      );
    } catch (error) {
      console.error("Error finding available courts:", error);
      throw new Error("Failed to find available courts");
    }
  },

  async createBooking(booking: Omit<Booking, "id" | "createdAt" | "status">) {
    try {
      const bookingsRef = collection(db, "bookings");
      
      // Check if the time slot is still available
      const existingBookings = await this.getAllBookingsForDate(booking.date);
      const isSlotTaken = existingBookings.some(existingBooking => 
        existingBooking.courtId === booking.courtId &&
        ((existingBooking.startTime <= booking.startTime && existingBooking.endTime > booking.startTime) ||
         (existingBooking.startTime < booking.endTime && existingBooking.endTime >= booking.endTime) ||
         (existingBooking.startTime >= booking.startTime && existingBooking.endTime <= booking.endTime))
      );

      if (isSlotTaken) {
        throw new Error("This time slot is no longer available");
      }

      const newBooking = {
        ...booking,
        createdAt: Timestamp.now(),
        status: "confirmed" as const
      };
      
      const docRef = await addDoc(bookingsRef, newBooking);
      return {
        ...newBooking,
        id: docRef.id,
        createdAt: newBooking.createdAt.toDate().toISOString()
      };
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to create booking");
    }
  },

  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: status
      });
    } catch (error) {
      console.error(`Error setting status ${status} to booking:`, error);
      throw new Error(`Failed to set status ${status} to booking`);
    }
  },

  async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt.toDate().toISOString()
        } as Booking;
      });
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      throw new Error("Failed to fetch user bookings");
    }
  },

  async getAllBookingsForDate(date: string, all?: boolean): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, "bookings");

      const queryConstraints = [
        where("date", "==", date),
        orderBy("startTime")
      ];

      if (!all) {
        queryConstraints.push(where("status", "==", "confirmed"));
      }

      const q = query(
        bookingsRef,
        ...queryConstraints
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt.toDate().toISOString()
      })) as Booking[];
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw new Error("Failed to fetch bookings");
    }
  },

  async getAllBookings(bookingLimit: number): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, "bookings");
      const q = query(
          bookingsRef,
          orderBy("date", "desc"),  // Primary sort: date (newest first)
          orderBy("startTime", "asc"),  // Secondary sort: time (earliest first)
          limit(bookingLimit)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          // Handle optional/undefined fields safely
          createdAt: data.createdAt?.toDate()?.toISOString() || null
        } as Booking;
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  }
};

const generateAvailableTimeSlots = (bookedSlots: Booking[], courts: Court[]): TimeSlot[] => {
  const timeSlots: TimeSlot[] = [];
  const startHour = 7;
  const endHour = 23;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const endMinute = minute === 30 ? 0 : 30;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

      const availableCourts = courts.filter(court => 
        !isTimeSlotBookedForCourt(time, endTime, court.id, bookedSlots)
      );

      timeSlots.push({
        startTime: time,
        endTime,
        isAvailable: availableCourts.length > 0,
        availableCourts
      });
    }
  }

  return timeSlots;
};

const isTimeSlotBookedForCourt = (
  startTime: string,
  endTime: string,
  courtId: string,
  bookedSlots: Booking[]
): boolean => {
  return bookedSlots.some(booking => 
    booking.courtId === courtId &&
    ((booking.startTime <= startTime && booking.endTime > startTime) ||
     (booking.startTime < endTime && booking.endTime >= endTime) ||
     (booking.startTime >= startTime && booking.endTime <= endTime))
  );
};
