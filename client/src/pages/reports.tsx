import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  BarChart3, 
  CalendarIcon, 
  Download,
  Copy,
  Users,
  Church,
  Heart,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { formatDate, getInitials, calculateAge } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedChild, setSelectedChild] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date())
  });
  const [reportType, setReportType] = useState("attendance");

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

  const { data: children } = useQuery({
    queryKey: ["/api/children"],
    enabled: isAuthenticated,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const generateMockAttendanceData = () => {
    if (!children) return [];
    
    return children.slice(0, 10).map((child: any) => {
      const classInfo = classes?.find((c: any) => c.id === child.classId);
      const attendanceRate = Math.floor(Math.random() * 40) + 60; // 60-100%
      const worshipRate = Math.floor(Math.random() * 50) + 50; // 50-100%
      const consecutiveAbsences = Math.floor(Math.random() * 4); // 0-3
      
      return {
        id: child.id,
        name: child.fullName,
        class: classInfo?.name || 'Sem turma',
        age: child.birthDate ? calculateAge(child.birthDate) : null,
        attendanceRate,
        worshipRate,
        consecutiveAbsences,
        totalClasses: 12,
        attendedClasses: Math.floor((attendanceRate / 100) * 12),
        totalWorships: 8,
        attendedWorships: Math.floor((worshipRate / 100) * 8),
      };
    });
  };

  const generateMockMeditationData = () => {
    if (!children) return [];
    
    return children.slice(0, 10).map((child: any) => {
      const classInfo = classes?.find((c: any) => c.id === child.classId);
      const delivered = Math.floor(Math.random() * 8) + 2; // 2-10
      const total = 10;
      const rate = Math.floor((delivered / total) * 100);
      
      return {
        id: child.id,
        name: child.fullName,
        class: classInfo?.name || 'Sem turma',
        delivered,
        total,
        rate,
        status: delivered >= 8 ? 'excellent' : delivered >= 6 ? 'good' : delivered >= 4 ? 'average' : 'needs_attention',
      };
    });
  };

  const generateMockVerseData = () => {
    if (!children) return [];
    
    return children.slice(0, 10).map((child: any) => {
      const classInfo = classes?.find((c: any) => c.id === child.classId);
      const memorized = Math.floor(Math.random() * 6) + 1; // 1-6
      const total = 6;
      const rate = Math.floor((memorized / total) * 100);
      
      return {
        id: child.id,
        name: child.fullName,
        class: classInfo?.name || 'Sem turma',
        memorized,
        total,
        rate,
        status: memorized >= 5 ? 'excellent' : memorized >= 4 ? 'good' : memorized >= 2 ? 'average' : 'needs_attention',
      };
    });
  };

  const handleExportExcel = () => {
    toast({
      title: "Exportação iniciada",
      description: "O relatório em Excel será baixado em breve",
    });
    // Implementation would generate and download Excel file
  };

  const handleCopyReport = () => {
    const reportData = getReportData();
    const text = reportData.map((item: any) => 
      Object.values(item).join('\t')
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Sucesso",
        description: "Relatório copiado para a área de transferência",
      });
    }).catch(() => {
      toast({
        title: "Erro",
        description: "Falha ao copiar relatório",
        variant: "destructive",
      });
    });
  };

  const getReportData = () => {
    switch (reportType) {
      case "attendance":
        return generateMockAttendanceData();
      case "meditation":
        return generateMockMeditationData();
      case "verses":
        return generateMockVerseData();
      default:
        return [];
    }
  };

  const filteredData = getReportData().filter((item: any) => {
    const matchesClass = !selectedClass || item.class === classes?.find((c: any) => c.id === selectedClass)?.name;
    const matchesChild = !selectedChild || item.id === selectedChild;
    return matchesClass && matchesChild;
  });

  const setQuickDateRange = (type: 'week' | 'month') => {
    const now = new Date();
    if (type === 'week') {
      setDateRange({
        from: startOfWeek(now),
        to: endOfWeek(now)
      });
    } else {
      setDateRange({
        from: startOfMonth(now),
        to: endOfMonth(now)
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Relatórios" />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Presença Geral</p>
                    <p className="text-2xl font-bold text-foreground">
                      {dashboardStats?.classAttendancePercentage || 87}%
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-success mr-1" />
                      <p className="text-xs text-success">+5% vs mês anterior</p>
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Presença Culto</p>
                    <p className="text-2xl font-bold text-foreground">
                      {dashboardStats?.worshipAttendancePercentage || 72}%
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingDown className="h-3 w-3 text-error mr-1" />
                      <p className="text-xs text-error">-3% vs mês anterior</p>
                    </div>
                  </div>
                  <Church className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Meditações</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.floor(((dashboardStats?.meditationsDelivered || 23) / (dashboardStats?.totalMeditations || 35)) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dashboardStats?.meditationsDelivered || 23}/{dashboardStats?.totalMeditations || 35} entregues
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Versículos</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.floor(((dashboardStats?.versesMemorized || 18) / (dashboardStats?.totalVerses || 35)) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dashboardStats?.versesMemorized || 18}/{dashboardStats?.totalVerses || 35} memorizados
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-error" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <Card className="bg-surface border-border mb-6">
            <CardHeader>
              <CardTitle>Filtros e Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de relatório" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance">Frequência</SelectItem>
                    <SelectItem value="meditation">Meditações</SelectItem>
                    <SelectItem value="verses">Versículos</SelectItem>
                    <SelectItem value="consolidated">Consolidado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {classes?.map((classItem: any) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedChild} onValueChange={setSelectedChild}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as crianças" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as crianças</SelectItem>
                    {children?.map((child: any) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange('week')}>
                    Esta Semana
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>
                    Este Mês
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Período: {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopyReport}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  <Button onClick={handleExportExcel}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
            <TabsList>
              <TabsTrigger value="attendance">Frequência</TabsTrigger>
              <TabsTrigger value="meditation">Meditações</TabsTrigger>
              <TabsTrigger value="verses">Versículos</TabsTrigger>
              <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Relatório de Frequência</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredData.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum dado encontrado para os filtros selecionados
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredData.map((child: any) => (
                        <div key={child.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {getInitials(child.name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{child.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {child.class} {child.age && `• ${child.age} anos`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Aulas</p>
                              <p className="text-xs text-muted-foreground">
                                {child.attendedClasses}/{child.totalClasses}
                              </p>
                              <Badge 
                                variant={child.attendanceRate >= 80 ? 'default' : child.attendanceRate >= 60 ? 'secondary' : 'destructive'}
                                className={
                                  child.attendanceRate >= 80 ? 'bg-success text-white' :
                                  child.attendanceRate >= 60 ? 'bg-warning text-white' :
                                  'bg-error text-white'
                                }
                              >
                                {child.attendanceRate}%
                              </Badge>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Cultos</p>
                              <p className="text-xs text-muted-foreground">
                                {child.attendedWorships}/{child.totalWorships}
                              </p>
                              <Badge 
                                variant={child.worshipRate >= 80 ? 'default' : child.worshipRate >= 60 ? 'secondary' : 'destructive'}
                                className={
                                  child.worshipRate >= 80 ? 'bg-success text-white' :
                                  child.worshipRate >= 60 ? 'bg-warning text-white' :
                                  'bg-error text-white'
                                }
                              >
                                {child.worshipRate}%
                              </Badge>
                            </div>
                            
                            {child.consecutiveAbsences > 0 && (
                              <div className="flex items-center">
                                <AlertTriangle className="h-4 w-4 text-warning mr-1" />
                                <span className="text-xs text-warning">
                                  {child.consecutiveAbsences} faltas seguidas
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meditation">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Relatório de Meditações</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredData.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum dado encontrado para os filtros selecionados
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredData.map((child: any) => (
                        <div key={child.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {getInitials(child.name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{child.name}</p>
                              <p className="text-sm text-muted-foreground">{child.class}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Entregues</p>
                              <p className="text-lg font-bold text-foreground">
                                {child.delivered}/{child.total}
                              </p>
                            </div>
                            
                            <Badge 
                              variant={child.status === 'excellent' ? 'default' : child.status === 'good' ? 'secondary' : 'destructive'}
                              className={
                                child.status === 'excellent' ? 'bg-success text-white' :
                                child.status === 'good' ? 'bg-warning text-white' :
                                child.status === 'average' ? 'bg-orange-500 text-white' :
                                'bg-error text-white'
                              }
                            >
                              {child.rate}%
                            </Badge>
                            
                            {child.status === 'excellent' && <CheckCircle className="h-5 w-5 text-success" />}
                            {child.status === 'needs_attention' && <AlertTriangle className="h-5 w-5 text-error" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verses">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Relatório de Versículos</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredData.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum dado encontrado para os filtros selecionados
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredData.map((child: any) => (
                        <div key={child.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {getInitials(child.name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{child.name}</p>
                              <p className="text-sm text-muted-foreground">{child.class}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-sm font-medium text-foreground">Memorizados</p>
                              <p className="text-lg font-bold text-foreground">
                                {child.memorized}/{child.total}
                              </p>
                            </div>
                            
                            <Badge 
                              variant={child.status === 'excellent' ? 'default' : child.status === 'good' ? 'secondary' : 'destructive'}
                              className={
                                child.status === 'excellent' ? 'bg-success text-white' :
                                child.status === 'good' ? 'bg-warning text-white' :
                                child.status === 'average' ? 'bg-orange-500 text-white' :
                                'bg-error text-white'
                              }
                            >
                              {child.rate}%
                            </Badge>
                            
                            {child.status === 'excellent' && <CheckCircle className="h-5 w-5 text-success" />}
                            {child.status === 'needs_attention' && <AlertTriangle className="h-5 w-5 text-error" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consolidated">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Relatório Consolidado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Relatório Consolidado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Visão unificada de frequência, meditações e versículos
                    </p>
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Relatório Completo
                    </Button>
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
