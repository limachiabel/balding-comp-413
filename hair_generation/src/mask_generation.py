import numpy as np
import cv2
import random


# generate a bezier curve
def bezier_curve(p0, p1, p2, t):
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2

def generate_bezier_hair_mask(width=512, height=512, num_hairs=200, curvature=0.5):
    mask = np.zeros((height, width), dtype=np.uint8)

    border_points = np.array([[0, i] for i in np.arange(0, height)] + 
                             [[i, 0] for i in np.arange(0, width)] +
                             [[width-1, i] for i in np.arange(0, height)] +
                             [[i, height-1] for i in np.arange(0, width)]
                             )
    
    for _ in range(num_hairs):
        p0 = random.choice(border_points)
        p2 = np.array([random.randint(0, width), random.randint(0, height)])

        mid = (p0 + p2) / 2
        
        direction = np.array([p2[1] - p0[1], p0[0] - p2[0]])  
        direction = direction / np.linalg.norm(direction)
        
        offset = curvature * np.linalg.norm(p2 - p0) * direction
        
        p1 = mid + offset  

        curve_points = np.array([bezier_curve(p0, p1, p2, t).astype(int) for t in np.linspace(0, 1, 100)])

        curve_points = curve_points[(curve_points[:, 0] >= 0) & (curve_points[:, 0] < width) &
                                    (curve_points[:, 1] >= 0) & (curve_points[:, 1] < height)]

        curve_points = curve_points.reshape((-1, 1, 2))

        thickness = random.randint(1, 3)
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




