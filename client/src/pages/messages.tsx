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
import { Textarea } from "@/components/ui/textarea";
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
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MessageModal from "@/components/message-modal";
import { 
  MessageCircle, 
  Search, 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  Users,
  Filter,
  Download
} from "lucide-react";
import { getInitials, formatDateTime, generateWhatsAppLink, fillMessageTemplate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMessageTemplateSchema, type MessageTemplate, type InsertMessageTemplate } from "@shared/schema";

const categoryOptions = [
  { value: "falta", label: "Falta", color: "bg-red-500" },
  { value: "meditacao", label: "Meditação", color: "bg-purple-500" },
  { value: "culto", label: "Culto", color: "bg-blue-500" },
  { value: "incentivo", label: "Incentivo", color: "bg-green-500" },
  { value: "boas_vindas", label: "Boas-vindas", color: "bg-yellow-500" },
  { value: "pastoral", label: "Pastoral", color: "bg-orange-500" },
  { value: "aviso", label: "Aviso", color: "bg-gray-500" },
];

export default function Messages() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

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

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/message-templates"],
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

  const { data: messageHistory } = useQuery({
    queryKey: ["/api/messages/history"],
    enabled: isAuthenticated,
  });

  const { data: children } = useQuery({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  const form = useForm<InsertMessageTemplate>({
    resolver: zodResolver(insertMessageTemplateSchema),
    defaultValues: {
      title: "",
      bodyTemplate: "",
      supportedVariables: [],
      isActive: true,
      category: "falta",
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertMessageTemplate) => {
      if (editingTemplate) {
        await apiRequest("PUT", `/api/message-templates/${editingTemplate.id}`, data);
      } else {
        await apiRequest("POST", "/api/message-templates", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: editingTemplate ? "Modelo atualizado com sucesso" : "Modelo criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      setShowTemplateForm(false);
      setEditingTemplate(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar modelo",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest("DELETE", `/api/message-templates/${templateId}`);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Modelo removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover modelo",
        variant: "destructive",
      });
    },
  });

  const filteredTemplates = templates?.filter((template: MessageTemplate) => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.bodyTemplate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryInfo = (category: string) => {
    return categoryOptions.find(option => option.value === category);
  };

  const getChildInfo = (childId: string) => {
    return children?.find((c: any) => c.id === childId);
  };

  const getTemplateStats = () => {
    if (!messageHistory) return { total: 0, today: 0, thisWeek: 0 };
    
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const total = messageHistory.length;
    const today_count = messageHistory.filter((msg: any) => 
      new Date(msg.sentAt) >= todayStart
    ).length;
    const thisWeek = messageHistory.filter((msg: any) => 
      new Date(msg.sentAt) >= weekAgo
    ).length;
    
    return { total, today: today_count, thisWeek };
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    form.reset({
      title: template.title,
      bodyTemplate: template.bodyTemplate,
      supportedVariables: template.supportedVariables || [],
      isActive: template.isActive,
      category: template.category,
    });
    setShowTemplateForm(true);
  };

  const handleDelete = (templateId: string) => {
    if (window.confirm('Tem certeza que deseja remover este modelo?')) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    setShowMessageModal(true);
  };

  const onSubmit = (data: InsertMessageTemplate) => {
    createTemplateMutation.mutate(data);
  };

  const handleFormClose = () => {
    setShowTemplateForm(false);
    setEditingTemplate(null);
    form.reset();
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const stats = getTemplateStats();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Mensagens" />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Modelos Ativos</p>
                    <p className="text-2xl font-bold text-foreground">
                      {templates?.filter((t: any) => t.isActive).length || 0}
                    </p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enviadas Hoje</p>
                    <p className="text-2xl font-bold text-foreground">{stats.today}</p>
                  </div>
                  <Send className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
                    <p className="text-2xl font-bold text-foreground">{stats.thisWeek}</p>
                  </div>
                  <Clock className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList>
              <TabsTrigger value="templates" className="flex items-center">
                <MessageCircle className="mr-2 h-4 w-4" />
                Modelos de Mensagem
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Histórico de Envios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="space-y-6">
              {/* Filters and Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar modelos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-80"
                    />
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Modelo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTemplate ? 'Editar Modelo' : 'Novo Modelo'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do modelo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categoryOptions.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
                                      {category.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bodyTemplate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modelo da Mensagem</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Use variáveis como {responsavel}, {crianca}, {turma}, {data}"
                                  className="min-h-32"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="text-sm text-muted-foreground">
                          <p className="mb-2">Variáveis disponíveis:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <code className="bg-accent px-2 py-1 rounded">{"{responsavel}"}</code>
                            <code className="bg-accent px-2 py-1 rounded">{"{crianca}"}</code>
                            <code className="bg-accent px-2 py-1 rounded">{"{turma}"}</code>
                            <code className="bg-accent px-2 py-1 rounded">{"{data}"}</code>
                            <code className="bg-accent px-2 py-1 rounded">{"{linkMeditacao}"}</code>
                            <code className="bg-accent px-2 py-1 rounded">{"{versiculoRef}"}</code>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button type="button" variant="outline" onClick={handleFormClose}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={createTemplateMutation.isPending}>
                            {createTemplateMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Templates Grid */}
              {templatesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="bg-surface border-border animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded w-full"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !filteredTemplates || filteredTemplates.length === 0 ? (
                <Card className="bg-surface border-border">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Nenhum modelo encontrado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || categoryFilter !== "all"
                        ? "Tente ajustar os filtros"
                        : "Comece criando o primeiro modelo de mensagem"
                      }
                    </p>
                    <Button onClick={() => setShowTemplateForm(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Modelo
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template: MessageTemplate) => {
                    const categoryInfo = getCategoryInfo(template.category);
                    
                    return (
                      <Card key={template.id} className="bg-surface border-border hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                              {template.title}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              {categoryInfo && (
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${categoryInfo.color} text-white`}
                                >
                                  {categoryInfo.label}
                                </Badge>
                              )}
                              {!template.isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Inativo
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUseTemplate(template.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Usar Modelo
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(template)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(template.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardHeader>
                        
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                            {template.bodyTemplate}
                          </p>
                          
                          <div className="flex justify-between items-center">
                            <Button 
                              size="sm" 
                              onClick={() => handleUseTemplate(template.id)}
                              className="w-full"
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Usar Modelo
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Histórico de Mensagens</span>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!messageHistory || messageHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma mensagem enviada ainda
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messageHistory.map((message: any) => {
                        const child = getChildInfo(message.childId);
                        
                        return (
                          <div key={message.id} className="flex items-start space-x-3 p-4 bg-accent rounded-lg">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-sm">
                                {child ? getInitials(child.fullName) : 'C'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">
                                  Para: {child?.fullName || 'Criança não encontrada'}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(message.sentAt)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                Canal: {message.channel}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {message.generatedMessage}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Message Modal */}
      <MessageModal 
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        templateId={selectedTemplate}
      />
    </div>
  );
}
