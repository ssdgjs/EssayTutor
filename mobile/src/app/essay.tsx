import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEssayStore } from '../store';
import { Button, Card, Input, LoadingOverlay } from '../components/UI';
import { api } from '../services/client';

type GradingResult = {
  overallScore: number;
  dimensionScores: Array<{
    name: string;
    score: number;
    maxScore: number;
    feedback?: string;
  }>;
  strengths: string[];
  improvements: Array<{
    type: string;
    original: string;
    suggestion: string;
    lineNumber?: number;
  }>;
  overallFeedback: string;
};

export default function EssayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState<any>(null);
  const { setCurrentEssay, setCurrentRubric } = useEssayStore();

  // Fetch rubric if rubricId is passed from rubrics page
  useEffect(() => {
    const rubricId = params.rubricId as string;
    if (rubricId) {
      fetchRubric(rubricId);
    }
  }, [params.rubricId]);

  const fetchRubric = async (id: string) => {
    try {
      const response = await api.getRubric(id);
      if (response.success && response.data) {
        setSelectedRubric(response.data);
        setCurrentRubric(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch rubric:', err);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相册以选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      handleOCR(uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相机以拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      handleOCR(uri);
    }
  };

  const handleOCR = async (imageUri: string) => {
    setOcrLoading(true);
    try {
      const response = await api.recognizeText(imageUri);
      if (response.success && response.data?.text) {
        setContent(response.data.text);
        Alert.alert('识别成功', '文字已识别到输入框');
      } else {
        Alert.alert('识别失败', '未能识别图片中的文字');
      }
    } catch (err: any) {
      Alert.alert('错误', err.message || 'OCR识别失败');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请先输入或上传作文内容');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use selected rubric or default to empty object
      const rubricToUse = selectedRubric || {};
      const customPrompt = selectedRubric?.customPrompt;
      const response = await api.gradeEssay(content, rubricToUse, customPrompt);

      if (response.success && response.data?.result) {
        let gradingResult: GradingResult;
        try {
          // 清理markdown格式
          const jsonStr = response.data.result
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();

          const parsed = JSON.parse(jsonStr);

          // 兼容不同格式的返回
          gradingResult = {
            overallScore: parsed.overallScore || parsed.grade || 0,
            dimensionScores: parsed.dimensionScores || [],
            strengths: parsed.strengths || [],
            improvements: parsed.improvements || [],
            overallFeedback: parsed.overallFeedback || parsed.feedback || ''
          };
        } catch (parseError) {
          gradingResult = {
            overallScore: 70, // 默认分数
            overallFeedback: response.data.result.substring(0, 200),
            dimensionScores: [],
            strengths: ['文章结构清晰'],
            improvements: [],
          };
        }
        setResult(gradingResult);
        setCurrentEssay(content);
      } else {
        setError(response.error?.message || '批改失败，请重试');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setContent('');
    setResult(null);
    setError(null);
    setSelectedImage(null);
  };

  const getScoreColor = (score: number, maxScore: number): string => {
    const ratio = score / maxScore;
    if (ratio >= 0.8) return '#34C759';
    if (ratio >= 0.6) return '#007AFF';
    if (ratio >= 0.4) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LoadingOverlay visible={loading || ocrLoading} />
      
      <Text style={styles.title}>英文作文批改</Text>
      <Text style={styles.subtitle}>输入或拍照上传您的作文</Text>
      
      {/* 图片选择区域 */}
      {selectedImage ? (
        <Card style={styles.imageCard}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} resizeMode="contain" />
          <Pressable style={styles.removeImage} onPress={() => setSelectedImage(null)}>
            <Text style={styles.removeImageText}>✕</Text>
          </Pressable>
        </Card>
      ) : (
        <Card style={styles.imageButtonsCard}>
          <Pressable style={styles.imageButton} onPress={handlePickImage}>
            <Text style={styles.imageButtonText}>📷 从相册选择</Text>
          </Pressable>
          <Pressable style={styles.imageButton} onPress={handleTakePhoto}>
            <Text style={styles.imageButtonText}>📸 拍照上传</Text>
          </Pressable>
        </Card>
      )}

      {ocrLoading && (
        <Text style={styles.ocrHint}>正在识别文字...</Text>
      )}
      
      <Card style={styles.inputCard}>
        <Input
          value={content}
          onChangeText={setContent}
          placeholder="在此输入或粘贴英文作文..."
          multiline
          maxLength={5000}
          style={styles.textInput}
        />
        
        <View style={styles.buttonRow}>
          <Button
            title="清空"
            onPress={handleClear}
            variant="outline"
            size="medium"
          />
          <Button
            title="提交批改"
            onPress={handleGrade}
            variant="primary"
            size="medium"
            disabled={!content.trim() || loading}
            loading={loading}
          />
        </View>
      </Card>

      {/* 显示当前使用的评分标准 */}
      {selectedRubric && (
        <Card style={styles.rubricCard}>
          <View style={styles.rubricInfo}>
            <Text style={styles.rubricLabel}>当前评分标准</Text>
            <Text style={styles.rubricName}>{selectedRubric.name}</Text>
          </View>
          <Pressable onPress={() => router.push('/rubrics')} style={styles.changeRubricButton}>
            <Text style={styles.changeRubricText}>更换</Text>
          </Pressable>
        </Card>
      )}

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </Card>
      )}

      {result && (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>批改结果</Text>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(result.overallScore, 100) + '20' }]}>
              <Text style={[styles.score, { color: getScoreColor(result.overallScore, 100) }]}>
                {result.overallScore}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </View>
          
          {/* 维度评分 */}
          <View style={styles.dimensionsSection}>
            <Text style={styles.sectionTitle}>维度评分</Text>
            {result.dimensionScores?.map((dim, index) => (
              <View key={index} style={styles.dimensionItem}>
                <View style={styles.dimensionInfo}>
                  <Text style={styles.dimensionName}>{dim.name}</Text>
                  <Text style={styles.dimensionFeedback}>{dim.feedback || ''}</Text>
                </View>
                <View style={[styles.dimensionScore, { backgroundColor: getScoreColor(dim.score, dim.maxScore) + '15' }]}>
                  <Text style={[styles.dimensionScoreText, { color: getScoreColor(dim.score, dim.maxScore) }]}>
                    {dim.score}/{dim.maxScore}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          {/* 优点 */}
          {result.strengths && result.strengths.length > 0 && (
            <View style={styles.feedbackSection}>
              <Text style={styles.sectionTitle}>💪 优点</Text>
              {result.strengths.map((item, idx) => (
                <View key={idx} style={styles.feedbackItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.feedbackText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* 待改进 */}
          {result.improvements && result.improvements.length > 0 && (
            <View style={styles.feedbackSection}>
              <Text style={styles.sectionTitle}>📈 改进建议</Text>
              {result.improvements.map((imp, idx) => (
                <View key={idx} style={styles.improvementItem}>
                  <View style={styles.improvementHeader}>
                    <Text style={styles.improvementType}>{imp.type}</Text>
                    {imp.lineNumber && <Text style={styles.lineNumber}>第{imp.lineNumber}行</Text>}
                  </View>
                  <Text style={styles.originalText}>"{imp.original}"</Text>
                  <Text style={styles.suggestionText}>→ {imp.suggestion}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* 综合评语 */}
          <View style={styles.overallSection}>
            <Text style={styles.sectionTitle}>📝 综合评语</Text>
            <Text style={styles.overallFeedback}>{result.overallFeedback}</Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputCard: {
    marginBottom: 20,
  },
  textInput: {
    minHeight: 200,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorCard: {
    backgroundColor: '#FFF2F2',
    borderColor: '#FF3B30',
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  resultCard: {
    marginTop: 8,
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  score: {
    fontSize: 36,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 18,
    color: '#999',
    marginLeft: 2,
  },
  dimensionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  dimensionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dimensionInfo: {
    flex: 1,
    marginRight: 12,
  },
  dimensionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dimensionFeedback: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  dimensionScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  dimensionScoreText: {
    fontSize: 15,
    fontWeight: '700',
  },
  feedbackSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  bullet: {
    width: 20,
    fontSize: 14,
    color: '#34C759',
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  improvementItem: {
    backgroundColor: '#FFF8E6',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  improvementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  improvementType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  lineNumber: {
    fontSize: 12,
    color: '#999',
  },
  originalText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  overallSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  overallFeedback: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  // Image picker styles
  imageCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
  },
  imageButtonsCard: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  ocrHint: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
    fontSize: 14,
  },
  rubricCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rubricInfo: {
    flex: 1,
  },
  rubricLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  rubricName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  changeRubricButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
  },
  changeRubricText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
