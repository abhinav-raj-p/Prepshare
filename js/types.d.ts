// TypeScript interfaces for PrepShare (MCA Ace)

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  profileImage: string; // Dynamic initial-based dataURL/SVG or Google avatar URL
  isActive: boolean;
  isDeleted?: boolean;
  createdAt: any; // Server Timestamp
  updatedAt: any; // Server Timestamp
  lastLoginAt: any; // Server Timestamp
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  bannerUrl: string;
  price: number;
  discountPrice: number;
  category: string;
  tags: string[];
  isPublished: boolean;
  isDeleted: boolean;
  totalModules: number;
  totalLessons: number;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  isDeleted: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Topic {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  order: number;
  isDeleted: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  topicId: string;
  title: string;
  description: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  durationSeconds: number;
  isFreePreview: boolean;
  resources: string[]; // List of Cloudinary asset URLs
  order: number;
  isDeleted: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Enrollment {
  id: string; // Format: userId_courseId
  userId: string;
  courseId: string;
  paymentRequestId: string;
  status: 'active' | 'cancelled' | 'expired';
  enrolledAt: any;
  createdAt: any;
  updatedAt: any;
}

export interface LessonProgress {
  id: string; // Format: userId_lessonId
  userId: string;
  courseId: string;
  lessonId: string;
  watchSeconds: number;
  completionPercent: number;
  isCompleted: boolean;
  lastPositionSeconds: number;
  lastWatchedAt: any;
  createdAt: any;
  updatedAt: any;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  passingScore: number;
  isDeleted: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index in options array
  order: number;
  createdAt: any;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  answers: Record<string, number>; // Question ID -> Chosen Option Index
  attemptedAt: any;
  createdAt: any;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  utrNumber: string;
  screenshotUrl: string; // Cloudinary URL
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string; // Admin User ID
  reviewedAt?: any;
  submittedAt: any;
  createdAt: any;
  updatedAt: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  courseId?: string; // Optional (if targeted at a specific course)
  isDeleted: boolean;
  createdAt: any;
  updatedAt: any;
}
