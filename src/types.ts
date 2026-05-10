export interface FrequencyRow {
  id: string;
  lower: number;
  upper: number;
  freq: number;
}

export interface StudentProfile {
  name: string;
  grade: string;
  role: 'student' | 'teacher';
  createdAt: any;
}

export interface Submission {
  id?: string;
  studentId: string;
  studentName: string;
  grade: string;
  score: number;
  details?: {
    isMeanCorrect: boolean;
    isMedianCorrect: boolean;
  };
  data: {
    rows: FrequencyRow[];
    results: any;
  };
  createdAt: any;
}
