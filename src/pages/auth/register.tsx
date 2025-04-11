import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const currentQuery = router.query;

  // Generate days (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Months with Serbian names
  const months = [
    { value: "01", label: "Januar" },
    { value: "02", label: "Februar" },
    { value: "03", label: "Mart" },
    { value: "04", label: "April" },
    { value: "05", label: "Maj" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Avgust" },
    { value: "09", label: "Septembar" },
    { value: "10", label: "Oktobar" },
    { value: "11", label: "Novembar" },
    { value: "12", label: "Decembar" },
  ];

  // Generate years (current year - 100 to current year - 5)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 - 5 }, (_, i) => currentYear - 5 - i);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Greška",
        description: "Lozinke se ne poklapaju.",
        variant: "destructive",
      });
      return;
    }

    if (!day || !month || !year) {
      toast({
        title: "Greška",
        description: "Molimo unesite kompletnu datum rođenja.",
        variant: "destructive",
      });
      return;
    }

    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();

    if (birthDate.getDate() !== parseInt(day) ||
      birthDate.getMonth() !== parseInt(month) - 1 ||
      birthDate.getFullYear() !== parseInt(year)) {
      toast({
        title: "Greška",
        description: "Molimo unesite validan datum rođenja.",
        variant: "destructive",
      });
      return;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 5) {
      toast({
        title: "Greška",
        description: "Morate imati barem 5 godina da biste se registrovali.",
        variant: "destructive",
      });
      return;
    }

    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    setIsLoading(true);

    try {
      await authService.register(email, password, name, phone, formattedDate);
      toast({
        title: "Nalog kreiran",
        description: "Vaš nalog je uspešno kreiran. Proverite svoj email kako biste verifikovali nalog.",
      });
      router.push("/auth/login");
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Neuspešna registracija. Molimo pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await authService.loginWithGoogle('user');
      toast({
        title: "Uspešno",
        description: "Uspešno ste se prijavili sa Google-om.",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Neuspešna prijava sa Google-om. Molimo pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader className="flex flex-col items-center space-y-2 p-4">
          <Link href="/" className="mb-2">
            <Image
              src="/logo-transparent.png"
              alt="Logo"
              width={80}
              height={80}
              className="cursor-pointer"
            />
          </Link>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Puno ime"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            {/* Date of Birth Section */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Select onValueChange={setDay} value={day} required>
                  <SelectTrigger className="text-sm cursor-pointer">
                    <SelectValue placeholder="Dan" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((d) => (
                      <SelectItem key={d} value={d.toString()} className="text-sm">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={setMonth} value={month} required>
                  <SelectTrigger className="text-sm cursor-pointer">
                    <SelectValue placeholder="Mesec" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-sm">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select onValueChange={setYear} value={year} required>
                  <SelectTrigger className="text-sm cursor-pointer">
                    <SelectValue placeholder="Godina" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()} className="text-sm">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="Telefon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Potvrdite Lozinku"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Kreiranje naloga..." : "Kreiraj Nalog"}
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-gray-500">Ili</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              <FcGoogle className="h-4 w-4" />
              {isGoogleLoading ? "Prijavljivanje..." : "Prijavite se sa Google-om"}
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-2">
              Već imate nalog?{" "}
              <Link
                href={{ pathname: '/auth/login', query: currentQuery }}
                className="font-medium text-primary hover:underline"
              >
                Prijavite se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}