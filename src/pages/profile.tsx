import {useEffect, useState} from "react";
import {useAuth} from "@/contexts/AuthContext";
import {useRouter} from "next/router";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Layout} from "@/components/layout/Layout";
import {bookingService} from "@/services/bookingService";
import {format, isPast, parseISO} from "date-fns";
import {Booking} from "@/types/booking";
import {Button} from "@/components/ui/button";
import {useToast} from "@/hooks/use-toast";
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
import {courtService} from "@/services/courtService";
import {Court} from '@/types/booking';
import {userService} from "@/services/userService";
import {Input} from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {EmailResponse} from "@/types/email";

export default function ProfilePage() {
    const {user, loading, userProfile, refreshUserProfile} = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const {toast} = useToast();
    const [courts, setCourts] = useState<Court[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    // Profile edit state
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const [birthdate, setBirthdate] = useState("");
    const [birthDay, setBirthDay] = useState("");
    const [birthMonth, setBirthMonth] = useState("");
    const [birthYear, setBirthYear] = useState("");
    const days = Array.from({length: 31}, (_, i) => i + 1);
    const months = [
        {value: "01", label: "January"},
        {value: "02", label: "February"},
        {value: "03", label: "March"},
        {value: "04", label: "April"},
        {value: "05", label: "May"},
        {value: "06", label: "June"},
        {value: "07", label: "July"},
        {value: "08", label: "August"},
        {value: "09", label: "September"},
        {value: "10", label: "October"},
        {value: "11", label: "November"},
        {value: "12", label: "December"},
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: currentYear - 1900}, (_, i) => currentYear - i);

    const isBookingPast = (booking: Booking) => {
        const bookingDate = parseISO(booking.date);
        const bookingEndTime = booking.endTime.split(':');
        const bookingEndHour = parseInt(bookingEndTime[0]);
        const bookingEndMinute = parseInt(bookingEndTime[1]);

        const bookingEndDateTime = new Date(
            bookingDate.getFullYear(),
            bookingDate.getMonth(),
            bookingDate.getDate(),
            bookingEndHour,
            bookingEndMinute
        );

        return isPast(bookingEndDateTime);
    };

    const upcomingBookings = bookings
        .filter(booking => !isBookingPast(booking))
        .sort((a, b) => {
            // First sort by cancellation status (non-cancelled first)
            if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
            if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;

            // Then sort by date and time (earliest first)
            const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
            if (dateDiff !== 0) return dateDiff;

            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });

    const pastBookings = bookings
        .filter(booking => isBookingPast(booking))
        .sort((a, b) => {
            // Then sort by date and time (most recent first)
            const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateDiff !== 0) return dateDiff;

            return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        fetchBookings();
        fetchCourts();
    }, [user]);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || "");
            setPhone(userProfile.phone || "");

            if (userProfile.birthdate) {
                const date = new Date(userProfile.birthdate);
                setBirthDay(date.getDate().toString());
                setBirthMonth((date.getMonth() + 1).toString());
                setBirthYear(date.getFullYear().toString());
            } else {
                setBirthDay("");
                setBirthMonth("");
                setBirthYear("");
            }
        }
    }, [userProfile]);

    const fetchBookings = async () => {
        if (user) {
            try {
                const userBookings = await bookingService.getUserBookings(user.uid);
                setBookings(userBookings);
            } catch (error) {
                console.error("Failed to fetch bookings:", error);
                toast({
                    title: "Greška",
                    description: "Nije moguće učitati vaše rezervacije.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    const fetchCourts = async () => {
        try {
            const allCourts = await courtService.getAllCourts();
            setCourts(allCourts);
        } catch (error) {
            console.error("Failed to fetch courts:", error);
        }
    };

    const sendMail = async (bookingId) => {
        console.log("Sending email for booking ID:", bookingId);
        if (!user || !user.email) {
            toast({
                title: 'Greška',
                description: 'Email korisnika nije dostupan.',
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
                    subject: "Rezervacija otkazana",
                    text: "Vaša rezervacija je otkazana",
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
                                  color: #e74c3c; /* Red color for cancellation */
                                  font-weight: bold;
                                }
                                .footer {
                                  margin-top: 30px;
                                  font-size: 14px;
                                  text-align: center;
                                  color: #999999;
                                }
                              </style>
                              <title>Booking Cancellation</title>
                            </head>
                            <body>
                              <div class="container">
                                <div class="logo">
                                  <img src="https://padelplatz.rs/logo-transparent.png" alt="Logo">
                                </div>
                                <div class="title">Booking Cancellation</div>
                                <div class="content">
                                  <p>Your booking has been <span class="highlight">canceled</span>.</p>
                                  <p>If you have any questions, please contact us.</p>
                                </div>
                                <div class="footer">
                                  <p>We hope to serve you again in the future!</p>
                                </div>
                              </div>
                            </body>
                            </html>
                            `
                }),
            });

            const data: EmailResponse = await response.json();

            console.log('Email sent:', data);

            if (!data.success) {
                throw new Error(data.error || 'Nije uspelo slanje email-a.');
            }

            const courtName = courts.find(court => court.id === bookingId.courtId)?.name

            const mailResponse = await fetch('/api/sendmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: 'info@padelplatz.rs',
                    subject: "Otkažena rezervacija",
                    text: "Rezervacija je otkazana",
                    html: `<p>Rezervacija na terenu: ${courtName} u ${bookingId.startTime} - ${bookingId.endTime},
                je otkazana. Korisnik: ${user?.displayName} - ${user?.email}.</p>`
                }),
            });

            const mailData: EmailResponse = await mailResponse.json();
            console.log('Email sent:', mailData);

            if (!mailData.success) {
                throw new Error(mailData.error || 'Nije uspelo slanje email-a');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            toast({
                title: 'Greška',
                description: 'Nije uspelo slanje potvrde putem email-a.',
                variant: 'destructive',
            });
        }
    };

    const handleCancelBooking = async (booking: Booking) => {
        try {
            const bookingId = booking.id;
            console.log("Booking ID:", bookingId);
            await bookingService.updateBookingStatus(bookingId, 'cancelled');
            toast({
                title: "Uspešno",
                description: "Rezervacija je uspešno otkazana.",
            });
            fetchBookings();

            sendMail(booking);
        } catch (error) {
            toast({
                title: "Greška",
                description: "Nije uspelo otkazivanje rezervacije.",
                variant: "destructive",
            });
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;

        if (!birthDay || !birthMonth || !birthYear) {
            toast({
                title: "Greška",
                description: "Molimo vas da izaberete potpuno datum rođenja.",
                variant: "destructive",
            });
            return;
        }

        const formattedBirthdate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;

        console.log('user:', user);

        setIsUpdating(true);
        try {
            await userService.updateUserProfile(user.uid, {
                name,
                phone,
                birthdate: formattedBirthdate
            });

            await refreshUserProfile();

            toast({
                title: "Uspeh",
                description: "Vaš profil je uspešno ažuriran.",
            });

            setIsEditing(false);
        } catch (error) {
            console.error("Nije uspelo ažuriranje profila:", error);
            toast({
                title: "Greška",
                description: "Nije uspelo ažuriranje vašeg profila.",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading || !user) {
        return null;
    }

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 bg-[#1b362f]">
                {/* Mobile: Profile first, then Bookings */}
                <div className="block lg:hidden space-y-8">
                    {/* Profile Card */}
                    <Card className="rounded-md">
                        <CardHeader>
                            <CardTitle>Moj Profil</CardTitle>
                            <div className="border-b border-gray-200 pt-2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>
                                    {isEditing ? (
                                        <Input
                                            value={name}
                                            placeholder={"Ime"}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    ) : (
                                        <p className="text-lg">{name}</p>
                                    )}
                                </div>

                                <div>
                                    {isEditing ? (
                                        <Input
                                            value={phone}
                                            placeholder={"Telefon"}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    ) : (
                                        <p className="text-lg">{phone}</p>
                                    )}
                                </div>

                                <div>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-2">
                                                {/* Selector za dan */}
                                                <Select onValueChange={setBirthDay} value={birthDay} required>
                                                    <SelectTrigger className="cursor-pointer">
                                                        <SelectValue placeholder="Dan"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {days.map((d) => (
                                                            <SelectItem key={d} value={d.toString()}>
                                                                {d}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {/* Selector za mesec */}
                                                <Select onValueChange={setBirthMonth} value={birthMonth} required>
                                                    <SelectTrigger className="cursor-pointer">
                                                        <SelectValue placeholder="Mesec"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {months.map((m) => (
                                                            <SelectItem key={m.value} value={m.value}>
                                                                {m.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {/* Selector za godinu */}
                                                <Select onValueChange={setBirthYear} value={birthYear} required>
                                                    <SelectTrigger className="cursor-pointer">
                                                        <SelectValue placeholder="Godina"/>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {years.map((y) => (
                                                            <SelectItem key={y} value={y.toString()}>
                                                                {y}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-lg">
                                            {birthDay && birthMonth && birthYear
                                                ? `${months.find(m => m.value === birthMonth)?.label} ${birthDay}, ${birthYear}`
                                                : "Nije određeno"}
                                        </p>
                                    )}
                                </div>

                                {!isEditing && (
                                    <div>
                                        <p className="text-lg">{user.email}</p>
                                    </div>
                                )}

                                {isEditing ? (
                                    <div className="flex justify-end gap-2 py-4">
                                        <Button onClick={() => setIsEditing(false)}>Otkaži</Button>
                                        <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                                            {isUpdating ? "Ažuriranje..." : "Ažuriraj profil"}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex justify-end py-4">
                                        <Button onClick={() => setIsEditing(true)}>Izmeni profil</Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>


                    {/* Bookings Card */}
                    <Card className="rounded-md">
                        <CardHeader>
                            <div className="flex border-b border-gray-300 w-full">
                                <Button
                                    variant="ghost"
                                    onClick={() => setActiveTab('upcoming')}
                                    className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-none ${
                                        activeTab === 'upcoming' ? 'border-gray-300 bg-primary text-white hover:text-white' : 'border-transparent text-gray-500'
                                    }`}
                                >
                                    Predstojeće
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setActiveTab('past')}
                                    className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-none ${
                                        activeTab === 'past' ? 'border-gray-300 bg-primary text-white hover:text-white' : 'border-transparent text-gray-500'
                                    }`}
                                >
                                    Prošle
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <p>Učitavanje rezervacija...</p>
                            ) : activeTab === 'upcoming' ? (
                                upcomingBookings.length > 0 ? (
                                    <div className="space-y-4">
                                        {upcomingBookings.map((booking) => (
                                            <Card key={booking.id}>
                                                <CardContent className="p-4">
                                                    <div className="grid grid-cols-5 gap-4 items-center">
                                                        {/* Datum & Vreme */}
                                                        <div>
                                                            <p className="font-medium">
                                                                {format(new Date(booking.date), "MMMM d, yyyy")}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {booking.startTime} - {booking.endTime}
                                                            </p>
                                                        </div>

                                                        {/* Ime terena */}
                                                        <div className="text-center">
                                                            <p className="text-sm">
                                                                {courts.find(court => court.id === booking.courtId)?.name || "Teren " + booking.courtId}
                                                            </p>
                                                        </div>

                                                        {/* Status */}
                                                        <div className="text-center">
                                                            {booking.status === "cancelled" ? (
                                                                <span
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                              Otkazano
                                            </span>
                                                            ) : isBookingPast(booking) ? (
                                                                <span
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              Završeno
                                            </span>
                                                            ) : (
                                                                <span
                                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                              Predstojeće
                                            </span>
                                                            )}
                                                        </div>

                                                        {/* Cena */}
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium">${booking.price}</p>
                                                        </div>

                                                        {/* Dugme za otkazivanje */}
                                                        {booking.status !== "cancelled" && (
                                                            <div className="flex justify-end">
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="destructiveOutline"
                                                                                size="sm">
                                                                            Otkazi
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent className="bg-white">
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Otkaži
                                                                                rezervaciju</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                <div className="mt-4 space-y-2">
                                                                                    <p>Datum: {format(new Date(booking.date), "MMMM d, yyyy")}</p>
                                                                                    <p>Vreme: {booking.startTime} - {booking.endTime}</p>
                                                                                    <p>Teren: {courts.find(court => court.id === booking.courtId)?.name || "Teren " + booking.courtId}</p>
                                                                                    <p>Cena: ${booking.price}</p>
                                                                                </div>
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel
                                                                                className="text-sm md:text-base text-black border-2">Zadrži
                                                                                rezervaciju</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => {
                                                                                    handleCancelBooking(booking);
                                                                                    document.querySelector("[role=dialog]")?.parentElement?.click();
                                                                                }}
                                                                            >
                                                                                Otkaži rezervaciju
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Nema predstojećih rezervacija.</p>
                                )
                            ) : pastBookings.length > 0 ? (
                                <div className="space-y-4">
                                    {pastBookings.map((booking) => (
                                        <Card key={booking.id}>
                                            <CardContent className="p-4">
                                                <div className="grid grid-cols-4 gap-4 items-center">
                                                    {/* Datum & Vreme */}
                                                    <div>
                                                        <p className="font-medium">
                                                            {format(new Date(booking.date), "MMM d")}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {booking.startTime} - {booking.endTime}
                                                        </p>
                                                    </div>

                                                    {/* Ime terena */}
                                                    <div className="text-center">
                                                        <p className="text-sm">
                                                            {courts.find(court => court.id === booking.courtId)?.name || "Teren " + booking.courtId}
                                                        </p>
                                                    </div>

                                                    {/* Cena */}
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium">${booking.price}</p>
                                                    </div>

                                                    {/* Ikona za potvrdu */}
                                                    <div className="text-center">
                                    <span className="text-green-500 px-2">
                                        {booking.status === "cancelled" ? (
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                              Otkazano
                                            </span>
                                        ) : booking.status === "no-show" ? (
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                              Nema dolaska
                                            </span>
                                        ) : (
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              Završeno
                                            </span>
                                        )}
                                    </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p>Nema prošlih rezervacija.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Desktop: Side by side with 2/3 - 1/3 split */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-8">
                    {/* Kartica sa rezervacijama - zauzima 2/3 prostora */}
                    <div className="col-span-2">
                        <Card className="rounded-md h-full">
                            <CardHeader>
                                <div className="flex border-b border-gray-300 w-full">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setActiveTab('upcoming')}
                                        className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-none ${
                                            activeTab === 'upcoming' ? 'border-gray-300 bg-primary text-white hover:text-white' : 'border-transparent text-gray-500'
                                        }`}
                                    >
                                        Predstojeće
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setActiveTab('past')}
                                        className={`px-4 py-2 text-sm font-medium border border-b-0 rounded-none ${
                                            activeTab === 'past' ? 'border-gray-300 bg-primary text-white hover:text-white' : 'border-transparent text-gray-500'
                                        }`}
                                    >
                                        Prošle
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <p>Učitavam rezervacije...</p>
                                ) : activeTab === 'upcoming' ? (
                                    upcomingBookings.length > 0 ? (
                                        <div className="space-y-4">
                                            {upcomingBookings.map((booking) => (
                                                <Card key={booking.id}>
                                                    <CardContent className="p-4">
                                                        <div className="grid grid-cols-5 gap-4 items-center">
                                                            {/* Datum i vreme */}
                                                            <div>
                                                                <p className="font-medium">
                                                                    {format(new Date(booking.date), "MMMM d, yyyy")}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {booking.startTime} - {booking.endTime}
                                                                </p>
                                                            </div>

                                                            {/* Naziv terena */}
                                                            <div className="text-center">
                                                                <p className="text-sm">
                                                                    {courts.find(court => court.id === booking.courtId)?.name || "Teren " + booking.courtId}
                                                                </p>
                                                            </div>

                                                            {/* Status */}
                                                            <div className="text-center">
                                                                {booking.status === "cancelled" ? (
                                                                    <span
                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Otkazano
                                                    </span>
                                                                ) : isBookingPast(booking) ? (
                                                                    <span
                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Završeno
                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Predstojeće
                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Cena */}
                                                            <div className="text-center">
                                                                <p className="text-sm font-medium">${booking.price}</p>
                                                            </div>

                                                            {/* Dugme za otkazivanje */}
                                                            {booking.status !== "cancelled" && (
                                                                <div className="text-center">
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button variant="destructiveOutline"
                                                                                    size="sm">
                                                                                Otkazivanje
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent className="bg-white">
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Otkazivanje
                                                                                    rezervacije</AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    Da li ste sigurni da želite da
                                                                                    otkažete ovu
                                                                                    rezervaciju?
                                                                                    <div className="mt-4 space-y-2">
                                                                                        <p>Datum: {format(new Date(booking.date), "MMMM d, yyyy")}</p>
                                                                                        <p>Vreme: {booking.startTime} - {booking.endTime}</p>
                                                                                        <p>Teren: {courts.find(court => court.id === booking.courtId)?.name || "Teren " + booking.courtId}</p>
                                                                                        <p>Cena: ${booking.price}</p>
                                                                                    </div>
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel
                                                                                    className="text-sm md:text-base text-black border-2">Ostavi
                                                                                    rezervaciju</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={() => {
                                                                                        handleCancelBooking(booking);
                                                                                        document.querySelector("[role=dialog]")?.parentElement?.click();
                                                                                    }}
                                                                                >
                                                                                    Da, otkaži rezervaciju
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>Nema predstojećih rezervacija.</p>
                                    )
                                ) : pastBookings.length > 0 ? (
                                    <div className="space-y-4">
                                        {pastBookings.map((booking) => (
                                            <Card key={booking.id}>
                                                <CardContent className="p-4">
                                                    <div className="grid grid-cols-4 gap-4 items-center">
                                                        {/* Datum i vreme */}
                                                        <div>
                                                            <p className="font-medium">
                                                                {format(new Date(booking.date), "MMM d")}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {booking.startTime} - {booking.endTime}
                                                            </p>
                                                        </div>

                                                        {/* Naziv terena */}
                                                        <div className="text-center">
                                                            <p className="text-sm">
                                                                {courts.find(court => court.id === booking.courtId)?.name || "Teren " + booking.courtId}
                                                            </p>
                                                        </div>

                                                        {/* Cena */}
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium">${booking.price}</p>
                                                        </div>

                                                        {/* Ikona za proveru */}
                                                        <div className="text-center">
                                            <span className="text-green-500 px-2">
                                                {booking.status === "cancelled" ? (
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Otkazano
                                                    </span>
                                                ) : booking.status === "no-show" ? (
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        Nema dolaska
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Završeno
                                                    </span>
                                                )}
                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Nema prošlih rezervacija.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Profile Card - takes 1/3 of space */}
                    <div className="col-span-1">
                        <Card className="rounded-md h-fit">
                            <CardHeader>
                                <CardTitle>Profil</CardTitle>
                                <div className="border-b border-gray-200 pt-2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        {isEditing ? (
                                            <Input
                                                value={name}
                                                placeholder={"Ime"}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-lg">{name}</p>
                                        )}
                                    </div>

                                    <div>
                                        {isEditing ? (
                                            <Input
                                                value={phone}
                                                placeholder={"Telefon"}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-lg">{phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {/* Selector za dan */}
                                                    <Select onValueChange={setBirthDay} value={birthDay} required>
                                                        <SelectTrigger className="cursor-pointer">
                                                            <SelectValue placeholder="Dan"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {days.map((d) => (
                                                                <SelectItem key={d} value={d.toString()}>
                                                                    {d}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Selector za mesec */}
                                                    <Select onValueChange={setBirthMonth} value={birthMonth} required>
                                                        <SelectTrigger className="cursor-pointer">
                                                            <SelectValue placeholder="Mesec"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {months.map((m) => (
                                                                <SelectItem key={m.value} value={m.value}>
                                                                    {m.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    {/* Selector za godinu */}
                                                    <Select onValueChange={setBirthYear} value={birthYear} required>
                                                        <SelectTrigger className="cursor-pointer">
                                                            <SelectValue placeholder="Godina"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {years.map((y) => (
                                                                <SelectItem key={y} value={y.toString()}>
                                                                    {y}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-lg">
                                                {birthDay && birthMonth && birthYear
                                                    ? `${months.find(m => m.value === birthMonth)?.label} ${birthDay}, ${birthYear}`
                                                    : "Nije navedeno"}
                                            </p>
                                        )}
                                    </div>

                                    {!isEditing && (
                                        <div>
                                            <p className="text-lg">{user.email}</p>
                                        </div>
                                    )}

                                    {isEditing ? (
                                        <div className="flex justify-end gap-2 py-4">
                                            <Button onClick={() => setIsEditing(false)}>Otkaži</Button>
                                            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                                                {isUpdating ? "Ažuriranje..." : "Ažuriraj Profil"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end py-4">
                                            <Button onClick={() => setIsEditing(true)}>Izmeni Profil</Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </Layout>
    );
}