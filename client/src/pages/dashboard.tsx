import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AttendanceModal from "@/components/attendance-modal";
import MessageModal from "@/components/message-modal";
import { 
  Users, 
  Church, 
  Heart, 
  BookOpen, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  UserMinus,
  Trophy,
  Download,
  Send
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedClass, setSelectedClass] = useState("");
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
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
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas do dashboard",
        variant: "destructive",
      });
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["/api/classes"],
    enabled: isAuthenticated,
  });

  const { data: messageTemplates } = useQuery({
    queryKey: ["/api/message-templates"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const quickMessageTemplates = messageTemplates?.slice(0, 4) || [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          title="Dashboard"
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Alert Cards */}
          <div className="mb-6 space-y-3">
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="text-warning mr-3 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    2 crianças com faltas consecutivas detectadas
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    João Silva (3 faltas) • Maria Santos (2 faltas)
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-4 bg-warning text-warning-foreground hover:bg-warning/80"
                >
                  Ver detalhes
                </Button>
              </div>
            </div>
            
            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="text-secondary mr-3 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    5 meditações pendentes para esta semana
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lembrete automático será enviado na quarta-feira às 18:00
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-4 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  Enviar agora
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Presença Aula
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stats?.classAttendancePercentage || 87}%
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-success mr-1" />
                      <p className="text-xs text-success">+5% esta semana</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Presença Culto
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stats?.worshipAttendancePercentage || 72}%
                    </p>
                    <div className="flex items-center mt-1">
                      <TrendingDown className="h-3 w-3 text-error mr-1" />
                      <p className="text-xs text-error">-3% esta semana</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Church className="text-secondary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Meditações
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stats?.meditationsDelivered || 23}/{stats?.totalMeditations || 35}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      entregues esta semana
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Heart className="text-warning h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Versículos
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {stats?.versesMemorized || 18}/{stats?.totalVerses || 35}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      memorizados
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-error h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Quick Class Attendance */}
            <Card className="bg-surface border-border">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Chamada Rápida - Aula
                  </CardTitle>
                  <Button variant="link" className="text-primary p-0">
                    Ver todas →
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Domingo, {new Date().toLocaleDateString('pt-BR')}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {classes?.slice(0, 3).map((classItem: any, index: number) => (
                    <div key={classItem.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 ${
                          index === 0 ? 'bg-primary' : 
                          index === 1 ? 'bg-secondary' : 'bg-warning'
                        } rounded-lg flex items-center justify-center mr-3`}>
                          <Users className="text-white h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{classItem.name}</p>
                          <p className="text-xs text-muted-foreground">12 crianças</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => setShowAttendanceModal(true)}
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/80"
                      >
                        Fazer Chamada
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Messages */}
            <Card className="bg-surface border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Mensagens Rápidas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Modelos mais utilizados
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-3">
                  {quickMessageTemplates.map((template: any, index: number) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      onClick={() => setShowMessageModal(true)}
                      className="flex items-center p-3 bg-accent hover:bg-accent/80 justify-start h-auto"
                    >
                      <div className={`w-10 h-10 ${
                        index === 0 ? 'bg-error/10' :
                        index === 1 ? 'bg-warning/10' :
                        index === 2 ? 'bg-success/10' : 'bg-primary/10'
                      } rounded-lg flex items-center justify-center mr-3`}>
                        {index === 0 && <UserMinus className="text-error h-4 w-4" />}
                        {index === 1 && <Clock className="text-warning h-4 w-4" />}
                        {index === 2 && <Trophy className="text-success h-4 w-4" />}
                        {index === 3 && <Heart className="text-primary h-4 w-4" />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground text-sm">
                          {template.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {template.category}
                        </p>
                      </div>
                      <ChevronRight className="text-muted-foreground h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Current Week */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2 bg-surface border-border">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Atividade Recente
                  </CardTitle>
                  <Button variant="link" className="text-primary p-0">
                    Ver todas →
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Trophy className="text-success h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Ana Silva</span> entregou a meditação da semana
                      </p>
                      <p className="text-xs text-muted-foreground">Há 5 minutos • Turma Kids</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserMinus className="text-warning h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">João Santos</span> faltou na aula
                      </p>
                      <p className="text-xs text-muted-foreground">Há 1 hora • Turma Infantil</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <BookOpen className="text-primary h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">Maria Oliveira</span> memorizou Salmos 119:105
                      </p>
                      <p className="text-xs text-muted-foreground">Há 2 horas • Turma Juniores</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* This Week Summary */}
            <Card className="bg-surface border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Esta Semana
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Resumo de atividades
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                      <Users className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">32/35</p>
                      <p className="text-xs text-muted-foreground">Presença aula</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-success">91%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mr-3">
                      <Church className="text-secondary h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">25/35</p>
                      <p className="text-xs text-muted-foreground">Presença culto</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-warning">71%</Badge>
                </div>

                <div className="pt-4 space-y-2">
                  <Button className="w-full" variant="default">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Relatório
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Resumo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AttendanceModal 
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
      />
      <MessageModal 
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
      />
    </div>
  );
}
