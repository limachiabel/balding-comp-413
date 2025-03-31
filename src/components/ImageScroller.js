import { useState, useEffect, useRef } from "react";
import { s3, S3_BUCKET } from "./awsconfig"; // AWS S3 Config
import { Button } from "./ui/button"; 
import { ScrollArea } from "./ui/scroll-area"; 
import { Upload } from "lucide-react";
import lambda from './lambda.js';
import { auth } from "../firebaseConfig";

export default function ImageScroller() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [note, setNote] = useState("");
  const [selectedForLambda, setSelectedForLambda] = useState([]);
  const noteRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        setUserEmail(user.email);

        try {
          const response = await s3.listObjectsV2({
            Bucket: S3_BUCKET,
            Prefix: `${user.email}`
          }).promise();

          const urls = response.Contents?.map(obj =>
            s3.getSignedUrl("getObject", {
              Bucket: S3_BUCKET,
              Key: obj.Key,
              Expires: 60 * 5
            })
          ) || [];

          setImages(urls);
        } catch (error) {
          console.error("Error listing objects:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const uploadImagesToPath = async (event, uploadPath) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedImages = [];

    for (const file of files) {
      const params = {
        Bucket: S3_BUCKET,
        Key: `${uploadPath}/${file.name}`,
        Body: file,
        ContentType: file.type,
      };

      try {
        const { Location } = await s3.upload(params).promise();
        uploadedImages.push(Location);
        console.log("Image uploaded successfully:", Location);
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    setImages((prev) => [...prev, ...uploadedImages]);
    setUploading(false);
  };

  const handleSaveNote = async () => {
    if (!selectedImage || !note) return;

    const url = new URL(selectedImage);
    const imageKey = decodeURIComponent(url.pathname.slice(1));
    const noteKey = imageKey.replace(/\.(jpg|jpeg|png)$/i, ".note.json");
    console.log(imageKey);

    try {
      await s3.upload({
        Bucket: S3_BUCKET,
        Key: noteKey,
        Body: JSON.stringify({ note }),
        ContentType: "application/json"
      }).promise();
      console.log("Note saved to S3 as:", noteKey);
    } catch (err) {
      console.error("Failed to save note to S3:", err);
    }

    setNote("");
    setSelectedImage(null);
  };

  const handleLambda = () => {
    const selectedKeys = selectedForLambda.map(url => {
      const key = new URL(url).pathname.slice(1);
      return decodeURIComponent(key);
    });
    lambda(selectedKeys);
  };

  const toggleImageSelection = (src) => {
    setSelectedForLambda(prev =>
      prev.includes(src) ? prev.filter(item => item !== src) : [...prev, src]
    );
  };

  useEffect(() => {
    if (selectedImage && noteRef.current) {
      noteRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedImage]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      <div style={{ padding: "2rem", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#1d4ed8" }}>🏥 Hospital Image Portal</h1>

        <label style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", backgroundColor: "#3b82f6", color: "white", padding: "0.5rem 1rem", borderRadius: "0.375rem" }}>
          <Upload size={20} />
          {uploading ? "Uploading..." : "Upload for Me"}
          <input
            type="file"
            accept="image/jpeg"
            multiple
            hidden
            onChange={(e) => uploadImagesToPath(e, `${userEmail}`)}
            disabled={uploading}
          />
        </label>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="email"
            placeholder="Recipient email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", width: "250px" }}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              backgroundColor: "#8b5cf6",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem"
            }}
          >
            <Upload size={20} /> Upload to User
            <input
              type="file"
              accept="image/jpeg"
              multiple
              hidden
              onChange={(e) => uploadImagesToPath(e, `${recipientEmail}`)}
              disabled={uploading || !recipientEmail}
            />
          </label>
        </div>

        <Button
          style={{ marginBottom: "1rem", backgroundColor: "#16a34a", color: "white", padding: "0.5rem 1rem", borderRadius: "0.375rem" }}
          onClick={handleLambda}
        >
          Call Lambda on Selected
        </Button>

        <ScrollArea
          style={{
            width: "100%",
            maxWidth: "1024px",
            height: "320px",
            overflowX: "auto",
            whiteSpace: "nowrap",
            border: "1px solid #ccc",
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: "#fff"
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
            {images.map((src, index) => (
              <div
                key={index}
                style={{ cursor: "pointer", minWidth: "300px", padding: "8px", border: selectedForLambda.includes(src) ? "2px solid #2563eb" : "1px solid #ddd", borderRadius: "8px", backgroundColor: "#fafafa" }}
                onClick={() => toggleImageSelection(src)}
              >
                <img
                  src={src}
                  alt={`Uploaded ${index}`}
                  style={{ objectFit: "contain", height: "200px", width: "100%" }}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        {selectedImage && (
          <div ref={noteRef} style={{ marginTop: "1.5rem", backgroundColor: "white", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", width: "100%", maxWidth: "600px" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>Add Note for Image</h3>
            <img src={selectedImage} alt="Selected" style={{ maxWidth: "100%", height: "auto", marginBottom: "1rem" }} />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write your note here..."
              rows={4}
              style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }}
            />
            <div style={{ display: "flex", gap: "1rem" }}>
              <Button onClick={handleSaveNote} style={{ backgroundColor: "#2563eb", color: "white" }}>Save Note</Button>
              <Button onClick={() => setSelectedImage(null)} style={{ backgroundColor: "#9ca3af", color: "white" }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          width: "280px",
          padding: "1.5rem",
          borderLeft: "1px solid #d1d5db",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 6px rgba(0,0,0,0.05)"
        }}
      >
        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>
          👤 Logged in as
        </h3>
        <p style={{ color: "#111827", fontWeight: "500", wordBreak: "break-word" }}>{userEmail}</p>
      </div>
    </div>
  );
}
