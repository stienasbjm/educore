export type SectionId = "listening" | "structure" | "reading";

export type StudentProfile = {
  nim: string;
  name: string;
  program: string;
  cohort: string;
  goal: string;
  whatsapp: string;
  email: string;
};

export type Question = {
  id: string;
  section: SectionId;
  prompt: string;
  choices: string[];
  context?: string;
  correctChoice?: number;
};

export type DemoAttempt = {
  id: string;
  profile: StudentProfile;
  token: string;
  section: SectionId;
  questionIndex: number;
  answers: Record<string, number>;
  flagged: string[];
  deadlines: Partial<Record<SectionId, number>>;
  startedAt: number;
  status: "in_progress" | "completed";
  proctorCalled?: boolean;
  result?: { listening: number; structure: number; reading: number; total: number; passed: boolean };
};

export type DemoToken = {
  value: string;
  expiresAt: number;
  capacity: number;
  used: number;
  active: boolean;
};

export const sections: { id: SectionId; name: string; shortName: string; questions: number; minutes: number }[] = [
  { id: "listening", name: "Listening Comprehension", shortName: "Listening", questions: 50, minutes: 35 },
  { id: "structure", name: "Structure & Written Expression", shortName: "Structure", questions: 40, minutes: 25 },
  { id: "reading", name: "Reading Comprehension", shortName: "Reading", questions: 50, minutes: 55 },
];

export const demoQuestions: Question[] = [
  {
    id: "L1",
    section: "listening",
    prompt: "What does the woman imply about the seminar?",
    choices: ["It has been moved to another day.", "It will be held in the main library.", "She has already registered for it.", "The speaker will arrive late."],
    correctChoice: 0,
  },
  { id: "L2", section: "listening", prompt: "What will the man probably do next?", choices: ["Call the department office.", "Borrow a different textbook.", "Meet the woman after class.", "Submit his report online."], correctChoice: 2 },
  {
    id: "L3",
    section: "listening",
    prompt: "Why is the woman unable to attend the meeting?",
    choices: ["She has an examination at that time.", "She needs to finish a research paper.", "She is waiting for a campus visitor.", "She has already left the university."],
    correctChoice: 1,
  },
  {
    id: "L4",
    section: "listening",
    prompt: "What does the man suggest?",
    choices: ["Taking the earlier bus.", "Reserving a study room.", "Asking the professor for an extension.", "Checking the schedule again tomorrow."],
    correctChoice: 2,
  },
  {
    id: "L5",
    section: "listening",
    prompt: "What can be inferred about the lecture?",
    choices: ["It was shorter than expected.", "It will be repeated next week.", "It covered material from the reading.", "It was cancelled because of the weather."],
    correctChoice: 2,
  },
  { id: "S1", section: "structure", prompt: "The committee ____ its final decision before the end of the week.", choices: ["announce", "announcing", "will announce", "to announce"], correctChoice: 2 },
  { id: "S2", section: "structure", prompt: "The new laboratory, ____ last year, serves students from three departments.", choices: ["complete", "completed", "was completing", "it completed"], correctChoice: 1 },
  {
    id: "S3",
    section: "structure",
    prompt: "Only after the report was published ____ the full impact of the policy.",
    choices: ["researchers understood", "did researchers understand", "researchers had understood", "they understood"],
    correctChoice: 1,
  },
  { id: "S4", section: "structure", prompt: "The lecturer recommended that each student ____ the article in advance.", choices: ["reads", "read", "reading", "to read"], correctChoice: 1 },
  { id: "S5", section: "structure", prompt: "Despite ____ several revisions, the proposal still needs clarification.", choices: ["receive", "received", "receiving", "to receive"], correctChoice: 2 },
  {
    id: "R1",
    section: "reading",
    prompt: "According to the passage, why did the university establish the archive?",
    context:
      "In 2018, a regional university began collecting oral histories from local business owners. The archive was designed to preserve first-hand accounts of how trade changed as the city expanded. Students now use the recordings as primary sources in courses on economics and regional history.",
    choices: ["To replace traditional economics textbooks", "To preserve accounts of changes in local trade", "To advertise the university to local businesses", "To record lectures for distance-learning students"],
    correctChoice: 1,
  },
  {
    id: "R2",
    section: "reading",
    prompt: "The word “primary” in the passage is closest in meaning to",
    context:
      "In 2018, a regional university began collecting oral histories from local business owners. The archive was designed to preserve first-hand accounts of how trade changed as the city expanded. Students now use the recordings as primary sources in courses on economics and regional history.",
    choices: ["original", "important", "popular", "simple"],
    correctChoice: 0,
  },
  {
    id: "R3",
    section: "reading",
    prompt: "What can be inferred about the recordings?",
    context:
      "In 2018, a regional university began collecting oral histories from local business owners. The archive was designed to preserve first-hand accounts of how trade changed as the city expanded. Students now use the recordings as primary sources in courses on economics and regional history.",
    choices: ["They contain information unavailable in official documents.", "They were produced by economics students.", "They describe trade in several different countries.", "They are no longer used in university courses."],
    correctChoice: 0,
  },
  {
    id: "R4",
    section: "reading",
    prompt: "The passage is primarily about",
    context:
      "In 2018, a regional university began collecting oral histories from local business owners. The archive was designed to preserve first-hand accounts of how trade changed as the city expanded. Students now use the recordings as primary sources in courses on economics and regional history.",
    choices: ["a method for teaching oral communication", "a collection that documents regional economic history", "the expansion of a university campus", "a study comparing business owners"],
    correctChoice: 1,
  },
  {
    id: "R5",
    section: "reading",
    prompt: "How do students use the archive?",
    context:
      "In 2018, a regional university began collecting oral histories from local business owners. The archive was designed to preserve first-hand accounts of how trade changed as the city expanded. Students now use the recordings as primary sources in courses on economics and regional history.",
    choices: ["As primary material in two subject areas", "As a guide to starting a local business", "To prepare official city trade reports", "To compare recordings with textbooks"],
    correctChoice: 0,
  },
];

export const sampleProfile = (nim: string): StudentProfile => ({
  nim,
  name: nim === "2110112044" ? "Muhammad Farhan Kurniawan" : "Peserta Ujian STIENAS",
  program: "S1 Manajemen Bisnis & Keuangan",
  cohort: "2021",
  goal: "Syarat Sidang Skripsi / Yudisium",
  whatsapp: "",
  email: "",
});

export const sectionFor = (id: SectionId) => sections.find((section) => section.id === id)!;
