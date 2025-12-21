import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  QrCode, 
  Download, 
  LayoutDashboard, 
  Building2, 
  History, 
  LogOut,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { generateQRCodeDataURL } from '@/lib/qr-generator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { COLINAS_LOTES, Lote } from '@/types/lote';

interface EtapaQR {
  etapa: number;
  qrDataUrl: string;
  url: string;
}

interface CustomQR {
  nombre: string;
  latitud: number;
  longitud: number;
  etapa: number;
  qrDataUrl: string;
}

const AdminQRCodesEtapas = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<EtapaQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<CustomQR | null>(null);
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [etapaSeleccionada, setEtapaSeleccionada] = useState('1');
  const [generatingCustom, setGeneratingCustom] = useState(false);

  const etapas = [1, 2, 3];
  const propertyName = 'Colinas de Juanito Laguna';

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const codes: EtapaQR[] = [];

      for (const etapa of etapas) {
        const url = `${baseUrl}/lote-finder/${etapa}?property=${encodeURIComponent(propertyName)}`;
        const qrDataUrl = await generateQRCodeDataURL(url);
        codes.push({ etapa, qrDataUrl, url });
      }

      setQrCodes(codes);
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron generar los códigos QR',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCustomQR = async () => {
    if (!nombre.trim() || !latitud.trim() || !longitud.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor complete todos los campos',
        variant: 'destructive',
      });
      return;
    }

    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: 'Error',
        description: 'Las coordenadas deben ser números válidos',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingCustom(true);
    try {
      const baseUrl = window.location.origin;
      // URL que lleva al buscador de lotes con los datos pre-cargados
      const url = `${baseUrl}/lote-finder/${etapaSeleccionada}?property=${encodeURIComponent(nombre)}&lat=${lat}&lng=${lng}`;
      const qrDataUrl = await generateQRCodeDataURL(url);
      
      setGeneratedQR({
        nombre,
        latitud: lat,
        longitud: lng,
        etapa: parseInt(etapaSeleccionada),
        qrDataUrl,
      });

      toast({
        title: 'QR Generado',
        description: `Código QR para ${nombre} - Etapa ${etapaSeleccionada} generado exitosamente`,
      });
    } catch (error) {
      console.error('Error generating custom QR:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el código QR',
        variant: 'destructive',
      });
    } finally {
      setGeneratingCustom(false);
    }
  };

  const downloadCustomPNG = () => {
    if (!generatedQR) return;
    const link = document.createElement('a');
    link.download = `QR-${generatedQR.nombre}-Etapa-${generatedQR.etapa}.png`;
    link.href = generatedQR.qrDataUrl;
    link.click();
  };

  const downloadCustomPDF = async () => {
    if (!generatedQR) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(generatedQR.nombre, pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.text(`Etapa ${generatedQR.etapa}`, pageWidth / 2, 42, { align: 'center' });

    const qrSize = 100;
    const qrX = (pageWidth - qrSize) / 2;
    pdf.addImage(generatedQR.qrDataUrl, 'PNG', qrX, 55, qrSize, qrSize);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Coordenadas: ${generatedQR.latitud}, ${generatedQR.longitud}`, pageWidth / 2, 165, { align: 'center' });

    pdf.setFontSize(12);
    pdf.text('Escanee el código QR', pageWidth / 2, 180, { align: 'center' });
    pdf.text('Ingrese su número de lote/casa', pageWidth / 2, 190, { align: 'center' });
    pdf.text('Obtenga la ruta en Google Maps', pageWidth / 2, 200, { align: 'center' });

    pdf.save(`QR-${generatedQR.nombre}-Etapa-${generatedQR.etapa}.pdf`);
  };

  const resetForm = () => {
    setNombre('');
    setLatitud('');
    setLongitud('');
    setEtapaSeleccionada('1');
    setGeneratedQR(null);
  };

  const downloadPNG = (etapaQR: EtapaQR) => {
    const link = document.createElement('a');
    link.download = `QR-Colinas-Etapa-${etapaQR.etapa}.png`;
    link.href = etapaQR.qrDataUrl;
    link.click();
    
    toast({
      title: 'Descargado',
      description: `QR Etapa ${etapaQR.etapa} descargado como PNG`,
    });
  };

  const downloadPDF = async (etapaQR: EtapaQR) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(propertyName, pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.text(`Etapa ${etapaQR.etapa}`, pageWidth / 2, 42, { align: 'center' });

    const qrSize = 100;
    const qrX = (pageWidth - qrSize) / 2;
    pdf.addImage(etapaQR.qrDataUrl, 'PNG', qrX, 55, qrSize, qrSize);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Escanee el código QR', pageWidth / 2, 170, { align: 'center' });
    pdf.text('Ingrese su número de lote', pageWidth / 2, 180, { align: 'center' });
    pdf.text('Obtenga la ruta en Google Maps', pageWidth / 2, 190, { align: 'center' });

    pdf.save(`QR-Colinas-Etapa-${etapaQR.etapa}.pdf`);
    
    toast({
      title: 'Descargado',
      description: `QR Etapa ${etapaQR.etapa} descargado como PDF`,
    });
  };

  const downloadAllPDF = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();

    for (let i = 0; i < qrCodes.length; i++) {
      if (i > 0) pdf.addPage();

      const etapaQR = qrCodes[i];

      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(propertyName, pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(18);
      pdf.text(`Etapa ${etapaQR.etapa}`, pageWidth / 2, 42, { align: 'center' });

      const qrSize = 100;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(etapaQR.qrDataUrl, 'PNG', qrX, 55, qrSize, qrSize);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Escanee el código QR', pageWidth / 2, 170, { align: 'center' });
      pdf.text('Ingrese su número de lote', pageWidth / 2, 180, { align: 'center' });
      pdf.text('Obtenga la ruta en Google Maps', pageWidth / 2, 190, { align: 'center' });
    }

    pdf.save('QR-Colinas-Todas-Etapas.pdf');
    
    toast({
      title: 'Descargado',
      description: 'Todos los QR descargados como PDF',
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Logo />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-border p-4">
          <div className="flex-1 space-y-2 mt-16">
            <Link to="/admin/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/admin/properties">
              <Button variant="ghost" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Propiedades
              </Button>
            </Link>
            <Link to="/admin/history">
              <Button variant="ghost" className="w-full justify-start">
                <History className="mr-2 h-4 w-4" />
                Historial
              </Button>
            </Link>
            <Link to="/admin/qr-codes">
              <Button variant="ghost" className="w-full justify-start">
                <QrCode className="mr-2 h-4 w-4" />
                Códigos QR
              </Button>
            </Link>
            <Button variant="secondary" className="w-full justify-start">
              <QrCode className="mr-2 h-4 w-4" />
              QR por Etapas
            </Button>
          </div>
          
          <Button variant="outline" onClick={logout} className="mt-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 mt-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Link to="/admin/qr-codes">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Códigos QR por Etapa</h1>
                <p className="text-muted-foreground">{propertyName}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6 flex-wrap">
              <Button 
                onClick={downloadAllPDF} 
                disabled={loading || qrCodes.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Todos (PDF)
              </Button>

              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <Plus className="mr-2 h-4 w-4" />
                    Generar Código QR
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Generar Código QR Personalizado</DialogTitle>
                  </DialogHeader>
                  
                  {!generatedQR ? (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre de la Unidad</Label>
                        <Input
                          id="nombre"
                          placeholder="Ej: Colinas de Juanito Laguna"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitud">Latitud</Label>
                          <Input
                            id="latitud"
                            placeholder="Ej: 6.105930"
                            value={latitud}
                            onChange={(e) => setLatitud(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitud">Longitud</Label>
                          <Input
                            id="longitud"
                            placeholder="Ej: -75.488550"
                            value={longitud}
                            onChange={(e) => setLongitud(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Etapa</Label>
                        <Select value={etapaSeleccionada} onValueChange={setEtapaSeleccionada}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar etapa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Etapa 1</SelectItem>
                            <SelectItem value="2">Etapa 2</SelectItem>
                            <SelectItem value="3">Etapa 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        onClick={handleGenerateCustomQR} 
                        className="w-full"
                        disabled={generatingCustom}
                      >
                        {generatingCustom ? (
                          <>
                            <QrCode className="mr-2 h-4 w-4 animate-pulse" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-4 w-4" />
                            Generar QR
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="text-center">
                        <h3 className="font-semibold">{generatedQR.nombre}</h3>
                        <p className="text-sm text-muted-foreground">Etapa {generatedQR.etapa}</p>
                        <p className="text-xs text-muted-foreground">
                          {generatedQR.latitud}, {generatedQR.longitud}
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 mx-auto max-w-[200px]">
                        <img 
                          src={generatedQR.qrDataUrl} 
                          alt="QR Code generado"
                          className="w-full"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={downloadCustomPNG}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          PNG
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={downloadCustomPDF}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                      </div>

                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={resetForm}
                      >
                        Generar Otro QR
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <QrCode className="w-12 h-12 mx-auto mb-4 animate-pulse text-muted-foreground" />
                <p className="text-muted-foreground">Generando códigos QR...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {qrCodes.map((etapaQR) => (
                  <div 
                    key={etapaQR.etapa}
                    className="bg-card border border-border rounded-xl p-6 text-center"
                  >
                    <h3 className="text-lg font-semibold mb-4">Etapa {etapaQR.etapa}</h3>
                    
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <img 
                        src={etapaQR.qrDataUrl} 
                        alt={`QR Etapa ${etapaQR.etapa}`}
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => downloadPNG(etapaQR)}
                      >
                        PNG
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => downloadPDF(etapaQR)}
                      >
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 flex justify-around">
        <Link to="/admin/dashboard">
          <Button variant="ghost" size="sm">
            <LayoutDashboard className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/admin/properties">
          <Button variant="ghost" size="sm">
            <Building2 className="h-5 w-5" />
          </Button>
        </Link>
        <Link to="/admin/qr-codes">
          <Button variant="secondary" size="sm">
            <QrCode className="h-5 w-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </nav>
    </div>
  );
};

export default AdminQRCodesEtapas;
