import cv2
import numpy as np
import random
import sys
from mask_generation import generate_bezier_hair_mask

colors = {
    'black': (0, 0, 0),
    'dark_brown': (19, 24, 54),
    'medium_brown': (42, 42, 128),
}

def impose_mask(image, mask, hair_color='dark_brown', alpha=0.5):
    mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)

    colored_hairs = np.full_like(image, colors[hair_color], dtype=np.uint8)

    # blend the colored hairs with the original image
    colored_hairs = cv2.addWeighted(colored_hairs, alpha, image, 1 - alpha, 0)

    final_image = np.where(mask_3ch == 255, colored_hairs, image)

    return final_image

def run():
    image_path = sys.argv[1]
    num_hairs = int(sys.argv[2])
    curvature = float(sys.argv[3])
    hair_color = sys.argv[4]

    image = cv2.imread(image_path)
    image_width = image.shape[1]
    image_height = image.shape[0]

    mask = generate_bezier_hair_mask(image_width, image_height, num_hairs, curvature)
    masked_image = impose_mask(image, mask, hair_color=hair_color)
    cv2.imshow('masked_image', masked_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    cv2.imwrite('hair_generation/images/output/masked_image.png', masked_image)

if __name__ == '__main__':
    # image = cv2.imread('hair_generation/images/base_images/sampleimageagain.png')
    # image_width = image.shape[1]
    # image_height = image.shape[0]   

    # mask = generate_bezier_hair_mask(image_width, image_height, 30, curvature=0.3)
    # masked_image = impose_mask(image, mask, hair_color=random.choice(hair_colors))
    # cv2.imshow('masked_image', masked_image)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()
    # cv2.imwrite('hair_generation/images/output/masked_image2.png', masked_image)
    run()