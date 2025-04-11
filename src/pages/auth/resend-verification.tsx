import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {authService} from "@/services/authService";
import {useToast} from "@/hooks/use-toast";
import Link from "next/link";
import {useAuth} from "@/contexts/AuthContext";

export default function ResendVerificationPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const {toast} = useToast();
    const {user} = useAuth();

    const handleResendVerification = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Ako je korisnik već prijavljen i nije verifikovan
            if (user && !user.emailVerified) {
                await authService.resendVerificationEmail();
            } else {
                // U suprotnom, pokušaj prvo da se prijavi
                await authService.login(email, password);
                await authService.resendVerificationEmail();
                // Odjavi se nakon slanja verifikacije
                await authService.logout();
            }

            setIsSuccess(true);
            toast({
                title: "Verifikacioni email poslat",
                description: "Novi verifikacioni email je poslat na vašu adresu.",
            });
        } catch (error: any) {
            toast({
                title: "Greška",
                description: error.message || "Slanje verifikacionog emaila nije uspelo. Molimo pokušajte ponovo.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Ponovo pošaljite verifikacioni email</CardTitle>
                    <CardDescription>
                        {isSuccess
                            ? "Verifikacioni email je uspešno poslat"
                            : "Unesite svoje akreditive da biste ponovo poslali verifikacioni email"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess ? (
                        <div className="text-center py-4">
                            <p className="mb-4">
                                Novi verifikacioni email je poslat na vašu adresu.
                                Molimo proverite svoj email i kliknite na verifikacioni link.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Ako ne vidite email u svom inboxu, proverite spam folder.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleResendVerification} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ime@primer.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={!!user}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Lozinka</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={!!user}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Šaljem..." : "Ponovo pošaljite verifikacioni email"}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button variant="link" asChild>
                        <Link href="/auth/login">Povratak na prijavu</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
