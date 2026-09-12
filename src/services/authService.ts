// Google Authentication & Persistent Storage Service for VidLecture AI
import { LectureData } from '../types';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
}

const STORAGE_AUTH_KEY = 'vidlecture_google_user';
const STORAGE_LECTURES_PREFIX = 'vidlecture_user_lectures_';
const STORAGE_GUEST_LECTURES_KEY = 'vidlecture_guest_lectures';

class AuthService {
  private currentUser: GoogleUserProfile | null = null;
  private listeners: Array<(user: GoogleUserProfile | null) => void> = [];

  constructor() {
    this.loadPersistedUser();
  }

  private loadPersistedUser() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      } else {
        this.currentUser = null;
      }
    } catch (e) {
      console.warn('Could not parse persisted user session:', e);
      this.currentUser = null;
    }
  }

  public subscribe(callback: (user: GoogleUserProfile | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  public getCurrentUser(): GoogleUserProfile | null {
    return this.currentUser;
  }

  // Google Sign-In or Sign-Up
  public async signInWithGoogle(customEmail?: string, customName?: string): Promise<GoogleUserProfile> {
    const email = customEmail?.trim() || 'student@gmail.com';
    const name = customName?.trim() || (email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    // Deterministic pleasant avatar based on email initials
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0284c7,10b981,8b5cf6,f59e0b`;

    const user: GoogleUserProfile = {
      id: `google_${btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`,
      email,
      name,
      avatarUrl,
      createdAt: new Date().toISOString(),
    };

    this.currentUser = user;
    try {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
    } catch (err) {
      console.warn('Could not save user to localStorage:', err);
    }

    this.notify();
    return user;
  }

  public signOut(): void {
    this.currentUser = null;
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    } catch (err) {
      console.warn('Could not remove user from localStorage:', err);
    }
    this.notify();
  }

  // Persistent Lecture Storage for Future Access
  public getSavedLectures(): LectureData[] {
    if (typeof window === 'undefined') return [];
    try {
      const key = this.currentUser
        ? `${STORAGE_LECTURES_PREFIX}${this.currentUser.id}`
        : STORAGE_GUEST_LECTURES_KEY;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Normalize and filter out any corrupted entries without slides
          return parsed
            .map((item: any) => {
              if (item?.lecture?.slides && Array.isArray(item.lecture.slides)) {
                return item.lecture;
              }
              return item;
            })
            .filter((item: any) => item && Array.isArray(item.slides) && item.slides.length > 0);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved lectures:', e);
    }
    return [];
  }

  public saveLecture(lecture: LectureData): void {
    if (typeof window === 'undefined') return;
    try {
      // Unpack if wrapped
      const actualLecture = ((lecture as any)?.lecture?.slides ? (lecture as any).lecture : lecture) as LectureData;
      if (!actualLecture || !Array.isArray(actualLecture.slides) || actualLecture.slides.length === 0) {
        console.warn('Cannot save invalid lecture without slides:', actualLecture);
        return;
      }

      const key = this.currentUser
        ? `${STORAGE_LECTURES_PREFIX}${this.currentUser.id}`
        : STORAGE_GUEST_LECTURES_KEY;

      const currentLectures = this.getSavedLectures();
      const existingIdx = currentLectures.findIndex(l => l.id === actualLecture.id);

      let updated: LectureData[];
      if (existingIdx >= 0) {
        updated = [...currentLectures];
        updated[existingIdx] = actualLecture;
      } else {
        updated = [actualLecture, ...currentLectures];
      }

      // Limit stored lectures to recent 30 to avoid localStorage quota limit
      const trimmed = updated.slice(0, 30);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save lecture:', e);
    }
  }

  public deleteLecture(lectureId: string): LectureData[] {
    if (typeof window === 'undefined') return [];
    try {
      const key = this.currentUser
        ? `${STORAGE_LECTURES_PREFIX}${this.currentUser.id}`
        : STORAGE_GUEST_LECTURES_KEY;

      const currentLectures = this.getSavedLectures();
      const updated = currentLectures.filter(l => l.id !== lectureId);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Failed to delete lecture:', e);
      return [];
    }
  }
}

export const authService = new AuthService();
