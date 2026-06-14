"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wifi, Eye, EyeOff, Loader2, Fingerprint } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";

const REMEMBER_KEY = "anfieldnet_remembered_username";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isBiometricLoading, setIsBiometricLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
            setUsername(saved);
            setRememberMe(true);
            setHasPasskey(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, rememberMe }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Gagal login. Periksa kembali username dan password.");
            } else {
                if (rememberMe) {
                    localStorage.setItem(REMEMBER_KEY, username);
                } else {
                    localStorage.removeItem(REMEMBER_KEY);
                }
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("Terjadi kesalahan sistem. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBiometricLogin = async () => {
        if (!username) {
            setError("Masukkan username terlebih dahulu.");
            return;
        }
        setError("");
        setIsBiometricLoading(true);

        try {
            const optRes = await fetch("/api/auth/webauthn/login-options", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            if (!optRes.ok) {
                setError("Sidik jari belum didaftarkan untuk akun ini.");
                return;
            }

            const { adminId, ...options } = await optRes.json();

            const credential = await startAuthentication({ optionsJSON: options });

            const verRes = await fetch("/api/auth/webauthn/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminId, credential }),
            });

            if (!verRes.ok) {
                const d = await verRes.json();
                setError(d.error || "Verifikasi sidik jari gagal.");
            } else {
                if (rememberMe || localStorage.getItem(REMEMBER_KEY)) {
                    localStorage.setItem(REMEMBER_KEY, username);
                }
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name === "NotAllowedError") {
                setError("Verifikasi sidik jari dibatalkan.");
            } else {
                setError("Sidik jari belum didaftarkan atau tidak didukung perangkat ini.");
            }
        } finally {
            setIsBiometricLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/40 p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/3 blur-3xl" />
            </div>

            <div className="relative animate-fade-in-up">
                <Card className="w-full max-w-sm shadow-xl border-border/50">
                    <CardHeader className="space-y-1 text-center pb-2">
                        <div className="flex justify-center mb-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20">
                                <Wifi className="h-7 w-7" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">ANFIELDNET Billing</CardTitle>
                        <CardDescription className="text-muted-foreground/80">
                            Masuk ke akun admin Anda
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-5 pt-4 pb-4">
                            <div className="space-y-2.5">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="admin"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    autoFocus={!username}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-11 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="rememberMe"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                                />
                                <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none">
                                    Ingat saya
                                </label>
                            </div>

                            {error && (
                                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm font-medium text-destructive text-center animate-fade-in">
                                    {error}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pt-2 pb-6">
                            <Button type="submit" className="w-full h-11" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Masuk...
                                    </>
                                ) : (
                                    "Masuk"
                                )}
                            </Button>

                            {hasPasskey && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full h-11 gap-2"
                                    onClick={handleBiometricLogin}
                                    disabled={isBiometricLoading}
                                >
                                    {isBiometricLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Fingerprint className="h-5 w-5" />
                                    )}
                                    Masuk dengan Sidik Jari
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-xs text-muted-foreground/50 mt-6">
                    ANFIELDNET Billing &amp; Invoice Management System
                </p>
            </div>
        </div>
    );
}
