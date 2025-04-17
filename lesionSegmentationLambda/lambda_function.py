import matplotlib.pyplot as plt
import numpy as np
# import cv2
import json
import io
import boto3
from scipy import ndimage as ndi
from sklearn.cluster import DBSCAN

bucket_name = "balding"

def handler(event, context):
    print("Starting Segmentation...")

    img, imgPath = retrieve_image(event)
    if (img is None):
        return {
            'status': 'False',
            'statusCode': 404,
            'body': json.dumps('Invalid image path provided.')
        }

    image_max = ndi.maximum_filter(-img, size=10, mode='constant')
    image_max = image_max > np.quantile(image_max, 0.8)

    X = np.array(np.nonzero(image_max)).transpose()
    clustering = DBSCAN(eps=10, min_samples=200).fit(X)

    fig, axs = plt.subplots(ncols = 2, sharex = True, sharey = True)
    axs[0].imshow(image_max, cmap=plt.cm.gray)
    clustering.labels_[clustering.labels_ == -1] = max(clustering.labels_)+1
    axs[1].scatter(X[:,1], X[:,0], c = clustering.labels_) 

    plt.title("segmentation")

    plotImg = io.BytesIO()
    plt.savefig(plotImg, format='png')
    if (save_image(plotImg, imgPath)):
        return {
            'status': 'False',
            'statusCode': 400,
            'body': json.dumps('An error occured while uploading segmentation pdf.')
        }

    return {
        'statusCode': 200,
        'body': json.dumps('Segmentation Successful!')
    }

def retrieve_image(event):
    # Extract requested image path
    if ('body' not in event):
        return (None, None)

    request_body_str = event['body']
    request_body = json.loads(request_body_str)
    user_download_img = request_body['img_path']

    if (user_download_img is None):
        return (None, None)

    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name)

    print("Obtained bucket")

    #pass your image Name to key
    obj = bucket.Object(key=user_download_img)
    response = obj.get()
    img_bytes = response[u'Body'].read()

    print("Retrieved Image")

    # Convert image.
    img_bytes_array = np.fromstring(img_bytes, dtype=np.uint8)
    # img_array = cv2.imdecode(img_bytes_array, cv2.IMREAD_COLOR)

    return img_bytes_array, user_download_img

def save_image(img, img_path):
    client = boto3.client('s3')
    uploadPath = img_path[:-4] + '_segmentation.png'

    # _, encoded_img_bytes = cv2.imencode('.png', img)
    encoded_img_bytes = img.tobytes()

    try:
        print("Uploading image at ", uploadPath)
        client.put_object(Bucket=bucket_name, Key=uploadPath, Body=encoded_img_bytes)
    except Exception as e:
        print(f"Exception: {e}")
        return (True)

    print("Uploaded image")
    return (False)