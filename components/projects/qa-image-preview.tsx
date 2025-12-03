"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X, ZoomIn } from "lucide-react"
import type { QAImage } from "@/types/qa"

interface QAImagePreviewProps {
  images: QAImage[]
}

export function QAImagePreview({ images }: QAImagePreviewProps) {
  const [selectedImage, setSelectedImage] = useState<QAImage | null>(null)

  if (images.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-24 object-cover rounded-md border"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Modal para ver imagen ampliada */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <div className="relative">
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = selectedImage.url
                    link.download = selectedImage.name
                    link.click()
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cerrar
                </Button>
              </div>
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                {selectedImage.name}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}















