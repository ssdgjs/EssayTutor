import { PrismaClient, GradingResult } from '@prisma/client';
import { gradeEssay } from './ai.service';

const prisma = new PrismaClient();

// Job status types
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface GradingJob {
  id: string;
  essayId: string;
  userId: string;
  status?: JobStatus;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simple in-memory job queue (use Redis in production)
const jobQueue: Map<string, GradingJob> = new Map();
let isProcessing = false;

// Process queue
async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (true) {
    const pendingJobs = Array.from(jobQueue.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (pendingJobs.length === 0) {
      break;
    }

    const job = pendingJobs[0];
    console.log(`[Queue] Processing job ${job.id} for essay ${job.essayId}`);

    try {
      // Update job status to processing
      job.status = 'processing';
      job.updatedAt = new Date();
      jobQueue.set(job.id, job);

      // Get essay from database
      const essay = await prisma.essay.findUnique({
        where: { id: job.essayId }
      });

      if (!essay) {
        throw new Error('Essay not found');
      }

      // Get rubric
      const rubric = essay.rubricId ? await prisma.rubric.findUnique({
        where: { id: essay.rubricId }
      }) : null;

      // Parse rubric dimensions
      let rubricData = {};
      if (rubric && typeof rubric.dimensions === 'string') {
        try {
          rubricData = JSON.parse(rubric.dimensions);
        } catch (e) {
          console.error('Failed to parse rubric:', e);
        }
      }

      // Call AI grading
      const resultText = await gradeEssay(essay.content, rubricData);

      // Parse result
      let gradingResult;
      try {
        const jsonStr = resultText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        gradingResult = JSON.parse(jsonStr);
      } catch (parseError) {
        // Store raw result if parsing fails
        gradingResult = {
          overallScore: 0,
          overallFeedback: resultText,
          dimensionScores: [],
          strengths: [],
          improvements: []
        };
      }

      // Save grading result to database
      await prisma.gradingResult.create({
        data: {
          essayId: job.essayId,
          overallScore: gradingResult.overallScore || 0,
          maxScore: 100,
          dimensionScores: JSON.stringify(gradingResult.dimensionScores || []),
          strengths: JSON.stringify(gradingResult.strengths || []),
          improvements: JSON.stringify(gradingResult.improvements || []),
          comments: gradingResult.comments ? JSON.stringify(gradingResult.comments) : null,
          overallFeedback: gradingResult.overallFeedback || '',
          aiModel: 'glm-4.5-air',
          processingTime: Math.floor((Date.now() - job.createdAt.getTime()) / 1000),
        }
      });

      // Update essay status
      await prisma.essay.update({
        where: { id: job.essayId },
        data: { status: 'graded' }
      });

      // Update job status
      job.status = 'completed';
      job.result = gradingResult;
      job.updatedAt = new Date();
      jobQueue.set(job.id, job);

      console.log(`[Queue] Job ${job.id} completed successfully`);

    } catch (error: any) {
      console.error(`[Queue] Job ${job.id} failed:`, error.message);

      // Save failed result
      await prisma.gradingResult.create({
        data: {
          essayId: job.essayId,
          overallScore: 0,
          maxScore: 100,
          dimensionScores: '[]',
          strengths: '[]',
          improvements: '[]',
          overallFeedback: '',
          aiModel: 'glm-4.5-air',
          processingTime: Math.floor((Date.now() - job.createdAt.getTime()) / 1000),
        }
      });

      job.status = 'failed';
      job.error = error.message;
      job.updatedAt = new Date();
      jobQueue.set(job.id, job);
    }
  }

  isProcessing = false;
}

// Create a new grading job
export async function createGradingJob(essayId: string, userId: string): Promise<GradingJob> {
  const job: GradingJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    essayId,
    userId,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  jobQueue.set(job.id, job);

  // Trigger queue processing
  processQueue().catch(console.error);

  return job;
}

// Get job status
export async function getJobStatus(jobId: string): Promise<GradingJob | null> {
  // First check in-memory queue
  if (jobQueue.has(jobId)) {
    return jobQueue.get(jobId)!;
  }

  // If not in queue, check database
  const essay = await prisma.essay.findUnique({
    where: { id: jobId }
  });

  if (!essay) return null;

  const result = await prisma.gradingResult.findUnique({
    where: { essayId: jobId }
  });

  if (result) {
    return {
      id: jobId,
      essayId: jobId,
      userId: essay.userId,
      result: result,
      createdAt: essay.createdAt,
      updatedAt: result.createdAt,
    };
  }

  return {
    id: jobId,
    essayId: jobId,
    userId: essay.userId,
    createdAt: essay.createdAt,
    updatedAt: essay.updatedAt,
  };
}

// Get queue stats
export function getQueueStats() {
  const jobs = Array.from(jobQueue.values());
  return {
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };
}

export default {
  createGradingJob,
  getJobStatus,
  getQueueStats,
};
