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
import re

BASE_SCORE = 38.33259


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

def evaluate_algorithm(trialName, mask_gt_path, resultsFile):
    footer = "=========================\n"
    bestScore = -1
    bestScoring = ""

    for i in range(len(trialName)):
      os.chdir(trialName[i])

      header = "Testing " + trialName[i] + " accuracy:\n=========================\n"

      masks = os.listdir(".")
      scores = []
      for mask in masks:
        if (not mask.endswith(".png")):
           continue

        scores.append(evaluate_masks(mask, os.path.join(mask_gt_path, mask)))

      avg_score = statistics.mean(scores) * 100
      std_dev = statistics.stdev(scores) * 100
      low, high = min(scores), max(scores) * 100

      if avg_score > bestScore:
         bestScore = avg_score
         bestScoring = trialName[i]

      avg_score = round(avg_score, 5)
      std_dev = round(std_dev, 5)
      low = round(low, 5)
      high = round(high, 5)

      statement = 'Jaccard Index:'
      statement = '\tAVG: '+ str(avg_score) + '\n'
      statement += '\tSTDDEV: '+ str(std_dev) + '\n'
      statement += '\tLOW: '+ str(low) + '\n'
      statement += '\tHIGH: '+ str(high) + '\n'

      resultsFile.write(header)
      resultsFile.write(statement + "\n")
      resultsFile.write(footer)
      
      os.chdir("..")

    epilogue = f"Final Score:\n\t{bestScore} - {bestScoring}"
    resultsFile.write(epilogue)

def remove_matching_strings(string_list, regex_pattern):
    """
    Removes all strings from a list that match a given regular expression.

    Args:
        string_list: A list of strings.
        regex_pattern: The regular expression pattern to match.

    Returns:
        A new list with the strings that match the regex removed.
    """
    return [s for s in string_list if not re.search(regex_pattern, s)]

if __name__ == "__main__":
  testDir = "./test_data/dr_trials"
  os.chdir(testDir)

  resultsFile = "results.txt"
  file = open(resultsFile, "w")

  mask_trials = os.listdir(".")
  mask_trials = remove_matching_strings(mask_trials, r"\w*.txt\b")
  mask_trials = sorted(mask_trials, key=lambda x: int(x.split('-')[1]))

  print(mask_trials)
  mask_gt_path = "../../gt_masks"

  evaluate_algorithm(mask_trials, mask_gt_path, file)

  file.close()