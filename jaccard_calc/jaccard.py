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
import statistics

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

    predicted_mask = io.imread(masked_img_path)
    gt_mask = io.imread(mask_gt_path)
    return jaccard_score(np.ndarray.flatten(gt_mask),np.ndarray.flatten(predicted_mask), average="micro")

def evaluate_algorithm(algs, masked_img_paths, mask_gt_path):
    footer = "=========================\n"

    for i in range(len(algs)):
      os.chdir(masked_img_paths[i])

      header = "Testing " + algs[i] + " accuracy:\n=========================\n"

      masks = os.listdir(".")
      scores = []
      for mask in masks:
        scores.append(evaluate_masks(mask, os.path.join(mask_gt_path, mask)))
      
      avg_score = statistics.mean(scores)
      std_dev = statistics.stdev(scores)
      low, high = min(scores), max(scores)
      statement = 'Jaccard Index:'
      statement = '\tAVG:'+ str(avg_score) + '\n'
      statement += '\tSTDDEV: '+ str(std_dev) + '\n'
      statement += '\tLOW: '+ str(low) + '\n'
      statement += '\tHIGH: '+ str(high) + '\n'

      print(header)
      print(statement + "\n")
      print(footer)
      
      os.chdir("..")

if __name__ == "__main__":
  testDir = "./test_data"
  os.chdir(testDir)

  masked_img_paths = ["dr_masks", "wavelet", "dhremoval", "gt_masks"]
  algorithms = ["DullRazor", "Wavelet", "Digital Hair Removal", "ground_truth"]
  mask_gt_path = "../gt_masks"

  evaluate_algorithm(algorithms, masked_img_paths, mask_gt_path)
