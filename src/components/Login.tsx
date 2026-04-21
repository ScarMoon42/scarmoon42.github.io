import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";

interface LoginProps {
  onLogin: () => void | Promise<void>;
}

export function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await onLogin();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="login" className="px-6 py-20 bg-white lg:px-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>Авторизация выполняется через Keycloak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="button" className="w-full gap-2" onClick={handleLogin} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Войти
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}