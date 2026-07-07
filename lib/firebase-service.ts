import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc 
} from "firebase/firestore";
import { Project } from "./initial-projects";

// Sanitizes objects to prevent Firestore errors on "undefined" values
function sanitizeForFirestore(obj: any): any {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      return value === undefined ? null : value;
    })
  );
}

export async function getDbProjects(): Promise<Project[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "projects"));
    const projects: Project[] = [];
    querySnapshot.forEach((docSnap) => {
      projects.push(docSnap.data() as Project);
    });
    return projects;
  } catch (error) {
    console.error("Error fetching projects from Firestore:", error);
    throw error;
  }
}

export async function saveDbProject(project: Project): Promise<void> {
  try {
    const docRef = doc(db, "projects", project.id);
    const sanitized = sanitizeForFirestore(project);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error(`Error saving project ${project.id} to Firestore:`, error);
    throw error;
  }
}

export async function deleteDbProject(projectId: string): Promise<void> {
  try {
    const docRef = doc(db, "projects", projectId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting project ${projectId} from Firestore:`, error);
    throw error;
  }
}

export async function getDbSettings(): Promise<any> {
  try {
    const docSnap = await getDoc(doc(db, "settings", "user_config"));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching settings from Firestore:", error);
    return null;
  }
}

export async function saveDbSettings(settings: any): Promise<void> {
  try {
    const docRef = doc(db, "settings", "user_config");
    const sanitized = sanitizeForFirestore(settings);
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    console.error("Error saving settings to Firestore:", error);
  }
}

export async function seedDbProjects(projects: Project[]): Promise<void> {
  try {
    for (const project of projects) {
      await saveDbProject(project);
    }
  } catch (error) {
    console.error("Error seeding initial projects to Firestore:", error);
  }
}
