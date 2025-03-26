import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: "AKIAVY2PHBHNZ3CCRHWE", // Replace with your IAM Access Key
  secretAccessKey: "JBCqjT1iDSV+LhyrtVxDYTe0dus+dZw8SeWb3gRa", // Replace with your IAM Secret Key
  region: "us-east-2", // Change to your AWS region
});

const s3 = new AWS.S3();
const S3_BUCKET = "balding"; // Replace with your S3 bucket name

export { s3, S3_BUCKET };
