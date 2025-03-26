import { useState } from "react";
import { s3, S3_BUCKET } from "./awsconfig"; // AWS S3 Config
import { Button } from "./ui/button"; 
import { Card, CardContent } from "./ui/card"; 
import { ScrollArea } from "./ui/scroll-area"; 
import { Upload } from "lucide-react";

export default function ImageScroller() {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    setUploading(true);

    const uploadedImages = [];

    for (const file of files) {
      const params = {
        Bucket: S3_BUCKET,
        Key: `uploads/${file.name}`, // File path in S3
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

  return (
    <div className="p-6 flex flex-col items-center">
      {/* Upload Button */}
      <label className="mb-4 flex items-center gap-2 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md">
        <Upload size={20} />
        {uploading ? "Uploading..." : "Upload Images"}
        <input type="file" accept="image/jpeg" multiple hidden onChange={handleImageUpload} disabled={uploading} />
      </label>

      {/* Scrollable Image Gallery */}
      <ScrollArea 
        style={{
          width: "100%",
          maxWidth: "1024px",
          height: "320px",
          overflowX: "auto",
          whiteSpace: "nowrap",
          border: "1px solid #ccc",
          padding: "16px",
          borderRadius: "8px"
        }}
      >
        <div 
          style={{
            display: "flex",
            flexDirection: "row", 
            gap: "16px",
          }}
        >
          {images.map((src, index) => (
            <Card 
              key={index} 
              style={{ minWidth: "300px", height: "100%", flexShrink: 0 }}
            >
              <CardContent style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                <img src={src} alt={`Uploaded ${index}`} style={{ objectFit: "contain", height: "200px", width: "200px" }} />
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
