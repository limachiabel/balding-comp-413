
import { useState, useEffect, useRef } from "react";
import { s3, S3_BUCKET } from "./awsconfig";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Upload, Share } from "lucide-react";
import lambda from "./lambda.js";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import PatientList from "./PatientList";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ImageScroller() {
  const [consentExists, setConsentExists] = useState(false);
  const [imagesByFolder, setImagesByFolder] = useState({});
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState(null);
  const [connections, setConnections] = useState([]);           
  const [selectedPatientEmail, setSelectedPatientEmail] = useState(null);
  const [selectedForLambda, setSelectedForLambda] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [note, setNote] = useState("");
  const [noteDisplay, setNoteDisplay] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [relatedUsers, setRelatedUsers] = useState([]);

  const [selectedConnectionEmail, setSelectedConnectionEmail] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [consentName, setConsentName] = useState("");
  const [consentAgreed, setConsentAgreed] = useState(false);

  
  const noteRef = useRef(null);


  const isDoctor  = role === "doctor";
  const isNurse   = role === "nurse";
  const isPatient = role === "patient";
  const loadImages = async (prefixEmail) => {
    console.log(prefixEmail);
    if (prefixEmail === userEmail) {
      // 1) List both root‐level objects and subfolders under your email
      const resp = await s3.listObjectsV2({
        Bucket:    S3_BUCKET,
        Prefix:    `${userEmail}/`,
        Delimiter: "/",    // gives us resp.Contents (root files) + resp.CommonPrefixes (folders)
      }).promise();
  
      // 2) Start building a map of carousels
      const newMap = {};
  
      // 2a) Any root‐level images
      const rootUrls = (resp.Contents || [])
        .filter(o => /\.(jpe?g|png)$/i.test(o.Key))
        .map(o => s3.getSignedUrl("getObject", {
          Bucket: S3_BUCKET,
          Key:    o.Key,
          Expires: 300,
        }));
      if (rootUrls.length) {
        newMap.root = rootUrls;
      }
  
      // 2b) Now each subfolder under your email
      const folderNames = (resp.CommonPrefixes || []).map(p =>
        p.Prefix.replace(`${userEmail}/`, "").replace(/\/$/, "")
      );
      for (let folder of folderNames) {
        const fResp = await s3.listObjectsV2({
          Bucket: S3_BUCKET,
          Prefix: `${userEmail}/${folder}/`,
        }).promise();
  
        const urls = (fResp.Contents || [])
          .filter(o => /\.(jpe?g|png)$/i.test(o.Key))
          .map(o => s3.getSignedUrl("getObject", {
            Bucket: S3_BUCKET,
            Key:    o.Key,
            Expires: 300,
          }));
  
        if (urls.length) {
          newMap[folder] = urls;
        }
      }
  
      // 3) Apply the map and reset selection state
      setImagesByFolder(newMap);
      setSelectedForLambda([]);
      setSelectedImage(null);
      setNoteDisplay(null);
  
      // 4) Consent check on your email prefix
      try {
        const listResp = await s3.listObjectsV2({
          Bucket: S3_BUCKET,
          Prefix: `${userEmail}/consentform.json`,
        }).promise();
        setConsentExists((listResp.Contents || []).length > 0);
      } catch {
        setConsentExists(false);
      }
      return;
    }
    const resp = await s3
      .listObjectsV2({
        Bucket: S3_BUCKET,
        Prefix: `${prefixEmail}/`,
        Delimiter: "/",
      })
       .promise();

    // extract folder names (strip trailing '/')
    const folderNames = (resp.CommonPrefixes || []).map(p =>
      p.Prefix.replace(`${prefixEmail}/`, "").replace(/\/$/, "")
    );
    console.log(folderNames.length);
    console.log("here");
    const newMap = {};
    // 2️⃣ for each folder, list its images
    for (let folder of folderNames) {
      console.log(folder);
      console.log(prefixEmail);
      const fResp = await s3
        .listObjectsV2({
          Bucket: S3_BUCKET,
          Prefix: `${prefixEmail}/${folder}/`,
        })
        .promise();

      newMap[folder] = (fResp.Contents || [])
        .filter(o => /\.(jpe?g|png)$/i.test(o.Key))
        .map(o =>
          s3.getSignedUrl("getObject", {
            Bucket: S3_BUCKET,
            Key: o.Key,
            Expires: 300,
          })
        );
    }

    setImagesByFolder(newMap);
     // reset selections/notes
    setSelectedForLambda([]);
    setSelectedImage(null);
    setNoteDisplay(null);
    
    const ownerEmail = prefixEmail.split("/")[0];
try {
const listResp = await s3
.listObjectsV2({
  Bucket: S3_BUCKET,
  Prefix: `${ownerEmail}/`,
})
.promise();

// look for exactly ownerEmail/consentform.json
const found = (listResp.Contents || []).some(
(o) => o.Key === `${ownerEmail}/consentform.json`
);
setConsentExists(found);
} catch (err) {
console.error("Failed to list objects for consent check:", err);
setConsentExists(false);
}
  }

  
       
       const handleConsentUpload = async (e) => {
        if (!e.target.files.length || !userEmail) return;
        const f = e.target.files[0];
        const ext = f.name.slice(f.name.lastIndexOf("."));
        const key = `${userEmail}/consentform${ext}`;
        await s3.upload({
          Bucket: S3_BUCKET,
          Key: key,
          Body: f,
          ContentType: f.type,
        }).promise();
        setConsentExists(true);
      };
      

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {

        setConnections([]);
        setUserInfo({});
        setRole(null);
        return;
      }

      setUserEmail(user.email);

    
      (async () => {
        try {
          const uDocRef = doc(db, "users", user.uid);
          const uSnap   = await getDoc(uDocRef);

          if (uSnap.exists()) {
            const data = uSnap.data();
            setUserInfo({ uid: user.uid, ...data });
            setConnections(data.connections || []);
            setRole(data.role || null);
          } else {
   
            setUserInfo({
              uid: user.uid,
              email: user.email,
              role: null,
              connections: [],
            });
            setRole(null);
          }


        } catch (err) {
          console.error("Failed to initialize user data:", err);
        }
      })();
    });

    return () => unsubscribe();
  }, [setConnections, setUserInfo, setRole]);
  useEffect(() => {
    if (!userInfo.uid) return;
    setConnections(userInfo.connections || []);
  }, [userInfo]);  

  


  const handlePatientClick = (email) => {
    setSelectedPatientEmail(email);
    loadImages(email || userEmail);
  };


     const handleUpload = async (e) => {
      if (!e.target.files.length || !userEmail) return;
      
     
   
     const basePrefix = selectedConnectionEmail
       ? `${selectedConnectionEmail}/${userEmail}`
       : userEmail;
      console.log("here");
      console.log(basePrefix);

     const folder = window.prompt("Enter (or create) folder name:");
     if (!folder) return;
  
      for (let f of e.target.files) {

       const dest1 = `${basePrefix}/${folder}/${f.name}`;
           await s3.upload({
             Bucket: S3_BUCKET,
             Key: dest1,
             Body: f,
             ContentType: f.type,
           }).promise();
       
         
           if (basePrefix.includes("/")) {
             const [a, b] = basePrefix.split("/");
             const reciprocal = `${b}/${a}`;
             const dest2 = `${reciprocal}/${folder}/${f.name}`;
             await s3.upload({
               Bucket: S3_BUCKET,
               Key: dest2,
               Body: f,
               ContentType: f.type,
             }).promise();
           }
      }
     
     await loadImages(basePrefix);
    };
 


  const handleShare = async () => {
    console.log("here"
    )
    if (!recipientEmail || !selectedForLambda.length) return;
    const targetFolder = window.prompt("Enter folder name to share into:");
    if (!targetFolder) return;
    if (!recipientEmail || !selectedForLambda.length) return;
 
    
    const dest = `${recipientEmail}/${userEmail}/${targetFolder}`;
    for (let url of selectedForLambda) {
      const key = decodeURIComponent(new URL(url).pathname.slice(1));
      const fileName = key.split("/").pop();
      const base     = key.replace(/\.(jpe?g|png)$/i, "");
      console.log(key);
      await s3.copyObject({
               Bucket: S3_BUCKET,
               CopySource: `${S3_BUCKET}/${key}`,
               Key: `${recipientEmail}/${userEmail}/${targetFolder}/${fileName}`,
             }).promise();
  

      await s3.copyObject({
        Bucket: S3_BUCKET,
        CopySource: `${S3_BUCKET}/${key}`,
        Key: `${userEmail}/${recipientEmail}/${targetFolder}/${fileName}`,
      }).promise();
      const list = await s3.listObjectsV2({
        Bucket: S3_BUCKET,
        Prefix: `${base}.note`,
      }).promise();

      for (let o of list.Contents || []) {
        const noteName = o.Key.split("/").pop();
        await s3.copyObject({
          Bucket:S3_BUCKET,
          CopySource: `${S3_BUCKET}/${o.Key}`,
          Key:        `${dest}/${noteName}`,
        }).promise();
      }
    }
    

    setRecipientEmail("");
    setSelectedForLambda([]);
  };
  


  const handleLambda = async () => {
   
    const keys = selectedForLambda.map(u =>
      decodeURIComponent(new URL(u).pathname.slice(1))
    );
  

    await lambda(keys);
  
    const maskedBucket = "dermoclean-image-segmented";
  

    const sleep = ms => new Promise(r => setTimeout(r, ms));
  


    for (const key of keys) {

      const parts    = key.split("/");
      const filename = parts.pop();            
      const folder   = parts.join("/");        
    
  
      const dotIndex = filename.lastIndexOf(".");
      const base     = filename.slice(0, dotIndex); 
      const ext      = filename.slice(dotIndex);      
    
      
      const segFilename  = `${base}_segmentation${ext}`; 
      const segSourceKey = `${folder}/${segFilename}`;
    
      
      const newFolder  = `${folder}-segmented`;
      const destKey    = `${newFolder}/${filename}`;
    
      console.log(`Copying from masked: ${maskedBucket}/${segSourceKey}`);
      console.log(`Copying into main:  ${S3_BUCKET}/${destKey}`);
      console.log("HEREEEE");
      console.log(destKey);
      await sleep(10000);
      await s3.copyObject({
        Bucket:     S3_BUCKET,
        CopySource: `${maskedBucket}/${segSourceKey}`, 
        Key:        destKey,
      })
        .promise()
        .then(() => {
          console.log(`Copied masked ${segSourceKey} → ${destKey}`);
        })
        .catch(err => {
          console.error(
            `❌ Failed to copy masked ${segSourceKey} → ${destKey}:`,
            err
          );
        });
      
    }
    const prefix = selectedConnectionEmail
      ? `${selectedConnectionEmail}/${userEmail}`
      : userEmail;
  
    await loadImages(prefix);
  };
  
  

  async function fetchNote(url) {
    try {

      const key  = decodeURIComponent(new URL(url).pathname.slice(1));
      const base = key.replace(/\.(jpe?g|png)$/i, "");

      const listResp = await s3
        .listObjectsV2({
          Bucket: S3_BUCKET,
          Prefix: `${base}.note`,
        })
        .promise();
  
      const noteKeys = (listResp.Contents || [])
        .map(o => o.Key)
        .sort(); 
      const notes = await Promise.all(
        noteKeys.map(async k => {
          const obj = await s3
            .getObject({ Bucket: S3_BUCKET, Key: k })
            .promise();
          return JSON.parse(obj.Body.toString());
        })
      );
  

      setNoteDisplay(notes);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNoteDisplay([]);
    }
  }
  
    
     async function handleSaveNote() {
      if (!selectedImage || !note) return;
    

      const imgKey = decodeURIComponent(new URL(selectedImage).pathname.slice(1));
      const base   = imgKey.replace(/\.(jpe?g|png)$/i, "");
    
     
      const list = await s3
        .listObjectsV2({ Bucket: S3_BUCKET, Prefix: `${base}.note` })
        .promise();
      const existing = (list.Contents || []).map(o =>
        parseInt(o.Key.match(/\.note(\d+)\.json$/)?.[1] || "0", 10)
      );
      const next = existing.length ? Math.max(...existing) + 1 : 1;
    

      const payload = JSON.stringify({
        email: userEmail,
        note,
        date:  new Date().toISOString()
      });
    
      
      const noteKey = `${base}.note${next}.json`;
      await s3.upload({
        Bucket: S3_BUCKET,
        Key:    noteKey,
        Body:   payload,
        ContentType: "application/json",
      }).promise();
    
      const parts = base.split("/");
      if (parts.length >= 2) {
        const [a, b, ...rest] = parts;
        const reciprocalBase  = [b, a, ...rest].join("/");
        const reciprocalKey   = `${reciprocalBase}.note${next}.json`;
    
        await s3.upload({
          Bucket: S3_BUCKET,
          Key:    reciprocalKey,
          Body:   payload,
          ContentType: "application/json",
        }).promise();
      }
    
      
      setNote("");
      fetchNote(selectedImage);
    }
    
    

  
  const toggleSelect = (url) =>
    setSelectedForLambda((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  const handleDoubleClick = (url) => {
    setSelectedImage(url);
    fetchNote(url);
  };

  useEffect(() => {
    if (selectedImage && noteRef.current) {
      noteRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedImage]);

  useEffect(() => {
    if (connections.length === 0) {
      setRelatedUsers([]);
      return;
    }
    (async () => {
      const q = query(
        collection(db, "users"),
        where("email", "in", connections)
      );
      const snap = await getDocs(q);
      setRelatedUsers(snap.docs.map((d) => d.data()));
    })();
  }, [connections]);
  const selectedConnectionUser = relatedUsers.find(
      (u) => u.email === selectedConnectionEmail
  )
  
  return (
    <div style={{ display: "flex", height: "100vh" }}>
    <div style={{ width: 280, borderRight: "1px solid #ccc", background: "#fff" }}>
      <PatientList
        meEmail={userEmail}
        meUid={userInfo.uid}
        connections={connections}
        setConnections={setConnections}
        selectedConnectionEmail={selectedConnectionEmail}
        setSelectedConnectionEmail={setSelectedConnectionEmail}
        loadImages={loadImages}
        role={role} 
      />
    </div>

    
    <div style={{ flex: 1, padding: 16, background: "#f3f4f6", overflowY: "auto" }}>
      <h1>🏥 Hospital Image Portal</h1>

     
{isPatient && !consentExists && (
  <div style={{
    margin: "1rem 0",
    padding: 16,
    background: "#fffbeb",
    border: "1px solid #facc15",
    borderRadius: 4,
    maxWidth: 600
  }}>
    <h3>Consent Form</h3>
    <p>
      By typing your name below and checking “I agree,” you consent to sharing your medical images with your doctor.
    </p>
    <input
      type="text"
      placeholder="Type your full name"
      value={consentName}
      onChange={e => setConsentName(e.target.value)}
      style={{
        width: "100%",
        padding: 8,
        marginBottom: 8,
        borderRadius: 4,
        border: "1px solid #ccc"
      }}
    />
    <label style={{ display: "block", marginBottom: 12 }}>
      <input
        type="checkbox"
        checked={consentAgreed}
        onChange={e => setConsentAgreed(e.target.checked)}
        style={{ marginRight: 8 }}
      />
      I, {consentName || "__________"}, agree to share my images.
    </label>
    <Button
      onClick={async () => {
        if (!consentName.trim() || !consentAgreed) {
          return alert("Please type your name and check the box.");
        }
        const payload = JSON.stringify({
          name: consentName,
          date: new Date().toISOString()
        });
        await s3.upload({
          Bucket: S3_BUCKET,
          Key: `${userEmail}/consentform.json`,
          Body: payload,
          ContentType: "application/json"
        }).promise();
        setConsentExists(true);
      }}
      disabled={!consentName.trim() || !consentAgreed}
    >
      Submit Consent
    </Button>
  </div>
)}


 
 {selectedConnectionEmail
   && isDoctor
   && selectedConnectionUser?.role === "patient"
   && !consentExists && (
   <div style={{ margin: "1rem 0", color: "#b00" }}>
     🚫 Patient has not uploaded a consent form yet.
   </div>
 )}


   
      {(isDoctor || isNurse) && (
        <div style={{ margin: "1rem 0", display: "flex", gap: 12 }}>
          <label
            style={{
              background: "#3b82f6",
              color: "#fff",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              borderRadius: 4,
            }}
          >
            <Upload size={16} /> Upload
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleUpload}
            />
          </label>

    

  {isDoctor && (
                (
                  selectedConnectionUser?.role !== "patient"
                  || consentExists
                ) && (
                  <>
                    <input
                      type="email"
                      placeholder="Recipient email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      style={{ padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                    />
                    <Button onClick={handleShare}>Share</Button>
                  </>
                )
              )}
     

              {isDoctor && (
                <Button onClick={handleLambda}>Run Segmentation</Button>
              )}
              </div>
       )}

        {Object.entries(imagesByFolder).map(([folder, urls]) => (
          <div key={folder} style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0.5rem 0" }}>{folder || "(root)"}</h3>
            <ScrollArea
              style={{
                height: 200,
                overflowX: "auto",
                whiteSpace: "nowrap",
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            >
              {urls.map((url, i) => (
                <div
                  key={i}
                  onClick={() => toggleSelect(url)}
                  onDoubleClick={() => handleDoubleClick(url)}
                  style={{
                    display: "inline-block",
                    marginRight: 16,
                    padding: 8,
                    border: selectedForLambda.includes(url)
                      ? "2px solid #2563eb"
                      : "1px solid #ddd",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={url}
                    alt={`img-${i}`}
                    style={{ height: 160, width: 260, objectFit: "contain" }}
                  />
                </div>
              ))}
            </ScrollArea>
          </div>
        ))}


        {selectedImage && (isDoctor || isNurse) && (
          <div
            ref={noteRef}
            style={{
              marginTop: 24,
              background: "#fff",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #ccc",
              maxWidth: 600,
            }}
          >
            <h3>Add Note</h3>
            <img
              src={selectedImage}
              alt="selected"
              style={{ maxWidth: "100%", marginBottom: 12 }}
            />
            {noteDisplay && (
              <div style={{ marginBottom: 8 }}>
                <strong>{noteDisplay.email}:</strong> {noteDisplay.note}
              </div>
            )}
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                marginBottom: 8,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={handleSaveNote}>Save Note</Button>
              <Button
                onClick={() => setSelectedImage(null)}
                style={{ background: "#9ca3af" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

   
        {selectedImage && noteDisplay && (
          <div style={{ marginTop:24, }}>
          {noteDisplay.map((n,i) => (
            <div key={i} style={{ marginBottom:8 }}>
              <strong>{n.email}</strong> <em>({new Date(n.date).toLocaleString()})</em>: {n.note}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
