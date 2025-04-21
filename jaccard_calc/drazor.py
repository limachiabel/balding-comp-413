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

    imagePaths = os.listdir(".")
    # imagePaths = imagePaths[:5] # limit test set
    outputPaths = []

    for imagePath in imagePaths:
        #Read image
        image=cv2.imread(imagePath,cv2.IMREAD_COLOR)
        #Image cropping
        img = image
        # img=image[30:410,30:560]
        # print(imagePath)

        #Gray scale
        grayScale = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

        #Black hat filter

        structElemArgs = [1, (7, 7)]    # Default values
        if 'getStructuringElement' in inputs:
            structElemArgs = inputs['getStructuringElement']

        kernel = cv2.getStructuringElement(structElemArgs[0], structElemArgs[1])
        blackhat = cv2.morphologyEx(grayScale, cv2.MORPH_BLACKHAT, kernel)

        #Gaussian filter

        gaussBlurArgs = [None, (1,1), cv2.BORDER_DEFAULT]
        if 'GaussianBlur' in inputs:
            gaussBlurArgs = inputs['GaussianBlur']

        bhg = cv2.GaussianBlur(blackhat,gaussBlurArgs[1], gaussBlurArgs[2])

        # Binary thresholding (MASK)

        thresholdArgs = [None, 30, 255, cv2.THRESH_BINARY]
        if 'threshold' in inputs:
            thresholdArgs = inputs['threshold']

        # This will generate the actual mask we want to evaluate.
        _,mask = cv2.threshold(bhg,thresholdArgs[1], thresholdArgs[2], thresholdArgs[3])

        #Replace pixels of the mask
        # dst = cv2.inpaint(img,mask,6,cv2.INPAINT_TELEA)

        maskPath = (outputDirectory + imagePath)[:-3] + "png"
        outputPaths.append(maskPath)
        # print(maskPath)
        cv2.imwrite(maskPath, mask)

        cv2.waitKey(1)
        cv2.destroyAllWindows()

    return outputPaths

if __name__ == "__main__":
    inputs = {}

    imageDirectory = "./test_data/image_testset"
    os.chdir(imageDirectory)
    imagePaths = os.listdir(".")

    trialDirectory = "../dr_trials/"

    for i in range(1):
        vary_i = (2 * i) + 1
        gaussBlur = [None, (vary_i, vary_i), cv2.BORDER_DEFAULT]
        inputs["GaussianBlur"] = gaussBlur

        for j in range(10):
            vary_j = 10 * j
            thresholdArgs = [None, vary_j, 255, cv2.THRESH_BINARY]
            inputs["threshold"] = thresholdArgs

            for k in range(10):
                vary_k = i + 1
                structElem = [1, (vary_k, vary_k)]
                inputs["getStructuringElement"] = structElem

                trialName = f"trial-{i}{j}{k}"
                outputDirectory = trialDirectory + trialName + "/"
                trialInfo = outputDirectory + f"trial-{i}-info.txt"

                try:
                    os.mkdir(outputDirectory)
                except FileExistsError:
                    pass

                try:
                    with open(trialInfo, "x") as file:
                        file.write(trialName + "\n")
                        file.write("Inputs used: \n")
                        file.write(str(inputs))
                except FileExistsError:
                    pass

                drazor(imagePaths, outputDirectory, inputs)
