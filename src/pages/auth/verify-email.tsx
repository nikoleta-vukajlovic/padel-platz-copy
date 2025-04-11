import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { oobCode } = router.query;
  const { toast } = useToast();

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!oobCode || typeof oobCode !== "string") {
        setIsVerifying(false);
        setError("Nevalidan link za verifikaciju. Molimo zatražite novi email za verifikaciju.");
        return;
      }

      try {
        await authService.verifyEmail(oobCode);
        setIsSuccess(true);
        toast({
          title: "Email Verifikovan",
          description: "Vaš email je uspešno verifikovan.",
        });

        // Početak odbrojavanja za automatski preusmeravanje
        let count = 3;
        setRedirectCountdown(count);
        const countdownInterval = setInterval(() => {
          count -= 1;
          setRedirectCountdown(count);

          if (count <= 0) {
            clearInterval(countdownInterval);
            router.push("/auth/login");
          }
        }, 1000);

        return () => clearInterval(countdownInterval);
      } catch (error: any) {
        setError(error.message || "Neuspešna verifikacija emaila. Link može biti nevalidan ili istekao.");
        toast({
          title: "Verifikacija neuspešna",
          description: error.message || "Neuspešna verifikacija emaila. Link može biti nevalidan ili istekao.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    if (oobCode) {
      verifyEmail();
    }
  }, [oobCode, toast, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifikacija Emaila</CardTitle>
          <CardDescription>
            {isVerifying
              ? "Verifikujemo vaš email..."
              : isSuccess
                ? "Vaš email je verifikovan"
                : "Verifikacija emaila nije uspela"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {isVerifying ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary text-[#233c1d]"></div>
              <p>Molimo čekajte dok verifikujemo vaš email...</p>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center">
                Vaš email je uspešno verifikovan. Sada se možete prijaviti na svoj nalog.
              </p>
              <p className="text-center">Bićete preusmereni za {redirectCountdown} sekundi...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-center text-red-500">{error}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!isVerifying && (
            <div className="space-x-4">
              <Button asChild>
                <Link href="/auth/login">
                  {isSuccess ? "Prijavite se" : "Povratak na prijavu"}
                </Link>
              </Button>
              {!isSuccess && (
                <Button variant="outline" asChild>
                  <Link href="/auth/resend-verification">
                    Ponovno slanje verifikacije
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
