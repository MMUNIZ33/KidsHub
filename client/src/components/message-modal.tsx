import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { fillMessageTemplate, generateWhatsAppLink } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string;
  childId?: string;
}

export default function MessageModal({ isOpen, onClose, templateId, childId }: MessageModalProps) {
  const [selectedChild, setSelectedChild] = useState(childId || "");
  const [selectedGuardian, setSelectedGuardian] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(templateId || "");
  const [messagePreview, setMessagePreview] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: children } = useQuery({
    queryKey: ["/api/children"],
    enabled: isOpen,
  });

  const { data: guardians } = useQuery({
    queryKey: ["/api/guardians/child", selectedChild],
    enabled: isOpen && !!selectedChild,
  });

  const { data: templates } = useQuery({
    queryKey: ["/api/message-templates"],
    enabled: isOpen,
  });

  const { data: currentTemplate } = useQuery({
    queryKey: ["/api/message-templates", selectedTemplate],
    enabled: isOpen && !!selectedTemplate,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ childId, guardianId, templateId, message }: any) => {
      await apiRequest("POST", "/api/messages/send", {
        childId,
        guardianId,
        templateId,
        message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Mensagem registrada no histórico",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/history"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao registrar o envio da mensagem",
        variant: "destructive",
      });
    },
  });

  // Update message preview when data changes
  useEffect(() => {
    if (currentTemplate && selectedChild && selectedGuardian) {
      const child = children?.find((c: any) => c.id === selectedChild);
      const guardian = guardians?.find((g: any) => g.id === selectedGuardian);
      
      if (child && guardian) {
        const variables = {
          responsavel: guardian.fullName,
          crianca: child.fullName,
          turma: "Turma Kids", // This should come from child's class
          data: new Date().toLocaleDateString('pt-BR'),
        };
        
        const filledMessage = fillMessageTemplate(currentTemplate.bodyTemplate, variables);
        setMessagePreview(filledMessage);
      }
    }
  }, [currentTemplate, selectedChild, selectedGuardian, children, guardians]);

  const handleSendWhatsApp = () => {
    if (!selectedGuardian || !messagePreview) return;
    
    const guardian = guardians?.find((g: any) => g.id === selectedGuardian);
    if (!guardian) return;

    // Generate WhatsApp link
    const whatsappUrl = generateWhatsAppLink(guardian.phoneWhatsApp, messagePreview);
    
    // Log the message send
    sendMessageMutation.mutate({
      childId: selectedChild,
      guardianId: selectedGuardian,
      templateId: selectedTemplate,
      message: messagePreview,
    });

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Enviar Mensagem - {currentTemplate?.title || 'Selecione um modelo'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Modelo de Mensagem
            </label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um modelo" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template: any) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Criança
            </label>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma criança" />
              </SelectTrigger>
              <SelectContent>
                {children?.map((child: any) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Responsável
            </label>
            <Select value={selectedGuardian} onValueChange={setSelectedGuardian}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {guardians?.map((guardian: any) => (
                  <SelectItem key={guardian.id} value={guardian.id}>
                    {guardian.fullName} ({guardian.relationship}) - {guardian.phoneWhatsApp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {messagePreview && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Pré-visualização da Mensagem
              </label>
              <div className="bg-accent border border-border rounded-lg p-4">
                <p className="text-foreground text-sm whitespace-pre-wrap">
                  {messagePreview}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSendWhatsApp}
            disabled={!selectedGuardian || !messagePreview || sendMessageMutation.isPending}
            className="bg-success text-white hover:bg-success/80"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Abrir no WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
