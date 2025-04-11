import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Stanja za zaboravljenu lozinku
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const currentQuery = router.query;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await authService.login(email, password);

      if (!userCredential.user.emailVerified) {
        toast({
          title: "Email nije verifikovan",
          description: "Molimo vas da verifikujete svoju email adresu pre nego što se prijavite. Proverite svoj inbox za verifikacioni link.",
          variant: "destructive",
        });

        // Ponuditi ponovnu slanje verifikacionog email-a
        const resend = window.confirm("Želite li da ponovo pošaljemo verifikacioni email?");
        if (resend) {
          await authService.resendVerificationEmail();
          toast({
            title: "Verifikacioni email je poslat",
            description: "Novi verifikacioni email je poslat na vaš inbox.",
          });
        }

        await authService.logout();
        setIsLoading(false);
        return;
      }

      toast({
        title: "Uspešno",
        description: "Uspešno ste se prijavili.",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Nevalidan email ili lozinka.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      const user = await authService.loginWithGoogle();
      toast({
        title: "Uspešno",
        description: "Uspešno ste se prijavili sa Google-om.",
      });
      router.push("/");
    } catch (error: any) {
      console.error('Greška pri prijavi sa Google-om:', error);
      toast({
        title: "Greška",
        description: error.message || "Nije uspelo prijavljivanje sa Google-om. Pokušajte ponovo.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      await authService.sendPasswordResetEmail(resetEmail);
      setResetSuccess(true);
      toast({
        title: "Email za resetovanje lozinke je poslat",
        description: "Proverite svoj email za instrukcije kako da resetujete lozinku.",
      });
    } catch (error: any) {
      toast({
        title: "Greška",
        description: error.message || "Nije uspelo slanje email-a za resetovanje lozinke.",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  const closeForgotPasswordDialog = () => {
    setForgotPasswordOpen(false);
    setResetEmail("");
    setResetSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm rounded-lg">
        <CardHeader className="flex flex-col items-center space-y-2 p-4">
          <Link href="/" className="mb-2">
            <Image
                src="/logo-transparent.png" // Zameni sa stvarnim putem do logo-a
                alt="Logo"
                width={100} // Podesite širinu po potrebi
                height={100} // Podesite visinu po potrebi
                className="cursor-pointer"
            />
          </Link>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleLogin} className="space-y-3">
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
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setForgotPasswordOpen(true)}
                >
                  Zaboravili ste lozinku?
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Prijavljivanje..." : "Prijavite se"}
            </Button>
            <div className="flex items-center w-full my-2">
              <hr className="flex-grow border-gray-300"/>
              <span className="mx-2 text-gray-400"> ili </span>
              <hr className="flex-grow border-gray-300"/>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                  <>
                    <FcGoogle className="h-5 w-5"/>
                    Prijavljivanje sa Google-om...
                  </>
              ) : (
                  <>
                    <FcGoogle className="h-5 w-5"/>
                    Prijavite se sa Google-om
                  </>
              )}
            </Button>
            <div className="text-center text-sm text-[#233c1d]">
              {"Nemate nalog? "}
              <Link href={{
                pathname: '/auth/register',
                query: currentQuery,
              }}
                    className="text-primary hover:underline">
                Registrujte se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Modal za zaboravljenu lozinku */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="bg-background rounded-md shadow-lg max-w-md p-0">
          <Card className="w-full rounded-md">
            <CardHeader className="flex flex-col items-center">
              <Image
                  src="/logo-transparent.png"
                  alt="Logo"
                  width={80}
                  height={80}
                  className="mb-2"
              />
              <DialogDescription className="text-gray-500 text-center">
                Unesite svoj email da biste dobili link za resetovanje lozinke.
              </DialogDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email" className="sr-only">Email</Label>
                  <Input
                      id="reset-email"
                      type="email"
                      placeholder="Unesite svoj email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full"
                  />
                </div>
                <CardFooter className="flex flex-col w-full space-y-2 p-0">
                  <Button type="submit" className="w-full" disabled={isResetLoading}>
                    {isResetLoading ? "Šaljem..." : "Pošaljite link za resetovanje"}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}