import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store';
import { api } from '../services/client';
import { Card, Button } from '../components/UI';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface UserLevel {
  currentLevel: number;
  currentXP: number;
  totalXP: number;
  title: string;
  xpToNextLevel: number;
  maxXPForCurrentLevel: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  progress: number;
}

interface Essay {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  rubric?: { name: string };
  result?: { overallScore: number; maxScore: number };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, token, displayName, setUser, logout } = useUserStore();
  const [isLoggedIn, setIsLoggedIn] = useState(!!userId);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayNameText, setDisplayNameText] = useState('');

  // User data
  const [user, setUserData] = useState<User | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentEssays, setRecentEssays] = useState<Essay[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadUserData();
    }
  }, [isLoggedIn]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userRes, levelRes, progressRes, essaysRes] = await Promise.all([
        api.getMe(),
        api.getUserLevel().catch(() => null),
        api.getAchievementProgress().catch(() => null),
        api.getEssays({ limit: 5 }).catch(() => null),
      ]);

      if (userRes.success) setUserData(userRes.data);
      if (levelRes?.success) setUserLevel(levelRes.data);
      if (progressRes?.success) setAchievements(progressRes.data.achievements || []);
      if (essaysRes?.success) setRecentEssays(essaysRes.data || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(email, password);
      if (response.success && response.data) {
        setUser(response.data.user.id, response.data.accessToken, response.data.user.displayName);
        setIsLoggedIn(true);
        setShowLoginForm(false);
        Alert.alert('成功', '登录成功！');
      } else {
        Alert.alert('错误', response.error?.message || '登录失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !displayNameText) {
      Alert.alert('错误', '请填写所有字段');
      return;
    }

    if (password.length < 6) {
      Alert.alert('错误', '密码长度至少6位');
      return;
    }

    setLoading(true);
    try {
      const response = await api.register(email, password, displayNameText);
      if (response.success && response.data) {
        setUser(response.data.user.id, response.data.accessToken, response.data.user.displayName);
        setIsLoggedIn(true);
        setShowLoginForm(false);
        Alert.alert('成功', '注册成功！');
      } else {
        Alert.alert('错误', response.error?.message || '注册失败');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setShowLoginForm(true);
    setUserData(null);
    setUserLevel(null);
    setAchievements([]);
    setRecentEssays([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const getLevelProgress = () => {
    if (!userLevel) return 0;
    const { currentXP, xpToNextLevel, maxXPForCurrentLevel } = userLevel;
    if (xpToNextLevel === 0) return 100;
    return Math.round(((maxXPForCurrentLevel - xpToNextLevel) / maxXPForCurrentLevel) * 100);
  };

  // 未登录状态 - 显示登录/注册表单
  if (!isLoggedIn || !userId) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>欢迎使用</Text>
          <Text style={styles.subtitle}>AsseyTutor</Text>

          {showLoginForm ? (
            <>
              <View style={styles.form}>
                <Text style={styles.formTitle}>登录</Text>
                <Text style={styles.label}>邮箱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入邮箱"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.label}>密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入密码"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>登录</Text>
                  )}
                </Pressable>

                <Text style={styles.toggleText}>
                  还没有账号？<Text style={styles.toggleLink} onPress={() => setShowLoginForm(false)}>立即注册</Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.form}>
                <Text style={styles.formTitle}>注册</Text>
                <Text style={styles.label}>显示名称</Text>
                <TextInput
                  style={styles.input}
                  placeholder="设置您的昵称"
                  placeholderTextColor="#999"
                  value={displayNameText}
                  onChangeText={setDisplayNameText}
                />

                <Text style={styles.label}>邮箱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入邮箱"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.label}>密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="至少6位密码"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>注册</Text>
                  )}
                </Pressable>

                <Text style={styles.toggleText}>
                  已有账号？<Text style={styles.toggleLink} onPress={() => setShowLoginForm(true)}>立即登录</Text>
                </Text>
              </View>
            </>
          )}

          <View style={styles.info}>
            <Text style={styles.infoTitle}>功能说明</Text>
            <Text style={styles.infoText}>• AI 智能作文批改</Text>
            <Text style={styles.infoText}>• 拍照识别手写文字</Text>
            <Text style={styles.infoText}>• 多维度评分反馈</Text>
            <Text style={styles.infoText}>• 成就系统激励</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 已登录状态 - 显示用户信息
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 用户信息头部 */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.displayName?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.displayName || '用户'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* 等级卡片 */}
      {userLevel && (
        <Card style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.levelTitle}>等级 {userLevel.currentLevel}</Text>
              <Text style={styles.levelName}>{userLevel.title}</Text>
            </View>
            <Text style={styles.totalXP}>{userLevel.totalXP} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getLevelProgress()}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {userLevel.xpToNextLevel > 0 ? `距离下一级还需 ${userLevel.xpToNextLevel} XP` : '已满级！'}
          </Text>
        </Card>
      )}

      {/* 统计数据 */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{recentEssays.length}</Text>
          <Text style={styles.statLabel}>批改次数</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>
            {achievements.filter((a) => a.unlocked).length}/{achievements.length}
          </Text>
          <Text style={styles.statLabel}>成就解锁</Text>
        </Card>
      </View>

      {/* 最近批改 */}
      <Text style={styles.sectionTitle}>最近批改</Text>
      {recentEssays.length > 0 ? (
        recentEssays.slice(0, 3).map((essay) => (
          <TouchableOpacity
            key={essay.id}
            style={styles.essayItem}
            onPress={() => router.push({ pathname: '/essay', params: { essayId: essay.id } })}
          >
            <View style={styles.essayInfo}>
              <Text style={styles.essayTitle}>{essay.title || 'Untitled'}</Text>
              <Text style={styles.essayDate}>
                {new Date(essay.createdAt).toLocaleDateString('zh-CN')}
              </Text>
            </View>
            {essay.result && (
              <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(essay.result.overallScore) + '20' }]}>
                <Text style={[styles.score, { color: getScoreColor(essay.result.overallScore) }]}>
                  {essay.result.overallScore}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>暂无批改记录</Text>
          <Button title="开始批改" onPress={() => router.push('/essay')} size="small" />
        </Card>
      )}

      {/* 成就列表 */}
      <Text style={styles.sectionTitle}>成就</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsRow}>
        {achievements.slice(0, 6).map((achievement) => (
          <View key={achievement.id} style={[styles.achievementItem, !achievement.unlocked && styles.achievementLocked]}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <Text style={[styles.achievementName, !achievement.unlocked && styles.achievementNameLocked]}>
              {achievement.name}
            </Text>
            {!achievement.unlocked && achievement.progress > 0 && (
              <View style={styles.miniProgress}>
                <View style={[styles.miniProgressFill, { width: `${achievement.progress}%` }]} />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* 退出登录 */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </Pressable>
    </ScrollView>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#34C759';
  if (score >= 60) return '#007AFF';
  if (score >= 40) return '#FF9500';
  return '#FF3B30';
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
  toggleLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
  info: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e8f4ff',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  levelCard: {
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  levelName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  totalXP: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },
  essayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  essayInfo: {
    flex: 1,
  },
  essayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  essayDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#999',
    marginBottom: 12,
  },
  achievementsRow: {
    marginBottom: 20,
  },
  achievementItem: {
    width: 90,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: '#999',
  },
  miniProgress: {
    width: 60,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  logoutButton: {
    marginTop: 20,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
