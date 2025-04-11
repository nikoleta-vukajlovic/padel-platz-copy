import {useEffect, useState} from "react";
import {useAuth} from "@/contexts/AuthContext";
import {useRouter} from "next/router";
import {Layout} from "@/components/layout/Layout";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {DateSlider} from "@/components/booking/DateSlider";
import {bookingService} from "@/services/bookingService";
import {format, addMinutes, parse, parseISO, isPast} from "date-fns";
import {Booking} from "@/types/booking";
import {useToast} from "@/hooks/use-toast";
import {Input} from "@/components/ui/input";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {courtService} from "@/services/courtService";
import {Button} from "@/components/ui/button";
import {Court} from "@/types/booking";
import {PricingPeriod} from "@/types/booking";
import {calculateBookingPrice} from "@/lib/price-calculator";
import {userService} from "@/services/userService";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

interface BookingFormData {
    name: string;
    email: string;
    phone: string;
    duration: string;
    price: number
}

export default function AdminDashboard() {
    const {user, loading, userRole, userProfile, refreshUserProfile} = useAuth();
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDateList, setSelectedDateList] = useState('');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingList, setBookingList] = useState<Booking[]>([]);
    const [bookingListDates, setBookingListDates] = useState<string[]>([format(new Date(), "yyyy-MM-dd")]);
    const [bookingLimit, setBookingLimit] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [showUsers, setShowUsers] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const {toast} = useToast();


    const [editingUser, setEditingUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [birthDay, setBirthDay] = useState("");
    const [birthMonth, setBirthMonth] = useState("");
    const [birthYear, setBirthYear] = useState("");
    const days = Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0'));

    const months = [
        {value: '01', label: 'January'},
        {value: '02', label: 'February'},
        {value: '03', label: 'March'},
        {value: '04', label: 'April'},
        {value: '05', label: 'May'},
        {value: '06', label: 'June'},
        {value: '07', label: 'July'},
        {value: '08', label: 'August'},
        {value: '09', label: 'September'},
        {value: '10', label: 'October'},
        {value: '11', label: 'November'},
        {value: '12', label: 'December'},
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: currentYear - 1900}, (_, i) => currentYear - i);
    const [formData, setFormData] = useState<BookingFormData>({
        name: '',
        email: '',
        phone: '',
        duration: '1',
        price: 0
    });
    const [courts, setCourts] = useState<Court[]>([]);
    const [newCourt, setNewCourt] = useState({
        name: "",
        description: "",
        type: "indoor" as "indoor" | "outdoor",
        features: [],
        pricingPeriods: [
            {
                startTime: "07:00",
                endTime: "16:00",
                pricePerHalfHour: 10
            },
            {
                startTime: "16:00",
                endTime: "23:00",
                pricePerHalfHour: 15
            }
        ]
    });
    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [isBookingOverviewExpanded, setIsBookingOverviewExpanded] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'list' | 'users'>('table');

    const handleUpdateProfile = async () => {
        // First need to check if there is any difference in the data
        if (!editingUser) return;

        const userData = users.find(u => u.id === editingUser.id);

        console.log("userData", userData);
        console.log("editingUser", editingUser);

        let birthdate = ''

        if (birthDay && birthMonth && birthYear) {
            birthdate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
        }


        if (editingUser.name === userData.name && editingUser.phone === userData.phone) {
            if (birthdate) {
                if (birthdate === userData.birthdate) {
                    toast({
                        title: "No changes detected",
                        description: "Please make changes to your profile.",
                        variant: "destructive",
                    });
                    return;
                }

            } else {
                toast({
                    title: "No changes detected",
                    description: "Please make changes to your profile.",
                    variant: "destructive",
                });
                return;
            }
        }

        setIsUpdating(true);
        try {
            await userService.updateUserProfile(userData.id, {
                name: editingUser.name,
                phone: editingUser.phone,
                birthdate: birthdate
            });

            await refreshUserProfile();

            toast({
                title: "Success",
                description: "Your profile has been updated successfully.",
            });

            setEditingUser(null);
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({
                title: "Error",
                description: "Failed to update your profile.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const confirm = window.confirm("Are you sure you want to delete this user?");
        if (!confirm) return;

        const userData = users.find(u => u.id === userId);

        console.log("Deleting user with ID:", userId);

        try {
            await userService.deleteCurrentUser(userData);
            toast({
                title: "Success",
                description: "User deleted successfully.",
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete user.",
                variant: "destructive",
            });
        }
    }

    const handleLoadMoreBookings = () => {
        setBookingLimit(prev => prev + 30);
    }

    const isBookingInPast = (booking: Booking) => {
        const bookingDate = parseISO(booking.date);
        const bookingTime = parse(booking.startTime, 'HH:mm', new Date());
        const bookingDateTime = new Date(
            bookingDate.getFullYear(),
            bookingDate.getMonth(),
            bookingDate.getDate(),
            bookingTime.getHours(),
            bookingTime.getMinutes()
        );
        return isPast(bookingDateTime);
    };

    const calculateCompletedBookingsSumForDate = (date: string) => {
        return bookingList
            .filter(booking => booking.date === date)
            .reduce((sum, booking) => {
                if (booking.status === 'confirmed' && isBookingInPast(booking)) {
                    const court = courts.find(c => c.id === booking.courtId);
                    if (court) {
                        const durationHours = (new Date(`1970-01-01T${booking.endTime}`).getTime() -
                            new Date(`1970-01-01T${booking.startTime}`).getTime()) / (1000 * 60 * 60);
                        return sum + calculateBookingPrice(court, booking.startTime, durationHours);
                    }
                }
                return sum;
            }, 0);
    };

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/auth/login");
            } else if (userRole !== 'manager') {
                router.push('/');
            }
        }
    }, [user, loading, userRole, router]);

    useEffect(() => {
        if (selectedDate) {
            fetchBookings();
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchBookingList();
    }, [selectedDateList, bookingLimit]);

    useEffect(() => {
        fetchCourts();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const allUsers = await userService.getAllUsers();
            setUsers(allUsers);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch users.",
                variant: "destructive",
            });
        }
    };

    const fetchBookings = async () => {
        try {
            const formattedDate = format(selectedDate, "yyyy-MM-dd");
            const dailyBookings = await bookingService.getAllBookingsForDate(formattedDate);
            setBookings(dailyBookings);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast({
                title: "Error",
                description: "Failed to fetch bookings.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBookingList = async () => {
        try {
            let allBookings: Booking[] = [];

            if (selectedDateList) {
                const formattedDate = format(selectedDateList, "yyyy-MM-dd");
                allBookings = await bookingService.getAllBookingsForDate(formattedDate, true);
                setBookingListDates([formattedDate]);
            } else {
                allBookings = await bookingService.getAllBookings(bookingLimit);
                const bookingDates = allBookings.map(booking => booking.date);
                const uniqueDates = [...new Set(bookingDates)];
                setBookingListDates(uniqueDates);
            }
            setBookingList(allBookings);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast({
                title: "Error",
                description: "Failed to fetch bookings.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCourts = async () => {
        try {
            const allCourts = await courtService.getAllCourts();
            setCourts(allCourts);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch courts.",
                variant: "destructive",
            });
        }
    };

    const calculateTotalPrice = (court: Court, startTime: string, duration: number) => {
        return calculateBookingPrice(court, startTime, duration);
    };

    const getMaxAvailableDuration = (startTime: string, courtId: string) => {
        const startIndex = timeSlots.findIndex(slot => slot === startTime);
        let availableSlots = 0;

        for (let i = 0; i < 4; i++) { // Check up to 2 hours (4 slots)
            const currentTime = timeSlots[startIndex + i];
            if (!currentTime) break;

            const isBooked = bookings.some(booking =>
                booking.courtId === courtId &&
                booking.startTime <= currentTime &&
                booking.endTime > currentTime
            );

            if (isBooked) break;
            availableSlots++;
        }

        if (availableSlots >= 4) return "2";
        if (availableSlots >= 3) return "1.5";
        if (availableSlots >= 2) return "1";
        return "0";
    };

    const handleCreateBooking = async (courtId: string, startTime: string) => {
        if (!user) return;

        try {
            setIsLoading(true);
            const duration = parseFloat(formData.duration);
            const startDateTime = parse(startTime, "HH:mm", new Date());
            const endDateTime = addMinutes(startDateTime, duration * 60);
            const endTime = format(endDateTime, "HH:mm");

            await bookingService.createBooking({
                managerId: user.uid,
                courtId,
                date: format(selectedDate, "yyyy-MM-dd"),
                startTime,
                endTime,
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                price: formData.price
            });

            toast({
                title: "Success",
                description: "Booking created successfully.",
            });

            setFormData({
                price: 0,
                name: "",
                email: "",
                phone: "",
                duration: "1"
            });

            await fetchBookings();
        } catch (error) {
            console.error("Booking creation error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create booking.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleNoShowUser = async (userId: string, noShowUser: boolean) => {
        if (noShowUser) {
            const confirm = window.confirm("Are you sure you want to mark this user as no-show??");
            if (!confirm) return;
        } else {
            const confirm = window.confirm("Are you sure you want to mark this user as active?");
            if (!confirm) return;
        }

        try {
            await userService.updateUserProfile(userId, {noShowUser: noShowUser});
            toast({
                title: "Success",
                description: `User marked as ${noShowUser ? 'no-show' : 'active'}.`,
            });
            fetchUsers();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update user status.",
                variant: "destructive",
            });
        }
    }

    const handleCreateCourt = async () => {
        try {
            if (!newCourt.name || !newCourt.description) {
                toast({
                    title: "Error",
                    description: "Please fill in all required fields",
                    variant: "destructive"
                });
                return;
            }

            await courtService.createCourt(newCourt);
            toast({
                title: "Success",
                description: "Court created successfully."
            });
            fetchCourts();
            setNewCourt({
                name: "",
                description: "",
                type: "indoor",
                features: [],
                pricingPeriods: [
                    {
                        startTime: "07:00",
                        endTime: "16:00",
                        pricePerHalfHour: 10
                    },
                    {
                        startTime: "16:00",
                        endTime: "23:00",
                        pricePerHalfHour: 15
                    }
                ]
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create court.",
                variant: "destructive"
            });
        }
    };

    const handleEditCourt = (court: Court) => {
        setEditingCourt({...court});
    };

    const handleUpdateCourt = async () => {
        if (!editingCourt) return;

        try {
            await courtService.updateCourt(editingCourt.id, editingCourt);
            toast({
                title: "Success",
                description: "Court updated successfully."
            });
            setEditingCourt(null);
            fetchCourts();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update court.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteCourt = async (id: string) => {
        try {
            await courtService.deleteCourt(id);
            toast({
                title: "Success",
                description: "Court deleted successfully.",
            });
            fetchCourts();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete court.",
                variant: "destructive",
            });
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        try {
            const bookingToCancel = bookings.find(b => b.id === bookingId);
            if (!bookingToCancel) return;

            if (isBookingInPast(bookingToCancel)) {
                toast({
                    title: 'Error',
                    description: 'Cannot cancel past bookings.',
                    variant: 'destructive',
                });
                return;
            }

            await bookingService.updateBookingStatus(bookingId, 'cancelled');
            toast({
                title: 'Success',
                description: 'Booking cancelled successfully.',
            });
            await fetchBookings();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to cancel booking.',
                variant: 'destructive',
            });
        }
    };

    const handleMarkAsNoShow = async (bookingId: string) => {
        try {
            await bookingService.updateBookingStatus(bookingId, 'no-show');
            toast({
                title: 'Success',
                description: 'Booking marked as no-show.',
            });
            await fetchBookings();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to mark booking as no-show.',
                variant: 'destructive',
            });
        }
    };

    const courtsData = [
        {
            id: "court1",
            name: "Center Court",
            description: "Professional indoor court with premium lighting",
            type: "indoor"
        },
        {
            id: "court2",
            name: "Sunset Court",
            description: "Beautiful outdoor court with natural lighting",
            type: "outdoor"
        },
        {
            id: "court3",
            name: "Training Court",
            description: "Indoor court perfect for training sessions",
            type: "indoor"
        }
    ];

    const timeSlots = Array.from({length: 34}, (_, i) => {
        const hour = Math.floor(i / 2) + 7;
        const minute = i % 2 === 0 ? "00" : "30";
        return `${hour.toString().padStart(2, "0")}:${minute}`;
    });

    const getBookingForTimeSlot = (courtId: string, time: string) => {
        const booking = bookings.find(
            booking =>
                booking.courtId === courtId &&
                booking.startTime <= time &&
                booking.endTime > time
        );

        if (!booking) return null;

        const allConsecutiveBookings = bookings.filter(b =>
            b.courtId === courtId &&
            b.startTime === booking.startTime &&
            b.endTime === booking.endTime &&
            b.customerName === booking.customerName
        );

        return allConsecutiveBookings[0];
    };

    const isPartOfPreviousBooking = (courtId: string, time: string) => {
        const previousTime = timeSlots[timeSlots.indexOf(time) - 1];
        if (!previousTime) return false;

        const currentBooking = getBookingForTimeSlot(courtId, time);
        const previousBooking = getBookingForTimeSlot(courtId, previousTime);

        return currentBooking && previousBooking &&
            currentBooking.id === previousBooking.id;
    };

    if (loading) return null;

    return (
        <Layout>
            <div className='min-h-screen'>
                <div className='container mx-auto px-4 py-8'>
                    <Card className="rounded-md">
                        <CardContent>
                            <div className='mb-12 mt-4'>
                                <div className='flex justify-between items-center mb-4'>
                                    <h2 className='text-2xl font-semibold'></h2>
                                    <div className='flex items-center gap-4'>
                                        {isBookingOverviewExpanded && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button>Add Court</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-white">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Create New Court</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            <div className="space-y-4"
                                                                 onClick={(e) => e.stopPropagation()}>
                                                                <div>
                                                                    <Label>Court Name</Label>
                                                                    <Input
                                                                        placeholder="Enter court name"
                                                                        value={newCourt.name}
                                                                        required
                                                                        onChange={(e) => setNewCourt(prev => ({
                                                                            ...prev,
                                                                            name: e.target.value
                                                                        }))}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Description</Label>
                                                                    <Input
                                                                        placeholder="Enter court description"
                                                                        value={newCourt.description}
                                                                        required
                                                                        onChange={(e) => setNewCourt(prev => ({
                                                                            ...prev,
                                                                            description: e.target.value
                                                                        }))}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Type</Label>
                                                                    <RadioGroup
                                                                        value={newCourt.type}
                                                                        onValueChange={(value: "indoor" | "outdoor") =>
                                                                            setNewCourt(prev => ({
                                                                                ...prev,
                                                                                type: value
                                                                            }))
                                                                        }
                                                                    >
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="indoor" id="indoor"/>
                                                                            <Label htmlFor="indoor">Indoor</Label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="outdoor"
                                                                                            id="outdoor"/>
                                                                            <Label htmlFor="outdoor">Outdoor</Label>
                                                                        </div>
                                                                    </RadioGroup>
                                                                </div>
                                                                <div>
                                                                    <Label>Pricing Periods</Label>
                                                                    <div className="space-y-2">
                                                                        {newCourt.pricingPeriods.map((period, index) => (
                                                                            <div key={index}
                                                                                 className="grid grid-cols-3 gap-2">
                                                                                <div>
                                                                                    <Label>Start Time</Label>
                                                                                    <Input
                                                                                        type="time"
                                                                                        value={period.startTime}
                                                                                        onChange={(e) => {
                                                                                            const updatedPeriods = [...newCourt.pricingPeriods];
                                                                                            updatedPeriods[index] = {
                                                                                                ...period,
                                                                                                startTime: e.target.value
                                                                                            };
                                                                                            setNewCourt(prev => ({
                                                                                                ...prev,
                                                                                                pricingPeriods: updatedPeriods
                                                                                            }));
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label>End Time</Label>
                                                                                    <Input
                                                                                        type="time"
                                                                                        value={period.endTime}
                                                                                        onChange={(e) => {
                                                                                            const updatedPeriods = [...newCourt.pricingPeriods];
                                                                                            updatedPeriods[index] = {
                                                                                                ...period,
                                                                                                endTime: e.target.value
                                                                                            };
                                                                                            setNewCourt(prev => ({
                                                                                                ...prev,
                                                                                                pricingPeriods: updatedPeriods
                                                                                            }));
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label>Price (€/30min)</Label>
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={period.pricePerHalfHour}
                                                                                        onChange={(e) => {
                                                                                            const updatedPeriods = [...newCourt.pricingPeriods];
                                                                                            updatedPeriods[index] = {
                                                                                                ...period,
                                                                                                pricePerHalfHour: parseInt(e.target.value)
                                                                                            };
                                                                                            setNewCourt(prev => ({
                                                                                                ...prev,
                                                                                                pricingPeriods: updatedPeriods
                                                                                            }));
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="text-sm md:text-base text-black border-2">Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleCreateCourt}>
                                                            Create Court
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                        <button
                                            onClick={() => setIsBookingOverviewExpanded(!isBookingOverviewExpanded)}
                                            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                                            aria-label="Toggle booking overview"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                                <line x1="3" y1="18" x2="21" y2="18"></line>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {isBookingOverviewExpanded && (
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                        {courts.sort((a, b) => a.id.localeCompare(b.id)).map(court => (
                                            <Card key={court.id}>
                                                <CardContent className='p-4'>
                                                    <div className='flex justify-between items-start'>
                                                        <div>
                                                            <h4 className='font-medium'>{court.name}</h4>
                                                            <p className='text-sm text-muted-foreground'>{court.description}</p>
                                                            <Badge
                                                                style={{
                                                                    backgroundColor: court.type === 'indoor' ? 'white' : 'black',
                                                                    color: court.type === 'indoor' ? 'black' : 'white',
                                                                    border: '1px solid black',
                                                                }}
                                                                className='mt-2'
                                                            >
                                                                {court.type}
                                                            </Badge>
                                                        </div>
                                                        <div className='flex gap-2'>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant='outline'
                                                                        size='sm'
                                                                        onClick={() => handleEditCourt(court)}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className='bg-white'>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Edit Court</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            <div className='space-y-4'>
                                                                                <div>
                                                                                    <Label>Court Name</Label>
                                                                                    <Input
                                                                                        value={editingCourt?.name || ''}
                                                                                        onChange={(e) => setEditingCourt(prev => prev ? {
                                                                                            ...prev,
                                                                                            name: e.target.value
                                                                                        } : null)}
                                                                                        placeholder='Enter court name'
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label>Description</Label>
                                                                                    <Input
                                                                                        value={editingCourt?.description || ''}
                                                                                        onChange={(e) => setEditingCourt(prev => prev ? {
                                                                                            ...prev,
                                                                                            description: e.target.value
                                                                                        } : null)}
                                                                                        placeholder='Enter court description'
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Label>Type</Label>
                                                                                    <RadioGroup
                                                                                        value={editingCourt?.type || 'indoor'}
                                                                                        onValueChange={(value: 'indoor' | 'outdoor') =>
                                                                                            setEditingCourt(prev => prev ? {
                                                                                                ...prev,
                                                                                                type: value
                                                                                            } : null)
                                                                                        }
                                                                                    >
                                                                                        <div
                                                                                            className='flex items-center space-x-2'>
                                                                                            <RadioGroupItem
                                                                                                value='indoor'
                                                                                                id='edit-indoor'/>
                                                                                            <Label
                                                                                                htmlFor='edit-indoor'>Indoor</Label>
                                                                                        </div>
                                                                                        <div
                                                                                            className='flex items-center space-x-2'>
                                                                                            <RadioGroupItem
                                                                                                value='outdoor'
                                                                                                id='edit-outdoor'/>
                                                                                            <Label
                                                                                                htmlFor='edit-outdoor'>Outdoor</Label>
                                                                                        </div>
                                                                                    </RadioGroup>
                                                                                </div>
                                                                                <div>
                                                                                    <Label>Pricing Periods</Label>
                                                                                    <div className='space-y-2'>
                                                                                        {editingCourt?.pricingPeriods.map((period, index) => (
                                                                                            <div key={index}
                                                                                                 className='grid grid-cols-3 gap-2'>
                                                                                                <div>
                                                                                                    <Label>Start
                                                                                                        Time</Label>
                                                                                                    <Input
                                                                                                        type='time'
                                                                                                        value={period.startTime}
                                                                                                        onChange={(e) => {
                                                                                                            if (!editingCourt) return;
                                                                                                            const updatedPeriods = [...editingCourt.pricingPeriods];
                                                                                                            updatedPeriods[index] = {
                                                                                                                ...period,
                                                                                                                startTime: e.target.value
                                                                                                            };
                                                                                                            setEditingCourt({
                                                                                                                ...editingCourt,
                                                                                                                pricingPeriods: updatedPeriods
                                                                                                            });
                                                                                                        }}
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <Label>End
                                                                                                        Time</Label>
                                                                                                    <Input
                                                                                                        type='time'
                                                                                                        value={period.endTime}
                                                                                                        onChange={(e) => {
                                                                                                            if (!editingCourt) return;
                                                                                                            const updatedPeriods = [...editingCourt.pricingPeriods];
                                                                                                            updatedPeriods[index] = {
                                                                                                                ...period,
                                                                                                                endTime: e.target.value
                                                                                                            };
                                                                                                            setEditingCourt({
                                                                                                                ...editingCourt,
                                                                                                                pricingPeriods: updatedPeriods
                                                                                                            });
                                                                                                        }}
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <Label>Price
                                                                                                        (€/30min)</Label>
                                                                                                    <Input
                                                                                                        type='number'
                                                                                                        value={period.pricePerHalfHour}
                                                                                                        onChange={(e) => {
                                                                                                            if (!editingCourt) return;
                                                                                                            const updatedPeriods = [...editingCourt.pricingPeriods];
                                                                                                            updatedPeriods[index] = {
                                                                                                                ...period,
                                                                                                                pricePerHalfHour: parseInt(e.target.value)
                                                                                                            };
                                                                                                            setEditingCourt({
                                                                                                                ...editingCourt,
                                                                                                                pricingPeriods: updatedPeriods
                                                                                                            });
                                                                                                        }}
                                                                                                    />
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="text-sm md:text-base text-black border-2"
                                                                            onClick={() => setEditingCourt(null)}>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={handleUpdateCourt}>
                                                                            Update Court
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                            <Button
                                                                variant='destructiveOutline'
                                                                size='sm'
                                                                onClick={() => handleDeleteCourt(court.id)}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {viewMode === 'table' ? (
                                <DateSlider
                                    selectedDate={selectedDate}
                                    onDateSelect={setSelectedDate}
                                />
                            ) : null}

                            {isLoading ? (
                                <p className='text-center mt-8'>Loading bookings...</p>
                            ) : (
                                <>
                                    <div className="flex justify mb-4 mt-4">
                                        <div className="flex gap-2">
                                            <Button
                                                variant={viewMode === 'table' ? 'default' : 'outline'}
                                                onClick={() => setViewMode('table')}
                                                size="sm"
                                                className="hover:text-white"
                                            >
                                                Table View
                                            </Button>
                                            <Button
                                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                                onClick={() => setViewMode('list')}
                                                size="sm"
                                                className="hover:text-white"
                                            >
                                                List View
                                            </Button>
                                            <Button
                                                variant={viewMode === 'users' ? 'default' : 'outline'}
                                                onClick={() => setViewMode('users')}
                                                size="sm"
                                                className="hover:text-white"
                                            >
                                                Users
                                            </Button>
                                        </div>
                                    </div>

                                    {viewMode === 'list' ? (
                                        <div className="mt-4 space-y-6">
                                            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                                <input
                                                    type="date"
                                                    value={selectedDateList}
                                                    onChange={(e) => setSelectedDateList(e.target.value)}
                                                    style={{
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        // Force WebKit to show pointer cursor on dates
                                                        color: 'inherit',
                                                    }}
                                                    className="custom-datepicker"
                                                />
                                            </div>
                                            {bookingListDates.map((bookingDate, index) => {
                                                const dateBookings = bookingList.filter(b => b.date === bookingDate);
                                                if (dateBookings.length === 0) return null;

                                                const isLastCard = index === bookingListDates.length - 1;
                                                const completedSum = calculateCompletedBookingsSumForDate(bookingDate);

                                                return (
                                                    <Card
                                                        key={`list-${bookingDate}`}
                                                        className={isLastCard ? "border-b-0" : ""}
                                                    >
                                                        <CardHeader className="pb-2">
                                                            <div className="flex items-center justify-between w-full">
                                                                <CardTitle className="text-lg">{bookingDate}</CardTitle>
                                                                <div className="flex-grow"></div>
                                                                {completedSum > 0 && (
                                                                    <Badge variant="outline"
                                                                           className="px-3 py-1 bg-green-50 text-green-700">
                                                                        <span className="font-medium">Total: </span>
                                                                        €{completedSum.toFixed(0)}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            <div className="space-y-3">
                                                                {dateBookings.map(booking => (
                                                                    <AlertDialog key={`list-booking-${booking.id}`}>
                                                                        <AlertDialogTrigger asChild>
                                                                            <div
                                                                                className="grid grid-cols-5 items-center gap-4 p-3 hover:bg-secondary/20 rounded-md cursor-pointer transition-colors ">
                                                                                {/* Column 1: Start and End Time */}
                                                                                <div>
                                                                                    <p className="text-sm font-medium">{booking.startTime} - {booking.endTime}</p>
                                                                                </div>

                                                                                {/* Column 2: Customer Name */}
                                                                                <div className="text-center">
                                                                                    <p className="font-medium">{booking.customerName}</p>
                                                                                    {booking.customerPhone && (
                                                                                        <p className="text-xs text-muted-foreground">{booking.customerPhone}</p>
                                                                                    )}
                                                                                </div>

                                                                                {/* Column 3: Court Name */}
                                                                                <div className="text-center">
                                                                                    <p className="font-medium">{courts.find(c => c.id === booking.courtId)?.name}</p>
                                                                                </div>

                                                                                {/* Column 4: Booking Status */}
                                                                                <div className="text-center">
                                                                                    {booking.status === 'cancelled' ? (
                                                                                        <span
                                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                                          Cancelled
                                                                                        </span>
                                                                                    ) : booking.status === 'confirmed' && isBookingInPast(booking) ? (
                                                                                        <span
                                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                          Completed
                                                                                        </span>
                                                                                    ) : booking.status === 'confirmed' ? (
                                                                                        <span
                                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                                          Upcoming
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span
                                                                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                                          {booking.status}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Column 5: Price */}
                                                                                <div className="text-center">
                                                                                    <p className="text-sm font-medium">
                                                                                        €{calculateBookingPrice(
                                                                                        courts.find(c => c.id === booking.courtId)!,
                                                                                        booking.startTime,
                                                                                        (new Date(`1970-01-01T${booking.endTime}`).getTime() -
                                                                                            new Date(`1970-01-01T${booking.startTime}`).getTime()) / (1000 * 60 * 60)
                                                                                    )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </AlertDialogTrigger>

                                                                        {/* Booking Details Modal */}
                                                                        <AlertDialogContent className="bg-white">
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Booking
                                                                                    Details</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    <div className="mt-4 space-y-2">
                                                                                        <p>Date: {format(booking.date, 'MMMM d, yyyy')}</p>
                                                                                        <p>Time: {booking.startTime} - {booking.endTime}</p>
                                                                                        <p>Court: {courts.find(c => c.id === booking.courtId)?.name}</p>
                                                                                        <p>Name: {booking.customerName}</p>
                                                                                        <p>Phone: {booking.customerPhone}</p>
                                                                                        {booking.customerEmail &&
                                                                                            <p>Email: {booking.customerEmail}</p>}
                                                                                    </div>
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                {isBookingInPast(booking) ? (
                                                                                    <AlertDialogAction
                                                                                        onClick={async (e) => {
                                                                                            e.preventDefault();
                                                                                            await handleMarkAsNoShow(booking.id);
                                                                                        }}
                                                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                                                                    >
                                                                                        Mark As No Show
                                                                                    </AlertDialogAction>
                                                                                ) : (
                                                                                    <AlertDialogAction
                                                                                        onClick={async (e) => {
                                                                                            e.preventDefault();
                                                                                            await handleCancelBooking(booking.id);
                                                                                        }}
                                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                                    >
                                                                                        Cancel Booking
                                                                                    </AlertDialogAction>
                                                                                )}
                                                                                <AlertDialogCancel className="text-sm md:text-base text-black border-2">Close</AlertDialogCancel>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                        {/* Add Load More button to last card */}
                                                        {isLastCard && !selectedDateList && (
                                                            <div className="px-6 pb-4 pt-2">
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full"
                                                                    onClick={handleLoadMoreBookings}
                                                                >
                                                                    Load More
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    ) : viewMode === 'table' ? (
                                        <div className='mt-8 overflow-x-auto'>
                                            <table className='w-full border-collapse'>
                                                <thead>
                                                <tr>
                                                    <th className='border p-2 text-center'>Time</th>
                                                    {courts.map(court => (
                                                        <th key={court.id} className='border p-2 text-center'>
                                                            <div>{court.name}</div>
                                                            <Badge
                                                                style={{
                                                                    backgroundColor: court.type === 'indoor' ? 'white' : 'black',
                                                                    color: court.type === 'indoor' ? 'black' : 'white',
                                                                    border: '1px solid black',
                                                                }}
                                                            >
                                                                {court.type}
                                                            </Badge>
                                                        </th>
                                                    ))}
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {timeSlots.map(time => (
                                                    <tr key={time}>
                                                        <td className='border p-2 text-center font-medium'>{time}</td>
                                                        {courts.map(court => {
                                                            const booking = getBookingForTimeSlot(court.id, time);
                                                            const isPartOfPrevious = isPartOfPreviousBooking(court.id, time);
                                                            const isFirstSlot = booking && booking.startTime === time;

                                                            if (isPartOfPrevious) {
                                                                return <td key={`${court.id}-${time}`}
                                                                           className="bg-gray-100"></td>;
                                                            }

                                                            return (
                                                                <td
                                                                    key={`${court.id}-${time}`}
                                                                    className={`${
                                                                        booking
                                                                            ? "bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
                                                                            : "hover:bg-secondary/20 cursor-pointer"
                                                                    } p-2 text-center border-l border-r ${isFirstSlot ? "border-t" : ""} ${
                                                                        booking && !isPartOfPreviousBooking(court.id, timeSlots[timeSlots.indexOf(time) + 1] || "")
                                                                            ? "border-b"
                                                                            : ""
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (booking) {
                                                                            document.getElementById(`booking-dialog-view-${booking.id}`)?.click();
                                                                        } else {
                                                                            document.getElementById(`booking-dialog-${court.id}-${time}`)?.click();
                                                                        }
                                                                    }}
                                                                >
                                                                    {booking && isFirstSlot ? (
                                                                        <>
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger className="hidden"
                                                                                                    id={`booking-dialog-view-${booking.id}`}/>
                                                                                <AlertDialogContent
                                                                                    className='bg-white'>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Booking
                                                                                            Details</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            <div
                                                                                                className='mt-4 space-y-2'>
                                                                                                <p>Date: {format(selectedDate, 'MMMM d, yyyy')}</p>
                                                                                                <p>Time: {booking.startTime} - {booking.endTime}</p>
                                                                                                <p>Court: {court.name}</p>
                                                                                                <p>Name: {booking.customerName}</p>
                                                                                                <p>Phone: {booking.customerPhone}</p>
                                                                                                {booking.customerEmail &&
                                                                                                    <p>Email: {booking.customerEmail}</p>}
                                                                                            </div>
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        {isBookingInPast(booking) ? (
                                                                                            <AlertDialogAction
                                                                                                onClick={async (e) => {
                                                                                                    e.preventDefault();
                                                                                                    e.stopPropagation();
                                                                                                    if ("id" in booking) {
                                                                                                        await handleMarkAsNoShow(booking.id);
                                                                                                    }
                                                                                                    const dialog = document.querySelector('[role=dialog]');
                                                                                                    if (dialog) {
                                                                                                        dialog.remove();
                                                                                                    }
                                                                                                }}
                                                                                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                                                                            >
                                                                                                Mark As No Show
                                                                                            </AlertDialogAction>
                                                                                        ) : (
                                                                                            <AlertDialogAction
                                                                                                onClick={async (e) => {
                                                                                                    e.preventDefault();
                                                                                                    e.stopPropagation();
                                                                                                    if ("id" in booking) {
                                                                                                        await handleCancelBooking(booking.id);
                                                                                                    }
                                                                                                    const dialog = document.querySelector('[role=dialog]');
                                                                                                    if (dialog) {
                                                                                                        dialog.remove();
                                                                                                    }
                                                                                                }}
                                                                                                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                                                                            >
                                                                                                Cancel Booking
                                                                                            </AlertDialogAction>
                                                                                        )}
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                            <div
                                                                                className='text-sm text-center'>{booking.customerName}</div>
                                                                        </>
                                                                    ) : (
                                                                        booking ? null : (
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger className="hidden"
                                                                                                    id={`booking-dialog-${court.id}-${time}`}/>
                                                                                <AlertDialogContent
                                                                                    className='bg-white border-2 border-border shadow-lg'
                                                                                    onClick={(e) => e.stopPropagation()}>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Create
                                                                                            Booking</AlertDialogTitle>
                                                                                        <AlertDialogDescription
                                                                                            className='space-y-4'>
                                                                                            <div
                                                                                                className='space-y-4 mt-4'>
                                                                                                <div>
                                                                                                    <Label>Date: {format(selectedDate, "MMMM d, yyyy")}</Label>
                                                                                                    <p>Starting
                                                                                                        Time: {time}</p>
                                                                                                    <p>Court: {court.name}</p>
                                                                                                </div>
                                                                                                <div
                                                                                                    className="space-y-2">
                                                                                                    <Label>Duration</Label>
                                                                                                    <div
                                                                                                        className="flex gap-2">
                                                                                                        {["1", "1.5", "2"].map((value) => {
                                                                                                            const maxDuration = getMaxAvailableDuration(time, court.id);
                                                                                                            return (
                                                                                                                <Button
                                                                                                                    key={value}
                                                                                                                    type="button"
                                                                                                                    variant={formData.duration === value ? "default" : "outline"}
                                                                                                                    onClick={(e) => {
                                                                                                                        e.stopPropagation();
                                                                                                                        if (parseFloat(value) <= parseFloat(maxDuration)) {
                                                                                                                            setFormData(prev => ({
                                                                                                                                ...prev,
                                                                                                                                duration: value
                                                                                                                            }));
                                                                                                                        }
                                                                                                                    }}
                                                                                                                    disabled={parseFloat(value) > parseFloat(maxDuration)}
                                                                                                                >
                                                                                                                    {value} {value === "1" ? "Hour" : "Hours"}
                                                                                                                </Button>
                                                                                                            );
                                                                                                        })}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div
                                                                                                    className='space-y-2'>
                                                                                                    <Input
                                                                                                        value={formData.name}
                                                                                                        onChange={(e) => setFormData(prev => ({
                                                                                                            ...prev,
                                                                                                            name: e.target.value
                                                                                                        }))}
                                                                                                        placeholder="Enter customer name"
                                                                                                        required
                                                                                                    />
                                                                                                </div>
                                                                                                <div
                                                                                                    className='space-y-2'>
                                                                                                    <Input
                                                                                                        value={formData.phone}
                                                                                                        onChange={(e) => setFormData(prev => ({
                                                                                                            ...prev,
                                                                                                            phone: e.target.value
                                                                                                        }))}
                                                                                                        placeholder="Enter customer phone"
                                                                                                        required
                                                                                                    />
                                                                                                </div>
                                                                                                <div
                                                                                                    className='space-y-2'>
                                                                                                    <Input
                                                                                                        type='email'
                                                                                                        value={formData.email}
                                                                                                        onChange={(e) => setFormData(prev => ({
                                                                                                            ...prev,
                                                                                                            email: e.target.value
                                                                                                        }))}
                                                                                                        placeholder="Enter customer email (optional)"
                                                                                                    />
                                                                                                </div>
                                                                                                <div
                                                                                                    className="mt-4 border-t pt-4">
                                                                                                    <p className="font-semibold">Total
                                                                                                        Price:
                                                                                                        €{calculateTotalPrice(court, time, parseFloat(formData.duration))}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel className="text-sm md:text-base text-black border-2">Cancel</AlertDialogCancel>
                                                                                        <Button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                if (!formData.name || !formData.phone) {
                                                                                                    toast({
                                                                                                        title: 'Error',
                                                                                                        description: 'Please fill in required fields',
                                                                                                        variant: 'destructive',
                                                                                                    });
                                                                                                    return;
                                                                                                }
                                                                                                handleCreateBooking(court.id, time);
                                                                                                document.querySelector("[role=dialog]")?.parentElement?.click(); // Close dialog after creation
                                                                                            }}
                                                                                        >
                                                                                            Create Booking
                                                                                        </Button>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        )
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="mt-4 space-y-6">
                                            {users.length === 0 ? (
                                                <p className="text-center">No users found.</p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {/* Header Row */}
                                                    <div className="grid grid-cols-4 gap-4 font-medium p-2 border-b text-center">
                                                        <div>Name</div>
                                                        <div>Email</div>
                                                        <div>Phone</div>
                                                        <div></div>
                                                    </div>

                                                    {/* User Rows */}
                                                    {users.map((user) => (
                                                        <Card key={user.id}>
                                                            <CardContent className="p-4">
                                                                <div className="grid grid-cols-4 gap-4 items-center text-center">
                                                                    {/*<div>*/}
                                                                        <h4 className="font-medium">{user.name}</h4>
                                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                                        <p className="text-sm mt-1">{user.phone || '-'}</p>


                                                                    <div className="flex gap-2 justify-center">
                                                                        <AlertDialog onOpenChange={(open) => {
                                                                            if (open) {
                                                                                setEditingUser({...user});

                                                                                if (user.birthdate) {
                                                                                    const [year, month, day] = user.birthdate.split('-');
                                                                                    console.log(user.birthdate);
                                                                                    console.log(year, month, day);

                                                                                    setBirthYear(year);
                                                                                    setBirthMonth(month);
                                                                                    setBirthDay(day);
                                                                                } else {
                                                                                    setBirthYear('');
                                                                                    setBirthMonth('');
                                                                                    setBirthDay('');
                                                                                }
                                                                            }
                                                                        }}
                                                                        >
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button variant="outline"
                                                                                        size="sm">Edit</Button>
                                                                            </AlertDialogTrigger>
                                                                            {editingUser?.id === user.id && (
                                                                                <AlertDialogContent
                                                                                    className="bg-white">
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Edit
                                                                                            User</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            <div className="space-y-4">
                                                                                                <div>
                                                                                                    <Input
                                                                                                        value={editingUser?.name || ''}
                                                                                                        onChange={(e) =>
                                                                                                            setEditingUser((prev : any) =>
                                                                                                                prev ? {
                                                                                                                    ...prev,
                                                                                                                    name: e.target.value
                                                                                                                } : null
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder="Enter name"
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <Input
                                                                                                        value={editingUser?.phone || ''}
                                                                                                        onChange={(e) =>
                                                                                                            setEditingUser((prev : any) =>
                                                                                                                prev ? {
                                                                                                                    ...prev,
                                                                                                                    phone: e.target.value
                                                                                                                } : null
                                                                                                            )
                                                                                                        }
                                                                                                        placeholder="Enter phone"
                                                                                                    />
                                                                                                </div>
                                                                                                <div>
                                                                                                    <div
                                                                                                        className="grid grid-cols-3 gap-2">
                                                                                                        {/* Day */}
                                                                                                        <Select
                                                                                                            value={birthDay}
                                                                                                            onValueChange={setBirthDay}
                                                                                                        >
                                                                                                            <SelectTrigger>
                                                                                                                <SelectValue
                                                                                                                    placeholder="Day"/>
                                                                                                            </SelectTrigger>
                                                                                                            <SelectContent>
                                                                                                                {days.map((d) => (
                                                                                                                    <SelectItem
                                                                                                                        key={d}
                                                                                                                        value={d.toString()}>
                                                                                                                        {d}
                                                                                                                    </SelectItem>
                                                                                                                ))}
                                                                                                            </SelectContent>
                                                                                                        </Select>

                                                                                                        {/* Month */}
                                                                                                        <Select
                                                                                                            value={birthMonth}
                                                                                                            onValueChange={setBirthMonth}
                                                                                                        >
                                                                                                            <SelectTrigger>
                                                                                                                <SelectValue
                                                                                                                    placeholder="Month"/>
                                                                                                            </SelectTrigger>
                                                                                                            <SelectContent>
                                                                                                                {months.map((m) => (
                                                                                                                    <SelectItem
                                                                                                                        key={m.value}
                                                                                                                        value={m.value}>
                                                                                                                        {m.label}
                                                                                                                    </SelectItem>
                                                                                                                ))}
                                                                                                            </SelectContent>
                                                                                                        </Select>

                                                                                                        {/* Year */}
                                                                                                        <Select
                                                                                                            value={birthYear}
                                                                                                            onValueChange={setBirthYear}
                                                                                                        >
                                                                                                            <SelectTrigger>
                                                                                                                <SelectValue
                                                                                                                    placeholder="Year"/>
                                                                                                            </SelectTrigger>
                                                                                                            <SelectContent>
                                                                                                                {years.map((y) => (
                                                                                                                    <SelectItem
                                                                                                                        key={y}
                                                                                                                        value={y.toString()}>
                                                                                                                        {y}
                                                                                                                    </SelectItem>
                                                                                                                ))}
                                                                                                            </SelectContent>
                                                                                                        </Select>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel className="text-sm md:text-base text-black border-2"
                                                                                            onClick={() => setEditingUser(null)}>
                                                                                            Cancel
                                                                                        </AlertDialogCancel>
                                                                                        {editingUser.noShowUser ? (
                                                                                            <AlertDialogAction
                                                                                                className="bg-white border-green-500 border-2 text-green-500 hover:bg-green-500 hover:text-white"
                                                                                                onClick={() => handleNoShowUser(editingUser.id, false)}>
                                                                                                Mark as OK
                                                                                            </AlertDialogAction>
                                                                                        ) : (
                                                                                            <AlertDialogAction
                                                                                                className="bg-white border-red-500 border-2 text-red-500 hover:bg-red-500 hover:text-white"
                                                                                                onClick={() => handleNoShowUser(editingUser.id, true)}>
                                                                                                Mark as No Show
                                                                                            </AlertDialogAction>
                                                                                        )}
                                                                                        <AlertDialogAction
                                                                                            onClick={() => handleUpdateProfile()}>
                                                                                            {isUpdating ? "Saving..." : "Save Changes"}
                                                                                        </AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            )}
                                                                        </AlertDialog>

                                                                        <Button
                                                                            variant="destructiveOutline"
                                                                            size="sm"
                                                                            onClick={() => handleDeleteUser(user.id)}
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </div>
                                                                        {/*</div>*/}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                    )
                                    }
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}