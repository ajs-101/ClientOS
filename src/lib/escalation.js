import { collection, getDocs, query, where, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "./firebase";

// Checks all non-green, non-red tasks (i.e. yellow/green) whose due date has passed,
// flips them to red, and fires a notification to both the assigned profile and admin.
// Safe to call on every page load — only touches tasks that actually need it.
export async function runOverdueEscalation(orgId, collectionName = "employeeTasks") {
  const todayStr = new Date().toISOString().split("T")[0];
  const q = query(collection(db, collectionName), where("orgId", "==", orgId));
  const snap = await getDocs(q);

  const updates = [];
  snap.docs.forEach((docSnap) => {
    const task = docSnap.data();
    if (!task.dueDate) return;
    if (task.status === "red") return;
    if (task.dueDate >= todayStr) return;

    updates.push(
      updateDoc(doc(db, collectionName, docSnap.id), { status: "red" }).then(() =>
        Promise.all([
          addDoc(collection(db, "notifications"), {
            orgId,
            targetProfile: task.profile,
            type: "overdue",
            message: `"${task.title}" is now overdue and was auto-flagged red.`,
            relatedTaskId: docSnap.id,
            read: false,
            createdAt: new Date().toISOString(),
          }),
          addDoc(collection(db, "notifications"), {
            orgId,
            targetProfile: "admin",
            type: "overdue",
            message: `${task.profile}: "${task.title}" is now overdue and was auto-flagged red.`,
            relatedTaskId: docSnap.id,
            read: false,
            createdAt: new Date().toISOString(),
          }),
          addDoc(collection(db, "activityLog"), {
            orgId,
            profile: task.profile,
            message: `"${task.title}" auto-flagged overdue`,
            createdAt: new Date().toISOString(),
          }),
        ])
      )
    );
  });

  if (updates.length) await Promise.all(updates);
}
