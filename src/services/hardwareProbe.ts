import { Platform } from '../utils/platform';
import { HardwareCapability } from '../types/card';

export class HardwareProbe {
  static async inspectDevice(): Promise<HardwareCapability> {
    const isWeb = Platform.OS === 'web';
    let estimatedRAM = 4096; // fallback 4GB default
    let hasWebGPU = false;

    if (isWeb && typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      // Browser Device Memory API (Chrome/Edge/Android Chrome)
      if ('deviceMemory' in navigator) {
        estimatedRAM = ((navigator as any).deviceMemory || 4) * 1024;
      }
      if ('gpu' in navigator && (navigator as any).gpu) {
        hasWebGPU = true;
      }
    } else if (Platform.OS === 'android') {
      // High-end Android devices typically have 6GB+ RAM
      estimatedRAM = 6144;
    } else if (Platform.OS === 'ios') {
      estimatedRAM = 4096;
    }

    // High performance criteria: RAM >= 6GB or supported WebGPU/Flagship NPU
    const hasHighPerformance = (estimatedRAM >= 6144 || hasWebGPU);

    let engineName: HardwareCapability['engineName'] = 'ExtractiveNLP';
    let details = 'Tier 2 Universal Extractive NLP: Instant on-device heuristic summarization (<5ms, 0MB model overhead).';

    if (hasHighPerformance) {
      engineName = 'OnDeviceLLM';
      details = 'Tier 1 High-Performance Engine: Hardware meets requirements for on-device inference acceleration.';
    }

    return {
      hasHighPerformanceAI: hasHighPerformance,
      estimatedMemoryMB: estimatedRAM,
      platform: Platform.OS,
      engineName,
      details,
    };
  }
}
