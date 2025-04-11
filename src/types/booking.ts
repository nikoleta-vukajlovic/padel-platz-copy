
export interface PricingPeriod {
  startTime: string;
  endTime: string;
  pricePerHalfHour: number;
}

export interface Court {
  id: string;
  name: string;
  description: string;
  type: 'indoor' | 'outdoor';
  features: string[];
  pricingPeriods: PricingPeriod[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  availableCourts: Court[];
}

export interface Booking {
  id: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled' | 'no-show';
  userId?: string;
  managerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  price: number;
}

export interface BlogPost {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    author: string;
    createdAt: string;
}
