import numpy as np
import cv2
import random


# generate a bezier curve
def bezier_curve(p0, p1, p2, t):
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2

# gets points from the bezier curve and colors in the points white
def generate_bezier_hair_mask(width=512, height=512, num_hairs=200):
    mask = np.zeros((height, width), dtype=np.uint8)
    # want to start th
    border_points = np.array([[0, i] for i in np.arange(0, height)] + 
                             [[i, 0] for i in np.arange(0, height)] +
                             [[height, i] for i in np.arange(0, width)] +
                             [[i, width] for i in np.arange(0, height)]
                             )
    # np.array([random.randint(0, i), width] for i in np.arange(0, width))
    for _ in range(num_hairs):
        p0 = random.choice(border_points)
        # p0 = np.array([random.randint(0, width), random.randint(0, height)])
        p1 = p0 + np.array([random.randint(-height, height), random.randint(width, width)])
        p2 = p0 + np.array([random.randint(-height, height), random.randint(width, width)])

        curve_points = np.array([bezier_curve(p0, p1, p2, t).astype(int) for t in np.linspace(0, 1, 100)])

        curve_points = curve_points[(curve_points[:, 0] >= 0) & (curve_points[:, 0] < width) &
                                    (curve_points[:, 1] >= 0) & (curve_points[:, 1] < height)]

        curve_points = curve_points.reshape((-1, 1, 2))

        # eventually has to be proportional to the image size
        thickness = random.randint(0,1)
        # cv2.polylines(mask, [curve_points], isClosed=False, color=185, thickness=thickness + 1)
        cv2.polylines(mask, [curve_points], isClosed=False, color=255, thickness=thickness)
    return mask 

# mask = generate_bezier_hair_mask(1024, 1024, 10)

def show_mask(mask, prompt_save=False):
    cv2.imshow('hair_mask', mask)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    if prompt_save:
        save = input('Save mask? (y/n): ')
        if save.lower() == 'y':
            filename = input('Enter filename: ')
            cv2.imwrite(f'hair_generation/images/masks/{filename}.png', mask)
            print('Mask saved successfully!')

if __name__ == '__main__':
    mask = generate_bezier_hair_mask(241, 177, 10)
    show_mask(mask, prompt_save=True)




