import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  Settings as SettingsIcon, 
  Users, 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  BookOpen,
  Heart,
  Database,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import { getInitials, formatDateTime, getCurrentWeekReference } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const userSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "leader", "assistant"]),
  classIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

const meditationWeekSchema = z.object({
  weekReference: z.string().min(1, "Referência da semana é obrigatória"),
  theme: z.string().min(1, "Tema é obrigatório"),
  materialLink: z.string().url("Link inválido").optional().or(z.literal("")),
  allowsAttachments: z.boolean().default(true),
});

const bibleVerseSchema = z.object({
  reference: z.string().min(1, "Referência é obrigatória"),
  text: z.string().min(1, "Texto é obrigatório"),
  weekReference: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;
type MeditationWeekFormData = z.infer<typeof meditationWeekSchema>;
type BibleVerseFormData = z.infer<typeof bibleVerseSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [showUserForm, setShowUserForm] = useState(false);
  const [showMeditationForm, setShowMeditationForm] = useState(false);
  const [showVerseForm, setShowVerseForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingMeditation, setEditingMeditation] = useState<any>(null);
  const [editingVerse, setEditingVerse] = useState<any>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você não está logado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: meditationWeeks } = useQuery({
    queryKey: ["/api/meditations/weeks"],
    enabled: isAuthenticated,
  });

  const { data: verses } = useQuery({
    queryKey: ["/api/verses"],
    enabled: isAuthenticated,
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "assistant",
      classIds: [],
      isActive: true,
    },
  });

  const meditationForm = useForm<MeditationWeekFormData>({
    resolver: zodResolver(meditationWeekSchema),
    defaultValues: {
      weekReference: getCurrentWeekReference(),
      theme: "",
      materialLink: "",
      allowsAttachments: true,
    },
  });

  const verseForm = useForm<BibleVerseFormData>({
    resolver: zodResolver(bibleVerseSchema),
    defaultValues: {
      reference: "",
      text: "",
      weekReference: getCurrentWeekReference(),
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // This would be implemented on the backend
      await apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });
      setShowUserForm(false);
      userForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar usuário",
        variant: "destructive",
      });
    },
  });

  const createMeditationWeekMutation = useMutation({
    mutationFn: async (data: MeditationWeekFormData) => {
      await apiRequest("POST", "/api/meditations/weeks", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Semana de meditação criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meditations/weeks"] });
      setShowMeditationForm(false);
      meditationForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar semana de meditação",
        variant: "destructive",
      });
    },
  });

  const createVerseMutation = useMutation({
    mutationFn: async (data: BibleVerseFormData) => {
      await apiRequest("POST", "/api/verses", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Versículo criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/verses"] });
      setShowVerseForm(false);
      verseForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar versículo",
        variant: "destructive",
      });
    },
  });

  const handleBackup = () => {
    toast({
      title: "Backup iniciado",
      description: "O backup dos dados será baixado em breve",
    });
    // Implementation would generate and download backup file
  };

  const handleRestore = () => {
    toast({
      title: "Restauração",
      description: "Funcionalidade de restauração em desenvolvimento",
    });
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Configurações" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">Geral</TabsTrigger>
              {isAdmin && <TabsTrigger value="users">Usuários</TabsTrigger>}
              <TabsTrigger value="meditations">Meditações</TabsTrigger>
              <TabsTrigger value="verses">Versículos</TabsTrigger>
              <TabsTrigger value="data">Dados</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Notificações por Email</h4>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações de faltas consecutivas e lembretes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Modo Escuro</h4>
                      <p className="text-sm text-muted-foreground">
                        Interface com tema escuro
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Lembretes Automáticos</h4>
                      <p className="text-sm text-muted-foreground">
                        Enviar lembretes de meditação às quartas-feiras às 18:00
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Informações do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Versão:</p>
                      <p className="font-medium">1.0.0</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Último backup:</p>
                      <p className="font-medium">Nunca</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fuso horário:</p>
                      <p className="font-medium">America/Manaus</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Usuário ativo:</p>
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="users" className="space-y-6">
                <Card className="bg-surface border-border">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Gerenciamento de Usuários</CardTitle>
                    <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Novo Usuário
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Novo Usuário</DialogTitle>
                        </DialogHeader>
                        <Form {...userForm}>
                          <form onSubmit={userForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={userForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={userForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Sobrenome</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={userForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={userForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Função</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="admin">Administrador</SelectItem>
                                      <SelectItem value="leader">Líder</SelectItem>
                                      <SelectItem value="assistant">Auxiliar</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setShowUserForm(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit" disabled={createUserMutation.isPending}>
                                {createUserMutation.isPending ? "Criando..." : "Criar"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Gerenciamento de usuários em desenvolvimento
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="meditations" className="space-y-6">
              <Card className="bg-surface border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Semanas de Meditação</CardTitle>
                  <Dialog open={showMeditationForm} onOpenChange={setShowMeditationForm}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Semana
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Nova Semana de Meditação</DialogTitle>
                      </DialogHeader>
                      <Form {...meditationForm}>
                        <form onSubmit={meditationForm.handleSubmit((data) => createMeditationWeekMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={meditationForm.control}
                            name="weekReference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Referência da Semana</FormLabel>
                                <FormControl>
                                  <Input placeholder="2024-W01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={meditationForm.control}
                            name="theme"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tema</FormLabel>
                                <FormControl>
                                  <Input placeholder="Tema da semana" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={meditationForm.control}
                            name="materialLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link do Material (Opcional)</FormLabel>
                                <FormControl>
                                  <Input type="url" placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={meditationForm.control}
                            name="allowsAttachments"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Permitir Anexos</FormLabel>
                                  <p className="text-xs text-muted-foreground">
                                    Crianças podem enviar fotos/evidências
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowMeditationForm(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={createMeditationWeekMutation.isPending}>
                              {createMeditationWeekMutation.isPending ? "Criando..." : "Criar"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {!meditationWeeks || meditationWeeks.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma semana de meditação configurada
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {meditationWeeks.map((week: any) => (
                        <div key={week.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{week.theme}</p>
                            <p className="text-sm text-muted-foreground">
                              {week.weekReference}
                              {week.materialLink && " • Link disponível"}
                              {week.allowsAttachments && " • Anexos permitidos"}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verses" className="space-y-6">
              <Card className="bg-surface border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Versículos Bíblicos</CardTitle>
                  <Dialog open={showVerseForm} onOpenChange={setShowVerseForm}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Versículo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Novo Versículo</DialogTitle>
                      </DialogHeader>
                      <Form {...verseForm}>
                        <form onSubmit={verseForm.handleSubmit((data) => createVerseMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={verseForm.control}
                            name="reference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Referência</FormLabel>
                                <FormControl>
                                  <Input placeholder="Sl 119:105" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={verseForm.control}
                            name="text"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Texto</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Lâmpada para os meus pés é tua palavra..."
                                    className="min-h-24"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={verseForm.control}
                            name="weekReference"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Referência da Semana (Opcional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="2024-W01" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowVerseForm(false)}>
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={createVerseMutation.isPending}>
                              {createVerseMutation.isPending ? "Criando..." : "Criar"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {!verses || verses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum versículo configurado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {verses.map((verse: any) => (
                        <div key={verse.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{verse.reference}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {verse.text}
                            </p>
                            {verse.weekReference && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {verse.weekReference}
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Backup e Restauração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Backup dos Dados</h4>
                      <p className="text-sm text-muted-foreground">
                        Fazer backup completo de todas as informações
                      </p>
                    </div>
                    <Button onClick={handleBackup}>
                      <Download className="mr-2 h-4 w-4" />
                      Fazer Backup
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Restaurar Dados</h4>
                      <p className="text-sm text-muted-foreground">
                        Restaurar dados de um arquivo de backup
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleRestore}>
                      <Upload className="mr-2 h-4 w-4" />
                      Restaurar
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Atualizar Cache</h4>
                      <p className="text-sm text-muted-foreground">
                        Limpar cache e recarregar dados do sistema
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Atualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Estatísticas do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-accent rounded-lg">
                      <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-foreground">
                        {children?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Crianças</p>
                    </div>
                    
                    <div className="p-4 bg-accent rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-secondary" />
                      <p className="text-2xl font-bold text-foreground">
                        {classes?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Turmas</p>
                    </div>
                    
                    <div className="p-4 bg-accent rounded-lg">
                      <Heart className="h-8 w-8 mx-auto mb-2 text-warning" />
                      <p className="text-2xl font-bold text-foreground">
                        {meditationWeeks?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Meditações</p>
                    </div>
                    
                    <div className="p-4 bg-accent rounded-lg">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-error" />
                      <p className="text-2xl font-bold text-foreground">
                        {verses?.length || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Versículos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
