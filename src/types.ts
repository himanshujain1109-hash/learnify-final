export type TeacherAvatarId = 'clara' | 'marcus' | 'maya' | 'alan';

export interface VisualElement {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  color?: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' | 'indigo' | 'cyan';
  icon?: string;
}

export interface VisualConnection {
  from: string;
  to: string;
  label?: string;
}

export interface VisualDiagram {
  type: 'flow' | 'comparison' | 'cycle' | 'hierarchy' | 'formula' | 'timeline' | 'key_metrics';
  title: string;
  elements: VisualElement[];
  connections?: VisualConnection[];
  summaryFootnote?: string;
}

export interface SlideBullet {
  id: string;
  heading: string;
  content: string;
  emphasis?: string;
  highlightKeyword?: string;
}

export interface ScriptSegment {
  text: string;
  focusBulletId?: string;
  teacherGesture: 'pointing' | 'explaining' | 'writing' | 'questioning' | 'nodding';
}

export interface CalloutBox {
  type: 'exam_tip' | 'mental_model' | 'definition' | 'common_mistake' | 'takeaway';
  title: string;
  text: string;
}

export interface LectureSlide {
  id: string;
  slideNumber: number;
  totalSlides: number;
  chapterTitle: string;
  topicTitle: string;
  subtitle: string;
  bullets: SlideBullet[];
  calloutBox?: CalloutBox;
  visualDiagram: VisualDiagram;
  blackboardSummarySnippet?: string;
  teacherScript: string;
  estimatedDurationSeconds: number;
  scriptSegments: ScriptSegment[];
}

export interface TeacherPersona {
  id: TeacherAvatarId;
  name: string;
  title: string;
  subjectExpertise: string;
  avatarColor: string;
  avatarStyle: TeacherAvatarId;
  toneDescription: string;
  voiceGender: 'female' | 'male';
  speechRate: number;
  speechPitch: number;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  category?: string;
}

export interface LectureData {
  id: string;
  title: string;
  subject: string;
  targetAudience: string;
  totalDurationSeconds: number;
  overviewSummary: string;
  slides: LectureSlide[];
  keyTermsGlossary: KeyTerm[];
  suggestedReviewQuestions: string[];
  quizzes?: QuizQuestion[];
  flashcards?: FlashcardItem[];
  language?: 'hindi' | 'English' | 'hinglish';
  level?: 'beginner' | 'intermediate' | 'advanced';
  voiceGender?: 'female' | 'male';
}

export type ClassroomTheme = 'blackboard' | 'whiteboard' | 'darkroom';

export type LectureSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;
