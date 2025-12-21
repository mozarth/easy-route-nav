import { MapPin, Navigation, Clock, Smartphone } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Ubicación Precisa',
    description: 'Coordenadas GPS exactas para cada propiedad',
  },
  {
    icon: Navigation,
    title: 'Rutas en Tiempo Real',
    description: 'Navegación paso a paso hasta tu destino',
  },
  {
    icon: Clock,
    title: 'Acceso Instantáneo',
    description: 'Escanea y obtén direcciones inmediatamente',
  },
  {
    icon: Smartphone,
    title: 'Sin Instalaciones',
    description: 'Funciona directamente en tu navegador móvil',
  },
];

export const Features = () => {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          <span className="text-gradient-primary">Navegación</span> Simplificada
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Un sistema inteligente para guiar a tus visitantes directamente a su destino
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card p-6 text-center group hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl gradient-primary flex items-center justify-center group-hover:glow-primary transition-shadow">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
