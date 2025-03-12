import cv2
import numpy as np
from mask_generation import generate_bezier_hair_mask

def impose_mask(image, mask):
    # convert image to grayscale 
    # gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # invert the mask
    mask_inv = cv2.bitwise_not(mask)
    # cv2.imshow('mask_inv', mask_inv)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    # # apply the mask to the image
    masked_image = cv2.bitwise_and(image, image, mask=mask_inv)
    return masked_image

if __name__ == '__main__':
    image = cv2.imread('hair_generation/images/base_images/sampleimageagain.png')
    image_width = image.shape[1]
    image_height = image.shape[0]
    mask = generate_bezier_hair_mask(image_width, image_height, 25)
    masked_image = impose_mask(image, mask)
    cv2.imshow('masked_image', masked_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    cv2.imwrite('hair_generation/images/output/masked_image2.png', masked_image)