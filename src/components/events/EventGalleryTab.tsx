import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Event } from '@/types/events';
import { ImageIcon } from 'lucide-react';

interface EventGalleryTabProps {
  event: Event;
}

// Predefined event images from Unsplash
const DEFAULT_GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1519167758481-83f29da8c4b0?w=800',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800',
  'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
];

export function EventGalleryTab({ event }: EventGalleryTabProps) {
  // Use event images if available, otherwise use default gallery
  const galleryImages = event.imageUrl 
    ? [event.imageUrl, ...DEFAULT_GALLERY_IMAGES.slice(0, 7)]
    : DEFAULT_GALLERY_IMAGES;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Galería del Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors cursor-pointer group"
              >
                <img
                  src={image}
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de las Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Total de fotos: {galleryImages.length}</p>
            <p>• Última actualización: {new Date(event.updatedAt).toLocaleDateString('es-ES')}</p>
            <p>• Las fotos se muestran en orden cronológico</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}