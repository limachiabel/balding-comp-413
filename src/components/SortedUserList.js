import { useState, useEffect } from "react";
import { s3, S3_BUCKET } from "./awsconfig";
import { db } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function SortedUserList() {
  const [usersWithStatus, setUsersWithStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(usersCollection);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      return users;
    } catch (error) {
      console.error("Error fetching users from Firebase:", error);
      return [];
    }
  };

  const userHasImages = async (userEmail) => {
    try {
      const response = await s3
        .listObjectsV2({ Bucket: S3_BUCKET, Prefix: `${userEmail}/` })
        .promise();
      return (response.Contents || []).some((obj) => obj.Key.endsWith(".jpg"));
    } catch (error) {
      console.error("Error checking images for user", userEmail, error);
      return false;
    }
  };

  const fetchUsersWithImageStatus = async () => {
    setLoading(true);
    const users = await fetchUsers();


    const userPromises = users.map(async (user) => {
      const hasImages = await userHasImages(user.email);
      return { ...user, hasImages };
    });

    const usersWithResult = await Promise.all(userPromises);
    
    usersWithResult.sort((a, b) => {
      if (a.role !== b.role) {
        return a.role.localeCompare(b.role);
      }
      return b.hasImages - a.hasImages; 
    });
    setUsersWithStatus(usersWithResult);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsersWithImageStatus();
  }, []);

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <h1>Sorted Users</h1>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {usersWithStatus.map((user) => (
          <li key={user.id} style={{ padding: "0.5rem", borderBottom: "1px solid #ccc" }}>
            <strong>{user.email}</strong> - {user.role}
            {"  "}
            {user.hasImages ? <span style={{ color: "green" }}>Has Images</span> : <span style={{ color: "red" }}>No Images</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
