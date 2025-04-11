import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { oobCode } = router.query;
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyResetCode = async () => {
      if (!oobCode || typeof oobCode !== "string") {
        setIsVerifying(false);
        setError("Nevalidan link za resetovanje lozinke. Molimo zatražite novi email za resetovanje lozinke.");
        return;
      }

      try {
        const emailFromCode = await authService.verifyPasswordResetCode(oobCode);
        setEmail(emailFromCode);
        setIsVerifying(false);
      } catch (error: any) {
        setIsVerifying(false);
        setError(error.message || "Nevalidan ili istekao link za resetovanje lozinke. Molimo zatražite novi.");
        toast({
          title: "Greška",
          description: error.message || "Nevalidan ili istekao link za resetovanje lozinke. Molimo zatražite novi.",
          variant: "destructive",
        });
      }
    };

    if (oobCode) {
      verifyResetCode();
    }
  }, [oobCode, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Greška",
        description: "Lozinke se ne poklapaju.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Greška",
        description: "Lozinka mora biti dugačka najmanje 6 karaktera.",
        variant: "destructive",
      });
      return;
    }

    if (!oobCode || typeof oobCode !== "string") {
      setError("Nevalidan link za resetovanje lozinke. Molimo zatražite novi email za resetovanje.");
      return;
    }

    setIsResetting(true);

    try {
      await authService.confirmPasswordReset(oobCode, newPassword);
      setIsSuccess(true);
      toast({
        title: "Uspeh",
        description: "Vaša lozinka je uspešno resetovana. Sada se možete prijaviti sa novom lozinkom.",
      });
    } catch (error: any) {
      setError(error.message || "Nije uspelo resetovanje lozinke. Molimo pokušajte ponovo.");
      toast({
        title: "Greška",
        description: error.message || "Nije uspelo resetovanje lozinke. Molimo pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Resetovanje Lozinke</CardTitle>
          <CardDescription>
            {isVerifying
              ? "Verifikacija vašeg linka za resetovanje..."
              : isSuccess
                ? "Lozinka uspešno resetovana"
                : error
                  ? "Resetovanje lozinke nije uspelo"
                  : `Kreirajte novu lozinku za ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p>Molimo čekajte dok verifikujemo vaš link za resetovanje...</p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center py-6 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center">
                Vaša lozinka je uspešno resetovana. Sada se možete prijaviti sa novom lozinkom.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-6 space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-center text-red-500">{error}</p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Lozinka</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Lozinka mora biti dugačka najmanje 6 karaktera.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Potvrdi Lozinku</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isResetting}>
                {isResetting ? "Resetujem lozinku..." : "Resetuj Lozinku"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {(isSuccess || error) && (
            <Button asChild>
              <Link href="/auth/login">Povratak na prijavu</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
