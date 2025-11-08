

export enum TopicStatus {
    NotStarted = 'Not Started',
    InProgress = 'In Progress',
    Completed = 'Completed',
    Revise = 'Revise'
}

// Sub-topic level
export interface Subtopic {
    name: string;
    status: TopicStatus;
    coachingStatus: TopicStatus;
}

// New: Major Topic level to group subtopics within a chapter
export interface MajorTopic {
    name:string;
    subtopics: Subtopic[];
}

// Chapter level progress details
export interface ChapterProgress {
    level1: boolean;
    level2: boolean;
    mains: boolean;
    advanced: boolean;
    pyqs: boolean;
    pyqsCount: number;
}

export interface Chapter {
    name: string;
    status: TopicStatus;
    coachingStatus: TopicStatus;
    progress: ChapterProgress;
    majorTopics: MajorTopic[]; // Changed from subtopics
}

// Subject structure
export interface ChemistrySection {
    name: 'Physical Chemistry' | 'Inorganic Chemistry' | 'Organic Chemistry';
    chapters: Chapter[];
}

export interface PhysicsSubject {
    name: 'Physics';
    chapters: Chapter[];
}

export interface ChemistrySubject {
    name: 'Chemistry';
    sections: ChemistrySection[];
}

export interface MathSubject {
    name: 'Math';
    chapters: Chapter[];
}

export type SubjectData = PhysicsSubject | ChemistrySubject | MathSubject;
export type SubjectName = 'Physics' | 'Chemistry' | 'Math';


// Test Tracking
export type TestType = 'JEE Mains' | 'JEE Advanced' | 'Board';

export interface TestSyllabusItem {
    subject: string;
    chapter: string;
}

export interface TestResult {
    id: string;
    name: string;
    date: string;
    type: TestType;
    marks: {
        physics: number;
        chemistry: number;
        math: number;
    };
    negativeMarks: {
        physics: number;
        chemistry: number;
        math: number;
    };
    totalMarks: number; // Max marks
    syllabus: TestSyllabusItem[];
    customSyllabus: string;
    analysisDone: boolean;
    feedback: string;
    learnings: string;
    testPdfFileId?: string;
    classRank?: number | null;
    testScope?: string;
}


// --- New Advanced Daily Planner Structure ---
export interface PlannedTopic {
    id: string;
    subject: SubjectName;
    chapterName: string;
    isFullChapter: boolean; // True if 'All Topics' is selected
    subtopicNames: string[];
    note: string;
    status: 'Pending' | 'Completed' | 'Incomplete';
    isCarriedOver?: boolean;
}

export interface HourlySlot {
    id: string;
    startTime: string;
    endTime: string;
    plannedTopicId: string | null; // Links to a topic, task, or lecture
    subject: SubjectName | null;
    status: 'Pending' | 'Completed' | 'Incomplete';
}

export interface DailyPlanTask {
    id: string;
    text: string;
    status: 'Pending' | 'Completed' | 'Incomplete';
    isCarriedOver?: boolean;
}

export interface QuestionsSolvedLog {
    id: string;
    subject: SubjectName;
    chapter: string;
    count: number;
    type: 'Basic' | 'Mains' | 'Advanced';
    source?: 'Module' | 'DPP' | 'Practice Sheet' | 'Lecture' | 'Other';
}

export interface DailyPlan {
    date: string; // YYYY-MM-DD
    subjectPlans: {
        Physics: PlannedTopic[];
        Chemistry: PlannedTopic[];
        Math: PlannedTopic[];
    };
    schedule: HourlySlot[];
    tasks: DailyPlanTask[];
    isReviewed: boolean; // To check if end-of-day review is done
    wakeUpTime: string; // e.g., "06:00"
    sleepTime: string; // e.g., "23:00"
    dailyMood?: number | null; // 1-5, similar to wellness log mood
    questionsSolved: QuestionsSolvedLog[];
}

export interface Lecture {
    id: string;
    title: string;
    url: string;
    videoId: string;
    subject: SubjectName;
    chapter: string;
    category: 'Question Practice' | 'Theory' | 'Concepts' | 'Other';
    dateAdded: string; // ISO string
}


export interface CalendarEvent {
    id:string;
    date: string; // YYYY-MM-DD
    title: string;
    time?: string; // Optional time for the event
    type: 'test' | 'revision' | 'study' | 'other';
}

export interface UpcomingTest {
    id: string;
    name: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    type: TestType;
    totalMarks: number;
    targetMarks: number;
    syllabus: TestSyllabusItem[];
    customSyllabus: string;
    testScope?: string;
}

// New Wellness Log type
export interface WellnessLog {
    date: string; // YYYY-MM-DD
    mood: number; // 1-5 (e.g., 1: Terrible, 5: Great)
    sleepHours: number;
    journal?: string;
}

// --- New Doubt Journal Type ---
export interface Doubt {
    id: string;
    subject: SubjectName;
    topic: string; // Could be a chapter or a subtopic name
    description: string;
    date: string; // YYYY-MM-DD
    status: 'Cleared' | 'Still Confusing';
    context?: string; // e.g., From Prof. X's class
}


// --- Gamification Types ---
export interface Achievement {
    id: string; // e.g., 'consistency-king'
    name: string;
    description: string;
    unlockedDate: string; // ISO string
    icon: string;
}

export type ChallengeType = 'study_hours' | 'completed_topics' | 'questions_solved';
export type ChallengeStatus = 'active' | 'completed' | 'failed';

