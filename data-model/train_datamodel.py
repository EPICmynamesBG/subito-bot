import sys
import csv
import pickle
from time import time
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import Pipeline
from sklearn import metrics

class SoupDefinition:
    def __init__(self, soup, is_soup):
        self.soup = soup
        self.is_soup = is_soup.upper() == 'TRUE'
    def __str__(self):
        return '{\n  soup: %s,\n  is_soup: %s\n}' % (self.soup, self.is_soup)

if (len(sys.argv) != 3):
    print('This script requires two args: train_file, test_file')
    sys.exit(1)

training_data_file = sys.argv[1]
test_data_file = sys.argv[2]

def read_data(file):
    data = []
    with open(file) as csvfile:
        reader = csv.reader(csvfile, delimiter=',')
        headers = []
        for index, row in enumerate(reader):
            if index == 0:
                continue # skip headers
            else:
                obj = SoupDefinition(row[0], row[1])
                data.append(obj)
    return data

def map_soup_defs (soup_defs):
    y = []
    x = []
    for soup_def in soup_defs:
        y.append(int(soup_def.is_soup))
        x.append(soup_def.soup)
    return [y, x]


def train(soup_defs):
    train_mapped = map_soup_defs(soup_defs)
    y_train = train_mapped[0]
    x_train = train_mapped[1]

    t0 = time()
    text_clf = Pipeline([('vect', CountVectorizer()),
        ('tfidf', TfidfTransformer()),
        ('clf', SGDClassifier(loss='hinge', penalty='l2',
            alpha=1e-3, random_state=42,
            max_iter=5, tol=None)),
    ])
    text_clf.fit(x_train, y_train)
    train_time = time() - t0
    print("train time: %0.3fs" % train_time)
    return text_clf

def test(model, soup_defs):
    test_mapped = map_soup_defs(soup_defs)
    y_test = test_mapped[0]
    x_test = test_mapped[1]
    predicted = model.predict(x_test)
    print(metrics.classification_report(y_test, predicted,
        target_names=['is_soup', 'is_not_soup']))

def save(model):
    model_file = open('model.pkl', 'wb')
    pickle.dump(model, model_file)

def query_yes_no(question, default="yes"):
    """Ask a yes/no question via raw_input() and return their answer.

    "question" is a string that is presented to the user.
    "default" is the presumed answer if the user just hits <Enter>.
        It must be "yes" (the default), "no" or None (meaning
        an answer is required of the user).

    The "answer" return value is True for "yes" or False for "no".
    """
    valid = {"yes": True, "y": True, "ye": True,
             "no": False, "n": False}
    if default is None:
        prompt = " [y/n] "
    elif default == "yes":
        prompt = " [Y/n] "
    elif default == "no":
        prompt = " [y/N] "
    else:
        raise ValueError("invalid default answer: '%s'" % default)

    while True:
        sys.stdout.write(question + prompt)
        choice = raw_input().lower()
        if default is not None and choice == '':
            return valid[default]
        elif choice in valid:
            return valid[choice]
        else:
            sys.stdout.write("Please respond with 'yes' or 'no' "
                             "(or 'y' or 'n').\n")


train_data = read_data(training_data_file)
test_data = read_data(test_data_file)

model = train(train_data)
test(model, test_data)

if (query_yes_no('Save model?')):
    save(model)
    print("Saved")
