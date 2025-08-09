import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, BookOpen, MessageCircle, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Sistema Kids
            </CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  {...form.register("username")}
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no Sistema"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Usuário padrão: <strong>admin</strong></p>
              <p>Senha padrão: <strong>admin</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Hero Section */}
      <div className="flex-1 bg-primary/5 p-8 flex items-center justify-center">
        <div className="max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">
              Gerencie seu Ministério Infantil
            </h1>
            <p className="text-lg text-muted-foreground">
              Plataforma completa para gestão de turmas do ministério infantil. 
              Controle de presença, meditações, versículos e comunicação com responsáveis.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Gestão de Crianças</h3>
              <p className="text-xs text-muted-foreground">
                Cadastro completo e organização por turmas
              </p>
            </div>
            
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Controle de Presença</h3>
              <p className="text-xs text-muted-foreground">
                Aulas e cultos com relatórios detalhados
              </p>
            </div>
            
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Meditações e Versículos</h3>
              <p className="text-xs text-muted-foreground">
                Acompanhamento espiritual semanal
              </p>
            </div>
            
            <div className="text-center p-4 bg-background rounded-lg shadow-sm">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Comunicação WhatsApp</h3>
              <p className="text-xs text-muted-foreground">
                Mensagens diretas aos responsáveis
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}