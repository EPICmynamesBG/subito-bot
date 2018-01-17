import os, sys

CONFIG_DIR = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', 'config'))
sys.path.append(CONFIG_DIR)

import csv
import pickle
import mysql.connector
from config import CONFIG
from time import time
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import Pipeline
from sklearn import metrics

c = CONFIG.get_config()

def open_model(model_file_name):
    model_file = open(model_file_name, 'rb')
    return pickle.load(model_file)

sql = mysql.connector.connect(user=c.DATABASE_USER, password=c.DATABASE_PASSWORD,
                              host=c.DATABASE_HOST,
                              database=c.DATABASE_NAME)

model = open_model('model.pkl')