export interface StudyChallenge {
    id: string;
    title: string;
    type: ChallengeType;
    goal: number;
    current: number;
    unit: string; // 'hours' or 'topics' or 'questions'
    durationDays: number;
    startDate: string; // ISO string
    endDate: string; // ISO string
    status: ChallengeStatus;
}

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export interface Rank {
    name: string; // 'Explorer I'
    level: number; // 1-12
    score: number; // The performance score (0-100)
    tier: RankTier;
}

// Teacher type with photo
export interface Teacher {
    name: string;
    photoUrl: string;
}


// --- NEW Coaching Log Types ---
export type CoachingActivityType = 'lecture' | 'test' | 'other';

export interface CoachingLecture {
    id: string;
    type: 'lecture';
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    subject: SubjectName;
    teacher: string; // Teacher's name
    category: 'Theory' | 'Concepts' | 'Questions' | 'Doubt' | 'Motivation/Strategies' | 'Combined' | 'Other';
    chapter: string;
    subtopicsTaught: string[];
    remarks: string;
    rating: number; // 1-5
    homework: string;
    doubts: string;
}

export interface CoachingTestActivity {
    id: string;
    type: 'test';
    upcomingTestId: string | null; // Link to an upcoming test
    testResultId: string | null; // Link to a test from history
    testName: string; // A custom name if not linked
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
}

export interface CoachingOtherActivity {
    id: string;
    type: 'other';
    description: string;
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
}


export type CoachingLogActivity = CoachingLecture | CoachingTestActivity | CoachingOtherActivity;

export interface CoachingLog {
    date: string; // YYYY-MM-DD
    activities: CoachingLogActivity[];
    motivation: number; // 1-5
}

// --- NEW Document Type ---
export interface Document {
    id: string;
    name: string;
    driveFileId: string;
    mimeType: string;
    type: 'Notes' | 'Test Paper' | 'Question Bank' | 'Other';
    subject: SubjectName | 'Other';
    chapter?: string;
    description?: string;
    dateAdded: string; // ISO string
}

// Main User Object
export interface User {
    uid: string;
    email: string;
    displayName: string;
    studyStreak: number;
    lastLogin: string;
    topics: {
        physics: PhysicsSubject;
        chemistry: ChemistrySubject;
        math: MathSubject;
    };
    tests: TestResult[];
    upcomingTests: UpcomingTest[];
    notes: string;
    dailyPlans: DailyPlan[];
    lectures: Lecture[];
    events: CalendarEvent[];
    dailyQuote: {
        quote: string;
        date: string;
    };
    wellnessLogs: WellnessLog[];
    doubts: Doubt[];
    teachers: Teacher[];
    coachingLogs: CoachingLog[];
    documents: Document[];
    driveFolderId?: string;
    driveServiceAccountCreds?: any;
    prepStartDate: string; // ISO String
    examDate: string; // ISO string
    // Gamification
    achievements: Achievement[];
    challenges: StudyChallenge[];
    rank: Rank;
    lastRankUpdate: string; // ISO string
    personalBestStudyHours: number;
}

export type AppView = 'dashboard' | 'topics' | 'tests' | 'lectures' | 'notes' | 'reports' | 'coaching';


// --- NEW Report-specific types ---
export interface ReportHourlySlot extends HourlySlot {
    activityName: string;
    activityType: 'topic' | 'task' | 'activity' | 'free' | 'lecture' | 'coaching';
}

export interface DailyBreakdownItem {
    date: string; // YYYY-MM-DD
    studyHours: number;
    coachingHours: number;
    efficiency: number | null;
    completedTopics: { subject: SubjectName; name: string }[];
    completedTasks: string[];
    schedule: ReportHourlySlot[];
    wellness: WellnessLog | null;
    dailyMood: number | null;
    questionsSolved: QuestionsSolvedLog[];
    coachingActivities: CoachingLogActivity[];
};

export interface ChapterReportDetails {
    questionCount: { Basic: number; Mains: number; Advanced: number; total: number; bySource: { [key: string]: number } };
    testCount: number;
    coachingLectures: CoachingLecture[];
    studyHours: number;
}

export interface TeacherReportDetails {
    name: string;
    hours: number;
    lectureCount: number;
    avgRating: number;
}

export interface TestReportData {
    highestScore: number;
    averageScore: number;
    averageNegative: number;
    totalTests: number;
    performanceData: {
        date: string;
        name: string;
        Total: number;
        Negative: number;
        Rank?: number | null;
    }[];
}

export interface ReportData {
    title: string;
    dateRange: string;
    totalStudyHours: number;
    totalCoachingHours: number;
    avgEfficiency: number | null;
    studyHoursBySubject: { subject: SubjectName; hours: number }[];
    completedTopicsCount: number;
    completedTasksCount: number;
    totalQuestionsSolved: number;
    questionsBySubject: { subject: SubjectName; count: number}[];
    questionsByType: { type: string; count: number}[];
    questionsBySource: { source: string; count: number}[];
    testsTaken: TestResult[];
    wellnessSummary: { avgMood: number | null; avgSleep: number | null };
    challenges: StudyChallenge[];
    dailyBreakdown: DailyBreakdownItem[];
    // NEW FIELDS
    chapterAnalysis: Map<string, ChapterReportDetails>; // Key: "Subject:ChapterName"
    coachingInsights: {
        teacherData: TeacherReportDetails[];
        categoryDistribution: { name: string; value: number }[];
        moodCorrelation: { date: string; motivation?: number; mood?: number }[];
        assignedHomework: { date: string, task: string, teacher: string }[];
    };
    doubtsBySubject: { subject: SubjectName; count: number }[];
    doubtResolution: { name: string; value: number }[];
    timeDistribution: { name: string; hours: number }[];
    testAnalysis: TestReportData;
};