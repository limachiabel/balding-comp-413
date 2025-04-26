
import React from "react";
import { Button } from "./ui/button";

export default function UserTabsSidebar({
  currentUser,
  relatedUsers,     
  selectedGroup,    
  onGroupSelect,
  onAddConnection,   
}) {
  return (
    <div style={{
      width: 280, padding: "1rem", background: "#fff",
      borderRight: "1px solid #ccc", overflowY: "auto"
    }}>
      {currentUser && (
        <div style={{ marginBottom: "1rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
          <div style={{ fontSize: "1.1rem" }}>
            Hello, <strong>{currentUser.firstName} {currentUser.lastName}</strong>
          </div>
          <div style={{ color: "#555", marginBottom: 8 }}>
            Role: {currentUser.role}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button onClick={() => {
              const email=prompt("Patient email?");
              if (email) onAddConnection(email);
            }}>Add Patient</Button>
            <Button onClick={() => {
              const email=prompt("Doctor email?");
              if (email) onAddConnection(email);
            }}>Add Doctor</Button>
          </div>
        </div>
      )}


      <div
        onClick={() => onGroupSelect({ type: "Uploads" })}
        style={{
          padding: "0.75rem", marginBottom: "1rem",
          borderRadius: 4, cursor: "pointer",
          backgroundColor: selectedGroup.type==="Uploads" ? "#e0e0e0":"transparent",
          border: "1px solid #ccc"
        }}
      >
        My Uploads
      </div>


      <div>
        <div style={{ marginBottom: "0.5rem", fontWeight: "600" }}>Connections</div>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {relatedUsers.length === 0 && (
            <li style={{ color: "#666" }}>— none —</li>
          )}
          {relatedUsers.map((u) => (
            <li
              key={u.email}
              onClick={() => onGroupSelect({ type: "conn", user: u })}
              style={{
                padding: "0.5rem", marginBottom: "0.25rem",
                cursor: "pointer",
                backgroundColor:
                  selectedGroup.type==="conn" && selectedGroup.user.email===u.email
                  ? "#e0e0e0":"transparent",
                border: "1px solid #ccc",
                borderRadius: 4
              }}
            >
              {u.firstName} {u.lastName} <span style={{ color:"#555",fontSize:"0.8rem" }}>
                ({u.role})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
