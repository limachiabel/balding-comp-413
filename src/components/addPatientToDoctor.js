"use client";
import { useState } from "react";
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function AddPatientToDoctor({ doctorEmail }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleAdd = async () => {
    try {
      const doctorRef = doc(db, "doctorPatients", doctorEmail);
      const docSnap = await getDoc(doctorRef);
      if (docSnap.exists()) {
        await updateDoc(doctorRef, {
          patients: arrayUnion({ name, email }),
        });
      } else {
        await setDoc(doctorRef, {
          patients: [{ name, email }],
        });
      }
      setName("");
      setEmail("");
    } catch (err) {
      console.error("❌ Failed to add patient:", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <input placeholder="Patient Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Patient Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button onClick={handleAdd}>Add Patient</button>
    </div>
  );
}
