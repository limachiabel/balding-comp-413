export default async function lambda() {
        const response = await fetch("https://6rv245iay2fpbxjiujvd3bi36a0kxivh.lambda-url.us-east-2.on.aws/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({'img_path': 'uploads/image_0001.jpg'})
        });
      
        const data = await response.json();
        console.log(data);
      }