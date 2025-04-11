import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {TimeSlot, Court, Booking} from "@/types/booking";
import {bookingService} from "@/services/bookingService";
import {format, isBefore, parse, set} from "date-fns";
import {useToast} from "@/hooks/use-toast";
import {useAuth} from "@/contexts/AuthContext";
import {useRouter} from "next/router";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {DateSlider} from './DateSlider';
import {EmailRequest, EmailResponse} from '@/types/email';
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
} from '@/components/ui/alert-dialog';
import {calculateBookingPrice} from "@/lib/price-calculator";
import {setCookie, getCookie, deleteCookie} from '@/lib/cookies';

type BookingFormProps = {
    initialDate?: Date;
    initialStartTime?: string;
    initialCourt?: string;
    initialDuration?: number;
    onBookingSuccess?: (booking: Booking) => void;
};

export function BookingForm({
                                initialDate = new Date(),
                                initialStartTime,
                                initialCourt,
                                initialDuration = 1,
                                onBookingSuccess,
                            }: BookingFormProps) {
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [selectedStartTime, setSelectedStartTime] = useState<string>(initialStartTime || '');
    const [availableCourts, setAvailableCourts] = useState<Court[]>([]);
    const [selectedCourt, setSelectedCourt] = useState<string>(initialCourt || '');
    const [isLoading, setIsLoading] = useState(false);
    const {toast} = useToast();
    const {user, userProfile} = useAuth();
    const router = useRouter();
    const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number>(initialDuration || 1);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const durations = [
        {value: 1, label: '1 Hour'},
        {value: 1.5, label: '1.5 Hours'},
        {value: 2, label: '2 Hours'}
    ];

    useEffect(() => {
        // Listen for custom event from header
        const handleShowBooking = () => {
            setShowBookingForm(true);
            const today = new Date();
            setSelectedDate(today);
            handleDateSelect(today);
        };

        window.addEventListener('showBookingForm', handleShowBooking);

        // Check URL parameters on mount
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('showBooking') === 'true') {
            handleShowBooking();
        }

        return () => {
            window.removeEventListener('showBookingForm', handleShowBooking);
        };
    }, []);

    useEffect(() => {
        if (selectedDate) {
            handleDateSelect(selectedDate);
        }
    }, [selectedDate]);

    const calculateTotalPrice = () => {
        if (!selectedCourt || !selectedStartTime) return 0;
        const court = availableCourts.find(c => c.id === selectedCourt);
        if (!court) return 0;
        return calculateBookingPrice(court, selectedStartTime, selectedDuration);
    };

    const handleDateSelect = async (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);
        setIsLoading(true);
        try {
            const formattedDate = format(date, "yyyy-MM-dd");
            const slots = await bookingService.getAvailableSlots(formattedDate);
            setAvailableSlots(slots);
            setSelectedStartTime('');
            setSelectedCourt('');
            setAvailableCourts([]);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch available slots. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowBookingForm = () => {
        setShowBookingForm(true);
        const today = new Date();
        setSelectedDate(today);
        handleDateSelect(today);
    };

    const handleTimeSelect = async (startTime: string) => {
        setSelectedStartTime(startTime);
        setSelectedCourt('');

        if (!selectedDate) return;

        try {
            const endTimeIndex = availableSlots.findIndex(slot => slot.startTime === startTime) + (selectedDuration * 2);
            const endTime = availableSlots[endTimeIndex - 1].endTime;

            const courts = await bookingService.getAvailableCourts(
                format(selectedDate, "yyyy-MM-dd"),
                startTime,
                endTime
            );

            setAvailableCourts(courts);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch available courts. Please try again.",
                variant: "destructive",
            });
        }
    };

    const isTimeInPast = (time: string) => {
        if (!selectedDate) return false;

        const [hours, minutes] = time.split(':').map(Number);
        const timeDate = set(selectedDate, {hours, minutes});
        return isBefore(timeDate, new Date());
    };

    const isValidTimeSelection = (startTime: string) => {
        const startIndex = availableSlots.findIndex(slot => slot.startTime === startTime);
        if (startIndex === -1) return false;

        if (isTimeInPast(startTime)) return false;

        // Calculate maximum possible duration based on remaining slots
        const remainingSlots = availableSlots.length - startIndex;
        const maxPossibleDuration = Math.floor(remainingSlots / 2);

        const requiredSlots = selectedDuration === 1.5 ? 3 : selectedDuration * 2;

        // Check if we have enough slots left for selected duration
        if (requiredSlots > remainingSlots) return false;

        for (let i = 0; i < requiredSlots; i++) {
            const slot = availableSlots[startIndex + i];
            if (!slot?.isAvailable) return false;

            if (i > 0) {
                const prevSlot = availableSlots[startIndex + i - 1];
                const prevTime = parse(prevSlot.endTime, 'HH:mm', new Date());
                const currentTime = parse(slot.startTime, 'HH:mm', new Date());
                if (currentTime.getTime() !== prevTime.getTime()) return false;
            }
        }
        return true;
    };

    const calculateMaxDuration = (startTime: string): number => {
        const startIndex = availableSlots.findIndex(slot => slot.startTime === startTime);
        if (startIndex === -1) return 0;

        let consecutiveSlots = 0;
        for (let i = 0; i < 4; i++) { // Check up to 2 hours (4 slots)
            const currentSlot = availableSlots[startIndex + i];
            if (!currentSlot?.isAvailable) break;
            consecutiveSlots++;
        }

        // Convert consecutive slots to hours
        if (consecutiveSlots >= 4) return 2;
        if (consecutiveSlots >= 3) return 1.5;
        if (consecutiveSlots >= 2) return 1;
        return 0;
    };

    const handleDurationSelect = async (newDuration: number) => {
        setSelectedDuration(newDuration);
        setSelectedCourt('');

        if (selectedStartTime) {
            const maxDuration = calculateMaxDuration(selectedStartTime);
            if (newDuration <= maxDuration) {
                await handleTimeSelect(selectedStartTime);
            } else {
                setSelectedCourt('');
                setAvailableCourts([]);
            }
        }
    };

    useEffect(() => {
        // Check for pending booking if user is logged in
        if (user) {
            const pendingBooking = getCookie('pendingBooking');
            if (pendingBooking) {
                try {
                    const bookingData = JSON.parse(pendingBooking);
                    // Immediately confirm the pending booking
                    handleBookingConfirmed();
                    deleteCookie('pendingBooking');
                } catch (error) {
                    console.error('Failed to parse pending booking:', error);
                    deleteCookie('pendingBooking');
                }
            }
        }

        // Listen for custom event from header
        const handleShowBooking = () => {
            setShowBookingForm(true);
            const today = new Date();
            setSelectedDate(today);
            handleDateSelect(today);
        };

        window.addEventListener('showBookingForm', handleShowBooking);

        // Check URL parameters on mount
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('showBooking') === 'true') {
            handleShowBooking();
        }

        return () => {
            window.removeEventListener('showBookingForm', handleShowBooking);
        };
    }, [user]);

    const getEndTime = (): string => {
        if (!selectedStartTime || !availableSlots.length) return '';

        const startIndex = availableSlots.findIndex(slot => slot.startTime === selectedStartTime);
        if (startIndex === -1) return '';

        const endSlotIndex = startIndex + (selectedDuration === 1.5 ? 3 : selectedDuration * 2) - 1;
        return availableSlots[endSlotIndex]?.endTime || '';
    };

    useEffect(() => {
        const pendingBooking = getCookie('pendingBooking');
        if (pendingBooking) {
            try {
                const bookingData = JSON.parse(pendingBooking);
                // Set all booking details from cookie
                setSelectedDate(new Date(bookingData.date));
                setSelectedStartTime(bookingData.startTime);
                setSelectedCourt(bookingData.courtId);
                setSelectedDuration(bookingData.duration);
            } catch (error) {
                console.error('Failed to parse pending booking:', error);
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            // Clean up pending booking if component unmounts
            if (sessionStorage.getItem('pendingBooking') && !user) {
                sessionStorage.removeItem('pendingBooking');
            }
        };
    }, [user]);

    const sendMail = async () => {
        if (!user || !user.email) {
            toast({
                title: 'Error',
                description: 'User email is not available.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const response = await fetch('/api/sendmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: user.email,
                    subject: "Booking Confirmation",
                    text: "Your booking has been confirmed.",
                    html: `<!DOCTYPE html>
                            <html lang="sr">
                            <head>
                              <meta charset="UTF-8">
                              <style>
                                body {
                                  font-family: Arial, sans-serif;
                                  background-color: #f4f4f7;
                                  padding: 20px;
                                  margin: 0;
                                }
                                .container {
                                  background-color: #ffffff;
                                  max-width: 600px;
                                  margin: 0 auto;
                                  border-radius: 8px;
                                  padding: 30px;
                                  box-shadow: 0 0 10px rgba(0,0,0,0.05);
                                }
                                .logo {
                                  text-align: center;
                                  margin-bottom: 20px;
                                }
                                .logo img {
                                  max-width: 150px;
                                }
                                .title {
                                  font-size: 24px;
                                  color: #333333;
                                  text-align: center;
                                  margin-bottom: 20px;
                                }
                                .content {
                                  font-size: 16px;
                                  color: #555555;
                                  line-height: 1.6;
                                }
                                .highlight {
                                  color: #1a73e8;
                                  font-weight: bold;
                                }
                                .footer {
                                  margin-top: 30px;
                                  font-size: 14px;
                                  text-align: center;
                                  color: #999999;
                                }
                              </style>
                                <title>Booking Confirmation</title>
                            </head>
                            <body>
                              <div class="container">
                                <div class="logo">
                                  <img src="https://padelplatz.rs/logo-transparent.png" alt="Logo">
                                </div>
                                <div class="title">Booking Confirmation</div>
                                <div class="content">
                                  <p>Your booking has been confirmed for <span class="highlight">${format(selectedDate!, 'MMMM d, yyyy')}</span> at <span class="highlight">${selectedStartTime}</span> for <span class="highlight">${selectedDuration}</span> hours.</p>
                                </div>
                                <div class="footer">
                                  <p>Thank you for booking with us!</p>
                                </div>
                              </div>
                            </body>
                            </html>
                            `,
                }),
            });

            const data: EmailResponse = await response.json();

            console.log('Email sent:', data);

            if (!data.success) {
                throw new Error(data.error || 'Failed to send email');
            }

            const mailResponse = await fetch('/api/sendmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: 'info@padelplatz.rs',
                    subject: "Booking Confirmation",
                    text: "You have a new booking",
                    html: `<p>New booking confirmed for ${user.displayName} (${user.email}) on ${format(selectedDate!, 'MMMM d, yyyy')}
                                at ${selectedStartTime} for ${selectedDuration} hours.</p>`
                }),
            });

            const mailData: EmailResponse = await mailResponse.json();
            console.log('Email sent:', mailData);

            if (!mailData.success) {
                throw new Error(mailData.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            toast({
                title: 'Error',
                description: 'Failed to send confirmation email.',
                variant: 'destructive',
            });
        }
    };

    const handleBookingConfirmed = async () => {
        if (!user) {
            setCookie('pendingBooking', JSON.stringify({
                date: selectedDate?.toISOString(),
                startTime: selectedStartTime,
                courtId: selectedCourt,
                duration: selectedDuration,
                price: calculateTotalPrice()
            }));
            router.push('/auth/login?showBooking=true');
            return;
        }

        setIsLoading(true);

        if (userProfile.noShowUser) {
            toast({
                title: 'Booking Failed',
                description: 'You are not allowed to book due to no-show policy. Please contact us for more information.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
        try {
            let bookingToConfirm = null;

            // Handle pending booking if exists
            const pendingBooking = getCookie('pendingBooking');
            if (pendingBooking) {
                try {
                    const bookingData = JSON.parse(pendingBooking);
                    const formattedDate = format(new Date(bookingData.date), 'yyyy-MM-dd');

                    const slots = await bookingService.getAvailableSlots(formattedDate);
                    const startIndex = slots.findIndex(slot => slot.startTime === bookingData.startTime);

                    if (startIndex === -1) throw new Error('Time slot no longer available');

                    const endSlotIndex = startIndex + (bookingData.duration === 1.5 ? 3 : bookingData.duration * 2) - 1;
                    const endTime = slots[endSlotIndex]?.endTime;

                    if (!endTime) throw new Error('Could not calculate end time');

                    bookingToConfirm = await bookingService.createBooking({
                        userId: user.uid,
                        courtId: bookingData.courtId,
                        date: formattedDate,
                        startTime: bookingData.startTime,
                        endTime: endTime,
                        price: bookingData.price,
                        customerName: user.displayName || '',
                        customerEmail: user.email || '',
                        customerPhone: userProfile.phone || '',
                    });

                    deleteCookie('pendingBooking');
                } catch (error) {
                    console.error('Failed to process pending booking:', error);
                    deleteCookie('pendingBooking');
                }
            }

            // Normal booking flow if no pending booking or if pending booking failed
            if (!bookingToConfirm) {
                if (!selectedDate || !selectedStartTime || !selectedCourt) {
                    throw new Error('Missing required booking information');
                }

                const endTimeIndex = availableSlots.findIndex(slot => slot.startTime === selectedStartTime) +
                    (selectedDuration === 1.5 ? 3 : selectedDuration * 2);

                if (endTimeIndex > availableSlots.length || endTimeIndex < 0) {
                    throw new Error('Invalid time slot selection');
                }

                const endTime = availableSlots[endTimeIndex - 1]?.endTime;
                if (!endTime) {
                    throw new Error('Invalid time slot selection');
                }

                bookingToConfirm = await bookingService.createBooking({
                    userId: user.uid,
                    courtId: selectedCourt,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    startTime: selectedStartTime,
                    endTime: endTime,
                    price: calculateTotalPrice(),
                    customerName: user.displayName || '',
                    customerEmail: user.email || '',
                    customerPhone: userProfile.phone || '',
                });
            }

            console.log('Booking confirmed:', bookingToConfirm);
            setConfirmedBooking(bookingToConfirm);
            setShowConfirmationModal(true);
            if (onBookingSuccess) {
                onBookingSuccess(bookingToConfirm);
            }

            // Reset form
            setSelectedDate(undefined);
            setSelectedStartTime('');
            setSelectedCourt('');
            setAvailableSlots([]);
            setAvailableCourts([]);

            console.log('Booking confirmed:', bookingToConfirm);
            sendMail();

        } catch (error) {
            toast({
                title: 'Booking Failed',
                description: error instanceof Error ? error.message : 'Unable to complete your booking.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!showBookingForm) {
        return (
            <div className='text-center'>
                <Button
                    size='lg'
                    onClick={handleShowBookingForm}
                    className="bg-[#FF7F50] text-white px-6 py-4 md:px-9 md:py-8 font-semibold text-lg md:text-2xl transition-transform duration-300 transform hover:scale-105 hover:bg-[#FF7F50]"
                >
                    Rezerviši
                </Button>
            </div>
        );
    }

    return (
        <>
            <Card className='w-full max-w-2xl mx-auto rounded-md'>
                <CardHeader className='flex flex-row items-center justify-between p-1'>
                    <Button
                        variant='ghost'
                        onClick={() => setShowBookingForm(false)}
                        className='ml-auto text-lg md:text-xl'
                    >
                        ✕
                    </Button>
                </CardHeader>
                <CardContent className='space-y-6 pt-2'>
                    <div className="w-full max-w-[95vw] md:max-w-none mx-auto scale-75 md:scale-100">
                        <DateSlider
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                        />
                    </div>

                    {selectedDate && availableSlots.length > 0 && (
                        <div className='grid grid-cols-4 gap-2'>
                            {availableSlots.map((slot) => (
                                <Button
                                    key={slot.startTime}
                                    variant={selectedStartTime === slot.startTime ? 'default' : 'outline'}
                                    disabled={!isValidTimeSelection(slot.startTime) || isLoading || isTimeInPast(slot.startTime)}
                                    onClick={() => handleTimeSelect(slot.startTime)}
                                    className='w-full text-sm md:text-base'
                                >
                                    {slot.startTime}
                                </Button>
                            ))}
                        </div>
                    )}

                    {selectedStartTime && (
                        <div>
                            <div className='flex gap-2 flex-wrap'>
                                {durations.map(({value, label}) => {
                                    const maxDuration = calculateMaxDuration(selectedStartTime);
                                    return (
                                        <Button
                                            key={value}
                                            variant={selectedDuration === value ? 'default' : 'outline'}
                                            onClick={() => handleDurationSelect(value)}
                                            disabled={isLoading || value > maxDuration}
                                            className='text-sm md:text-base'
                                        >
                                            {label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {availableCourts.length > 0 && (
                        <div>
                            <RadioGroup
                                value={selectedCourt || ""}
                                onValueChange={setSelectedCourt}
                                className="space-y-4"
                            >
                                {availableCourts.map((court) => (
                                    <div key={court.id} className="flex items-start space-x-4 border rounded-lg p-4">
                                        <RadioGroupItem value={court.id} id={court.id}/>
                                        <div className="flex-1">
                                            <Label htmlFor={court.id} className="text-base md:text-lg font-medium">
                                                {court.name}
                                            </Label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Badge variant={court.type === "indoor" ? "courtType" : "courtType"}
                                                       className="text-xs md:text-sm">
                                                    {court.type}
                                                </Badge>
                                                {court.features.map((feature, index) => (
                                                    <Badge key={index} variant="outline"
                                                           className="text-xs md:text-sm">{feature}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    )}

                    {selectedStartTime && selectedCourt && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button className='w-full text-base md:text-lg' disabled={isLoading}>
                                    {isLoading ? 'Confirming...' : 'Confirm Booking'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-lg md:text-xl">Confirm Your
                                        Booking</AlertDialogTitle>
                                    <AlertDialogDescription className="text-sm md:text-base">
                                        {!user ? (
                                            <div className='mt-4 space-y-2'>
                                                <div>You have a pending booking:</div>
                                                <div>Date: {format(new Date(selectedDate!), 'MMMM d, yyyy')}</div>
                                                <div>Time: {selectedStartTime}</div>
                                                <div>Duration: {selectedDuration} {selectedDuration === 1 ? 'hour' : 'hours'}</div>
                                                <div className="font-semibold">Total Price:
                                                    €{calculateTotalPrice()}</div>
                                                <div className="text-sm mt-2">Please sign in to complete your booking.
                                                </div>
                                            </div>
                                        ) : (
                                            <div className='mt-4 space-y-2'>
                                                <div>Date: {format(selectedDate!, 'MMMM d, yyyy')}</div>
                                                <div>Time: {selectedStartTime} - {getEndTime()}</div>
                                                <div>Duration: {selectedDuration} {selectedDuration === 1 ? 'hour' : 'hours'}</div>
                                                <div>Court: {availableCourts.find(court => court.id === selectedCourt)?.name}</div>
                                                <div className="font-semibold">Total Price:
                                                    €{calculateTotalPrice()}</div>
                                            </div>
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="text-sm md:text-base text-black border-2">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleBookingConfirmed}
                                                       className="text-sm md:text-base">
                                        {user ? 'Confirm Booking' : 'Sign In to Book'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardContent>
            </Card>
        </>
    );
}