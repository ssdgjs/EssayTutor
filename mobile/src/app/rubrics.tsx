import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store';
import { api } from '../services/client';
import { Card, Button } from '../components/UI';

interface RubricDimension {
  name: string;
  description?: string;
  weight: number;
  maxScore: number;
  criteria?: string;
}

interface Rubric {
  id: string;
  name: string;
  description?: string;
  scene: string;
  isDefault: boolean;
  customPrompt?: string | null;
  dimensions: RubricDimension[];
  createdAt: string;
}

export default function RubricsScreen() {
  const router = useRouter();
  const { userId } = useUserStore();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [creating, setCreating] = useState(false);

  // 创建表单状态
  const [rubricName, setRubricName] = useState('');
  const [rubricScene, setRubricScene] = useState<'exam' | 'practice' | 'custom'>('custom');
  const [customPrompt, setCustomPrompt] = useState('');
  const [optimizingPrompt, setOptimizingPrompt] = useState(false);
  const [dimensions, setDimensions] = useState<RubricDimension[]>([
    { name: '内容', weight: 0.3, maxScore: 30, description: '主题相关性和论点清晰度' },
    { name: '结构', weight: 0.2, maxScore: 20, description: '段落组织和逻辑连贯' },
    { name: '词汇', weight: 0.2, maxScore: 20, description: '词汇丰富度和准确性' },
    { name: '语法', weight: 0.2, maxScore: 20, description: '句式多样性和语法正确性' },
    { name: '表达', weight: 0.1, maxScore: 10, description: '语言流畅度和表达地道性' },
  ]);

  useEffect(() => {
    loadRubrics();
  }, []);

  const loadRubrics = async () => {
    try {
      setLoading(true);
      const response = await api.getRubrics();

      if (response.success && response.data) {
        // API返回结构: { success: true, data: { data: [...], pagination: {...} } }
        const rubricsData = response.data.data || response.data;

        // 确保dimensions是数组格式
        const parsedRubrics = (rubricsData as any[]).map(r => ({
          ...r,
          dimensions: typeof r.dimensions === 'string'
            ? JSON.parse(r.dimensions)
            : r.dimensions
        }));
        setRubrics(parsedRubrics);
      } else {
        setRubrics([]);
      }
    } catch (error: any) {
      console.error('加载评分标准失败:', error);
      // 401错误表示未登录
      if (error.response?.status === 401 || error.message?.includes('401')) {
        setRubrics([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRubrics();
    setRefreshing(false);
  };

  // AI优化提示词
  const handleOptimizePrompt = async () => {
    if (!rubricName.trim()) {
      Alert.alert('提示', '请先输入评分标准名称');
      return;
    }

    setOptimizingPrompt(true);
    try {
      const response = await api.optimizeRubricPrompt(rubricName, dimensions, customPrompt);
      if (response.success && response.data?.optimizedPrompt) {
        setCustomPrompt(response.data.optimizedPrompt);
        Alert.alert('成功', 'AI已优化提示词，您可以在下方编辑');
      } else {
        Alert.alert('提示', response.data?.suggestions?.[0] || '未能生成优化建议');
      }
    } catch (error: any) {
      console.error('AI优化提示词失败:', error);
      // 显示更详细的错误信息
      const errorMsg = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || (error.code === 'ECONNABORTED' ? 'AI服务超时，请重试' : error.message)
        || 'AI优化失败，请稍后重试';
      Alert.alert('错误', errorMsg);
    } finally {
      setOptimizingPrompt(false);
    }
  };

  const handleCreateRubric = async () => {
    // 检查是否已登录
    if (!userId) {
      Alert.alert(
        '需要登录',
        '请先登录后再创建评分标准',
        [{ text: '去登录', onPress: () => router.push('/profile') }]
      );
      return;
    }

    if (!rubricName.trim()) {
      Alert.alert('提示', '请输入评分标准名称');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        name: rubricName,
        scene: rubricScene,
        customPrompt: customPrompt.trim() || null,
        dimensions: dimensions.map(d => ({
          name: d.name,
          description: d.description || '',
          weight: Number(d.weight),
          maxScore: Number(d.maxScore),
        })),
      };

      const response = await api.createRubric(payload);

      if (response.success) {
        // API返回结构: { success: true, data: { ...rubric } }
        const createdRubric = response.data.data || response.data;
        if (createdRubric && typeof createdRubric.dimensions === 'string') {
          createdRubric.dimensions = JSON.parse(createdRubric.dimensions);
        }

        // 直接添加到本地列表（乐观更新）
        const newRubric: Rubric = {
          id: createdRubric.id,
          name: createdRubric.name,
          description: createdRubric.description || '',
          scene: createdRubric.scene,
          isDefault: createdRubric.isDefault || false,
          customPrompt: createdRubric.customPrompt || null,
          dimensions: createdRubric.dimensions || dimensions,
          createdAt: createdRubric.createdAt || new Date().toISOString(),
        };
        setRubrics(prev => [newRubric, ...prev]);

        Alert.alert('成功', '评分标准创建成功');
        setShowCreateModal(false);
        setRubricName('');
        setCustomPrompt('');

        // 同时刷新列表以确保数据一致
        await loadRubrics();
      } else {
        Alert.alert('错误', response.error?.message || '创建失败');
      }
      } catch (error: any) {
      console.error('创建评分标准失败:', error);
      // 显示更详细的错误信息
      const errorMsg = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || error.message 
        || '创建失败';
      console.error('详细错误:', error.response?.data);
      Alert.alert('错误', errorMsg);
    }
  };

  const handleDeleteRubric = (rubric: Rubric) => {
    Alert.alert('确认删除', `确定要删除"${rubric.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await api.deleteRubric(rubric.id);
            if (response.success) {
              Alert.alert('成功', '删除成功');
              loadRubrics();
            }
          } catch (error) {
            Alert.alert('错误', '删除失败');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (rubric: Rubric) => {
    try {
      const response = await api.setDefaultRubric(rubric.id);
      if (response.success) {
        Alert.alert('成功', `已设置"${rubric.name}"为默认评分标准`);
        loadRubrics();
      }
    } catch (error) {
      Alert.alert('错误', '设置失败');
    }
  };

  const getSceneLabel = (scene: string) => {
    switch (scene) {
      case 'exam':
        return '考试';
      case 'practice':
        return '练习';
      default:
        return '自定义';
    }
  };

  const renderRubricItem = (rubric: Rubric) => (
    <TouchableOpacity
      key={rubric.id}
      style={styles.rubricItem}
      onPress={() => setSelectedRubric(rubric)}
    >
      <View style={styles.rubricHeader}>
        <View style={styles.rubricInfo}>
          <Text style={styles.rubricName}>
            {rubric.name}
            {rubric.isDefault && (
              <Text style={styles.defaultBadge}> 默认</Text>
            )}
          </Text>
          <Text style={styles.rubricMeta}>
            {getSceneLabel(rubric.scene)} • {rubric.dimensions?.length || 0}个维度
          </Text>
        </View>
        <Text style={styles.rubricDate}>
          {new Date(rubric.createdAt).toLocaleDateString('zh-CN')}
        </Text>
      </View>
      <View style={styles.dimensionPreview}>
        {rubric.dimensions?.slice(0, 3).map((dim, idx) => (
          <View key={idx} style={styles.dimensionChip}>
            <Text style={styles.dimensionChipText}>
              {dim.name}({(dim.weight * 100).toFixed(0)}%)
            </Text>
          </View>
        ))}
        {rubric.dimensions && rubric.dimensions.length > 3 && (
          <Text style={styles.moreText}>+{rubric.dimensions.length - 3}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>评分标准</Text>
        <Text style={styles.subtitle}>管理和创建作文评分标准</Text>

        {/* 创建按钮 */}
        <Pressable style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.createButtonText}>+ 创建评分标准</Text>
        </Pressable>

        {/* 评分标准列表 */}
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
        ) : rubrics.length > 0 ? (
          rubrics.map(renderRubricItem)
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>暂无评分标准</Text>
            <Text style={styles.emptyText}>点击上方按钮创建您的第一个评分标准</Text>
          </Card>
        )}

        {/* 预设评分标准快捷方式 */}
        <Text style={styles.sectionTitle}>快捷选择</Text>
        <View style={styles.quickSelect}>
          <Pressable
            style={styles.quickItem}
            onPress={() => {
              setRubricName('中考英语作文评分标准');
              setRubricScene('exam');
              setDimensions([
                { name: '内容', weight: 0.3, maxScore: 30, description: '主题相关性、论点清晰度' },
                { name: '结构', weight: 0.2, maxScore: 20, description: '段落组织、逻辑连贯' },
                { name: '词汇', weight: 0.2, maxScore: 20, description: '词汇丰富度、拼写准确性' },
                { name: '语法', weight: 0.2, maxScore: 20, description: '语法正确性、句式多样性' },
                { name: '表达', weight: 0.1, maxScore: 10, description: '语言流畅度、表达地道性' },
              ]);
              setShowCreateModal(true);
            }}
          >
            <Text style={styles.quickIcon}>📝</Text>
            <Text style={styles.quickName}>中考标准</Text>
          </Pressable>
          <Pressable
            style={styles.quickItem}
            onPress={() => {
              setRubricName('高考英语作文评分标准');
              setRubricScene('exam');
              setDimensions([
                { name: '内容', weight: 0.3, maxScore: 30, description: '主题涵盖、论点明确' },
                { name: '结构', weight: 0.2, maxScore: 20, description: '层次分明、逻辑清晰' },
                { name: '词汇', weight: 0.2, maxScore: 20, description: '词汇丰富、用词准确' },
                { name: '语法', weight: 0.2, maxScore: 20, description: '句式多样、语法正确' },
                { name: '表达', weight: 0.1, maxScore: 10, description: '表达流畅、地道自然' },
              ]);
              setShowCreateModal(true);
            }}
          >
            <Text style={styles.quickIcon}>🎯</Text>
            <Text style={styles.quickName}>高考标准</Text>
          </Pressable>
          <Pressable
            style={styles.quickItem}
            onPress={() => {
              setRubricName('通用练习评分标准');
              setRubricScene('practice');
              setDimensions([
                { name: '内容', weight: 0.3, maxScore: 30, description: '主题表达清晰' },
                { name: '结构', weight: 0.2, maxScore: 20, description: '段落安排合理' },
                { name: '词汇', weight: 0.2, maxScore: 20, description: '词汇使用恰当' },
                { name: '语法', weight: 0.2, maxScore: 20, description: '语法基本正确' },
                { name: '表达', weight: 0.1, maxScore: 10, description: '表达通顺' },
              ]);
              setShowCreateModal(true);
            }}
          >
            <Text style={styles.quickIcon}>📚</Text>
            <Text style={styles.quickName}>通用练习</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 创建评分标准弹窗 */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>创建评分标准</Text>
                <Pressable onPress={() => {
                  setShowCreateModal(false);
                  setRubricName('');
                  setCustomPrompt('');
                }}>
                  <Text style={styles.closeButton}>✕</Text>
                </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.formLabel}>评分标准名称</Text>
              <TextInput
                style={styles.formInput}
                value={rubricName}
                onChangeText={setRubricName}
                placeholder="输入评分标准名称"
              />

              <Text style={styles.formLabel}>应用场景</Text>
              <View style={styles.sceneSelector}>
                {(['exam', 'practice', 'custom'] as const).map((scene) => (
                  <Pressable
                    key={scene}
                    style={[styles.sceneButton, rubricScene === scene && styles.sceneButtonActive]}
                    onPress={() => setRubricScene(scene)}
                  >
                    <Text
                      style={[styles.sceneButtonText, rubricScene === scene && styles.sceneButtonTextActive]}
                    >
                      {scene === 'exam' ? '考试' : scene === 'practice' ? '练习' : '自定义'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.formLabel}>AI 评分提示词</Text>
              <Text style={styles.hintText}>自定义AI批改时的评分标准和注意事项</Text>
              <View style={styles.promptRow}>
                <TextInput
                  style={[styles.formInput, styles.promptInput]}
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                  placeholder="例如：重点检查时态和主谓一致问题..."
                  multiline
                  maxLength={1000}
                />
                <Button
                  title="AI优化"
                  variant="secondary"
                  size="small"
                  onPress={handleOptimizePrompt}
                  loading={optimizingPrompt}
                  disabled={optimizingPrompt}
                />
              </View>

              <Text style={styles.formLabel}>评分维度</Text>
              {dimensions.map((dim, idx) => (
                <View key={idx} style={styles.dimensionRow}>
                  <TextInput
                    style={[styles.formInput, styles.dimensionNameInput]}
                    value={dim.name}
                    onChangeText={(text) => {
                      const newDims = [...dimensions];
                      newDims[idx].name = text;
                      setDimensions(newDims);
                    }}
                  />
                  <View style={styles.weightInput}>
                    <Text style={styles.weightLabel}>权重</Text>
                    <TextInput
                      style={styles.weightValue}
                      value={`${(dim.weight * 100).toFixed(0)}%`}
                      editable={false}
                    />
                  </View>
                </View>
              ))}

              <Text style={styles.hintText}>
                权重总和应为100%，当前:{' '}
                <Text style={{ color: Math.abs(dimensions.reduce((s, d) => s + d.weight, 0) - 1) < 0.01 ? '#34C759' : '#FF3B30' }}>
                  {(dimensions.reduce((s, d) => s + d.weight, 0) * 100).toFixed(0)}%
                </Text>
              </Text>

              <View style={styles.modalActions}>
                <Button
                  title="取消"
                  variant="outline"
                  onPress={() => {
                    setShowCreateModal(false);
                    setRubricName('');
                    setCustomPrompt('');
                  }}
                />
                <Button
                  title="创建"
                  onPress={handleCreateRubric}
                  loading={creating}
                  disabled={creating}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 评分标准详情弹窗 */}
      <Modal visible={!!selectedRubric} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedRubric?.name}</Text>
              <Pressable onPress={() => setSelectedRubric(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>场景</Text>
                <Text style={styles.detailValue}>{getSceneLabel(selectedRubric?.scene || '')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>创建时间</Text>
                <Text style={styles.detailValue}>
                  {selectedRubric && new Date(selectedRubric.createdAt).toLocaleDateString('zh-CN')}
                </Text>
              </View>

              <Text style={styles.formLabel}>评分维度详情</Text>
              {selectedRubric?.dimensions.map((dim, idx) => (
                <Card key={idx} style={styles.dimensionCard}>
                  <View style={styles.dimensionCardHeader}>
                    <Text style={styles.dimensionCardName}>{dim.name}</Text>
                    <Text style={styles.dimensionCardScore}>
                      {dim.maxScore}分 ({(dim.weight * 100).toFixed(0)}%)
                    </Text>
                  </View>
                  <Text style={styles.dimensionCardDesc}>{dim.description}</Text>
                </Card>
              ))}

              <View style={styles.modalActions}>
                {!selectedRubric?.isDefault && (
                  <Button
                    title="设为默认"
                    variant="outline"
                    onPress={() => {
                      handleSetDefault(selectedRubric!);
                      setSelectedRubric(null);
                    }}
                  />
                )}
                <Button
                  title="使用此标准"
                  onPress={() => {
                    router.push({ pathname: '/essay', params: { rubricId: selectedRubric?.id } });
                    setSelectedRubric(null);
                  }}
                />
              </View>
              <View style={styles.deleteAction}>
                <Pressable
                  onPress={() => {
                    if (selectedRubric) {
                      handleDeleteRubric(selectedRubric);
                      setSelectedRubric(null);
                    }
                  }}
                >
                  <Text style={styles.deleteText}>删除评分标准</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginTop: 40,
  },
  rubricItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rubricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rubricInfo: {
    flex: 1,
  },
  rubricName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: 'normal',
  },
  rubricMeta: {
    fontSize: 12,
    color: '#666',
  },
  rubricDate: {
    fontSize: 12,
    color: '#999',
  },
  dimensionPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimensionChip: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dimensionChipText: {
    fontSize: 12,
    color: '#007AFF',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 12,
  },
  quickSelect: {
    flexDirection: 'row',
    gap: 12,
  },
  quickItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sceneSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  sceneButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  sceneButtonActive: {
    backgroundColor: '#007AFF',
  },
  sceneButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sceneButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  promptInput: {
    flex: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dimensionNameInput: {
    flex: 1,
  },
  weightInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weightLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  weightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    minWidth: 40,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  deleteAction: {
    marginTop: 16,
    alignItems: 'center',
  },
  deleteText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dimensionCard: {
    marginBottom: 8,
    padding: 12,
  },
  dimensionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dimensionCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dimensionCardScore: {
    fontSize: 14,
    color: '#007AFF',
  },
  dimensionCardDesc: {
    fontSize: 12,
    color: '#666',
  },
});
