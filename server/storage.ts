import {
  users,
  children,
  guardians,
  childrenGuardians,
  classes,
  classMeetings,
  worshipServices,
  classAttendance,
  worshipAttendance,
  meditationWeeks,
  meditationDeliveries,
  bibleVerses,
  verseMemorizations,
  notes,
  messageTemplates,
  messageSends,
  auditLogs,
  type User,
  type InsertUser,
  type Child,
  type InsertChild,
  type Guardian,
  type InsertGuardian,
  type Class,
  type InsertClass,
  type Note,
  type InsertNote,
  type MessageTemplate,
  type InsertMessageTemplate,
  type ClassAttendance,
  type WorshipAttendance,
  type MeditationDelivery,
  type VerseMemorization,
  type MessageSend,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Children operations
  getChildren(): Promise<Child[]>;
  getChildrenByClass(classId: string): Promise<Child[]>;
  getChild(id: string): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: string, child: Partial<InsertChild>): Promise<Child>;
  deleteChild(id: string): Promise<void>;

  // Guardian operations
  getGuardians(): Promise<Guardian[]>;
  getGuardiansByChild(childId: string): Promise<Guardian[]>;
  createGuardian(guardian: InsertGuardian): Promise<Guardian>;
  updateGuardian(id: string, guardian: Partial<InsertGuardian>): Promise<Guardian>;
  deleteGuardian(id: string): Promise<void>;

  // Class operations
  getClasses(): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(id: string): Promise<void>;

  // Attendance operations
  getClassAttendanceByDate(date: string): Promise<ClassAttendance[]>;
  getWorshipAttendanceByDate(date: string): Promise<WorshipAttendance[]>;
  markClassAttendance(classMeetingId: string, childId: string, status: string, observation?: string): Promise<ClassAttendance>;
  markWorshipAttendance(worshipServiceId: string, childId: string, status: string, observation?: string): Promise<WorshipAttendance>;
  getConsecutiveAbsences(childId: string, limit: number): Promise<number>;

  // Meditation operations
  getMeditationWeeks(): Promise<any[]>;
  getCurrentWeekMeditations(): Promise<MeditationDelivery[]>;
  updateMeditationStatus(childId: string, meditationWeekId: string, status: string, observation?: string): Promise<MeditationDelivery>;

  // Verse operations
  getBibleVerses(): Promise<any[]>;
  getVerseMemorizations(): Promise<VerseMemorization[]>;
  updateVerseMemorization(childId: string, bibleVerseId: string, status: string, observation?: string): Promise<VerseMemorization>;

  // Notes operations
  getNotes(): Promise<Note[]>;
  getNotesByChild(childId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note>;
  deleteNote(id: string): Promise<void>;

  // Message operations
  getMessageTemplates(): Promise<MessageTemplate[]>;
  getMessageTemplate(id: string): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  logMessageSend(childId: string, guardianId: string, templateId: string, message: string, sentBy: string): Promise<MessageSend>;
  getMessageHistory(): Promise<MessageSend[]>;

  // Dashboard stats
  getDashboardStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Children operations
  async getChildren(): Promise<Child[]> {
    return await db.select().from(children).orderBy(children.fullName);
  }

  async getChildrenByClass(classId: string): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.classId, classId)).orderBy(children.fullName);
  }

  async getChild(id: string): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }

  async updateChild(id: string, child: Partial<InsertChild>): Promise<Child> {
    const [updatedChild] = await db
      .update(children)
      .set({ ...child, updatedAt: new Date() })
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  async deleteChild(id: string): Promise<void> {
    await db.delete(children).where(eq(children.id, id));
  }

  // Guardian operations
  async getGuardians(): Promise<Guardian[]> {
    return await db.select().from(guardians).orderBy(guardians.fullName);
  }

  async getGuardiansByChild(childId: string): Promise<Guardian[]> {
    return await db
      .select({
        id: guardians.id,
        fullName: guardians.fullName,
        relationship: guardians.relationship,
        phoneWhatsApp: guardians.phoneWhatsApp,
        email: guardians.email,
        contactAuthorization: guardians.contactAuthorization,
        createdAt: guardians.createdAt,
      })
      .from(guardians)
      .innerJoin(childrenGuardians, eq(guardians.id, childrenGuardians.guardianId))
      .where(eq(childrenGuardians.childId, childId));
  }

  async createGuardian(guardian: InsertGuardian): Promise<Guardian> {
    const [newGuardian] = await db.insert(guardians).values(guardian).returning();
    return newGuardian;
  }

  async updateGuardian(id: string, guardian: Partial<InsertGuardian>): Promise<Guardian> {
    const [updatedGuardian] = await db
      .update(guardians)
      .set(guardian)
      .where(eq(guardians.id, id))
      .returning();
    return updatedGuardian;
  }

  async deleteGuardian(id: string): Promise<void> {
    await db.delete(guardians).where(eq(guardians.id, id));
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes).orderBy(classes.name);
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(classData).returning();
    return newClass;
  }

  async updateClass(id: string, classData: Partial<InsertClass>): Promise<Class> {
    const [updatedClass] = await db
      .update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return updatedClass;
  }

  async deleteClass(id: string): Promise<void> {
    await db.delete(classes).where(eq(classes.id, id));
  }

  // Attendance operations
  async getClassAttendanceByDate(date: string): Promise<ClassAttendance[]> {
    return await db
      .select()
      .from(classAttendance)
      .innerJoin(classMeetings, eq(classAttendance.classMeetingId, classMeetings.id))
      .where(eq(classMeetings.date, date));
  }

  async getWorshipAttendanceByDate(date: string): Promise<WorshipAttendance[]> {
    return await db
      .select()
      .from(worshipAttendance)
      .innerJoin(worshipServices, eq(worshipAttendance.worshipServiceId, worshipServices.id))
      .where(eq(worshipServices.date, date));
  }

  async markClassAttendance(classMeetingId: string, childId: string, status: string, observation?: string): Promise<ClassAttendance> {
    const [attendance] = await db
      .insert(classAttendance)
      .values({
        classMeetingId,
        childId,
        status,
        observation,
      })
      .onConflictDoUpdate({
        target: [classAttendance.classMeetingId, classAttendance.childId],
        set: { status, observation, createdAt: new Date() },
      })
      .returning();
    return attendance;
  }

  async markWorshipAttendance(worshipServiceId: string, childId: string, status: string, observation?: string): Promise<WorshipAttendance> {
    const [attendance] = await db
      .insert(worshipAttendance)
      .values({
        worshipServiceId,
        childId,
        status,
        observation,
      })
      .onConflictDoUpdate({
        target: [worshipAttendance.worshipServiceId, worshipAttendance.childId],
        set: { status, observation, createdAt: new Date() },
      })
      .returning();
    return attendance;
  }

  async getConsecutiveAbsences(childId: string, limit: number): Promise<number> {
    const recentAttendance = await db
      .select()
      .from(classAttendance)
      .where(eq(classAttendance.childId, childId))
      .orderBy(desc(classAttendance.createdAt))
      .limit(limit);

    let consecutiveAbsences = 0;
    for (const attendance of recentAttendance) {
      if (attendance.status === 'ausente') {
        consecutiveAbsences++;
      } else {
        break;
      }
    }
    return consecutiveAbsences;
  }

  // Meditation operations
  async getMeditationWeeks(): Promise<any[]> {
    return await db.select().from(meditationWeeks).orderBy(desc(meditationWeeks.weekReference));
  }

  async getCurrentWeekMeditations(): Promise<MeditationDelivery[]> {
    return await db.select().from(meditationDeliveries).orderBy(desc(meditationDeliveries.createdAt));
  }

  async updateMeditationStatus(childId: string, meditationWeekId: string, status: string, observation?: string): Promise<MeditationDelivery> {
    const [delivery] = await db
      .insert(meditationDeliveries)
      .values({
        childId,
        meditationWeekId,
        status,
        observation,
        deliveryDate: status === 'entregou' ? new Date().toISOString().split('T')[0] : null,
      })
      .onConflictDoUpdate({
        target: [meditationDeliveries.childId, meditationDeliveries.meditationWeekId],
        set: { 
          status, 
          observation, 
          deliveryDate: status === 'entregou' ? new Date().toISOString().split('T')[0] : null,
          updatedAt: new Date() 
        },
      })
      .returning();
    return delivery;
  }

  // Verse operations
  async getBibleVerses(): Promise<any[]> {
    return await db.select().from(bibleVerses).orderBy(bibleVerses.reference);
  }

  async getVerseMemorizations(): Promise<VerseMemorization[]> {
    return await db.select().from(verseMemorizations).orderBy(desc(verseMemorizations.createdAt));
  }

  async updateVerseMemorization(childId: string, bibleVerseId: string, status: string, observation?: string): Promise<VerseMemorization> {
    const [memorization] = await db
      .insert(verseMemorizations)
      .values({
        childId,
        bibleVerseId,
        status,
        observation,
      })
      .onConflictDoUpdate({
        target: [verseMemorizations.childId, verseMemorizations.bibleVerseId],
        set: { status, observation, updatedAt: new Date() },
      })
      .returning();
    return memorization;
  }

  // Notes operations
  async getNotes(): Promise<Note[]> {
    return await db.select().from(notes).orderBy(desc(notes.createdAt));
  }

  async getNotesByChild(childId: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.childId, childId)).orderBy(desc(notes.createdAt));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note> {
    const [updatedNote] = await db
      .update(notes)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Message operations
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    return await db.select().from(messageTemplates).where(eq(messageTemplates.isActive, true)).orderBy(messageTemplates.category);
  }

  async getMessageTemplate(id: string): Promise<MessageTemplate | undefined> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template;
  }

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const [newTemplate] = await db.insert(messageTemplates).values(template).returning();
    return newTemplate;
  }

  async logMessageSend(childId: string, guardianId: string, templateId: string, message: string, sentBy: string): Promise<MessageSend> {
    const [messageSend] = await db
      .insert(messageSends)
      .values({
        childId,
        guardianId,
        messageTemplateId: templateId,
        generatedMessage: message,
        sentBy,
      })
      .returning();
    return messageSend;
  }

  async getMessageHistory(): Promise<MessageSend[]> {
    return await db.select().from(messageSends).orderBy(desc(messageSends.sentAt));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    // This would implement complex queries for dashboard statistics
    // For now, returning a basic structure
    return {
      classAttendancePercentage: 87,
      worshipAttendancePercentage: 72,
      meditationsDelivered: 23,
      totalMeditations: 35,
      versesMemorized: 18,
      totalVerses: 35,
    };
  }
}

export const storage = new DatabaseStorage();
