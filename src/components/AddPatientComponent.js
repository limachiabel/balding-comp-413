"use client";
import { useState } from "react";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function AddPatientComponent({ doctorEmail }) {
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async () => {
    // Basic validation
    if (!patientName || !patientEmail) return;
    setError("");

    try {
      const doctorRef = doc(db, "doctorPatients", doctorEmail);
      const docSnap = await getDoc(doctorRef);

      if (docSnap.exists()) {
        const patients = docSnap.data().patients || [];

        // Check if a patient with the same email already exists
        const patientExists = patients.some((patient) => patient.email === patientEmail);
        if (!patientExists) {
          setError("Patient does not exist");
          return;
        }

        // Add the new patient using arrayUnion if they don't exist
        await updateDoc(doctorRef, {
          patients: arrayUnion({ name: patientName, email: patientEmail }),
        });
      } else {
        // If no document exists, create one with the new patient
        await setDoc(doctorRef, {
          patients: [{ name: patientName, email: patientEmail }],
        });
      }

      // Clear the form after a successful addition
      setPatientName("");
      setPatientEmail("");
    } catch (err) {
      console.error("❌ Failed to add patient:", err);
      setError("Failed to add patient. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input
        type="text"
        placeholder="Patient Name"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
        style={{ padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
      />
      <input
        type="email"
        placeholder="Patient Email"
        value={patientEmail}
        onChange={(e) => setPatientEmail(e.target.value)}
        style={{ padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
      />
      {error && <span style={{ color: "red" }}>{error}</span>}
      <button
        onClick={handleAdd}
        style={{ backgroundColor: "#2563eb", color: "white", padding: "0.5rem", borderRadius: "4px" }}
      >
        Add Patient
      </button>
    </div>
  );
}
