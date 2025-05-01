import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
import json
import io
import boto3
import sys
from scipy import ndimage as ndi
from sklearn.cluster import DBSCAN
from skimage.segmentation import find_boundaries

from urllib.parse import unquote


trigger_bucket_name = "dermoclean-image-masked"
upload_bucket_name = "dermoclean-image-segmented"

def handler(event, context):
    print("Starting Segmentation...")

    print(event)

    print(context)

    img, imgPath = retrieve_image(event)
    if (img is None):
        return {
            'status': 'False',
            'statusCode': 404,
            'body': json.dumps('Invalid image path provided.')
        }

    grayscale = img[:, :, 0]
    image_max = ndi.maximum_filter(-grayscale, size=10, mode='constant')
    image_max = image_max > np.quantile(image_max, 0.8)

    X = np.array(np.nonzero(image_max)).transpose()
    clustering = DBSCAN(eps=10, min_samples=200).fit(X)

    labels = clustering.labels_
    labels[labels == -1] = max(labels) + 1

    mask = np.zeros(grayscale.shape, dtype=int)
    mask[X[:, 0], X[:, 1]] = labels + 1

    border = find_boundaries(mask, mode='outer')

    outlined_img = img.copy()
    outlined_img[border] = [255, 0, 0]

    # plt.title("segmentation")

    # plotImg = io.BytesIO()
    # plt.savefig(plotImg, format='png')
    if (save_image(outlined_img, imgPath)):
        return {
            'status': 'False',
            'statusCode': 400,
            'body': json.dumps('An error occured while uploading segmentation pdf.')
        }

    return {
        'statusCode': 200,
        'body': json.dumps('Segmentation Successful!')
    }

def bytes_to_ndarray(bytes):
    bytes_io = bytearray(bytes)
    img = Image.open(io.BytesIO(bytes_io))
    return np.array(img)

def retrieve_image(event):
    # Extract requested image path
    user_download_img = None

    if ('body' in event):
        request_body_str = event['body']
        request_body = json.loads(request_body_str)
        user_download_img = request_body['img_path']
    elif ('Records' in event):
        record_array = event['Records']
        print(record_array)
        print(type(record_array))
        user_download_img = record_array[0]['s3']['object']['key']

    if (user_download_img is None):
        return (None, None)

    user_download_img = unquote(user_download_img)

    s3 = boto3.resource('s3')
    bucket = s3.Bucket(trigger_bucket_name)

    print(f"Obtained bucket {trigger_bucket_name}")
    print(f"Looking for object {user_download_img}")

    #pass your image Name to key
    obj = bucket.Object(key=user_download_img)
    response = obj.get()
    img_bytes = response[u'Body'].read()

    print("Retrieved Image")

    # Convert image.
    img_array = bytes_to_ndarray(img_bytes)

    return img_array, user_download_img

def save_image(img, img_path):
    client = boto3.client('s3')
    uploadPath = img_path[:-4] + '_segmentation.jpg'

    image = Image.fromarray(np.uint8(img), 'RGB')
    encoded_img_bytes = io.BytesIO()
    image.save(encoded_img_bytes, format='JPEG')

    try:
        print("Uploading image at ", uploadPath)
        client.put_object(Bucket=upload_bucket_name, Key=uploadPath, Body=encoded_img_bytes.getvalue())
    except Exception as e:
        print(f"Exception: {e}")
        return (True)

    print("Uploaded image")
    return (False)