import { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminNav } from '@/components/admin/AdminNav';
import { getProperties, getLotesByPropertyId, Property, PropertyLote } from '@/lib/storage';
import { exportLotesToCSV, exportLotesToPDF } from '@/lib/export-utils';
import { useToast } from '@/hooks/use-toast';

const AdminReports = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [lotes, setLotes] = useState<PropertyLote[]>([]);
  const [selectedLoteIds, setSelectedLoteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      loadLotes(selectedPropertyId);
    } else {
      setLotes([]);
      setSelectedLoteIds(new Set());
    }
  }, [selectedPropertyId]);

  const loadProperties = async () => {
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las propiedades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLotes = async (propertyId: string) => {
    setLoadingLotes(true);
    try {
      const data = await getLotesByPropertyId(propertyId);
      setLotes(data);
      // Select all by default
      setSelectedLoteIds(new Set(data.map(l => l.id)));
    } catch (error) {
      console.error('Error loading lotes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los lotes',
        variant: 'destructive',
      });
    } finally {
      setLoadingLotes(false);
    }
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLoteIds(new Set(lotes.map(l => l.id)));
    } else {
      setSelectedLoteIds(new Set());
    }
  };

  const handleSelectLote = (loteId: string, checked: boolean) => {
    const newSelected = new Set(selectedLoteIds);
    if (checked) {
      newSelected.add(loteId);
    } else {
      newSelected.delete(loteId);
    }
    setSelectedLoteIds(newSelected);
  };

  const isAllSelected = lotes.length > 0 && selectedLoteIds.size === lotes.length;
  const isIndeterminate = selectedLoteIds.size > 0 && selectedLoteIds.size < lotes.length;
  const selectedLotes = lotes.filter(l => selectedLoteIds.has(l.id));

  const handleExportCSV = () => {
    if (!selectedProperty || selectedLotes.length === 0) {
      toast({
        title: 'Sin datos',
        description: 'Selecciona al menos un lote para exportar',
        variant: 'destructive',
      });
      return;
    }
    exportLotesToCSV(selectedLotes, selectedProperty.name);
    toast({
      title: 'Exportación exitosa',
      description: `Se exportaron ${selectedLotes.length} lotes/casas a CSV`,
    });
  };

  const handleExportPDF = async () => {
    if (!selectedProperty || selectedLotes.length === 0) {
      toast({
        title: 'Sin datos',
        description: 'Selecciona al menos un lote para exportar',
        variant: 'destructive',
      });
      return;
    }
    try {
      await exportLotesToPDF(selectedLotes, selectedProperty.name);
      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${selectedLotes.length} lotes/casas a PDF`,
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />

      <main className="lg:ml-64 p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reportes de Lotes/Casas</h1>
              <p className="text-muted-foreground">
                Genera reportes con coordenadas e imágenes de los lotes
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full sm:max-w-xs">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seleccionar Propiedad
                </label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={setSelectedPropertyId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name} {property.etapa ? `- ${property.etapa}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={!selectedPropertyId || selectedLotes.length === 0}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar Excel ({selectedLotes.length})
                </Button>
                <Button
                  onClick={handleExportPDF}
                  disabled={!selectedPropertyId || selectedLotes.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF ({selectedLotes.length})
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {!selectedPropertyId ? (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una propiedad para ver sus lotes/casas</p>
              </div>
            ) : loadingLotes ? (
              <div className="p-12 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Cargando lotes...</p>
              </div>
            ) : lotes.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Esta propiedad no tiene lotes/casas registrados</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">#</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Latitud</TableHead>
                      <TableHead>Longitud</TableHead>
                      <TableHead className="w-32">Imagen</TableHead>
                      <TableHead className="w-20 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Checkbox
                            checked={isAllSelected}
                            ref={(el) => {
                              if (el) {
                                (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isIndeterminate;
                              }
                            }}
                            onCheckedChange={handleSelectAll}
                            aria-label="Seleccionar todos"
                          />
                          <span className="text-xs">Todos</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotes.map((lote) => (
                      <TableRow key={lote.id}>
                        <TableCell className="font-medium">{lote.numero}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lote.tipo === 'casa' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {lote.tipo === 'casa' ? 'Casa' : 'Lote'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{lote.latitude.toFixed(6)}</TableCell>
                        <TableCell className="font-mono text-sm">{lote.longitude.toFixed(6)}</TableCell>
                        <TableCell>
                          {lote.imageUrl ? (
                            <img
                              src={lote.imageUrl}
                              alt={`Lote ${lote.numero}`}
                              className="w-16 h-16 object-cover rounded-lg border border-border"
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin imagen</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedLoteIds.has(lote.id)}
                            onCheckedChange={(checked) => handleSelectLote(lote.id, checked as boolean)}
                            aria-label={`Seleccionar lote ${lote.numero}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border-t border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Total: <span className="font-medium text-foreground">{lotes.length}</span> lotes/casas
                    {selectedLotes.length !== lotes.length && (
                      <> · <span className="font-medium text-primary">{selectedLotes.length}</span> seleccionados</>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
