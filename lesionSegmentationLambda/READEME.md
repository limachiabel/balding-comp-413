How to update:
    1. Make your changes to lambda_function.py
    2. Run in terminal
        `docker buildx build --platform linux/amd64 --provenance=false -t docker-image:test .`
    3. Then, login to an aws account with push to repo permissions with
        `aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 396913740251.dkr.ecr.us-east-2.amazonaws.com`
    4. Run these two commands
        `docker tag docker-image:test 396913740251.dkr.ecr.us-east-2.amazonaws.com/lesion-segmentation:latest`
        `docker push 396913740251.dkr.ecr.us-east-2.amazonaws.com/lesion-segmentation:latest`