export default async function lambda(imagePaths = []) {
  for (const imgPath of imagePaths) {
    try {
      const response = await fetch("https://6rv245iay2fpbxjiujvd3bi36a0kxivh.lambda-url.us-east-2.on.aws/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          img_path: imgPath
        })
      });

      const data = await response.json();
      console.log(`Response for ${imgPath}:`, data);
    } catch (error) {
      console.error(`Error for ${imgPath}:`, error);
    }
  }
}

