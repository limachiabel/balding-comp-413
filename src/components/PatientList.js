
import React, { useState, useEffect } from "react";
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Button } from "./ui/button";

export default function PatientList({
  meEmail,                   
  meUid,                      
  connections,               
  setConnections,             
  selectedConnectionEmail,    
  setSelectedConnectionEmail, 
  loadImages,                 
  role,
}) {
  const [relatedUsers, setRelatedUsers] = useState([]);
  console.log(connections);

  useEffect(() => {
    if (!connections || connections.length === 0) {
      setRelatedUsers([]);
      return;
    }
    (async () => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "in", connections));
      const snap = await getDocs(q);
      setRelatedUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    })();
  }, [connections]);


  const handleAdd = async (role) => {
    const email = prompt(`Enter the new ${role}’s email:`)?.trim().toLowerCase();
    if (!email || email === meEmail.toLowerCase()) return;
  
    try {

      const usersRef = collection(db, "users");
      const q        = query(usersRef, where("email", "==", email));
      const snap     = await getDocs(q);
  
      if (snap.empty) {
        alert(`No user found with email ${email}`);
        return;
      }
  
      const bDoc      = snap.docs[0];
      const userData  = bDoc.data();
  
      if (userData.role !== role) {
        alert(
          `Role mismatch: user ${email} is registered as "${userData.role}", not "${role}".`
        );
        return;
      }
  
      const urefA = doc(db, "users", meUid);
      await updateDoc(urefA, { connections: arrayUnion(email) });
  
      const urefB = doc(db, "users", bDoc.id);
      await updateDoc(urefB, { connections: arrayUnion(meEmail) });
  

      setConnections(cs => Array.from(new Set([...cs, email])));
    } catch (err) {
      console.error("Error adding connection:", err);
      alert("Failed to add connection");
    }
  };
  

  const handleRemove = async (email) => {
    if (!window.confirm(`Remove ${email}?`)) return;
    try {
      const uref = doc(db, "users", meUid);
      await updateDoc(uref, { connections: arrayRemove(email) });
      setConnections(cs => cs.filter(e => e !== email));
      if (selectedConnectionEmail === email) {
        setSelectedConnectionEmail(null);
        loadImages(meEmail);
      }
    } catch (err) {
      console.error("Error removing connection:", err);
      alert("Failed to remove connection");
    }
  };


  const patients = relatedUsers.filter(u => u.role === "patient");
  const doctors  = relatedUsers.filter(u => u.role === "doctor");
  const nurses   = relatedUsers.filter(u => u.role === "nurse");

  const renderGroup = (list, title) => (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {list.map(u => (
          <li
            key={u.email}
            onClick={() => { setSelectedConnectionEmail(u.email); loadImages(u.email + "/" + meEmail); }}
            style={{
              padding: "8px",
              marginBottom: "6px",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: selectedConnectionEmail === u.email ? "#e0e0e0" : "#fff",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              {u.firstName} {u.lastName}
              <br/>
              <small style={{ color: "#555" }}>{u.email}</small>
            </div>
            <button
              onClick={e => { e.stopPropagation(); handleRemove(u.email); }}
              style={{
                background: "transparent",
                border: "none",
                color: "#d11a2a",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              title="Remove"
            >
              ×
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li style={{ color: "#666", fontStyle: "italic" }}>— none —</li>
        )}
      </ul>
    </div>
  );

  return (
    <div
      style={{
        width: 250,
        padding: "1rem",
        background: "#fff",
        borderRight: "1px solid #ccc",
        overflowY: "auto",
        height: "100vh",
      }}
    >
    
      <div style={{ marginBottom: "1rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
        <div style={{ fontSize: "1.1rem" }}>
          Hello, <strong>{meEmail.split("@")[0]}</strong>
        </div>
        {role !== "patient" && (
        <div style={{ margin: "0.5rem 0", color: "#555" }}>
          Manage Connections:
        </div>
        )}
        {role !== "patient" && (
              
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button onClick={() => handleAdd("patient")} size="sm">
                  Add Patient
                </Button>
                <Button onClick={() => handleAdd("doctor")} size="sm">
                  Add Doctor
                </Button>
                <Button onClick={() => handleAdd("nurse")} size="sm">
                  Add Nurse
                </Button>
              </div>
)}

      </div>

    
      {role === "doctor" && (
      <div
        onClick={() => { setSelectedConnectionEmail(null); loadImages(meEmail); }}
        style={{
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: 4,
          marginBottom: "1rem",
          background: selectedConnectionEmail === null ? "#e0e0e0" : "#fff",
          cursor: "pointer",
        }}
      >
        My Uploads
      </div>
)}


      {renderGroup(patients, "Patients")}
      {renderGroup(doctors,  "Doctors")}
      {renderGroup(nurses,   "Nurses")}
    </div>
  );
}
