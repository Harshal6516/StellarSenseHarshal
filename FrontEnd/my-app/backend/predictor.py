# -*- coding: utf-8 -*-
"""
Created on Sun Feb 16 02:22:20 2025

@author: hp5cd
"""

import tensorflow as tf
import numpy as np
import os
#import pandas as pd
#from PIL import Image
#import os
#import json
#from tqdm.auto import tqdm
#import matplotlib.pyplot as plt
#from sklearn.metrics import confusion_matrix, classification_report
#import seaborn as sns

class SpatialAttention(tf.keras.layers.Layer):
    def __init__(self):
        super(SpatialAttention, self).__init__()
        self.conv = tf.keras.layers.Conv2D(1, 7, padding='same')
        
    def call(self, x):
        avg_out = tf.reduce_mean(x, axis=-1, keepdims=True)
        max_out = tf.reduce_max(x, axis=-1, keepdims=True)
        concat = tf.concat([avg_out, max_out], axis=-1)
        attention = self.conv(concat)
        return tf.sigmoid(attention)

class ChannelAttention(tf.keras.layers.Layer):
    def __init__(self, filters, ratio=16):
        super(ChannelAttention, self).__init__()
        self.avg_pool = tf.keras.layers.GlobalAveragePooling2D()
        self.max_pool = tf.keras.layers.GlobalMaxPooling2D()
        self.dense1 = tf.keras.layers.Dense(filters // ratio, activation='relu')
        self.dense2 = tf.keras.layers.Dense(filters)
        
    def call(self, x):
        avg_out = self.dense2(self.dense1(self.avg_pool(x)))
        max_out = self.dense2(self.dense1(self.max_pool(x)))
        attention = tf.sigmoid(avg_out + max_out)
        return tf.expand_dims(tf.expand_dims(attention, 1), 1)

class TemporalAttention(tf.keras.layers.Layer):
    def __init__(self, units):
        super(TemporalAttention, self).__init__()
        self.dense1 = tf.keras.layers.Dense(units, activation='tanh')
        self.dense2 = tf.keras.layers.Dense(1)
        
    def call(self, x):
        score = self.dense2(self.dense1(x))
        attention_weights = tf.nn.softmax(score, axis=1)
        context = x * attention_weights
        return tf.reduce_sum(context, axis=1), attention_weights

class CNNEncoder(tf.keras.layers.Layer):
    def __init__(self):
        super(CNNEncoder, self).__init__()
        self.conv_layers = [
            tf.keras.layers.Conv2D(64, 3, padding='same'),
            tf.keras.layers.Conv2D(128, 3, padding='same'),
            tf.keras.layers.Conv2D(256, 3, padding='same')
        ]
        self.bn_layers = [
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.BatchNormalization(),
            tf.keras.layers.BatchNormalization()
        ]
        self.pool = tf.keras.layers.MaxPooling2D()
        self.channel_attention = ChannelAttention(256)
        self.spatial_attention = SpatialAttention()
        
    def call(self, x):
        for conv, bn in zip(self.conv_layers, self.bn_layers):
            x = self.pool(tf.nn.relu(bn(conv(x))))
        
        channel_att = self.channel_attention(x)
        x = x * channel_att
        spatial_att = self.spatial_attention(x)
        x = x * spatial_att
        return x

class SDSSMAMLModel(tf.keras.Model):
    def __init__(self, spectral_dim, hidden_size, num_classes):
        super(SDSSMAMLModel, self).__init__()
        self.cnn_encoder = CNNEncoder()
        
        # BiGRU for spectral data
        self.bigru = tf.keras.layers.Bidirectional(
            tf.keras.layers.GRU(hidden_size, return_sequences=True)
        )
        self.temporal_attention = TemporalAttention(hidden_size * 2)
        
        # Fusion layers
        self.fusion = tf.keras.Sequential([
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(num_classes, activation='softmax')
        ])
        
    def call(self, inputs):
        images, spectral = inputs
        
        # Process images
        cnn_features = self.cnn_encoder(images)
        cnn_features = tf.reshape(cnn_features, [tf.shape(images)[0], -1])
        
        # Process spectral data
        spectral = tf.expand_dims(spectral, axis=1)  # Add sequence dimension
        spectral = tf.tile(spectral, [1, 5, 1])  # Repeat for temporal processing
        gru_output = self.bigru(spectral)
        gru_features, _ = self.temporal_attention(gru_output)
        
        # Combine features
        combined = tf.concat([cnn_features, gru_features], axis=1)
        output = self.fusion(combined)
        
        return output

@tf.keras.utils.register_keras_serializable()
class SDSSMAMLModel(tf.keras.Model):
    def __init__(self, spectral_dim=10, hidden_size=128, num_classes=3, **kwargs):
        super(SDSSMAMLModel, self).__init__(**kwargs)
        self.spectral_dim = spectral_dim
        self.hidden_size = hidden_size
        self.num_classes = num_classes
        
        # Initialize layers in init
        self.cnn_encoder = CNNEncoder()
        self.bigru = tf.keras.layers.Bidirectional(
            tf.keras.layers.GRU(hidden_size, return_sequences=True)
        )
        self.temporal_attention = TemporalAttention(hidden_size * 2)
        self.fusion = tf.keras.Sequential([
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(num_classes, activation='softmax')
        ])
        
    def call(self, inputs):
        images, spectral = inputs
        
        cnn_features = self.cnn_encoder(images)
        cnn_features = tf.reshape(cnn_features, [tf.shape(images)[0], -1])
        
        spectral = tf.expand_dims(spectral, axis=1)
        spectral = tf.tile(spectral, [1, 5, 1])
        gru_output = self.bigru(spectral)
        gru_features, _ = self.temporal_attention(gru_output)
        
        combined = tf.concat([cnn_features, gru_features], axis=1)
        output = self.fusion(combined)
        
        return output
    
    def get_config(self):
        config = super(SDSSMAMLModel, self).get_config()
        config.update({
            "spectral_dim": self.spectral_dim,
            "hidden_size": self.hidden_size,
            "num_classes": self.num_classes,
        })
        return config
    
    @classmethod
    def from_config(cls, config):
        # Extract the model-specific parameters
        spectral_dim = config.pop('spectral_dim', 10)
        hidden_size = config.pop('hidden_size', 128)
        num_classes = config.pop('num_classes', 3)
        
        # Create a new instance
        model = cls(
            spectral_dim=spectral_dim,
            hidden_size=hidden_size,
            num_classes=num_classes,
            **config
        )
        
        return model

# Alternative loading approach using saved weights
def load_model_weights(model_path):
    """
    Load a model by creating a new instance and loading weights
    
    Args:
        model_path (str): Path to the saved model weights
    
    Returns:
        SDSSMAMLModel: Initialized model with loaded weights
    """
    # Create a new model instance
    model = SDSSMAMLModel()
    
    # Create dummy inputs to build the model
    dummy_image = tf.zeros((1, 64, 64, 3))
    dummy_spectral = tf.zeros((1, 10))
    _ = model([dummy_image, dummy_spectral])
    
    # Load the weights
    model.load_weights(model_path)
    return model

class SDSSPredictor:
    def __init__(self, model_path, use_weights=True):
        """
        Initialize the predictor with a saved model
        
        Args:
            model_path (str): Path to the saved model or weights
            use_weights (bool): If True, load only weights instead of full model
        """
        if use_weights:
            self.model = load_model_weights(model_path)
        else:
            self.model = tf.keras.models.load_model(
                model_path,
                custom_objects={
                    'SDSSMAMLModel': SDSSMAMLModel,
                    'CNNEncoder': CNNEncoder,
                    'ChannelAttention': ChannelAttention,
                    'SpatialAttention': SpatialAttention,
                    'TemporalAttention': TemporalAttention
                }
            )
        self.class_names = ['disk', 'intermediate', 'elliptical']
    
    def preprocess_image(self, image_path):
        """
        Preprocess an image for model input
        
        Args:
            image_path (str): Path to the image file
        
        Returns:
            numpy.ndarray: Preprocessed image array
        """
        image = tf.keras.preprocessing.image.load_img(
            image_path,
            target_size=(64, 64)
        )
        image = tf.keras.preprocessing.image.img_to_array(image)
        image = image / 255.0  # Normalize to [0,1]
        return image
    
    def preprocess_spectral(self, spectral_data):
        """
        Preprocess spectral data for model input
        
        Args:
            spectral_data (numpy.ndarray): Array of spectral features
                [u, g, r, i, z, gr_color, ri_color, ug_color, petroR50_r, petroR90_r]
        
        Returns:
            numpy.ndarray: Normalized spectral features
        """
        spectral = np.array(spectral_data, dtype=np.float32)
        spectral = (spectral - np.mean(spectral)) / np.std(spectral)
        return spectral
    
    def predict_single(self, image_path, spectral_data):
        """
        Make prediction for a single galaxy
        
        Args:
            image_path (str): Path to the galaxy image
            spectral_data (numpy.ndarray): Array of spectral features
        
        Returns:
            tuple: (predicted_class, confidence_scores)
        """
        try:
            # Preprocess inputs
            image = self.preprocess_image(image_path)
            spectral = self.preprocess_spectral(spectral_data)
            
            # Expand dimensions for batch
            image = np.expand_dims(image, axis=0)
            spectral = np.expand_dims(spectral, axis=0)
            
            # Make prediction
            predictions = self.model([image, spectral])
            predicted_class = self.class_names[np.argmax(predictions[0])]
            confidence_scores = predictions[0].numpy()  # Convert to numpy array
            
            return predicted_class, confidence_scores
            
        except Exception as e:
            print(f"Error during prediction: {str(e)}")
            raise
    
    def predict_batch(self, image_paths, spectral_data_batch):
        """
        Make predictions for a batch of galaxies
        
        Args:
            image_paths (list): List of paths to galaxy images
            spectral_data_batch (numpy.ndarray): Array of spectral features for each galaxy
        
        Returns:
            tuple: (predicted_classes, confidence_scores)
        """
        try:
            # Preprocess images
            images = np.array([self.preprocess_image(path) for path in image_paths])
            
            # Preprocess spectral data
            spectral = np.array([self.preprocess_spectral(data) for data in spectral_data_batch])
            
            # Make predictions
            predictions = self.model([images, spectral])
            predicted_classes = [self.class_names[np.argmax(pred)] for pred in predictions]
            confidence_scores = predictions.numpy()  # Convert to numpy array
            
            return predicted_classes, confidence_scores
            
        except Exception as e:
            print(f"Error during batch prediction: {str(e)}")
            raise

def predict_galaxy(u, g, r, i, z, gr_color, ri_color, ug_color, petroR50_r, petroR90_r):
    # Initialize predictor
    try:
        predictor = SDSSPredictor(r"sdss_maml_model.keras", use_weights=True)
        
        # Example single prediction
        image_path = r"image.jpg"
        
        spectral_data = np.array([u, g, r, i, z, gr_color, ri_color, ug_color, petroR50_r, petroR90_r])
        
        import os

        predicted_class, confidence = predictor.predict_single(image_path, spectral_data)
        
        # Prepare markdown content
        md_content = f"""
        
**Predicted Class:** {predicted_class}  

## Confidence Scores
"""
        
        for class_name, score in zip(predictor.class_names, confidence):
            md_content += f"- **{class_name}:** {score:.4f}\n"
        
        # Save to a markdown file
        output_path = os.path.join(os.getcwd(), "results.md")
        with open(output_path, "w", encoding="utf-8") as md_file:
            md_file.write(md_content)
        
        print(f"Prediction results saved to {output_path}")

            
    except Exception as e:
        print(f"Error in main: {str(e)}")
        raise

predict_galaxy(1.2, 2.3, 3.4, 4.5, 5.6, 1.1, 0.9, 0.8, 2.5, 5.0)