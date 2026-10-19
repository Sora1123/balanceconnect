import { describe, it, expect } from 'vitest';
import { COURSES, COURSE_BY_ID, seed, defaults } from '../src/lib/state.js';

describe('HIPPOCAMPUS course catalogue', () => {
  it('matches the published lesson durations and fees', () => {
    const want = {
      children: { mins: 45, fee: 55 },
      everyday: { mins: 60, fee: 75 },
      business: { mins: 70, fee: 90 },
      preschool: { mins: 45, fee: 55 },
      primary: { mins: 60, fee: 75 },
      secondary: { mins: 70, fee: 85 },
      ibdp: { mins: 80, fee: 120 },
    };
    for (const [id, exp] of Object.entries(want)) {
      const c = COURSE_BY_ID[id];
      expect(c, `course ${id} exists`).toBeTruthy();
      expect(c.mins, `${id} duration`).toBe(exp.mins);
      expect(c.fee, `${id} fee`).toBe(exp.fee);
    }
  });

  it('groups courses into Non-native and Native tracks', () => {
    const tracks = new Set(COURSES.map((c) => c.track));
    expect(tracks.has('Non-native')).toBe(true);
    expect(tracks.has('Native')).toBe(true);
  });

  it('every course has a name and a short description', () => {
    for (const c of COURSES) {
      expect(typeof c.name).toBe('string');
      expect(c.name.length).toBeGreaterThan(0);
      expect(typeof c.desc).toBe('string');
      expect(c.desc.length).toBeGreaterThan(0);
    }
  });
});

describe('HIPPOCAMPUS demo seed', () => {
  it('names the teacher Mika and brands the subject HIPPOCAMPUS', () => {
    const d = defaults();
    expect(d.name).toBe('Mika');
    expect(d.subject).toMatch(/HIPPOCAMPUS/);
  });

  it('seeds students across real course types, each linked to the catalogue', () => {
    const S = seed();
    expect(S.students.length).toBeGreaterThanOrEqual(5);
    const linkedCourseIds = new Set(S.students.map((s) => s.courseId).filter(Boolean));
    // At least one native-track and one non-native-track learner.
    const tracks = new Set([...linkedCourseIds].map((id) => COURSE_BY_ID[id]?.track));
    expect(tracks.has('Native')).toBe(true);
    expect(tracks.has('Non-native')).toBe(true);
    // Every linked courseId resolves to a real catalogue entry.
    for (const id of linkedCourseIds) expect(COURSE_BY_ID[id]).toBeTruthy();
  });

  it('seeds lessons whose durations are plausible for their courses', () => {
    const S = seed();
    expect(S.lessons.length).toBeGreaterThan(0);
    // There should be at least one short (children/preschool) and one long (IBDP) style lesson.
    const durs = S.lessons.map((l) => {
      const [sh, sm] = l.s.split(':').map(Number);
      const [eh, em] = l.e.split(':').map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    });
    expect(Math.min(...durs)).toBeLessThanOrEqual(45);
    expect(Math.max(...durs)).toBeGreaterThanOrEqual(80);
  });
});
