#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os, csv
import numpy as np
import skimage
from skimage import io, filters, color, morphology, segmentation, measure, feature
from sklearn.metrics import jaccard_score
from skimage.color.adapt_rgb import adapt_rgb, each_channel
from scipy import ndimage as ndi
import sys

def evaluate_masks(masked_img_path, mask_gt_path):
    ''' 
    It receives two images, one the predicted mask and the other the ground truth,
    and determines Jaccard Index.

    Args:
    - masked_img_path: The path to the jpg image of the predicted mask.
    - gt_masks_roots (list(str)): The path to the jpg image of the ground truth.
            
    Returns:
    - Mean scorefor the full set.
    '''
    print("running....")
    predicted_mask = io.imread(masked_img_path)
    gt_mask = io.imread(mask_gt_path)
    score = jaccard_score(np.ndarray.flatten(gt_mask),np.ndarray.flatten(predicted_mask), average="micro")
    statement = 'Jaccard Index: '+ str(score) + '!'
    print(statement)
    with open("output.txt", "w") as file:
        file.write(statement + "\n")

if __name__ == "__main__":
  masked_img_path = sys.argv[1]
  mask_gt_path = sys.argv[2]
  evaluate_masks(masked_img_path, mask_gt_path)