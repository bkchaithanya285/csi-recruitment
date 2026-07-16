"use server";

import { adminDb } from "./firebaseAdmin";
import admin from "firebase-admin";

/**
 * Checks if a registration number already exists in the Applicants collection.
 * @param {string} regNo 
 * @returns {Promise<boolean>}
 */
export async function checkRegistrationExists(regNo) {
  if (!regNo || !adminDb) return false;
  try {
    const querySnapshot = await adminDb.collection("Applicants")
      .where("registrationNumber", "==", regNo.trim().toUpperCase())
      .get();
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking registration number:", error);
    return false;
  }
}

/**
 * Checks if an email already exists in the Applicants collection.
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
export async function checkEmailExists(email) {
  if (!email || !adminDb) return false;
  try {
    const querySnapshot = await adminDb.collection("Applicants")
      .where("email", "==", email.trim().toLowerCase())
      .get();
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking email address:", error);
    return false;
  }
}

/**
 * Submits a new applicant.
 * @param {object} data 
 * @returns {Promise<any>}
 */
export async function submitApplicant(data) {
  if (!adminDb) {
    throw new Error("Database not initialized");
  }
  
  const payload = {
    name: data.name.trim(),
    registrationNumber: data.registrationNumber.trim().toUpperCase(),
    year: data.year,
    department: data.department,
    section: data.section.trim().toUpperCase(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    priority1: data.priorities[0] || "",
    priority2: data.priorities[1] || "",
    priority3: data.priorities[2] || "",
    status: "pending",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  const docRef = await adminDb.collection("Applicants").add(payload);


  return { id: docRef.id };
}

/**
 * Retrieves all applicants from the Applicants collection (Server Action).
 * @returns {Promise<Array>}
 */
export async function getApplicants() {
  if (!adminDb) return [];
  try {
    const snapshot = await adminDb.collection("Applicants")
      .orderBy("timestamp", "desc")
      .get();
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        registrationNumber: data.registrationNumber || "",
        year: data.year || "",
        department: data.department || "",
        section: data.section || "",
        email: data.email || "",
        phone: data.phone || "",
        priority1: data.priority1 || "",
        priority2: data.priority2 || "",
        priority3: data.priority3 || "",
        status: data.status || "pending",
        approvedRole: data.approvedRole || "",
        timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().getTime() : new Date(data.timestamp).getTime()) : null,
      };
    });
  } catch (error) {
    console.error("Error getting applicants:", error);
    return [];
  }
}

/**
 * Updates an applicant's review status (Server Action).
 * @param {string} id 
 * @param {string} newStatus 
 * @returns {Promise<object>}
 */
export async function updateApplicantStatus(id, newStatus) {
  if (!adminDb) throw new Error("Database not initialized");
  try {
    await adminDb.collection("Applicants").doc(id).update({ status: newStatus });
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
}

/**
 * Approves an applicant with a specific role, then sends the appointment email (Server Action).
 * @param {string} id 
 * @param {string} role 
 * @returns {Promise<object>}
 */
export async function approveApplicantWithRole(id, role) {
  if (!adminDb) throw new Error("Database not initialized");
  try {
    const docRef = adminDb.collection("Applicants").doc(id);
    await docRef.update({
      status: "approved",
      approvedRole: role
    });

    return { success: true };
  } catch (error) {
    console.error("Error in approveApplicantWithRole:", error);
    throw error;
  }
}

/**
 * Deletes an applicant record (Server Action).
 * @param {string} id 
 * @returns {Promise<object>}
 */
export async function deleteApplicant(id) {
  if (!adminDb) throw new Error("Database not initialized");
  try {
    await adminDb.collection("Applicants").doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting applicant:", error);
    throw error;
  }
}

/**
 * Deletes all applicant records from the Applicants collection in safe batches of 400 (Server Action).
 * @returns {Promise<object>}
 */
export async function deleteAllApplicants() {
  if (!adminDb) throw new Error("Database not initialized");
  try {
    const querySnapshot = await adminDb.collection("Applicants").get();
    const docs = querySnapshot.docs;
    
    // Batch commit operations in chunks of 400
    const batchLimit = 400;
    for (let i = 0; i < docs.length; i += batchLimit) {
      const batch = adminDb.batch();
      const chunk = docs.slice(i, i + batchLimit);
      chunk.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    return { success: true, count: docs.length };
  } catch (error) {
    console.error("Error deleting all applicants:", error);
    throw error;
  }
}

/**
 * Retrieves an applicant by registration number for the public selection checker.
 * Converts timestamp to a serializable ISO string.
 * @param {string} regNo
 * @returns {Promise<object|null>}
 */
export async function getApplicantByRegNumber(regNo) {
  if (!regNo || !adminDb) return null;
  try {
    const querySnapshot = await adminDb.collection("Applicants")
      .where("registrationNumber", "==", regNo.trim().toUpperCase())
      .limit(1)
      .get();
    
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    const serializableData = {
      id: doc.id,
      name: data.name,
      registrationNumber: data.registrationNumber,
      year: data.year,
      department: data.department,
      section: data.section,
      email: data.email,
      phone: data.phone,
      priority1: data.priority1,
      status: data.status,
      approvedRole: data.approvedRole || null,
      timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString()) : null
    };
    return serializableData;
  } catch (error) {
    console.error("Error getting applicant by reg number:", error);
    return null;
  }
}
