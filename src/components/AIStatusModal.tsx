import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HardwareCapability } from '../types/card';
import { HardwareProbe } from '../services/hardwareProbe';
import { AISummarizerService, SummarizationResult } from '../services/aiSummarizerService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AIStatusModal: React.FC<Props> = ({ visible, onClose }) => {
  const [capability, setCapability] = useState<HardwareCapability | null>(null);
  const [testText, setTestText] = useState(
    'The Library of Alexandria in Egypt was one of the largest and most significant libraries of the ancient world. Founded after Alexander the Great, it was dedicated to the Muses. The library functioned as a major center of scholarship from its construction in the 3rd century BC until the Roman conquest of Egypt. Many believed it was burned down in a single day, but historical consensus demonstrates it suffered centuries of neglect, institutional purges, and funding cuts.'
  );
  const [summarizing, setSummarizing] = useState(false);
  const [testResult, setTestResult] = useState<SummarizationResult | null>(null);

  useEffect(() => {
    if (visible) {
      HardwareProbe.inspectDevice().then(setCapability);
    }
  }, [visible]);

  const handleRunTest = async () => {
    if (!testText.trim()) return;
    setSummarizing(true);
    try {
      const result = await AISummarizerService.summarize(testText, 'Test Document');
      setTestResult(result);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="hardware-chip-outline" size={22} color="#64B5F6" />
              <Text style={styles.headerTitle}>On-Device AI Engine</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#E0E0E0" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Device Diagnostics Card */}
            <View style={styles.diagCard}>
              <Text style={styles.diagTitle}>DEVICE HARDWARE PROBE</Text>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Platform:</Text>
                <Text style={styles.diagValue}>{capability?.platform.toUpperCase() || 'Probing...'}</Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Estimated RAM:</Text>
                <Text style={styles.diagValue}>
                  {capability ? `${(capability.estimatedMemoryMB / 1024).toFixed(1)} GB` : '...'}
                </Text>
              </View>
              <View style={styles.diagRow}>
                <Text style={styles.diagLabel}>Active Tier:</Text>
                <View style={styles.tierPill}>
                  <Text style={styles.tierText}>{capability?.engineName || 'Detecting'}</Text>
                </View>
              </View>
              <Text style={styles.diagDetail}>{capability?.details}</Text>
            </View>

            {/* Interactive Summarizer Playground */}
            <View style={styles.playgroundSection}>
              <Text style={styles.sectionTitle}>TEST ON-DEVICE EXTRACTOR</Text>
              <Text style={styles.sectionSubtitle}>
                Run instant client-side TF-IDF / sentence-scoring summarization without network requests:
              </Text>

              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                value={testText}
                onChangeText={setTestText}
                placeholder="Paste raw article text to summarize..."
                placeholderTextColor="#6B7280"
              />

              <TouchableOpacity
                style={styles.runButton}
                onPress={handleRunTest}
                disabled={summarizing}
                activeOpacity={0.8}
              >
                {summarizing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color="#FFFFFF" />
                    <Text style={styles.runButtonText}>Summarize On-Device</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Output Result */}
              {testResult && (
                <View style={styles.resultBox}>
                  <View style={styles.resultStatsRow}>
                    <Text style={styles.statPill}>⚡ {testResult.executionTimeMs}ms</Text>
                    <Text style={styles.statPill}>📉 {testResult.compressionRatio} compressed</Text>
                    <Text style={styles.statPill}>🎯 Tier: {testResult.engineUsed}</Text>
                  </View>

                  <Text style={styles.resultHeading}>2-Sentence Summary:</Text>
                  <Text style={styles.resultSummary}>{testResult.summary}</Text>

                  <Text style={styles.resultHeading}>Key Takeaway:</Text>
                  <Text style={styles.resultTakeaway}>"{testResult.takeaway}"</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#161922',
    borderRadius: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    gap: 20,
  },
  diagCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  diagTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  diagLabel: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  diagValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tierPill: {
    backgroundColor: 'rgba(100, 181, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 181, 246, 0.3)',
  },
  tierText: {
    color: '#64B5F6',
    fontSize: 12,
    fontWeight: '700',
  },
  diagDetail: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    fontStyle: 'italic',
  },
  playgroundSection: {
    gap: 10,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: '#0F1117',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    lineHeight: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 90,
    textAlignVertical: 'top',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resultBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    gap: 8,
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  statPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#E0E7FF',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultHeading: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  resultSummary: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
  },
  resultTakeaway: {
    color: '#FFD54F',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});
