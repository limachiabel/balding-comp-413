# -*- coding: utf-8 -*-
"""
Created on Tue Feb 18 11:42:26 2020

@author: Javier Velasquez P.
"""   
import cv2
import os

def drazor(imagePaths: list[str], outputDirectory: str, inputs: dict = {}):
    """
    Args:
        imagePaths - the paths to all the images to create masks on.
        outputDirectory - the path to output all masks
        inputs - a dictionary with desired inputs for used methods. 
            
            Keys should be given as 'MethodName' in the same case as the method
            name.
                ex. 'threshold' for cv2.threshold and 'GaussianBlur' for
                cv2.GaussianBlur.

            Values should be given as an array of same length as the number of
            arguments used in the method signature.
                ex. cv2.getStructuringElement expects an integer and a tuple of
                exactly 2 integers. inputs['getStructuringElement'] should be
                [int, tuple(int)]

    Returns:
        The filepaths of all image masks created.
    """
    #IMAGE ACQUISITION

    #Input image
    # imageDirectory = "../../project/Dermoclean/jaccard_calc/test_data/image_testset"
    # maskDir = "../dr_masks/"
    # os.chdir(imageDirectory)

    # Make sure this directory exists.
    try:
        os.mkdir(outputDirectory)
    except FileExistsError:
        print("DullRazor Mask Directory already exists.")

    imagePaths = os.listdir(".")
    # imagePaths = imagePaths[:5] # limit test set
    outputPaths = []

    for imagePath in imagePaths:
        #Read image
        image=cv2.imread(imagePath,cv2.IMREAD_COLOR)
        #Image cropping
        img = image
        # img=image[30:410,30:560]

        #Gray scale
        grayScale = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

        #Black hat filter

        structElemArgs = [1, (9, 9)]    # Default values
        if 'getStructuringElement' in inputs:
            structElemArgs = inputs['getStructuringElement']

        kernel = cv2.getStructuringElement(structElemArgs[0], structElemArgs[1])
        blackhat = cv2.morphologyEx(grayScale, cv2.MORPH_BLACKHAT, kernel)

        #Gaussian filter

        gaussBlurArgs = [None, (3,3), cv2.BORDER_DEFAULT]
        if 'GaussianBlur' in inputs:
            gaussBlurArgs = inputs['GaussianBlur']

        bhg = cv2.GaussianBlur(blackhat,gaussBlurArgs[1], gaussBlurArgs[2])

        # Binary thresholding (MASK)

        thresholdArgs = [None, 10, 255, cv2.THRESH_BINARY]
        if 'threshold' in inputs:
            thresholdArgs = inputs['threshold']

        # This will generate the actual mask we want to evaluate.
        _,mask = cv2.threshold(bhg,thresholdArgs[1], thresholdArgs[2], thresholdArgs[3])

        #Replace pixels of the mask
        # dst = cv2.inpaint(img,mask,6,cv2.INPAINT_TELEA)

        # #Display images
        # cv2.imshow("Original image",image)
        # #cv2.imshow("Cropped image",img)
        # #cv2.imshow("Gray Scale image",grayScale)
        # #cv2.imshow("Blackhat",blackhat)
        # cv2.imshow("Binary mask",mask)
        # cv2.imshow("Clean image",dst)

        maskPath = (outputDirectory + imagePath)[:-3] + "png"
        outputPaths.append(maskPath)
        # print(maskPath)
        cv2.imwrite(maskPath, mask)

        cv2.waitKey(1)
        cv2.destroyAllWindows()

    return outputPaths