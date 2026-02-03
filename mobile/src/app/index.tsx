import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Card } from '../components/UI';

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AsseyTutor</Text>
        <Text style={styles.subtitle}>智能英文作文批改</Text>
      </View>
      
      <View style={styles.featuresContainer}>
        <Card style={styles.featureCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.featureIcon}>📝</Text>
          </View>
          <Text style={styles.featureTitle}>AI批改</Text>
          <Text style={styles.featureDesc}>智能多维度评分</Text>
        </Card>
        
        <Card style={styles.featureCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.featureIcon}>📸</Text>
          </View>
          <Text style={styles.featureTitle}>拍照识别</Text>
          <Text style={styles.featureDesc}>手写文字OCR</Text>
        </Card>
        
        <Card style={styles.featureCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.featureIcon}>📊</Text>
          </View>
          <Text style={styles.featureTitle}>详细反馈</Text>
          <Text style={styles.featureDesc}>词汇语法改进</Text>
        </Card>
      </View>

      <Link href="/essay" asChild>
        <Pressable style={styles.startButton}>
          <Text style={styles.startButtonText}>开始批改 →</Text>
        </Pressable>
      </Link>
      
      <Text style={styles.tip}>支持中英文写作批改</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 48,
    gap: 12,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 56,
    borderRadius: 28,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  tip: {
    marginTop: 24,
    fontSize: 13,
    color: '#999',
  },
});
