import cv2
import numpy as np
import random
import sys
from mask_generation import generate_bezier_hair_mask, show_mask

colors = {
    'black': (0, 0, 0),
    'dark_brown': (19, 24, 54),
    'medium_brown': (42, 42, 128),
}

def impose_mask(image, mask, hair_color='dark_brown', alpha=0.8):
    mask = mask.astype(np.float32) / 255.0  # Normalize mask to [0, 1]
    mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)  # 3 channels

    colored_hairs = np.full_like(image, colors[hair_color], dtype=np.uint8)

    # Blend colored hairs and original image based on mask value and alpha
    blended = (image * (1 - alpha * mask_3ch) + colored_hairs * (alpha * mask_3ch)).astype(np.uint8)

    return blended

def run():
    image_path = sys.argv[1]
    num_hairs = int(sys.argv[2])
    curvature = float(sys.argv[3])
    hair_color = sys.argv[4]
    alpha = float(sys.argv[5])

    image = cv2.imread(image_path)
    image_width = image.shape[1]
    image_height = image.shape[0]

    mask = generate_bezier_hair_mask(image_width, image_height, num_hairs, curvature)
    # saved_name, was_saved = show_mask(mask, prompt_save=False)
    masked_image = impose_mask(image, mask, hair_color=hair_color, alpha=alpha)
    cv2.imshow('masked_image', masked_image)
    cv2.waitKey(0)
    # if was_saved:
    #     cv2.imwrite(f'../images/output/{saved_name}_imposed.png', masked_image)
    cv2.destroyAllWindows()
    # cv2.imwrite('hair_generation/images/output/masked_image.png', masked_image)

if __name__ == '__main__':
    run()