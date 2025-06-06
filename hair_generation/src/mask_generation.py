import numpy as np
import cv2
import random


# generate a bezier curve
def bezier_curve(p0, p1, p2, t):
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2

def add_gaussian_noise(mask, mean=0, std=10):
    noise = np.random.normal(mean, std, mask.shape).astype(np.int16)
    noisy_mask = np.clip(mask.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return noisy_mask

def generate_bezier_hair_mask(width=512, height=512, num_hairs=200, curvature_mean=0.5, noise_factor=0.1):
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
        
        curvature =  np.random.normal(curvature_mean, 0.1)
        # print (f"curvature: {curvature}")
        offset = curvature * np.linalg.norm(p2 - p0) * direction
        p1 = mid + offset  

        curve_points = np.array([bezier_curve(p0, p1, p2, t).astype(int) for t in np.linspace(0, 1, 100)])

        curve_points = curve_points[(curve_points[:, 0] >= 0) & (curve_points[:, 0] < width) &
                                    (curve_points[:, 1] >= 0) & (curve_points[:, 1] < height)]

        curve_points = curve_points.reshape((-1, 1, 2))

        # Hair root simulation
        thickness = random.randint(1,2)
        fade_fraction = 0.05  # only first 5% will fade
        fade_length = int(len(curve_points) * fade_fraction)

        for i in range(len(curve_points) - 1):
            start_point = tuple(curve_points[i][0])
            end_point = tuple(curve_points[i + 1][0])

            if i < fade_length:
                intensity = int(80 + (175 * i / fade_length))
            else:
                intensity = 255

            intensity = int(np.clip(intensity, 0, 255))
            if i / len(curve_points) < 0.05 and thickness > 1:
                cv2.line(mask, start_point, end_point, color=(intensity,), thickness=thickness+1)
            else:
                cv2.line(mask, start_point, end_point, color=(intensity,), thickness=thickness)

    mask = add_gaussian_noise(mask, mean=noise_factor, std=0.1) 
    return mask

# mask = generate_bezier_hair_mask(1024, 1024, 10)

def show_mask(mask, prompt_save=False):
    cv2.imshow('hair_mask', mask)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    saved_name = "null"
    choice = ''
    if prompt_save:
        save = input('Save mask? (y/n): ')
        choice = save.lower()
        if choice == 'y':
            filename = input('Enter filename: ')
            cv2.imwrite(f'../images/masks/{filename}.png', mask)
            print('Mask saved successfully!')
    if prompt_save and choice == 'y':
        saved_name = filename
    return saved_name, choice == 'y'

if __name__ == '__main__':
    mask = generate_bezier_hair_mask(241, 177, 10)
    show_mask(mask, prompt_save=True)




