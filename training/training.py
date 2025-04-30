#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hair Removal and Neural Network Training for Dermoscopic Images
Author: Based on original code by Javier Velasquez P.
"""

import os
import glob
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.layers import Input, Conv2D, MaxPooling2D, UpSampling2D, concatenate
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

# =====================================================================
# DULL RAZOR IMPLEMENTATION (TRADITIONAL METHOD)
# =====================================================================

def apply_dull_razor(image):
    """
    Apply the DullRazor hair removal algorithm to an image.
    
    Args:
        image: Input RGB image
        
    Returns:
        dst: Image with hair removed
        mask: Binary mask of detected hair
    """
    # Gray scale
    grayScale = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    # Black hat filter
    # The blackhat operation extracts dark structures (like hair) against a light background
    kernel = cv2.getStructuringElement(1, (9, 9))  # Structuring element with shape adapted to hair shape
    blackhat = cv2.morphologyEx(grayScale, cv2.MORPH_BLACKHAT, kernel)
    
    # Gaussian filter to reduce noise
    bhg = cv2.GaussianBlur(blackhat, (3, 3), cv2.BORDER_DEFAULT)
    
    # Binary thresholding to create hair mask
    ret, mask = cv2.threshold(bhg, 10, 255, cv2.THRESH_BINARY)
    
    # Inpaint (fill in) the hair regions using the TELEA algorithm
    # This replaces the hair pixels with nearby skin texture
    dst = cv2.inpaint(image, mask, 6, cv2.INPAINT_TELEA)
    
    return dst, mask

# =====================================================================
# DATA PREPARATION UTILITIES
# =====================================================================

def load_train_data(data_dir, img_size=(384, 384)):
    """
    Load training data from the directory structure.
    
    Args:
        data_dir: Base directory containing hairy_images and clean_images folders
        img_size: Target size for the images
        
    Returns:
        X: Array of input images (with hair)
        y: Array of target images (without hair)
    """
    hairy_dir = os.path.join(data_dir, 'hairy_images')
    clean_dir = os.path.join(data_dir, 'clean_images')
    
    # Get all hairy image paths
    hairy_paths = glob.glob(os.path.join(hairy_dir, '*.png')) + \
                 glob.glob(os.path.join(hairy_dir, '*.jpg'))
    
    X = []  # Input images (with hair)
    y = []  # Target images (clean)
    
    for hairy_path in hairy_paths:
        # Extract base name to find corresponding clean image
        # MODIFY THIS PART to match your naming convention
        filename = os.path.basename(hairy_path)
        
        # Example: If your hairy image is "ISIC_0001_synthetic.jpg" 
        # and clean image is "ISIC_0001.jpg"
        base_name = filename.split('_synthetic')[0]  # Adjust this split pattern
        
        # Find the clean image
        clean_path_candidates = glob.glob(os.path.join(clean_dir, f"{base_name}.*"))
        if not clean_path_candidates:
            print(f"Warning: No clean image found for {filename}")
            continue
            
        clean_path = clean_path_candidates[0]
        
        # Read images
        hairy_img = cv2.imread(hairy_path)
        clean_img = cv2.imread(clean_path)
        
        if hairy_img is None or clean_img is None:
            continue
            
        # Resize images
        hairy_img = cv2.resize(hairy_img, img_size)
        clean_img = cv2.resize(clean_img, img_size)
        
        # Normalize pixel values to [0, 1]
        hairy_img = hairy_img.astype('float32') / 255.0
        clean_img = clean_img.astype('float32') / 255.0
        
        X.append(hairy_img)
        y.append(clean_img)
    
    return np.array(X), np.array(y)

# =====================================================================
# NEURAL NETWORK MODEL
# =====================================================================

def build_unet_model(input_size=(384, 384, 3)):
    """
    Build a U-Net model for hair removal.
    
    Args:
        input_size: Input shape (height, width, channels)
        
    Returns:
        model: Compiled Keras model
    """
    inputs = Input(input_size)
    
    # Encoder (downsampling) path
    conv1 = Conv2D(64, 3, activation='relu', padding='same')(inputs)
    conv1 = Conv2D(64, 3, activation='relu', padding='same')(conv1)
    pool1 = MaxPooling2D(pool_size=(2, 2))(conv1)
    
    conv2 = Conv2D(128, 3, activation='relu', padding='same')(pool1)
    conv2 = Conv2D(128, 3, activation='relu', padding='same')(conv2)
    pool2 = MaxPooling2D(pool_size=(2, 2))(conv2)
    
    conv3 = Conv2D(256, 3, activation='relu', padding='same')(pool2)
    conv3 = Conv2D(256, 3, activation='relu', padding='same')(conv3)
    pool3 = MaxPooling2D(pool_size=(2, 2))(conv3)
    
    # Bottom
    conv4 = Conv2D(512, 3, activation='relu', padding='same')(pool3)
    conv4 = Conv2D(512, 3, activation='relu', padding='same')(conv4)
    
    # Decoder (upsampling) path with skip connections
    up5 = concatenate([UpSampling2D(size=(2, 2))(conv4), conv3], axis=3)
    conv5 = Conv2D(256, 3, activation='relu', padding='same')(up5)
    conv5 = Conv2D(256, 3, activation='relu', padding='same')(conv5)
    
    up6 = concatenate([UpSampling2D(size=(2, 2))(conv5), conv2], axis=3)
    conv6 = Conv2D(128, 3, activation='relu', padding='same')(up6)
    conv6 = Conv2D(128, 3, activation='relu', padding='same')(conv6)
    
    up7 = concatenate([UpSampling2D(size=(2, 2))(conv6), conv1], axis=3)
    conv7 = Conv2D(64, 3, activation='relu', padding='same')(up7)
    conv7 = Conv2D(64, 3, activation='relu', padding='same')(conv7)
    
    # Output layer - produces a clean image with the same shape as input
    outputs = Conv2D(3, 1, activation='sigmoid')(conv7)
    
    model = Model(inputs=[inputs], outputs=[outputs])
    model.compile(optimizer=Adam(learning_rate=1e-4), loss='mean_squared_error', metrics=['mae'])
    
    return model

# =====================================================================
# TRAINING FUNCTIONS
# =====================================================================

def train_hair_removal_model(data_dir, model_path='hair_removal_model.h5', epochs=50, batch_size=8):
    """
    Train the hair removal model with the provided dataset.
    
    Args:
        data_dir: Directory containing the training data
        model_path: Path to save the trained model
        epochs: Number of training epochs
        batch_size: Batch size for training
        
    Returns:
        history: Training history
        model: Trained model
    """
    # Load training data
    print("Loading training data...")
    X, y = load_train_data(data_dir)
    
    if len(X) == 0:
        print("No training data found. Please generate data first.")
        return None, None
    
    print(f"Loaded {len(X)} training samples")
    
    # Split into training and validation sets
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Build the model
    print("Building model...")
    input_shape = X[0].shape
    model = build_unet_model(input_shape)
    model.summary()
    
    # Set up callbacks
    model_checkpoint = ModelCheckpoint(model_path, monitor='val_loss', 
                                      save_best_only=True, mode='min')
    early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
    
    # Train the model
    print("Training model...")
    history = model.fit(
        X_train, y_train,
        batch_size=batch_size,
        epochs=epochs,
        validation_data=(X_val, y_val),
        callbacks=[model_checkpoint, early_stopping]
    )
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Loss')
    plt.xlabel('Epoch')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['mae'], label='Training MAE')
    plt.plot(history.history['val_mae'], label='Validation MAE')
    plt.title('Mean Absolute Error')
    plt.xlabel('Epoch')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.show()
    
    print(f"Model saved to {model_path}")
    return history, model

# =====================================================================
# INFERENCE FUNCTIONS
# =====================================================================

def remove_hair_traditional(image_path, show_results=True):
    """
    Apply traditional DullRazor method to remove hair from an image.
    
    Args:
        image_path: Path to input image
        show_results: Whether to display results
        
    Returns:
        clean_img: Image with hair removed
    """
    # Read image
    image = cv2.imread(image_path, cv2.IMREAD_COLOR)
    
    if image is None:
        print(f"Could not read image: {image_path}")
        return None
    
    # Apply DullRazor
    clean_img, hair_mask = apply_dull_razor(image)
    
    if show_results:
        # Display results
        plt.figure(figsize=(15, 5))
        
        plt.subplot(1, 3, 1)
        plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        plt.title('Original Image')
        plt.axis('off')
        
        plt.subplot(1, 3, 2)
        plt.imshow(hair_mask, cmap='gray')
        plt.title('Hair Mask')
        plt.axis('off')
        
        plt.subplot(1, 3, 3)
        plt.imshow(cv2.cvtColor(clean_img, cv2.COLOR_BGR2RGB))
        plt.title('Hair Removed (DullRazor)')
        plt.axis('off')
        
        plt.tight_layout()
        plt.show()
    
    return clean_img

def remove_hair_neural_network(image_path, model_path, show_results=True, compare_with_traditional=True):
    """
    Apply trained neural network to remove hair from an image.
    
    Args:
        image_path: Path to input image
        model_path: Path to trained model
        show_results: Whether to display results
        compare_with_traditional: Whether to compare with traditional method
        
    Returns:
        nn_result: Image with hair removed by neural network
    """
    # Load the model
    try:
        model = load_model(model_path)
    except:
        print(f"Could not load model from {model_path}")
        return None
    
    # Read image
    image = cv2.imread(image_path, cv2.IMREAD_COLOR)
    
    if image is None:
        print(f"Could not read image: {image_path}")
        return None
    
    # Preprocess image
    img_resized = cv2.resize(image, (384, 384))
    img_normalized = img_resized.astype('float32') / 255.0
    img_batch = np.expand_dims(img_normalized, axis=0)
    
    # Use the model to remove hair
    prediction = model.predict(img_batch)[0]
    
    # Convert prediction back to uint8 format
    nn_result = (prediction * 255.0).astype(np.uint8)
    
    if show_results:
        if compare_with_traditional:
            # Apply traditional method for comparison
            traditional_result, hair_mask = apply_dull_razor(img_resized)
            
            # Display comparison
            plt.figure(figsize=(20, 5))
            
            plt.subplot(1, 4, 1)
            plt.imshow(cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB))
            plt.title('Original Image')
            plt.axis('off')
            
            plt.subplot(1, 4, 2)
            plt.imshow(hair_mask, cmap='gray')
            plt.title('Hair Mask (DullRazor)')
            plt.axis('off')
            
            plt.subplot(1, 4, 3)
            plt.imshow(cv2.cvtColor(traditional_result, cv2.COLOR_BGR2RGB))
            plt.title('Hair Removed (DullRazor)')
            plt.axis('off')
            
            plt.subplot(1, 4, 4)
            plt.imshow(cv2.cvtColor(nn_result, cv2.COLOR_BGR2RGB))
            plt.title('Hair Removed (Neural Network)')
            plt.axis('off')
        else:
            # Display only neural network results
            plt.figure(figsize=(10, 5))
            
            plt.subplot(1, 2, 1)
            plt.imshow(cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB))
            plt.title('Original Image')
            plt.axis('off')
            
            plt.subplot(1, 2, 2)
            plt.imshow(cv2.cvtColor(nn_result, cv2.COLOR_BGR2RGB))
            plt.title('Hair Removed (Neural Network)')
            plt.axis('off')
        
        plt.tight_layout()
        plt.show()
    
    return nn_result

# =====================================================================
# MAIN EXECUTION
# =====================================================================

def main():
    """
    Main function to demonstrate the hair removal system.
    """
    print("Dermoscopic Hair Removal System")
    print("===============================")
    print("\nOptions:")
    print("1. Train hair removal model")
    print("2. Apply traditional DullRazor to an image")
    print("3. Apply neural network model to an image")
    print("4. Compare both methods on an image")
    print("5. Exit")
    
    choice = input("\nEnter your choice (1-5): ")
    
    if choice == '1':
        data_dir = input("Enter path to data directory (containing 'hairy_images' and 'clean_images' folders): ")
        model_path = input("Enter path to save model (default: hair_removal_model.h5): ") or "hair_removal_model.h5"
        epochs = int(input("Enter number of epochs (default: 50): ") or "50")
        batch_size = int(input("Enter batch size (default: 8): ") or "8")
        
        if os.path.exists(data_dir):
            train_hair_removal_model(data_dir, model_path, epochs, batch_size)
        else:
            print(f"Directory not found: {data_dir}")
            
    elif choice == '2':
        image_path = input("Enter path to image: ")
        if os.path.exists(image_path):
            remove_hair_traditional(image_path)
        else:
            print(f"File not found: {image_path}")
            
    elif choice == '3':
        image_path = input("Enter path to image: ")
        model_path = input("Enter path to model (default: hair_removal_model.h5): ") or "hair_removal_model.h5"
        
        if os.path.exists(image_path) and os.path.exists(model_path):
            remove_hair_neural_network(image_path, model_path, compare_with_traditional=False)
        else:
            if not os.path.exists(image_path):
                print(f"File not found: {image_path}")
            if not os.path.exists(model_path):
                print(f"Model not found: {model_path}")
            
    elif choice == '4':
        image_path = input("Enter path to image: ")
        model_path = input("Enter path to model (default: hair_removal_model.h5): ") or "hair_removal_model.h5"
        
        if os.path.exists(image_path) and os.path.exists(model_path):
            remove_hair_neural_network(image_path, model_path)
        else:
            if not os.path.exists(image_path):
                print(f"File not found: {image_path}")
            if not os.path.exists(model_path):
                print(f"Model not found: {model_path}")
            
    elif choice == '5':
        print("Exiting program")
        return
        
    else:
        print("Invalid choice")

if __name__ == "__main__":
    main()