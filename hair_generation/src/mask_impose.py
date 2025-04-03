import cv2
import numpy as np
import random
from mask_generation import generate_bezier_hair_mask

def impose_mask(image, mask, hair_color=(0, 0, 255)):
    mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)

    colored_hairs = np.full_like(image, hair_color, dtype=np.uint8)

    final_image = np.where(mask_3ch == 255, colored_hairs, image)

    return final_image

if __name__ == '__main__':
    image = cv2.imread('hair_generation/images/base_images/sampleimageagain.png')
    image_width = image.shape[1]
    image_height = image.shape[0]   

    hair_colors = [
        (0, 0, 0),        # Black  
        (19, 24, 54),     # Dark Brown  
        (42, 42, 128),    # Medium Brown  
    ]

    mask = generate_bezier_hair_mask(image_width, image_height, 30, curvature=0.7)
    masked_image = impose_mask(image, mask, hair_color=random.choice(hair_colors))
    cv2.imshow('masked_image', masked_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    cv2.imwrite('hair_generation/images/output/masked_image2.png', masked_image)