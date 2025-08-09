import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, initializeAdminUser } from "./auth";
import { 
  insertChildSchema, 
  insertGuardianSchema, 
  insertClassSchema, 
  insertNoteSchema,
  insertMessageTemplateSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize admin user
  await initializeAdminUser();
  
  // Auth middleware
  setupAuth(app);

  // Children routes
  app.get("/api/children", requireAuth, async (req, res) => {
    try {
      const children = await storage.getChildren();
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.get("/api/children/:id", requireAuth, async (req, res) => {
    try {
      const child = await storage.getChild(req.params.id);
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }
      res.json(child);
    } catch (error) {
      console.error("Error fetching child:", error);
      res.status(500).json({ message: "Failed to fetch child" });
    }
  });

  app.post("/api/children", requireAuth, async (req, res) => {
    try {
      const validatedData = insertChildSchema.parse(req.body);
      const child = await storage.createChild(validatedData);
      res.status(201).json(child);
    } catch (error) {
      console.error("Error creating child:", error);
      res.status(400).json({ message: "Invalid child data" });
    }
  });

  app.put("/api/children/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertChildSchema.partial().parse(req.body);
      const child = await storage.updateChild(req.params.id, validatedData);
      res.json(child);
    } catch (error) {
      console.error("Error updating child:", error);
      res.status(400).json({ message: "Invalid child data" });
    }
  });

  app.delete("/api/children/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteChild(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ message: "Failed to delete child" });
    }
  });

  // Guardian routes
  app.get("/api/guardians", requireAuth, async (req, res) => {
    try {
      const guardians = await storage.getGuardians();
      res.json(guardians);
    } catch (error) {
      console.error("Error fetching guardians:", error);
      res.status(500).json({ message: "Failed to fetch guardians" });
    }
  });

  app.get("/api/guardians/child/:childId", requireAuth, async (req, res) => {
    try {
      const guardians = await storage.getGuardiansByChild(req.params.childId);
      res.json(guardians);
    } catch (error) {
      console.error("Error fetching guardians:", error);
      res.status(500).json({ message: "Failed to fetch guardians" });
    }
  });

  app.post("/api/guardians", requireAuth, async (req, res) => {
    try {
      const validatedData = insertGuardianSchema.parse(req.body);
      const guardian = await storage.createGuardian(validatedData);
      res.status(201).json(guardian);
    } catch (error) {
      console.error("Error creating guardian:", error);
      res.status(400).json({ message: "Invalid guardian data" });
    }
  });

  // Classes routes
  app.get("/api/classes", requireAuth, async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertClassSchema.parse(req.body);
      const classData = await storage.createClass(validatedData);
      res.status(201).json(classData);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(400).json({ message: "Invalid class data" });
    }
  });

  // Attendance routes
  app.post("/api/attendance/class", requireAuth, async (req, res) => {
    try {
      const { classMeetingId, childId, status, observation } = req.body;
      const attendance = await storage.markClassAttendance(classMeetingId, childId, status, observation);
      res.json(attendance);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });

  app.post("/api/attendance/worship", requireAuth, async (req, res) => {
    try {
      const { worshipServiceId, childId, status, observation } = req.body;
      const attendance = await storage.markWorshipAttendance(worshipServiceId, childId, status, observation);
      res.json(attendance);
    } catch (error) {
      console.error("Error marking worship attendance:", error);
      res.status(500).json({ message: "Failed to mark worship attendance" });
    }
  });

  app.get("/api/attendance/consecutive-absences/:childId", requireAuth, async (req, res) => {
    try {
      const absences = await storage.getConsecutiveAbsences(req.params.childId, 5);
      res.json({ consecutiveAbsences: absences });
    } catch (error) {
      console.error("Error fetching consecutive absences:", error);
      res.status(500).json({ message: "Failed to fetch consecutive absences" });
    }
  });

  // Meditation routes
  app.get("/api/meditations/weeks", requireAuth, async (req, res) => {
    try {
      const weeks = await storage.getMeditationWeeks();
      res.json(weeks);
    } catch (error) {
      console.error("Error fetching meditation weeks:", error);
      res.status(500).json({ message: "Failed to fetch meditation weeks" });
    }
  });

  app.get("/api/meditations/current", requireAuth, async (req, res) => {
    try {
      const meditations = await storage.getCurrentWeekMeditations();
      res.json(meditations);
    } catch (error) {
      console.error("Error fetching current meditations:", error);
      res.status(500).json({ message: "Failed to fetch current meditations" });
    }
  });

  app.post("/api/meditations/status", requireAuth, async (req, res) => {
    try {
      const { childId, meditationWeekId, status, observation } = req.body;
      const delivery = await storage.updateMeditationStatus(childId, meditationWeekId, status, observation);
      res.json(delivery);
    } catch (error) {
      console.error("Error updating meditation status:", error);
      res.status(500).json({ message: "Failed to update meditation status" });
    }
  });

  // Verses routes
  app.get("/api/verses", requireAuth, async (req, res) => {
    try {
      const verses = await storage.getBibleVerses();
      res.json(verses);
    } catch (error) {
      console.error("Error fetching verses:", error);
      res.status(500).json({ message: "Failed to fetch verses" });
    }
  });

  app.get("/api/verses/memorizations", requireAuth, async (req, res) => {
    try {
      const memorizations = await storage.getVerseMemorizations();
      res.json(memorizations);
    } catch (error) {
      console.error("Error fetching memorizations:", error);
      res.status(500).json({ message: "Failed to fetch memorizations" });
    }
  });

  app.post("/api/verses/memorizations", requireAuth, async (req, res) => {
    try {
      const { childId, bibleVerseId, status, observation } = req.body;
      const memorization = await storage.updateVerseMemorization(childId, bibleVerseId, status, observation);
      res.json(memorization);
    } catch (error) {
      console.error("Error updating verse memorization:", error);
      res.status(500).json({ message: "Failed to update verse memorization" });
    }
  });

  // Notes routes
  app.get("/api/notes", requireAuth, async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/child/:childId", requireAuth, async (req, res) => {
    try {
      const notes = await storage.getNotesByChild(req.params.childId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching child notes:", error);
      res.status(500).json({ message: "Failed to fetch child notes" });
    }
  });

  app.post("/api/notes", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertNoteSchema.parse({ ...req.body, createdBy: userId });
      const note = await storage.createNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(400).json({ message: "Invalid note data" });
    }
  });

  // Message templates routes
  app.get("/api/message-templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getMessageTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching message templates:", error);
      res.status(500).json({ message: "Failed to fetch message templates" });
    }
  });

  app.post("/api/message-templates", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.createMessageTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating message template:", error);
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  // Message sends routes
  app.post("/api/messages/send", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { childId, guardianId, templateId, message } = req.body;
      const messageSend = await storage.logMessageSend(childId, guardianId, templateId, message, userId);
      res.json(messageSend);
    } catch (error) {
      console.error("Error logging message send:", error);
      res.status(500).json({ message: "Failed to log message send" });
    }
  });

  app.get("/api/messages/history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getMessageHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching message history:", error);
      res.status(500).json({ message: "Failed to fetch message history" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
