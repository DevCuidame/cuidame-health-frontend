// data-compressor.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DataCompressorService {

  constructor() {}

  public compress(data: any): Observable<string> {
    return from(this.compressAsync(data));
  }

  private async compressAsync(data: any): Promise<string> {
    // Convertir datos a string JSON
    const jsonStr = JSON.stringify(data);
    
    // Convertir a Uint8Array para compresión
    const textEncoder = new TextEncoder();
    const uint8Array = textEncoder.encode(jsonStr);
    
    try {
      // Usar la API de compresión si está disponible
      if ('CompressionStream' in window) {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(uint8Array);
        writer.close();
        
        // Leer los datos comprimidos
        const reader = cs.readable.getReader();
        const chunks = [];
        
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            chunks.push(value);
          }
        }
        
        // Concatenar todos los chunks
        const allChunks = new Uint8Array(
          chunks.reduce((total, chunk) => total + chunk.length, 0)
        );
        
        let offset = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Codificar en base64 para almacenamiento
        return this.uint8ArrayToBase64(allChunks);
      } else {
        // Fallback si la API de compresión no está disponible
        // Implementar una versión simplificada (eliminando datos innecesarios)
        return this.simplifyData(data);
      }
    } catch (error) {
      console.warn('Compression failed, using fallback:', error);
      return this.simplifyData(data);
    }
  }

  public decompress(compressedData: string): Observable<any> {
    return from(this.decompressAsync(compressedData));
  }

  private async decompressAsync(compressedData: string): Promise<any> {
    try {
      // Si parece ser JSON ya descomprimido
      if (compressedData.startsWith('{') || compressedData.startsWith('[')) {
        return JSON.parse(compressedData);
      }
      
      // Intentar descomprimir datos en base64
      const uint8Array = this.base64ToUint8Array(compressedData);
      
      if ('DecompressionStream' in window) {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        writer.write(uint8Array);
        writer.close();
        
        // Leer los datos descomprimidos
        const reader = ds.readable.getReader();
        const chunks = [];
        
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            chunks.push(value);
          }
        }
        
        // Concatenar todos los chunks
        const allChunks = new Uint8Array(
          chunks.reduce((total, chunk) => total + chunk.length, 0)
        );
        
        let offset = 0;
        for (const chunk of chunks) {
          allChunks.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Decodificar a JSON
        const textDecoder = new TextDecoder();
        const jsonStr = textDecoder.decode(allChunks);
        return JSON.parse(jsonStr);
      } else {
        // Si parece haber sido simplificado, tratar como JSON simple
        return JSON.parse(compressedData);
      }
    } catch (error) {
      console.error('Decompression failed:', error);
      throw error;
    }
  }

  // Utilidades para convertir entre Uint8Array y Base64
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }

  // Método de simplificación de datos para fallback
  private simplifyData(data: any): string {
    let simplified = data;
    
    // Si es un objeto, eliminar propiedades grandes
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        // Si es un array, simplificar cada elemento
        simplified = data.map(item => {
          if (typeof item === 'object' && item !== null) {
            // Eliminar propiedades grandes conocidas
            const { imagebs64, ...rest } = item;
            return rest;
          }
          return item;
        });
      } else {
        // Eliminar propiedades grandes conocidas del objeto
        const { imagebs64, ...rest } = data;
        simplified = rest;
      }
    }
    
    return JSON.stringify(simplified);
  }
}